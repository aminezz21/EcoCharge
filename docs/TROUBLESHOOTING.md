# 🛠️ Guide de Dépannage (Troubleshooting) — EcoCharge

Ce guide recense les difficultés courantes rencontrées lors de l'exécution locale ou du raccordement de l'ESP32, avec leurs solutions directes.

---

## 1. Port 4000 déjà utilisé (EADDRINUSE)
- **Symptôme** : Le serveur Node.js affiche `Error: listen EADDRINUSE: address already in use :::4000`.
- **Solution** :
  - Sous Windows PowerShell, trouvez et tuez le processus occupant le port :
    ```powershell
    Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force
    ```
  - Ou modifiez `PORT=4001` dans `backend/.env`.

---

## 2. L'ESP32 n'arrive pas à joindre le serveur Node.js
- **Symptômes fréquents** :
  - L'ESP32 affiche `HTTP response code: -1` ou `Connection failed`.
- **Causes & Vérifications** :
  1. **Avez-vous écrit `localhost` dans l'URL de l'ESP32 ?**
     - ❌ `http://localhost:4000/api/telemetry` ne marchera pas sur l'ESP32.
     - ✅ Utilisez l'adresse IP locale de votre PC : tapez `ipconfig` dans votre invite de commande Windows (ex: `http://192.168.1.45:4000/api/telemetry`).
  2. **Pare-feu Windows Defender** :
     - Le pare-feu bloque parfois les connexions entrantes sur le port 4000. Autorisez temporairement Node.js dans le pare-feu ou testez en partage de connexion 4G.
  3. **Réseau Wi-Fi d'établissement ou d'université** :
     - Les réseaux universitaires (type Eduroam) bloquent souvent la communication directe entre deux appareils (isolation client).
     - **Solution conseillée pour démo** : Connectez votre PC et votre ESP32 sur le partage de connexion Wi-Fi de votre smartphone.

---

## 3. Le DS18B20 renvoie -127°C ou 85°C
- **85°C** : La conversion de température n'a pas eu le temps de s'achever (délai de 750ms nécessaire en résolution 12 bits).
- **-127°C** : La liaison OneWire est coupée ou la résistance de rappel (pull-up de 4.7 kΩ entre DATA et 3.3V) est absente.

---

## 4. Réinitialiser la Base de Données SQLite
Pour repartir d'un jeu de données propre :
1. Arrêtez le backend.
2. Supprimez le fichier `database/ecocharge.db`.
3. Relancez `node server.js` dans le dossier backend : le schéma et les données initiales seront automatiquement recréés à neuf.
