const { all, get } = require('../db/database');

/**
 * Module Prédictif & Analyse de Tendances EcoCharge (IA v1)
 * 
 * NOTE PÉDAGOGIQUE & DÉONTOLOGIE :
 * Ce module implémente une première approche hybride (modélisation bio-cinétique de méthanisation
 * combinée à une régression temporelle glissante).
 * Il ne prétend pas remplacer un modèle Deep Learning ou Random Forest entraîné sur plusieurs mois réels,
 * mais pose les bases mathématiques et d'architecture pour l'entraînement futur.
 */
class BioEnergyPredictor {
  constructor() {
    this.modelName = "EcoCharge-BioKinetic-Heuristic-v1";
    this.status = "experimental";
  }

  /**
   * Facteurs de rendement théoriques de référence (m³ biogaz / kg de matière fraîche)
   * Selon littérature méthanisation mésophile (ADEME / INRAE)
   */
  getSpecificBiogasYields() {
    return {
      'Déchets alimentaires': 0.42, // Riche en glucides et lipides
      'Déchets végétaux': 0.22,     // Cellulose plus lente à dégrader
      'Résidus agricoles': 0.18,    // Lignocellulose
      'Autre matière organique': 0.25
    };
  }

  /**
   * Analyse des facteurs d'influence actuels
   */
  async analyzeFactors() {
    // 1. Température moyenne sur les dernières 24h
    const tempStats = await get(`
      SELECT AVG(temperature_c) as avg_temp, MIN(temperature_c) as min_temp, MAX(temperature_c) as max_temp
      FROM telemetry 
      WHERE timestamp >= datetime('now', '-24 hours') AND temperature_c IS NOT NULL
    `);

    // 2. Total des déchets introduits sur les 7 derniers jours
    const wasteRecent = await all(`
      SELECT type, SUM(mass_kg) as total_kg
      FROM waste_entries
      WHERE timestamp >= datetime('now', '-7 days')
      GROUP BY type
    `);

    const yields = this.getSpecificBiogasYields();
    let totalTheoreticalBiogas = 0;
    let totalWasteKg = 0;

    const breakdown = wasteRecent.map(w => {
      const specificYield = yields[w.type] || 0.25;
      const expectedBiogas = w.total_kg * specificYield;
      totalTheoreticalBiogas += expectedBiogas;
      totalWasteKg += w.total_kg;
      return {
        type: w.type,
        massKg: Number(w.total_kg.toFixed(1)),
        specificYieldM3PerKg: specificYield,
        expectedPotentialM3: Number(expectedBiogas.toFixed(2))
      };
    });

    const avgTemp = tempStats?.avg_temp ? Number(tempStats.avg_temp.toFixed(1)) : 37.0;

    // Coefficient d'efficacité thermique f(T) - Pic mésophile à 37°C
    // f(T) = exp(-((T - 37)^2) / 30)
    const thermalEfficiency = Math.max(0.2, Math.min(1.0, Math.exp(-Math.pow(avgTemp - 37.0, 2) / 35.0)));

    return {
      model: this.modelName,
      status: this.status,
      thermalFactor: {
        averageTempC: avgTemp,
        temperatureEfficiencyPct: Math.round(thermalEfficiency * 100),
        optimalRangeC: "35°C - 38°C",
        diagnostic: avgTemp >= 35 && avgTemp <= 38 
          ? "Régime mésophile optimal, activité méthanogène maximale."
          : avgTemp < 35 
            ? "Température sous-optimale : cinétique bactérienne ralentie."
            : "Température élevée : risque pour la flore mésophile."
      },
      feedstockFactor: {
        totalWasteLoaded7DaysKg: Number(totalWasteKg.toFixed(1)),
        theoreticalBiogasPotentialM3: Number((totalTheoreticalBiogas * thermalEfficiency).toFixed(2)),
        breakdown
      },
      confidenceScore: totalWasteKg > 10 ? 0.78 : 0.45,
      disclaimer: "Modèle heuristique de pré-version. Nécessite 60+ jours de mesures physiques réelles pour calibrer un modèle ML supervisé."
    };
  }

  /**
   * Prévision de production sur les prochaines 48 heures (par pas de 6h)
   */
  async forecastProduction() {
    const factors = await this.analyzeFactors();
    const latestTelemetry = await get(`
      SELECT biogas_volume_m3, electrical_energy_kwh 
      FROM telemetry 
      ORDER BY id DESC LIMIT 1
    `);

    const currentBiogas = latestTelemetry?.biogas_volume_m3 || 2.8;
    const currentElec = latestTelemetry?.electrical_energy_kwh || 1.8;

    // Taux moyen estimé de production par heure
    const hourlyBiogasRate = (factors.feedstockFactor.theoreticalBiogasPotentialM3 / (7 * 24)) * (factors.thermalFactor.temperatureEfficiencyPct / 100);
    const hourlyElecRate = hourlyBiogasRate * 1.9; // 1 m³ ~ 1.9 kWh élec

    const points = [];
    for (let h = 6; h <= 48; h += 6) {
      const predBiogas = Number((currentBiogas + hourlyBiogasRate * h).toFixed(3));
      const predElec = Number((currentElec + hourlyElecRate * h).toFixed(3));
      
      points.push({
        horizonHours: `+${h}h`,
        timestamp: new Date(Date.now() + h * 3600 * 1000).toISOString(),
        predictedBiogasM3: predBiogas,
        predictedElectricityKwh: predElec,
        lowerConfidenceBoundKwh: Number((predElec * 0.88).toFixed(3)),
        upperConfidenceBoundKwh: Number((predElec * 1.12).toFixed(3))
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      model: this.modelName,
      confidenceScorePct: Math.round(factors.confidenceScore * 100),
      currentValues: {
        biogasM3: currentBiogas,
        electricityKwh: currentElec
      },
      forecastCurve: points,
      insights: [
        `Production estimée à +48h : ~${points[points.length - 1].predictedBiogasM3} m³ (${points[points.length - 1].predictedElectricityKwh} kWh).`,
        `Sensibilité thermique : l'efficacité est évaluée à ${factors.thermalFactor.temperatureEfficiencyPct}% à ${factors.thermalFactor.averageTempC}°C.`,
        `Garantie scientifique : Prévision basée sur cinétique biologique de première approche. Données d'entraînement en cours de collecte.`
      ]
    };
  }
}

const predictorInstance = new BioEnergyPredictor();

module.exports = {
  predictor: predictorInstance
};
