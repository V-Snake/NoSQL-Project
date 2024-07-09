// on importe les paquets et fichiers necessaire pour notre app
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import morgan from "morgan";

// on importe les element de nos userRoutes
import alternanceRoutes from "./routes/alternance.route.js";

// pour la gestion des variable d'environnement
dotenv.config({ path: "./config/.env" });

// on fait appel au variable d'environnement depuis le fichier .env
const { APP_PORT, APP_HOSTNAME, APP_DB_USER_PASS } = process.env;

// on initialise notre application express
const app = express();

// ==========
// MIDDLEWARES
// ==========
//pour proteger notre application  de certaines des vulnérabilités
//lorqu'il sera en production
// à l'interieur de la parenthèse on peut mettre
// une configuration initiale de securité selon nos besoin
app.use(helmet());

// pour le debug
// resultat visible sur la console apres avoir lancer une requete
// l'affichage tiny nous précise le type , statut et le temps de la requête
// possibilité de parametrer l'affichage a l'interieur de la parenthèse selon les besoins
app.use(morgan("tiny"));

// middlewares Pour récupérer les données POST en Express simplement
// Une fois que vous avez mis en place les deux ou une des méthodes ci-dessus vous pouvez les récupérer avec req.body sous forme d'un JSON
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// on connecte notre back et notre base de donne qui s'appelle alterance
mongoose
  .connect(
    `mongodb+srv://${APP_DB_USER_PASS}@nosql.saqf8aj.mongodb.net/alterance`
  )
  .then(() => console.log("connected to Mongo"))
  .catch((err) => console.log("Connected failed", err));

// ==========
// ROUTES
// ==========
// middlewares pour le chargements des différentes routes
// on declenche les fonctions liées à userRoutes quand nous sommes sur ce chemin: "/api/user"
app.use("/api/alterance", alternanceRoutes);

app.listen(APP_PORT, () => {
  console.log(
    `Application connecté à l'adresse suivante http://${APP_HOSTNAME}:${APP_PORT}`
  );
});
