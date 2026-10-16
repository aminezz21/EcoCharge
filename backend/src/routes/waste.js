const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/waste (Historique des intrants)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const entries = await all('SELECT * FROM waste_entries ORDER BY timestamp DESC LIMIT ?', [limit]);
    res.json({ entries });
  } catch (err) {
    console.error('Erreur get waste:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des déchets' });
  }
});

// POST /api/waste (Enregistrement d'un nouvel apport)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, mass_kg, source, notes } = req.body;

    if (!type || !mass_kg || isNaN(mass_kg) || Number(mass_kg) <= 0) {
      return res.status(400).json({ error: 'Type et masse valide (> 0 kg) requis' });
    }

    const operator = req.user?.username || 'Opérateur EcoCharge';

    const result = await run(
      `INSERT INTO waste_entries (type, mass_kg, source, notes, operator, timestamp)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [type, Number(mass_kg), source || 'Non spécifiée', notes || '', operator]
    );

    const inserted = await get('SELECT * FROM waste_entries WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Entrée de déchets enregistrée', entry: inserted });
  } catch (err) {
    console.error('Erreur add waste:', err);
    res.status(500).json({ error: 'Erreur lors de l’enregistrement de l’entrée de déchet' });
  }
});

// GET /api/waste/stats (Statistiques journalières, hebdomadaires, mensuelles)
router.get('/stats', async (req, res) => {
  try {
    const totalAll = await get('SELECT SUM(mass_kg) as total, COUNT(*) as count FROM waste_entries');
    const today = await get("SELECT SUM(mass_kg) as total FROM waste_entries WHERE date(timestamp) = date('now')");
    const week = await get("SELECT SUM(mass_kg) as total FROM waste_entries WHERE timestamp >= datetime('now', '-7 days')");
    const month = await get("SELECT SUM(mass_kg) as total FROM waste_entries WHERE timestamp >= datetime('now', '-30 days')");

    const byType = await all(`
      SELECT type, SUM(mass_kg) as total_kg, COUNT(*) as count
      FROM waste_entries
      GROUP BY type
      ORDER BY total_kg DESC
    `);

    res.json({
      totalKg: Number(totalAll?.total || 0).toFixed(2),
      totalCount: totalAll?.count || 0,
      todayKg: Number(today?.total || 0).toFixed(2),
      weekKg: Number(week?.total || 0).toFixed(2),
      monthKg: Number(month?.total || 0).toFixed(2),
      byType
    });
  } catch (err) {
    console.error('Erreur waste stats:', err);
    res.status(500).json({ error: 'Erreur lors du calcul des statistiques de déchets' });
  }
});

// GET /api/waste/export (Export CSV)
router.get('/export', async (req, res) => {
  try {
    const entries = await all('SELECT * FROM waste_entries ORDER BY timestamp DESC');
    let csv = 'ID,Date_Heure,Type_Dechet,Masse_kg,Origine,Operateur,Notes\n';

    entries.forEach(e => {
      const cleanNotes = (e.notes || '').replace(/"/g, '""');
      csv += `${e.id},"${e.timestamp}","${e.type}",${e.mass_kg},"${e.source || ''}","${e.operator || ''}","${cleanNotes}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ecocharge_dechets.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Erreur export waste CSV:', err);
    res.status(500).json({ error: 'Erreur lors de l’export CSV' });
  }
});

module.exports = router;
