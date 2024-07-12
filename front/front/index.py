import streamlit as st
import requests
import pandas as pd
import time
import altair as alt
import pydeck as pdk

from region import JobRegion
from test import Test


st.set_page_config(layout="wide")

# Define the introduction page
def intro():
<<<<<<< HEAD
    st.write("# Welcome to Alternance KPI! 👋")
=======
    st.write("# Welcome to Streamlit! 👋")
>>>>>>> develop
    st.sidebar.success("Select a demo above.")

    st.markdown(
        """
<<<<<<< HEAD
        NoSql project for Altenance.

        **👈 Hello, we use python Streamlit, MongoDB and ExpressJS to show the beneficts of Alternance in France.** 

        ### So what's the plan?

        - Check out our graph of job per region
        - Jump into our observations on the data from 2006 to 2015

        ### Check out the code

        - We use [pyMongo](https://pymongo.readthedocs.io/en/stable/index.html) to connect to a MongoDB database
        - Explore our github repository [here](https://github.com/V-Snake/NoSQL-Project/tree/main)
=======
        Streamlit is an open-source app framework built specifically for
        Machine Learning and Data Science projects.

        **👈 Select a demo from the dropdown on the left** to see some examples
        of what Streamlit can do!

        ### Want to learn more?

        - Check out [streamlit.io](https://streamlit.io)
        - Jump into our [documentation](https://docs.streamlit.io)
        - Ask a question in our [community
          forums](https://discuss.streamlit.io)

        ### See more complex demos

        - Use a neural net to [analyze the Udacity Self-driving Car Image
          Dataset](https://github.com/streamlit/demo-self-driving)
        - Explore a [New York City rideshare dataset](https://github.com/streamlit/demo-uber-nyc-pickups)
>>>>>>> develop
    """
    )


def main():
    page_names_to_funcs = {
        "—": intro,
<<<<<<< HEAD
        "📊Graph: job per region": JobRegion().get_input,
        "🎓Show Collections": Test().show_input,
=======
        "Graph: job per region": JobRegion().get_input,
        "Show Collections": Test().show_input,
>>>>>>> develop
    }
    demo_name = st.sidebar.selectbox("Choose a demo", page_names_to_funcs.keys())
    page_names_to_funcs[demo_name]()

if __name__ == "__main__":
    main()
