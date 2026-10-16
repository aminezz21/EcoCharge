const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { simulator } = require('../services/simulator');

// GET /api/settings (Tous les paramètres)
router.get('/', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM system_settings');
    const settings = {};
    rows.forEach(r => {
      settings[r.key] = r.value;
    });

    // Compléter avec état en temps réel
    settings.simulator_running = simulator.isRunning ? 'true' : 'false';

    res.json({ settings, list: rows });
  } catch (err) {
    console.error('Erreur get settings:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres' });
  }
});

// PUT /api/settings (Mise à jour des paramètres)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const newSettings = req.body; // { key: value, ... }

    for (const [key, value] of Object.entries(newSettings)) {
      const existing = await get('SELECT key FROM system_settings WHERE key = ?', [key]);
      if (existing) {
        await run('UPDATE system_settings SET value = ? WHERE key = ?', [String(value), key]);
      } else {
        await run('INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)', [key, String(value), 'Paramètre configuré']);
      }

      // Si le paramètre concerne la simulation
      if (key === 'simulation_enabled') {
        if (value === 'true' || value === true) {
          simulator.start();
        } else {
          simulator.stop();
        }
      }
    }

    const rows = await all('SELECT * FROM system_settings');
    res.json({ message: 'Paramètres mis à jour avec succès', list: rows });
  } catch (err) {
    console.error('Erreur update settings:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres' });
  }
});

module.exports = router;
