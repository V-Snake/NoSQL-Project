import express from "express";
import {
  getCollectionContents,
  getListDatabaseCollectionController,
  refreshCollectionMetier,
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

// route de post d'une collection avec un json
// router.post("/collections/1", refreshCollectionMetier);

router.get("/test", refreshCollectionMetier);

export default router;
