const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ message: "Test réussi" });
});

app.listen(7777, () => {
  console.log('Serveur test sur port 7777');
});