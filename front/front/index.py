import streamlit as st

def voir_offres():
    st.title("Voir les offres d'alternance")
    st.write("Liste des offres d'alternance disponibles ici.")

def ajouter_offre():
    st.title("Ajouter une offre d'alternance")
    st.write("Formulaire pour ajouter une nouvelle offre d'alternance.")

st.sidebar.title("Navigation")
selection = st.sidebar.radio("Aller à", ["Voir les offres d'alternance", "Ajouter une offre d'alternance"])

if selection == "Voir les offres d'alternance":
    voir_offres()
elif selection == "Ajouter une offre d'alternance":
    ajouter_offre()
