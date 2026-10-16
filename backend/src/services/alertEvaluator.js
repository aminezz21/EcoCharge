const { run, get, all } = require('../db/database');

/**
 * Moteur d'évaluation des alertes et anomalies
 * Analyse les données de télémétrie par rapport aux seuils configurés
 */
async function evaluateTelemetry(telemetry) {
  try {
    const sensors = await all('SELECT * FROM sensors WHERE enabled = 1');

    for (const sensor of sensors) {
      let value = null;
      let fieldName = '';

      switch (sensor.id) {
        case 'temp_reactor':
          value = telemetry.temperature_c;
          fieldName = 'Température';
          break;
        case 'pressure_gas':
          value = telemetry.pressure_value;
          fieldName = 'Pression biogaz';
          break;
        case 'level_slurry':
          value = telemetry.level_value;
          fieldName = 'Niveau de matière';
          break;
        case 'waste_scale':
          value = telemetry.waste_mass_kg;
          fieldName = 'Masse intrants';
          break;
        case 'flow_biogas':
          value = telemetry.biogas_volume_m3;
          fieldName = 'Volume de biogaz';
          break;
        case 'energy_meter':
          value = telemetry.electrical_energy_kwh;
          fieldName = 'Énergie électrique';
          break;
      }

      if (value !== null && value !== undefined) {
        // Mettre à jour la dernière valeur et l'état
        let status = 'ok';

        // Vérification seuil critique haut
        if (sensor.max_threshold !== null && value > sensor.max_threshold) {
          status = 'critical';
          const title = `${fieldName} anormalement élevée (${value} ${sensor.unit})`;
          const description = `La valeur ${value} ${sensor.unit} dépasse le seuil maximal configuré (${sensor.max_threshold} ${sensor.unit}). Risque de surpression ou surchauffe.`;

          // Créer l'alerte si aucune alerte active similaire
          const activeAlert = await get(
            "SELECT id FROM alerts WHERE type = ? AND status = 'active'",
            [sensor.id]
          );

          if (!activeAlert) {
            await run(
              `INSERT INTO alerts (type, level, title, description, status, source)
               VALUES (?, 'critical', ?, ?, 'active', ?)`,
              [sensor.id, title, description, telemetry.data_source || 'system']
            );
          }
        } 
        // Vérification seuil critique bas
        else if (sensor.min_threshold !== null && value < sensor.min_threshold) {
          status = 'warning';
          const title = `${fieldName} en dessous du seuil minimal (${value} ${sensor.unit})`;
          const description = `La valeur ${value} ${sensor.unit} est inférieure au seuil minimal configuré (${sensor.min_threshold} ${sensor.unit}). Risque de ralentissement de l'activité bactérienne méthanogène.`;

          const activeAlert = await get(
            "SELECT id FROM alerts WHERE type = ? AND status = 'active'",
            [sensor.id]
          );

          if (!activeAlert) {
            await run(
              `INSERT INTO alerts (type, level, title, description, status, source)
               VALUES (?, 'warning', ?, ?, 'active', ?)`,
              [sensor.id, title, description, telemetry.data_source || 'system']
            );
          }
        } else {
          // Valeur dans la plage normale : résoudre les alertes actives de ce capteur si existantes
          await run(
            "UPDATE alerts SET status = 'resolved', resolved_at = datetime('now') WHERE type = ? AND status = 'active'",
            [sensor.id]
          );
        }

        // Mettre à jour l'état du capteur en base
        await run(
          "UPDATE sensors SET last_value = ?, last_seen = datetime('now'), status = ? WHERE id = ?",
          [value, status, sensor.id]
        );
      }
    }
  } catch (error) {
    console.error('Erreur lors de l’évaluation des alertes:', error.message);
  }
}

module.exports = {
  evaluateTelemetry
};
