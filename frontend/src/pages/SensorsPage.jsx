import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Thermometer, 
  Gauge, 
  Layers, 
  Scale, 
  Flame, 
  Zap, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Power, 
  Save, 
  Clock,
  ShieldCheck,
  Edit2
} from 'lucide-react';
import { api } from '../api/client';

export function SensorsPage() {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSensor, setEditingSensor] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadSensors();
  }, []);

  const loadSensors = async () => {
    try {
      setLoading(true);
      const res = await api.getSensors();
      if (res.sensors) {
        setSensors(res.sensors);
      }
    } catch (err) {
      setErrorMsg('Erreur lors du chargement des capteurs : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnable = async (sensor) => {
    try {
      const updatedEnabled = sensor.enabled === 1 ? 0 : 1;
      await api.updateSensor(sensor.id, { enabled: updatedEnabled });
      setSensors(sensors.map(s => s.id === sensor.id ? { ...s, enabled: updatedEnabled } : s));
      showSuccess(`Capteur "${sensor.name}" ${updatedEnabled ? 'activé' : 'désactivé'}.`);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    if (!editingSensor) return;

    try {
      await api.updateSensor(editingSensor.id, {
        name: editingSensor.name,
        min_threshold: editingSensor.min_threshold !== '' ? Number(editingSensor.min_threshold) : null,
        max_threshold: editingSensor.max_threshold !== '' ? Number(editingSensor.max_threshold) : null,
      });

      showSuccess(`Seuils mis à jour pour "${editingSensor.name}".`);
      setEditingSensor(null);
      loadSensors();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const showSuccess = (msg) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  const getSensorIcon = (id) => {
    switch (id) {
      case 'temp_reactor': return Thermometer;
      case 'pressure_gas': return Gauge;
      case 'level_slurry': return Layers;
      case 'waste_scale': return Scale;
      case 'flow_biogas': return Flame;
      case 'energy_meter': return Zap;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-eco-dark flex items-center gap-2">
            <Activity className="w-5 h-5 text-eco-primary" />
            Parc de Capteurs & Instrumentation IoT
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Supervision individuelle, état de liaison, activation modulaire et seuils d'alerte configurables
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3 py-2 rounded-lg border border-eco-border">
          <ShieldCheck className="w-4 h-4 text-eco-primary" />
          <span>Architecture modulaire : chaque capteur peut être déconnecté sans bloquer le système</span>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-eco-primary shrink-0" />
          <span className="font-semibold">{saveSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* GRILLE DES CAPTEURS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sensors.map((sensor) => {
          const Icon = getSensorIcon(sensor.id);
          const isEnabled = sensor.enabled === 1;

          return (
            <div 
              key={sensor.id} 
              className={`eco-card p-5 flex flex-col justify-between border-t-4 ${
                !isEnabled 
                  ? 'border-t-gray-300 opacity-70 bg-gray-50/50' 
                  : sensor.status === 'critical' 
                    ? 'border-t-red-500 bg-red-50/10' 
                    : sensor.status === 'warning'
                      ? 'border-t-amber-400 bg-amber-50/10'
                      : 'border-t-eco-primary'
              }`}
            >
              <div>
                {/* En-tête capteur */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      !isEnabled ? 'bg-gray-200 text-gray-500' :
                      sensor.status === 'critical' ? 'bg-red-100 text-red-600' :
                      sensor.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-eco-light text-eco-primary'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-eco-dark">{sensor.name}</h2>
                      <p className="text-[11px] text-gray-500 font-mono">{sensor.type}</p>
                    </div>
                  </div>

                  {/* Interrupteur activation */}
                  <button
                    onClick={() => handleToggleEnable(sensor)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      isEnabled 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100' 
                        : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={isEnabled ? "Désactiver ce capteur" : "Activer ce capteur"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                {/* Valeur actuelle */}
                <div className="mt-5 flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-extrabold text-eco-dark">
                      {isEnabled && sensor.last_value !== null ? Number(sensor.last_value).toFixed(1) : '—'}
                    </span>
                    <span className="ml-1.5 text-sm font-semibold text-gray-500">{sensor.unit}</span>
                  </div>

                  <div>
                    {!isEnabled ? (
                      <span className="text-[11px] font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                        Désactivé
                      </span>
                    ) : sensor.status === 'critical' ? (
                      <span className="text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                        Seuil critique
                      </span>
                    ) : sensor.status === 'warning' ? (
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                        Hors plage
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                        Nominal
                      </span>
                    )}
                  </div>
                </div>

                {/* Plage de seuils */}
                <div className="mt-4 p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                  <div className="flex items-center justify-between text-gray-600 mb-1">
                    <span className="font-medium">Plage de sécurité :</span>
                    <span className="font-mono text-[11px]">
                      {sensor.min_threshold !== null ? sensor.min_threshold : '—'} à {sensor.max_threshold !== null ? sensor.max_threshold : '—'} {sensor.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Dernier signal :
                    </span>
                    <span>
                      {sensor.last_seen ? new Date(sensor.last_seen).toLocaleTimeString() : 'Inconnu'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bouton modifier seuils */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setEditingSensor(sensor)}
                  className="inline-flex items-center gap-1.5 text-xs text-eco-primary hover:text-eco-dark font-medium px-2.5 py-1.5 rounded-md hover:bg-eco-light/50 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Configurer les seuils
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALE D'ÉDITION DES SEUILS */}
      {editingSensor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <h2 className="text-base font-bold text-eco-dark mb-1">
              Configuration : {editingSensor.name}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Ajustement des seuils de sécurité selon les spécifications techniques du matériel utilisé
            </p>

            <form onSubmit={handleSaveThresholds} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nom du capteur
                </label>
                <input
                  type="text"
                  value={editingSensor.name}
                  onChange={(e) => setEditingSensor({ ...editingSensor, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Seuil Min ({editingSensor.unit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingSensor.min_threshold ?? ''}
                    onChange={(e) => setEditingSensor({ ...editingSensor, min_threshold: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Seuil Max ({editingSensor.unit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingSensor.max_threshold ?? ''}
                    onChange={(e) => setEditingSensor({ ...editingSensor, max_threshold: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
                ⚠️ Les limites de sécurité ne doivent pas être modifiées sans validation des spécifications techniques de la cuve et de la soupape de surpression.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSensor(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="eco-btn-primary px-4 py-2 text-xs font-semibold"
                >
                  <Save className="w-3.5 h-3.5" />
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
