import express from "express";
import { getAlteranceListController } from "../controllers/alternance.controller.js";

//initialisation de la variable de gestion des routes
const router = express.Router();

// ==========
// ALTERNANCE REQUETE DATABASE
// ==========

// route d'affichage des tickets associés à un userS
router.get("/", getAlteranceListController);

export default router;
