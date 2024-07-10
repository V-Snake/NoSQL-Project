import express from "express";
import {
  getCollectionContents,
  getListDatabaseCollectionController,
} from "../controllers/alternance.controller.js";

//initialisation de la variable de gestion des routes
const router = express.Router();

// ==========
// ALTERNANCE REQUETE DATABASE
// ==========

// route d'affichage de la liste des collections de la db
router.get("/", getListDatabaseCollectionController);

// route d'affichage de la liste des collections de la db
router.get("/collections/:name", getCollectionContents);

export default router;
