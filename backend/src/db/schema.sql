-- EcoCharge Database Schema (SQLite)
-- Conçu pour le projet IoT de supervision & valorisation énergétique

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'operator',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sensors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  unit TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  min_threshold REAL,
  max_threshold REAL,
  last_value REAL,
  last_seen DATETIME,
  status TEXT DEFAULT 'disconnected'
);

CREATE TABLE IF NOT EXISTS telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_source TEXT NOT NULL, -- 'hardware' ou 'simulation'
  temperature_c REAL,
  pressure_value REAL,
  level_value REAL,
  waste_mass_kg REAL,
  biogas_volume_m3 REAL,
  electrical_energy_kwh REAL,
  raw_json TEXT
);

CREATE TABLE IF NOT EXISTS waste_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  mass_kg REAL NOT NULL,
  source TEXT,
  notes TEXT,
  operator TEXT DEFAULT 'Étudiant L3 IoT',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  level TEXT NOT NULL, -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'resolved'
  source TEXT DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT
);
