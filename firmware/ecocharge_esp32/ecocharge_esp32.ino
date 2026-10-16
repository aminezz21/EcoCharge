/**
 * =============================================================================
 * ECOCHARGE — FIRMWARE ESP32 POUR SUPERVISION BIODIGESTEUR
 * =============================================================================
 * 
 * Microcontrôleur : ESP32 NodeMCU / WROOM-32
 * Rôle : Acquisition sécurisée multi-capteurs, validation des mesures physiques,
 *        formatage JSON conforme et transmission REST vers le serveur EcoCharge.
 * 
 * Développé pour projet académique IoT & Valorisation énergétique.
 * =============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h"

// Si vous avez créé votre propre secrets.h, décommentez l'inclusion :
#if __has_include("secrets.h")
  #include "secrets.h"
#else
  #include "secrets.example.h"
#endif

// -----------------------------------------------------------------------------
// INSTANCIATION DES PILOTES DE CAPTEURS
// -----------------------------------------------------------------------------
// 1. Capteur de température DS18B20 sur bus OneWire
OneWire oneWire(PIN_ONEWIRE_TEMP);
DallasTemperature tempSensor(&oneWire);

// 2. Compteur d'impulsions pour débitmètre biogaz (interruption matérielle)
volatile unsigned long gasPulseCount = 0;
void IRAM_ATTR onGasPulse() {
  gasPulseCount++;
}

// Variables d'état interne
unsigned long lastTelemetryMillis = 0;
float cumulativeGasVolumeM3 = 0.0f;
bool ds18b20Detected = false;

// -----------------------------------------------------------------------------
// PROTOTYPES DES FONCTIONS
// -----------------------------------------------------------------------------
void connectWiFi();
void checkWiFiConnection();
float readTemperature();
float readPressure();
float readGasFlow();
void sendTelemetryPayload();

// -----------------------------------------------------------------------------
// SETUP
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================================");
  Serial.println("🌱 ECOCHARGE — DÉMARRAGE DU FIRMWARE ESP32");
  Serial.printf("ID Dispositif : %s | Version : %s\n", DEVICE_ID, FIRMWARE_VERSION);
  Serial.println("========================================================");

  // Configuration des broches
  pinMode(PIN_LED_STATUS, OUTPUT);
  pinMode(PIN_PRESSURE_ADC, INPUT);
  pinMode(PIN_FLOW_SENSOR, INPUT_PULLUP);

  // Interruption pour le débitmètre de biogaz
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_SENSOR), onGasPulse, RISING);

  // Initialisation du capteur de température
  tempSensor.begin();
  int deviceCount = tempSensor.getDeviceCount();
  if (deviceCount > 0) {
    ds18b20Detected = true;
    Serial.printf("✅ DS18B20 détecté sur broche GPIO %d (%d capteur(s))\n", PIN_ONEWIRE_TEMP, deviceCount);
  } else {
    ds18b20Detected = false;
    Serial.printf("⚠️ Aucun DS18B20 physique détecté sur GPIO %d. La mesure sera transmise comme 'null'.\n", PIN_ONEWIRE_TEMP);
  }

  // Connexion Wi-Fi
  connectWiFi();

  Serial.println("🚀 Initialisation terminée. Entrée dans la boucle principale.");
}

// -----------------------------------------------------------------------------
// LOOP PRINCIPALE
// -----------------------------------------------------------------------------
void loop() {
  // Vérification et maintien de la liaison Wi-Fi
  checkWiFiConnection();

  // Envoi périodique de la télémétrie
  unsigned long currentMillis = millis();
  if (currentMillis - lastTelemetryMillis >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMillis = currentMillis;
    sendTelemetryPayload();
  }

  delay(50); // Petite temporisation de courtoisie pour le watchdog de l'ESP32
}

// -----------------------------------------------------------------------------
// GESTION DE LA CONNEXION WI-FI
// -----------------------------------------------------------------------------
void connectWiFi() {
  Serial.printf("📡 Connexion au réseau Wi-Fi : %s ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < WIFI_MAX_RETRY) {
    digitalWrite(PIN_LED_STATUS, !digitalRead(PIN_LED_STATUS));
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_LED_STATUS, HIGH);
    Serial.println("\n✅ Wi-Fi connecté avec succès !");
    Serial.printf("   Adresse IP attribuée : %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("   Force du signal (RSSI) : %d dBm\n", WiFi.RSSI());
  } else {
    digitalWrite(PIN_LED_STATUS, LOW);
    Serial.println("\n❌ Échec de connexion Wi-Fi. Nouvel essai au prochain cycle.");
  }
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Perte de signal Wi-Fi ! Tentative de reconnexion automatique...");
    digitalWrite(PIN_LED_STATUS, LOW);
    WiFi.reconnect();
  }
}

// -----------------------------------------------------------------------------
// LECTURE & VALIDATION DES CAPTEURS
// -----------------------------------------------------------------------------

/**
 * Lecture de la sonde de température DS18B20
 * Retourne la température en °C ou -999.0f si le capteur est absent/défaillant
 */
