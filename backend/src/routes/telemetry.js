const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/database');
const { evaluateTelemetry } = require('../services/alertEvaluator');

// POST /api/telemetry (Point d'ingestion pour l'ESP32 et le matériel IoT)
router.post('/', async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.device_id) {
      return res.status(400).json({ error: 'Payload invalide : device_id requis' });
    }

    const deviceId = payload.device_id;
    const mode = payload.mode || 'hardware'; // 'hardware' ou 'simulation'
    const sensors = payload.sensors || {};

    // Extraction propre des mesures avec gestion explicite des nulls
    const temperature_c = sensors.temperature_c !== undefined && sensors.temperature_c !== null ? Number(sensors.temperature_c) : null;
    const pressure_value = sensors.pressure_value !== undefined && sensors.pressure_value !== null ? Number(sensors.pressure_value) : null;
    const level_value = sensors.level_value !== undefined && sensors.level_value !== null ? Number(sensors.level_value) : null;
    const waste_mass_kg = sensors.waste_mass_kg !== undefined && sensors.waste_mass_kg !== null ? Number(sensors.waste_mass_kg) : null;
    const biogas_volume_m3 = sensors.biogas_volume_m3 !== undefined && sensors.biogas_volume_m3 !== null ? Number(sensors.biogas_volume_m3) : null;
    const electrical_energy_kwh = sensors.electrical_energy_kwh !== undefined && sensors.electrical_energy_kwh !== null ? Number(sensors.electrical_energy_kwh) : null;

    const record = {
      device_id: deviceId,
      data_source: mode,
      temperature_c,
      pressure_value,
      level_value,
      waste_mass_kg,
      biogas_volume_m3,
      electrical_energy_kwh,
      raw_json: JSON.stringify(payload)
    };

    const result = await run(
      `INSERT INTO telemetry 
       (device_id, data_source, temperature_c, pressure_value, level_value, waste_mass_kg, biogas_volume_m3, electrical_energy_kwh, raw_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.device_id,
        record.data_source,
        record.temperature_c,
        record.pressure_value,
        record.level_value,
        record.waste_mass_kg,
        record.biogas_volume_m3,
        record.electrical_energy_kwh,
        record.raw_json
      ]
    );

    // Évaluer les seuils et mettre à jour l'état des capteurs
    await evaluateTelemetry(record);

    res.status(201).json({
      status: 'success',
      inserted_id: result.lastID,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Erreur ingestion télémétrie:', err);
    res.status(500).json({ error: 'Erreur lors de l’enregistrement de la télémétrie' });
  }
});

// GET /api/telemetry/latest
router.get('/latest', async (req, res) => {
  try {
    const latest = await get(`
      SELECT * FROM telemetry 
      ORDER BY id DESC LIMIT 1
    `);

    if (!latest) {
      return res.json({
        hasData: false,
        message: 'Aucune mesure disponible'
      });
    }

    // Calcul du statut de connectivité globale et distinction matériel réel
    const timestampIso = latest.timestamp.includes('T') 
      ? latest.timestamp 
      : latest.timestamp.replace(' ', 'T') + 'Z';
    const lastTime = new Date(timestampIso).getTime();
    const now = Date.now();
    const diffSeconds = Math.max(0, Math.round((now - lastTime) / 1000));
    const isOnline = diffSeconds <= 45;

    // Vérification de la présence et fraîcheur de matériel réel ESP32
    const latestHardware = await get(`
      SELECT * FROM telemetry 
      WHERE data_source = 'hardware' 
      ORDER BY id DESC LIMIT 1
    `);
    
    let hardwareOnline = false;
    let hardwareDiffSeconds = null;
    if (latestHardware) {
      const hwIso = latestHardware.timestamp.includes('T')
        ? latestHardware.timestamp
        : latestHardware.timestamp.replace(' ', 'T') + 'Z';
      hardwareDiffSeconds = Math.max(0, Math.round((now - new Date(hwIso).getTime()) / 1000));
      hardwareOnline = hardwareDiffSeconds <= 45;
    }

    // Nombre d'alertes actives
    const activeAlertsCount = await get("SELECT COUNT(*) as count FROM alerts WHERE status = 'active'");

    // Total cumulé de déchets enregistrés
    const wasteTotal = await get("SELECT SUM(mass_kg) as total_kg FROM waste_entries");

    res.json({
      hasData: true,
      data: latest,
      isOnline,
      diffSeconds,
      hardwareOnline,
      hardwareDiffSeconds,
      isHardwareData: latest.data_source === 'hardware',
      activeAlertsCount: activeAlertsCount?.count || 0,
      totalWasteKg: wasteTotal?.total_kg ? Number(wasteTotal.total_kg.toFixed(2)) : 0
    });
  } catch (err) {
    console.error('Erreur latest telemetry:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la dernière mesure' });
  }
});

// GET /api/telemetry/history
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const source = req.query.source; // 'hardware', 'simulation' ou undefined pour all
    const range = req.query.range || '24h'; // '1h', '6h', '24h', '7d', 'all'

    let timeFilter = "timestamp >= datetime('now', '-24 hours')";
    if (range === '1h') timeFilter = "timestamp >= datetime('now', '-1 hours')";
    else if (range === '6h') timeFilter = "timestamp >= datetime('now', '-6 hours')";
    else if (range === '7d') timeFilter = "timestamp >= datetime('now', '-7 days')";
    else if (range === 'all') timeFilter = "1=1";

    let sql = `SELECT * FROM telemetry WHERE ${timeFilter}`;
    const params = [];

    if (source) {
      sql += ` AND data_source = ?`;
      params.push(source);
    }

    sql += ` ORDER BY id ASC LIMIT ?`;
    params.push(limit);

    const history = await all(sql, params);
    res.json({ history });
  } catch (err) {
    console.error('Erreur history telemetry:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de l’historique' });
  }
});

module.exports = router;
