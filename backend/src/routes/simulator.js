const express = require('express');
const router = express.Router();
const { simulator } = require('../services/simulator');
const { run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/simulator/status
router.get('/status', (req, res) => {
  res.json(simulator.getStatus());
});

// POST /api/simulator/toggle (Démarrer / Arrêter la simulation)
router.post('/toggle', authenticateToken, async (req, res) => {
  try {
    const { enabled } = req.body;
    const shouldRun = enabled !== undefined ? enabled : !simulator.isRunning;

    if (shouldRun) {
      simulator.start();
      await run("UPDATE system_settings SET value = 'true' WHERE key = 'simulation_enabled'");
    } else {
      simulator.stop();
      await run("UPDATE system_settings SET value = 'false' WHERE key = 'simulation_enabled'");
    }

    res.json({
      message: shouldRun ? 'Simulation activée' : 'Simulation désactivée',
      status: simulator.getStatus()
    });
  } catch (err) {
    console.error('Erreur toggle simulator:', err);
    res.status(500).json({ error: 'Erreur lors de la bascule de simulation' });
  }
});

// POST /api/simulator/anomaly (Déclencher une anomalie de test pour le jury / TP)
router.post('/anomaly', authenticateToken, (req, res) => {
  try {
    const { type } = req.body; // 'temp_high', 'temp_low', 'pressure_spike', 'disconnected', 'clear'

    if (type === 'clear') {
      simulator.clearAnomaly();
      return res.json({ message: 'Anomalies réinitialisées', status: simulator.getStatus() });
    }

    if (!['temp_high', 'temp_low', 'pressure_spike', 'disconnected'].includes(type)) {
      return res.status(400).json({ error: 'Type d’anomalie invalide. Choix : temp_high, temp_low, pressure_spike, disconnected, clear' });
    }

    simulator.triggerAnomaly(type);
    res.json({
      message: `Anomalie ${type} injectée dans le flux de simulation (durée 30s)`,
      status: simulator.getStatus()
    });
  } catch (err) {
    console.error('Erreur anomaly simulator:', err);
    res.status(500).json({ error: 'Erreur lors de l’injection d’anomalie' });
  }
});

module.exports = router;
