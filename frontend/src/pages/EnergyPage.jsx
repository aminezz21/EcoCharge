import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Flame, 
  Download, 
  TrendingUp, 
  Percent, 
  HelpCircle, 
  ShieldCheck, 
  Cpu, 
  Radio, 
  Calendar,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  LineChart, 
  Line 
} from 'recharts';
import { api } from '../api/client';

export function EnergyPage() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadEnergyData = async () => {
    try {
      setLoading(true);
      const [resSummary, resHistory] = await Promise.all([
        api.getEnergySummary(),
        api.getEnergyHistory(range)
      ]);
      setSummary(resSummary);

      if (resHistory.points) {
        const formatted = resHistory.points.map(pt => ({
          time: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          gas: pt.biogas_volume_m3 || 0,
          elec: pt.electrical_energy_kwh || 0,
          source: pt.data_source
        }));
        setHistory(formatted);
      }
    } catch (err) {
      setErrorMsg('Erreur chargement données énergétiques : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnergyData();
  }, [range]);

  const handleExportCsv = async () => {
    try {
      await api.downloadEnergyCsv();
    } catch (err) {
      setErrorMsg('Erreur lors du téléchargement CSV : ' + err.message);
    }
  };

  const isSimulated = summary?.latestMeasurement?.isSimulated;

  return (
    <div className="space-y-6">
      
      {/* HEADER & EXPORT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-eco-dark flex items-center gap-2">
            <Zap className="w-5 h-5 text-eco-blue" />
            Analyse Énergétique & Conversion Biogaz
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Bilan thermodynamique, production mesurée, estimation du rendement et valorisation électrique
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="eco-btn-secondary text-xs font-semibold self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-eco-primary" />
          Exporter CSV Énergie
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* AVERTISSEMENT DE DÉONTOLOGIE & LABELLISATION DES DONNÉES */}
      <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 shadow-sm ${
        isSimulated 
          ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
          : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
      }`}>
        {isSimulated ? (
          <Cpu className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        ) : (
          <Radio className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
        )}
        <div>
          <h2 className="font-bold text-sm">
            {isSimulated ? "Notice Scientifique : Données Énergétiques Simulées" : "Données Physiques Réelles Connectées"}
          </h2>
          <p className="mt-0.5 leading-relaxed">
            {isSimulated ? (
              <>
                Les grandeurs affichées ci-dessous proviennent du <strong>modèle cinétique de simulation</strong>.
                Aucun générateur physique n'étant détecté sur le banc d'essai, la production électrique est calculée sur la base d'un 
                <em>PCI biogaz de 6.0 kWh/m³</em> et d'un rendement de conversion théorique paramétré à <em>32.5%</em>.
              </>
            ) : (
              <>
                Télémétrie acquise en direct via le microcontrôleur ESP32 et le module de mesure électrique PZEM-004T.
              </>
            )}
          </p>
        </div>
      </div>

      {/* 3 BLOCS DE SYNTHÈSE ÉNERGÉTIQUE (Mesuré vs Estimé vs Simulé) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* ÉLECTRICITÉ */}
        <div className="eco-card p-5 border-t-4 border-t-eco-blue">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Énergie Électrique</span>
            <div className="p-2 rounded-lg bg-blue-50 text-eco-blue">
              <Zap className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-eco-dark">
              {summary?.latestMeasurement?.electricalEnergyKwh ?? '0.00'}
            </span>
            <span className="text-base font-bold text-gray-500">kWh</span>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Nature de la donnée :</span>
              <span className="font-semibold text-gray-700">
                {isSimulated ? 'Estimation Modélisée' : 'Mesure PZEM-004T'}
              </span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Dernières 24h :</span>
              <span className="font-mono text-gray-700">+{summary?.productionPeriods?.last24h?.elecKwh || '0.000'} kWh</span>
            </div>
          </div>
        </div>

        {/* BIOGAZ */}
        <div className="eco-card p-5 border-t-4 border-t-eco-primary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Volume de Biogaz</span>
            <div className="p-2 rounded-lg bg-eco-light text-eco-primary">
              <Flame className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-eco-dark">
              {summary?.latestMeasurement?.biogasM3 ?? '0.00'}
            </span>
            <span className="text-base font-bold text-gray-500">m³</span>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Équivalent thermique :</span>
              <span className="font-semibold text-gray-700">
                ~{((summary?.latestMeasurement?.biogasM3 || 0) * 6.0).toFixed(2)} kWh th
              </span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Dernières 24h :</span>
              <span className="font-mono text-gray-700">+{summary?.productionPeriods?.last24h?.gasM3 || '0.000'} m³</span>
            </div>
          </div>
        </div>

        {/* RENDEMENT THERMODYNAMIQUE */}
        <div className="eco-card p-5 border-t-4 border-t-emerald-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Rendement de Conversion</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Percent className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-eco-dark">
              {summary?.efficiency?.valuePct !== null ? `${summary?.efficiency?.valuePct} %` : 'N/A'}
            </span>
            {summary?.efficiency?.isTheoretical && (
              <span className="text-xs text-amber-700 font-medium">(Théorique)</span>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <p className="leading-snug">
              {summary?.efficiency?.note || "Calculable uniquement si les débits de gaz et les kWh électriques sont simultanément mesurés."}
            </p>
          </div>
        </div>

      </div>

      {/* GRAPHIQUE COMPARATIF DE PRODUCTION */}
      <div className="eco-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-eco-dark flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-eco-primary" />
              Historique de Production & Conversion
            </h2>
            <p className="text-xs text-gray-500">Évolution chronologique du biogaz et de l'énergie électrique produite</p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {['24h', '7d', '30d'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  range === r 
                    ? 'bg-eco-primary text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {r === '24h' ? '24 Heures' : r === '7d' ? '7 Jours' : '30 Jours'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2F3E8" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #D8E2DC', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line 
                type="monotone" 
                dataKey="gas" 
                name="Biogaz Cumulé (m³)" 
                stroke="#21845B" 
                strokeWidth={2.5} 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="elec" 
                name="Électricité Cumulée (kWh)" 
                stroke="#3478B8" 
                strokeWidth={2.5} 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
