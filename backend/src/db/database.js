const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.resolve(__dirname, '../../../database/ecocharge.db');
const SCHEMA_PATH = path.resolve(__dirname, 'schema.sql');

// S'assurer que le dossier database existe
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erreur de connexion SQLite:', err.message);
  } else {
    console.log('✅ Base de données SQLite connectée:', DB_PATH);
  }
});

// Helper pour exécuter une requête avec promesse
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialisation et migration du schéma
async function initDatabase() {
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  
  // Exécuter chaque instruction
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const sql of statements) {
    await run(sql);
  }

  // 1. Initialiser l'utilisateur de démonstration s'il n'existe pas
  const existingUser = await get('SELECT id FROM users WHERE email = ?', ['etudiant@ecocharge.local']);
  if (!existingUser) {
    const passwordHash = await bcrypt.hash('EcoCharge2026!', 10);
    await run(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['EtudiantIoT', 'etudiant@ecocharge.local', passwordHash, 'administrateur']
    );
    console.log('👤 Compte démo créé: etudiant@ecocharge.local / EcoCharge2026!');
  }

  // 2. Initialiser les capteurs standard
  const defaultSensors = [
    {
      id: 'temp_reactor',
      name: 'Température Biodigesteur',
      type: 'DS18B20 Étanche',
      unit: '°C',
      min_threshold: 30.0,
      max_threshold: 40.0,
      last_value: 36.5,
      status: 'ok'
    },
    {
      id: 'pressure_gas',
      name: 'Pression de Biogaz',
      type: 'Transducteur Analogique MPX5050DP',
      unit: 'hPa',
      min_threshold: 20.0,
      max_threshold: 150.0,
      last_value: 85.0,
      status: 'ok'
    },
    {
      id: 'level_slurry',
      name: 'Niveau Matière Digestat',
      type: 'Capteur Ultrasonique JSN-SR04T',
      unit: '%',
      min_threshold: 15.0,
      max_threshold: 85.0,
      last_value: 62.0,
      status: 'ok'
    },
    {
      id: 'waste_scale',
      name: 'Pesée Intrants Organiques',
      type: 'Jauge de contrainte + HX711',
      unit: 'kg',
      min_threshold: 0.0,
      max_threshold: 50.0,
      last_value: 14.5,
      status: 'ok'
    },
    {
      id: 'flow_biogas',
      name: 'Production Biogaz Cumulée',
      type: 'Débitmètre à gaz YFS401',
      unit: 'm³',
      min_threshold: 0.0,
      max_threshold: 10.0,
      last_value: 2.85,
      status: 'ok'
    },
    {
      id: 'energy_meter',
      name: 'Génération Électrique',
      type: 'Module Puissance PZEM-004T',
      unit: 'kWh',
      min_threshold: 0.0,
      max_threshold: 10.0,
      last_value: 2.35,
      status: 'ok'
    }
  ];

  for (const s of defaultSensors) {
    const existing = await get('SELECT id FROM sensors WHERE id = ?', [s.id]);
    if (!existing) {
      await run(
        `INSERT INTO sensors (id, name, type, unit, min_threshold, max_threshold, last_value, last_seen, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
        [s.id, s.name, s.type, s.unit, s.min_threshold, s.max_threshold, s.last_value, s.status]
      );
    }
  }

  // 3. Paramètres initiaux
  const defaultSettings = [
    { key: 'site_name', value: 'Station Pilote EcoCharge — Campus Universitaire', desc: "Nom de l'installation" },
    { key: 'telemetry_interval_sec', value: '10', desc: "Intervalle de télémétrie en secondes" },
    { key: 'simulation_enabled', value: 'true', desc: "Activer le simulateur interne" },
    { key: 'hardware_timeout_sec', value: '30', desc: "Délai avant de considérer l'ESP32 déconnecté" },
    { key: 'temp_unit', value: '°C', desc: "Unité de température" },
    { key: 'pressure_unit', value: 'hPa', desc: "Unité de pression" },
    { key: 'device_id_expected', value: 'ECOCHARGE_001', desc: "Identifiant attendu de l'ESP32" }
  ];

  for (const set of defaultSettings) {
    const existing = await get('SELECT key FROM system_settings WHERE key = ?', [set.key]);
    if (!existing) {
      await run('INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)', [set.key, set.value, set.desc]);
    }
  }

  // 4. Données de démonstration pour les déchets si table vide
  const countWaste = await get('SELECT COUNT(*) as cnt FROM waste_entries');
  if (countWaste && countWaste.cnt === 0) {
    const initialWaste = [
      { type: 'Déchets alimentaires', mass_kg: 14.5, source: 'Restaurant universitaire', notes: 'Épluchures de légumes et restes de repas sans agrumes excessifs', timeOffset: '-4 days' },
      { type: 'Déchets végétaux', mass_kg: 9.2, source: 'Jardin botanique du campus', notes: 'Tontes de gazon pré-broyées', timeOffset: '-3 days' },
      { type: 'Résidus agricoles', mass_kg: 12.0, source: 'Serre expérimentale', notes: 'Feuilles de tomates et paille hachée', timeOffset: '-2 days' },
      { type: 'Déchets alimentaires', mass_kg: 15.8, source: 'Cafétéria IUT', notes: 'Marc de café et épluchures de fruits mûrs', timeOffset: '-1 days' },
      { type: 'Déchets végétaux', mass_kg: 8.5, source: 'Espaces verts', notes: 'Feuilles mortes broyées et humidifier', timeOffset: '-5 hours' }
    ];

    for (const w of initialWaste) {
      await run(
        `INSERT INTO waste_entries (type, mass_kg, source, notes, timestamp)
         VALUES (?, ?, ?, ?, datetime('now', ?))`,
        [w.type, w.mass_kg, w.source, w.notes, w.timeOffset]
      );
    }
    console.log('🌱 Données de déchets initiales injectées.');
  }

  // 5. Historique de télémétrie si table vide
  const countTelem = await get('SELECT COUNT(*) as cnt FROM telemetry');
  if (countTelem && countTelem.cnt === 0) {
    console.log('📊 Génération de 24h d’historique de simulation initiale...');
    // Générer 24 points sur les dernières 24 heures
    for (let i = 24; i >= 0; i--) {
      const hoursAgo = `-${i} hours`;
      const temp = Number((36.2 + Math.sin(i / 3) * 1.5 + (Math.random() - 0.5) * 0.4).toFixed(1));
      const press = Number((82.0 + Math.cos(i / 4) * 8.0 + (Math.random() - 0.5) * 2.0).toFixed(1));
      const lvl = Number((60.0 + (24 - i) * 0.2).toFixed(1));
      const mass = 14.5;
      const biogas = Number((0.45 + (24 - i) * 0.08 + (Math.random() - 0.5) * 0.02).toFixed(3));
      const elec = Number((biogas * 1.85 * 0.32).toFixed(2)); // Estimation conversion 32% génératrice

      await run(
        `INSERT INTO telemetry 
         (device_id, timestamp, data_source, temperature_c, pressure_value, level_value, waste_mass_kg, biogas_volume_m3, electrical_energy_kwh)
         VALUES ('ECOCHARGE_001', datetime('now', ?), 'simulation', ?, ?, ?, ?, ?, ?)`,
        [hoursAgo, temp, press, lvl, mass, biogas, elec]
      );
    }
  }

  // 6. Alerte pédagogique de démonstration
  const countAlerts = await get('SELECT COUNT(*) as cnt FROM alerts');
  if (countAlerts && countAlerts.cnt === 0) {
    await run(
      `INSERT INTO alerts (type, level, title, description, status, source, created_at)
       VALUES ('warning', 'warning', 'Température en limite basse mésophile', 'La température est descendue sous 32°C durant la nuit précédente. Vérifier isolation.', 'resolved', 'system', datetime('now', '-18 hours'))`
    );
  }
}

module.exports = {
  db,
  run,
  get,
  all,
  initDatabase
};
