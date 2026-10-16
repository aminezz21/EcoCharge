# 📡 Firmware ESP32 EcoCharge — Guide de Compilation & Câblage

Ce sous-dossier contient le firmware officiel pour le microcontrôleur **ESP32 NodeMCU / ESP32-WROOM-32** supervisant le biodigesteur expérimental EcoCharge.

---

## 1. Matériel & Broches Recommandées (Pinout)

| Capteur / Périphérique | Rôle | Broche ESP32 (GPIO) | Remarque |
| :--- | :--- | :--- | :--- |
| **DS18B20 (Étanche)** | Température cuve | **GPIO 4** | Bus OneWire, résistance pull-up 4.7kΩ obligatoire |
| **MPX5050DP / 0-5V** | Pression de biogaz | **GPIO 34 (ADC1)** | Pont diviseur de tension pour ne pas dépasser 3.3V |
| **YF-S401 (Gaz)** | Débitmètre à impulsion | **GPIO 23** | Interruption matérielle `attachInterrupt` |
| **PZEM-004T / INA219**| Mesure énergie électrique| **GPIO 21 (SDA) / 22 (SCL)** | Bus I2C ou UART selon module |
| **LED Statut** | Diagnostic visuel | **GPIO 2** | Clignote si Wi-Fi en recherche, allumée si connecté |

---

## 2. Bibliothèques Nécessaires (Arduino IDE)

Installez les bibliothèques suivantes via le Gestionnaire de Bibliothèques d'Arduino IDE (`Ctrl+Maj+I`) :
1. **ArduinoJson** (par Benoît Blanchon) — version `6.x`
2. **OneWire** (par Paul Stoffregen)
3. **DallasTemperature** (par Miles Burton)

---

## 3. Configuration & Téléversement

1. Dupliquez le fichier `secrets.example.h` et nommez-le `secrets.h` :
   ```cpp
   #define WIFI_SSID "Votre_Nom_WiFi"
   #define WIFI_PASSWORD "Votre_Mot_De_Passe"
   #define API_SERVER_URL "http://192.168.1.X:4000/api/telemetry"
   ```
   > ⚠️ **Important** : Remplacez `192.168.1.X` par l'adresse IP locale de l'ordinateur exécutant le serveur Node.js (obtenue avec `ipconfig` sous Windows). N'utilisez pas `localhost` car l'ESP32 s'adresserait à lui-même.

2. Branchez votre ESP32 en USB.
3. Sélectionnez la carte : **ESP32 Dev Module** et le port COM approprié.
4. Vitesse du moniteur série : **115200 bauds**.
5. Cliquez sur **Téléverser**.

---

## 4. Règles de Sécurité Physique

- **Ne jamais insérer de fils sous tension dans un environnement gazeux explosif sans encapsulation étanche (norme ATEX).**
- L'ESP32 doit être logé dans un boîtier étanche IP65 **à distance sécurisée** du ciel gazeux.
- Les données non mesurées sont automatiquement émises avec la valeur `null` et ne sont jamais inventées.
