import React, { useState, useEffect } from 'react';
import { 
  Thermometer, 
  Gauge, 
  Trash2, 
  Flame, 
  Zap, 
  Wifi, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Play, 
  Pause,
  AlertOctagon,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area,
  Legend
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { DataSourceBadge, ConnectionBadge } from '../components/StatusBadge';
import { api } from '../api/client';

export function DashboardPage({ telemetry, onRefresh, onNavigate }) {
  const [history, setHistory] = useState([]);
  const [historyRange, setHistoryRange] = useState('24h');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [triggeringAnomaly, setTriggeringAnomaly] = useState(false);
  const [anomalyMsg, setAnomalyMsg] = useState('');

  const latest = telemetry?.latest || {};
  const isSimulated = latest.data_source !== 'hardware';

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getTelemetryHistory(historyRange);
      if (res.history) {
        // Formater les points pour Recharts
        const formatted = res.history.map(pt => ({
          time: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temp: pt.temperature_c,
          pressure: pt.pressure_value,
          gas: pt.biogas_volume_m3,
          elec: pt.electrical_energy_kwh
        }));
        setHistory(formatted);
      }
    } catch (err) {
      console.error('Erreur chargement historique dashboard:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [historyRange]);

  const handleInjectAnomaly = async (type) => {
    try {
      setTriggeringAnomaly(true);
      const res = await api.injectAnomaly(type);
      setAnomalyMsg(res.message);
      setTimeout(() => setAnomalyMsg(''), 6000);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setTriggeringAnomaly(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* BANNIÈRE SUPÉRIEURE D'ÉTAT & MODE */}
      <div className="eco-card p-5 border-l-4 border-l-eco-primary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-eco-dark">Supervision Générale de l'Installation</h1>
            <DataSourceBadge source={latest.data_source} />
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            Dernière acquisition : {latest.timestamp ? new Date(latest.timestamp).toLocaleString('fr-FR') : 'En attente...'}
            <span className="text-gray-300">•</span>
            <span>ID Dispositif : <strong className="text-gray-700 font-mono">{latest.device_id || 'N/A'}</strong></span>
          </p>
        </div>

        {/* ACTIONS RAPIDES DE DÉMONSTRATION PÉDAGOGIQUE */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs text-gray-500 font-medium mr-1 hidden lg:block">Tests Jury :</div>
          <button
            onClick={() => handleInjectAnomaly('temp_high')}
            disabled={triggeringAnomaly}
            className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium transition-colors"
            title="Simule une surchauffe à 43.5°C pour tester le système d'alerte"
          >
            ⚠️ Test Surchauffe
          </button>
          <button
            onClick={() => handleInjectAnomaly('pressure_spike')}
            disabled={triggeringAnomaly}
            className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium transition-colors"
            title="Simule un pic de pression à 165 hPa"
          >
            ⚡ Test Surpression
          </button>
          <button
            onClick={() => handleInjectAnomaly('clear')}
            disabled={triggeringAnomaly}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {anomalyMsg && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center justify-between">
          <span className="font-semibold">{anomalyMsg}</span>
          <button onClick={() => setAnomalyMsg('')} className="text-amber-900 font-bold ml-2">×</button>
        </div>
      )}

      {/* 7 CARTES DE MESURES ESSENTIELLES (Spécification exacte du prompt) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Masse totale de déchets traités (kg) */}
        <MetricCard
          title="Déchets Traités"
          value={telemetry?.totalWasteKg || 0}
          unit="kg"
          icon={Trash2}
          subtitle="Intrants organiques cumulés"
          status="ok"
          badge={<span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Alimentaires & Végétaux</span>}
        />

        {/* 2. Température du biodigesteur (°C) */}
        <MetricCard
          title="Température Digesteur"
          value={latest.temperature_c}
          unit="°C"
          icon={Thermometer}
          subtitle="Régime mésophile visé"
          thresholds={{ min: 30, max: 40 }}
          status={
            latest.temperature_c > 40 ? 'critical' : 
            latest.temperature_c < 30 ? 'warning' : 'ok'
          }
          isSimulated={isSimulated}
        />

        {/* 3. Pression mesurée (hPa) */}
        <MetricCard
          title="Pression Gaz"
          value={latest.pressure_value}
          unit="hPa"
          icon={Gauge}
          subtitle="Sécurité soupape < 150 hPa"
          thresholds={{ min: 20, max: 150 }}
          status={
            latest.pressure_value > 150 ? 'critical' : 
            latest.pressure_value < 20 ? 'warning' : 'ok'
          }
          isSimulated={isSimulated}
        />

        {/* 4. Production de biogaz (m³) */}
        <MetricCard
          title="Biogaz Produit"
          value={latest.biogas_volume_m3}
          unit="m³"
          icon={Flame}
          subtitle={isSimulated ? "Modèle cinétique simulé" : "Mesuré via débitmètre YF-S401"}
          status="ok"
          isSimulated={isSimulated}
        />

        {/* 5. Énergie électrique produite (kWh) */}
        <MetricCard
          title="Énergie Électrique"
          value={latest.electrical_energy_kwh}
          unit="kWh"
          icon={Zap}
          subtitle={isSimulated ? "Conversion théorique estimée" : "Mesuré via PZEM-004T"}
          status="ok"
          isSimulated={isSimulated}
        />

        {/* 6. État de connexion de l'ESP32 */}
        <div className="rounded-xl border border-eco-border bg-white p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Liaison ESP32</span>
            <div className={`p-2.5 rounded-lg ${telemetry?.hardwareOnline ? 'bg-eco-light text-eco-primary' : (isSimulated ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600')}`}>
              <Wifi className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {telemetry?.hardwareOnline ? (
              <ConnectionBadge isOnline={true} diffSeconds={telemetry?.hardwareDiffSeconds} />
            ) : isSimulated ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Simulateur actif (ESP32 en veille)
              </span>
            ) : (
              <ConnectionBadge isOnline={false} diffSeconds={telemetry?.diffSeconds} />
            )}
            <p className="text-xs text-gray-500 mt-2 font-mono">
              IP/Broker : WiFi Station (HTTP REST)
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-400">
            Protocole : JSON payload /api/telemetry
          </div>
        </div>

        {/* 7. Nombre d'alertes actives */}
        <div 
          onClick={() => onNavigate && onNavigate('alerts')}
          className="rounded-xl border border-eco-border bg-white p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Alertes Actives</span>
            <div className={`p-2.5 rounded-lg ${telemetry?.activeAlertsCount > 0 ? 'bg-red-100 text-eco-danger' : 'bg-eco-light text-eco-primary'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${telemetry?.activeAlertsCount > 0 ? 'text-eco-danger' : 'text-eco-primary'}`}>
              {telemetry?.activeAlertsCount || 0}
            </span>
            <span className="text-xs text-gray-500">notification(s)</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 group-hover:text-eco-primary">
            <span>Voir le centre d'alertes</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* ÉTAT GÉNÉRAL DU SYSTÈME */}
        <div className="rounded-xl border border-eco-border bg-white p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">État Global</span>
            <div className="p-2.5 rounded-lg bg-eco-light text-eco-primary">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 text-base font-bold text-eco-primary">
              <span className="w-2.5 h-2.5 rounded-full bg-eco-primary animate-ping" />
              {telemetry?.activeAlertsCount > 0 ? 'Surveillance requise' : 'Régime Nominal'}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Processus biochimique méthanogène en cours
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-400">
            Rendement théorique estimé : ~32%
          </div>
        </div>

      </div>

      {/* SECTION GRAPHIQUES HISTORIQUES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRAPHIQUE 1 : TEMPÉRATURE & SEUILS */}
        <div className="eco-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-eco-dark flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-eco-primary" />
                Évolution de la Température Biodigesteur (°C)
              </h2>
              <p className="text-xs text-gray-500">Plage mésophile optimale : 30°C à 40°C</p>
            </div>
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
              {history.length} points
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2F3E8" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
                <YAxis domain={[25, 45]} stroke="#6b7280" fontSize={11} unit="°C" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #D8E2DC', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="temp" 
                  name="Température (°C)" 
                  stroke="#21845B" 
                  strokeWidth={2.5} 
                  dot={false}
                  activeDot={{ r: 5 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPHIQUE 2 : PRODUCTION BIOGAZ & ÉNERGIE ÉLECTRIQUE */}
        <div className="eco-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-eco-dark flex items-center gap-2">
                <Zap className="w-4 h-4 text-eco-blue" />
                Production Énergétique (Gaz vs Électricité)
              </h2>
              <p className="text-xs text-gray-500">
                {isSimulated ? "Courbe issue du modèle cinétique simulé" : "Données mesurées par capteurs physiques"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {['24h', '7d'].map((r) => (
                <button
                  key={r}
                  onClick={() => setHistoryRange(r)}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    historyRange === r ? 'bg-eco-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#21845B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#21845B" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorElec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3478B8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3478B8" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2F3E8" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #D8E2DC', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area 
                  type="monotone" 
                  dataKey="gas" 
                  name="Biogaz (m³)" 
                  stroke="#21845B" 
                  fillOpacity={1} 
                  fill="url(#colorGas)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="elec" 
                  name="Électricité (kWh)" 
                  stroke="#3478B8" 
                  fillOpacity={1} 
                  fill="url(#colorElec)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
