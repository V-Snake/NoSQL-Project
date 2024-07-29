import streamlit as st
import requests
import pandas as pd
import time
import altair as alt
import pydeck as pdk

from region import JobRegion
from agregations import Agreations

from authentification import Auth
from maps2 import AlternanceApp


st.set_page_config(layout="wide")

# Define the introduction page
def intro():
    st.write("# Welcome to Alternance KPI! 👋")
    st.sidebar.success("Select a demo above.")

    st.markdown(
        """
        NoSql project for Altenance.

        **👈 Hello, we use python Streamlit, MongoDB and ExpressJS to show the beneficts of Alternance in France.** 

        ### So what's the plan?

        - Check out our graph of job per region
        - Jump into our observations on the data from 2006 to 2015

        ### Check out the code

        - We use [pyMongo](https://pymongo.readthedocs.io/en/stable/index.html) to connect to a MongoDB database
        - Explore our github repository [here](https://github.com/V-Snake/NoSQL-Project/tree/main)
    """
    )


def main():
    page_names_to_funcs = {
        "—": intro,
        "🎓Show Collections": Agreations().show_input,
        
    }
    demo_name = st.sidebar.selectbox("Choose a demo", page_names_to_funcs.keys())
    page_names_to_funcs[demo_name]()

if __name__ == "__main__":
    main()