float readTemperature() {
  if (!ds18b20Detected) {
    return -999.0f;
  }

  tempSensor.requestTemperatures();
  float tempC = tempSensor.getTempCByIndex(0);

  // Vérification de validité (erreur de déconnexion OneWire = -127°C ou 85°C non initialisé)
  if (tempC <= -100.0f || tempC == 85.0f || tempC < TEMP_MIN_PLAUSIBLE || tempC > TEMP_MAX_PLAUSIBLE) {
    Serial.printf("⚠️ Lecture DS18B20 anormale : %.2f °C\n", tempC);
    return -999.0f;
  }

  return tempC;
}

/**
 * Lecture du transducteur de pression analogique
 * Convertit la tension ADC (0-3.3V) en pression différentielle ou absolue (hPa)
 */
float readPressure() {
  int rawAdc = analogRead(PIN_PRESSURE_ADC); // Résolution 12 bits : 0 à 4095
  float voltage = (rawAdc / 4095.0f) * 3.3f;

  // Si tension proche de 0V, vérifier si capteur réellement branché
  if (voltage < 0.1f) {
    // Capteur non connecté ou non alimenté
    return -999.0f;
  }

  // Exemple de formule linéaire pour transducteur MPX5050DP (0 à 50 kPa = 0 à 500 hPa)
  // Adaptée pour diviseur de tension 5V -> 3.3V :
  float pressureHpa = (voltage / 3.3f) * 500.0f;
  return pressureHpa;
}

/**
 * Calcul du volume de biogaz cumulé à partir des impulsions du débitmètre
 */
float readGasFlow() {
  // Facteur d'impulsions par litre (dépend du modèle, ex: ~450 impulsions / L)
  const float PULSES_PER_LITER = 450.0f;
  
  if (gasPulseCount == 0) {
    return -999.0f; // Aucune impulsion mesurée ou capteur absent
  }

  float volumeLiters = gasPulseCount / PULSES_PER_LITER;
  cumulativeGasVolumeM3 = volumeLiters / 1000.0f; // Conversion en m³
  return cumulativeGasVolumeM3;
}

// -----------------------------------------------------------------------------
// TRANSMISSION HTTP REST VERS LE SERVEUR
// -----------------------------------------------------------------------------
void sendTelemetryPayload() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Impossible d'émettre : Wi-Fi déconnecté.");
    return;
  }

  Serial.println("\n--- [Acquisition & Émission Télémétrie] ---");

  // 1. Lecture des grandeurs physiques
  float tempVal = readTemperature();
  float pressVal = readPressure();
  float gasVal = readGasFlow();

  // 2. Construction de la charge utile JSON stricte
  // Les capteurs non branchés sont explicitement encodés comme 'null' (Exigence pédagogique)
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["mode"] = TELEMETRY_MODE;

  JsonObject sensorsObj = doc.createNestedObject("sensors");

  if (tempVal > -900.0f) {
    sensorsObj["temperature_c"] = tempVal;
    Serial.printf("  🌡️ Température biodigesteur : %.2f °C\n", tempVal);
  } else {
    sensorsObj["temperature_c"] = nullptr;
    Serial.println("  🌡️ Température : non mesurée (null)");
  }

  if (pressVal > -900.0f) {
    sensorsObj["pressure_value"] = pressVal;
    Serial.printf("  ⏱️ Pression biogaz : %.1f hPa\n", pressVal);
  } else {
    sensorsObj["pressure_value"] = nullptr;
    Serial.println("  ⏱️ Pression : non mesurée (null)");
  }

  sensorsObj["waste_mass_kg"] = nullptr; // À brancher sur module HX711 si balance physique

  if (gasVal > -900.0f) {
    sensorsObj["biogas_volume_m3"] = gasVal;
    Serial.printf("  🔥 Volume biogaz : %.4f m³\n", gasVal);
  } else {
    sensorsObj["biogas_volume_m3"] = nullptr;
    Serial.println("  🔥 Biogaz : non mesuré (null)");
  }

  sensorsObj["electrical_energy_kwh"] = nullptr; // À brancher sur PZEM-004T

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  // 3. Envoi HTTP POST
  HTTPClient http;
  http.begin(API_SERVER_URL);
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.addHeader("Content-Type", "application/json");

  #ifdef API_AUTH_TOKEN
  http.addHeader("X-Device-Token", API_AUTH_TOKEN);
  #endif

  Serial.printf("📡 POST %s ...\n", API_SERVER_URL);
  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    Serial.printf("✅ Serveur a répondu avec le code : %d\n", httpResponseCode);
    String response = http.getString();
    Serial.printf("   Réponse : %s\n", response.c_str());

    // Clignotement court de confirmation sur la LED
    digitalWrite(PIN_LED_STATUS, LOW);
    delay(100);
    digitalWrite(PIN_LED_STATUS, HIGH);
  } else {
    Serial.printf("❌ Erreur de transmission HTTP : %s (code %d)\n", http.errorToString(httpResponseCode).c_str(), httpResponseCode);
  }

  http.end();
}
