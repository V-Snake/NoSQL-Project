// on importe les paquets et fichiers necessaire pour notre app
// import dotenv from "dotenv";

import mongoose from "mongoose";
import fetch from 'node-fetch';

//Function to use a specific database and display the list of collections in that database
export async function getListDatabaseCollectionController(req, res) {
  try {
    // Get the native MongoDB client from the Mongoose connection
    const db = mongoose.connection.db;
    // Log to ensure we have a valid connection
    // console.log("Current Database:", db.databaseName);

    // List all collections in the alterance database
    const collections = await db.listCollections().toArray();
    // console.log(collections);

    // Send the collections as a response
    res.status(200).json(collections);
  } catch (err) {
    // sinon on retourne le message d'erreur
    res.status(500).json({ message: err.message });
  }
}

// function for specific collection and display its content
export async function getCollectionContents(req, res) {
  try {

    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    const db = mongoose.connection.db;
    const collectionName = req.params.name;

    // Log to ensure we have the correct collection name
    console.log("Requested Collection:", collectionName);

    const collection = db.collection(collectionName);
    const contents = await collection.find({}).toArray();

    // Log the contents to debug
    console.log("Contents:", contents);

    res.status(200).json(contents);
  } catch (err) {
    console.error("Error fetching collection contents:", err);
    res.status(500).json({ message: err.message });
  }
}


export async function postCollectionContents(req, res) {
  try {
    const db = mongoose.connection.db;
    const collectionName = req.params.name;
    const collection = db.collection(collectionName);
    const data = req.body;

    // Log to ensure we have the correct collection name
    console.log("Requested Collection:", collectionName);

    // Log the contents to debug
    console.log("Data:", data);

    const result = await collection.insertOne(data);

    res.status(200).json(result);
  } catch (err) {
    console.error("Error posting document contents:", err);
    res.status(500).json({ message: err.message });
  }
}

export async function refreshCollectionMetier(req, res) {
  try {
    const response = await fetch('https://labonnealternance-recette.apprentissage.beta.gouv.fr/api/v1/metiers/all', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }

    const data = await response.json();
    console.log("Fetched Data:", data); // Log the response data
    const db = mongoose.connection.db;
    const collection = db.collection('metiers-test');

    // Clear existing documents in the collection
    await collection.deleteMany({});

    // Insert each element of the array as a separate document
    if (Array.isArray(data.metiers)) {
      let toInsert = data.metiers;
      const insertPromises = toInsert.map((item) =>
        collection.insertOne({ metier: item })
      );

      await Promise.all(insertPromises);
      console.log('All metiers have been inserted into the collection');
    };
    // console.log("Data:", data.metiers[0]);
    

    res.status(201).json(data); // Respond with the fetched data
  } catch (err) {
    console.error("Error refreshing document from API contents:", err);
    res.status(500).json({ message: err.message }); // Send an appropriate error response
  }
}