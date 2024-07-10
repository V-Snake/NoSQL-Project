import streamlit as st
import requests
import pandas as pd
import matplotlib.pyplot as plt
import time

# Liste des codes ROME et leurs significations
rome_codes = {
    "A": "Agriculture, pêche, forêt, espaces naturels",
    "B": "Bâtiment, travaux publics",
    "C": "Commerce, vente",
    "D": "Installation et maintenance",
    "E": "Transport, logistique",
    "F": "Mécanique, travail des métaux",
    "G": "Industrie de process",
    "H": "Electricité, électronique",
    "I": "Informatique, télécommunication",
    "J": "Banque, assurance, immobilier",
    "K": "Gestion, administration des entreprises",
    "L": "Arts, spectacles",
    "M": "Edition, imprimerie, audiovisuel",
    "N": "Enseignement, formation"
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

# Fonction pour obtenir les informations de l'API "La Bonne Alternance"
def get_alternance_info(lat, lon, rome_domain, radius, diploma):
    diploma_param = '' if diploma == "Non spécifié" else f'&diploma={diploma}'
    url = f'https://labonnealternance-recette.apprentissage.beta.gouv.fr/api/v1/formations?romeDomain={rome_domain}&latitude={lat}&longitude={lon}&radius={radius}{diploma_param}&caller=%20&options=with_description'
    response = requests.get(url)
    return response.json()

# Fonction pour compter les offres par domaine ROME
def count_offers(lat, lon, radius, selected_diploma):
    rome_counts = {key: 0 for key in rome_codes.keys()}
    all_formations = []
    for rome_code in rome_codes.keys():
        alternance_info = get_alternance_info(lat, lon, rome_code, radius, selected_diploma)
        time.sleep(0.2)  # Pause pour respecter la limite d'appels (5 appels par seconde)
        if alternance_info and alternance_info.get('results'):
            rome_counts[rome_code] = len(alternance_info['results'])
            all_formations.extend(alternance_info['results'])
    return rome_counts, all_formations

# Titre de l'application
st.title('Géocodage et Informations sur l\'Alternance en France')

# Formulaire pour entrer l'adresse et le rayon de recherche
address = st.text_input('Entrez l\'adresse:')
radius = st.number_input('Entrez le rayon de recherche en km:', min_value=1, max_value=100, value=30)
selected_diploma = st.selectbox('Sélectionnez le niveau de diplôme:', diploma_levels)

# Bouton pour soumettre le formulaire
if st.button('Obtenir les informations'):
    if address:
        lat, lon = get_coordinates(address)
        if lat and lon:
            st.success(f'Les coordonnées de l\'adresse sont :\nLatitude: {lat}\nLongitude: {lon}')
            # Compter les offres par domaine ROME
            rome_counts, all_formations = count_offers(lat, lon, radius, selected_diploma)
            
            # Créer un DataFrame pour les données du graphique
            df = pd.DataFrame(list(rome_counts.items()), columns=['ROME', 'Nombre d\'offres'])
            df = df.sort_values('ROME')

            # Générer le graphique
            plt.figure(figsize=(12, 8))
            plt.bar(df['ROME'], df['Nombre d\'offres'])
            plt.xlabel('Domaine ROME')
            plt.ylabel('Nombre d\'offres')
            plt.title('Nombre d\'offres par domaine ROME')
            plt.xticks(ticks=range(len(rome_codes)), labels=[f"{code}: {rome_codes[code]}" for code in rome_codes.keys()], rotation=90)
            st.pyplot(plt)

            # Afficher les diplômes des formations trouvées
            st.subheader('Diplômes des formations trouvées:')
            for formation in all_formations:
                st.write(f"**Titre:** {formation['title']}")
                st.write(f"**Diplôme:** {formation.get('diploma', 'Non spécifié')}")
                st.write('---')
        else:
            st.error('Adresse non trouvée. Veuillez vérifier l\'adresse et réessayer.')
    else:
        st.warning('Veuillez entrer une adresse.')
