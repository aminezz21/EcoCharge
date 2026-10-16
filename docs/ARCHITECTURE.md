# 🏛️ Architecture Technique & Pédagogique — EcoCharge

## 1. Vue d'Ensemble du Flux

```
[ Déchets Organiques ]
          │
          ▼
   [ Biodigesteur ] ─────── (DS18B20 Température, MPX5050DP Pression, Ultrasons Niveau)
          │                                  │
          ▼                                  ▼
    [ Biogaz CH4 ]                     [ ESP32 MCU ]
          │                                  │ (Wi-Fi 802.11 b/g/n - HTTP REST)
          ▼                                  ▼
[ Génératrice / Cogé ] ──── (PZEM-004T) ───▶ [ Serveur Node.js Express ]
          │                                  │
          ▼                                  ├───▶ [ Base SQLite ecocharge.db ]
   [ Électricité ]                           ├───▶ [ Simulateur Intégré ]
                                             └───▶ [ Dashboard React + Vite ]
```

---

## 2. Principes Fondamentaux de Conception

1. **Intégrité des Données & Transparence Scientifique :**
   - Aucune grandeur mesurée n'est inventée ou maquillée.
   - Les données issues du modèle mathématique portent obligatoirement l'étiquette **« DONNÉES SIMULÉES »**.
   - Lorsque des capteurs physiques ne sont pas raccordés, l'ESP32 émet des valeurs `null`.

2. **Sécurité Passive & Non-Intrusive :**
   - L'application web est un système de **supervision et monitoring**.
   - Aucun actionneur d'allumage ou d'ouverture de vanne n'est commandable à distance par l'interface web, prévenant tout risque d'incident industriel.
   - La régulation physique de sécurité repose exclusivement sur des soupapes mécaniques certifiées.

3. **Modularité & Découplage :**
   - Le frontend Vite/React communique exclusivement via l'API REST documentée.
   - Le backend Express intègre une base locale SQLite sans configuration de serveur externe.
   - L'architecture prépare l'intégration d'un broker MQTT et de modèles d'IA prédictifs avancés.
