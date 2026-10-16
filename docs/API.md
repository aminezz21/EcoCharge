# 📚 Documentation des Points d'Entrée API REST — EcoCharge

Serveur local par défaut : `http://localhost:4000`

---

## 1. Authentification

### `POST /api/auth/login`
- **Description** : Authentification d'un opérateur ou administrateur.
- **Corps de la requête (JSON)** :
  ```json
  {
    "email": "etudiant@ecocharge.local",
    "password": "EcoCharge2026!"
  }
  ```
- **Réponse (200 OK)** :
  ```json
  {
    "message": "Connexion réussie",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "EtudiantIoT",
      "email": "etudiant@ecocharge.local",
      "role": "administrateur"
    }
  }
  ```

---

## 2. Ingestion & Télémétrie IoT

### `POST /api/telemetry`
- **Description** : Point d'entrée pour l'ESP32 et les postes de télémétrie.
- **Corps de la requête (JSON)** :
  ```json
  {
    "device_id": "ECOCHARGE_001",
    "mode": "hardware",
    "sensors": {
      "temperature_c": 36.5,
      "pressure_value": 85.2,
      "level_value": null,
      "waste_mass_kg": null,
      "biogas_volume_m3": 1.25,
      "electrical_energy_kwh": null
    }
  }
  ```
- **Réponse (201 Created)** :
  ```json
  {
    "status": "success",
    "inserted_id": 42,
    "timestamp": "2026-10-13T19:00:00.000Z"
  }
  ```

### `GET /api/telemetry/latest`
- **Description** : Récupère la dernière trame enregistrée, le statut en ligne/hors ligne et les alertes actives.

### `GET /api/telemetry/history?range=24h&source=simulation`
- **Description** : Récupère la série temporelle filtrée par durée (`1h`, `6h`, `24h`, `7d`, `all`) et source (`hardware`, `simulation`).

---

## 3. Capteurs

### `GET /api/sensors`
- **Description** : Liste tous les capteurs avec état nominal/critique, unité et seuils actuels.

### `PUT /api/sensors/:id` *(Nécessite JWT)*
- **Description** : Modifie le nom, l'activation (0/1) ou les seuils min/max.

---

## 4. Gestion des Déchets

### `GET /api/waste`
- **Description** : Liste les intrants enregistrés.

### `POST /api/waste` *(Nécessite JWT)*
- **Description** : Enregistre un chargement de matière organique.
  ```json
  {
    "type": "Déchets alimentaires",
    "mass_kg": 12.5,
    "source": "Restaurant universitaire",
    "notes": "Épluchures de légumes broyées"
  }
  ```

### `GET /api/waste/stats`
- **Description** : Totaux journaliers, hebdomadaires, mensuels et répartition par type.

### `GET /api/waste/export`
- **Description** : Téléchargement du fichier CSV d'export.

---

## 5. Énergie & Rendements

### `GET /api/energy/summary`
- **Description** : Bilan de production de biogaz et électricité avec distinction strict mesuré/simulé.

### `GET /api/energy/export`
- **Description** : Téléchargement du bilan énergétique au format CSV.

---

## 6. Simulateur & Tests Jury

### `POST /api/simulator/toggle` *(Nécessite JWT)*
- **Description** : Active ou désactive le moteur de simulation logicielle.

### `POST /api/simulator/anomaly` *(Nécessite JWT)*
- **Description** : Injecte une anomalie de test pour démonstration.
  ```json
  {
    "type": "temp_high" // 'temp_high', 'temp_low', 'pressure_spike', 'disconnected', 'clear'
  }
  ```
