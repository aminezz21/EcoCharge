const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/sensors (Tous les capteurs avec statut)
router.get('/', async (req, res) => {
  try {
    const sensors = await all('SELECT * FROM sensors ORDER BY id ASC');
    res.json({ sensors });
  } catch (err) {
    console.error('Erreur get sensors:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des capteurs' });
  }
});

// PUT /api/sensors/:id (Mise à jour seuils et activation)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, min_threshold, max_threshold, enabled } = req.body;

    const sensor = await get('SELECT id FROM sensors WHERE id = ?', [id]);
    if (!sensor) {
      return res.status(404).json({ error: 'Capteur introuvable' });
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (min_threshold !== undefined) {
      updates.push('min_threshold = ?');
      params.push(min_threshold === '' || min_threshold === null ? null : Number(min_threshold));
    }
    if (max_threshold !== undefined) {
      updates.push('max_threshold = ?');
      params.push(max_threshold === '' || max_threshold === null ? null : Number(max_threshold));
    }
    if (enabled !== undefined) {
      updates.push('enabled = ?');
      params.push(enabled ? 1 : 0);
    }

    if (updates.length > 0) {
      params.push(id);
      await run(`UPDATE sensors SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const updated = await get('SELECT * FROM sensors WHERE id = ?', [id]);
    res.json({ message: 'Capteur mis à jour avec succès', sensor: updated });
  } catch (err) {
    console.error('Erreur update sensor:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du capteur' });
  }
});

module.exports = router;
