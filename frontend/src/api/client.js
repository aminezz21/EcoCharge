const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('ecocharge_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Si format fichier (ex: CSV)
    if (options.isBlob) {
      if (!response.ok) throw new Error('Erreur lors du téléchargement');
      return await response.blob();
    }

    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        // Rediriger ou effacer le token si invalide
        // localStorage.removeItem('ecocharge_token');
      }
      throw new Error(data.error || 'Erreur requête API');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/auth/me'),

  // Telemetry
  getLatestTelemetry: () => request('/telemetry/latest'),
  getTelemetryHistory: (range = '24h', source) => {
    let url = `/telemetry/history?range=${range}`;
    if (source) url += `&source=${source}`;
    return request(url);
  },

  // Sensors
  getSensors: () => request('/sensors'),
  updateSensor: (id, payload) => request(`/sensors/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Alerts
  getAlerts: (status) => request(status ? `/alerts?status=${status}` : '/alerts'),
  resolveAlert: (id) => request(`/alerts/${id}/resolve`, { method: 'PUT' }),
  createAlert: (payload) => request('/alerts', { method: 'POST', body: JSON.stringify(payload) }),

  // Waste
  getWasteEntries: (limit = 100) => request(`/waste?limit=${limit}`),
  addWasteEntry: (payload) => request('/waste', { method: 'POST', body: JSON.stringify(payload) }),
  getWasteStats: () => request('/waste/stats'),
  downloadWasteCsv: async () => {
    const blob = await request('/waste/export', { isBlob: true });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecocharge_dechets_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  // Energy
  getEnergySummary: () => request('/energy/summary'),
  getEnergyHistory: (range = '24h') => request(`/energy/history?range=${range}`),
  downloadEnergyCsv: async () => {
    const blob = await request('/energy/export', { isBlob: true });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecocharge_energie_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  // Settings & Simulator
  getSettings: () => request('/settings'),
  updateSettings: (payload) => request('/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  getSimulatorStatus: () => request('/simulator/status'),
  toggleSimulator: (enabled) => request('/simulator/toggle', { method: 'POST', body: JSON.stringify({ enabled }) }),
  injectAnomaly: (type) => request('/simulator/anomaly', { method: 'POST', body: JSON.stringify({ type }) }),

  // AI & Analytics
  getAiForecast: () => request('/ai/forecast'),
  getAiFactors: () => request('/ai/factors'),
};
