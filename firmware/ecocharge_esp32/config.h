#ifndef ECOCHARGE_CONFIG_H
#define ECOCHARGE_CONFIG_H

// =============================================================================
// ECOCHARGE — CONFIGURATION DU FIRMWARE ESP32
// Projet pédagogique IoT & Valorisation énergétique
// =============================================================================

// Identification unique de la station de mesure
#define DEVICE_ID "ECOCHARGE_001"
#define FIRMWARE_VERSION "1.0.0"

// Mode de fonctionnement par défaut
// "hardware" : mesures réelles issues des capteurs physiques
#define TELEMETRY_MODE "hardware"

// -----------------------------------------------------------------------------
// ASSIGNATION DES BROCHES (PINOUT ESP32 WROOM-32)
// -----------------------------------------------------------------------------
// Capteur de Température OneWire (DS18B20 pour biodigesteur étanche)
#define PIN_ONEWIRE_TEMP 4

// Capteur de Pression analogique (Transducteur 0-5V ou 0-3.3V, ex: 0-1.2 MPa ou MPX5050DP)
#define PIN_PRESSURE_ADC 34

// Capteur de Masse / Poids (Module HX711 pour cellule de charge déchetterie)
#define PIN_HX711_DOUT 19
#define PIN_HX711_SCK  18

// Capteur de Débit Biogaz (Débitmètre à impulsion / effet Hall ou anémomètre thermique)
#define PIN_FLOW_SENSOR 23

// Capteur de Courant / Énergie électrique (Module ACS712 ou PZEM-004T / INA219 via I2C)
#define PIN_I2C_SDA 21
#define PIN_I2C_SCL 22

// LED de statut de diagnostic (LED embarquée ou externe)
#define PIN_LED_STATUS 2

// -----------------------------------------------------------------------------
// PARAMÈTRES D'ACQUISITION ET D'ENVOI
// -----------------------------------------------------------------------------
// Intervalle de lecture et transmission (en millisecondes) : 10000ms = 10s
#define TELEMETRY_INTERVAL_MS 10000

// Timeout de connexion HTTP (en millisecondes)
#define HTTP_TIMEOUT_MS 5000

// Tentatives maximales de reconnexion Wi-Fi avant temporisation
#define WIFI_MAX_RETRY 20

// -----------------------------------------------------------------------------
// CALIBRATION & LIMITES SÉCURITÉ INDICATIVES
// -----------------------------------------------------------------------------
#define TEMP_MIN_PLAUSIBLE 5.0f
#define TEMP_MAX_PLAUSIBLE 65.0f
#define PRESSURE_MAX_SAFETY_HPA 200.0f // Limite indicative avant décharge de sécurité

#endif // ECOCHARGE_CONFIG_H
