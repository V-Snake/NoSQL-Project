import mongoose from "mongoose";

// fonction d'affichage de la liste des offres d'alterance
export async function getAlteranceListController(req, res) {
  try {
    // const listAlterance = await req.
    res.status(200).json(listAlterance);
  } catch (err) {
    // sinon on retourne le message d'erreur
    res.status(500).json({ message: err.message });
  }
}
