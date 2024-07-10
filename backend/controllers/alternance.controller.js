// on importe les paquets et fichiers necessaire pour notre app
// import dotenv from "dotenv";

import mongoose from "mongoose";

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
