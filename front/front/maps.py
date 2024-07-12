import requests
import streamlit as st
import pandas as pd
import altair as alt
from math import radians, cos, sin, asin, sqrt
from datetime import datetime

# Fonction pour obtenir les données depuis l'API avec mise en cache
@st.cache_data
def get_data(api_url):
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Erreur lors de l'appel à l'API: {e}")
        return None

# Fonction pour obtenir les coordonnées géographiques d'une adresse
def get_coordinates(address):
    api_key = '13e7eb7e21f74cd6b4dc0f5ad0fcce30'  # Clé API OpenCage
    url = f'https://api.opencagedata.com/geocode/v1/json?q={address}&key={api_key}&countrycode=fr&limit=1'
    response = requests.get(url)
    data = response.json()
    
    if data['results']:
        latitude = data['results'][0]['geometry']['lat']
        longitude = data['results'][0]['geometry']['lng']
        return latitude, longitude
    else:
        return None, None

# Fonction pour calculer la distance entre deux points géographiques
def haversine(lon1, lat1, lon2, lat2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371
    return c * r

# Fonction pour filtrer les données en fonction des coordonnées et du rayon
def filter_data_by_radius(data, lat, lon, radius):
    filtered_data = []
    for item in data:
        try:
            item_lat = item["formation"]["place"]["latitude"] if "formation" in item else item["place"]["latitude"]
            item_lon = item["formation"]["place"]["longitude"] if "formation" in item else item["place"]["longitude"]
            distance = haversine(lon, lat, item_lon, item_lat)
            if distance <= radius:
                filtered_data.append({
                    "latitude": item_lat,
                    "longitude": item_lon,
                    "name": item["formation"]["title"] if "formation" in item else item["title"],
                    "address": item["formation"]["place"]["fullAddress"] if "formation" in item else item["place"]["fullAddress"],
                    "phone": item["formation"]["contact"]["phone"] if "formation" in item else item["contact"].get("phone", "N/A")
                })
        except KeyError:
            continue
    return pd.DataFrame(filtered_data)

# URLs des APIs
formations_api_url = "http://localhost:5000/api/alternance/collections/formations"
jobs_api_url = "http://localhost:5000/api/alternance/collections/jobs"
effectif_api_url = "http://localhost:5000/api/alternance/collections/EffectifParSpecialite"
metiers_api_url = "https://labonnealternance-recette.apprentissage.beta.gouv.fr/api/v1/metiers/intitule?label="

# Récupérer les données
formations_data = get_data(formations_api_url)
jobs_data = get_data(jobs_api_url)
effectif_data = get_data(effectif_api_url)

# Créer des DataFrames à partir des coordonnées extraites
formations_coordinates = []
jobs_coordinates = []
if formations_data:
    for formation in formations_data:
        try:
            latitude = formation["formation"]["place"]["latitude"]
            longitude = formation["formation"]["place"]["longitude"]
            formations_coordinates.append({"latitude": latitude, "longitude": longitude})
        except KeyError:
            continue
if jobs_data:
    for job in jobs_data:
        try:
            latitude = job["place"]["latitude"]
            longitude = job["place"]["longitude"]
            jobs_coordinates.append({"latitude": latitude, "longitude": longitude})
        except KeyError:
            continue
formations_df = pd.DataFrame(formations_coordinates)
jobs_df = pd.DataFrame(jobs_coordinates)

# DataFrame pour EffectifParSpecialite
effectif_df = pd.DataFrame(effectif_data)

# Fonction pour extraire la date correctement
def extract_date(date):
    try:
        if isinstance(date, dict) and '$date' in date:
            return date['$date']
        elif isinstance(date, str):
            return date
        return None
    except:
        return None

# Convertir la colonne date en datetime et extraire l'année
effectif_df['date'] = pd.to_datetime(effectif_df['date'].apply(extract_date), errors='coerce')
effectif_df['year'] = effectif_df['date'].dt.year

# Sidebar for section selection
st.sidebar.title("Sections")
section = st.sidebar.selectbox("Choisissez une section", ["Cartes des Formations et Offres", "Comparaison des Effectifs", "Orientation"])

# Section 1: Cartes des Formations et Offres
if section == "Cartes des Formations et Offres":
    st.title('Carte des formations et des offres d\'alternance en France')

    st.subheader("Formations et offres d'alternance dans toute la France")
    col1, col2 = st.columns(2)

    with col1:
        st.header("Formations dans toute la France")
        st.map(formations_df, zoom=4, use_container_width=True)

    with col2:
        st.header("Offres d'alternance dans toute la France")
        st.map(jobs_df, zoom=4, use_container_width=True)

    st.subheader("Nombre de formations et d'offres d'alternance")
    data = {
        "Type": ["Formations", "Offres d'alternance"],
        "Nombre": [len(formations_df), len(jobs_df)]
    }
    chart_df = pd.DataFrame(data)
    st.bar_chart(chart_df.set_index("Type"))

    st.subheader("Recherche par adresse et rayon")
    address = st.text_input('Entrez l\'adresse:')
    radius = st.number_input('Entrez le rayon de recherche en km:', min_value=1, max_value=200, value=30)

    if st.button('Obtenir les informations'):
        if address:
            lat, lon = get_coordinates(address)
            if lat and lon:
                st.success(f'Les coordonnées de l\'adresse sont :\nLatitude: {lat}\nLongitude: {lon}')
                
                filtered_formations_df = filter_data_by_radius(formations_data, lat, lon, radius)
                filtered_jobs_df = filter_data_by_radius(jobs_data, lat, lon, radius)

                col3, col4 = st.columns(2)

                if not filtered_formations_df.empty:
                    with col3:
                        st.header(f"Formations dans un rayon de {radius} km autour de {address}")
                        st.map(filtered_formations_df[["latitude", "longitude"]], zoom=10, use_container_width=True)
                else:
                    with col3:
                        st.warning(f"Aucune formation trouvée dans un rayon de {radius} km autour de {address}")

                if not filtered_jobs_df.empty:
                    with col4:
                        st.header(f"Offres d'alternance dans un rayon de {radius} km autour de {address}")
                        st.map(filtered_jobs_df[["latitude", "longitude"]], zoom=10, use_container_width=True)
                else:
                    with col4:
                        st.warning(f"Aucune offre d'alternance trouvée dans un rayon de {radius} km autour de {address}")

                st.subheader(f"Nombre de formations et d'offres d'alternance dans un rayon de {radius} km autour de {address}")
                data_filtered = {
                    "Type": ["Formations", "Offres d'alternance"],
                    "Nombre": [len(filtered_formations_df), len(filtered_jobs_df)]
                }
                chart_filtered_df = pd.DataFrame(data_filtered)
                st.bar_chart(chart_filtered_df.set_index("Type"))

# Section 2: Comparaison des Effectifs
elif section == "Comparaison des Effectifs":
    st.title('Comparaison des Effectifs par Spécialité')

    specialites = effectif_df['lib_long_gpe_spec_3'].unique()
    specialite1 = st.selectbox("Sélectionnez la première spécialité", specialites)
    specialite2 = st.selectbox("Sélectionnez la deuxième spécialité", specialites)

    if st.button("Comparer"):
        df1 = effectif_df[effectif_df['lib_long_gpe_spec_3'] == specialite1]
        df2 = effectif_df[effectif_df['lib_long_gpe_spec_3'] == specialite2]

        df1_grouped = df1.groupby('year')['effectif_de_jeunes'].sum().reset_index()
        df2_grouped = df2.groupby('year')['effectif_de_jeunes'].sum().reset_index()

        chart_data1 = pd.DataFrame({
            'Année': df1_grouped['year'],
            'Effectif': df1_grouped['effectif_de_jeunes'],
            'Spécialité': [specialite1] * len(df1_grouped)
        })

        chart_data2 = pd.DataFrame({
            'Année': df2_grouped['year'],
            'Effectif': df2_grouped['effectif_de_jeunes'],
            'Spécialité': [specialite2] * len(df2_grouped)
        })

        chart_data = pd.concat([chart_data1, chart_data2])

        chart = alt.Chart(chart_data).mark_line().encode(
            x='Année:O',
            y='Effectif:Q',
            color='Spécialité:N',
            tooltip=['Année', 'Spécialité', 'Effectif']
        ).properties(
            width=800,
            height=400
        )

        st.altair_chart(chart)


# Section 3: Orientation
elif section == "Orientation":
    st.title('Trouver des Formations par Métier')

    metier = st.text_input("Entrez le métier recherché:")
    
    if st.button('Rechercher'):
        if metier:
            metiers_api_url_full = metiers_api_url + metier
            metiers_data = get_data(metiers_api_url_full)

            if metiers_data and 'coupleAppellationRomeMetier' in metiers_data:
                code_rome_set = set()
                for item in metiers_data['coupleAppellationRomeMetier']:
                    if 'codeRome' in item and isinstance(item['codeRome'], str):
                        code_rome_set.add(item['codeRome'])

                if code_rome_set:
                    formations_filtered = []
                    for formation in formations_data:
                        try:
                            romes = formation["formation"]["romes"]
                            for rome in romes:
                                if rome["code"] in code_rome_set:
                                    formations_filtered.append({
                                        "title": formation["formation"]["title"],
                                        "address": formation["formation"]["place"]["fullAddress"],
                                        "phone": formation["formation"]["contact"].get("phone", "N/A")
                                    })
                                    break
                        except KeyError:
                            continue

                    if formations_filtered:
                        st.subheader(f"Formations correspondant au métier : {metier}")
                        for formation in formations_filtered:
                            st.write(f"**{formation['title']}**")
                            st.write(f"Adresse: {formation['address']}")
                            st.write(f"Téléphone: {formation['phone']}")
                            st.write("---")
                    else:
                        st.warning(f"Aucune formation trouvée pour le métier : {metier}")
            else:
                st.warning(f"Aucune donnée trouvée pour le métier : {metier}")
        else:
            st.warning('Veuillez entrer un métier.')
