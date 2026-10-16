require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, get } = require('./src/db/database');
const { simulator } = require('./src/services/simulator');

// Routeurs
const authRoutes = require('./src/routes/auth');
const telemetryRoutes = require('./src/routes/telemetry');
const sensorsRoutes = require('./src/routes/sensors');
const wasteRoutes = require('./src/routes/waste');
const energyRoutes = require('./src/routes/energy');
const alertsRoutes = require('./src/routes/alerts');
const settingsRoutes = require('./src/routes/settings');
const simulatorRoutes = require('./src/routes/simulator');
const aiRoutes = require('./src/routes/ai');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares fondamentaux
app.use(cors({
  origin: '*', // Pratique pour le prototype local et les tests ESP32 / Vite
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Journalisation concise des requêtes API
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api') && req.originalUrl !== '/api/telemetry/latest') {
      console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Montage des routes API
app.use('/api/auth', authRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/sensors', sensorsRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/ai', aiRoutes);

// Route de diagnostic / santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'EcoCharge API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    simulator: simulator.getStatus()
  });
});

// Gestionnaire global d'erreurs
app.use((err, req, res, next) => {
  console.error('💥 Erreur serveur inattendue:', err);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Démarrage et initialisation de la base
async function startServer() {
  try {
    await initDatabase();
    console.log('✅ Base de données initialisée.');

    // Vérifier si le simulateur doit être activé au démarrage
    const simSetting = await get("SELECT value FROM system_settings WHERE key = 'simulation_enabled'");
    if (!simSetting || simSetting.value === 'true') {
      simulator.start();
    }

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Serveur EcoCharge actif sur http://localhost:${PORT}`);
      console.log(`📡 Point d'ingestion ESP32 : POST http://localhost:${PORT}/api/telemetry`);
      console.log(`👤 Compte Démo : etudiant@ecocharge.local / EcoCharge2026!`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('❌ Échec critique du démarrage serveur:', err);
    process.exit(1);
  }
}

startServer();
