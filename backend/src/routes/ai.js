const express = require('express');
const router = express.Router();
const { predictor } = require('../services/aiPredictor');

// GET /api/ai/forecast (Prévisions futures de biogaz et électricité)
router.get('/forecast', async (req, res) => {
  try {
    const forecast = await predictor.forecastProduction();
    res.json(forecast);
  } catch (err) {
    console.error('Erreur ai forecast:', err);
    res.status(500).json({ error: 'Erreur lors du calcul prévisionnel' });
  }
});

// GET /api/ai/factors (Facteurs d'influence température & gisements)
router.get('/factors', async (req, res) => {
  try {
    const factors = await predictor.analyzeFactors();
    res.json(factors);
  } catch (err) {
    console.error('Erreur ai factors:', err);
    res.status(500).json({ error: 'Erreur lors de l’analyse des facteurs' });
  }
});

module.exports = router;
