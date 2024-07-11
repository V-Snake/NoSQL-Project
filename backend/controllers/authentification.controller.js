import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { userModel } from "../models/user.model.js";
import { updatePinModel } from "../models/updatepin.modele.js";
import { randomPinNumber } from "../utils/randomNumber.js";
import { hashPassword } from "../utils/hashCode.js";

export async function createUserController(req, res) {
  const { nom, prenom, sexe, email, password, phone } = req.body;

  const expressionReguliere =
    /^(([^<>()[]\.,;:s@]+(.[^<>()[]\.,;:s@]+)*)|(.+))@(([[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}])|(([a-zA-Z-0-9]+.)+[a-zA-Z]{2,}))$/;

  let errors = {
    nom: "",
    prenom: "",
    sexe: "",
    email: "",
    password: "",
    phone: "",
  };

  if (!nom) {
    errors.nom = "le champs nom est obligatoire";
    res.json({ errors });
    return;
  }

  if (!prenom) {
    errors.prenom = "le champs prenom est obligatoire";
    res.json({ errors });
    return;
  }

  if (!sexe) {
    errors.sexe = "le champs sexe est obligatoire";
    res.json({ errors });
    return;
  }

  if (!email) {
    errors.email = "le champs email est obligatoire";
    res.json({ errors });
    return;
  }

  if (!password) {
    errors.password = "le champs password est obligatoire";
    res.json({ errors });
    return;
  }

  if (!phone) {
    errors.phone = "le champs phone est obligatoire";
    res.json({ errors });
    return;
  }

  if (!expressionReguliere.test(email)) {
    errors.email = "email incorrect";
    res.json({ errors });
    return;
  }

  if (isNaN(phone)) {
    errors.phone = "le champs telephone doit être des chiffres";
    res.json({ errors });
    return;
  }

  if (password.length < 6) {
    errors.password = "mot de passe trop court";
    res.json({ errors });
    return;
  }

  const loggedUserByEmail = await userModel.getUserByEmail(email);
  if (loggedUserByEmail) {
    errors.email = "Cet email existe déjà";
    res.json({ errors });
    return;
  }

  const newUser = await userModel.createUser(
    nom,
    prenom,
    sexe,
    email,
    hashPassword(password),
    phone
  );

  if (newUser) {
    res.status(200).json({
      statut: "inscrit",
      message: "un utilisateur à été crée",
      userId: newUser._id,
    });
  }
}

export async function loginUserController(req, res) {
  const { email, password } = req.body;

  const { APP_TOKEN_SECRET } = process.env;

  let errors = { email: "", password: "", message: "" };

  const createToken = (id) => {
    return jwt.sign({ id }, APP_TOKEN_SECRET, {
      expiresIn: "45m",
    });
  };

  if (!email) {
    errors.email = "le champs email est obligatoire";
    res.json({ errors });
    return;
  }

  if (!password) {
    errors.password = "le champs password est obligatoire";
    res.json({ errors });
    return;
  }

  const loggedUser = await userModel.getUserByEmail(email);
  if (!loggedUser) {
    errors.email = "Email incorrect";
    errors.message =
      " Votre compte(mail) n'a pas été trouvé dans la base donnée";
    res.json({ errors });
    return;
  }

  const auth = await bcrypt.compare(password, loggedUser.password);

  if (!auth) {
    errors.password = "Le mot de passe ne correspond pas";
    errors.message = " Votre mot de passe n'existe pas dans la base de donnée";
    res.json({ errors });
    return;
  }

  if (auth && loggedUser) {
    const token = createToken(loggedUser._id);

    const refreshToken = await userModel.refreshToken(loggedUser._id, token);

    if (refreshToken) {
      res.status(200).json({
        statut: "connecté",
        message: "Connexion réussie!",
        loggedUser: loggedUser.tokens,
        token: token,
      });
    }
  }
}

export async function logoutUserController(req, res) {
  const _id = req.user.id;

  const deleteUser = await userModel.refreshToken(_id, "");

  if (deleteUser._id) {
    return res.json({
      status: "déconnexion",
      message: "Vous êtes déconnecté",
    });
  }

  res.json({
    status: "error",
    message: "Unable to logg you out, plz try again later",
  });
}

