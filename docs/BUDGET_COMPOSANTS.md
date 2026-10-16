# 💰 Liste des Composants Matériels & Estimation Budgétaire

Projet : **EcoCharge — Station de Supervision IoT pour Biodigesteur Expérimental**

| Composant | Référence Recommandée | Usage Technique | Prix Unitaire Indicatif (€) |
| :--- | :--- | :--- | :---: |
| **Microcontrôleur** | ESP32 NodeMCU WROOM-32 (30 ou 38 pins) | Cœur d'acquisition, Wi-Fi 802.11 b/g/n, ADC 12 bits | 6,50 € |
| **Sonde Température** | DS18B20 étanche en acier inox (câble 1m) | Immersion continue dans le digestat mésophile (OneWire) | 4,20 € |
| **Résistance Pull-Up** | 4.7 kΩ 1/4W (pour bus OneWire) | Polarisation de la ligne de données | 0,20 € |
| **Capteur de Pression** | MPX5050DP ou transducteur 0-5V étanche | Mesure de la surpression dans le ciel gazeux (0-50 kPa) | 16,80 € |
| **Débitmètre Biogaz** | YF-S401 ou équivalent adapté gaz basse pression | Comptage volumique par impulsions | 11,50 € |
| **Module Puissance** | PZEM-004T (V3.0) ou INA219 (si DC basse tension) | Mesure de l'énergie électrique valorisée (kWh, V, A) | 9,80 € |
| **Alimentation DC** | Bloc secteur 5V / 2.5A USB Type-C | Alimentation stable de l'ESP32 et de ses capteurs | 7,90 € |
| **Boîtier de Protection**| Boîtier étanche IP65 ABS (150x100x70mm) | Isolation contre l'humidité et les vapeurs corrosives | 8,50 € |
| **Câblage & Borniers** | Câbles blindés, borniers à vis, PCB prototype | Propreté des connexions de test | 6,00 € |
| **Total Estimé (Électronique)** | — | **Station IoT Complète** | **~71,40 €** |

---

### Remarques Économiques pour Projet Étudiant :
- Les capteurs de gaz spécifiques (ex: MQ-4 pour CH4 ou MQ-136 pour H2S) peuvent être ajoutés pour ~8 € supplémentaires dans une version ultérieure.
- Le coût d'un mini-biodigesteur expérimental (fût PEHD 30L ou 60L avec passe-paroi et soupape mécanique) s'élève à environ 25 à 40 € de quincaillerie de plomberie.
