import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Filter, 
  PlusCircle, 
  Check, 
  Info,
  Radio,
  Flame,
  Thermometer,
  Gauge
} from 'lucide-react';
import { AlertLevelBadge } from '../components/StatusBadge';
import { api } from '../api/client';

export function AlertsPage({ onAlertResolved }) {
  const [alerts, setAlerts] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'resolved'
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLevel, setNewLevel] = useState('warning');

  useEffect(() => {
    loadAlerts();
  }, [filterStatus]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAlerts(filterStatus === 'all' ? null : filterStatus);
      if (res.alerts) {
        setAlerts(res.alerts);
        setActiveCount(res.activeCount);
        setCriticalCount(res.criticalCount);
      }
    } catch (err) {
      console.error('Erreur chargement alertes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      setResolvingId(id);
      await api.resolveAlert(id);
      loadAlerts();
      if (onAlertResolved) onAlertResolved();
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  const handleCreateTestAlert = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;

    try {
      await api.createAlert({
        title: newTitle,
        description: newDesc,
        level: newLevel,
        type: 'manual_notice',
        source: 'Opérateur Démonstration'
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER & COMPTEURS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-eco-dark flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-eco-danger" />
            Centre de Notifications & Alertes de Sécurité
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Détection automatique des dérives thermodynamiques, pertes de signal et incohérences capteurs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="eco-btn-secondary text-xs font-semibold"
          >
            <PlusCircle className="w-4 h-4 text-eco-primary" />
            Créer Avis Manuel
          </button>
        </div>
      </div>

      {/* STATS BARS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="eco-card p-4 border-l-4 border-l-eco-danger flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase">Alertes Critiques</span>
            <div className="text-2xl font-extrabold text-eco-danger mt-1">{criticalCount}</div>
          </div>
          <ShieldAlert className="w-8 h-8 text-red-200" />
        </div>

        <div className="eco-card p-4 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Actives</span>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">{activeCount}</div>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-200" />
        </div>

        <div className="eco-card p-4 border-l-4 border-l-eco-primary flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase">État Procédé</span>
            <div className="text-sm font-bold text-eco-primary mt-1">
              {activeCount === 0 ? "Aucune alerte active" : "Vigilance opérateur requise"}
            </div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-200" />
        </div>
      </div>

      {/* FILTRES D'AFFICHAGE */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-semibold text-gray-600 mr-2">Filtrer par statut :</span>
        {[
          { id: 'all', label: 'Toutes' },
          { id: 'active', label: 'Actives seulement' },
          { id: 'resolved', label: 'Résolues / Historique' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === f.id
                ? 'bg-eco-dark text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* LISTE DES ALERTES */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className={`eco-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 ${
              alert.status === 'resolved' 
                ? 'border-l-gray-300 opacity-60 bg-gray-50/40' 
                : alert.level === 'critical'
                  ? 'border-l-red-600 bg-red-50/15'
                  : 'border-l-amber-500 bg-amber-50/15'
            }`}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <AlertLevelBadge level={alert.level} />
                <span className="text-xs font-mono text-gray-400">
                  #{alert.id} • Type: {alert.type}
                </span>
                <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(alert.created_at).toLocaleString('fr-FR')}
                </span>
                {alert.status === 'resolved' && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Résolue le {new Date(alert.resolved_at || alert.created_at).toLocaleTimeString('fr-FR')}
                  </span>
                )}
              </div>

              <h2 className="text-sm font-bold text-gray-900 mt-1">{alert.title}</h2>
              <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">{alert.description}</p>
              
              <div className="text-[11px] text-gray-400 pt-1 font-mono">
                Source : <strong className="text-gray-600">{alert.source || 'Automatisme de surveillance'}</strong>
              </div>
            </div>

            {/* Action acquitter */}
            {alert.status === 'active' && (
              <div className="self-end md:self-center shrink-0">
                <button
                  onClick={() => handleResolve(alert.id)}
                  disabled={resolvingId === alert.id}
                  className="eco-btn-secondary text-xs px-3 py-1.5 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
                >
                  <Check className="w-3.5 h-3.5 text-eco-primary" />
                  {resolvingId === alert.id ? 'Résolution...' : 'Acquitter'}
                </button>
              </div>
            )}
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="eco-card p-12 text-center text-gray-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-600 text-sm">Aucune alerte à signaler dans cette vue.</p>
            <p className="text-xs text-gray-400 mt-1">Tous les paramètres de méthanisation sont dans leurs plages sécurisées.</p>
          </div>
        )}
      </div>

      {/* MODALE CRÉATION D'AVIS MANUEL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <h2 className="text-base font-bold text-eco-dark mb-1">
              Émettre une Notification de Sécurité
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Enregistre un événement dans le journal des alertes pour traçabilité
            </p>

            <form onSubmit={handleCreateTestAlert} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Gravité</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary"
                >
                  <option value="info">Information (Faible)</option>
                  <option value="warning">Avertissement (Moyen)</option>
                  <option value="critical">Critique (Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Titre de l'alerte</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Maintenance programmée de la vanne"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description détaillée</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex : Contrôle de sécurité effectué par l'équipe étudiante..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="eco-btn-primary px-4 py-2 font-semibold"
                >
                  Publier l'alerte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
