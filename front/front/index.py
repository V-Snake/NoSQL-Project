import streamlit as st
import requests
import pandas as pd
import time
import altair as alt
import pydeck as pdk

# Liste des codes ROME et leurs significations (correctes)
rome_codes = {
    "A": "Agriculture, pêche, forêt, espaces naturels",
    "B": "Arts et façonnage d'ouvrages d'art",
    "C": "Banque, assurance, immobilier",
    "D": "Commerce, vente et grande distribution",
    "E": "Communication, média et multimédia",
    "F": "Construction, bâtiment et travaux publics",
    "G": "Hôtellerie, restauration, tourisme, loisirs et animation",
    "H": "Industrie",
    "I": "Installation et maintenance",
    "J": "Santé",
    "K": "Services à la personne et à la collectivité",
    "L": "Spectacle",
    "M": "Support à l'entreprise",
    "N": "Transport et logistique"
}

# Liste des niveaux de diplôme
diploma_levels = [
    "Non spécifié",
    "3 (CAP...)",
    "4 (BAC...)",
    "5 (BTS, DEUST...)",
    "6 (Licence, BUT...)",
    "7 (Master, titre ingénieur...)"
]

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

# Fonction pour obtenir les informations de l'API "La Bonne Alternance" avec gestion des erreurs et des tentatives
def get_alternance_info(lat, lon, rome_domain, radius, diploma, retries=3):
    diploma_param = '' if diploma == "Non spécifié" else f'&diploma={diploma}'
    url = f'https://labonnealternance-recette.apprentissage.beta.gouv.fr/api/v1/formations?romeDomain={rome_domain}&latitude={lat}&longitude={lon}&radius={radius}{diploma_param}&caller=%20&options=with_description'
    
    for attempt in range(retries):
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            st.warning(f"Problème de connexion, tentative {attempt + 1} sur {retries}. Réessai dans 1 seconde.")
            time.sleep(1)
            if attempt == retries - 1:
                st.error("Échec de la récupération des données après plusieurs tentatives.")
                return None

# Fonction pour compter les offres par domaine ROME et récupérer les coordonnées des offres
def count_offers(lat, lon, radius, selected_diploma):
    rome_counts = {key: 0 for key in rome_codes.keys()}
    all_formations = []
    formation_locations = []
    
    for rome_code in rome_codes.keys():
        alternance_info = get_alternance_info(lat, lon, rome_code, radius, selected_diploma)
        time.sleep(0.2)  # Pause pour respecter la limite d'appels (5 appels par seconde)
        if alternance_info and alternance_info.get('results'):
            rome_counts[rome_code] = len(alternance_info['results'])
            all_formations.extend(alternance_info['results'])
            
            # Récupérer les coordonnées des offres de formation
            for formation in alternance_info['results']:
                if 'place' in formation and formation['place']['latitude'] and formation['place']['longitude']:
                    formation_locations.append({
                        'latitude': formation['place']['latitude'],
                        'longitude': formation['place']['longitude'],
                        'rome_code': rome_code
                    })
    
    return rome_counts, all_formations, formation_locations

# Fonction pour agréger les formations par coordonnée
def aggregate_formations(formation_locations):
    df = pd.DataFrame(formation_locations)
    aggregated = df.groupby(['latitude', 'longitude']).size().reset_index(name='count')
    return aggregated

# Titre de l'application
st.title('Géocodage et Informations sur l\'Alternance en France')

# Formulaire pour entrer l'adresse et le rayon de recherche
address = st.text_input('Entrez l\'adresse:')
radius = st.number_input('Entrez le rayon de recherche en km:', min_value=1, max_value=200, value=30)
selected_diploma = st.selectbox('Sélectionnez le niveau de diplôme:', diploma_levels)

# Bouton pour soumettre le formulaire
if st.button('Obtenir les informations'):
    if address:
        lat, lon = get_coordinates(address)
        if lat and lon:
            st.success(f'Les coordonnées de l\'adresse sont :\nLatitude: {lat}\nLongitude: {lon}')
            # Compter les offres par domaine ROME et récupérer les coordonnées des offres
            rome_counts, all_formations, formation_locations = count_offers(lat, lon, radius, selected_diploma)
            
            if rome_counts:
                # Créer un DataFrame pour les données du graphique
                df = pd.DataFrame(list(rome_counts.items()), columns=['ROME', 'Nombre_offres'])
                df['Libelle'] = df['ROME'].map(rome_codes)
                df = df.set_index('Libelle')

                # Générer le graphique avec Altair
                chart = alt.Chart(df.reset_index()).mark_bar().encode(
                    x=alt.X('Libelle', sort=None, title='Domaine ROME'),
                    y=alt.Y('Nombre_offres', title='Nombre d\'offres'),
                    tooltip=['Libelle', 'Nombre_offres']
                ).properties(
                    title='Nombre d\'offres par domaine ROME',
                    width=800,
                    height=400
                ).configure_axis(
                    labelAngle=-45
                )

                st.altair_chart(chart)

                # Créer un DataFrame pour les coordonnées des formations avec une couleur par code ROME
                location_df = pd.DataFrame(formation_locations)
                location_df['color'] = location_df['rome_code'].apply(lambda x: hash(x) % 255)

                # Générer la carte avec Streamlit
                st.map(location_df[['latitude', 'longitude']])

                # Agréger les formations par coordonnée
                aggregated_df = aggregate_formations(formation_locations)

                # Calculer l'échelle d'élévation
                max_count = aggregated_df['count'].max()
                elevation_scale = 1000 / max_count if max_count else 1

                # Générer la carte avec Pydeck et ajouter de la hauteur
                layer = pdk.Layer(
                    "ColumnLayer",
                    aggregated_df,
                    get_position=["longitude", "latitude"],
                    get_elevation="count",
                    elevation_scale=elevation_scale,
                    get_fill_color="[180, 0, 200, 140]",
                    radius=200,
                    pickable=True,
                    extruded=True,
                )
                view_state = pdk.ViewState(
                    latitude=lat,
                    longitude=lon,
                    zoom=10,
                    pitch=50
                )
                deck = pdk.Deck(
                    layers=[layer],
                    initial_view_state=view_state,
                    tooltip={"text": "Nombre d'offres: {count}"}
                )

                st.pydeck_chart(deck)

        else:
            st.error('Adresse non trouvée. Veuillez vérifier l\'adresse et réessayer.')
    else:
        st.warning('Veuillez entrer une adresse.')
