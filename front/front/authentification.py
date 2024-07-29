import streamlit as st
import requests

class Auth:
    def __init__(self):
        pass
    
    # Fonction pour s'inscrire
    def register(nom, prenom, sexe, email, password, phone):
        url = ' http://localhost:5000/api/verifyUser/register_user/'
        data = {
            'nom': nom,
            'prenom': prenom,
            'sexe': sexe,
            'email': email,
            'password': password,
            'phone': phone
        }

        try:
            response = requests.post(url, json=data)
            response.raise_for_status()  # Raises HTTPError for bad responses
            return response.json()
        except requests.exceptions.RequestException as e:
            st.error(f"Erreur de connexion : {e}")
            return None

    # Fonction pour se connecter
    def login(email, password):
        url = 'http://localhost:5000/api/verifyUser/login_user/'
        data = {'email': email, 'password': password}
        
        try:
            response = requests.post(url, json=data)
            response.raise_for_status()  # Will raise an HTTPError for bad responses
            return response.json()
        except requests.exceptions.RequestException as e:
            st.error(f"Erreur de connexion : {e}")
            return None

    def main(self,a):
        a += 1
        st.title("PAGE D'AUTHENTIFICATION")

        
    # Utiliser st.session_state pour gérer l'état de connexion
        if 'user' not in st.session_state:
            st.session_state['user'] = None

        if st.session_state['user'] is None:
            # Navigation entre les pages (inscription / connexion)
            page = st.sidebar.radio("Navigation", options=["Inscription", "Connexion"])

            if page == "Inscription":
                st.header("Inscription")

                nom = st.text_input("Nom")
                prenom = st.text_input("Prénom")
                sexe = st.selectbox("Sexe", ["Masculin", "Féminin", "Autre"])
                email = st.text_input("Email")
                password = st.text_input("Mot de passe", type="password")
                phone = st.text_input("Téléphone")

                if st.button("S'inscrire"):
                    if nom and prenom and sexe and email and password and phone:
                        result = register(nom, prenom, sexe, email, password, phone)
                        if result and result.get('success'):
                            st.success("Inscription réussie !")
                            st.info("Redirection vers la page de connexion...")
                            st.experimental_rerun()
                        else:
                            st.error(result.get('message', "Erreur lors de l'inscription. Veuillez réessayer."))
                    else:
                        st.error("Veuillez remplir tous les champs du formulaire.")

            elif page == "Connexion":
                st.header("Connexion")

                email = st.text_input("Email")
                password = st.text_input("Mot de passe", type="password")

                if st.button("Se connecter"):
                    if email and password:
                        result = login(email, password)
                        if result and result.get('success'):
                            st.session_state['user'] = {'nom': result['nom'], 'prenom': result['prenom']}
                            st.experimental_rerun()
                        else:
                            st.error(result.get('message', "Email ou mot de passe incorrect."))
                    else:
                        st.error("Veuillez remplir tous les champs du formulaire.")
        else:
            # Navigation pour l'utilisateur connecté
            page = st.sidebar.radio("Navigation", options=["Bienvenue", "Déconnexion"])

            if page == "Bienvenue":
                st.header("Bienvenue")
                st.write(f"Bonjour, {st.session_state['user']['nom']} {st.session_state['user']['prenom']} !")
            elif page == "Déconnexion":
                st.session_state['user'] = None
                st.experimental_rerun()

if __name__ == "__main__":
    auth = Auth()
    auth.main(1)