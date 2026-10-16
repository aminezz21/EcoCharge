const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/alerts (Liste des alertes, filtre statut)
router.get('/', async (req, res) => {
  try {
    const status = req.query.status; // 'active', 'resolved' ou null
    let sql = 'SELECT * FROM alerts';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT 100';

    const alerts = await all(sql, params);
    const activeCount = await get("SELECT COUNT(*) as count FROM alerts WHERE status = 'active'");
    const criticalCount = await get("SELECT COUNT(*) as count FROM alerts WHERE status = 'active' AND level = 'critical'");

    res.json({
      alerts,
      activeCount: activeCount?.count || 0,
      criticalCount: criticalCount?.count || 0
    });
  } catch (err) {
    console.error('Erreur get alerts:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des alertes' });
  }
});

// PUT /api/alerts/:id/resolve (Acquittement / Résolution)
router.put('/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await get('SELECT * FROM alerts WHERE id = ?', [id]);

    if (!alert) {
      return res.status(404).json({ error: 'Alerte introuvable' });
    }

    await run("UPDATE alerts SET status = 'resolved', resolved_at = datetime('now') WHERE id = ?", [id]);
    const updated = await get('SELECT * FROM alerts WHERE id = ?', [id]);

    res.json({ message: 'Alerte résolue avec succès', alert: updated });
  } catch (err) {
    console.error('Erreur resolve alert:', err);
    res.status(500).json({ error: 'Erreur lors de la résolution de l’alerte' });
  }
});

// POST /api/alerts (Création manuelle d'une alerte ou test pédagogique)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, level, title, description, source } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Titre et description requis' });
    }

    const result = await run(
      `INSERT INTO alerts (type, level, title, description, status, source, created_at)
       VALUES (?, ?, ?, ?, 'active', ?, datetime('now'))`,
      [type || 'manual_notice', level || 'warning', title, description, source || 'opérateur']
    );

    const inserted = await get('SELECT * FROM alerts WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Alerte créée avec succès', alert: inserted });
  } catch (err) {
    console.error('Erreur create alert:', err);
    res.status(500).json({ error: 'Erreur lors de la création de l’alerte' });
  }
});

module.exports = router;
