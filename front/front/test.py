import os
import streamlit as st
from pprint import pprint as pp
from rich import print
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import json
import pandas as pd
from dotenv import load_dotenv
<<<<<<< HEAD
import matplotlib.pyplot as plt
import seaborn as sns

=======
>>>>>>> develop

load_dotenv()

USER_CRED = os.getenv("USER_CRED")

uri = 'mongodb+srv://root:root@nosql.saqf8aj.mongodb.net/?retryWrites=true&w=majority&appName=NoSQL'
# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))
db = client['alternance']

class Test():
    def __init__(self):
        pass
    
    def show_input(self):
        
        collections = []
        col1, col2, col3 = st.columns((1, 3, 2))
        
        for collection in db.list_collection_names():
            collections.append(collection)
        
<<<<<<< HEAD
        col1.write("Collections")
        col1.write(pd.DataFrame(collections))
        col2.write("Code ROME")
        col2.write(pd.DataFrame(db.rome.find()))
        pipeline = [
            {"$match": {"emploi_cadre": "O"}},
            {"$group": {"_id": "$code_rome", "count": {"$sum": 1}, "libelle_rome": {"$first": "$libelle_rome"}}},
            {"$sort": {"count": -1}},
            {"$project": {"_id": 0,"code_rome": "$_id", "count": 1, "libelle_rome": 1}},
            {"$sort": {"count": -1}}
        ]
        results = list(db.rome.aggregate(pipeline))
        
        # Flatten the nested JSON structure
        df = pd.json_normalize(results)
        col2.write("Mettier le plus demandé comme cadre")
        col2.write(df)
        pipeline2 = [
            {
                "$match": {
                    "transition_eco": {"$in": ["Emploi Vert", "Emploi stratégique pour la Transition écologique"]}
                }
            },
            {
                "$group": {
                    "_id": "$code_rome",
                    "count": {"$sum": 1},
                    "libelle_rome": {"$first": "$libelle_rome"},
                    "transition_eco": {"$push": "$transition_eco"}
                }
            },
            {
                "$sort": {"count": -1}
            },
            {
                "$project": {
                    "_id": 0,
                    "code_rome": "$_id",
                    "count": 1,
                    "libelle_rome": 1,
                    "transition_eco": 1
                }
            }
        ]
        results = list(db.rome.aggregate(pipeline2))
        df2 = pd.json_normalize(results)
        col3.write("Transition écologique")
        col3.write(df2)
        
        pipeline = [
            {
                "$match": {
                    "transition_eco": {"$in": ["Emploi Vert", "Emploi stratégique pour la Transition écologique"]}
                }
            },
            {
                "$group": {
                    "_id": "$transition_eco",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"count": -1}
            }
        ]

        # Run the aggregation
        results = list(db.rome.aggregate(pipeline))

        # Prepare data for the pie chart
        labels = [result["_id"] for result in results]
        sizes = [result["count"] for result in results]
        total = sum(sizes)
        percentages = [count / total * 100 for count in sizes]

        # Plotting the pie chart
        fig, ax = plt.subplots()
        ax.pie(percentages, labels=labels, autopct='%1.1f%%', startangle=90, colors=['#66b3ff', '#99ff99'])
        ax.axis('equal')  # Equal aspect ratio ensures the pie chart is circular.

        # Title for the chart
        plt.title('Distribution of Emploi Vert and Emploi stratégique pour la Transition écologique')

        # Streamlit display
        st.pyplot(fig)
        
        pipeline = [
            {
                "$match": {
                    "transition_eco": {"$in": ["Emploi Vert", "Emploi stratégique pour la Transition écologique"]}
                }
            },
            {
                "$group": {
                    "_id": {"$substr": ["$code_rome", 0, 1]},
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"count": -1}
            }
        ]

        # Run the aggregation
        results = list(db.rome.aggregate(pipeline))

        # Prepare data for the pie chart
        labels = [result["_id"] for result in results]
        sizes = [result["count"] for result in results]
        total = sum(sizes)
        percentages = [count / total * 100 for count in sizes]

        # Plotting the pie chart
        sns.set(font_scale = 1.2)
        plt.figure(figsize=(8,8))
        fig, ax = plt.subplots()
        ax.pie(
            percentages,
            labels=labels,
            autopct='%1.2f%%',
            colors=sns.color_palette('Set2'),
            startangle=90,
            )
        ax.axis('equal')  # Equal aspect ratio ensures the pie chart is circular.

        # Title for the chart
        plt.title('Distribution des domaines ROME pour la transition.')

        # Streamlit display
        st.pyplot(fig)
=======
        col1.write(pd.DataFrame(collections))
        col2.write(pd.DataFrame(db.rome.find()))
        pipeline = [
            {"$match": {"formation.diplomaLevel": "3 (CAP...)"}},
            {"$unwind": "$romes"},
            {"$limit": 5},
            {"$project": {"_id": 0, "formation": 1}}
        ]
        results = list(db.formations.aggregate(pipeline))
        
        # Flatten the nested JSON structure
        df = pd.json_normalize(results)
        col3.write(df)
>>>>>>> develop
