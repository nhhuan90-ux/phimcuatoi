import express from 'express';

const appPromise = import('../server/server.cjs')
  .then(module => module.default)
  .catch(error => {
    console.error("Initialization error:", error);
    const fallbackApp = express();
    fallbackApp.all('*', (req, res) => {
      res.status(500).json({
        error: "Initialization failed",
        message: error.message,
        stack: error.stack
      });
    });
    return fallbackApp;
  });

export default async function handler(req, res) {
  const app = await appPromise;
  app(req, res);
}
