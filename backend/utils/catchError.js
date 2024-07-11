// fonction qui permet d'afficher exactement l'erreur en question

export default function afficheError(err, res) {
  console.log(err);
  res.status(err.status || 500);
  res.json({
    message: err.message,
  });
}
