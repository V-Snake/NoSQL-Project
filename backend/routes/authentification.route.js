import express from "express";
import {
  createUserController,
  loginUserController,
  logoutUserController,
  refreshTokenUserController,
  recupPinController,
  updatePasswordController,
} from "../controllers/authentification.controller.js";

import verifyUser from "../middleware/middleware.js";

//initialisation de la variable de gestion des routes
const router = express.Router();

// ==========
// AUTHENTIFICATION
// ==========

// route de creation d'un nouveau utlisateur
router.post("/register_user", createUserController);
// route de  connection d'un utilisateur existant
router.post("/login_user", loginUserController);
// route de  génération d'un token utilisateur lors d'un refresh de la page
router.post("/refresh_token", verifyUser, refreshTokenUserController);
// route de  deconnection d'un user
router.delete("/logout_user", verifyUser, logoutUserController);
//route de creation du codepin d'un user
router.post("/reset-password", recupPinController);
//route de modification du password
router.patch("/reset-password", updatePasswordController);

// pour pouvoir importer nos routes
// sous n'importe quel nom a cause du mot cle default
export default router;
