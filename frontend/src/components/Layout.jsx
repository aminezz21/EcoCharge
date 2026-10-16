import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Layers, 
  Trash2, 
  Zap, 
  AlertTriangle, 
  FileText, 
  Cpu, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  RefreshCw,
  Sliders,
  CheckCircle2,
  Flame
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataSourceBadge, ConnectionBadge } from './StatusBadge';

export function Layout({ 
  currentTab, 
  setCurrentTab, 
  systemStatus, 
  onRefresh, 
  children,
  onToggleSimulator
}) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'sensors', label: 'Capteurs & Télémétrie', icon: Activity },
    { id: 'biodigester', label: 'Schéma Biodigesteur', icon: Layers },
    { id: 'waste', label: 'Gestion des Déchets', icon: Trash2 },
    { id: 'energy', label: 'Analyse Énergétique', icon: Zap },
    { id: 'alerts', label: 'Centre d’Alertes', icon: AlertTriangle, badge: systemStatus?.activeAlertsCount },
    { id: 'history', label: 'Historique & Logs', icon: FileText },
    { id: 'ai', label: 'Module IA & Prédiction', icon: Cpu },
    { id: 'settings', label: 'Paramètres Système', icon: Settings },
  ];

  const handleNavClick = (id) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
  };

  const isSimulated = systemStatus?.latest?.data_source !== 'hardware';

  return (
    <div className="flex h-screen bg-[#F4F7F5] overflow-hidden">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-eco-dark text-white border-r border-emerald-950/40 select-none">
        {/* Brand / Logo */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-eco-primary flex items-center justify-center shadow-lg shadow-emerald-900/40 text-white">
            <Flame className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              EcoCharge
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-eco-primary text-white">IoT</span>
            </h1>
            <p className="text-xs text-emerald-200/70 font-medium">Bioénergie & Valorisation</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-eco-primary text-white shadow-sm font-semibold'
                    : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-300'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-eco-danger text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Session card in sidebar */}
        <div className="p-4 border-t border-white/10 bg-black/15">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs text-emerald-200/60 uppercase font-semibold">Session</p>
              <p className="text-sm font-medium text-white truncate">{user?.username || 'Étudiant'}</p>
              <p className="text-[11px] text-emerald-300/80 truncate">{user?.email || 'Opérateur'}</p>
            </div>
            <button
              onClick={logout}
              title="Se déconnecter"
              className="p-2 text-emerald-200/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex flex-col w-72 bg-eco-dark text-white z-10 shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-eco-primary" />
                <span className="font-bold text-lg">EcoCharge</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-white/80">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${
                      isActive ? 'bg-eco-primary text-white font-semibold' : 'text-emerald-100 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-eco-danger text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm">{user?.username}</span>
              <button onClick={logout} className="p-2 hover:bg-white/10 rounded text-red-300">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-eco-border px-4 md:px-6 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 md:hidden text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-base font-bold text-eco-dark">
                Station Pilote Biodigesteur
              </h2>
              <p className="text-xs text-gray-500">Supervision académique & énergétique</p>
            </div>
          </div>

          {/* STATUS PILLS & ACTIONS */}
          <div className="flex items-center gap-3">
            {/* Mode Indicator Badge (Crucial requirement) */}
            <DataSourceBadge source={systemStatus?.latest?.data_source} />

            {/* Hardware Status */}
            <div className="hidden lg:block">
              <ConnectionBadge 
                isOnline={systemStatus?.isOnline} 
                diffSeconds={systemStatus?.diffSeconds} 
              />
            </div>

            {/* Simulator Control Toggle Quick Action */}
            <button
              onClick={onToggleSimulator}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                systemStatus?.simulatorRunning
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
              title="Bascule marche/arrêt du générateur de simulation"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-700" />
              Simulateur : {systemStatus?.simulatorRunning ? 'Actif' : 'En pause'}
            </button>

            {/* Manual refresh button */}
            <button
              onClick={onRefresh}
              className="p-2 text-gray-600 hover:text-eco-primary hover:bg-eco-light/40 rounded-lg border border-gray-200 transition-colors"
              title="Rafraîchir les données"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* PAGE CONTENT SCROLLABLE */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
