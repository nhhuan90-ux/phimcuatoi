let app;
try {
  app = require('../server/server.js');
} catch (error) {
  const express = require('express');
  app = express();
  app.all('*', (req, res) => {
    res.status(500).json({
      error: "Initialization failed",
      message: error.message,
      stack: error.stack
    });
  });
}
module.exports = app;
