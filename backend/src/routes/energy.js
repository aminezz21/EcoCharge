const express = require('express');
const router = express.Router();
const { get, all } = require('../db/database');

// GET /api/energy/summary (Synthèse énergétique avec distinction stricte mesuré / estimé / simulé)
router.get('/summary', async (req, res) => {
  try {
    // 1. Télémétrie la plus récente
    const latest = await get(`SELECT * FROM telemetry ORDER BY id DESC LIMIT 1`);

    // 2. Vérifier si du matériel physique a émis
    const hardwareCount = await get(`SELECT COUNT(*) as count FROM telemetry WHERE data_source = 'hardware'`);
    const hasHardwareData = hardwareCount && hardwareCount.count > 0;

    // 3. Totaux par source
    const hardwareTotals = await get(`
      SELECT 
        MAX(electrical_energy_kwh) - MIN(electrical_energy_kwh) as delta_elec_kwh,
        MAX(biogas_volume_m3) - MIN(biogas_volume_m3) as delta_gas_m3
      FROM telemetry 
      WHERE data_source = 'hardware'
    `);

    const simulatedTotals = await get(`
      SELECT 
        MAX(electrical_energy_kwh) as current_elec_kwh,
        MAX(biogas_volume_m3) as current_gas_m3
      FROM telemetry 
      WHERE data_source = 'simulation'
    `);

    // 4. Calculs de rendements rigoureux selon disponibilité physique
    // Biogaz standard : ~60% CH4 -> Pouvoir Calorifique Inférieur (PCI) ≈ 6.0 kWh / m³
    // Si moteur/génératrice électrique : rendement théorique 30 - 35%
    const currentGas = latest ? latest.biogas_volume_m3 || 0 : 0;
    const currentElec = latest ? latest.electrical_energy_kwh || 0 : 0;

    // Rendement thermodynamique global (uniquement calculable si gaz et électricité sont mesurés)
    let calculatedEfficiency = null;
    let efficiencyNote = "Mesures directes de débit de gaz requises pour certification du rendement.";

    if (currentGas > 0 && currentElec > 0) {
      const thermalInputKwh = currentGas * 6.0; // PCI biogaz
      if (thermalInputKwh > 0) {
        calculatedEfficiency = Number(((currentElec / thermalInputKwh) * 100).toFixed(1));
        if (latest?.data_source === 'simulation') {
          efficiencyNote = "Rendement calculé sur données du simulateur (32.5% paramétré). Non contractuel.";
        } else {
          efficiencyNote = "Rendement électrique estimé sur équipement expérimental connecté.";
        }
      }
    }

    // Statistiques par période
    const dayStats = await get(`
      SELECT 
        COUNT(*) as samples,
        MAX(electrical_energy_kwh) - MIN(electrical_energy_kwh) as prod_kwh,
        MAX(biogas_volume_m3) - MIN(biogas_volume_m3) as prod_m3
      FROM telemetry
      WHERE timestamp >= datetime('now', '-24 hours')
    `);

    const weekStats = await get(`
      SELECT 
        COUNT(*) as samples,
        MAX(electrical_energy_kwh) - MIN(electrical_energy_kwh) as prod_kwh,
        MAX(biogas_volume_m3) - MIN(biogas_volume_m3) as prod_m3
      FROM telemetry
      WHERE timestamp >= datetime('now', '-7 days')
    `);

    res.json({
      hasHardwareData,
      currentDataSource: latest?.data_source || 'aucun',
      latestMeasurement: {
        timestamp: latest?.timestamp || null,
        biogasM3: currentGas,
        electricalEnergyKwh: currentElec,
        isSimulated: latest?.data_source === 'simulation'
      },
      efficiency: {
        valuePct: calculatedEfficiency,
        note: efficiencyNote,
        isTheoretical: latest?.data_source === 'simulation'
      },
      productionPeriods: {
        last24h: {
          elecKwh: Number((dayStats?.prod_kwh || 0).toFixed(3)),
          gasM3: Number((dayStats?.prod_m3 || 0).toFixed(3)),
          samples: dayStats?.samples || 0
        },
        last7d: {
          elecKwh: Number((weekStats?.prod_kwh || 0).toFixed(3)),
          gasM3: Number((weekStats?.prod_m3 || 0).toFixed(3)),
          samples: weekStats?.samples || 0
        }
      },
      hardwareTotals: hasHardwareData ? {
        measuredElecKwh: Number((hardwareTotals?.delta_elec_kwh || 0).toFixed(3)),
        measuredGasM3: Number((hardwareTotals?.delta_gas_m3 || 0).toFixed(3))
      } : null,
      simulatedTotals: {
        totalElecKwh: Number((simulatedTotals?.current_elec_kwh || 0).toFixed(3)),
        totalGasM3: Number((simulatedTotals?.current_gas_m3 || 0).toFixed(3))
      }
    });
  } catch (err) {
    console.error('Erreur energy summary:', err);
    res.status(500).json({ error: 'Erreur lors de la synthèse énergétique' });
  }
});

// GET /api/energy/history (Série temporelle comparative biogaz / électricité)
router.get('/history', async (req, res) => {
  try {
    const range = req.query.range || '24h';
    let timeFilter = "timestamp >= datetime('now', '-24 hours')";
    if (range === '7d') timeFilter = "timestamp >= datetime('now', '-7 days')";
    else if (range === '30d') timeFilter = "timestamp >= datetime('now', '-30 days')";

    const points = await all(`
      SELECT id, timestamp, data_source, biogas_volume_m3, electrical_energy_kwh
      FROM telemetry
      WHERE ${timeFilter} AND (biogas_volume_m3 IS NOT NULL OR electrical_energy_kwh IS NOT NULL)
      ORDER BY id ASC
      LIMIT 150
    `);

    res.json({ points });
  } catch (err) {
    console.error('Erreur energy history:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de l’historique énergétique' });
  }
});

// GET /api/energy/export (Export CSV des bilans énergétiques)
router.get('/export', async (req, res) => {
  try {
    const points = await all(`
      SELECT id, timestamp, data_source, biogas_volume_m3, electrical_energy_kwh
      FROM telemetry
      ORDER BY timestamp DESC
    `);

    let csv = 'ID,Date_Heure,Source_Donnees,Biogaz_Cumule_m3,Electricite_Cumulee_kWh,Statut_Authenticite\n';
    points.forEach(p => {
      const auth = p.data_source === 'hardware' ? 'MESURE_PHYSIQUE_REELLE' : 'DONNEE_SIMULEE';
      csv += `${p.id},"${p.timestamp}","${p.data_source}",${p.biogas_volume_m3 || 0},${p.electrical_energy_kwh || 0},"${auth}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ecocharge_bilan_energetique.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Erreur energy export:', err);
    res.status(500).json({ error: 'Erreur export CSV énergie' });
  }
});

module.exports = router;
