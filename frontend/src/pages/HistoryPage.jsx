import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  Radio,
  Cpu
} from 'lucide-react';
import { api } from '../api/client';

export function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [range, setRange] = useState('24h');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'hardware', 'simulation'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getTelemetryHistory(
        range, 
        sourceFilter === 'all' ? null : sourceFilter
      );
      if (res.history) {
        setHistory(res.history);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [range, sourceFilter]);

  // Filtrage local pour la recherche
  const filtered = history.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.device_id?.toLowerCase().includes(term) ||
      item.data_source?.toLowerCase().includes(term) ||
      item.timestamp?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCsv = () => {
    if (history.length === 0) return;
    let csv = 'ID,Date_Heure,Dispositif,Source_Donnees,Temperature_C,Pression_hPa,Niveau_pct,Masse_kg,Biogaz_m3,Electricite_kWh\n';
    history.forEach(h => {
      csv += `${h.id},"${h.timestamp}","${h.device_id}","${h.data_source}",${h.temperature_c ?? ''},${h.pressure_value ?? ''},${h.level_value ?? ''},${h.waste_mass_kg ?? ''},${h.biogas_volume_m3 ?? ''},${h.electrical_energy_kwh ?? ''}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecocharge_telemetrie_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-eco-dark flex items-center gap-2">
            <FileText className="w-5 h-5 text-eco-primary" />
            Historique Complet & Journal de Télémétrie
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Traçabilité horodatée de l'ensemble des mesures physiques et simulées
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="eco-btn-secondary text-xs font-semibold self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-eco-primary" />
          Exporter CSV Télémétrie
        </button>
      </div>

      {/* BARRE DE FILTRES ET RECHERCHE */}
      <div className="eco-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        
        {/* RECHERCHE */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par date, dispositif, source..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary"
          />
        </div>

        {/* PÉRIODES */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-500 font-medium">Période :</span>
          {['1h', '6h', '24h', '7d', 'all'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1.5 rounded font-medium transition-colors ${
                range === r ? 'bg-eco-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {r === '1h' ? '1 Heure' : r === '6h' ? '6 Heures' : r === '24h' ? '24 Heures' : r === '7d' ? '7 Jours' : 'Tout'}
            </button>
          ))}
        </div>

        {/* SOURCE */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-medium">Source :</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-gray-300 bg-white font-medium text-gray-800"
          >
            <option value="all">Toutes sources</option>
            <option value="hardware">Matériel Réel (ESP32)</option>
            <option value="simulation">Simulation</option>
          </select>
        </div>

      </div>

      {/* TABLEAU HISTORIQUE */}
      <div className="eco-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Dispositif</th>
                <th className="py-3 px-4">Source Donnée</th>
                <th className="py-3 px-4">Température (°C)</th>
                <th className="py-3 px-4">Pression (hPa)</th>
                <th className="py-3 px-4">Biogaz (m³)</th>
                <th className="py-3 px-4">Électricité (kWh)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-gray-600 text-[11px]">
                    {new Date(row.timestamp).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-medium text-gray-700">
                    {row.device_id}
                  </td>
                  <td className="py-2.5 px-4">
                    {row.data_source === 'hardware' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Radio className="w-3 h-3 text-emerald-600" />
                        Matériel Réel
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Cpu className="w-3 h-3 text-amber-700" />
                        Simulation
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-gray-900">
                    {row.temperature_c !== null ? `${row.temperature_c} °C` : '—'}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-gray-900">
                    {row.pressure_value !== null ? `${row.pressure_value} hPa` : '—'}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-eco-primary">
                    {row.biogas_volume_m3 !== null ? `${row.biogas_volume_m3} m³` : '—'}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-eco-blue">
                    {row.electrical_energy_kwh !== null ? `${row.electrical_energy_kwh} kWh` : '—'}
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Aucune mesure trouvée avec les filtres sélectionnés.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
          <div>
            Affichage de <strong>{paginated.length}</strong> sur <strong>{filtered.length}</strong> enregistrements
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
