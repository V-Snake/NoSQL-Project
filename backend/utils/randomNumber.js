// fonction qui permet de generer automatiquement un code pin
// selon la taille passé en paramètre

export function randomPinNumber(length) {
  let pin = "";

  for (let i = 0; i < length; i++) {
    // on obtient un nombre arrondi entre 0 et 9.99
    // ce nombre est stocke dans la variable pin
    pin += Math.floor(Math.random() * 10);
  }
  return pin;
}
