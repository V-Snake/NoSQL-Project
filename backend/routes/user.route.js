import express from "express";
import {
  searchUserController,
  getUserController,
  getUserByIdParamsController,
  getAllUserController,
  updateUserController,
  deleteUserController,
} from "../controllers/users.controller.js";

import { requireAdmin } from "../middleware/middleware.js";

import verifyUser from "../middleware/middleware.js";

//initialisation de la variable de gestion des routes
const router = express.Router();

// ==========
// USERS DATABASE
// ==========

//route  d'affichage des info d'un user connecté
router.get("/", verifyUser, getUserController);

//route  d'affichage des info d'un user connecté
router.get("/:id", verifyUser, getUserByIdParamsController);

//route  d'affichage des info de tous les users inscrit
router.post("/all_users", verifyUser, requireAdmin, getAllUserController);

//route  d'affichage des info d'un user recherché
router.get("/search_username", verifyUser, searchUserController);

// route de mis à jour du profil d'un user
router.patch("/update_user", verifyUser, updateUserController);

// suppression des elements
router.delete("/:id", verifyUser, deleteUserController);

// pour pouvoir importer nos routes
// sous n'importe quel nom a cause du mot cle default
export default router;
