import mongoose from "mongoose";
import { userModel } from "../models/user.model.js";

export async function searchUserController(req, res) {
  try {
    const username = { username: { $regex: req.query.username } };
    const users = await userModel.getUserByUsername(username);

    res.json({ users });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

// la fonction qui retourne le profil utilisateur
export async function getUserController(req, res) {
  try {
    const _id = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.send("ID inconnu :" + _id);
    }

    const user = await userModel.getUserById(_id);

    if (!user)
      return res
        .status(400)
        .json({ msg_error: "aucun utilisateur avec cet identifiant" });

    res.json({ user });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

// afficher le profil utilisateur via l'id en parametre
export async function getUserByIdParamsController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.send("ID inconnu :" + id);
    }

    const user = await userModel.getUserById(id);

    if (!user) return res.status(400).json({ msg: "User does not exist." });

    res.json({ user });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

// on retourne les info de tous les users
export async function getAllUserController(req, res) {
  const users = await userModel.getAllUsers();
  res.send(users);
}

export async function updateUserController(req, res) {
  try {
    const _id = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.send("ID inconnu :" + _id);
    }

    // on récupère les saisis utilisateurs
    const { nom, prenom, sexe, email, password, phone } = req.body;
    if (!req.body)
      return res.status(400).json({ msg: "Veuillez remplir tous les champs." });

    await userModel.updateUserProfil(
      _id,
      nom,
      prenom,
      sexe,
      email,
      password,
      phone
    );

    // reponse en cas de succès
    res.json({ msg: "Update Success!" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}

// fonction de suppression d'un utlisateur
export async function deleteUserController(req, res) {
  const { _id } = req.params;
  const deleteUser = await userModel.deleteUser(_id);
  res.send(deleteUser);
}
