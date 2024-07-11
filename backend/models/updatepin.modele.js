import mongoose from "mongoose";
import isEmail from "validator/lib/isEmail.js";

const updatePinSchema = new mongoose.Schema(
  {
    codepin: {
      type: String,
      minLength: 6,
      maxLength: 6,
    },
    email: {
      type: String,
      required: true,
      validate: [isEmail],
      lowercase: true,
      trim: true,
    },
  },

  {
    timestamps: true,
  }
);

// creation de fontions statique pour les donnée (updatePinSchema.static("getPinById", getPinById);
updatePinSchema.static("getPinByEmailPin", getPinByEmailPin);
updatePinSchema.static("deletePin", deletePin);

async function getPinByEmailPin(email, pin) {
  const codepin = await this.findOne({ email, pin })
    .sort({ createdAt: -1 })
    .limit(1);
  if (!codepin) return false;
  return codepin;
}

async function deletePin(email, pin) {
  const codepin = await this.findOneAndDelete({ email, pin });
  if (!codepin) return false;
  return codepin;
}

// Creation d'un Model(exemple) mongoose sur la base du Schéma
// Au cas ou je ne m'étais pas le nom de la collection alors on aura Users comme le nom de collection par defaut
const collectionName = "codepins";
export const updatePinModel = mongoose.model(
  "Codepin",
  updatePinSchema,
  collectionName
);
