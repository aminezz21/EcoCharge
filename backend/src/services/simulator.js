const { run, get, all } = require('../db/database');
const { evaluateTelemetry } = require('./alertEvaluator');

/**
 * Service de Simulation de Télémétrie
 * Produit des données biologiques et thermodynamiques réalistes pour un biodigesteur mésophile (35-38°C)
 * N'invente pas de mesures présentées comme réelles : chaque trame est explicitement étiquetée "simulation".
 */
class TelemetrySimulator {
  constructor() {
    this.timer = null;
    this.intervalMs = 5000; // Fréquence de simulation : 5 secondes
    this.isRunning = false;
    
    // État interne simulé
    this.state = {
      baseTemperature: 36.8, // Plage mésophile optimale
      tempVariance: 0.0,
      pressureHpa: 82.5,
      slurryLevelPct: 64.0,
      wasteMassKg: 14.5,
      cumulativeBiogasM3: 2.85,
      cumulativeElecKwh: 1.78,
      anomalyActive: null, // 'temp_high', 'pressure_spike', 'disconnected'
      cycleTick: 0
    };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('⚡ Simulateur EcoCharge démarré (période: ' + (this.intervalMs / 1000) + 's)');
    
    this.timer = setInterval(() => {
      this.tick();
    }, this.intervalMs);

    // Premier tick immédiat
    this.tick();
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('🛑 Simulateur EcoCharge mis en pause.');
  }

  triggerAnomaly(type) {
    this.state.anomalyActive = type;
    console.log(`⚠️ Anomalie simulée déclenchée : ${type}`);
    // Auto-réinitialisation après 30 secondes pour retrouver un comportement stable
    setTimeout(() => {
      if (this.state.anomalyActive === type) {
        this.state.anomalyActive = null;
        console.log(`✅ Anomalie simulée réinitialisée : ${type}`);
      }
    }, 30000);
  }

  clearAnomaly() {
    this.state.anomalyActive = null;
  }

  async tick() {
    try {
      this.state.cycleTick++;
      const t = this.state.cycleTick;

      // Si anomalie "déconnexion simulée", on saute la trame pour tester la détection de perte de flux
      if (this.state.anomalyActive === 'disconnected') {
        return;
      }

      // Évolution thermodynamique naturelle avec micro-bruit
      let currentTemp = this.state.baseTemperature + Math.sin(t / 15) * 0.8 + (Math.random() - 0.5) * 0.15;
      let currentPressure = this.state.pressureHpa + Math.cos(t / 20) * 4.0 + (Math.random() - 0.5) * 0.8;
      let currentLevel = this.state.slurryLevelPct + Math.sin(t / 50) * 1.5;

      // Injection d'anomalies pédagogiques si demandées
      if (this.state.anomalyActive === 'temp_high') {
        currentTemp = 43.5; // Dépasse le seuil mésophile 40°C
      } else if (this.state.anomalyActive === 'temp_low') {
        currentTemp = 28.0; // En dessous de 30°C
      } else if (this.state.anomalyActive === 'pressure_spike') {
        currentPressure = 165.0; // Dépasse le seuil 150 hPa
      }

      // Production de biogaz incrémentale
      // Hypothèse : ~0.0008 m³ toutes les 5 secondes en régime moyen
      const instantProductionM3 = 0.0006 + Math.random() * 0.0004;
      this.state.cumulativeBiogasM3 += instantProductionM3;

      // Énergie électrique issue de la conversion (rendement génératrice ~30-35%, 1m³ gaz ~ 2 kWh électrique)
      const instantElecKwh = instantProductionM3 * 1.95;
      this.state.cumulativeElecKwh += instantElecKwh;

      const record = {
        device_id: 'SIMULATOR_VIRTUAL',
        data_source: 'simulation',
        temperature_c: Number(currentTemp.toFixed(1)),
        pressure_value: Number(currentPressure.toFixed(1)),
        level_value: Number(currentLevel.toFixed(1)),
        waste_mass_kg: Number(this.state.wasteMassKg.toFixed(2)),
        biogas_volume_m3: Number(this.state.cumulativeBiogasM3.toFixed(3)),
        electrical_energy_kwh: Number(this.state.cumulativeElecKwh.toFixed(3)),
        raw_json: JSON.stringify({
          source: 'Simulateur logiciel EcoCharge',
          simulation_profile: 'Digestion anaérobie mésophile',
          anomaly: this.state.anomalyActive || 'none'
        })
      };

      // Insertion en base
      await run(
        `INSERT INTO telemetry 
         (device_id, data_source, temperature_c, pressure_value, level_value, waste_mass_kg, biogas_volume_m3, electrical_energy_kwh, raw_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.device_id,
          record.data_source,
          record.temperature_c,
          record.pressure_value,
          record.level_value,
          record.waste_mass_kg,
          record.biogas_volume_m3,
          record.electrical_energy_kwh,
          record.raw_json
        ]
      );

      // Évaluation des alertes
      await evaluateTelemetry(record);

      // Garder la table télémétrie propre (conserver les 2000 dernières mesures max)
      const totalCount = await get('SELECT COUNT(*) as cnt FROM telemetry');
      if (totalCount && totalCount.cnt > 2500) {
        await run(`DELETE FROM telemetry WHERE id IN (SELECT id FROM telemetry ORDER BY id ASC LIMIT 500)`);
      }

    } catch (err) {
      console.error('Erreur tick simulateur:', err.message);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      anomalyActive: this.state.anomalyActive,
      lastValues: {
        temp: this.state.baseTemperature,
        pressure: this.state.pressureHpa,
        biogasM3: this.state.cumulativeBiogasM3,
        elecKwh: this.state.cumulativeElecKwh
      }
    };
  }
}

const simulatorInstance = new TelemetrySimulator();

module.exports = {
  simulator: simulatorInstance
};
