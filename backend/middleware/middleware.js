import jwt from "jsonwebtoken";

// cette fonction permet de confirmer si l'utilisateur a des identifiant correcte
// depuis la base de donner avant de naviguer sur le site
const verifyUser = async (req, res, next) => {
  const { APP_TOKEN_SECRET } = process.env;
  try {
    // on recupere notre jeton JWT dans l'entete
    const token =
      req.body.tokens || req.query.token || req.headers["authorization"];

    if (!token)
      return res
        .status(400)
        .json({ msg: "A token is required for authentication" });

    const decoded = jwt.verify(token, APP_TOKEN_SECRET);

    if (!decoded)
      return res.status(400).json({ msg: "Invalid Authentication." });

    const user = await userModel.findOne({ _id: decoded.id });
    req.user = user;

    if (req._body === true) {
      console.log("req._body:TRUE");

      if (decoded.id) {
        next();
      } else {
        console.log("Erreur Authentification Body Raw");
        throw "erreur identification userid";
      }
    } else {
      throw "erreur identification url params-data";
    }
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
export default verifyUser;

// Autorise uniquement l'accès à la page si l'utilisateur est un administrateur.
// Nécessite l'utilisation du middleware `verifyUser`.
export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    next(new Error("Permission denied."));
    return;
  }

  next();
}
