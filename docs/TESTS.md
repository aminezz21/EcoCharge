# 🧪 Guide de Test & Scénarios de Validation Jury

Ce document présente la stratégie de validation du projet **EcoCharge**, couvrant les tests unitaires d'API, le mode simulation et les scénarios de démonstration pour le jury académique.

---

## 1. Test Rapide de Santé de l'API

Exécutez dans un terminal ou via PowerShell :

```powershell
curl http://localhost:4000/api/health
```

**Réponse attendue :**
```json
{
  "status": "online",
  "system": "EcoCharge API Server",
  "version": "1.0.0",
  "simulator": {
    "isRunning": true
  }
}
```

---

## 2. Test d'Ingestion Télémétrie Simulant un ESP32

Envoyez une trame avec `curl` pour vérifier que le backend accepte les données matérielles :

```powershell
curl -X POST http://localhost:4000/api/telemetry `
  -H "Content-Type: application/json" `
  -d '{
    "device_id": "ECOCHARGE_001",
    "mode": "hardware",
    "sensors": {
      "temperature_c": 37.2,
      "pressure_value": 92.0,
      "waste_mass_kg": null,
      "biogas_volume_m3": 1.15,
      "electrical_energy_kwh": null
    }
  }'
```

**Comportement attendu sur le dashboard :**
1. Le badge supérieur passe immédiatement à **« MATÉRIEL CONNECTÉ (ESP32) »**.
2. L'indicateur de liaison indique **« En ligne »**.

---

## 3. Scénarios de Démonstration pour Jury Académique

### Scénario A : Déclenchement d'une Alerte Critique de Surpression
1. Sur le tableau de bord, cliquez sur le bouton **« ⚡ Test Surpression »**.
2. Le simulateur injecte une pression de `165 hPa` (dépassant le seuil de 150 hPa).
3. Le compteur d'alertes passe à 1 en rouge.
4. Rendez-vous sur la page **« Centre d'Alertes »** : l'alerte critique apparaît avec l'heure exacte.
5. Cliquez sur **« Acquitter »** pour valider la procédure d'intervention opérateur.

### Scénario B : Saisie d'un Nouvel Apport de Déchets & Export CSV
1. Rendez-vous sur la page **« Gestion des Déchets »**.
2. Remplissez le formulaire : `Déchets alimentaires`, `12.5 kg`, `Restaurant universitaire`.
3. Cliquez sur **« Valider l'Apport »** : la masse cumulée se met à jour immédiatement sur le dashboard.
4. Cliquez sur **« Exporter CSV »** : le fichier `ecocharge_dechets_XXXX.csv` est téléchargé instantanément.

### Scénario C : Évaluation de l'IA & Prédiction à +48h
1. Rendez-vous sur la page **« Module IA & Prédiction »**.
2. Observez l'indice d'efficacité thermique calculé selon la température actuelle (ex: 94% à 36.8°C).
3. Visualisez la projection de production volumique et électrique pour les 48 prochaines heures.
