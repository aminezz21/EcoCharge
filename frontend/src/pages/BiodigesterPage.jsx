import React from 'react';
import { 
  Layers, 
  Trash2, 
  Flame, 
  Zap, 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  Thermometer, 
  Gauge, 
  Scale,
  Calendar,
  AlertTriangle,
  FileCheck
} from 'lucide-react';

export function BiodigesterPage({ telemetry }) {
  const latest = telemetry?.latest || {};
  const isSimulated = latest.data_source !== 'hardware';

  const steps = [
    {
      step: 1,
      title: "1. Entrée des Déchets",
      subtitle: "Tri, pesée & broyage des biodéchets",
      icon: Trash2,
      metric: `${telemetry?.totalWasteKg || 14.5} kg`,
      metricLabel: "Intrants totaux enregistrés",
      status: "Actif",
      statusColor: "emerald",
      details: [
        "Matières organiques fraîches",
        "Ratio C/N conseillé : 25-30",
        "Pesée par module jauge HX711"
      ]
    },
    {
      step: 2,
      title: "2. Biodigesteur Anaérobie",
      subtitle: "Fermentation mésophile hermétique",
      icon: Layers,
      metric: `${latest.temperature_c ?? 36.5} °C`,
      metricLabel: `Pression : ${latest.pressure_value ?? 85} hPa`,
      status: latest.temperature_c >= 30 && latest.temperature_c <= 40 ? "Régime Optimal" : "Attention",
      statusColor: latest.temperature_c >= 30 && latest.temperature_c <= 40 ? "emerald" : "amber",
      details: [
        "Flore bactérienne méthanogène",
        "Température cible : 35-38°C",
        "Capteurs étanches DS18B20 & JSN-SR04T"
      ]
    },
    {
      step: 3,
      title: "3. Accumulation Biogaz",
      subtitle: "Purification (H2S) & ciel gazeux",
      icon: Flame,
      metric: `${latest.biogas_volume_m3 ?? 2.85} m³`,
      metricLabel: isSimulated ? "Modèle simulé" : "Mesure débit YF-S401",
      status: latest.pressure_value < 150 ? "Pression Sécurisée" : "Surpression Critique",
      statusColor: latest.pressure_value < 150 ? "emerald" : "red",
      details: [
        "Composition attendue : ~60% CH4, 40% CO2",
        "Filtre à charbon actif / paille de fer",
        "Soupape mécanique tarée à 150-180 hPa"
      ]
    },
    {
      step: 4,
      title: "4. Conversion Énergétique",
      subtitle: "Micro-cogénérateur ou groupe gaz",
      icon: Cpu,
      metric: "~32 %",
      metricLabel: "Rendement thermodynamique estimé",
      status: "Prêt",
      statusColor: "emerald",
      details: [
        "Brûleur biogaz calibré",
        "Régulateur de carburation",
        "Alternateur synchrone basse tension"
      ]
    },
    {
      step: 5,
      title: "5. Production Électrique",
      subtitle: "Redressement, stockage & mesure",
      icon: Zap,
      metric: `${latest.electrical_energy_kwh ?? 1.78} kWh`,
      metricLabel: isSimulated ? "Estimation théorique" : "Mesure PZEM-004T",
      status: "Surveillance Active",
      statusColor: "emerald",
      details: [
        "Capteur d'énergie PZEM-004T / INA219",
        "Tension régulée : 12V/24V DC ou 230V AC",
        "Alimentation de secours ou chargeur"
      ]
    }
  ];

  return (
    <div className="space-y-8">
      
      {/* EN-TÊTE DE LA PAGE */}
      <div>
        <h1 className="text-xl font-bold text-eco-dark flex items-center gap-2">
          <Layers className="w-5 h-5 text-eco-primary" />
          Schéma Fonctionnel & Supervision du Biodigesteur
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Visualisation séquentielle de la transformation de matière organique en vecteur énergétique
        </p>
      </div>

      {/* RAPPEL DE SÉCURITÉ STRICT (Conforme à la consigne : pas d'actionneurs dangereux) */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-bold text-sm text-amber-950">Principe de Sécurité Industrielle Appliqué :</h2>
          <p className="mt-0.5 leading-relaxed">
            L'application EcoCharge est conçue selon le principe strict du <strong>monitoring passif et non-intrusif</strong>.
            Aucune commande distante d'ouverture de vanne, de mise sous pression forcée ou d'allumage automatique du gaz n'est implémentée dans cette interface web. 
            La sécurité physique repose obligatoirement sur des <strong>soupapes mécaniques certifiées</strong> et une manipulation humaine locale qualifiée.
          </p>
        </div>
      </div>

      {/* SCHÉMA FONCTIONNEL SÉQUENTIEL EN 5 ÉTAPES */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-eco-dark uppercase tracking-wider">
          Chaîne de Transformation Énergétique
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div 
                key={st.step}
                className="eco-card p-4 flex flex-col justify-between border-t-4 border-t-eco-primary relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-6 h-6 rounded-full bg-eco-dark text-white text-xs font-bold flex items-center justify-center">
                      {st.step}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      st.statusColor === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                      st.statusColor === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {st.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-eco-light text-eco-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-eco-dark leading-tight">{st.title}</h3>
                  </div>

                  <p className="text-[11px] text-gray-500 mb-3">{st.subtitle}</p>

                  {/* Données disponibles */}
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 mb-3">
                    <div className="text-base font-extrabold text-eco-dark">{st.metric}</div>
                    <div className="text-[10px] text-gray-500 font-medium">{st.metricLabel}</div>
                  </div>

                  {/* Détails techniques */}
                  <ul className="text-[11px] text-gray-600 space-y-1">
                    {st.details.map((d, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-eco-primary font-bold">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FICHE DESCRIPTIVE TECHNIQUE DU BIODIGESTEUR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARACTÉRISTIQUES DU RÉACTEUR */}
        <div className="lg:col-span-2 eco-card p-6">
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <h2 className="text-base font-bold text-eco-dark flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-eco-primary" />
              Fiche Descriptive du Biodigesteur Pilote
            </h2>
            <span className="text-xs font-mono bg-eco-light text-eco-dark px-2.5 py-1 rounded font-semibold">
              RÉACTEUR PILOTE R-01
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block uppercase tracking-wider text-[10px] font-semibold">Type de Réacteur</span>
              <span className="font-bold text-gray-800 text-sm mt-0.5 block">CSTR / Cuve mésophile continue</span>
              <p className="text-gray-500 text-[11px] mt-1">Cuve cylindrique PEHD étanche avec isolation thermique renforcée.</p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block uppercase tracking-wider text-[10px] font-semibold">Capacité Nominale</span>
              <span className="font-bold text-gray-800 text-sm mt-0.5 block">200 Litres (Volume total)</span>
              <p className="text-gray-500 text-[11px] mt-1">Volume utile digestat liquide : 150 L | Ciel gazeux : 50 L.</p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block uppercase tracking-wider text-[10px] font-semibold">Temps de Séjour Hydraulique (HRT)</span>
              <span className="font-bold text-gray-800 text-sm mt-0.5 block">25 à 30 Jours</span>
              <p className="text-gray-500 text-[11px] mt-1">Nécessaire à la dégradation complète par la flore méthanogène.</p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block uppercase tracking-wider text-[10px] font-semibold">Date de Mise en Service</span>
              <span className="font-bold text-gray-800 text-sm mt-0.5 block">15 Février 2026</span>
              <p className="text-gray-500 text-[11px] mt-1">Ensemencement initial par inoculum méthanogène actif.</p>
            </div>
          </div>

          {/* PARAMÈTRES NOMINAUX DE FONCTIONNEMENT */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
              Paramètres Nominaux de Fonctionnement
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] text-gray-500 block">Température</span>
                <span className="text-sm font-bold text-eco-primary">35 - 38 °C</span>
              </div>
              <div className="p-2.5 rounded bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] text-gray-500 block">Pression Gaz</span>
                <span className="text-sm font-bold text-eco-primary">50 - 120 hPa</span>
              </div>
              <div className="p-2.5 rounded bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] text-gray-500 block">pH Digestat</span>
                <span className="text-sm font-bold text-eco-primary">6.8 - 7.6</span>
              </div>
              <div className="p-2.5 rounded bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] text-gray-500 block">Charge Quotidienne</span>
                <span className="text-sm font-bold text-eco-primary">3 - 5 kg / j</span>
              </div>
            </div>
          </div>
        </div>

        {/* HISTORIQUE DES OPÉRATIONS & MAINTENANCE */}
        <div className="eco-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-eco-dark flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-eco-primary" />
              Journal des Opérations Récentes
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50">
                <span className="text-[10px] font-mono text-gray-400 block">12/10/2026 - 14:30</span>
                <strong className="text-gray-800">Calibrage de la sonde DS18B20</strong>
                <p className="text-gray-500 text-[11px] mt-0.5">Vérification de la dérive thermique à 37°C au bain-marie.</p>
              </div>

              <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50">
                <span className="text-[10px] font-mono text-gray-400 block">08/10/2026 - 10:15</span>
                <strong className="text-gray-800">Remplacement filtre H2S</strong>
                <p className="text-gray-500 text-[11px] mt-0.5">Renouvellement de la cartouche de paille de fer déshydratée.</p>
              </div>

              <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50">
                <span className="text-[10px] font-mono text-gray-400 block">01/10/2026 - 09:00</span>
                <strong className="text-gray-800">Contrôle d'étanchéité & soupape</strong>
                <p className="text-gray-500 text-[11px] mt-0.5">Test manuel de déclenchement de la soupape mécanique à 170 hPa.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t text-[11px] text-gray-400 text-center">
            Prochaine révision globale : Novembre 2026
          </div>
        </div>

      </div>

    </div>
  );
}
