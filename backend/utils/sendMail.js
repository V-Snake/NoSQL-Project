import mailgun from "mailgun-js";

const mailgunConfig = () =>
  mailgun({
    apiKey: process.env.APP_API_KEY_MAILGUN,
    domain: process.env.APP_DOMAIN_MAILGUN,
  });

// fonction qui gere la procedure du courrier electronique
// il contient tous les infos sur le courrier à envoyé
export const emailProcessMailgun = ({ email, pin, type }) => {
  let info = "";
  switch (type) {
    case "recup-code-pin":
      info = {
        //from: '"KSTransport <shyann.paucek42@ethereal.email>', //expéditeur
        from: "kabasidiki2020@gmail.com", //expéditeur
        to: email, // destinataires
        subject: "Code pine de réinitialisation du mot de passe", // Objet du mail
        text:
          "Bonjour, voici le Code pine de réinitialisation du mot de passe" +
          pin +
          " Ce code expirera en un jour", // message en format text brut
        html: `<b>Bonjour </b>
        voici le Code pine de réinitialisation du mot de passe
      <b>${pin} </b>
      " Ce code expirera dans un jour
      <p></p>`, // message en format html
      };

      mailgunConfig().messages().send(info);
      break;

    case "modification-mot-de-passe":
      info = {
        from: '"KSTransport <shyann.paucek42@ethereal.email>', //expéditeur
        to: email, // destinataire
        subject: "Modification mot de passe", // Objet du mail
        text: "Bonjour, votre mot de passe à été modifié avec succès", // message en texte brut
        html: `<b>Bonjour </b>
       
      <p>votre mot de passe à été modifié avec succès</p>`, // message en format html
      };

      mailgunConfig().messages().send(info);
      break;

    default:
      break;
  }
};
