import jwt from "jsonwebtoken";
import { userModel } from "../models/user.model.js";

// la fonction qui retourne le nouveau token de rafraichement du user
//  au cas ou son token est expiré
export async function getTokenController(req, res, next) {
  const { APP_TOKEN_SECRET, APP_REFRESH_TOKEN_EXP_DAY } = process.env;

  const createRefreshToken = (id) => {
    return jwt.sign({ id }, APP_TOKEN_SECRET, {
      // durer de vie
      expiresIn: APP_REFRESH_TOKEN_EXP_DAY,
    });
  };
  // on recupere notre jeton JWT dans l'entete
  const token =
    req.body.tokens || req.query.token || req.headers["authorization"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  const decoded = jwt.verify(token, APP_TOKEN_SECRET);
  req.user = decoded;

  if (decoded.id) {
    const userProfil = await userModel.getUserById(decoded.id);

    if (userProfil[0]._id) {
      let tokenExp = userProfil[0].tokens.dateCreation;

      const dBrefreshToken = userProfil[0].tokens.token;

      tokenExp = tokenExp.setDate(
        tokenExp.getDate() + +APP_REFRESH_TOKEN_EXP_DAY //le + devant APP_REFRESH_TOKEN_EXP_DAY pour le changer en nombre
      );

      const today = new Date();

      if (dBrefreshToken !== token && tokenExp < today) {
        return res.status(403).json({
          satut: "invalide token",
          message: "Vous devez vous reconnecter",
        });
      }

      const Refreshtoken = createRefreshToken(userProfil[0]._id);
      console.log(Refreshtoken);

      // on met a jour le token du user valable 30 jours
      const newRefreshToken = await userModel.refreshToken(
        userProfil[0]._id,
        Refreshtoken
      );
      //   si on a le nouveau token affiche le message de confirmation
      if (newRefreshToken) {
        res.status(200).json({
          statut: "nouveau token",
          message: "token changé avec succès!",
          newRefreshToken,
        });
      }
    }
  }
}
