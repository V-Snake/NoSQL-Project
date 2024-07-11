import os
import streamlit as st
from pprint import pprint as pp
from rich import print
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import json
import pandas as pd
from dotenv import load_dotenv

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
