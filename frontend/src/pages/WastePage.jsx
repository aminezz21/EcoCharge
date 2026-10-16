import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  PlusCircle, 
  Download, 
  Scale, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { api } from '../api/client';

export function WastePage() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Formulaire d'ajout
  const [type, setType] = useState('Déchets alimentaires');
  const [massKg, setMassKg] = useState('');
  const [source, setSource] = useState('Restaurant universitaire');
  const [notes, setNotes] = useState('');

  const wasteTypes = [
    'Déchets alimentaires',
    'Déchets végétaux',
    'Résidus agricoles',
    'Autre matière organique'
  ];

  const sourcePresets = [
    'Restaurant universitaire',
    'Cafétéria IUT',
    'Jardin partagé',
    'Serre expérimentale',
    'Espaces verts',
    'Composteur de quartier'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resEntries, resStats] = await Promise.all([
        api.getWasteEntries(100),
        api.getWasteStats()
      ]);
      setEntries(resEntries.entries || []);
      setStats(resStats || null);
    } catch (err) {
      setErrorMsg('Erreur lors du chargement des déchets : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWaste = async (e) => {
    e.preventDefault();
    if (!massKg || isNaN(massKg) || Number(massKg) <= 0) {
      setErrorMsg('Veuillez entrer une masse valide supérieure à 0 kg.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await api.addWasteEntry({
        type,
        mass_kg: Number(massKg),
        source,
        notes
      });

      setSuccessMsg(`Entrée de ${massKg} kg enregistrée avec succès.`);
      setMassKg('');
      setNotes('');
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await api.downloadWasteCsv();
    } catch (err) {
      setErrorMsg('Échec du téléchargement CSV : ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER & EXPORT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-eco-dark flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-eco-primary" />
            Gestion des Intrants & Déchets Organiques
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Enregistrement des charges, traçabilité des gisements et calcul des bilans de masse
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="eco-btn-secondary text-xs font-semibold self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-eco-primary" />
          Exporter CSV
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-eco-primary shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CARTES DE STATISTIQUES (Journalier, Hebdomadaire, Mensuel, Total) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="eco-card p-4 border-l-4 border-l-eco-primary">
          <span className="text-xs font-semibold text-gray-500 uppercase">Aujourd'hui</span>
          <div className="mt-2 text-2xl font-extrabold text-eco-dark">
            {stats?.todayKg || '0.00'} <span className="text-sm font-semibold text-gray-500">kg</span>
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">Charges introduites ce jour</span>
        </div>

        <div className="eco-card p-4 border-l-4 border-l-eco-primary">
          <span className="text-xs font-semibold text-gray-500 uppercase">Cette Semaine (7j)</span>
          <div className="mt-2 text-2xl font-extrabold text-eco-dark">
            {stats?.weekKg || '0.00'} <span className="text-sm font-semibold text-gray-500">kg</span>
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">Alimentation continue</span>
        </div>

        <div className="eco-card p-4 border-l-4 border-l-eco-primary">
          <span className="text-xs font-semibold text-gray-500 uppercase">Ce Mois (30j)</span>
          <div className="mt-2 text-2xl font-extrabold text-eco-dark">
            {stats?.monthKg || '0.00'} <span className="text-sm font-semibold text-gray-500">kg</span>
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">Bilan volumique mensuel</span>
        </div>

        <div className="eco-card p-4 border-l-4 border-l-eco-dark">
          <span className="text-xs font-semibold text-gray-500 uppercase">Total Cumulé</span>
          <div className="mt-2 text-2xl font-extrabold text-eco-dark">
            {stats?.totalKg || '0.00'} <span className="text-sm font-semibold text-gray-500">kg</span>
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">{stats?.totalCount || 0} chargements tracés</span>
        </div>
      </div>

      {/* SECTION FORMULAIRE + HISTORIQUE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORMULAIRE D'ENREGISTREMENT */}
        <div className="eco-card p-6">
          <div className="flex items-center gap-2 mb-4 border-b pb-3">
            <PlusCircle className="w-5 h-5 text-eco-primary" />
            <h2 className="text-base font-bold text-eco-dark">Enregistrer une Nouvelle Charge</h2>
          </div>

          <form onSubmit={handleAddWaste} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Type de Déchets Organiques
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary bg-white text-gray-800"
              >
                {wasteTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Masse Pesée (en kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  required
                  min="0.1"
                  placeholder="Ex : 12.5"
                  value={massKg}
                  onChange={(e) => setMassKg(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary text-gray-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">kg</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Origine des Déchets
              </label>
              <input
                type="text"
                list="sources-list"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary text-gray-800"
              />
              <datalist id="sources-list">
                {sourcePresets.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Notes & Remarques (Qualité, hygrométrie, broyage)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex : Épluchures broyées finement, exempt de plastique..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary text-gray-800"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full eco-btn-primary py-2.5 font-semibold text-xs flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              {submitting ? 'Enregistrement...' : 'Valider l’Apport'}
            </button>
          </form>
        </div>

        {/* TABLEAU DE L'HISTORIQUE DES ENTRÉES */}
        <div className="lg:col-span-2 eco-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h2 className="text-base font-bold text-eco-dark flex items-center gap-2">
                <FileText className="w-5 h-5 text-eco-primary" />
                Journal des Apports Organiques
              </h2>
              <span className="text-xs text-gray-500 font-mono">
                {entries.length} entrées enregistrées
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
                    <th className="pb-2">Date / Heure</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Masse</th>
                    <th className="pb-2">Origine</th>
                    <th className="pb-2">Opérateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2.5 text-gray-500 font-mono text-[11px]">
                        {new Date(entry.timestamp).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-2.5 font-semibold text-gray-800">
                        {entry.type}
                      </td>
                      <td className="py-2.5 font-bold text-eco-primary">
                        {entry.mass_kg} kg
                      </td>
                      <td className="py-2.5 text-gray-600">
                        {entry.source || '—'}
                      </td>
                      <td className="py-2.5 text-gray-500">
                        {entry.operator || '—'}
                      </td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        Aucun apport enregistré pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t text-[11px] text-gray-400 flex items-center justify-between">
            <span>Traçabilité conforme aux standards de méthanisation académique</span>
            <span>Export CSV disponible en haut de page</span>
          </div>
        </div>

      </div>

    </div>
  );
}
