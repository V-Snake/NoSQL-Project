import express from "express";
import { getTokenController } from "../controllers/token.controller.js";

// pour gerer les routes
const router = express.Router();

//route  d'affichage des info d'un user
router.get("/", getTokenController);
// pour pouvoir importer nos routes
// sous n'importe quel nom a cause du mot cle default
export default router;
