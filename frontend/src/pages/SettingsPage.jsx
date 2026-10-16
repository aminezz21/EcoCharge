import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Sliders, 
  Cpu, 
  Wifi, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Pause,
  Zap,
  Flame,
  Info
} from 'lucide-react';
import { api } from '../api/client';

export function SettingsPage({ onSimulatorToggled }) {
  const [settings, setSettings] = useState({
    site_name: 'Station Pilote EcoCharge — Campus Universitaire',
    telemetry_interval_sec: '10',
    simulation_enabled: 'true',
    hardware_timeout_sec: '30',
    temp_unit: '°C',
    pressure_unit: 'hPa',
    device_id_expected: 'ECOCHARGE_001'
  });
  const [simulatorStatus, setSimulatorStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [resSettings, resSim] = await Promise.all([
        api.getSettings(),
        api.getSimulatorStatus()
      ]);

      if (resSettings.settings) {
        setSettings(prev => ({ ...prev, ...resSettings.settings }));
      }
      setSimulatorStatus(resSim);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erreur lors du chargement des paramètres : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      await api.updateSettings(settings);
      setSavedSuccess('Paramètres sauvegardés avec succès.');
      setTimeout(() => setSavedSuccess(''), 4000);
      loadSettings();
      if (onSimulatorToggled) onSimulatorToggled();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleToggleSim = async () => {
    try {
      const isCurrentlyRunning = simulatorStatus?.isRunning;
      const res = await api.toggleSimulator(!isCurrentlyRunning);
      setSimulatorStatus(res.status);
      setSettings(prev => ({ ...prev, simulation_enabled: !isCurrentlyRunning ? 'true' : 'false' }));
      setSavedSuccess(res.message);
      setTimeout(() => setSavedSuccess(''), 4000);
      if (onSimulatorToggled) onSimulatorToggled();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold text-eco-dark flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-eco-primary" />
          Configuration du Système & Télémétrie
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Paramètres du site, gestion du mode simulation, liaison ESP32 et conformité de sécurité
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-eco-primary shrink-0" />
          <span className="font-semibold">{savedSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SECTION 1 : CONTRÔLE DU MODE SIMULATION */}
        <div className="eco-card p-6 border-l-4 border-l-amber-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-eco-dark flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-700" />
                Moteur de Simulation Interne
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Permet d'utiliser l'ensemble des modules analytiques en l'absence du matériel physique ESP32
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleSim}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                simulatorStatus?.isRunning
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
              }`}
            >
              {simulatorStatus?.isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  Mettre en Pause le Simulateur
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Démarrer le Simulateur
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block font-semibold text-[10px] uppercase">Statut Actuel</span>
              <span className="font-bold text-gray-800 text-sm mt-0.5 block">
                {simulatorStatus?.isRunning ? '🟢 En cours d’émission' : '⏸️ Arrêté'}
              </span>
              <span className="text-gray-400 text-[11px]">Période : {simulatorStatus?.intervalMs ? simulatorStatus.intervalMs / 1000 : 5}s</span>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block font-semibold text-[10px] uppercase">Label Données</span>
              <span className="font-bold text-amber-800 text-sm mt-0.5 block">"DONNÉES SIMULÉES"</span>
              <span className="text-gray-400 text-[11px]">Tracées distinctement des capteurs réels</span>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block font-semibold text-[10px] uppercase">Anomalie Injectée</span>
              <span className="font-bold text-gray-800 text-sm mt-0.5 block font-mono">
                {simulatorStatus?.anomalyActive || 'Aucune (Régime nominal)'}
              </span>
              <span className="text-gray-400 text-[11px]">Auto-résolution sous 30 secondes</span>
            </div>
          </div>
        </div>

        {/* SECTION 2 : IDENTITÉ & PARAMÈTRES GÉNÉRAUX */}
        <div className="eco-card p-6">
          <h2 className="text-base font-bold text-eco-dark mb-4 pb-2 border-b border-gray-100">
            Identité de l'Installation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Nom de l'Installation / Établissement
              </label>
              <input
                type="text"
                value={settings.site_name}
                onChange={(e) => handleChange('site_name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary text-gray-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Identifiant Dispositif ESP32 Attendu
              </label>
              <input
                type="text"
                value={settings.device_id_expected}
                onChange={(e) => handleChange('device_id_expected', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary text-gray-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Unité de Température
              </label>
              <select
                value={settings.temp_unit}
                onChange={(e) => handleChange('temp_unit', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary bg-white text-gray-800"
              >
                <option value="°C">Degré Celsius (°C)</option>
                <option value="K">Kelvin (K)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Unité de Pression de Gaz
              </label>
              <select
                value={settings.pressure_unit}
                onChange={(e) => handleChange('pressure_unit', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary bg-white text-gray-800"
              >
                <option value="hPa">Hectopascal (hPa / mbar)</option>
                <option value="kPa">Kilopascal (kPa)</option>
                <option value="bar">Bar (bar)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Fréquence d'Acquisition Souhaitée (secondes)
              </label>
              <input
                type="number"
                min="2"
                max="300"
                value={settings.telemetry_interval_sec}
                onChange={(e) => handleChange('telemetry_interval_sec', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary text-gray-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Délai d'Inactivité ESP32 avant Alerte Hors Ligne (secondes)
              </label>
              <input
                type="number"
                min="10"
                max="600"
                value={settings.hardware_timeout_sec}
                onChange={(e) => handleChange('hardware_timeout_sec', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3 : CONSIGNES DE SÉCURITÉ & SECRETS */}
        <div className="eco-card p-6 bg-gray-50/50">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-eco-primary shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 leading-relaxed">
              <h3 className="font-bold text-gray-800 text-sm">Gestion des Secrets & Clés API :</h3>
              <p className="mt-1">
                Conformément aux bonnes pratiques de sécurité, aucune clé privée, mot de passe Wi-Fi ou secret JWT n'est exposé dans le code frontend.
                Les variables sensibles sont isolées dans le fichier serveur <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800">backend/.env</code> et dans le fichier firmware <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800">firmware/ecocharge_esp32/secrets.h</code>.
              </p>
            </div>
          </div>
        </div>

        {/* BOUTON ENREGISTRER */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="eco-btn-primary px-6 py-2.5 text-xs font-semibold"
          >
            <Save className="w-4 h-4" />
            Enregistrer les Configurations
          </button>
        </div>

      </form>

    </div>
  );
}
