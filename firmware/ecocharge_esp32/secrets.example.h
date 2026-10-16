#ifndef ECOCHARGE_SECRETS_H
#define ECOCHARGE_SECRETS_H

// =============================================================================
// ECOCHARGE — EXEMPLE DE CONFIGURATION SECRÈTE (WIFI & SERVEUR)
// ⚠️ Renommez ce fichier en "secrets.h" et renseignez vos paramètres locaux.
// Ne validez JAMAIS vos mots de passe réels dans Git.
// =============================================================================

// Paramètres du réseau Wi-Fi local
#define WIFI_SSID "Mon_Reseau_WiFi"
#define WIFI_PASSWORD "Mon_Mot_De_Passe_Secret"

// Adresse du serveur EcoCharge Backend
// Note pour machine locale : utilisez l'IP de votre PC (ex: "192.168.1.50"), jamais "localhost" sur l'ESP32.
#define API_SERVER_URL "http://192.168.1.50:4000/api/telemetry"

// Clé ou Jeton d'authentification matériel (optionnel en réseau local sécurisé)
#define API_AUTH_TOKEN "ecocharge_esp32_device_token"

#endif // ECOCHARGE_SECRETS_H