export async function recupPinController(req, res) {
  const { email } = req.body;

  let errors = { message: "" };

  const pinLength = 6;

  if (!email) {
    errors.message = "l'email est obligatoire";
    res.json({ errors });
    return;
  }

  const loggedUser = await userModel.getUserByEmail(email);
  if (!loggedUser) {
    errors.message =
      " Votre compte(mail) n'a pas été trouvé dans la base donnée";
    res.json({ errors });
    return;
  }

  const randPin = randomPinNumber(pinLength);

  const newPin = new updatePinModel({
    email: email,
    codepin: randPin,
  });

  if (loggedUser && loggedUser._id) {
    const setPin = await newPin.save();

    return res.json({
      statut: "code réçu",
      setPin: setPin,
      message:
        "Le code pin de réinitialisation vous sera envoyé sous peu via le mail renseigné",
    });
  }

  res.json({
    statut: "erreur",
    message: " Veuillez ressayer plustard",
  });
}

export async function updatePasswordController(req, res) {
  const { email, codepin, newPassword } = req.body;

  let errors = { email: "", codepin: "", newPassword: "" };

  if (!email) {
    errors.email = "l'email est obligatoire";
    res.json({ errors });
    return;
  }

  if (!codepin) {
    errors.codepin = "le code pin est obligatoire";
    res.json({ errors });
    return;
  }

  if (!newPassword) {
    errors.password = "le nouveau mot de passe est obligatoire";
    res.json({ errors });
    return;
  }

  const getPin = await updatePinModel.getPinByEmailPin(email, codepin);

  if (email !== getPin.email) {
    errors.email = " Votre compte(mail) n'a pas été trouvé dans la base donnée";
    return res.json({ errors });
  }

  if (codepin !== getPin.codepin) {
    errors.codepin = "le code pin est incorrect";
    return res.json({ errors });
  }

  if (newPassword.length < 6) {
    errors.newPassword = "mot de passe trop court";
    return res.json({ errors });
  }

  if (getPin?._id) {
    const dbDate = getPin.createdAt;

    const expiresIn = 1;

    let expDate = dbDate.setDate(dbDate.getDate() + expiresIn);

    const today = new Date();

    if (today > expDate) {
      return res.json({
        statut: "erreur",
        message:
          "le delai du code pin est expiré, veuillez demander un autre code pin",
      });
    }

    const hashedPass = hashPassword(newPassword);

    const user = await userModel.updatePassword(email, hashedPass);

    if (user._id) {
      emailProcessMailgun({ email, type: "modification-mot-de-passe" });

      return res.json({
        statut: "modification éffectué",

        message: "mot de passe changé avec succes",
      });
    }
  }
  res.json({
    statut: "erreur",
    message: "impossible de modifier le mot de passe. Essayez plus tard",
  });
}

export async function refreshTokenUserController(req, res) {
  try {
    const { APP_TOKEN_SECRET, APP_REFRESH_TOKEN_EXP_DAY } = process.env;

    const createRefreshToken = (payload) => {
      return jwt.sign(payload, APP_TOKEN_SECRET, {
        expiresIn: APP_REFRESH_TOKEN_EXP_DAY,
      });
    };

    const _id = req.user.id;

    const user_info = await userModel.getUserById(_id);
    if (!user_info)
      return res.status(400).json({ msg_error: "Vous devez vous connecter." });
    const refresh_token = user_info.tokens.token;

    if (!refresh_token)
      return res.status(400).json({ msg_error: "Token abscent." });

    jwt.verify(refresh_token, APP_TOKEN_SECRET, async (err, result) => {
      if (err)
        return res.status(400).json({ msg_error: "Veuillez-vous reconnectez" });

      const user = await userModel.getUserById(_id);

      if (!user)
        return res.status(400).json({ msg_error: "Utilisateur inexistant" });

      const access_token = createRefreshToken({ id: result.id });

      const newToken = await userModel.refreshToken(user._id, access_token);

      if (newToken) {
        res.status(200).json({
          access_token,
          user,
        });
      }
    });
  } catch (err) {
    return res.status(500).json({ msg_error: err.message });
  }
}
