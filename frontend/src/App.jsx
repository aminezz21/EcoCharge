import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SensorsPage } from './pages/SensorsPage';
import { BiodigesterPage } from './pages/BiodigesterPage';
import { WastePage } from './pages/WastePage';
import { EnergyPage } from './pages/EnergyPage';
import { AlertsPage } from './pages/AlertsPage';
import { HistoryPage } from './pages/HistoryPage';
import { AIPredictionPage } from './pages/AIPredictionPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './api/client';

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [telemetry, setTelemetry] = useState(null);
  const [simulatorStatus, setSimulatorStatus] = useState(null);
  const [pollingError, setPollingError] = useState(false);

  // Polling temps réel toutes les 5 secondes
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [resTelem, resSim] = await Promise.all([
        api.getLatestTelemetry(),
        api.getSimulatorStatus()
      ]);
      setTelemetry({
        latest: resTelem.data,
        isOnline: resTelem.isOnline,
        diffSeconds: resTelem.diffSeconds,
        hardwareOnline: resTelem.hardwareOnline,
        hardwareDiffSeconds: resTelem.hardwareDiffSeconds,
        activeAlertsCount: resTelem.activeAlertsCount,
        totalWasteKg: resTelem.totalWasteKg
      });
      setSimulatorStatus(resSim);
      setPollingError(false);
    } catch (err) {
      console.warn('Erreur polling télémétrie:', err.message);
      setPollingError(true);
    }
  };

  const handleToggleSimulator = async () => {
    try {
      const isCurrentlyRunning = simulatorStatus?.isRunning;
      const res = await api.toggleSimulator(!isCurrentlyRunning);
      setSimulatorStatus(res.status);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-eco-bg flex flex-col items-center justify-center text-eco-dark">
        <div className="w-10 h-10 border-4 border-eco-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Initialisation d'EcoCharge...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const systemStatus = {
    latest: telemetry?.latest,
    isOnline: telemetry?.isOnline,
    diffSeconds: telemetry?.diffSeconds,
    activeAlertsCount: telemetry?.activeAlertsCount,
    simulatorRunning: simulatorStatus?.isRunning
  };

  return (
    <Layout
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      systemStatus={systemStatus}
      onRefresh={fetchData}
      onToggleSimulator={handleToggleSimulator}
    >
      {currentTab === 'dashboard' && (
        <DashboardPage 
          telemetry={telemetry} 
          onRefresh={fetchData} 
          onNavigate={(tab) => setCurrentTab(tab)} 
        />
      )}
      {currentTab === 'sensors' && <SensorsPage />}
      {currentTab === 'biodigester' && <BiodigesterPage telemetry={telemetry} />}
      {currentTab === 'waste' && <WastePage />}
      {currentTab === 'energy' && <EnergyPage />}
      {currentTab === 'alerts' && <AlertsPage onAlertResolved={fetchData} />}
      {currentTab === 'history' && <HistoryPage />}
      {currentTab === 'ai' && <AIPredictionPage />}
      {currentTab === 'settings' && <SettingsPage onSimulatorToggled={fetchData} />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
