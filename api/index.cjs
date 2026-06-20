const express = require('express');
const app = express();
app.get('/api/movies', (req, res) => {
  res.json({ message: "Hello from serverless!" });
});
module.exports = app;
