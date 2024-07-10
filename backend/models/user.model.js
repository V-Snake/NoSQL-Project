import mongoose from "mongoose";
import isEmail from "validator/lib/isEmail.js";

const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 55,
      trim: true,
    },
    prenom: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 55,
      trim: true,
    },
    sexe: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 55,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      validate: [isEmail],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      max: 1024,
      minlength: 6,
    },
    profession: {
      type: String,
      maxlength: 50,
      required: true,
      default: "visiteur",
    },
    addresse: {
      type: String,
      maxlength: 100,
    },

    telephone: {
      type: Number,
      maxlength: 150,
    },

    // le jeton
    tokens: {
      token: {
        type: String,
        maxlength: 500,
        default: "",
      },
      dateCreation: {
        type: Date,
        required: true,
        default: Date.now,
      },
    },
    role: {
      type: String,
      default: "client",
    },
    estMembre: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  //   pour connaitre la date a laquelle un utilsateur s'enregistre
  {
    timestamps: true,
  }
);

// creation de fontions statique pour les donnée (CRUD users)
userSchema.static("createUser", createUser);
userSchema.static("getUserByEmail", getUserByEmail);
userSchema.static("getUserById", getUserById);
userSchema.static("getAllUsers", getAllUsers);
userSchema.static("refreshToken", refreshToken);
userSchema.static("updatePassword", updatePassword);
userSchema.static("verifyUser", verifyUser);
userSchema.static("deleteUser", deleteUser);

// ==================================
// LES REQUÊTES DE LA BASE DE DONNÉE
// ==================================

async function createUser(nom, prenom, sexe, email, password, phone) {
  return await this.create({
    nom,
    prenom,
    sexe,
    email,
    password,
    phone,
  });
}

async function getUserByEmail(email) {
  const user = await this.findOne({ email });
  if (!user) return false;
  return user;
}

async function getUserById(_id) {
  const user = await this.find({ _id }).select("-password");
  if (!user) return false;
  return user;
}

async function getAllUsers() {
  const AllUsers = await this.find().select("-password");
  return AllUsers;
}

async function refreshToken(_id, token) {
  const newToken = await this.findOneAndUpdate(
    { _id },
    { $set: { tokens: { token: token, dateCreation: Date.now() } } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return newToken;
}

async function updatePassword(email, newhashedPass) {
  const newPassword = await this.findOneAndUpdate(
    { email },
    { $set: { password: newhashedPass } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return newPassword;
}

async function verifyUser(_id, email) {
  const newUser = await this.findOneAndUpdate(
    { _id, email, isVerified: false },
    { $set: { estMembre: true } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return newUser;
}

async function deleteUser(_id) {
  const deleteUserInfo = await this.deleteOne({ _id }).exec();
  return deleteUserInfo;
}

// Creation d'un Model(exemple) mongoose sur la base du Schéma
// Au cas ou je ne m'étais pas le nom de la collection alors on aura Users comme le nom de collection par defaut
const collectionName = "users";
export const userModel = mongoose.model("User", userSchema, collectionName);
