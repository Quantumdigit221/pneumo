import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store';
import {
  Consultation,
  ConsultationTwelveSteps,
  ClinicalDiagnosis,
  DiagnosisType,
  DiagnosisStatus,
  OrderedParaclinicalExam,
  VitalsSeriesEntry,
  SyndromicPriorityItem,
  MaritalStatus,
  EducationLevel,
  ClinicalScoreCalculation,
  MedicalExploration
} from '../types';
import { startDictationSession, DictationSession } from '../utils/audioRecorder';
import MicrophonePermissionModal from '../components/MicrophonePermissionModal';
import VoiceDictationButton from '../components/VoiceDictationButton';
import {
  PatientDpiHistoryEditor,
  DpiAntecedentsValue,
  buildDpiFromPatient,
  extractConsumptionsFromDpi
} from '../components/PatientDpiHistoryEditor';
import {
  MARITAL_STATUS_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  O2_DEVICE_OPTIONS,
  PARACLINICAL_CATALOG,
  MacroExplorationCategoryId,
  calcBmi
} from '../utils/dpiConstants';
import {
  CLINICAL_SCORES_DEFINITIONS,
  getSuggestedScoresForHypotheses,
  buildAutoFilledScoreInputs
} from '../utils/clinicalScoresEngine';
import {
  Activity,
  Mic,
  MicOff,
  Sparkles,
  Save,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  HeartPulse,
  Wind,
  FileText,
  Layers,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  History,
  Pill,
  ShieldCheck,
  Thermometer,
  Gauge,
  Zap,
  LayoutList,
  ListOrdered,
  Calculator,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Pin,
  PinOff,
  QrCode,
  ArrowUp,
  ArrowDown,
  Upload,
  Paperclip,
  ClipboardList,
  BedDouble
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

// CIM-11 Catalog of frequent Pneumology & Infectious conditions in Senegal
const CIM11_PNEUMO_CATALOG = [
  { code: '1B10.0', label: "Tuberculose de l'appareil respiratoire, confirmée par bactériologie", category: 'Tuberculose' },
  { code: '1B10.1', label: "Tuberculose pulmonaire sans confirmation bactériologique ou histologique", category: 'Tuberculose' },
  { code: '1B11.0', label: "Pleurésie tuberculeuse", category: 'Tuberculose' },
  { code: '1B12.0', label: "Tuberculose résistante à la rifampicine (TB-RR) / Multirésistante (TB-MDR)", category: 'Tuberculose' },
  { code: 'CA22.0', label: "Bronchopneumopathie chronique obstructive (BPCO) avec exacerbation aiguë", category: 'BPCO' },
  { code: 'CA22.1', label: "BPCO stable sous traitement de fond", category: 'BPCO' },
  { code: 'CA23.0', label: "Asthme allergique", category: 'Asthme' },
  { code: 'CA23.1', label: "Asthme non allergique", category: 'Asthme' },
  { code: 'CA23.3', label: "Exacerbation aiguë sévère d'asthme", category: 'Asthme' },
  { code: 'CA20', label: "Pneumonie aiguë communautaire (PAC) bactérienne", category: 'Infectiologie' },
  { code: 'CA21', label: "Pneumonie d'inhalation / abcès pulmonaire", category: 'Infectiologie' },
  { code: 'CB00', label: "Embolie pulmonaire", category: 'Vasculaire' },
  { code: 'CB01', label: "Hypertension pulmonaire (HTP)", category: 'Vasculaire' },
  { code: 'CB03', label: "Dilatation des bronches (Bronchectasies / DDB)", category: 'Chronique' },
  { code: 'CB04', label: "Aspergillome pulmonaire sur séquelle cavitaire", category: 'Fongique' },
  { code: 'CB05', label: "Pneumothorax spontané", category: 'Plèvre' },
  { code: 'CB41', label: "Pleurésie séro-fibrineuse exsudative non tuberculeuse", category: 'Plèvre' },
  { code: 'CB20', label: "Pneumopathie interstitielle diffuse (PID)", category: 'Interstitiel' },
  { code: '1C60', label: "Infection par le VIH avec complication respiratoire opportuniste", category: 'Infectiologie' },
  { code: 'BA00', label: "Hypertension artérielle essentielle", category: 'Comorbidité' },
  { code: '5A10', label: "Diabète de type 2", category: 'Comorbidité' }
];

// Top 8 Frequent CIM-11 Codes in Service Pneumologie CHREIN
const TOP_CIM11_SHORTCUTS = [
  { code: '1B10.0', label: 'Tuberculose respiratoire (TPM+)', category: 'Tuberculose' },
  { code: 'CA22.0', label: 'Exacerbation aiguë de BPCO', category: 'BPCO' },
  { code: 'CA23.3', label: 'Exacerbation aiguë d\'asthme', category: 'Asthme' },
  { code: 'CA20', label: 'Pneumonie aiguë communautaire (PAC)', category: 'Infectiologie' },
  { code: 'CB00', label: 'Embolie pulmonaire', category: 'Vasculaire' },
  { code: 'CB41', label: 'Pleurésie séro-fibrineuse', category: 'Plèvre' },
  { code: 'CB03', label: 'Dilatation des bronches (DDB)', category: 'Chronique' },
  { code: 'CB05', label: 'Pneumothorax spontané', category: 'Plèvre' }
];

// Quick parenthesized clinical presets (Section 4)
const CLINICAL_PARENTHESES_PRESETS = {
  pulmonaryVesicularBreath: [
    '(conservé symétrique bilatéral)',
    '(diminué à l\'apex droit)',
    '(diminué à la base droite)',
    '(diminué aux deux bases)',
    '(aboli base droite)',
    '(aboli base gauche)'
  ],
  pulmonaryCrackles: [
    '(absents)',
    '(crépitants apex droit)',
    '(crépitants apex gauche)',
    '(crépitants base droite)',
    '(crépitants bibasaux)',
    '(diffus bilatéraux)'
  ],
  pulmonaryWheezes: [
    '(absents)',
    '(sibilants expiratoires diffus bilatéraux)',
    '(discrets temps expiratoire)',
    '(wheezing trachéobronchique)'
  ],
  pulmonaryRhonchi: [
    '(absents)',
    '(ronchis diffus bilatéraux encombrés)',
    '(sous-crépitants bilatéraux)'
  ],
  pleuralFriction: [
    '(absent)',
    '(frottement pleural base droite)',
    '(frottement pleural base gauche)'
  ],
  cyanosisClubbing: [
    '(pas de cyanose, pas d\'hippocratisme)',
    '(cyanose unguéale et péribuccale modérée)',
    '(hippocratisme digital franc grade 2)',
    '(hippocratisme digital discret)'
  ],
  cardiovascular: [
    '(BDC réguliers, sans souffle, pas de TJ ni RHJ, pas d\'OMI)',
    '(BDC tachycardes réguliers, sans souffle)',
    '(turgescence jugulaire positive et RHJ franc)',
    '(OMI bilatéraux prenant le godet)'
  ],
  abdomen: [
    '(souple, dépressible, indolore, pas d\'organomégalie)',
    '(foie débordant à 2 cm sous le rebord costal)',
    '(météorisme abdominal sans douleur focale)'
  ],
  neurological: [
    '(patient conscient, orienté temporo-spatialement, Glasgow 15/15)',
    '(somnolence réversible à la stimulation verbale)',
    '(ralentissement idéomoteur sans signe de focalisation)'
  ],
  entLymphNodes: [
    '(pas d\'adénopathie cervicale ni sus-claviculaire palpable)',
    '(adénopathie cervicale jugulo-carotidienne droite indolore 2 cm)',
    '(ganglions sous-mandibulaires bilatéraux fermes mobiles)'
  ],
  cutaneous: [
    '(peau saine, pas d\'éruption, sueurs nocturnes abondantes)',
    '(pâleur cutanéo-muqueuse modérée, pas de purpura)',
    '(lésions de prurigo cicatriciel)'
  ]
};

// Prescription templates
const PRESCRIPTION_TEMPLATES = {
  tb_pnt: {
    title: 'Protocole Tuberculose PNT (Phase intensive 2RHZE)',
    text: `1. Schéma 2RHZE (Rifampicine 150mg + Isoniazide 75mg + Pyrazinamide 400mg + Éthambutol 275mg) : 4 comprimés en 1 prise matinale unique à jeun, tous les jours pendant 60 jours.
2. Vitamine B6 (Pyridoxine) 50 mg : 1 comprimé par jour le matin (prévention de la neuropathie périphérique sous INH).
3. Paracétamol 500 mg : 1 à 2 comprimés toutes les 8 heures si fièvre > 38.5°C ou céphalées.
4. Règle d'or : Ne jamais arrêter le traitement. Contrôle bactériologique des crachats obligatoire à M2 au CHREIN.`
  },
  copd_exacerbation: {
    title: 'Exacerbation BPCO / Bronchite aiguë purulente',
    text: `1. Amoxicilline + Acide Clavulanique 1g : 1 comprimé 3 fois par jour au cours des repas pendant 7 jours.
2. Prednisolone 20 mg : 2 comprimés le matin (40 mg/jour) pendant 5 jours stricts (corticothérapie courte).
3. Aérosol-doseur Salbutamol 100 µg : 2 bouffées avec chambre d'inhalation toutes les 4 à 6 heures si dyspnée.
4. Ipratropium 20 µg : 2 bouffées matin et soir.
5. Hydratation abondante et arrêt absolu du tabac.`
  },
  asthma_attack: {
    title: 'Crise d\'Asthme aiguë / Renforcement GINA',
    text: `1. Salbutamol 100 µg (Ventoline) : 2 à 4 bouffées avec chambre d'inhalation toutes les 20 minutes pendant la 1ère heure, puis à la demande.
2. Prednisolone 20 mg : 2 comprimés par jour (40 mg/j) le matin pendant 5 jours.
3. Budésonide/Formotérol 160/4.5 µg : 1 inhalation matin et soir en traitement de fond quotidien continu.
4. Règle de sécurité : En cas de non-amélioration sous 1 heure ou de difficulté à parler, consulter immédiatement les urgences du CHREIN.`
  },
  pac_pneumonia: {
    title: 'Pneumonie Aiguë Communautaire (Amoxicilline)',
    text: `1. Amoxicilline 1g : 1 comprimé 3 fois par jour (toutes les 8h) pendant 7 jours.
2. Paracétamol 1g : 1 comprimé toutes les 8h si fièvre > 38.5°C ou point de côté.
3. Règle : Réévaluation médicale obligatoire à 48 heures.`
  }
};

// Échelle de Dyspnée mMRC (Stades 0 à 4 - Validée pneumologie)
const MMRC_DYSPNEA_SCALE = [
  { grade: 0, label: 'Stade 0', desc: 'Dyspnée uniquement lors d\'efforts physiques soutenus ou intenses' },
  { grade: 1, label: 'Stade 1', desc: 'Essoufflement en marchant vite sur le plat ou en montant une légère pente' },
  { grade: 2, label: 'Stade 2', desc: 'Marche plus lentement que les personnes du même âge sur le plat ou s\'arrête pour respirer' },
  { grade: 3, label: 'Stade 3', desc: 'S\'arrête pour respirer après environ 100 mètres ou après quelques minutes sur le plat' },
  { grade: 4, label: 'Stade 4', desc: 'Trop essoufflé pour quitter le domicile ou s\'essouffle en s\'habillant / se déshabillant' }
];

// Calculateur Posologique 2RHZE selon le poids (Directives Nationales PNT Sénégal)
const getPntRhzeDosage = (weightKg: number) => {
  if (!weightKg || weightKg <= 0) return { tablets: 4, text: '4 comprimés/jour de RHZE (150/75/400/275 mg)', b6: 'Vitamine B6 50 mg : 1 cp/j', range: '55-70 kg (standard)' };
  if (weightKg < 30) return { tablets: 2, text: 'Schéma pédiatrique à ajuster selon le poids au kg', b6: 'Vitamine B6 25 mg : 1 cp/j', range: '< 30 kg' };
  if (weightKg <= 39) return { tablets: 2, text: '2 comprimés/jour de RHZE (150/75/400/275 mg)', b6: 'Vitamine B6 50 mg : 1 cp/j', range: '30-39 kg' };
  if (weightKg <= 54) return { tablets: 3, text: '3 comprimés/jour de RHZE (150/75/400/275 mg)', b6: 'Vitamine B6 50 mg : 1 cp/j', range: '40-54 kg' };
  if (weightKg <= 70) return { tablets: 4, text: '4 comprimés/jour de RHZE (150/75/400/275 mg)', b6: 'Vitamine B6 50 mg : 1 cp/j', range: '55-70 kg' };
  return { tablets: 5, text: '5 comprimés/jour de RHZE (150/75/400/275 mg)', b6: 'Vitamine B6 50 mg : 1 cp/j', range: '> 70 kg' };
};

// Formulaire Médicamenteux Hospitalier Instantané (Pneumologie CHREIN)
const PNEUMO_DRUG_FORMULARY = [
  {
    category: 'Bronchodilatateurs & Aérosols',
    items: [
      { name: 'Salbutamol 100 µg (Ventoline)', posology: '2 à 4 bouffées avec chambre d\'inhalation toutes les 4 à 6 heures en cas de dyspnée / sifflements' },
      { name: 'Ipratropium 20 µg (Atrovent)', posology: '2 bouffées 3 à 4 fois par jour' },
      { name: 'Budésonide/Formotérol 160/4.5 µg (Symbicort)', posology: '1 inhalation matin et soir en traitement de fond quotidien continu' },
      { name: 'Fluticasone/Salmétérol 250/25 µg (Seretide)', posology: '1 inhalation matin et soir' }
    ]
  },
  {
    category: 'Corticothérapie & Anti-inflammatoires',
    items: [
      { name: 'Prednisolone 20 mg (Solupred)', posology: '2 comprimés le matin (40 mg/jour) pendant 5 jours stricts (corticothérapie courte)' },
      { name: 'Méthylprednisolone 40 mg injectable', posology: '1 ampoule IV lente toutes les 8h à 12h pendant 48h en cas de crise sévère' }
    ]
  },
  {
    category: 'Antibiotiques Respiratoires (Stewardship)',
    items: [
      { name: 'Amoxicilline 1g', posology: '1 comprimé 3 fois par jour (toutes les 8h) pendant 7 jours' },
      { name: 'Amoxicilline + Acide Clavulanique 1g (Augmentin)', posology: '1 comprimé 3 fois par jour au cours des repas pendant 7 jours' },
      { name: 'Ceftriaxone 1g ou 2g injectable', posology: '1 à 2g en IVL ou IM 1 fois par jour pendant 5 à 7 jours' },
      { name: 'Azithromycine 500 mg', posology: '500 mg le 1er jour, puis 250 mg/jour les 4 jours suivants (total 5 jours)' }
    ]
  },
  {
    category: 'Antituberculeux & Adjuvants (PNT Sénégal)',
    items: [
      { name: 'Schéma fixe 2RHZE (R150+H75+Z400+E275)', posology: '4 comprimés en prise matinale unique à jeun, tous les jours pendant 60 jours' },
      { name: 'Vitamine B6 (Pyridoxine) 50 mg', posology: '1 comprimé par jour le matin (prévention neuropathie sous Isoniazide)' },
      { name: 'Schéma de continuation 4RH (R150+H75)', posology: '4 comprimés par jour en 1 prise matinale pendant 4 mois (M3 à M6)' }
    ]
  },
  {
    category: 'Antalgiques & Mucolytiques',
    items: [
      { name: 'Paracétamol 1g', posology: '1 comprimé toutes les 8 heures si fièvre > 38.5°C ou douleur thoracique (max 3g/j)' },
      { name: 'N-Acétylcystéine 200 mg', posology: '1 sachet 3 fois par jour en cas d\'encombrement bronchique' }
    ]
  },
  {
    category: 'Oxygénothérapie & Soins d\'Urgence',
    items: [
      { name: 'O2 par Lunettes Nasales', posology: 'Débit 2 à 4 L/min continu (Cible SpO2 94-98% ou 88-92% si BPCO)' },
      { name: 'O2 au Masque Haute Concentration', posology: 'Débit 10 à 15 L/min avec réservoir (Détresse respiratoire aiguë)' },
      { name: 'Énoxaparine 4000 UI (Lovenox)', posology: '1 injection sous-cutanée par jour (Prévention thromboembolique)' }
    ]
  }
];

// Topographie Auscultatoire Rapide (Pneumologie)
const THORACIC_ZONES = [
  { id: 'apex_droit', label: 'Apex Droit (Sommet)', region: 'Apex' },
  { id: 'apex_gauche', label: 'Apex Gauche (Sommet)', region: 'Apex' },
  { id: 'champ_moyen_droit', label: 'Lobe Moyen Droit', region: 'Moyen' },
  { id: 'base_droite', label: 'Base Droite (Postérieure)', region: 'Base' },
  { id: 'base_gauche', label: 'Base Gauche (Postérieure)', region: 'Base' },
  { id: 'bilateral', label: 'Diffus Bilatéral (2 champs)', region: 'Diffus' }
];

// Exam packs for Step 9
const EXAM_PACKS = {
  tb: {
    label: 'Pack Tuberculose (PNT)',
    exams: { geneXpertBK: true, chestXray: true, nfsCrp: true, bloodGas: false, chestCT: false, spirometry: false, pleuralPuncture: false },
    notes: 'GeneXpert MTB/RIF crachats matin x2 + Cliché thorax face + NFS/CRP + Bilan hépatique pré-thérapeutique (ASAT/ALAT/Bili/Créat).'
  },
  copd: {
    label: 'Pack BPCO / Gazométrie',
    exams: { geneXpertBK: false, chestXray: true, nfsCrp: true, bloodGas: true, chestCT: false, spirometry: true, pleuralPuncture: false },
    notes: 'Gazométrie artérielle en air ambiant (pH, PaO2, PaCO2, HCO3-) + Cliché thorax + NFS/CRP + EFR/Spirométrie à distance.'
  },
  pac: {
    label: 'Pack Pneumonie Aiguë',
    exams: { geneXpertBK: true, chestXray: true, nfsCrp: true, bloodGas: false, chestCT: false, spirometry: false, pleuralPuncture: false },
    notes: 'Cliché thoracique face et profil + NFS (hyperleucocytose) + CRP quantitative + Glycémie capillaire.'
  },
  embolism: {
    label: 'Pack Embolie Pulmonaire',
    exams: { geneXpertBK: false, chestXray: true, nfsCrp: true, bloodGas: true, chestCT: true, spirometry: false, pleuralPuncture: false },
    notes: 'Angioscanner thoracique avec produit de contraste iodé + D-Dimères quantitatifs + Gazométrie + ECG 12 dérivations.'
  }
};

// 12-Step Configuration metadata
const STEP_CONFIG = [
  { step: 1, label: '1. État Civil', desc: 'Identité & Contexte social', tag: 'Social' },
  { step: 2, label: '2. Motif', desc: 'Symptômes d\'appel', tag: 'Motif' },
  { step: 3, label: '3. Histoire', desc: 'Chronologie & Début', tag: 'Histoire' },
  { step: 4, label: '4. Antécédents', desc: 'Risques & Tabac PA', tag: 'Terrain' },
  { step: 5, label: '5. Constantes', desc: 'Signes vitaux & IMC', tag: 'Végétatif' },
  { step: 6, label: '6. Appareils ()', desc: 'Auscultation & Systèmes', tag: 'Examen' },
  { step: 7, label: '7. Syndromique', desc: 'Synthèse sémiologique', tag: 'Synthèse' },
  { step: 8, label: '8. Hypothèses', desc: 'Diagnostics évoqués', tag: 'Hypothèses' },
  { step: 9, label: '9. Examens', desc: 'Explorations prescrites', tag: 'Examens' },
  { step: 10, label: '10. CIM-11', desc: 'Codification internationale', tag: 'CIM-11' },
  { step: 11, label: '11. Ordonnance', desc: 'Traitement & Stewardship', tag: 'Thérapie' },
  { step: 12, label: '12. Suivi', desc: 'Évolution & Rendez-vous', tag: 'Suivi' }
];

// 4 Clinical Phases Grouping for Clean Medical Workstation Flow
export const CLINICAL_PHASES = [
  {
    phase: 1,
    title: 'Phase I : Anamnèse & Contexte',
    shortTitle: 'I. Anamnèse',
    steps: [1, 2, 3, 4],
    desc: 'État civil, motif de consultation, histoire de la maladie et terrain'
  },
  {
    phase: 2,
    title: 'Phase II : Examen & Constantes',
    shortTitle: 'II. Examen',
    steps: [5, 6],
    desc: 'Constantes vitales, anthropométrie, IMC et auscultation pleuro-pulmonaire'
  },
  {
    phase: 3,
    title: 'Phase III : Synthèse Diagnostique',
    shortTitle: 'III. Synthèse',
    steps: [7, 8, 9, 10],
    desc: 'Résumé syndromique, hypothèses, scores cliniques contextualisés, explorations et CIM-11'
  },
  {
    phase: 4,
    title: 'Phase IV : Décision & Clôture',
    shortTitle: 'IV. Prise en Charge',
    steps: [11, 12],
    desc: 'Prescriptions médicales, antibiogouvernance, suivi et consignes d\'alerte'
  }
];

// Full Clinical Scenarios (1-Click Fill for 12 Steps)
const FULL_CLINICAL_SCENARIOS = [
  {
    id: 'tb_active',
    name: 'Suspicion Tuberculose (PNT)',
    badge: 'PNT Sénégal',
    icon: '🫁',
    twelveSteps: {
      civilStatusNotes: 'Contexte de promiscuité intrafamilial (foyer de 6 personnes). Habitat semi-dur modérément ventilé.',
      chiefComplaint: 'Toux persistante fébrile avec expectorations purulentes, sueurs nocturnes et amaigrissement de 5 kg depuis 3 semaines.',
      historyOfIllness: 'Début progressif il y a 3 semaines marqué par une toux d\'abord sèche puis productive, accompagnée d\'une fièvre vespéro-nocturne, de sueurs profuses nocturnes et d\'une altération marquée de l\'état général avec amaigrissement de 5 kg. Notion d\'essoufflement d\'aggravation progressive. Automédication par Paracétamol et Amoxicilline sans amélioration.',
      riskFactors: {
        smokingPA: 10,
        biomassExposure: true,
        tbContact: true,
        allergiesAtopy: 'Aucune allergie médicamenteuse connue',
        previousTB: false,
        hivStatus: 'NEGATIF' as const,
        diabetesHta: 'Pas d\'HTA ni diabète documenté',
        occupationalExposure: 'Commerçant marché Kaolack / Poussières'
      },
      antecedentsText: 'Tabagisme sevré il y a 3 ans. Cuisine au feu de bois familiale. Notion de contage tuberculeux intrafamilial (neveu traité en 2024).',
      vitals: {
        bp: '115/75',
        pulse: 88,
        rr: 24,
        spo2Ambient: 93,
        spo2O2: 98,
        o2FlowLiters: 2,
        temperature: 38.6,
        weight: 56,
        height: 172,
        bmi: 18.9,
        glasgowScore: 15,
        painEva: 2,
        generalState: 'ALTERE_LEGER' as const
      },
      systems: {
        pulmonaryVesicularBreath: 'Murmure vésiculaire (diminué à l\'apex droit et aux deux bases)',
        pulmonaryCrackles: 'Râles crépitants (localisés au sommet pulmonaire droit)',
        pulmonaryWheezes: 'Sibilants (absents)',
        pulmonaryRhonchi: 'Ronchis (diffus bilatéraux discrets)',
        pleuralFriction: 'Frottement pleural (négatif)',
        cyanosisClubbing: 'Cyanose (négative) - Hippocratisme digital (discret grade 1)',
        cardiovascular: '(Bruits du coeur réguliers, pas de souffle. Pas de turgescence jugulaire ni de reflux hépato-jugulaire)',
        abdomen: '(Abdomen souple, indolore, pas d\'hépatomégalie ni de splénomégalie)',
        neurological: '(Patient conscient, bien orienté dans le temps et l\'espace, Glasgow 15)',
        entLymphNodes: '(Pas d\'adénopathie cervicale ni sous-claviculaire palpable)',
        cutaneous: '(Sueurs nocturnes confirmées, pâleur cutanéo-muqueuse modérée)'
      },
      syndromicSummary: 'Syndrome de condensation pulmonaire apical droit fébrile subaigu avec altération de l\'état général et amaigrissement chez un patient exposé au contage tuberculeux.',
      diagnosticHypotheses: [
        '1. Tuberculose pulmonaire active (TPM+ / bactériologique) en première hypothèse',
        '2. Pneumopathie bactérienne subaiguë ou abcès pulmonaire',
        '3. Néoplasie bronchopulmonaire sous-jacente sur terrain tabagique'
      ],
      paraclinicalOrdered: {
        chestXray: true,
        chestCT: false,
        spirometry: false,
        bloodGas: true,
        nfsCrp: true,
        geneXpertBK: true,
        pleuralPuncture: false,
        otherNotes: 'GeneXpert MTB/RIF sur crachats du matin en urgence + NFS, CRP, Gazométrie artérielle, Bilan hépatique complet avant mise sous 2RHZE.'
      },
      diagnoses: [
        {
          id: 'diag-tb-auto',
          codeCIM11: '1B10.0',
          label: 'Tuberculose de l\'appareil respiratoire, confirmée par bactériologie',
          type: 'PRINCIPAL' as const,
          status: 'CONFIRME' as const,
          dateDiagnosed: new Date().toISOString().split('T')[0],
          notes: 'GeneXpert MTB positif sensible à la Rifampicine.'
        }
      ],
      managementPlan: {
        medicationsPrescribed: `1. Schéma 2RHZE (Rifampicine 150mg + Isoniazide 75mg + Pyrazinamide 400mg + Éthambutol 275mg) : 4 comprimés en 1 prise matinale unique à jeun, tous les jours pendant 60 jours.\n2. Vitamine B6 (Pyridoxine) 50 mg : 1 comprimé par jour le matin (prévention de la neuropathie périphérique sous INH).\n3. Paracétamol 500 mg : 1 à 2 comprimés toutes les 8h si fièvre > 38.5°C ou céphalées.\n4. Contrôle bactériologique des crachats obligatoire à M2 au CHREIN.`,
        nonPharmacological: 'Mesures d\'isolement respiratoire à domicile, aération permanente de la chambre, alimentation hypercalorique, port de masque chirurgical par le patient les premières semaines.',
        orientation: 'AMBULATOIRE' as const,
        antibioticStewardship: {
          molecule: '2RHZE (Rifampicine/Isoniazide/Pyrazinamide/Éthambutol)',
          durationDays: 60,
          reassessmentDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
          notes: 'Programme National Antituberculeux PNT sous supervision directe (DOTS)'
        }
      },
      followUp: {
        nextAppointmentDate: new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0],
        keyWarningSigns: 'Hémoptysie abondante, ictère cutanéomuqueux (toxicité hépatique), baisse de la vision (névrite optique Éthambutol), intolérance digestive sévère.',
        notes: 'Contrôle à M2 avec examen microscopique et GeneXpert des crachats obligatoire.'
      }
    }
  },
  {
    id: 'copd_exac',
    name: 'Exacerbation BPCO (GOLD E)',
    badge: 'GOLD 2024',
    icon: '🚬',
    twelveSteps: {
      civilStatusNotes: 'Patient retraité vivant en milieu urbain, exposition prolongée aux fumées de cuisine et tabagisme.',
      chiefComplaint: 'Majoration aiguë de la dyspnée avec expectorations devenues purulentes et abondantes depuis 48h chez un patient BPCO connu.',
      historyOfIllness: 'Patient tabagique suivi pour BPCO, présentant depuis 48h une aggravation brutale de son essoufflement habituel (stade mMRC 3), avec augmentation du volume et de la purulence des crachats (Anthonisen Type 1). Notion d\'utilisation accrue de la Ventoline sans soulagement suffisant.',
      riskFactors: {
        smokingPA: 30,
        biomassExposure: true,
        tbContact: false,
        allergiesAtopy: 'Pas d\'allergie connue',
        previousTB: false,
        hivStatus: 'NEGATIF' as const,
        diabetesHta: 'HTA traitée sous Amlodipine 5mg',
        occupationalExposure: 'Chauffeur routier retraité'
      },
      antecedentsText: 'BPCO Stade 3 GOLD Groupe E, 2 hospitalisations antérieures pour décompensation respiratoire.',
      vitals: {
        bp: '140/85',
        pulse: 98,
        rr: 26,
        spo2Ambient: 90,
        spo2O2: 95,
        o2FlowLiters: 1.5,
        temperature: 38.0,
        weight: 68,
        height: 170,
        bmi: 23.5,
        glasgowScore: 15,
        painEva: 1,
        generalState: 'ALTERE_LEGER' as const
      },
      systems: {
        pulmonaryVesicularBreath: 'Murmure vésiculaire (diminué bilatéralement avec freinage expiratoire)',
        pulmonaryCrackles: 'Râles crépitants (absents)',
        pulmonaryWheezes: 'Sibilants (sibilants expiratoires diffus bilatéraux)',
        pulmonaryRhonchi: 'Ronchis (ronchis diffus bilatéraux encombrés)',
        pleuralFriction: 'Frottement pleural (absent)',
        cyanosisClubbing: 'Cyanose (cyanose péribuccale modérée en air ambiant)',
        cardiovascular: '(Tachycardie régulière, pas de turgescence jugulaire)',
        abdomen: '(Abdomen souple, pas de douleur)',
        neurological: '(Conscient, pas d\'encéphalopathie respiratoire)',
        entLymphNodes: '(Pas d\'adénopathie)',
        cutaneous: '(Peau sèche, pas d\'éruption)'
      },
      syndromicSummary: 'Syndrome bronchique obstructif décompensé avec critères d\'Anthonisen type 1 (purulence, volume, dyspnée) et hypoxémie chez un patient BPCO sévère.',
      diagnosticHypotheses: [
        '1. Exacerbation aiguë de BPCO d\'origine infectieuse bactérienne',
        '2. Pneumopathie aiguë communautaire sous-jacente',
        '3. Embolie pulmonaire surajoutée décompensant la BPCO'
      ],
      paraclinicalOrdered: {
        chestXray: true,
        chestCT: false,
        spirometry: false,
        bloodGas: true,
        nfsCrp: true,
        geneXpertBK: false,
        pleuralPuncture: false,
        otherNotes: 'Gazométrie artérielle en urgence (recherche hypercapnie/acidose) + Cliché thorax face/profil, NFS, CRP.'
      },
      diagnoses: [
        {
          id: 'diag-copd-auto',
          codeCIM11: 'CA22.0',
          label: 'Bronchopneumopathie chronique obstructive avec exacerbation aiguë',
          type: 'PRINCIPAL' as const,
          status: 'CONFIRME' as const,
          dateDiagnosed: new Date().toISOString().split('T')[0]
        }
      ],
      managementPlan: {
        medicationsPrescribed: `1. Amoxicilline + Acide Clavulanique 1g : 1 comprimé 3 fois par jour au cours des repas pendant 7 jours.\n2. Prednisolone 20 mg : 2 comprimés le matin (40 mg/j) pendant 5 jours stricts (corticothérapie courte).\n3. Aérosol-doseur Salbutamol 100 µg : 2 à 4 bouffées avec chambre d'inhalation toutes les 4 heures si dyspnée.\n4. Bromure d'Ipratropium 20 µg : 2 bouffées matin et soir.\n5. Oxygénothérapie titrée à débit faible (1 à 2 L/min) pour viser une SpO2 entre 88 et 92%.`,
        nonPharmacological: 'Arrêt immédiat et absolu de toute exposition tabagique, hydratation per os abondante, kinésithérapie de désencombrement doux.',
        orientation: 'HOSPITALISATION' as const,
        antibioticStewardship: {
          molecule: 'Amoxicilline + Acide Clavulanique',
          durationDays: 7,
          reassessmentDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          notes: 'Réévaluation à 48-72h de la purulence des expectorations'
        }
      },
      followUp: {
        nextAppointmentDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        keyWarningSigns: 'Somnolence diurne anormale (signe d\'hypercapnie), polypnée > 30/min, désaturation sous 88%, tirage sus-sternal intense.',
        notes: 'Réévaluation clinique à J+3 avec contrôle des gaz du sang si évolution défavorable.'
      }
    }
  },
  {
    id: 'asthma_crisis',
    name: 'Crise d\'Asthme (GINA)',
    badge: 'GINA 2024',
    icon: '🌬️',
    twelveSteps: {
      civilStatusNotes: 'Contexte urbain, antécédent familial d\'atopie et d\'allergies.',
      chiefComplaint: 'Crise d\'étouffement paroxystique nocturne avec sifflements thoraciques audibles à distance et toux sèche spasmodique.',
      historyOfIllness: 'Survenue brutale en deuxième partie de nuit d\'une sensation d\'oppression thoracique majeure avec dyspnée expiratoire sifflante, empêchant le patient de terminer ses phrases. Contexte d\'exposition récente à un allergène (acariens, poussières). Recours inefficace à 2 bouffées de Ventoline à domicile.',
      riskFactors: {
        smokingPA: 0,
        biomassExposure: false,
        tbContact: false,
        allergiesAtopy: 'Terrain atopique documenté (rhinite allergique saisonnière)',
        previousTB: false,
        hivStatus: 'NEGATIF' as const,
        diabetesHta: 'Aucune comorbidité',
        occupationalExposure: 'Enseignant'
      },
      antecedentsText: 'Asthme persistant modéré diagnostiqué dans l\'enfance. Traitement de fond irrégulier.',
      vitals: {
        bp: '125/75',
        pulse: 104,
        rr: 24,
        spo2Ambient: 93,
        spo2O2: 98,
        o2FlowLiters: 2,
        temperature: 37.1,
        weight: 62,
        height: 168,
        bmi: 22.0,
        glasgowScore: 15,
        painEva: 2,
        generalState: 'BON' as const
      },
      systems: {
        pulmonaryVesicularBreath: 'Murmure vésiculaire (diminué bilatéralement avec temps expiratoire très prolongé)',
        pulmonaryCrackles: 'Râles crépitants (absents)',
        pulmonaryWheezes: 'Sibilants (sibilants expiratoires diffus bilatéraux en nappe)',
        pulmonaryRhonchi: 'Ronchis (absents)',
        pleuralFriction: 'Frottement pleural (absent)',
        cyanosisClubbing: 'Cyanose (pas de cyanose, pas d\'hippocratisme)',
        cardiovascular: '(Tachycardie sinusale à 104 bpm, pas de signe de coeur pulmonaire)',
        abdomen: '(Abdomen souple)',
        neurological: '(Anxieux mais conscient et orienté)',
        entLymphNodes: '(Pas d\'adénopathie)',
        cutaneous: '(Pâleur sans sueurs profuses)'
      },
      syndromicSummary: 'Syndrome obstructif bronchique paroxystique aigu avec sibilance bilatérale chez un adulte jeune atopique en rupture de traitement de fond.',
      diagnosticHypotheses: [
        '1. Exacerbation aiguë sévère d\'asthme bronchique',
        '2. Réaction anaphylactique respiratoire isolée',
        '3. Corps étranger inhalé ou fausse route (éliminé par l\'anamnèse)'
      ],
      paraclinicalOrdered: {
        chestXray: true,
        chestCT: false,
        spirometry: false,
        bloodGas: false,
        nfsCrp: true,
        geneXpertBK: false,
        pleuralPuncture: false,
        otherNotes: 'Radiographie thoracique face (éliminer un pneumothorax compressif ou pneumomédiastin) + Peak Flow (DEP) au lit du patient.'
      },
      diagnoses: [
        {
          id: 'diag-asthma-auto',
          codeCIM11: 'CA23.3',
          label: 'Exacerbation aiguë sévère d\'asthme',
          type: 'PRINCIPAL' as const,
          status: 'CONFIRME' as const,
          dateDiagnosed: new Date().toISOString().split('T')[0]
        }
      ],
      managementPlan: {
        medicationsPrescribed: `1. Salbutamol 100 µg (Ventoline) : 4 bouffées avec chambre d'inhalation toutes les 20 minutes la première heure, puis 2 à 4 bouffées toutes les 4h.\n2. Prednisolone 20 mg : 2 comprimés par jour le matin (40 mg/j) pendant 5 jours stricts.\n3. Budésonide/Formotérol 160/4.5 µg : 1 inhalation matin et soir en traitement de fond quotidien à démarrer dès stabilisation.\n4. Règle d'or : Chambre d'inhalation recommandée pour optimiser le dépôt bronchique.`,
        nonPharmacological: 'Éviction rigoureuse des allergènes et irritants (acariens, parfums, fumées), éducation à la technique d\'inhalation.',
        orientation: 'AMBULATOIRE' as const,
        antibioticStewardship: {
          molecule: 'Pas d\'antibiothérapie (crise d\'asthme virale ou allergique non compliquée)',
          durationDays: 0,
          reassessmentDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
          notes: 'Antibiothérapie non indiquée en première intention'
        }
      },
      followUp: {
        nextAppointmentDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        keyWarningSigns: 'Difficulté à prononcer les mots, silence auscultatoire (crise aiguë gravissime), épuisement respiratoire.',
        notes: 'Contrôle à J+7 pour évaluation du contrôle (score ACT) et prescription EFR de contrôle.'
      }
    }
  },
  {
    id: 'pneumonia_pac',
    name: 'Pneumonie Aiguë (PAC)',
    badge: 'Infectiologie',
    icon: '🌡️',
    twelveSteps: {
      civilStatusNotes: 'Patient vivant à Kaolack, pas de notion de voyage récent.',
      chiefComplaint: 'Fièvre brutale à 39.5°C avec frissons solennels, point de côté thoracique droit et toux productive à crachats rouillés.',
      historyOfIllness: 'Début brutal il y a 72 heures marqué par un grand frisson suivi d\'une ascension thermique à 39.5°C, apparition concomitante d\'un point de côté basi-thoracique droit exacerbé par la toux et les mouvements respiratoires, associé à une toux ramenant des expectorations visqueuses rouillées.',
      riskFactors: {
        smokingPA: 5,
        biomassExposure: false,
        tbContact: false,
        allergiesAtopy: 'Aucune allergie',
        previousTB: false,
        hivStatus: 'NEGATIF' as const,
        diabetesHta: 'Diabète type 2 équilibré sous régime et metformine',
        occupationalExposure: 'Agriculteur'
      },
      antecedentsText: 'Diabète de type 2 connu depuis 5 ans.',
      vitals: {
        bp: '120/75',
        pulse: 96,
        rr: 24,
        spo2Ambient: 94,
        spo2O2: 98,
        o2FlowLiters: 2,
        temperature: 39.3,
        weight: 70,
        height: 174,
        bmi: 23.1,
        glasgowScore: 15,
        painEva: 6,
        generalState: 'ALTERE_LEGER' as const
      },
      systems: {
        pulmonaryVesicularBreath: 'Murmure vésiculaire (diminué à la base droite)',
        pulmonaryCrackles: 'Râles crépitants (crépitants en foyer en base droite)',
        pulmonaryWheezes: 'Sibilants (absents)',
        pulmonaryRhonchi: 'Ronchis (absents)',
        pleuralFriction: 'Frottement pleural (discret frottement pleural base droite)',
        cyanosisClubbing: 'Cyanose (pas de cyanose)',
        cardiovascular: '(Tachycardie régulière à 96 bpm, BDC purs sans souffle)',
        abdomen: '(Souple, pas d\'hépatomégalie)',
        neurological: '(Conscient, orienté, pas de confusion)',
        entLymphNodes: '(Pas d\'adénopathie)',
        cutaneous: '(Faciès vultueux, sueurs fébriles)'
      },
      syndromicSummary: 'Syndrome de condensation pulmonaire parenchymateuse fébrile aiguë de la base droite avec point de côté thoracique typique de pneumonie franche lobaire aiguë.',
      diagnosticHypotheses: [
        '1. Pneumonie aiguë communautaire (PAC) bactérienne à Streptococcus pneumoniae',
        '2. Pleurésie parapneumonique associée',
        '3. Tuberculose pulmonaire aiguë de forme condensante'
      ],
      paraclinicalOrdered: {
        chestXray: true,
        chestCT: false,
        spirometry: false,
        bloodGas: false,
        nfsCrp: true,
        geneXpertBK: true,
        pleuralPuncture: false,
        otherNotes: 'Cliché thoracique face et profil (opacité alvéolaire systématisée) + NFS (hyperleucocytose à PNN), CRP, Glycémie, GeneXpert crachats.'
      },
      diagnoses: [
        {
          id: 'diag-pac-auto',
          codeCIM11: 'CA20',
          label: 'Pneumonie aiguë communautaire bactérienne',
          type: 'PRINCIPAL' as const,
          status: 'CONFIRME' as const,
          dateDiagnosed: new Date().toISOString().split('T')[0]
        }
      ],
      managementPlan: {
        medicationsPrescribed: `1. Amoxicilline 1g : 1 comprimé 3 fois par jour (toutes les 8 heures) pendant 7 jours.\n2. Paracétamol 1g : 1 comprimé toutes les 8h en cas de fièvre > 38.5°C ou douleur thoracique.\n3. Hydratation abondante per os (au moins 2 litres d'eau/jour).\n4. Repos strict au lit pendant la phase fébrile.`,
        nonPharmacological: 'Alimentation fractionnée équilibrée, surveillance de la courbe thermique matin et soir.',
        orientation: 'AMBULATOIRE' as const,
        antibioticStewardship: {
          molecule: 'Amoxicilline 1g PO (Première intention recommandation pneumologie)',
          durationDays: 7,
          reassessmentDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          notes: 'Réévaluation obligatoire de la défervescence thermique à 48 heures'
        }
      },
      followUp: {
        nextAppointmentDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        keyWarningSigns: 'Persistance de la fièvre à J+2 ou J+3, apparition d\'une désaturation SpO2 < 92%, confusion mentale, vomissements empêchant la prise orale.',
        notes: 'Réévaluation clinique impérative à 48 heures. Radiographie de contrôle à 1 mois pour vérifier le nettoyage radiologique complet.'
      }
    }
  },
  {
    id: 'embolism_suspect',
    name: 'Suspicion Embolie Pulmonaire',
    badge: 'Urgence Vasculaire',
    icon: '🩸',
    twelveSteps: {
      civilStatusNotes: 'Patient revenu d\'un long voyage en car Kaolack-Dakar-Matam la semaine précédente.',
      chiefComplaint: 'Douleur thoracique basale droite brutale en coup de poignard avec polypnée d\'apparition soudaine et anxiété.',
      historyOfIllness: 'Survenue brutale ce matin sans facteur déclenchant évident d\'un point de côté basi-thoracique droit bloquant l\'inspiration profonde, associé à un essoufflement immédiat sine materia et une sensation d\'angoisse. Pas de fièvre franche.',
      riskFactors: {
        smokingPA: 12,
        biomassExposure: false,
        tbContact: false,
        allergiesAtopy: 'Aucune allergie',
        previousTB: false,
        hivStatus: 'NEGATIF' as const,
        diabetesHta: 'HTA',
        occupationalExposure: 'Voyage prolongé récent (> 8 heures assis)'
      },
      antecedentsText: 'Antécédent d\'immobilisation prolongée récente. Tabagisme actif.',
      vitals: {
        bp: '135/85',
        pulse: 110,
        rr: 28,
        spo2Ambient: 91,
        spo2O2: 96,
        o2FlowLiters: 3,
        temperature: 37.4,
        weight: 75,
        height: 175,
        bmi: 24.5,
        glasgowScore: 15,
        painEva: 7,
        generalState: 'ALTERE_LEGER' as const
      },
      systems: {
        pulmonaryVesicularBreath: 'Murmure vésiculaire (conservé symétrique bilatéral sans foyer)',
        pulmonaryCrackles: 'Râles crépitants (absents - auscultation pulmonaire paradoxalement normale)',
        pulmonaryWheezes: 'Sibilants (absents)',
        pulmonaryRhonchi: 'Ronchis (absents)',
        pleuralFriction: 'Frottement pleural (discret frottement pleural base droite)',
        cyanosisClubbing: 'Cyanose (discrète cyanose unguéale en air ambiant)',
        cardiovascular: '(Tachycardie sinusale franche à 110 bpm, éclat de B2 au foyer pulmonaire)',
        abdomen: '(Souple, pas de douleur abdominale)',
        neurological: '(Anxieux, conscient, Glasgow 15)',
        entLymphNodes: '(Pas d\'adénopathie)',
        cutaneous: '(Membre inférieur droit : discret oedème du mollet unilatéral avec perte du ballottement)'
      },
      syndromicSummary: 'Syndrome vasculaire pulmonaire aigu associant tachycardie inexpliquée, douleur basi-thoracique aiguë bloquant l\'inspiration, hypoxémie et auscultation pulmonaire normale (dyspnée sine materia) sur terrain d\'alitement/voyage prolongé.',
      diagnosticHypotheses: [
        '1. Embolie pulmonaire aiguë de gravité intermédiaire (Score de Wells élevé)',
        '2. Pleurésie séro-fibrineuse débutante',
        '3. Pneumothorax spontané (éliminé par la radiographie)'
      ],
      paraclinicalOrdered: {
        chestXray: true,
        chestCT: true,
        spirometry: false,
        bloodGas: true,
        nfsCrp: true,
        geneXpertBK: false,
        pleuralPuncture: false,
        otherNotes: 'Angioscanner thoracique avec injection en urgence + D-Dimères quantitatifs, Troponine, ECG 12 dérivations, Gazométrie artérielle.'
      },
      diagnoses: [
        {
          id: 'diag-pe-auto',
          codeCIM11: 'CB00',
          label: 'Embolie pulmonaire',
          type: 'PRINCIPAL' as const,
          status: 'SUSPECTE' as const,
          dateDiagnosed: new Date().toISOString().split('T')[0]
        }
      ],
      managementPlan: {
        medicationsPrescribed: `1. Oxygénothérapie au masque à 3 L/min pour maintenir SpO2 > 95%.\n2. Énoxaparine (Lovenox) 100 UI/kg (0.1 mL/10 kg) en injection sous-cutanée toutes les 12h en attente de l'angioscanner après vérification de la clairance de la créatinine.\n3. Paracétamol 1g IV sur 15 minutes si douleur EVA > 5.\n4. Repos strict au lit avec lever interdit.`,
        nonPharmacological: 'Pose de 2 voies veineuses périphériques de bon calibre, monitorage cardiorespiratoire continu.',
        orientation: 'HOSPITALISATION' as const,
        antibioticStewardship: {
          molecule: 'Pas d\'antibiothérapie requise (indication anticoagulation curative)',
          durationDays: 0,
          reassessmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          notes: 'Prise en charge hémodynamique et antithrombotique prioritaire'
        }
      },
      followUp: {
        nextAppointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        keyWarningSigns: 'Chute de la tension artérielle PAS < 90 mmHg (état de choc cardiogénique obstructif), syncope, douleur thoracique constrictive.',
        notes: 'Transfert en unité de soins continus ou réanimation si instabilité hémodynamique.'
      }
    }
  }
];

export const Consultations: React.FC = () => {
  const {
    patients,
    updatePatient,
    consultations,
    saveConsultation,
    hospitalizations,
    addNurseVitalRecord,
    medicalExplorations,
    saveMedicalExploration,
    clinicalScoreCalculations,
    saveClinicalScoreCalculation,
    currentUser,
    currentCenter
  } = useStore();

  const [searchParams] = useSearchParams();
  const paramPatientId = searchParams.get('patientId');
  const paramMode = searchParams.get('mode');

  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    if (paramPatientId && patients.some(p => p.id === paramPatientId)) {
      return paramPatientId;
    }
    return patients[0]?.id || '';
  });
  const [activeStepTab, setActiveStepTab] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'STEP_BY_STEP' | 'CONTINUOUS_SHEET' | 'EXPRESS_URGENCY'>(() =>
    paramMode === 'urgency' ? 'EXPRESS_URGENCY' : 'STEP_BY_STEP'
  );

  useEffect(() => {
    if (paramPatientId && patients.some(p => p.id === paramPatientId)) {
      setSelectedPatientId(paramPatientId);
    }
  }, [paramPatientId, patients]);

  useEffect(() => {
    if (paramMode === 'urgency') {
      setViewMode('EXPRESS_URGENCY');
    }
  }, [paramMode]);
  const [stepsOrientation, setStepsOrientation] = useState<'VERTICAL' | 'HORIZONTAL'>(() => {
    try {
      const saved = localStorage.getItem('chrein_steps_orientation');
      if (saved === 'VERTICAL' || saved === 'HORIZONTAL') return saved;
    } catch {
      // ignore
    }
    return 'VERTICAL';
  });
  const [isMobileStepsExpanded, setIsMobileStepsExpanded] = useState(false);

  const updateStepsOrientation = (orientation: 'VERTICAL' | 'HORIZONTAL') => {
    setStepsOrientation(orientation);
    try {
      localStorage.setItem('chrein_steps_orientation', orientation);
    } catch {
      // ignore
    }
  };

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDocumentType, setPrintDocumentType] = useState<'OBSERVATION' | 'ORDONNANCE' | 'EXAMENS' | 'CERTIFICAT'>('OBSERVATION');
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [dockAiPanel, setDockAiPanel] = useState(false);

  // Interactive Clinical Calculators & Presets state
  const [selectedMmrcGrade, setSelectedMmrcGrade] = useState<number | null>(null);
  const [selectedDrugCategory, setSelectedDrugCategory] = useState<string>('Bronchodilatateurs & Aérosols');
  const [activeAuscultationZone, setActiveAuscultationZone] = useState<string>('apex_droit');

  // Step 7: Structured syndromic builder state
  const [newSyndromeText, setNewSyndromeText] = useState('');
  const [newSyndromeSeverity, setNewSyndromeSeverity] = useState<'CRITIQUE' | 'MAJEUR' | 'MODERE'>('MAJEUR');

  // Step 9: Categorized A-F paraclinical selector state
  const [selectedMacroCat, setSelectedMacroCat] = useState<MacroExplorationCategoryId>('BIOLOGIE');
  const [customExamName, setCustomExamName] = useState('');
  const [newFollowUpInputs, setNewFollowUpInputs] = useState<Record<string, string>>({});

  // Contextual Clinical Scores panel state (after Step 8 Hypothèses & Step 10 Diagnostics)
  const [activeInlineScoreId, setActiveInlineScoreId] = useState<ClinicalScoreCalculation['scoreId'] | null>(null);
  const [inlineScoreInputs, setInlineScoreInputs] = useState<Record<string, any>>({});
  const [inlineScoreSearch, setInlineScoreSearch] = useState('');
  const [inlineScoreSavedMsg, setInlineScoreSavedMsg] = useState<string | null>(null);

  // CIM-11 Search state
  const [cim11Query, setCim11Query] = useState('');
  const [selectedCimCategory, setSelectedCimCategory] = useState<string>('TOUS');

  // Speech recognition state (Section 10)
  const [isRecording, setIsRecording] = useState(false);
  const [speechTargetField, setSpeechTargetField] = useState<string>('historyOfIllness');
  const [transcriptNotice, setTranscriptNotice] = useState<string>('');
  const [voiceActionNotice, setVoiceActionNotice] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>('tb_active');

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const patientConsultations = consultations.filter(c => c.patientId === selectedPatient?.id);
  const patientExplorations = useMemo(
    () => medicalExplorations.filter(e => e.patientId === selectedPatient?.id),
    [medicalExplorations, selectedPatient?.id]
  );
  const patientScoresToday = useMemo(
    () => clinicalScoreCalculations.filter(s => s.patientId === selectedPatient?.id),
    [clinicalScoreCalculations, selectedPatient?.id]
  );

  // 12-Step Form State conforming strictly to Section 4 of Cahier des Charges
  const [form12Steps, setForm12Steps] = useState<ConsultationTwelveSteps>({
    chiefComplaint: 'Toux persistante fébrile avec expectorations purulentes et dyspnée d\'effort depuis 3 semaines.',
    historyOfIllness: 'Début progressif il y a environ 3 semaines marqué par une toux d\'abord sèche puis productive, accompagnée d\'une fièvre vespéro-nocturne, de sueurs profuses nocturnes et d\'une altération marquée de l\'état général avec amaigrissement de 5 kg. Notion d\'essoufflement d\'aggravation progressive.',
    riskFactors: {
      smokingPA: 15,
      biomassExposure: true,
      tbContact: true,
      allergiesAtopy: 'Aucune allergie médicamenteuse connue',
      previousTB: false,
      hivStatus: 'NEGATIF',
      diabetesHta: 'HTA traitée sous Amlodipine 5mg',
      occupationalExposure: 'Agriculteur / Poussières de battage'
    },
    antecedentsText: 'Tabagisme sevré il y a 2 ans. Cuisine au feu de bois familiale. Notion de contage tuberculeux intrafamilial (neveu traité en 2024).',
    vitals: {
      bp: '120/75',
      pulse: 88,
      rr: 24,
      spo2Ambient: 93,
      spo2O2: 98,
      o2FlowLiters: 2,
      temperature: 38.4,
      weight: 58,
      height: 172,
      bmi: 19.6,
      glasgowScore: 15,
      painEva: 2,
      generalState: 'ALTERE_LEGER'
    },
    systems: {
      pulmonaryVesicularBreath: 'Murmure vésiculaire (diminué à l\'apex droit et aux deux bases)',
      pulmonaryCrackles: 'Râles crépitants (localisés au sommet pulmonaire droit)',
      pulmonaryWheezes: 'Sibilants (absents)',
      pulmonaryRhonchi: 'Ronchis (diffus bilatéraux discrets)',
      pleuralFriction: 'Frottement pleural (négatif)',
      cyanosisClubbing: 'Cyanose (négative) - Hippocratisme digital (discret grade 1)',
      cardiovascular: 'Bruits du coeur réguliers, pas de souffle. Pas de turgescence jugulaire ni de reflux hépato-jugulaire ()',
      abdomen: 'Abdomen souple, indolore, pas d\'hépatomégalie ni de splénomégalie ()',
      neurological: 'Patient conscient, bien orienté dans le temps et l\'espace ()',
      entLymphNodes: 'Pas d\'adénopathie cervicale ni sous-claviculaire palpable ()',
      cutaneous: 'Pas d\'éruption cutanée, sueurs nocturnes confirmées ()'
    },
    syndromicSummary: 'Syndrome de condensation pulmonaire de l\'apex droit fébrile subaigu avec altération de l\'état général et amaigrissement chez un patient tabagique exposé au contage tuberculeux.',
    diagnosticHypotheses: [
      '1. Tuberculose pulmonaire active (TPM+ / bactériologique) en première hypothèse',
      '2. Pneumopathie bactérienne subaiguë ou abcès pulmonaire',
      '3. Néoplasie bronchopulmonaire sous-jacente sur terrain tabagique'
    ],
    paraclinicalOrdered: {
      chestXray: true,
      chestCT: false,
      spirometry: false,
      bloodGas: true,
      nfsCrp: true,
      geneXpertBK: true,
      pleuralPuncture: false,
      otherNotes: 'GeneXpert MTB/RIF sur crachats du matin en urgence + NFS, CRP, Gazométrie artérielle.'
    },
    diagnoses: [
      {
        id: 'diag-1',
        codeCIM11: '1B10.0',
        label: 'Tuberculose de l\'appareil respiratoire, confirmée par bactériologie',
        type: 'PRINCIPAL',
        status: 'CONFIRME',
        dateDiagnosed: new Date().toISOString().split('T')[0],
        notes: 'GeneXpert MTB positif sensible à la Rifampicine.'
      },
      {
        id: 'diag-2',
        codeCIM11: 'BA00',
        label: 'Hypertension artérielle essentielle',
        type: 'CHRONIQUE_ANTECEDENT',
        status: 'CHRONIQUE',
        dateDiagnosed: '2022-03-10'
      }
    ],
    managementPlan: {
      medicationsPrescribed: PRESCRIPTION_TEMPLATES.tb_pnt.text,
      antibioticStewardship: {
        molecule: 'RHZE (Rifampicine, Isoniazide, Pyrazinamide, Éthambutol)',
        dose: 'Dose fixe combinée selon poids (4 comprimés/jour)',
        route: 'Voie Orale',
        durationDays: 60,
        indication: 'Tuberculose pulmonaire TPM+ sensible nouveau cas',
        reassessmentDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      },
      oxygenotherapy: 'O2 par lunettes nasales 2 L/min si SpO2 < 92%',
      physiotherapy: true,
      orientation: 'AMBULATOIRE'
    },
    followUp: {
      nextAppointmentDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      keyWarningSigns: 'Hémoptysie, ictère cutanéo-muqueux (toxicité hépatique RHZE), vomissements incoercibles ou baisse de l\'acuité visuelle (Éthambutol).',
      notes: 'Contrôle bactériologique des crachats programmé à la fin du 2ème mois (M2).'
    }
  });

  // AI Assistance state (Section 10)
  const [aiSuggestions, setAiSuggestions] = useState<{
    summary?: string;
    hypotheses?: string[];
    missingFields?: string[];
    antibioticGuidance?: string;
  }>({
    summary: 'Patient de 46 ans consultant pour toux productive fébrile subaiguë évoluant depuis 3 semaines avec amaigrissement de 5 kg et sueurs nocturnes. Examen : râles crépitants apicaux droits et condensation. Terrain : tabac 15 PA et contage tuberculeux.',
    hypotheses: [
      'Tuberculose pulmonaire confirmée ou clinique (1B10.0)',
      'Pneumonie aiguë communautaire bactérienne (CA20)',
      'Bronchopneumopathie chronique obstructive décompensée (CA22.0)'
    ],
    missingFields: [
      'Contrôle de la glycémie capillaire pour écarter un diabète associé',
      'Vérification du bilan hépatique avant l\'initiation de la Pyrazinamide/Rifampicine'
    ],
    antibioticGuidance: 'Respecter le schéma quadrithérapie du PNT sans ajout intempestif de fluoroquinolones qui masqueraient une tuberculose résistante.'
  });

  // Carry-forward patient civil status & antecedents on patient switch (without clobbering manual scenario injection)
  const lastAutoLoadedPatientIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedPatient?.id || selectedPatient.id === lastAutoLoadedPatientIdRef.current) return;
    lastAutoLoadedPatientIdRef.current = selectedPatient.id;

    const dpi = buildDpiFromPatient(selectedPatient);
    const antSummaryParts: string[] = [];
    if (dpi.medicalAntecedents.length > 0) antSummaryParts.push(dpi.medicalAntecedents.join(', '));
    if (dpi.medicalAntecedentsOther) antSummaryParts.push(dpi.medicalAntecedentsOther);
    if (dpi.smokingStatus !== 'JAMAIS') {
      antSummaryParts.push(
        `Tabagisme ${dpi.smokingStatus === 'ANCIEN' ? 'sevré' : 'actif'} (${dpi.smokingPackYears} PA)`
      );
    }
    if (dpi.biomassExposure) antSummaryParts.push('Exposition biomasse');
    if (selectedPatient.chronicConditions && antSummaryParts.length === 0) {
      antSummaryParts.push(selectedPatient.chronicConditions);
    }

    setForm12Steps(prev => ({
      ...prev,
      maritalStatus: selectedPatient.maritalStatus || prev.maritalStatus || 'Non renseigné',
      educationLevel: selectedPatient.educationLevel || prev.educationLevel || 'Non renseigné',
      profession: selectedPatient.profession || prev.profession || '',
      emergencyPhone: selectedPatient.emergencyPhone || selectedPatient.phone || prev.emergencyPhone || '',
      riskFactors: {
        ...prev.riskFactors,
        smokingStatus: dpi.smokingStatus,
        cigarettesPerDay: dpi.cigarettesPerDay,
        smokingDurationYears: dpi.smokingDurationYears,
        smokingStoppedYear: dpi.smokingStoppedYear,
        smokingPeriods: dpi.smokingPeriods,
        smokingPA: dpi.smokingPackYears,
        biomassExposure: dpi.biomassExposure,
        cannabis: dpi.cannabis,
        alcohol: dpi.alcohol,
        otherDrugs: dpi.otherDrugs,
        medicalAntecedents: dpi.medicalAntecedents,
        medicalAntecedentsOther: dpi.medicalAntecedentsOther,
        occupationalProfile: dpi.occupationalProfile,
        occupationalExposure: dpi.occupationalProfile.currentProfession || prev.riskFactors.occupationalExposure,
        surgicalHistory: dpi.surgicalHistory,
        obgynHistory: dpi.obgynHistory,
        allergiesAtopy: selectedPatient.allergies || prev.riskFactors.allergiesAtopy
      },
      antecedentsText: antSummaryParts.length > 0 ? antSummaryParts.join('. ') : prev.antecedentsText,
      syndromicSelectedAntecedents: dpi.medicalAntecedents.length > 0
        ? [...dpi.medicalAntecedents]
        : prev.syndromicSelectedAntecedents || []
    }));
  }, [selectedPatient]);

  // Helper: map ConsultationTwelveSteps.riskFactors <-> DpiAntecedentsValue
  const dpiAntecedentsValue: DpiAntecedentsValue = useMemo(() => {
    const rf = form12Steps.riskFactors || {};
    return {
      smokingStatus: rf.smokingStatus || (rf.smokingStoppedYear ? 'ANCIEN' : (rf.smokingPA || 0) > 0 ? 'ACTUEL' : 'JAMAIS'),
      cigarettesPerDay: rf.cigarettesPerDay || 0,
      smokingDurationYears: rf.smokingDurationYears || 0,
      smokingStoppedYear: rf.smokingStoppedYear || '',
      smokingPeriods: rf.smokingPeriods || [],
      smokingPackYears: rf.smokingPA || 0,
      biomassExposure: Boolean(rf.biomassExposure),
      passiveSmoking: false,
      cannabis: {
        status: rf.cannabis?.status || 'JAMAIS',
        frequency: rf.cannabis?.frequency || '',
        duration: rf.cannabis?.duration || ''
      },
      alcohol: {
        status: rf.alcohol?.status || 'JAMAIS',
        frequency: rf.alcohol?.frequency || '',
        quantity: rf.alcohol?.quantity || ''
      },
      otherDrugs: {
        status: rf.otherDrugs?.status || 'NON_RENSEIGNE',
        substance: rf.otherDrugs?.substance || '',
        frequency: rf.otherDrugs?.frequency || '',
        duration: rf.otherDrugs?.duration || '',
        route: rf.otherDrugs?.route || ''
      },
      medicalAntecedents: rf.medicalAntecedents || [],
      medicalAntecedentsOther: rf.medicalAntecedentsOther || '',
      occupationalProfile: rf.occupationalProfile || {
        currentProfession: form12Steps.profession || selectedPatient?.profession || '',
        previousProfessions: '',
        exposures: rf.biomassExposure ? ['BIOMASSE'] : [],
        otherExposures: '',
        exposureConditions: ''
      },
      surgicalHistory: rf.surgicalHistory || [],
      obgynHistory: rf.obgynHistory || {}
    };
  }, [form12Steps.riskFactors, form12Steps.profession, selectedPatient?.profession]);

  const handleDpiAntecedentsChange = (nextDpi: DpiAntecedentsValue) => {
    setForm12Steps(prev => ({
      ...prev,
      profession: nextDpi.occupationalProfile.currentProfession || prev.profession,
      riskFactors: {
        ...prev.riskFactors,
        smokingStatus: nextDpi.smokingStatus,
        cigarettesPerDay: nextDpi.cigarettesPerDay,
        smokingDurationYears: nextDpi.smokingDurationYears,
        smokingStoppedYear: nextDpi.smokingStoppedYear,
        smokingPeriods: nextDpi.smokingPeriods,
        smokingPA: nextDpi.smokingPackYears,
        biomassExposure: nextDpi.biomassExposure,
        cannabis: nextDpi.cannabis,
        alcohol: nextDpi.alcohol,
        otherDrugs: nextDpi.otherDrugs,
        medicalAntecedents: nextDpi.medicalAntecedents,
        medicalAntecedentsOther: nextDpi.medicalAntecedentsOther,
        occupationalProfile: nextDpi.occupationalProfile,
        occupationalExposure: nextDpi.occupationalProfile.currentProfession || prev.riskFactors.occupationalExposure,
        surgicalHistory: nextDpi.surgicalHistory,
        obgynHistory: nextDpi.obgynHistory
      }
    }));
  };

  // Calculate BMI dynamically
  const bmiCalculation = useMemo(() => {
    const bmiVal = calcBmi(form12Steps.vitals.weight, form12Steps.vitals.height);
    if (!bmiVal) return null;
    let cat = 'Poids normal';
    let color = 'text-emerald-700 bg-emerald-50';
    if (bmiVal < 16) {
      cat = 'Dénutrition sévère';
      color = 'text-rose-700 bg-rose-50';
    } else if (bmiVal < 18.5) {
      cat = 'Maigreur / Dénutrition modérée';
      color = 'text-amber-700 bg-amber-50';
    } else if (bmiVal >= 25 && bmiVal < 30) {
      cat = 'Surpoids';
      color = 'text-blue-700 bg-blue-50';
    } else if (bmiVal >= 30) {
      cat = 'Obésité';
      color = 'text-purple-700 bg-purple-50';
    }
    return { value: bmiVal, category: cat, colorClass: color };
  }, [form12Steps.vitals.weight, form12Steps.vitals.height]);

  // Critical vitals alerts
  const vitalsAlerts = useMemo(() => {
    const alerts: string[] = [];
    const effectiveSpo2 = form12Steps.vitals.spo2Mode === 'SOUS_O2'
      ? Number(form12Steps.vitals.spo2O2)
      : Number(form12Steps.vitals.spo2Ambient);
    const rr = Number(form12Steps.vitals.rr);
    const temp = Number(form12Steps.vitals.temperature);
    if (effectiveSpo2 && effectiveSpo2 < 90) {
      alerts.push(
        form12Steps.vitals.spo2Mode === 'SOUS_O2'
          ? `🚨 Désaturation sévère SpO2 = ${effectiveSpo2}% sous O2 (Réévaluer débit/dispositif)`
          : '🚨 Désaturation sévère SpO2 < 90% en air ambiant (Urgence oxygénothérapie)'
      );
    } else if (effectiveSpo2 && effectiveSpo2 < 93) {
      alerts.push(`⚠️ Hypoxémie modérée SpO2 = ${effectiveSpo2}%`);
    }
    if (rr && rr >= 26) alerts.push(`⚠️ Polypnée / Tachypnée marquée (FR = ${rr}/min)`);
    if (temp && temp >= 38.5) alerts.push(`🌡️ Syndrome fébrile élevé (T° = ${temp}°C)`);
    else if (temp && temp <= 35.8) alerts.push(`❄️ Hypothermie anormale (T° = ${temp}°C)`);
    return alerts;
  }, [form12Steps.vitals.spo2Ambient, form12Steps.vitals.spo2O2, form12Steps.vitals.spo2Mode, form12Steps.vitals.rr, form12Steps.vitals.temperature]);

  // PNT 2RHZE Dosage Calculator
  const pntDosage = useMemo(() => {
    return getPntRhzeDosage(Number(form12Steps.vitals.weight) || 55);
  }, [form12Steps.vitals.weight]);

  // Apply mMRC Dyspnea grade inside Step 3 (Histoire de la maladie)
  const handleApplyMmrcGrade = (grade: number) => {
    setSelectedMmrcGrade(grade);
    const scale = MMRC_DYSPNEA_SCALE.find(s => s.grade === grade);
    if (!scale) return;
    const textToAppend = `Dyspnée évaluée au stade mMRC ${grade} (${scale.desc}).`;
    setForm12Steps(prev => {
      const cleaned = (prev.historyOfIllness || '').replace(/Dyspnée évaluée au stade mMRC \d \([^)]*\)\.?/g, '').trim();
      return {
        ...prev,
        mmrcGrade: grade,
        historyOfIllness: cleaned ? `${cleaned} ${textToAppend}` : textToAppend
      };
    });
  };

  // Step 5: Record a new vitals series snapshot
  const handleRecordVitalsSeries = () => {
    const v = form12Steps.vitals;
    const computedBmi = calcBmi(v.weight, v.height) ?? v.bmi;
    const newEntry: VitalsSeriesEntry = {
      id: `vs-${Date.now()}`,
      timestamp: new Date().toISOString(),
      bp: v.bp,
      pulse: v.pulse,
      rr: v.rr,
      spo2Mode: v.spo2Mode || 'AIR_AMBIANT',
      spo2Ambient: v.spo2Ambient,
      spo2O2: v.spo2O2,
      o2FlowLiters: v.o2FlowLiters,
      o2Device: v.o2Device,
      fio2: v.fio2,
      temperature: v.temperature,
      weight: v.weight,
      height: v.height,
      bmi: computedBmi,
      generalState: v.generalState
    };
    setForm12Steps(prev => ({
      ...prev,
      vitals: { ...prev.vitals, bmi: computedBmi },
      vitalsSeries: [newEntry, ...(prev.vitalsSeries || [])]
    }));

    // Also feed nursing vital records if patient is currently hospitalized
    const activeHosp = hospitalizations.find(h => h.patientId === selectedPatient?.id && h.status === 'active');
    if (activeHosp && selectedPatient) {
      addNurseVitalRecord({
        id: `nv-cons-${Date.now()}`,
        patientId: selectedPatient.id,
        hospitalizationId: activeHosp.id,
        centerId: currentCenter?.id || 'center-1',
        timestamp: newEntry.timestamp,
        bp: v.bp || '120/80',
        pulse: Number(v.pulse || 80),
        rr: Number(v.rr || 18),
        spo2: Number(v.spo2Mode === 'SOUS_O2' ? (v.spo2O2 || 96) : (v.spo2Ambient || 96)),
        spo2Mode: v.spo2Mode || 'AIR_AMBIANT',
        o2FlowLiters: v.spo2Mode === 'SOUS_O2' ? Number(v.o2FlowLiters || 0) : 0,
        o2Device: v.spo2Mode === 'SOUS_O2' ? (v.o2Device || 'Lunettes nasales') : 'Air ambiant',
        fio2: v.spo2Mode === 'SOUS_O2' ? v.fio2 : undefined,
        temperature: Number(v.temperature || 37),
        weight: v.weight ? Number(v.weight) : undefined,
        height: v.height ? Number(v.height) : undefined,
        bmi: computedBmi,
        generalState: v.generalState,
        consciousnessGlasgow: v.glasgowScore,
        painEva: v.painEva,
        nurseName: currentUser?.name || 'Praticien Consultation',
        notes: v.spo2Mode === 'SOUS_O2'
          ? `Sous O2 (${v.o2FlowLiters || 0} L/min via ${v.o2Device || 'Lunettes nasales'}${v.fio2 ? `, FiO2 ${v.fio2}%` : ''})`
          : 'Air ambiant'
      });
    }

    setVoiceActionNotice({
      type: 'success',
      message: `✓ Série de constantes enregistrée (${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`
    });
    setTimeout(() => setVoiceActionNotice(null), 3500);
  };

  // Insert PNT 2RHZE dosage directly into prescription
  const handleInsertPntRhze = () => {
    const pntText = `1. Schéma 2RHZE (Directives PNT Sénégal) : ${pntDosage.text} en 1 prise matinale unique à jeun pendant 60 jours.\n2. ${pntDosage.b6} en prévention de la neuropathie sous Isoniazide.\n3. Contrôle GeneXpert / bactériologique des crachats obligatoire à M2 au CHREIN.`;
    setForm12Steps(prev => {
      const current = prev.managementPlan.medicationsPrescribed?.trim() || '';
      return {
        ...prev,
        managementPlan: {
          ...prev.managementPlan,
          medicationsPrescribed: current ? `${current}\n\n${pntText}` : pntText
        }
      };
    });
  };

  // Append a drug from the formulary
  const handleAppendPrescription = (name: string, posology: string) => {
    const newEntry = `${name} : ${posology}.`;
    setForm12Steps(prev => {
      const current = prev.managementPlan.medicationsPrescribed?.trim() || '';
      return {
        ...prev,
        managementPlan: {
          ...prev.managementPlan,
          medicationsPrescribed: current ? `${current}\n• ${newEntry}` : `• ${newEntry}`
        }
      };
    });
  };

  // Apply auscultation zone finding
  const handleApplyAuscultationZone = (findingText: string) => {
    const zoneObj = THORACIC_ZONES.find(z => z.id === activeAuscultationZone);
    const zoneName = zoneObj ? zoneObj.label : 'Pulmonaire';
    const formatted = `${zoneName} : ${findingText}`;
    
    if (findingText.includes('sibilant') || findingText.includes('wheezing')) {
      setForm12Steps(prev => ({
        ...prev,
        systems: { ...prev.systems, pulmonaryWheezes: formatted }
      }));
    } else if (findingText.includes('crépitant')) {
      setForm12Steps(prev => ({
        ...prev,
        systems: { ...prev.systems, pulmonaryCrackles: formatted }
      }));
    } else if (findingText.includes('frottement')) {
      setForm12Steps(prev => ({
        ...prev,
        systems: { ...prev.systems, pleuralFriction: formatted }
      }));
    } else {
      setForm12Steps(prev => ({
        ...prev,
        systems: { ...prev.systems, pulmonaryVesicularBreath: formatted }
      }));
    }
  };

  // Express Urgency Preset Handler (3-Minute Resuscitation & Triage)
  const handleApplyUrgencyProtocol = (protoType: 'ASTHME_GRAVE' | 'BPCO_EXACERBEE' | 'PAC_SEVERITE' | 'EMBOLIE_GRAVE') => {
    if (protoType === 'ASTHME_GRAVE') {
      setForm12Steps(prev => ({
        ...prev,
        chiefComplaint: 'Crise d\'asthme aiguë grave (AAG) : polypnée, sibilance en nappe, difficulté à parler et épuisement.',
        vitals: {
          ...prev.vitals,
          rr: 32,
          spo2Ambient: 88,
          spo2O2: 95,
          o2FlowLiters: 6,
          pulse: 122,
          bp: '145/90',
          generalState: 'ALTERE_SEVERE'
        },
        syndromicSummary: 'Détresse respiratoire aiguë obstructive paroxystique sévère avec hypoxémie et tachycardie sinusale réactionnelle.',
        diagnoses: [{
          id: 'urg-asthme',
          codeCIM11: 'CA23.3',
          label: 'Exacerbation aiguë sévère d\'asthme',
          type: 'PRINCIPAL',
          status: 'CONFIRME',
          dateDiagnosed: new Date().toISOString().split('T')[0]
        }],
        managementPlan: {
          ...prev.managementPlan,
          medicationsPrescribed: `1. Oxygénothérapie au masque à 6 L/min pour SpO2 94-98%.\n2. Nébulisation en urgence : Salbutamol 5mg + Ipratropium 0.5mg sous O2 6-8 L/min toutes les 20 min (3 nébulisations la 1ère heure).\n3. Méthylprednisolone 80 mg IV lente ou Solupred 80 mg PO immédiat.\n4. Pose d'une voie veineuse périphérique (VVP) de bon calibre avec sérum physiologique.\n5. Surveillance scopée continue (FC, SpO2, FR, conscience).`,
          orientation: 'HOSPITALISATION'
        }
      }));
    } else if (protoType === 'BPCO_EXACERBEE') {
      setForm12Steps(prev => ({
        ...prev,
        chiefComplaint: 'Décompensation respiratoire aiguë de BPCO : expectorations purulentes, tirage et encéphalopathie respiratoire débutante.',
        vitals: {
          ...prev.vitals,
          rr: 28,
          spo2Ambient: 82,
          spo2O2: 90,
          o2FlowLiters: 1.5,
          pulse: 108,
          bp: '150/95',
          generalState: 'ALTERE_SEVERE'
        },
        syndromicSummary: 'Décompensation aiguë d\'insuffisance respiratoire chronique obstructive avec risque hypercapnique majeur.',
        diagnoses: [{
          id: 'urg-bpco',
          codeCIM11: 'CA22.0',
          label: 'BPCO avec exacerbation aiguë',
          type: 'PRINCIPAL',
          status: 'CONFIRME',
          dateDiagnosed: new Date().toISOString().split('T')[0]
        }],
        managementPlan: {
          ...prev.managementPlan,
          medicationsPrescribed: `1. Oxygénothérapie contrôlée à bas débit 1.5 L/min (Cible SpO2 88-92% absolue pour éviter la levée du stimulus hypoxique).\n2. Aérosols Salbutamol 5mg + Atrovent 0.5mg sous air comprimé (ou O2 max 4 L/min).\n3. Amoxicilline-Acide Clavulanique 1g IV x 3/jour ou Ceftriaxone 2g IV/jour.\n4. Prednisolone 40 mg/jour PO pendant 5 jours.\n5. Gazométrie artérielle en urgence à renouveler après 1h d'O2. Indication VNI si pH < 7.35 et PaCO2 > 45 mmHg.`,
          orientation: 'HOSPITALISATION'
        }
      }));
    } else if (protoType === 'PAC_SEVERITE') {
      setForm12Steps(prev => ({
        ...prev,
        chiefComplaint: 'Pneumonie aiguë sévère communautaire fébrile avec polypnée, confusion et point de côté (CRB-65 élevé).',
        vitals: {
          ...prev.vitals,
          temperature: 39.6,
          rr: 34,
          spo2Ambient: 86,
          spo2O2: 94,
          o2FlowLiters: 4,
          pulse: 116,
          bp: '90/55',
          generalState: 'ALTERE_SEVERE'
        },
        syndromicSummary: 'Pneumonie franche lobaire aiguë avec critères de gravité hémodynamique et respiratoire (Score CRB-65 >= 2).',
        diagnoses: [{
          id: 'urg-pac',
          codeCIM11: 'CA20',
          label: 'Pneumonie bactérienne',
          type: 'PRINCIPAL',
          status: 'CONFIRME',
          dateDiagnosed: new Date().toISOString().split('T')[0]
        }],
        managementPlan: {
          ...prev.managementPlan,
          medicationsPrescribed: `1. O2 nasal 4 L/min (cible SpO2 > 94%).\n2. Ceftriaxone 2g IVL 1 fois/jour + Azithromycine 500 mg PO (double antibiothérapie synergique).\n3. Remplissage vasculaire par Ringer Lactate ou Sérum Physiologique 500 mL sur 30 min.\n4. Paracétamol 1g IVL sur 15 min si fièvre > 38.5°C.\n5. Cliché thorax au lit + NFS, CRP, Gazométrie, Hémocultures avant ATB.`,
          orientation: 'HOSPITALISATION'
        }
      }));
    } else if (protoType === 'EMBOLIE_GRAVE') {
      setForm12Steps(prev => ({
        ...prev,
        chiefComplaint: 'Suspicion d\'embolie pulmonaire aiguë : point de côté basi-thoracique brutal, hypoxémie réfractaire et tachycardie.',
        vitals: {
          ...prev.vitals,
          rr: 30,
          spo2Ambient: 89,
          spo2O2: 95,
          o2FlowLiters: 4,
          pulse: 124,
          bp: '100/65',
          generalState: 'ALTERE_SEVERE'
        },
        syndromicSummary: 'Syndrome vasculaire pulmonaire aigu de haute probabilité avec signes de surcharge ventriculaire droite.',
        diagnoses: [{
          id: 'urg-ep',
          codeCIM11: 'CB00',
          label: 'Embolie pulmonaire',
          type: 'PRINCIPAL',
          status: 'SUSPECTE',
          dateDiagnosed: new Date().toISOString().split('T')[0]
        }],
        managementPlan: {
          ...prev.managementPlan,
          medicationsPrescribed: `1. O2 masque à 4 L/min.\n2. Énoxaparine (Lovenox) 100 UI/kg en sous-cutané en dose curative d'attaque (0.1 mL / 10 kg).\n3. Repos strict au lit, lever rigoureusement interdit.\n4. Angioscanner thoracique en urgence extrême + D-Dimères, Troponine, ECG.\n5. Transfert immédiat vers unité de soins intensifs respiratoires / DAR.`,
          orientation: 'TRANSFERT'
        }
      }));
    }
  };

  const handleSaveConsultationRef = useRef<(() => void) | null>(null);

  // Keyboard shortcuts: Ctrl+S / Cmd+S to save, Alt+ArrowLeft / Alt+ArrowRight to change step
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveConsultationRef.current?.();
        return;
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setActiveStepTab(prev => Math.min(12, prev + 1));
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setActiveStepTab(prev => Math.max(1, prev - 1));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Universal Audio Recording & Dictation Engine (Section 10)
  const [dictationStatus, setDictationStatus] = useState<'IDLE' | 'REQUESTING_MIC' | 'RECORDING' | 'TRANSCRIBING'>('IDLE');
  const [dictationSeconds, setDictationSeconds] = useState<number>(0);
  const dictationTimerRef = useRef<any>(null);
  const dictationSessionRef = useRef<DictationSession | null>(null);
  const speechTargetFieldRef = useRef<string>(speechTargetField);
  speechTargetFieldRef.current = speechTargetField;

  const stopDictation = async () => {
    if (dictationTimerRef.current) {
      clearInterval(dictationTimerRef.current);
      dictationTimerRef.current = null;
    }

    if (dictationSessionRef.current) {
      const session = dictationSessionRef.current;
      dictationSessionRef.current = null;
      try {
        setDictationStatus('TRANSCRIBING');
        setTranscriptNotice('Transcription médicale en cours...');
        const finalRecordedText = await session.stop();
        setDictationStatus('IDLE');
        setIsRecording(false);
        setTranscriptNotice('');

        if (finalRecordedText && finalRecordedText.trim()) {
          const textToAdd = finalRecordedText.trim();
          const activeField = speechTargetFieldRef.current;
          if (activeField === 'historyOfIllness') {
            setForm12Steps(prev => ({
              ...prev,
              historyOfIllness: prev.historyOfIllness ? `${prev.historyOfIllness} ${textToAdd}` : textToAdd
            }));
          } else if (activeField === 'chiefComplaint') {
            setForm12Steps(prev => ({
              ...prev,
              chiefComplaint: prev.chiefComplaint ? `${prev.chiefComplaint} ${textToAdd}` : textToAdd
            }));
          } else if (activeField === 'syndromicSummary') {
            setForm12Steps(prev => ({
              ...prev,
              syndromicSummary: prev.syndromicSummary ? `${prev.syndromicSummary} ${textToAdd}` : textToAdd
            }));
          } else if (activeField === 'medicationsPrescribed') {
            setForm12Steps(prev => ({
              ...prev,
              managementPlan: {
                ...prev.managementPlan,
                medicationsPrescribed: prev.managementPlan.medicationsPrescribed
                  ? `${prev.managementPlan.medicationsPrescribed}\n${textToAdd}`
                  : textToAdd
              }
            }));
          }
        }
      } catch (e) {
        setDictationStatus('IDLE');
        setIsRecording(false);
        setTranscriptNotice('');
      }
    } else {
      setDictationStatus('IDLE');
      setIsRecording(false);
      setTranscriptNotice('');
    }
  };

  const startDictation = async (targetField: string) => {
    setSpeechTargetField(targetField);
    speechTargetFieldRef.current = targetField;
    await stopDictation();

    setDictationSeconds(0);
    setTranscriptNotice("Demande d'accès au micro...");

    try {
      const fieldLabels: Record<string, string> = {
        chiefComplaint: 'Motif de consultation',
        historyOfIllness: 'Histoire de la maladie',
        syndromicSummary: 'Résumé syndromique',
        medicationsPrescribed: 'Ordonnance et médicaments'
      };

      const session = await startDictationSession({
        context: `Dictée médicale pour ${fieldLabels[targetField] || targetField}`,
        fieldName: fieldLabels[targetField] || targetField,
        requestId: `consultations-${targetField}`,
        onInterimText: (interim) => {
          setTranscriptNotice(`Dictée en cours : « ${interim} »`);
        },
        onStatusChange: (status) => {
          setDictationStatus(status);
          if (status === 'RECORDING') {
            setIsRecording(true);
            setTranscriptNotice(`Dictée vocale en cours... (Parlez distinctement en français médical)`);
            if (dictationTimerRef.current) clearInterval(dictationTimerRef.current);
            dictationTimerRef.current = setInterval(() => {
              setDictationSeconds(s => s + 1);
            }, 1000);
          } else if (status === 'TRANSCRIBING') {
            setTranscriptNotice('Transcription de la dictée audio en cours...');
          } else if (status === 'IDLE') {
            setIsRecording(false);
            if (dictationTimerRef.current) {
              clearInterval(dictationTimerRef.current);
              dictationTimerRef.current = null;
            }
          }
        },
        onError: (errMsg) => {
          setIsRecording(false);
          setDictationStatus('IDLE');
          setTranscriptNotice(`⚠️ ${errMsg}`);
          if (dictationTimerRef.current) {
            clearInterval(dictationTimerRef.current);
            dictationTimerRef.current = null;
          }
        }
      });

      dictationSessionRef.current = session;
    } catch (err: any) {
      console.warn('[Consultation Start Dictation Notice]:', err);
      setIsRecording(false);
      setDictationStatus('IDLE');
      const errText = err?.message || "Accès au microphone restreint. Utilisez la capture native OS ou autorisez le micro (🔒).";
      setTranscriptNotice(`⚠️ ${errText}`);
      setTimeout(() => setTranscriptNotice(null), 9000);
    }
  };

  const toggleRecording = (targetField: string) => {
    if (isRecording || dictationStatus === 'RECORDING' || dictationStatus === 'REQUESTING_MIC') {
      stopDictation();
    } else {
      startDictation(targetField);
    }
  };

  // Listen to modal fallback insert/retry events for Consultations fields + cleanup on unmount
  useEffect(() => {
    const handleInsertSample = (e: any) => {
      const detail = e?.detail;
      if (!detail?.text || typeof detail.requestId !== 'string' || !detail.requestId.startsWith('consultations-')) {
        return;
      }
      const targetKey = detail.requestId.replace('consultations-', '');
      const textToAdd = String(detail.text).trim();
      if (!textToAdd) return;

      if (targetKey === 'historyOfIllness') {
        setForm12Steps(prev => ({
          ...prev,
          historyOfIllness: prev.historyOfIllness ? `${prev.historyOfIllness} ${textToAdd}` : textToAdd
        }));
      } else if (targetKey === 'chiefComplaint') {
        setForm12Steps(prev => ({
          ...prev,
          chiefComplaint: prev.chiefComplaint ? `${prev.chiefComplaint} ${textToAdd}` : textToAdd
        }));
      } else if (targetKey === 'syndromicSummary') {
        setForm12Steps(prev => ({
          ...prev,
          syndromicSummary: prev.syndromicSummary ? `${prev.syndromicSummary} ${textToAdd}` : textToAdd
        }));
      } else if (targetKey === 'medicationsPrescribed') {
        setForm12Steps(prev => ({
          ...prev,
          managementPlan: {
            ...prev.managementPlan,
            medicationsPrescribed: prev.managementPlan.medicationsPrescribed
              ? `${prev.managementPlan.medicationsPrescribed}\n${textToAdd}`
              : textToAdd
          }
        }));
      }
      setTranscriptNotice(null);
    };

    const handleRetryMic = (e: any) => {
      const reqId = e?.detail?.requestId;
      if (typeof reqId === 'string' && reqId.startsWith('consultations-')) {
        const targetKey = reqId.replace('consultations-', '');
        startDictation(targetKey);
      }
    };

    window.addEventListener('insert-dictation-sample', handleInsertSample);
    window.addEventListener('retry-native-mic', handleRetryMic);
    return () => {
      window.removeEventListener('insert-dictation-sample', handleInsertSample);
      window.removeEventListener('retry-native-mic', handleRetryMic);
      if (dictationSessionRef.current) {
        dictationSessionRef.current.abort();
      }
      if (dictationTimerRef.current) {
        clearInterval(dictationTimerRef.current);
      }
    };
  }, []);

  // Listen to global Clinical Voice Assistant actions
  useEffect(() => {
    const handleVoiceAction = (event: any) => {
      const detail = event?.detail;
      if (!detail) return;

      if (detail.actionType === 'RECORD_VITALS' && detail.actionData?.vitals) {
        const v = detail.actionData.vitals;
        setForm12Steps(prev => ({
          ...prev,
          vitals: {
            ...prev.vitals,
            bp: v.bp !== undefined ? v.bp : prev.vitals.bp,
            pulse: v.pulse !== undefined ? v.pulse : prev.vitals.pulse,
            spo2Ambient: v.spo2Ambient !== undefined ? v.spo2Ambient : prev.vitals.spo2Ambient,
            temperature: v.temperature !== undefined ? v.temperature : prev.vitals.temperature,
            rr: v.rr !== undefined ? v.rr : prev.vitals.rr,
            weight: v.weight !== undefined ? v.weight : prev.vitals.weight,
            height: v.height !== undefined ? v.height : prev.vitals.height,
          }
        }));
        setActiveStepTab(5); // Switch to step 5 (Signes Vitaux & Anthropométrie)
        setVoiceActionNotice({
          message: `⚡ Constantes injectées et enregistrées directement par l'assistante vocale (Tension, Pouls, SpO2, T°, FR).`,
          type: 'success'
        });
        setTimeout(() => setVoiceActionNotice(null), 6000);
      } else if (detail.actionType === 'PRESCRIBE' && detail.actionData?.prescription?.rawText) {
        const raw = detail.actionData.prescription.rawText;
        setForm12Steps(prev => ({
          ...prev,
          managementPlan: {
            ...prev.managementPlan,
            medicationsPrescribed: prev.managementPlan.medicationsPrescribed
              ? `${prev.managementPlan.medicationsPrescribed}\n\n${raw}`
              : raw
          }
        }));
        setActiveStepTab(11); // Switch to step 11 (Traitement & Ordonnance)
        setVoiceActionNotice({
          message: `⚡ ${detail.actionData.prescription.protocolName || 'Protocole'} validé et injecté directement dans l'ordonnance.`,
          type: 'success'
        });
        setTimeout(() => setVoiceActionNotice(null), 6000);
      } else if (detail.actionType === 'SEARCH_PATIENT' && detail.actionData?.patientId) {
        setSelectedPatientId(detail.actionData.patientId);
        setVoiceActionNotice({
          message: `⚡ Dossier patient ${detail.actionData.patientName || ''} ouvert et sélectionné directement par commande vocale.`,
          type: 'info'
        });
        setTimeout(() => setVoiceActionNotice(null), 6000);
      }
    };

    window.addEventListener('clinical-voice-action', handleVoiceAction);
    return () => {
      window.removeEventListener('clinical-voice-action', handleVoiceAction);
    };
  }, []);

  // Call the AI assistant endpoint (/api/consultation-ai-assist)
  const handleTriggerAiAssistance = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/consultation-ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twelveSteps: form12Steps,
          patient: selectedPatient
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data);
      }
    } catch (err) {
      console.warn('AI assistance fallback notice:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Quick insertion of clinical parenthesis preset
  const insertParenthesisPreset = (fieldKey: keyof typeof form12Steps.systems, presetText: string) => {
    setForm12Steps(prev => ({
      ...prev,
      systems: {
        ...prev.systems,
        [fieldKey]: presetText
      }
    }));
  };

  // Add diagnosis from CIM-11 catalog
  const handleAddCimDiagnosis = (item: typeof CIM11_PNEUMO_CATALOG[0]) => {
    if (form12Steps.diagnoses.some(d => d.codeCIM11 === item.code)) return;
    const newDiag: ClinicalDiagnosis = {
      id: 'diag-' + Date.now(),
      codeCIM11: item.code,
      label: item.label,
      type: form12Steps.diagnoses.length === 0 ? 'PRINCIPAL' : 'ASSOCIE',
      status: 'CONFIRME',
      dateDiagnosed: new Date().toISOString().split('T')[0]
    };
    setForm12Steps(prev => ({
      ...prev,
      diagnoses: [...prev.diagnoses, newDiag]
    }));
  };

  // Remove diagnosis
  const handleRemoveDiagnosis = (id: string) => {
    setForm12Steps(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.filter(d => d.id !== id)
    }));
  };

  // Update diagnosis type or status
  const handleUpdateDiagnosisProperty = (id: string, prop: 'type' | 'status', value: string) => {
    setForm12Steps(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.map(d => d.id === id ? { ...d, [prop]: value } : d)
    }));
  };

  // Save consultation handler (+ bidirectional Patient DPI & Explorations sync)
  const handleSaveConsultation = () => {
    if (!selectedPatient) return;

    const consultId = 'c-' + Date.now();
    const newConsult: Consultation = {
      id: consultId,
      centerId: currentCenter?.id || 'center-1',
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      doctorId: currentUser?.id || 'doc-1',
      doctorName: currentUser?.name || 'Dr. Cheikh Ndao (Pneumologue)',
      date: new Date().toISOString().split('T')[0],
      chiefComplaint: form12Steps.chiefComplaint,
      diagnosis: form12Steps.diagnoses.map(d => `${d.label} [${d.codeCIM11}]`).join(', '),
      prescription: form12Steps.managementPlan.medicationsPrescribed,
      status: 'completed',
      twelveSteps: form12Steps,
      aiAssistance: {
        extractedSummary: aiSuggestions.summary,
        suggestedHypotheses: aiSuggestions.hypotheses,
        missingFieldsIdentified: aiSuggestions.missingFields,
        validatedByDoctor: true,
        validatedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveConsultation(newConsult);

    // Sync updated civil status and antecedents back to Patient DPI
    const consumptions = extractConsumptionsFromDpi(dpiAntecedentsValue);
    const mergedChronic = [
      ...dpiAntecedentsValue.medicalAntecedents,
      dpiAntecedentsValue.medicalAntecedentsOther
    ]
      .filter(Boolean)
      .join(', ');

    updatePatient(selectedPatient.id, {
      maritalStatus: form12Steps.maritalStatus || selectedPatient.maritalStatus,
      educationLevel: form12Steps.educationLevel || selectedPatient.educationLevel,
      profession: form12Steps.profession || selectedPatient.profession,
      emergencyPhone: form12Steps.emergencyPhone || selectedPatient.emergencyPhone,
      allergies: form12Steps.riskFactors.allergiesAtopy || selectedPatient.allergies,
      chronicConditions: mergedChronic || selectedPatient.chronicConditions,
      medicalAntecedents: {
        selected: dpiAntecedentsValue.medicalAntecedents,
        other: dpiAntecedentsValue.medicalAntecedentsOther
      },
      smokingHistory: {
        isSmoker: dpiAntecedentsValue.smokingStatus !== 'JAMAIS',
        status: dpiAntecedentsValue.smokingStatus,
        cigarettesPerDay: dpiAntecedentsValue.cigarettesPerDay,
        durationYears: dpiAntecedentsValue.smokingDurationYears,
        stoppedYear: dpiAntecedentsValue.smokingStoppedYear,
        packYears: dpiAntecedentsValue.smokingPackYears,
        periods: dpiAntecedentsValue.smokingPeriods,
        biomassExposure: dpiAntecedentsValue.biomassExposure,
        passiveSmoking: dpiAntecedentsValue.passiveSmoking
      },
      consumptions,
      occupationalExposures: dpiAntecedentsValue.occupationalProfile,
      surgicalHistory: dpiAntecedentsValue.surgicalHistory,
      obgynHistory: dpiAntecedentsValue.obgynHistory
    });

    // Sync any detailed ordered paraclinical exams not yet saved to central explorations
    const detailedExams = form12Steps.paraclinicalOrdered.orderedExamsDetailed || [];
    for (const exam of detailedExams) {
      if (!exam.linkedExplorationId) {
        const expId = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const statusMap: Record<OrderedParaclinicalExam['status'], MedicalExploration['status']> = {
          PRESCRIT: 'REQUESTED',
          EN_ATTENTE: 'IN_PROGRESS',
          REALISE: 'VALIDATED'
        };
        const macroCat = PARACLINICAL_CATALOG.find(c => c.id === exam.macroCategory);
        const subCatObj = macroCat?.subCategories.find(sc => sc.label === exam.subCategory) || macroCat?.subCategories[0];
        saveMedicalExploration({
          id: expId,
          requestNumber: `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          patientId: selectedPatient.id,
          patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
          patientHospitalNumber: selectedPatient.hospitalNumber,
          patientAge: selectedPatient.age,
          patientGender: selectedPatient.gender,
          centerId: currentCenter?.id || 'center-1',
          consultationId: consultId,
          category: subCatObj?.explorationCategory || 'AUTRES',
          macroCategory: exam.macroCategory,
          subCategory: exam.subCategory,
          title: exam.examName,
          clinicalIndication: form12Steps.chiefComplaint || 'Demande issue de consultation DPI',
          priority: 'NORMALE',
          status: statusMap[exam.status],
          simpleStatus: exam.status,
          date: exam.prescribedDate || new Date().toISOString().split('T')[0],
          prescribedDate: exam.prescribedDate,
          realizationDate: exam.realizedDate,
          requestedAt: new Date().toISOString(),
          prescribedById: currentUser?.id || 'doc-1',
          prescribedByName: currentUser?.name || 'Dr. Cheikh Ndao',
          laboratoryDestination: macroCat?.defaultLab || 'Plateau Technique CHREIN',
          sourceType: exam.attachmentType || 'SAISIE_DIRECTE',
          fileUrl: exam.attachmentUrl,
          attachmentName: exam.attachmentName,
          extractedParameters: [],
          spirometryData: exam.spirometryData,
          narrativeReport: exam.resultsText,
          followUpResults: exam.followUpEntries,
          validated: exam.status === 'REALISE',
          createdAt: new Date().toISOString()
        });
      }
    }

    // Sync consultation vitals with active hospitalization evolution curve if no series recorded yet
    const activeHosp = hospitalizations.find(h => h.patientId === selectedPatient.id && h.status === 'active');
    const v = form12Steps.vitals;
    if (
      activeHosp &&
      (form12Steps.vitalsSeries?.length || 0) === 0 &&
      (v.bp || v.pulse || v.spo2Ambient || v.spo2O2 || v.temperature)
    ) {
      const computedBmi = calcBmi(v.weight, v.height) ?? v.bmi;
      addNurseVitalRecord({
        id: `nv-cons-save-${Date.now()}`,
        patientId: selectedPatient.id,
        hospitalizationId: activeHosp.id,
        centerId: currentCenter?.id || 'center-1',
        timestamp: new Date().toISOString(),
        bp: v.bp || '120/80',
        pulse: Number(v.pulse || 80),
        rr: Number(v.rr || 18),
        spo2: Number(v.spo2Mode === 'SOUS_O2' ? (v.spo2O2 || 96) : (v.spo2Ambient || 96)),
        spo2Mode: v.spo2Mode || 'AIR_AMBIANT',
        o2FlowLiters: v.spo2Mode === 'SOUS_O2' ? Number(v.o2FlowLiters || 0) : 0,
        o2Device: v.spo2Mode === 'SOUS_O2' ? (v.o2Device || 'Lunettes nasales') : 'Air ambiant',
        fio2: v.spo2Mode === 'SOUS_O2' ? v.fio2 : undefined,
        temperature: Number(v.temperature || 37),
        weight: v.weight ? Number(v.weight) : undefined,
        height: v.height ? Number(v.height) : undefined,
        bmi: computedBmi,
        generalState: v.generalState,
        consciousnessGlasgow: v.glasgowScore,
        painEva: v.painEva,
        nurseName: currentUser?.name || 'Praticien Consultation',
        notes: `Constantes de consultation${v.spo2Mode === 'SOUS_O2' ? ` — Sous O2 (${v.o2FlowLiters || 0} L/min via ${v.o2Device || 'Lunettes nasales'})` : ' — Air ambiant'}`
      });
    }

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3500);
  };
  handleSaveConsultationRef.current = handleSaveConsultation;

  // Filter CIM-11 list
  const filteredCimList = useMemo(() => {
    return CIM11_PNEUMO_CATALOG.filter(item => {
      const matchesCategory = selectedCimCategory === 'TOUS' || item.category === selectedCimCategory;
      const q = cim11Query.toLowerCase();
      const matchesQuery = item.code.toLowerCase().includes(q) || item.label.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [cim11Query, selectedCimCategory]);

  // Memoized Step Completion Tracker (O(1) Set lookup)
  const completedStepSet = useMemo(() => {
    const set = new Set<number>();
    if (selectedPatient?.id) set.add(1);
    if (form12Steps.chiefComplaint && form12Steps.chiefComplaint.trim().length > 3) set.add(2);
    if (form12Steps.historyOfIllness && form12Steps.historyOfIllness.trim().length > 10) set.add(3);
    if (
      form12Steps.antecedentsText ||
      form12Steps.riskFactors.smokingPA > 0 ||
      form12Steps.riskFactors.tbContact ||
      form12Steps.riskFactors.biomassExposure ||
      (form12Steps.riskFactors.medicalAntecedents?.length || 0) > 0 ||
      (form12Steps.riskFactors.surgicalHistory?.length || 0) > 0
    ) {
      set.add(4);
    }
    if (
      form12Steps.vitals.bp &&
      form12Steps.vitals.pulse &&
      (form12Steps.vitals.spo2Ambient || form12Steps.vitals.spo2O2) &&
      form12Steps.vitals.rr
    ) {
      set.add(5);
    }
    if (form12Steps.systems.pulmonaryVesicularBreath && form12Steps.systems.cardiovascular) set.add(6);
    if (form12Steps.syndromicSummary && form12Steps.syndromicSummary.trim().length > 10) set.add(7);
    if (form12Steps.diagnosticHypotheses.length > 0 && Boolean(form12Steps.diagnosticHypotheses[0]?.trim())) set.add(8);
    const p = form12Steps.paraclinicalOrdered;
    if (
      p.geneXpertBK ||
      p.chestXray ||
      p.bloodGas ||
      p.nfsCrp ||
      p.chestCT ||
      p.spirometry ||
      p.pleuralPuncture ||
      p.otherNotes ||
      (p.orderedExamsDetailed?.length || 0) > 0
    ) {
      set.add(9);
    }
    if (form12Steps.diagnoses.length > 0) set.add(10);
    if (form12Steps.managementPlan.medicationsPrescribed && form12Steps.managementPlan.medicationsPrescribed.trim().length > 5) set.add(11);
    if (form12Steps.managementPlan.orientation && form12Steps.followUp.nextAppointmentDate) set.add(12);
    return set;
  }, [form12Steps, selectedPatient]);

  const isStepCompleted = (stepNumber: number): boolean => completedStepSet.has(stepNumber);
  const completedStepsCount = completedStepSet.size;

  // 1-Click Clinical Scenario Loader
  const handleLoadScenario = (scenarioId: string) => {
    const scenario = FULL_CLINICAL_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;
    setActiveScenarioId(scenarioId);
    setForm12Steps({
      ...scenario.twelveSteps,
      diagnoses: scenario.twelveSteps.diagnoses.map(d => ({
        ...d,
        dateDiagnosed: new Date().toISOString().split('T')[0]
      })),
      followUp: {
        ...scenario.twelveSteps.followUp,
        nextAppointmentDate: scenario.twelveSteps.followUp.nextAppointmentDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      }
    });
    setVoiceActionNotice({
      type: 'success',
      message: `Scénario clinique appliqué : « ${scenario.name} » (${scenario.badge}) — 12 étapes pré-remplies`
    });
  };

  // Reset consultation
  const handleResetConsultation = () => {
    setActiveScenarioId(null);
    setSelectedMmrcGrade(null);
    setActiveInlineScoreId(null);
    setForm12Steps({
      maritalStatus: selectedPatient?.maritalStatus || 'Non renseigné',
      educationLevel: selectedPatient?.educationLevel || 'Non renseigné',
      profession: selectedPatient?.profession || '',
      emergencyPhone: selectedPatient?.emergencyPhone || selectedPatient?.phone || '',
      civilStatusNotes: '',
      chiefComplaint: '',
      historyOfIllness: '',
      mmrcGrade: undefined,
      riskFactors: {
        smokingStatus: 'JAMAIS',
        cigarettesPerDay: 0,
        smokingDurationYears: 0,
        smokingStoppedYear: '',
        smokingPeriods: [],
        smokingPA: 0,
        biomassExposure: false,
        tbContact: false,
        allergiesAtopy: '',
        previousTB: false,
        hivStatus: 'NEGATIF',
        diabetesHta: '',
        occupationalExposure: '',
        medicalAntecedents: [],
        medicalAntecedentsOther: '',
        surgicalHistory: [],
        obgynHistory: {}
      },
      antecedentsText: '',
      vitals: {
        bp: '',
        pulse: 0,
        rr: 0,
        spo2Mode: 'AIR_AMBIANT',
        spo2Ambient: 0,
        spo2O2: 0,
        o2FlowLiters: 0,
        o2Device: 'Lunettes nasales',
        fio2: undefined,
        temperature: 0,
        weight: 0,
        height: 0,
        bmi: 0,
        glasgowScore: 15,
        painEva: 0,
        generalState: 'BON'
      },
      vitalsSeries: [],
      systems: {
        pulmonaryVesicularBreath: 'Murmure vésiculaire (conservé et pur bilatéral)',
        pulmonaryCrackles: 'Râles crépitants (absents)',
        pulmonaryWheezes: 'Sibilants (absents)',
        pulmonaryRhonchi: 'Ronchis (absents)',
        pleuralFriction: 'Frottement pleural (absent)',
        cyanosisClubbing: 'Cyanose (absente) - Hippocratisme digital (absent)',
        cardiovascular: '(Bruits du coeur réguliers, pas de souffle. Pas de TJ ni RHJ)',
        abdomen: '(Abdomen souple, indolore, pas d\'hépatomégalie)',
        neurological: '(Patient conscient, orienté temporo-spatialement)',
        entLymphNodes: '(Pas d\'adénopathie palpable)',
        cutaneous: '(Peau saine, pas de sueurs ni purpura)'
      },
      syndromicSelectedAntecedents: [],
      syndromicIntro: '',
      syndromicItems: [],
      syndromicSummary: '',
      diagnosticHypotheses: [],
      paraclinicalOrdered: {
        chestXray: false,
        chestCT: false,
        spirometry: false,
        bloodGas: false,
        nfsCrp: false,
        geneXpertBK: false,
        pleuralPuncture: false,
        otherNotes: '',
        orderedExamsDetailed: []
      },
      diagnoses: [],
      managementPlan: {
        medicationsPrescribed: '',
        orientation: 'AMBULATOIRE'
      },
      followUp: {
        nextAppointmentDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        keyWarningSigns: '',
        notes: ''
      }
    });
    setActiveStepTab(1);
  };

  // Step 5: Vitals shortcuts
  const handleFillNormalVitals = () => {
    setForm12Steps(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        bp: '120/80',
        pulse: 76,
        rr: 16,
        spo2Ambient: 98,
        temperature: 36.8,
        glasgowScore: 15,
        painEva: 0,
        generalState: 'BON'
      }
    }));
  };

  const handleFillUrgentVitals = () => {
    setForm12Steps(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        bp: '95/60',
        pulse: 118,
        rr: 28,
        spo2Ambient: 88,
        spo2O2: 94,
        o2FlowLiters: 4,
        temperature: 38.8,
        glasgowScore: 14,
        painEva: 6,
        generalState: 'ALTERE_SEVERE'
      }
    }));
  };

  // Step 6: Physical Exam shortcuts with ()
  const handleFillNormalPhysicalExam = () => {
    setForm12Steps(prev => ({
      ...prev,
      systems: {
        pulmonaryVesicularBreath: 'Murmure vésiculaire (conservé et pur bilatéral symétrique)',
        pulmonaryCrackles: 'Râles crépitants (absents aux deux champs pulmonaires)',
        pulmonaryWheezes: 'Sibilants (absents)',
        pulmonaryRhonchi: 'Ronchis (absents)',
        pleuralFriction: 'Frottement pleural (absent)',
        cyanosisClubbing: 'Cyanose (absente) - Hippocratisme digital (absent)',
        cardiovascular: '(Bruits du cœur réguliers B1-B2 sans souffle ni bruit surajouté, pas de turgescence jugulaire ni reflux hépato-jugulaire)',
        abdomen: '(Abdomen souple, dépressible, indolore, pas d\'hépatomégalie ni splénomégalie)',
        neurological: '(Patient vigilant, parfaitement orienté dans le temps et dans l\'espace, Glasgow 15/15)',
        entLymphNodes: '(Pas d\'adénopathies palpables cervicales, axillaires ni inguinales)',
        cutaneous: '(Téguments et muqueuses de coloration normale, pas d\'érythème ni sueurs)'
      }
    }));
  };

  const handleFillCondensationSyndrome = () => {
    setForm12Steps(prev => ({
      ...prev,
      systems: {
        ...prev.systems,
        pulmonaryVesicularBreath: 'Murmure vésiculaire (diminué avec souffle tubaire au foyer de condensation)',
        pulmonaryCrackles: 'Râles crépitants (foyer de râles crépitants unilatéraux en fin d\'inspiration)',
        pulmonaryWheezes: 'Sibilants (absents)',
        pulmonaryRhonchi: 'Ronchis (absents)',
        pleuralFriction: 'Frottement pleural (absent)'
      }
    }));
  };

  const handleFillPleuralSyndrome = () => {
    setForm12Steps(prev => ({
      ...prev,
      systems: {
        ...prev.systems,
        pulmonaryVesicularBreath: 'Murmure vésiculaire (silence auscultatoire avec abolition du MV à la base)',
        pulmonaryCrackles: 'Râles crépitants (absents au niveau de l\'épanchement)',
        pulmonaryWheezes: 'Sibilants (absents)',
        pleuralFriction: 'Frottement pleural (frottement pleural rugueux présent au sommet de la matité)'
      }
    }));
  };

  const handleFillObstructiveSyndrome = () => {
    setForm12Steps(prev => ({
      ...prev,
      systems: {
        ...prev.systems,
        pulmonaryVesicularBreath: 'Murmure vésiculaire (diminué de façon diffuse bilatérale avec expiration prolongée)',
        pulmonaryWheezes: 'Sibilants (râles sibilants diffus bilatéraux prédominant à l\'expiration)',
        pulmonaryRhonchi: 'Ronchis (râles ronflants diffus avec encombrement bronchique)'
      }
    }));
  };

  // Step 7: Build structured intro & ordered syndromic summary
  const buildSyndromicIntroTemplate = (selectedAntecedents?: string[]) => {
    const ageLabel = selectedPatient?.age ? `${selectedPatient.age}` : '__';
    const sexLabel = selectedPatient?.gender === 'F' ? 'féminin' : 'masculin';
    const selectedList = selectedAntecedents ?? form12Steps.syndromicSelectedAntecedents ?? dpiAntecedentsValue.medicalAntecedents ?? [];
    const antLabel = selectedList.length > 0 ? selectedList.join(', ') : (form12Steps.antecedentsText || 'sans antécédent notable');
    const motifLabel = (form12Steps.chiefComplaint || '[motif principal]').trim();
    return `Patient de ${ageLabel} ans, de sexe ${sexLabel}, aux antécédents de ${antLabel}, hospitalisé pour ${motifLabel}. L'examen clinique permet de retenir les syndromes suivants, classés par ordre de gravité et de priorité clinique :`;
  };

  const syncSyndromicSummaryText = (intro: string, items: SyndromicPriorityItem[]) => {
    if (items.length === 0) return intro;
    const numbered = items.map((it, idx) => `${idx + 1}. ${it.text}${it.severity ? ` [${it.severity}]` : ''}`).join('\n');
    return `${intro}\n${numbered}`;
  };

  const handleToggleSyndromicAntecedent = (ant: string) => {
    const current = form12Steps.syndromicSelectedAntecedents || [];
    const next = current.includes(ant) ? current.filter(x => x !== ant) : [...current, ant];
    const intro = buildSyndromicIntroTemplate(next);
    const items = form12Steps.syndromicItems || [];
    setForm12Steps(prev => ({
      ...prev,
      syndromicSelectedAntecedents: next,
      syndromicIntro: intro,
      syndromicSummary: syncSyndromicSummaryText(intro, items)
    }));
  };

  const handleAddSyndromicItem = (textArg?: string, severityArg?: 'CRITIQUE' | 'MAJEUR' | 'MODERE') => {
    const clean = (textArg ?? newSyndromeText).trim();
    if (!clean) return;
    const newItem: SyndromicPriorityItem = {
      id: `syn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      text: clean,
      severity: severityArg ?? newSyndromeSeverity
    };
    const nextItems = [...(form12Steps.syndromicItems || []), newItem];
    const intro = form12Steps.syndromicIntro || buildSyndromicIntroTemplate();
    setForm12Steps(prev => ({
      ...prev,
      syndromicIntro: intro,
      syndromicItems: nextItems,
      syndromicSummary: syncSyndromicSummaryText(intro, nextItems)
    }));
    if (!textArg) setNewSyndromeText('');
  };

  const handleMoveSyndromicItem = (idx: number, direction: -1 | 1) => {
    const items = [...(form12Steps.syndromicItems || [])];
    const target = idx + direction;
    if (target < 0 || target >= items.length) return;
    const [moved] = items.splice(idx, 1);
    items.splice(target, 0, moved);
    const intro = form12Steps.syndromicIntro || buildSyndromicIntroTemplate();
    setForm12Steps(prev => ({
      ...prev,
      syndromicItems: items,
      syndromicSummary: syncSyndromicSummaryText(intro, items)
    }));
  };

  const handleRemoveSyndromicItem = (id: string) => {
    const nextItems = (form12Steps.syndromicItems || []).filter(it => it.id !== id);
    const intro = form12Steps.syndromicIntro || buildSyndromicIntroTemplate();
    setForm12Steps(prev => ({
      ...prev,
      syndromicItems: nextItems,
      syndromicSummary: syncSyndromicSummaryText(intro, nextItems)
    }));
  };

  // Step 7: Auto-generate Syndromic Summary using exact DPI template
  const handleAutoGenerateSyndromicSummary = () => {
    const intro = buildSyndromicIntroTemplate();
    const detectedItems: SyndromicPriorityItem[] = [];

    const effSpo2 = form12Steps.vitals.spo2Mode === 'SOUS_O2'
      ? form12Steps.vitals.spo2O2
      : form12Steps.vitals.spo2Ambient;
    if ((effSpo2 && effSpo2 < 92) || (form12Steps.vitals.rr && form12Steps.vitals.rr >= 26)) {
      detectedItems.push({
        id: `syn-resp-${Date.now()}`,
        text: `Syndrome de détresse respiratoire / hypoxémie (SpO2 ${effSpo2 || '--'}%, FR ${form12Steps.vitals.rr || '--'}/min)`,
        severity: 'CRITIQUE'
      });
    }
    if (form12Steps.systems.pulmonaryCrackles && !form12Steps.systems.pulmonaryCrackles.toLowerCase().includes('absent')) {
      detectedItems.push({
        id: `syn-cond-${Date.now() + 1}`,
        text: `Syndrome de condensation pulmonaire (${form12Steps.systems.pulmonaryCrackles})`,
        severity: 'MAJEUR'
      });
    }
    if (form12Steps.systems.pulmonaryWheezes && !form12Steps.systems.pulmonaryWheezes.toLowerCase().includes('absent')) {
      detectedItems.push({
        id: `syn-obstr-${Date.now() + 2}`,
        text: `Syndrome bronchique obstructif (${form12Steps.systems.pulmonaryWheezes})`,
        severity: 'MAJEUR'
      });
    }
    if (form12Steps.systems.pleuralFriction && !form12Steps.systems.pleuralFriction.toLowerCase().includes('absent') && !form12Steps.systems.pleuralFriction.toLowerCase().includes('négatif')) {
      detectedItems.push({
        id: `syn-pleur-${Date.now() + 3}`,
        text: `Syndrome pleural (${form12Steps.systems.pleuralFriction})`,
        severity: 'MAJEUR'
      });
    }
    if (form12Steps.vitals.temperature && form12Steps.vitals.temperature >= 38) {
      detectedItems.push({
        id: `syn-inf-${Date.now() + 4}`,
        text: `Syndrome infectieux fébrile (T° = ${form12Steps.vitals.temperature}°C)`,
        severity: 'MODERE'
      });
    }
    if (detectedItems.length === 0) {
      detectedItems.push({
        id: `syn-gen-${Date.now()}`,
        text: 'Syndrome respiratoire subaigu à explorer',
        severity: 'MODERE'
      });
    }

    setForm12Steps(prev => ({
      ...prev,
      syndromicIntro: intro,
      syndromicItems: detectedItems,
      syndromicSummary: syncSyndromicSummaryText(intro, detectedItems)
    }));
  };

  // Step 9 helpers: Ordered exams A-F
  const handleAddDetailedExam = (macroCat: MacroExplorationCategoryId, subCategory: string, examName: string) => {
    const newExam: OrderedParaclinicalExam = {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      macroCategory: macroCat,
      subCategory,
      examName,
      status: 'PRESCRIT',
      prescribedDate: new Date().toISOString().split('T')[0],
      resultsText: '',
      followUpEntries: []
    };
    setForm12Steps(prev => {
      const existing = prev.paraclinicalOrdered.orderedExamsDetailed || [];
      return {
        ...prev,
        paraclinicalOrdered: {
          ...prev.paraclinicalOrdered,
          orderedExamsDetailed: [newExam, ...existing]
        }
      };
    });
  };

  const handleUpdateDetailedExam = (examId: string, patch: Partial<OrderedParaclinicalExam>) => {
    setForm12Steps(prev => ({
      ...prev,
      paraclinicalOrdered: {
        ...prev.paraclinicalOrdered,
        orderedExamsDetailed: (prev.paraclinicalOrdered.orderedExamsDetailed || []).map(ex =>
          ex.id === examId ? { ...ex, ...patch } : ex
        )
      }
    }));
  };

  const handleRemoveDetailedExam = (examId: string) => {
    setForm12Steps(prev => ({
      ...prev,
      paraclinicalOrdered: {
        ...prev.paraclinicalOrdered,
        orderedExamsDetailed: (prev.paraclinicalOrdered.orderedExamsDetailed || []).filter(ex => ex.id !== examId)
      }
    }));
  };

  const handleExamAttachmentUpload = (examId: string, file: File) => {
    const ext = file.name.toLowerCase();
    const attachmentType: 'PHOTO' | 'PDF' | 'DICOM' = ext.endsWith('.pdf')
      ? 'PDF'
      : (ext.endsWith('.dcm') || ext.endsWith('.dicom'))
      ? 'DICOM'
      : 'PHOTO';
    const reader = new FileReader();
    reader.onload = () => {
      handleUpdateDetailedExam(examId, {
        attachmentName: file.name,
        attachmentType,
        attachmentUrl: typeof reader.result === 'string' ? reader.result : undefined
      });
    };
    reader.readAsDataURL(file);
  };

  // Contextual Score Launcher & Saver (used after Step 8 Hypothèses and in Step 10)
  const openInlineScore = (scoreId: ClinicalScoreCalculation['scoreId']) => {
    setActiveInlineScoreId(scoreId);
    setInlineScoreInputs(
      buildAutoFilledScoreInputs(scoreId, selectedPatient, form12Steps, patientExplorations)
    );
    setInlineScoreSavedMsg(null);
  };

  const activeScoreDef = useMemo(
    () => CLINICAL_SCORES_DEFINITIONS.find(s => s.id === activeInlineScoreId) || null,
    [activeInlineScoreId]
  );

  const activeScoreResult = useMemo(() => {
    if (!activeScoreDef) return null;
    return activeScoreDef.calculate(inlineScoreInputs);
  }, [activeScoreDef, inlineScoreInputs]);

  const handleSaveInlineScore = () => {
    if (!activeScoreDef || !activeScoreResult || !selectedPatient) return;
    saveClinicalScoreCalculation({
      id: `score-${Date.now()}`,
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      centerId: currentCenter?.id || 'center-1',
      doctorId: currentUser?.id || 'doc-1',
      doctorName: currentUser?.name || 'Dr. Cheikh Ndao',
      scoreId: activeScoreDef.id,
      scoreName: activeScoreDef.name,
      scoreCategory: activeScoreDef.category,
      calculatedValue: activeScoreResult.value,
      variables: inlineScoreInputs,
      missingVariables: activeScoreResult.missing,
      interpretation: activeScoreResult.interpretation,
      clinicalRecommendation: activeScoreResult.recommendation,
      referenceSource: activeScoreDef.reference,
      date: new Date().toISOString().split('T')[0]
    });
    setInlineScoreSavedMsg(`✓ ${activeScoreDef.name} (${activeScoreResult.value}) enregistré dans le DPI du patient.`);
    setTimeout(() => setInlineScoreSavedMsg(null), 4500);
  };

  // Step 9: Apply Exam Pack
  const handleApplyExamPack = (packKey: keyof typeof EXAM_PACKS) => {
    const pack = EXAM_PACKS[packKey];
    if (!pack) return;
    setForm12Steps(prev => ({
      ...prev,
      paraclinicalOrdered: {
        ...prev.paraclinicalOrdered,
        ...pack.exams,
        otherNotes: prev.paraclinicalOrdered.otherNotes
          ? `${prev.paraclinicalOrdered.otherNotes} | ${pack.notes}`
          : pack.notes
      }
    }));
  };

  // Step 12: Quick Follow-up Days
  const handleQuickFollowUpDays = (days: number) => {
    const d = new Date(Date.now() + days * 86400000);
    const isoDate = d.toISOString().split('T')[0];
    setForm12Steps(prev => ({
      ...prev,
      followUp: {
        ...prev.followUp,
        nextAppointmentDate: isoDate
      }
    }));
  };

  // Shared Contextual Clinical Scores UI (used after Step 8 Hypothèses & in Step 10 Diagnostics)
  const renderContextualClinicalScores = () => {
    const suggestedGroups = getSuggestedScoresForHypotheses(
      form12Steps.diagnosticHypotheses,
      form12Steps.diagnoses
    );
    const filteredOtherScores = CLINICAL_SCORES_DEFINITIONS.filter(s => {
      const q = inlineScoreSearch.trim().toLowerCase();
      if (!q) return false;
      return (
        s.name.toLowerCase().includes(q) ||
        s.categoryLabel.toLowerCase().includes(q) ||
        s.shortDesc.toLowerCase().includes(q)
      );
    });

    return (
      <div className="p-4 bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-xl border border-teal-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-teal-700" />
            <div>
              <span className="text-xs font-black text-slate-900 block">
                Scores Cliniques & Pronostiques Contextuels (Pré-remplis depuis le DPI)
              </span>
              <span className="text-[10px] text-slate-500">
                Proposés automatiquement selon vos hypothèses et diagnostics (PAC, EP, BPCO, Asthme, Sepsis, TB)
              </span>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={inlineScoreSearch}
              onChange={(e) => setInlineScoreSearch(e.target.value)}
              placeholder="Rechercher un score (CURB-65, Wells, BODE...)"
              className="w-full text-[11px] bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-teal-600"
            />
          </div>
        </div>

        {/* Suggested Groups */}
        {suggestedGroups.length > 0 ? (
          <div className="space-y-2">
            {suggestedGroups.map(group => (
              <div key={group.pathologyLabel} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${group.badgeColor}`}>
                    {group.pathologyLabel}
                  </span>
                  <span className="text-[10px] text-slate-400">Scores recommandés :</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.scoreIds.map(sid => {
                    const def = CLINICAL_SCORES_DEFINITIONS.find(d => d.id === sid);
                    if (!def) return null;
                    const isOpen = activeInlineScoreId === sid;
                    return (
                      <button
                        key={sid}
                        type="button"
                        onClick={() => openInlineScore(sid)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                          isOpen
                            ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                            : 'bg-teal-50/70 hover:bg-teal-100 text-teal-900 border-teal-200'
                        }`}
                      >
                        <Calculator className="w-3 h-3" />
                        <span>{def.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic bg-white/80 p-2.5 rounded-lg border border-slate-200">
            Ajoutez une hypothèse (ex: Pneumonie PAC, Embolie pulmonaire, BPCO, Asthme, Sepsis, Tuberculose) ou recherchez un score ci-dessus pour l'ouvrir avec pré-remplissage automatique.
          </p>
        )}

        {/* Search results */}
        {filteredOtherScores.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase w-full">Résultats de recherche :</span>
            {filteredOtherScores.map(def => (
              <button
                key={def.id}
                type="button"
                onClick={() => openInlineScore(def.id)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  activeInlineScoreId === def.id
                    ? 'bg-teal-700 text-white border-teal-800'
                    : 'bg-slate-50 hover:bg-teal-50 text-slate-800 border-slate-200'
                }`}
              >
                {def.name}
              </button>
            ))}
          </div>
        )}

        {/* Inline Calculator Drawer */}
        {activeScoreDef && activeScoreResult && (
          <div className="p-3.5 bg-white rounded-xl border-2 border-teal-300 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h4 className="text-xs font-black text-teal-950">{activeScoreDef.name}</h4>
                <p className="text-[10px] text-slate-500">{activeScoreDef.shortDesc} — <em>{activeScoreDef.reference}</em></p>
              </div>
              <button
                type="button"
                onClick={() => setActiveInlineScoreId(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Fermer le calculateur"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeScoreResult.missing.length > 0 && (
              <div className="text-[11px] bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  Données manquantes à compléter ({activeScoreResult.missing.length}) :{' '}
                  <strong>{activeScoreResult.missing.join(', ')}</strong>
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {activeScoreDef.fields.map(field => {
                const isMissing = activeScoreResult.missing.includes(field.key);
                const val = inlineScoreInputs[field.key];
                if (field.type === 'boolean') {
                  return (
                    <label
                      key={field.key}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                        val
                          ? 'bg-teal-50 border-teal-300 text-teal-950 font-bold'
                          : isMissing
                          ? 'bg-amber-50/60 border-amber-300 text-slate-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(val)}
                        onChange={(e) => setInlineScoreInputs(prev => ({ ...prev, [field.key]: e.target.checked }))}
                        className="h-3.5 w-3.5 text-teal-600 rounded"
                      />
                      <span className="text-[11px]">{field.label}</span>
                    </label>
                  );
                }
                if (field.type === 'select') {
                  return (
                    <div key={field.key} className={`p-2 rounded-lg border ${isMissing ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">{field.label}</label>
                      <select
                        value={val ?? ''}
                        onChange={(e) => setInlineScoreInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full text-[11px] bg-white border border-slate-200 rounded-md p-1.5 font-medium"
                      >
                        <option value="">-- Sélectionner --</option>
                        {field.options?.map(opt => (
                          <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return (
                  <div key={field.key} className={`p-2 rounded-lg border ${isMissing ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">
                      {field.label} {field.unit ? `(${field.unit})` : ''}
                    </label>
                    <input
                      type="number"
                      value={val ?? ''}
                      placeholder={field.placeholder || ''}
                      onChange={(e) => setInlineScoreInputs(prev => ({
                        ...prev,
                        [field.key]: e.target.value === '' ? '' : Number(e.target.value)
                      }))}
                      className="w-full text-[11px] bg-white border border-slate-200 rounded-md p-1.5 font-mono font-bold"
                    />
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5 text-[11px]">
                <div>
                  <span className="font-black text-teal-800 text-xs mr-2">Résultat : {activeScoreResult.value}</span>
                  <span className="font-semibold text-slate-800">{activeScoreResult.interpretation}</span>
                </div>
                <p className="text-slate-600">{activeScoreResult.recommendation}</p>
              </div>
              <button
                type="button"
                onClick={handleSaveInlineScore}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold cursor-pointer shrink-0 flex items-center gap-1"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Valider & Enregistrer dans le DPI</span>
              </button>
            </div>

            {inlineScoreSavedMsg && (
              <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                {inlineScoreSavedMsg}
              </div>
            )}
          </div>
        )}

        {/* Recorded scores for this patient */}
        {patientScoresToday.length > 0 && (
          <div className="pt-2 border-t border-teal-200/70 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-500">
              Scores enregistrés dans le DPI ({patientScoresToday.length}) :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {patientScoresToday.slice(0, 6).map(sc => (
                <span key={sc.id} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium text-slate-700">
                  <strong>{sc.scoreName}</strong> : {sc.calculatedValue} ({sc.date})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Integrated Patient Banner & Clinical Workstation Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Patient Profile & Clinical Badges */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
              {selectedPatient ? `${selectedPatient.firstName?.[0] || 'P'}${selectedPatient.lastName?.[0] || ''}`.toUpperCase() : 'P'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Sélectionnez un patient'}
                </h1>
                <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg px-2 py-0.5 border border-slate-200 transition">
                  <span className="text-3xs font-bold text-slate-500 uppercase">Changer :</span>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="text-xxs font-bold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Patient Key Clinical Context Metadata */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 mt-1">
                <span>{selectedPatient?.age} ans ({selectedPatient?.gender === 'M' ? 'Homme' : 'Femme'})</span>
                <span className="text-slate-300" aria-hidden="true">&bull;</span>
                <span>N° IP : <strong className="font-mono text-slate-800">{selectedPatient?.code}</strong></span>
                <span className="text-slate-300" aria-hidden="true">&bull;</span>
                <span>N° Hosp : <span className="font-mono text-slate-700">{selectedPatient?.hospitalNumber || 'Non renseigné'}</span></span>
                <span className="text-slate-300" aria-hidden="true">&bull;</span>
                <span className="text-slate-500">{selectedPatient?.address || 'Kaolack'}</span>
              </div>

              {/* Real-time Allergies, Terrain & Direct Patient Workflow Shortcuts */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xxs font-medium text-slate-600">
                {selectedPatient?.allergies && selectedPatient.allergies.toLowerCase() !== 'aucune' && selectedPatient.allergies.toLowerCase() !== 'néant' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-md font-semibold">
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>Allergie : <strong>{selectedPatient.allergies}</strong></span>
                  </span>
                ) : (
                  <span className="text-slate-500">Sans allergie connue</span>
                )}

                {selectedPatient?.chronicConditions && (
                  <>
                    <span className="text-slate-300" aria-hidden="true">·</span>
                    <span className="text-teal-800">
                      Terrain : <strong>{selectedPatient.chronicConditions}</strong>
                    </span>
                  </>
                )}

                {(form12Steps.riskFactors?.smokingPA || 0) > 0 && (
                  <>
                    <span className="text-slate-300" aria-hidden="true">·</span>
                    <span className="text-amber-800 tabular-nums">
                      Tabagisme : <strong>{form12Steps.riskFactors.smokingPA} PA</strong>
                    </span>
                  </>
                )}

                {form12Steps.riskFactors?.biomassExposure && (
                  <>
                    <span className="text-slate-300" aria-hidden="true">·</span>
                    <span className="text-orange-800 font-semibold">Exposition biomasse</span>
                  </>
                )}

                {selectedPatient && (
                  <div className="flex items-center gap-2 sm:ml-2 pl-2 sm:border-l border-slate-200">
                    <Link
                      to={`/patients?patientId=${selectedPatient.id}`}
                      className="text-xxs font-bold text-teal-700 hover:underline whitespace-nowrap"
                    >
                      Dossier DPI →
                    </Link>
                    <Link
                      to={`/hospitalization?admit=1&patientId=${selectedPatient.id}`}
                      className="inline-flex items-center gap-1 text-xxs font-bold text-sky-700 hover:underline whitespace-nowrap"
                    >
                      <BedDouble className="w-3 h-3" />
                      <span>Hospitaliser</span>
                    </Link>
                    <Link
                      to="/imaging-ai"
                      className="text-xxs font-bold text-indigo-700 hover:underline whitespace-nowrap"
                    >
                      Radio IA
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Workflow Mode Switcher & Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Mode Switcher Segmented Control */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('STEP_BY_STEP')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'STEP_BY_STEP'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Saisie guidée étape par étape avec timeline clinique"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>12 Étapes</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('CONTINUOUS_SHEET')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'CONTINUOUS_SHEET'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Feuille médicale continue défilante tout-en-un"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Feuille Défilante</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('EXPRESS_URGENCY')}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'EXPRESS_URGENCY'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
                title="Protocole d'urgence vitale et détresse respiratoire"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ Triage</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                title="Consulter les consultations antérieures du patient"
              >
                <History className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Historique</span>
                <span className="font-mono text-3xs font-bold text-slate-600 tabular-nums">
                  ({patientConsultations.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                title="Imprimer le compte-rendu, ordonnance ou certificat"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span className="hidden md:inline">Documents</span>
              </button>

              <button
                type="button"
                onClick={handleSaveConsultation}
                title="Enregistrer la consultation (Ctrl+S)"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>Valider</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Slim Clinical Protocol & Utility Bar */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              <span>Protocoles 1-clic :</span>
            </span>
            {FULL_CLINICAL_SCENARIOS.map(sc => {
              const isActive = activeScenarioId === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleLoadScenario(sc.id)}
                  className={`text-xxs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 border ${
                    isActive
                      ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                      : 'bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border-slate-200'
                  }`}
                  title={`Pré-remplir les 12 étapes avec le protocole clinique : ${sc.name}`}
                >
                  <span>{sc.icon}</span>
                  <span>{sc.name}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleResetConsultation}
              className="text-xxs font-medium text-slate-400 hover:text-slate-700 hover:underline px-2 py-1 cursor-pointer"
              title="Effacer pour une consultation vierge"
            >
              Effacer
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAiDrawer(!showAiDrawer)}
              className={`px-3 py-1 rounded-lg text-xxs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                showAiDrawer
                  ? 'bg-teal-50 text-teal-900 border-teal-300 shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Assistance IA CHREIN</span>
            </button>

            {viewMode !== 'EXPRESS_URGENCY' && (
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-3xs font-semibold">
                <button
                  type="button"
                  onClick={() => updateStepsOrientation('VERTICAL')}
                  className={`px-2 py-0.5 rounded transition ${stepsOrientation === 'VERTICAL' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'text-slate-600'}`}
                  title="Afficher les étapes en vertical (Timeline latérale)"
                >
                  Vertical
                </button>
                <button
                  type="button"
                  onClick={() => updateStepsOrientation('HORIZONTAL')}
                  className={`px-2 py-0.5 rounded transition ${stepsOrientation === 'HORIZONTAL' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'text-slate-600'}`}
                  title="Afficher les étapes en horizontal (Barre d'onglets)"
                >
                  Horizontal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Alerts Strip (Rendered only when active) */}
      {(vitalsAlerts.length > 0 || saveSuccessMsg || transcriptNotice || isRecording || dictationStatus !== 'IDLE') && (
        <div className="space-y-2 animate-fade-in">
          {vitalsAlerts.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs font-bold text-amber-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Alerte Constantes :</span>
                <span className="font-medium">{vitalsAlerts.join(' · ')}</span>
              </div>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold text-xs flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Consultation en 12 étapes validée et archivée dans le DPI CHREIN avec succès.</span>
              </div>
              <button onClick={() => setSaveSuccessMsg(false)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {(transcriptNotice || isRecording || dictationStatus !== 'IDLE') && (
            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
              dictationStatus === 'RECORDING'
                ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                : dictationStatus === 'TRANSCRIBING'
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : 'bg-teal-50 border-teal-200 text-teal-900'
            }`}>
              <div className="flex items-center gap-2.5">
                {dictationStatus === 'RECORDING' ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                    <span className="font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-xxs">
                      00:{dictationSeconds < 10 ? `0${dictationSeconds}` : dictationSeconds}
                    </span>
                    <span className="font-bold">{transcriptNotice || "Dictée en cours... Parlez dans votre micro."}</span>
                  </div>
                ) : dictationStatus === 'TRANSCRIBING' ? (
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    <span className="font-bold">Transcription médicale en cours...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Mic className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="font-bold">{transcriptNotice}</span>
                    {transcriptNotice && (transcriptNotice.includes('⚠️') || transcriptNotice.includes('refusé') || transcriptNotice.includes('restreint')) && (
                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('microphone-permission-denied', {
                            detail: {
                              message: transcriptNotice,
                              fieldName: speechTargetField,
                              requestId: `consultations-${speechTargetField}`
                            }
                          }));
                        }}
                        className="ml-2 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xxs font-black transition cursor-pointer shadow-2xs"
                      >
                        Capture Native / Options ➔
                      </button>
                    )}
                  </div>
                )}
              </div>

              {dictationStatus === 'RECORDING' ? (
                <button
                  type="button"
                  onClick={() => toggleRecording(speechTargetField)}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xxs font-black hover:bg-rose-700 cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <MicOff className="w-3 h-3" />
                  <span>Terminer</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => stopDictation()}
                  className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xxs cursor-pointer"
                >
                  Fermer
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 12-Steps Navigation Bar with Completed Checkmarks and Progress Counter (shown when HORIZONTAL and not EXPRESS_URGENCY) */}
      {viewMode !== 'EXPRESS_URGENCY' && stepsOrientation === 'HORIZONTAL' && (
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1">
          {STEP_CONFIG.map(item => {
            const completed = isStepCompleted(item.step);
            const isCurrent = activeStepTab === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setActiveStepTab(item.step)}
                className={`px-3 py-2 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 text-xxs font-bold ${
                  isCurrent
                    ? 'bg-teal-600 text-white shadow-xs'
                    : completed
                    ? 'bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100/70 border border-emerald-200/60'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title={`${item.label} : ${item.desc}`}
              >
                {completed ? (
                  <Check className={`w-3 h-3 ${isCurrent ? 'text-white' : 'text-emerald-600'}`} />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-white' : 'bg-slate-300'}`} />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global 12-Step Progress Indicator */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-extrabold text-slate-700 block whitespace-nowrap">
              {completedStepsCount} / 12 étapes
            </span>
            <span className="text-3xs text-teal-700 font-semibold block">
              {Math.round((completedStepsCount / 12) * 100)}% complété
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-xxs text-slate-800">
            {completedStepsCount === 12 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <span>{Math.round((completedStepsCount / 12) * 100)}%</span>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vertical Stepper Navigation (3 cols) when stepsOrientation is VERTICAL */}
        {viewMode !== 'EXPRESS_URGENCY' && stepsOrientation === 'VERTICAL' && (
          <aside className="lg:col-span-3 xl:col-span-3 lg:sticky lg:top-20 z-10 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Stepper Header */}
              <div className="p-3.5 bg-gradient-to-r from-slate-900 to-teal-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                    <ListOrdered className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-tight">Étapes Cliniques</h3>
                    <p className="text-3xs text-teal-300/80 font-mono">
                      {completedStepsCount} / 12 renseignées ({Math.round((completedStepsCount / 12) * 100)}%)
                    </p>
                  </div>
                </div>

                {/* Mobile accordion toggle button */}
                <button
                  type="button"
                  onClick={() => setIsMobileStepsExpanded(!isMobileStepsExpanded)}
                  className="lg:hidden p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1 cursor-pointer"
                  title="Afficher/Masquer les étapes"
                >
                  <span className="text-3xs font-semibold">{isMobileStepsExpanded ? 'Masquer' : 'Afficher'}</span>
                  {isMobileStepsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5">
                <div
                  className="bg-teal-600 h-1.5 transition-all duration-300"
                  style={{ width: `${(completedStepsCount / 12) * 100}%` }}
                />
              </div>

              {/* Vertical Step Items List Grouped by 4 Clinical Phases */}
              <div className={`p-2 lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto space-y-3 ${isMobileStepsExpanded ? 'block' : 'hidden lg:block'}`}>
                {CLINICAL_PHASES.map((phaseGroup) => {
                  const phaseSteps = STEP_CONFIG.filter(item => phaseGroup.steps.includes(item.step));
                  const phaseCompletedCount = phaseSteps.filter(s => isStepCompleted(s.step)).length;
                  const isPhaseComplete = phaseCompletedCount === phaseSteps.length;
                  const hasActiveStep = phaseGroup.steps.includes(activeStepTab);

                  return (
                    <div key={phaseGroup.phase} className="space-y-1">
                      {/* Phase Header */}
                      <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5 border-b border-slate-100">
                        <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                          hasActiveStep ? 'text-teal-700' : isPhaseComplete ? 'text-emerald-700' : 'text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            hasActiveStep ? 'bg-teal-600' : isPhaseComplete ? 'bg-emerald-500' : 'bg-slate-300'
                          }`} />
                          <span>{phaseGroup.shortTitle}</span>
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isPhaseComplete
                            ? 'bg-emerald-100 text-emerald-800'
                            : hasActiveStep
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {phaseCompletedCount}/{phaseSteps.length}
                        </span>
                      </div>

                      {/* Phase Steps List */}
                      <div className="space-y-1 pl-0.5">
                        {phaseSteps.map((item) => {
                          const completed = isStepCompleted(item.step);
                          const isCurrent = viewMode === 'STEP_BY_STEP' && activeStepTab === item.step;

                          return (
                            <button
                              key={item.step}
                              type="button"
                              onClick={() => {
                                if (viewMode === 'CONTINUOUS_SHEET') {
                                  const el = document.getElementById(`step-${item.step}`);
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                } else {
                                  setActiveStepTab(item.step);
                                }
                              }}
                              className={`w-full text-left p-2 rounded-xl transition-all duration-150 flex items-start gap-2 group cursor-pointer relative ${
                                isCurrent
                                  ? 'bg-teal-50 border-2 border-teal-600 shadow-xs ring-1 ring-teal-600/20'
                                  : completed
                                  ? 'bg-slate-50/70 border border-slate-200/80 hover:bg-slate-100/80'
                                  : 'border border-transparent hover:bg-slate-50 hover:border-slate-200'
                              }`}
                            >
                              {/* Step Number Circle / Checkmark */}
                              <div className="relative shrink-0 mt-0.5">
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-xxs transition-colors ${
                                    completed
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : isCurrent
                                      ? 'bg-teal-600 text-white shadow-xs'
                                      : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'
                                  }`}
                                >
                                  {completed ? (
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  ) : (
                                    <span>{item.step}</span>
                                  )}
                                </div>
                              </div>

                              {/* Step Text Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span
                                    className={`text-xs font-bold truncate ${
                                      isCurrent
                                        ? 'text-teal-950 font-black'
                                        : completed
                                        ? 'text-slate-900'
                                        : 'text-slate-700'
                                    }`}
                                  >
                                    {item.label}
                                  </span>
                                  <span
                                    className={`text-4xs uppercase tracking-wider font-extrabold px-1 py-0.2 rounded ${
                                      completed
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : isCurrent
                                        ? 'bg-teal-100 text-teal-800'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {completed ? 'Fait' : item.tag}
                                  </span>
                                </div>
                                <p className="text-3xs text-slate-500 line-clamp-1 leading-tight">
                                  {item.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stepper Footer Quick Action */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-3xs text-slate-500">
                <span className="font-medium">
                  {completedStepsCount === 12 ? '✓ 12/12 complétées' : `${12 - completedStepsCount} restante(s)`}
                </span>
                <button
                  type="button"
                  onClick={handleSaveConsultation}
                  className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Save className="w-3 h-3" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Central / Active Form Area */}
        {viewMode === 'EXPRESS_URGENCY' ? (
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border-2 border-rose-300 shadow-md space-y-6">
            {/* Express Emergency Triage Header */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-200 bg-rose-50/70 -m-6 mb-0 p-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-rose-950 uppercase tracking-tight">
                      Console de Triage & Urgence Respiratoire Aiguë
                    </h2>
                    <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                      Objectif 3 min
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 font-medium">
                    Prise en charge immédiate, constantes critiques, protocoles d'urgence CHREIN et ordonnance de déchoquage.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveConsultation}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Valider l'Urgence & Sauvegarder</span>
              </button>
            </div>

            {/* Quick Emergency Protocol Buttons */}
            <div className="p-4 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 rounded-xl border border-rose-200 space-y-2.5">
              <span className="text-xxs font-black uppercase text-rose-900 tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-rose-600 fill-current" />
                <span>Protocoles d'Urgence Immédiate (1 clic pour charger constantes, diagnostic & prescriptions) :</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyUrgencyProtocol('ASTHME_GRAVE')}
                  className="p-3 bg-white hover:bg-rose-50 border border-rose-300 rounded-xl text-left transition cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-rose-950 group-hover:text-rose-700">🫁 Crise d'Asthme Aiguë Grave (AAG)</span>
                    <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">O2 + Nébulisation</span>
                  </div>
                  <p className="text-xxs text-slate-500">Salbutamol 5mg + Atrovent 0.5mg sous O2 6 L/min + Solupred 80mg IV + VVP</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyUrgencyProtocol('BPCO_EXACERBEE')}
                  className="p-3 bg-white hover:bg-amber-50 border border-amber-300 rounded-xl text-left transition cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-amber-950 group-hover:text-amber-700">🌬️ Décompensation BPCO / Hypercapnie</span>
                    <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Cible SpO2 88-92%</span>
                  </div>
                  <p className="text-xxs text-slate-500">O2 bas débit 1.5 L/min + Aérosols + Amox-Clav 1g + Solupred 40mg + VNI si pH&lt;7.35</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyUrgencyProtocol('PAC_SEVERITE')}
                  className="p-3 bg-white hover:bg-blue-50 border border-blue-300 rounded-xl text-left transition cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-blue-950 group-hover:text-blue-700">🌡️ Pneumonie Grave Hypoxémiante (PAC)</span>
                    <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">CRB-65 &ge; 2</span>
                  </div>
                  <p className="text-xxs text-slate-500">O2 4 L/min + Ceftriaxone 2g IVL + Azithromycine 500mg + Remplissage Cristalloïdes</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyUrgencyProtocol('EMBOLIE_GRAVE')}
                  className="p-3 bg-white hover:bg-purple-50 border border-purple-300 rounded-xl text-left transition cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-purple-950 group-hover:text-purple-700">🩸 Suspicion Embolie Pulmonaire Grave</span>
                    <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">Urgence Vitale</span>
                  </div>
                  <p className="text-xxs text-slate-500">O2 + Lovenox 100 UI/kg SC curative + Repos strict + Angioscanner urgent + DAR</p>
                </button>
              </div>
            </div>

            {/* Vital Signs Grid for Emergency */}
            <div className="space-y-2">
              <span className="text-xxs font-black uppercase text-slate-700 tracking-wider block">
                Constantes Vitales Immédiates :
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xxs font-bold text-slate-500 block mb-1">Fréquence Respiratoire (FR)</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={form12Steps.vitals.rr || 24}
                      onChange={(e) => setForm12Steps({ ...form12Steps, vitals: { ...form12Steps.vitals, rr: Number(e.target.value) } })}
                      className="w-full text-base font-black text-rose-700 bg-white border border-slate-300 rounded-lg p-1.5 font-mono"
                    />
                    <span className="text-xxs text-slate-400">/min</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xxs font-bold text-slate-500 block mb-1">SpO2 Air Ambiant (%)</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={form12Steps.vitals.spo2Ambient || 90}
                      onChange={(e) => setForm12Steps({ ...form12Steps, vitals: { ...form12Steps.vitals, spo2Ambient: Number(e.target.value) } })}
                      className="w-full text-base font-black text-teal-700 bg-white border border-slate-300 rounded-lg p-1.5 font-mono"
                    />
                    <span className="text-xxs text-slate-400">%</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xxs font-bold text-slate-500 block mb-1">Débit O2 Apporté (L/min)</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={form12Steps.vitals.o2FlowLiters || 2}
                      onChange={(e) => setForm12Steps({ ...form12Steps, vitals: { ...form12Steps.vitals, o2FlowLiters: Number(e.target.value) } })}
                      className="w-full text-base font-black text-blue-700 bg-white border border-slate-300 rounded-lg p-1.5 font-mono"
                    />
                    <span className="text-xxs text-slate-400">L/min</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xxs font-bold text-slate-500 block mb-1">Tension Artérielle (TA)</span>
                  <input
                    type="text"
                    value={form12Steps.vitals.bp || '120/80'}
                    onChange={(e) => setForm12Steps({ ...form12Steps, vitals: { ...form12Steps.vitals, bp: e.target.value } })}
                    className="w-full text-base font-black text-slate-800 bg-white border border-slate-300 rounded-lg p-1.5 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Quick emergency diagnosis and prescription */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1">
                  Motif d'urgence & Diagnostic évoqué
                </label>
                <textarea
                  rows={3}
                  value={form12Steps.chiefComplaint}
                  onChange={(e) => setForm12Steps({ ...form12Steps, chiefComplaint: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1">
                  Orientation & Destination immédiate
                </label>
                <select
                  value={form12Steps.managementPlan.orientation}
                  onChange={(e) => setForm12Steps({ ...form12Steps, managementPlan: { ...form12Steps.managementPlan, orientation: e.target.value as any } })}
                  className="w-full text-xs bg-rose-50 border border-rose-300 rounded-xl p-3 font-black text-rose-950 mb-2"
                >
                  <option value="HOSPITALISATION">Hospitalisation d'urgence Service Pneumologie CHREIN</option>
                  <option value="TRANSFERT">Transfert immédiat Réanimation / Soins Continus (DAR)</option>
                  <option value="AMBULATOIRE">Retour à domicile après surveillance stabilisée</option>
                </select>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xxs text-slate-600">
                  <span className="font-bold">Patient :</span> {selectedPatient?.firstName} {selectedPatient?.lastName} ({selectedPatient?.age} ans) &bull; IP: {selectedPatient?.code}
                </div>
              </div>
            </div>

            {/* Emergency Prescription */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xxs font-bold text-slate-700 block">
                  Traitement d'Urgence & Posologies Immédiates
                </label>
                <span className="text-[10px] text-teal-700 font-bold">Modifiable en temps réel</span>
              </div>
              <textarea
                rows={5}
                value={form12Steps.managementPlan.medicationsPrescribed}
                onChange={(e) => setForm12Steps({ ...form12Steps, managementPlan: { ...form12Steps.managementPlan, medicationsPrescribed: e.target.value } })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono leading-relaxed"
              />
            </div>
          </div>
        ) : (
          <div className={`${
            stepsOrientation === 'VERTICAL'
              ? (dockAiPanel ? 'lg:col-span-6 xl:col-span-6' : 'lg:col-span-9 xl:col-span-9')
              : (dockAiPanel ? 'lg:col-span-8 xl:col-span-8' : 'lg:col-span-12')
          } bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 transition-all duration-200`}>
            {/* Quick jump anchors for continuous sheet */}
            {viewMode === 'CONTINUOUS_SHEET' && (
              <div className="sticky top-2 z-20 bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center justify-between gap-2 overflow-x-auto">
                <span className="text-[10px] font-black uppercase text-teal-300 tracking-wider shrink-0 flex items-center gap-1">
                  <LayoutList className="w-3.5 h-3.5 text-teal-400" />
                  <span>Accès Rapide :</span>
                </span>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {STEP_CONFIG.map(item => (
                    <a
                      key={item.step}
                      href={`#step-${item.step}`}
                      className={`text-3xs font-bold px-2 py-1 rounded-md whitespace-nowrap transition cursor-pointer ${
                        isStepCompleted(item.step) ? 'bg-emerald-600/80 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 1: ÉTAT CIVIL & IDENTITÉ DU PATIENT */}
            {(activeStepTab === 1 || viewMode === 'CONTINUOUS_SHEET') && (
              <div id="step-1" className={`space-y-4 ${viewMode === 'CONTINUOUS_SHEET' ? 'pt-2 border-b border-slate-200 pb-6' : ''}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-800">
                    1) État Civil, Identification & Contexte Social
                  </h3>
                  <span className="text-xxs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    N° IP : {selectedPatient?.code}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-xxs font-bold uppercase">Nom & Prénom</span>
                    <span className="font-extrabold text-slate-800 text-sm">{selectedPatient?.firstName} {selectedPatient?.lastName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xxs font-bold uppercase">N° Dossier / Hospitalier</span>
                    <span className="font-mono font-bold text-slate-800">{selectedPatient?.hospitalNumber || selectedPatient?.code || 'CHREIN-2026-N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xxs font-bold uppercase">Âge & Sexe</span>
                    <span className="font-bold text-slate-800">{selectedPatient?.age} ans • {selectedPatient?.gender === 'M' ? 'Masculin' : 'Féminin'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xxs font-bold uppercase">Adresse & Quartier</span>
                    <span className="font-bold text-slate-800">{selectedPatient?.address || 'Kaolack'}</span>
                  </div>
                  <div>
                    <label className="text-slate-500 block text-xxs font-bold uppercase mb-1">Profession</label>
                    <input
                      type="text"
                      value={form12Steps.profession ?? selectedPatient?.profession ?? ''}
                      onChange={(e) => setForm12Steps(prev => ({ ...prev, profession: e.target.value }))}
                      placeholder="Ex: Cultivateur, Commerçant..."
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block text-xxs font-bold uppercase mb-1">Téléphone d'urgence</label>
                    <input
                      type="text"
                      value={form12Steps.emergencyPhone ?? selectedPatient?.emergencyPhone ?? selectedPatient?.phone ?? ''}
                      onChange={(e) => setForm12Steps(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                      placeholder="77 000 00 00"
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Situation Matrimoniale & Niveau d'Études (Choix unique) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="text-xxs font-extrabold text-slate-700 uppercase block mb-1">
                      Situation Matrimoniale
                    </label>
                    <select
                      value={form12Steps.maritalStatus || 'Non renseigné'}
                      onChange={(e) => setForm12Steps(prev => ({ ...prev, maritalStatus: e.target.value as MaritalStatus }))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-teal-600"
                    >
                      {MARITAL_STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xxs font-extrabold text-slate-700 uppercase block mb-1">
                      Niveau d'Études
                    </label>
                    <select
                      value={form12Steps.educationLevel || 'Non renseigné'}
                      onChange={(e) => setForm12Steps(prev => ({ ...prev, educationLevel: e.target.value as EducationLevel }))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-teal-600"
                    >
                      {EDUCATION_LEVEL_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xxs font-bold text-slate-600 block">
                      Notes contextuelles & conditions de vie (logement, promiscuité, foyer familial)
                    </label>
                    <span className="text-[10px] text-teal-700 font-bold">Raccourcis 1-clic :</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      'Habitat collectif / promiscuité (foyer > 6 personnes)',
                      'Cuisine intérieure au feu de bois / biomasse',
                      'Contage tuberculeux intrafamilial documenté',
                      'Absence de contage respiratoire connu',
                      'Habitat aéré, bonne ventilation naturelle',
                      'Exposition poussières de battage / chantiers'
                    ].map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setForm12Steps(prev => ({
                          ...prev,
                          civilStatusNotes: prev.civilStatusNotes ? `${prev.civilStatusNotes}. ${chip}` : chip
                        }))}
                        className="text-[10px] font-medium bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 transition cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    value={form12Steps.civilStatusNotes || ''}
                    onChange={(e) => setForm12Steps({ ...form12Steps, civilStatusNotes: e.target.value })}
                    placeholder="Habitat collectif, nombre de personnes par pièce, aération..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-teal-600 font-medium"
                  />
                </div>
              </div>
            )}

          {/* STEP 2: MOTIF DE CONSULTATION */}
          {(activeStepTab === 2 || viewMode === 'CONTINUOUS_SHEET') && (
            <div id="step-2" className={`space-y-4 ${viewMode === 'CONTINUOUS_SHEET' ? 'pt-4 border-b border-slate-200 pb-6' : ''}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800">
                  2) Motif Principal de Consultation
                </h3>
                <VoiceDictationButton
                  value={form12Steps.chiefComplaint}
                  onTranscript={(text) => setForm12Steps(prev => ({ ...prev, chiefComplaint: text }))}
                  fieldName="Motif de consultation"
                  buttonText="Dicter le motif"
                  size="sm"
                />
              </div>

              {/* Categorized Quick Preset Buttons for Chief Complaints */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  Motifs fréquents en consultation de pneumologie (CHREIN) :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Toux fébrile > 3 semaines (Suspicion TB)', color: 'text-amber-800 bg-amber-50 border-amber-200' },
                    { label: 'Exacerbation de dyspnée avec expectoration purulente (BPCO)', color: 'text-blue-800 bg-blue-50 border-blue-200' },
                    { label: 'Crise de dyspnée expiratoire sifflante nocturne (Asthme)', color: 'text-teal-800 bg-teal-50 border-teal-200' },
                    { label: 'Fièvre brutale 39°C avec point de côté et crachats rouillés (PAC)', color: 'text-rose-800 bg-rose-50 border-rose-200' },
                    { label: 'Douleur thoracique aiguë brutale avec polypnée (Suspicion EP)', color: 'text-purple-800 bg-purple-50 border-purple-200' },
                    { label: 'Hémoptysie (crachats striés de sang)', color: 'text-red-800 bg-red-50 border-red-200' },
                    { label: 'Contrôle à M2 sous traitement antituberculeux PNT', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setForm12Steps({ ...form12Steps, chiefComplaint: preset.label })}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border transition-colors cursor-pointer hover:shadow-2xs ${preset.color}`}
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={3}
                value={form12Steps.chiefComplaint}
                onChange={(e) => setForm12Steps({ ...form12Steps, chiefComplaint: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-teal-600 font-medium"
              />
            </div>
          )}

          {/* STEP 3: HISTOIRE DE LA MALADIE */}
          {(activeStepTab === 3 || viewMode === 'CONTINUOUS_SHEET') && (
            <div id="step-3" className={`space-y-4 ${viewMode === 'CONTINUOUS_SHEET' ? 'pt-4 border-b border-slate-200 pb-6' : ''}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    3) Histoire de la Maladie
                  </h3>
                  <p className="text-xxs text-slate-500">
                    Chronologie, mode d'installation, automédications ou antibiotiques antérieurs
                  </p>
                </div>
                <VoiceDictationButton
                  value={form12Steps.historyOfIllness}
                  onTranscript={(text) => setForm12Steps(prev => ({ ...prev, historyOfIllness: text }))}
                  fieldName="Histoire de la maladie"
                  buttonText="Dicter l'histoire"
                  size="sm"
                />
              </div>

              {/* Anamnesis Quick Composer */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  ⚡ Composeur rapide de l'histoire clinique :
                </span>
                <div className="space-y-1.5 text-xxs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-slate-600 min-w-[70px]">Évolution :</span>
                    {[
                      'Installation progressive depuis 3 semaines',
                      'Début brutal il y a 48 heures',
                      'Survenue paroxystique nocturne brutale',
                      'Aggravation récente d\'une dyspnée d\'effort ancienne'
                    ].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm12Steps(prev => ({
                          ...prev,
                          historyOfIllness: prev.historyOfIllness ? `${prev.historyOfIllness} ${c}.` : `${c}.`
                        }))}
                        className="text-[10px] px-2 py-0.5 bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200 rounded-md transition cursor-pointer"
                      >
                        + {c}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-slate-600 min-w-[70px]">Signes PNT :</span>
                    {[
                      'Fièvre vespéro-nocturne et sueurs profuses',
                      'Amaigrissement marqué (> 5 kg) et anorexie',
                      'Expectorations mucopurulentes abondantes',
                      'Crachats hémoptoïques / striés de sang'
                    ].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm12Steps(prev => ({
                          ...prev,
                          historyOfIllness: prev.historyOfIllness ? `${prev.historyOfIllness} ${c}.` : `${c}.`
                        }))}
                        className="text-[10px] px-2 py-0.5 bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200 rounded-md transition cursor-pointer"
                      >
                        + {c}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-slate-600 min-w-[70px]">Traitements :</span>
                    {[
                      'Automédication par Amoxicilline sans amélioration',
                      'Prise inefficace de bronchodilatateur à domicile',
                      'Pas de traitement antibiotique préalable'
                    ].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm12Steps(prev => ({
                          ...prev,
                          historyOfIllness: prev.historyOfIllness ? `${prev.historyOfIllness} ${c}.` : `${c}.`
                        }))}
                        className="text-[10px] px-2 py-0.5 bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200 rounded-md transition cursor-pointer"
                      >
                        + {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <textarea
                rows={5}
                value={form12Steps.historyOfIllness}
                onChange={(e) => setForm12Steps({ ...form12Steps, historyOfIllness: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-teal-600 leading-relaxed font-medium"
              />

              {/* Échelle de Dyspnée mMRC déplacée dans l'Histoire de la Maladie */}
              <div className="p-3.5 bg-gradient-to-r from-teal-50/70 to-blue-50/50 rounded-xl border border-teal-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <span className="text-xxs font-extrabold uppercase text-slate-800 tracking-wider">
                      Échelle de Dyspnée mMRC (Stades 0 à 4 — Histoire de la Maladie)
                    </span>
                  </div>
                  {(form12Steps.mmrcGrade !== undefined || selectedMmrcGrade !== null) && (
                    <span className="text-xxs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md border border-teal-200">
                      Actif : Stade {form12Steps.mmrcGrade ?? selectedMmrcGrade}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                  {MMRC_DYSPNEA_SCALE.map((s) => {
                    const isActive = (form12Steps.mmrcGrade ?? selectedMmrcGrade) === s.grade;
                    return (
                      <button
                        key={s.grade}
                        type="button"
                        onClick={() => handleApplyMmrcGrade(s.grade)}
                        className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                          isActive
                            ? 'bg-teal-600 text-white border-teal-700 shadow-xs ring-2 ring-teal-200'
                            : 'bg-white hover:bg-teal-50/60 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-black">{s.label}</span>
                          {isActive && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <p className={`text-[10px] leading-tight line-clamp-3 ${isActive ? 'text-teal-50' : 'text-slate-500'}`}>
                          {s.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-teal-700 italic">
                  * La sélection d'un stade mMRC l'insère dans l'histoire de la maladie et pré-remplit les scores BPCO (mMRC, GOLD ABE, BODE).
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: ANTÉCÉDENTS ET FACTEURS DE RISQUE (Sections A-F) */}
          {(activeStepTab === 4 || viewMode === 'CONTINUOUS_SHEET') && (
            <div id="step-4" className={`space-y-4 ${viewMode === 'CONTINUOUS_SHEET' ? 'pt-4 border-b border-slate-200 pb-6' : ''}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    4) Antécédents et Facteurs de Risque (A à F)
                  </h3>
                  <p className="text-xxs text-slate-500">
                    Tabagisme multi-périodes & PA automatiques, consommations, terrain médical, expositions pro/env, chirurgie & gynéco-obstétrique
                  </p>
                </div>
                <VoiceDictationButton
                  value={form12Steps.antecedentsText}
                  onTranscript={(text) => setForm12Steps(prev => ({ ...prev, antecedentsText: text }))}
                  fieldName="Synthèse des antécédents"
                  buttonText="Dicter la synthèse"
                  size="sm"
                />
              </div>

              {/* Comprehensive A-F DPI History Editor */}
              <PatientDpiHistoryEditor
                value={dpiAntecedentsValue}
                onChange={handleDpiAntecedentsChange}
                gender={selectedPatient?.gender}
              />

              {/* Additional quick clinical fields (VIH, Contage TB, Allergies) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="text-xxs font-bold text-slate-700 block mb-1">Statut Sérologique VIH</label>
                  <select
                    value={form12Steps.riskFactors.hivStatus}
                    onChange={(e) => setForm12Steps({
                      ...form12Steps,
                      riskFactors: { ...form12Steps.riskFactors, hivStatus: e.target.value as any }
                    })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                  >
                    <option value="NEGATIF">VIH Négatif (Sérologie documentée)</option>
                    <option value="POSITIF">VIH Positif (Sous ARV)</option>
                    <option value="INCONNU">Inconnu / Dépistage à proposer</option>
                  </select>
                </div>

                <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form12Steps.riskFactors.tbContact}
                    onChange={(e) => setForm12Steps({
                      ...form12Steps,
                      riskFactors: { ...form12Steps.riskFactors, tbContact: e.target.checked }
                    })}
                    className="h-4 w-4 text-teal-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Notion de contage TB</span>
                    <span className="text-[10px] text-slate-500">Intrafamilial ou professionnel</span>
                  </div>
                </label>

                <div>
                  <label className="text-xxs font-bold text-slate-700 block mb-1">Allergies médicamenteuses</label>
                  <input
                    type="text"
                    value={form12Steps.riskFactors.allergiesAtopy || ''}
                    onChange={(e) => setForm12Steps({
                      ...form12Steps,
                      riskFactors: { ...form12Steps.riskFactors, allergiesAtopy: e.target.value }
                    })}
                    placeholder="Ex: Aucune allergie, Pénicilline..."
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xxs font-bold text-slate-700 block">
                    Synthèse narrative des antécédents et facteurs de risque
                  </label>
                  <span className="text-[10px] text-teal-700 font-bold">Raccourcis 1-clic :</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {[
                    'HTA traitée',
                    'Diabète de type 2',
                    'Terrain atopique / Rhinite allergique',
                    'Antécédent de tuberculose traitée',
                    'Pas d\'antécédent respiratoire connu',
                    'Antécédent de chirurgie thoracique'
                  ].map(com => (
                    <button
                      key={com}
                      type="button"
                      onClick={() => setForm12Steps(prev => ({
                        ...prev,
                        antecedentsText: prev.antecedentsText ? `${prev.antecedentsText}. ${com}` : com
                      }))}
                      className="text-[10px] bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 px-2 py-0.5 rounded border border-slate-200 transition cursor-pointer"
                    >
                      + {com}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={form12Steps.antecedentsText}
                  onChange={(e) => setForm12Steps({ ...form12Steps, antecedentsText: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
            </div>
          )}

          {/* STEP 5: CONSTANTES & EXAMEN GÉNÉRAL (Avec IMC auto, SpO2 Air Ambiant vs Sous O2 & Séries multi-mesures) */}
          {(activeStepTab === 5 || viewMode === 'CONTINUOUS_SHEET') && (
            <div id="step-5" className={`space-y-4 ${viewMode === 'CONTINUOUS_SHEET' ? 'pt-4 border-b border-slate-200 pb-6' : ''}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                <h3 className="text-sm font-black text-slate-800">
                  5) Constantes & Paramètres Cliniques
                </h3>
                <div className="flex items-center gap-2">
                  {bmiCalculation && (
                    <span className={`text-xxs font-bold px-2.5 py-1 rounded-full ${bmiCalculation.colorClass}`}>
                      IMC : {bmiCalculation.value} kg/m² ({bmiCalculation.category})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleRecordVitalsSeries}
                    className="text-xxs font-bold px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enregistrer cette série de constantes</span>
                  </button>
                </div>
              </div>

              {/* Quick Vitals Accelerators */}
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  ⚡ Préréglages rapides :
                </span>
                <button
                  type="button"
                  onClick={handleFillNormalVitals}
                  className="text-xxs font-bold px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Check className="w-3 h-3" />
                  <span>Constantes Normales (TA 120/80 • SpO2 98% • FR 16 • T 36.8)</span>
                </button>
                <button
                  type="button"
                  onClick={handleFillUrgentVitals}
                  className="text-xxs font-bold px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Détresse Aiguë / Urgence (SpO2 88% • FR 28 • T 38.8)</span>
                </button>
              </div>

              {/* Paramètres principaux */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-slate-400" />
                    <span>Tension Artérielle (mmHg)</span>
                  </label>
                  <input
                    type="text"
                    value={form12Steps.vitals.bp}
                    onChange={(e) => setForm12Steps({
                      ...form12Steps,
                      vitals: { ...form12Steps.vitals, bp: e.target.value }
                    })}
                    placeholder="120/80"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1 flex items-center gap-1">
                    <HeartPulse className="w-3 h-3 text-rose-500" />
                    <span>Pouls (bpm)</span>
                  </label>
                  <input
                    type="number"
                    value={form12Steps.vitals.pulse || ''}
                    onChange={(e) => setForm12Steps({
                      ...form12Steps,
                      vitals: { ...form12Steps.vitals, pulse: Number(e.target.value) }
                    })}
                    placeholder="80"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1 flex items-center gap-1">
                    <Wind className="w-3 h-3 text-teal-600" />
                    <span>Fréquence Resp. (/min) *</span>
                  </label>
                  <input
                    type="number"
                    value={form12Steps.vitals.rr || ''}
                    onChange={(e) => setForm12Steps({
                      ...form12Steps,
                      vitals: { ...form12Steps.vitals, rr: Number(e.target.value) }
                    })}
                    placeholder="18"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-black text-teal-800"
                  />
                </div>

                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-amber-500" />
                    <span>Température (°C)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form12Steps.vitals.temperature || ''}
                    onChange={(e) => setForm12Steps({
                      ...form12Steps,
                      vitals: { ...form12Steps.vitals, temperature: Number(e.target.value) }
                    })}
                    placeholder="37.0"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>

              {/* Poids, Taille, IMC auto, État général */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Poids (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form12Steps.vitals.weight || ''}
                    onChange={(e) => {
                      const w = Number(e.target.value);
                      const computed = calcBmi(w, form12Steps.vitals.height);
                      setForm12Steps({
                        ...form12Steps,
                        vitals: { ...form12Steps.vitals, weight: w, bmi: computed }
                      });
                    }}
                    placeholder="65"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Taille (cm)</label>
                  <input
                    type="number"
                    value={form12Steps.vitals.height || ''}
                    onChange={(e) => {
                      const h = Number(e.target.value);
                      const computed = calcBmi(form12Steps.vitals.weight, h);
                      setForm12Steps({
                        ...form12Steps,
                        vitals: { ...form12Steps.vitals, height: h, bmi: computed }
                      });
                    }}
                    placeholder="170"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">IMC calculé (kg/m²)</label>
                  <div className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-mono font-black text-slate-800 flex items-center justify-between">
                    <span>{bmiCalculation ? `${bmiCalculation.value} kg/m²` : '—'}</span>
                    {bmiCalculation && (
                      <span className="text-[10px] font-sans font-bold text-slate-600">{bmiCalculation.category}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">État Général (OMS)</label>
                  <select
                    value={form12Steps.vitals.generalState}
                    onChange={(e) => setForm12Steps({
                      ...form12Steps,
                      vitals: { ...form12Steps.vitals, generalState: e.target.value as any }
                    })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  >
                    <option value="BON">Bon état général (OMS 0)</option>
                    <option value="ALTERE_LEGER">Altération légère (OMS 1)</option>
                    <option value="ALTERE_SEVERE">Altération sévère (OMS 2-3)</option>
                    <option value="CACHECTION">Cachexie / grabataire (OMS 4)</option>
                  </select>
                </div>
              </div>

              {/* Distinction SpO2 à l'air ambiant vs SpO2 sous oxygénothérapie */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xxs font-extrabold uppercase text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>Saturation en Oxygène (SpO₂)</span>
                  </span>
                  <div className="inline-flex p-1 bg-white rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setForm12Steps(prev => ({
                        ...prev,
                        vitals: { ...prev.vitals, spo2Mode: 'AIR_AMBIANT' }
                      }))}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                        (form12Steps.vitals.spo2Mode || 'AIR_AMBIANT') === 'AIR_AMBIANT'
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      SpO₂ à l'air ambiant
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm12Steps(prev => ({
                        ...prev,
                        vitals: { ...prev.vitals, spo2Mode: 'SOUS_O2' }
                      }))}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                        form12Steps.vitals.spo2Mode === 'SOUS_O2'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      SpO₂ sous oxygénothérapie
                    </button>
                  </div>
                </div>

                {(form12Steps.vitals.spo2Mode || 'AIR_AMBIANT') === 'AIR_AMBIANT' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xxs font-bold text-slate-700 block mb-1">SpO₂ Air Ambiant (%) *</label>
                      <input
                        type="number"
                        value={form12Steps.vitals.spo2Ambient || ''}
                        onChange={(e) => setForm12Steps({
                          ...form12Steps,
                          vitals: { ...form12Steps.vitals, spo2Ambient: Number(e.target.value) }
                        })}
                        placeholder="97"
                        className={`w-full text-xs bg-white border rounded-xl p-2.5 font-mono font-black ${
                          (form12Steps.vitals.spo2Ambient || 95) < 90
                            ? 'border-rose-400 text-rose-700 bg-rose-50/50'
                            : (form12Steps.vitals.spo2Ambient || 95) < 94
                            ? 'border-amber-400 text-amber-700'
                            : 'border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xxs font-bold text-blue-900 block mb-1">SpO₂ sous O₂ (%) *</label>
                      <input
                        type="number"
                        value={form12Steps.vitals.spo2O2 || ''}
                        onChange={(e) => setForm12Steps({
                          ...form12Steps,
                          vitals: { ...form12Steps.vitals, spo2O2: Number(e.target.value) }
                        })}
                        placeholder="95"
                        className="w-full text-xs bg-white border border-blue-200 rounded-xl p-2.5 font-mono font-black text-blue-900"
                      />
                    </div>
                    <div>
                      <label className="text-xxs font-bold text-blue-900 block mb-1">Débit O₂ (L/min)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={form12Steps.vitals.o2FlowLiters || ''}
                        onChange={(e) => setForm12Steps({
                          ...form12Steps,
                          vitals: { ...form12Steps.vitals, o2FlowLiters: Number(e.target.value) }
                        })}
                        placeholder="3"
                        className="w-full text-xs bg-white border border-blue-200 rounded-xl p-2.5 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xxs font-bold text-blue-900 block mb-1">Dispositif utilisé</label>
                      <select
                        value={form12Steps.vitals.o2Device || 'Lunettes nasales'}
                        onChange={(e) => setForm12Steps({
                          ...form12Steps,
                          vitals: { ...form12Steps.vitals, o2Device: e.target.value }
                        })}
                        className="w-full text-xs bg-white border border-blue-200 rounded-xl p-2.5 font-semibold"
                      >
                        {O2_DEVICE_OPTIONS.map(dev => (
                          <option key={dev} value={dev}>{dev}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xxs font-bold text-blue-900 block mb-1">FiO₂ (%) (optionnel)</label>
                      <input
                        type="number"
                        value={form12Steps.vitals.fio2 ?? ''}
                        onChange={(e) => setForm12Steps({
                          ...form12Steps,
                          vitals: {
                            ...form12Steps.vitals,
                            fio2: e.target.value === '' ? undefined : Number(e.target.value)
                          }
                        })}
                        placeholder="Ex: 32"
                        className="w-full text-xs bg-white border border-blue-200 rounded-xl p-2.5 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Historique des séries de constantes enregistrées (Suivi / Hospitalisation) */}
              {(form12Steps.vitalsSeries?.length || 0) > 0 && (
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xxs font-extrabold uppercase text-slate-700">
                      Séries de constantes enregistrées ({form12Steps.vitalsSeries?.length})
                    </span>
                    <span className="text-[10px] text-teal-700 font-semibold">
                      Synchronisées avec la courbe d'hospitalisation si patient hospitalisé
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className="p-1.5">Heure</th>
                          <th className="p-1.5">TA</th>
                          <th className="p-1.5">Pouls</th>
                          <th className="p-1.5">FR</th>
                          <th className="p-1.5">SpO₂ / O₂</th>
                          <th className="p-1.5">T°</th>
                          <th className="p-1.5">IMC</th>
                          <th className="p-1.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(form12Steps.vitalsSeries || []).map(s => (
                          <tr key={s.id}>
                            <td className="p-1.5 font-mono text-slate-600">
                              {new Date(s.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-1.5 font-mono font-bold">{s.bp || '--'}</td>
                            <td className="p-1.5 font-mono">{s.pulse || '--'} bpm</td>
                            <td className="p-1.5 font-mono">{s.rr || '--'}/min</td>
                            <td className="p-1.5 font-mono">
                              {s.spo2Mode === 'SOUS_O2'
                                ? `${s.spo2O2 || '--'}% (${s.o2FlowLiters || 0}L ${s.o2Device || 'O2'}${s.fio2 ? ` FiO2 ${s.fio2}%` : ''})`
                                : `${s.spo2Ambient || '--'}% (AA)`}
                            </td>
                            <td className="p-1.5 font-mono">{s.temperature || '--'}°C</td>
                            <td className="p-1.5 font-mono">{s.bmi ? `${s.bmi}` : '--'}</td>
                            <td className="p-1.5 text-right">
                              <button
                                type="button"
                                onClick={() => setForm12Steps(prev => ({
                                  ...prev,
                                  vitalsSeries: (prev.vitalsSeries || []).filter(item => item.id !== s.id)
                                }))}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: APPAREILS ET SYSTÈMES AVEC PARENTHÈSES CLINIQUES () & DICTÉE VOCALE */}
          {(activeStepTab === 6 || viewMode === 'CONTINUOUS_SHEET') && (
            <div id="step-6" className={`space-y-4 ${viewMode === 'CONTINUOUS_SHEET' ? 'pt-4 border-b border-slate-200 pb-6' : ''}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    6) Examen des Appareils et Systèmes
                  </h3>
                  <p className="text-xxs text-slate-500">
                    Raccourcis normaux `()` en 1 clic et dictée vocale médicale dédiée sur chaque appareil
                  </p>
                </div>
              </div>

              {/* Step 6 Master Accelerators with () */}
              <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200 space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-teal-900 tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-teal-600 fill-current" />
                  <span>Tableaux Cliniques Types en 1 clic (Règle des parenthèses () respectée) :</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleFillNormalPhysicalExam}
                    className="text-xxs font-bold px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>⚡ Examen Normal Global ()</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFillCondensationSyndrome}
                    className="text-xxs font-bold px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>🫁 Condensation (Crépitants foyer) ()</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFillPleuralSyndrome}
                    className="text-xxs font-bold px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>💧 Épanchement Pleural (Matité/Silence) ()</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFillObstructiveSyndrome}
                    className="text-xxs font-bold px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>🌬️ Syndrome Obstructif (Sibilants/Ronchis) ()</span>
                  </button>
                </div>
              </div>

              {/* Carte Auscultatoire Topographique Rapide (Pneumologie) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xxs font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    <span>Topographie Auscultatoire Rapide (Foyer & Localisation Thoracique)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                    Sélectionnez la zone anatomique puis insérez le signe
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {THORACIC_ZONES.map(z => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setActiveAuscultationZone(z.id)}
                      className={`text-xxs font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        activeAuscultationZone === z.id
                          ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {z.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-200">
                  <span className="text-3xs font-bold text-slate-400 uppercase py-1">Insérer :</span>
                  {[
                    '(Râles crépitants fins en fin d\'inspiration)',
                    '(Murmure vésiculaire aboli avec silence auscultatoire)',
                    '(Souffle tubaire rude de condensation)',
                    '(Sibilants expiratoires localisés)',
                    '(Frottement pleural rude superficiel)',
                    '(Murmure vésiculaire pur et conservé)'
                  ].map(finding => (
                    <button
                      key={finding}
                      type="button"
                      onClick={() => handleApplyAuscultationZone(finding)}
                      className="text-[10px] bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-700 px-2 py-0.5 rounded border border-slate-200 transition cursor-pointer"
                    >
                      + {finding}
                    </button>
                  ))}
                </div>
              </div>

              {/* All 11 Systems with () Shortcuts + Voice Dictation + Editable Text */}
              {[
                {
                  key: 'pulmonaryVesicularBreath' as const,
                  label: 'Auscultation Pulmonaire — Murmure Vésiculaire ()',
                  prefix: 'Murmure vésiculaire ',
                  presets: CLINICAL_PARENTHESES_PRESETS.pulmonaryVesicularBreath
                },
                {
                  key: 'pulmonaryCrackles' as const,
                  label: 'Râles Crépitants ()',
                  prefix: 'Râles crépitants ',
                  presets: CLINICAL_PARENTHESES_PRESETS.pulmonaryCrackles
                },
                {
                  key: 'pulmonaryWheezes' as const,
                  label: 'Sibilants & Wheezing ()',
                  prefix: 'Sibilants ',
                  presets: CLINICAL_PARENTHESES_PRESETS.pulmonaryWheezes
                },
                {
                  key: 'pulmonaryRhonchi' as const,
                  label: 'Ronchis & Sous-crépitants ()',
                  prefix: 'Ronchis ',
                  presets: CLINICAL_PARENTHESES_PRESETS.pulmonaryRhonchi
                },
                {
                  key: 'pleuralFriction' as const,
                  label: 'Frottement Pleural & Syndrome d\'Épanchement ()',
                  prefix: 'Frottement pleural ',
                  presets: CLINICAL_PARENTHESES_PRESETS.pleuralFriction
                },
                {
                  key: 'cyanosisClubbing' as const,
                  label: 'Cyanose & Hippocratisme Digital ()',
                  prefix: '',
                  presets: CLINICAL_PARENTHESES_PRESETS.cyanosisClubbing
                },
                {
                  key: 'cardiovascular' as const,
                  label: 'Appareil Cardiovasculaire (BDC, TJ, RHJ, OMI) ()',
                  prefix: '',
                  presets: CLINICAL_PARENTHESES_PRESETS.cardiovascular
                },
                {
                  key: 'abdomen' as const,
                  label: 'Appareil Digestif & Abdomen ()',
                  prefix: '',
                  presets: CLINICAL_PARENTHESES_PRESETS.abdomen
                },
                {
                  key: 'neurological' as const,
                  label: 'Système Nerveux & Examen Neurologique ()',
                  prefix: '',
                  presets: CLINICAL_PARENTHESES_PRESETS.neurological
                },
                {
                  key: 'entLymphNodes' as const,
                  label: 'Sphère ORL & Aires Ganglionnaires ()',
                  prefix: '',
                  presets: CLINICAL_PARENTHESES_PRESETS.entLymphNodes
                },
                {
                  key: 'cutaneous' as const,
                  label: 'Examen Cutanéo-Muqueux & Phanères ()',
                  prefix: '',
                  presets: CLINICAL_PARENTHESES_PRESETS.cutaneous
                }
              ].map(sys => (
                <div key={sys.key} className="space-y-1.5 p-3 bg-slate-50/70 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-xxs font-extrabold uppercase text-slate-700">
                      {sys.label}
                    </label>
                    <VoiceDictationButton
                      value={form12Steps.systems[sys.key] || ''}
                      onTranscript={(text) => setForm12Steps(prev => ({
                        ...prev,
                        systems: { ...prev.systems, [sys.key]: text }
                      }))}
                      fieldName={sys.label}
                      buttonText="Dicter"
                      size="sm"
                      appendMode={true}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-teal-700 font-bold mr-1">Raccourcis () :</span>
                    {sys.presets.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => insertParenthesisPreset(sys.key, sys.prefix ? `${sys.prefix}${p}` : p)}
                        className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 hover:border-teal-300 rounded text-slate-700 cursor-pointer"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={form12Steps.systems[sys.key] || ''}
                    onChange={(e) => setForm12Steps({
                      ...form12Steps,
                      systems: { ...form12Steps.systems, [sys.key]: e.target.value }
                    })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>
              ))}
            </div>
          )}

          {/* STEP 7: RÉSUMÉ SYNDROMIQUE STRUCTURÉ */}
          {(activeStepTab === 7 || viewMode === 'CONTINUOUS_SHEET') && (
            <div id="step-7" className={`space-y-4 ${viewMode === 'CONTINUOUS_SHEET' ? 'pt-4 border-b border-slate-200 pb-6' : ''}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    7) Résumé Syndromique
                  </h3>
                  <p className="text-xxs text-slate-500">
                    Phrase d'introduction structurée (antécédents sélectionnés) et syndromes classés par ordre de gravité et de priorité clinique
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoGenerateSyndromicSummary}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xxs font-extrabold bg-teal-600 text-white hover:bg-teal-700 shadow-2xs transition cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>⚡ Synthèse Automatique</span>
                  </button>
                  <VoiceDictationButton
                    value={form12Steps.syndromicSummary}
                    onTranscript={(text) => setForm12Steps(prev => ({ ...prev, syndromicSummary: text }))}
                    fieldName="Résumé syndromique"
                    buttonText="Dicter le résumé"
                    size="sm"
                  />
                </div>
              </div>

              {/* Relevant antecedents selection for the intro */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                    Antécédents pertinents à inclure dans l'introduction :
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const intro = buildSyndromicIntroTemplate();
                      setForm12Steps(prev => ({
                        ...prev,
                        syndromicIntro: intro,
                        syndromicSummary: syncSyndromicSummaryText(intro, prev.syndromicItems || [])
                      }));
                    }}
                    className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
                  >
                    Régénérer la phrase d'introduction type
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(
                    new Set([
                      ...(dpiAntecedentsValue.medicalAntecedents || []),
                      ...(dpiAntecedentsValue.smokingPackYears > 0 ? [`Tabagisme ${dpiAntecedentsValue.smokingPackYears} PA`] : []),
                      ...(dpiAntecedentsValue.biomassExposure ? ['Exposition à la biomasse'] : []),
                      ...(form12Steps.riskFactors.tbContact ? ['Contage tuberculeux'] : []),
                      'HTA',
                      'Diabète',
                      'Asthme',
                      'BPCO',
                      'Tuberculose antérieure'
                    ])
                  ).map(ant => {
                    const selected = (form12Steps.syndromicSelectedAntecedents || []).includes(ant);
                    return (
                      <button
                        key={ant}
                        type="button"
                        onClick={() => handleToggleSyndromicAntecedent(ant)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                          selected
                            ? 'bg-teal-600 text-white border-teal-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}{ant}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Editable intro phrase */}
              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-700 block">
                  Introduction structurée (modifiable librement) :
                </label>
                <textarea
                  rows={2}
                  value={form12Steps.syndromicIntro ?? buildSyndromicIntroTemplate()}
                  onChange={(e) => {
                    const nextIntro = e.target.value;
                    setForm12Steps(prev => ({
                      ...prev,
                      syndromicIntro: nextIntro,
                      syndromicSummary: syncSyndromicSummaryText(nextIntro, prev.syndromicItems || [])
                    }));
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              {/* Ordered list of syndromes by severity/priority */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-xxs font-extrabold uppercase text-slate-700 block">
                  Syndromes retenus (classés par ordre de gravité et de priorité clinique) :
                </span>

                {(form12Steps.syndromicItems || []).length > 0 && (
                  <div className="space-y-1.5">
                    {(form12Steps.syndromicItems || []).map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="w-6 h-6 rounded-md bg-teal-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => {
                            const updated = (form12Steps.syndromicItems || []).map(it =>
                              it.id === item.id ? { ...it, text: e.target.value } : it
                            );
                            const intro = form12Steps.syndromicIntro || buildSyndromicIntroTemplate();
                            setForm12Steps(prev => ({
                              ...prev,
                              syndromicItems: updated,
                              syndromicSummary: syncSyndromicSummaryText(intro, updated)
                            }));
                          }}
                          className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold"
                        />
                        <select
                          value={item.severity || 'MAJEUR'}
                          onChange={(e) => {
                            const updated = (form12Steps.syndromicItems || []).map(it =>
                              it.id === item.id ? { ...it, severity: e.target.value as any } : it
                            );
                            const intro = form12Steps.syndromicIntro || buildSyndromicIntroTemplate();
                            setForm12Steps(prev => ({
                              ...prev,
                              syndromicItems: updated,
                              syndromicSummary: syncSyndromicSummaryText(intro, updated)
                            }));
                          }}
                          className="text-[11px] bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold"
                        >
                          <option value="CRITIQUE">Critique</option>
                          <option value="MAJEUR">Majeur</option>
                          <option value="MODERE">Modéré</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleMoveSyndromicItem(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-slate-500 hover:text-teal-700 disabled:opacity-30 cursor-pointer"
                          title="Monter en priorité"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSyndromicItem(idx, 1)}
                          disabled={idx === (form12Steps.syndromicItems || []).length - 1}
                          className="p-1 text-slate-500 hover:text-teal-700 disabled:opacity-30 cursor-pointer"
                          title="Descendre en priorité"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSyndromicItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Supprimer ce syndrome"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSyndromeText}
                    onChange={(e) => setNewSyndromeText(e.target.value)}
                    placeholder="Ex: Syndrome de condensation pulmonaire fébrile..."
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                  <select
                    value={newSyndromeSeverity}
                    onChange={(e) => setNewSyndromeSeverity(e.target.value as any)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-bold"
                  >
                    <option value="CRITIQUE">Critique</option>
                    <option value="MAJEUR">Majeur</option>
                    <option value="MODERE">Modéré</option>
                  </select>
                  <VoiceDictationButton
                    value={newSyndromeText}
                    onTranscript={(t) => setNewSyndromeText(t)}
                    fieldName="Nouveau syndrome"
                    buttonText="Dicter"
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSyndromicItem()}
                    className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>

              {/* Final editable summary text */}
              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-700 block">
                  Texte complet du Résumé Syndromique (utilisé dans l'observation et l'impression) :
                </label>
                <textarea
                  rows={4}
                  value={form12Steps.syndromicSummary}
                  onChange={(e) => setForm12Steps({ ...form12Steps, syndromicSummary: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-teal-600 leading-relaxed font-bold text-teal-950"
                />
              </div>
            </div>
          )}

          {/* STEP 8: HYPOTHÈSES DIAGNOSTIQUES + SCORES CONTEXTUELS */}
          {(activeStepTab === 8 || viewMode === 'CONTINUOUS_SHEET') && (
            <div id="step-8" className={`space-y-4 ${viewMode === 'CONTINUOUS_SHEET' ? 'pt-4 border-b border-slate-200 pb-6' : ''}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800">
                  8) Hypothèses Diagnostiques Évoquées
                </h3>
                <span className="text-xxs text-slate-400">Classées par probabilité décroissante</span>
              </div>

              {/* Quick Pneumology Differential Hypotheses Chips */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  ⚡ Hypothèses fréquentes en pneumologie (1 clic) :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '1. Tuberculose pulmonaire active bactériologique (1B10.0)',
                    '2. Pneumopathie bactérienne franche lobaire aiguë PAC (CA20)',
                    '3. Exacerbation aiguë de BPCO infectieuse (CA22.0)',
                    '4. Crise d\'asthme aiguë paroxystique (CA23.3)',
                    '5. Embolie pulmonaire de probabilité intermédiaire (CB00)',
                    '6. Pleurésie séro-fibrineuse infectieuse ou tuberculeuse (CB41)',
                    '7. Sepsis / Détresse respiratoire aiguë sévère'
                  ].map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        if (!form12Steps.diagnosticHypotheses.includes(item)) {
                          setForm12Steps(prev => ({
                            ...prev,
                            diagnosticHypotheses: [...prev.diagnosticHypotheses, item]
                          }));
                        }
                      }}
                      className="text-[10px] bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 transition cursor-pointer"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {form12Steps.diagnosticHypotheses.map((hyp, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={hyp}
                      onChange={(e) => {
                        const updated = [...form12Steps.diagnosticHypotheses];
                        updated[i] = e.target.value;
                        setForm12Steps({ ...form12Steps, diagnosticHypotheses: updated });
                      }}
                      className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form12Steps.diagnosticHypotheses.filter((_, idx) => idx !== i);
                        setForm12Steps({ ...form12Steps, diagnosticHypotheses: updated });
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setForm12Steps({
                    ...form12Steps,
                    diagnosticHypotheses: [...form12Steps.diagnosticHypotheses, `${form12Steps.diagnosticHypotheses.length + 1}. Nouvelle hypothèse clinique`]
                  })}
                  className="inline-flex items-center gap-1.5 text-xs text-teal-700 font-bold hover:underline cursor-pointer pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une hypothèse</span>
                </button>
              </div>

              {/* Contextual Clinical Scores suggested right after Hypotheses */}
              {renderContextualClinicalScores()}
            </div>
          )}

          {/* STEP 9: EXPLORATIONS COMPLÉMENTAIRES A-F + RÉSULTATS & PIÈCES JOINTES */}
          {(activeStepTab === 9 || viewMode === 'CONTINUOUS_SHEET') && (
            <div id="step-9" className={`space-y-4 ${viewMode === 'CONTINUOUS_SHEET' ? 'pt-4 border-b border-slate-200 pb-6' : ''}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    9) Explorations Complémentaires (Catégories A à F)
                  </h3>
                  <p className="text-xxs text-slate-500">
                    Prescription structurée, statuts (Prescrit / En attente / Réalisé), résultats avec dictée vocale, pièces jointes Photo/PDF/DICOM et spirométrie structurée
                  </p>
                </div>
              </div>

              {/* Explorations récentes du patient (Module Explorations) */}
              {patientExplorations.length > 0 && (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-blue-900 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                    <span>Explorations déjà enregistrées dans le dossier ({patientExplorations.length}) :</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {patientExplorations.slice(0, 6).map(exp => (
                      <span key={exp.id} className="text-[10px] bg-white border border-blue-200 px-2 py-1 rounded-lg text-slate-700">
                        <strong>{exp.title}</strong> ({exp.date}) — <span className="font-bold text-blue-800">{exp.simpleStatus || exp.status}</span>
                        {exp.narrativeReport ? ` : ${exp.narrativeReport.slice(0, 45)}...` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Packs / Checkboxes preserved */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { key: 'geneXpertBK', label: 'GeneXpert MTB/RIF', tag: 'PNT' },
                  { key: 'chestXray', label: 'Radio Thorax F/P', tag: 'Imagerie' },
                  { key: 'bloodGas', label: 'Gaz du sang', tag: 'Biologie' },
                  { key: 'nfsCrp', label: 'NFS + CRP', tag: 'Biologie' },
                  { key: 'chestCT', label: 'Scanner TDM-HR', tag: 'Imagerie' },
                  { key: 'spirometry', label: 'EFR / Spirométrie', tag: 'EFR' },
                  { key: 'pleuralPuncture', label: 'Ponction Pleurale', tag: 'Microbio' }
                ].map(item => (
                  <label key={item.key} className="flex items-start gap-2 p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={Boolean((form12Steps.paraclinicalOrdered as any)[item.key])}
                      onChange={(e) => setForm12Steps({
                        ...form12Steps,
                        paraclinicalOrdered: {
                          ...form12Steps.paraclinicalOrdered,
                          [item.key]: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-teal-600 rounded mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-[11px] text-slate-800 block">{item.label}</span>
                      <span className="text-[10px] text-teal-700 font-mono font-semibold">{item.tag}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* A-F Categorized Catalog Selector */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {PARACLINICAL_CATALOG.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedMacroCat(cat.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        selectedMacroCat === cat.id
                          ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50'
                      }`}
                    >
                      {cat.letter}. {cat.label}
                    </button>
                  ))}
                </div>

                {(() => {
                  const activeCat = PARACLINICAL_CATALOG.find(c => c.id === selectedMacroCat) || PARACLINICAL_CATALOG[0];
                  return (
                    <div className="space-y-2.5">
                      {activeCat.subCategories.map(sub => (
                        <div key={sub.id} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase text-slate-500 block">{sub.label}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {sub.exams.map(exName => (
                              <button
                                key={exName}
                                type="button"
                                onClick={() => handleAddDetailedExam(activeCat.id, sub.label, exName)}
                                className="text-[11px] px-2.5 py-1 bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 rounded-md font-medium transition cursor-pointer"
                              >
                                + {exName}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customExamName}
                          onChange={(e) => setCustomExamName(e.target.value)}
                          placeholder={`Ajouter un examen libre dans ${activeCat.label}...`}
                          className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!customExamName.trim()) return;
                            handleAddDetailedExam(
                              activeCat.id,
                              activeCat.subCategories[0]?.label || 'Autres',
                              customExamName.trim()
                            );
                            setCustomExamName('');
                          }}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          + Ajouter
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Detailed Prescribed Exams Cards */}
              {(form12Steps.paraclinicalOrdered.orderedExamsDetailed || []).length > 0 && (
                <div className="space-y-3">
                  <span className="text-xxs font-extrabold uppercase text-slate-700 block">
                    Examens prescrits & résultats saisis ({form12Steps.paraclinicalOrdered.orderedExamsDetailed?.length}) :
                  </span>
                  {(form12Steps.paraclinicalOrdered.orderedExamsDetailed || []).map(exam => {
                    const isSpiro =
                      exam.macroCategory === 'EFR' ||
                      /spirom|efr/i.test(exam.examName);
                    const computedGainMl =
                      exam.spirometryData?.vemsPreL && exam.spirometryData?.vemsPostL
                        ? Math.round((exam.spirometryData.vemsPostL - exam.spirometryData.vemsPreL) * 1000)
                        : exam.spirometryData?.gainMl;
                    const vemsGain =
                      exam.spirometryData?.vemsPreL && exam.spirometryData?.vemsPostL
                        ? Number((((exam.spirometryData.vemsPostL - exam.spirometryData.vemsPreL) / exam.spirometryData.vemsPreL) * 100).toFixed(1))
                        : exam.spirometryData?.gainPct;

                    const updateSpiroField = (patch: Partial<NonNullable<typeof exam.spirometryData>>) => {
                      const nextSpiro = { ...exam.spirometryData, ...patch };
                      if (nextSpiro.vemsPreL && nextSpiro.vemsPostL) {
                        nextSpiro.gainMl = Math.round((nextSpiro.vemsPostL - nextSpiro.vemsPreL) * 1000);
                        nextSpiro.gainPct = Number((((nextSpiro.vemsPostL - nextSpiro.vemsPreL) / nextSpiro.vemsPreL) * 100).toFixed(1));
                      }
                      handleUpdateDetailedExam(exam.id, { spirometryData: nextSpiro });
                    };

                    return (
                      <div key={exam.id} className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-teal-700">
                              {exam.macroCategory} • {exam.subCategory}
                            </span>
                            <h4 className="text-xs font-black text-slate-900">{exam.examName}</h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={exam.status}
                              onChange={(e) => handleUpdateDetailedExam(exam.id, { status: e.target.value as any })}
                              className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold"
                            >
                              <option value="PRESCRIT">Prescrit</option>
                              <option value="EN_ATTENTE">En attente</option>
                              <option value="REALISE">Réalisé</option>
                            </select>
                            <input
                              type="date"
                              value={exam.prescribedDate || ''}
                              onChange={(e) => handleUpdateDetailedExam(exam.id, { prescribedDate: e.target.value })}
                              title="Date de prescription"
                              className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono"
                            />
                            <input
                              type="date"
                              value={exam.realizedDate || ''}
                              onChange={(e) => handleUpdateDetailedExam(exam.id, { realizedDate: e.target.value })}
                              title="Date de réalisation"
                              className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveDetailedExam(exam.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Retirer cet examen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Results text + dictation */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-600">Compte-rendu / Résultats saisis :</label>
                            <VoiceDictationButton
                              value={exam.resultsText || ''}
                              onTranscript={(t) => handleUpdateDetailedExam(exam.id, { resultsText: t, status: 'REALISE' })}
                              fieldName={`Résultat ${exam.examName}`}
                              buttonText="Dicter le résultat"
                              size="sm"
                              appendMode={true}
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={exam.resultsText || ''}
                            onChange={(e) => handleUpdateDetailedExam(exam.id, { resultsText: e.target.value })}
                            placeholder="Saisir ou dicter les résultats de l'examen..."
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                          />
                        </div>

                        {/* Structured Spirometry fields aligned with SpirometryStructuredData */}
                        {isSpiro && (
                          <div className="p-2.5 bg-teal-50/50 rounded-lg border border-teal-200 space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="text-[10px] font-extrabold uppercase text-teal-900">
                                Paramètres Spirométriques Structurés (Pré / Post-BD)
                              </span>
                              {vemsGain !== undefined && (
                                <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-teal-200 text-teal-800 tabular-nums">
                                  Réversibilité VEMS : {vemsGain > 0 ? `+${vemsGain}%` : `${vemsGain}%`}
                                  {computedGainMl !== undefined ? ` (${computedGainMl > 0 ? `+${computedGainMl}` : computedGainMl} mL)` : ''}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                              <div>
                                <label className="text-[10px] text-slate-600 block">VEMS pré (L)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={exam.spirometryData?.vemsPreL ?? ''}
                                  onChange={(e) => updateSpiroField({ vemsPreL: e.target.value === '' ? undefined : Number(e.target.value) })}
                                  className="w-full bg-white border border-slate-200 rounded p-1 font-mono tabular-nums"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-600 block">VEMS pré (%)</label>
                                <input
                                  type="number"
                                  value={exam.spirometryData?.vemsPrePct ?? ''}
                                  onChange={(e) => updateSpiroField({ vemsPrePct: e.target.value === '' ? undefined : Number(e.target.value) })}
                                  className="w-full bg-white border border-slate-200 rounded p-1 font-mono tabular-nums"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-600 block">CVF pré (L)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={exam.spirometryData?.cvfPreL ?? ''}
                                  onChange={(e) => updateSpiroField({ cvfPreL: e.target.value === '' ? undefined : Number(e.target.value) })}
                                  className="w-full bg-white border border-slate-200 rounded p-1 font-mono tabular-nums"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-600 block">VEMS/CVF pré (%)</label>
                                <input
                                  type="number"
                                  value={exam.spirometryData?.tiffeneauPre ?? ''}
                                  onChange={(e) => updateSpiroField({ tiffeneauPre: e.target.value === '' ? undefined : Number(e.target.value) })}
                                  className="w-full bg-white border border-slate-200 rounded p-1 font-mono tabular-nums"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-600 block">VEMS post-BD (L)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={exam.spirometryData?.vemsPostL ?? ''}
                                  onChange={(e) => updateSpiroField({ vemsPostL: e.target.value === '' ? undefined : Number(e.target.value) })}
                                  className="w-full bg-white border border-slate-200 rounded p-1 font-mono tabular-nums"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-600 block">VEMS post-BD (%)</label>
                                <input
                                  type="number"
                                  value={exam.spirometryData?.vemsPostPct ?? ''}
                                  onChange={(e) => updateSpiroField({ vemsPostPct: e.target.value === '' ? undefined : Number(e.target.value) })}
                                  className="w-full bg-white border border-slate-200 rounded p-1 font-mono tabular-nums"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-600 block">CVF post-BD (L)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={exam.spirometryData?.cvfPostL ?? ''}
                                  onChange={(e) => updateSpiroField({ cvfPostL: e.target.value === '' ? undefined : Number(e.target.value) })}
                                  className="w-full bg-white border border-slate-200 rounded p-1 font-mono tabular-nums"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-600 block">VEMS/CVF post (%)</label>
                                <input
                                  type="number"
                                  value={exam.spirometryData?.tiffeneauPost ?? ''}
                                  onChange={(e) => updateSpiroField({ tiffeneauPost: e.target.value === '' ? undefined : Number(e.target.value) })}
                                  className="w-full bg-white border border-slate-200 rounded p-1 font-mono tabular-nums"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Attachment Upload (Photo / PDF / DICOM) & Follow-up entries */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-semibold">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Joindre Photo / PDF / DICOM</span>
                            <input
                              type="file"
                              accept="image/*,.pdf,.dcm,.dicom"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleExamAttachmentUpload(exam.id, file);
                              }}
                            />
                          </label>

                          {exam.attachmentName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md font-medium">
                              <Paperclip className="w-3 h-3" />
                              <span>{exam.attachmentName} ({exam.attachmentType})</span>
                            </span>
                          )}
                        </div>

                        {/* Multiple Follow-up results */}
                        <div className="space-y-1.5 pt-1">
                          {(exam.followUpEntries || []).map(fu => (
                            <div key={fu.id} className="text-[11px] bg-slate-50 px-2.5 py-1 rounded border border-slate-200 flex items-center justify-between">
                              <span>
                                <strong className="font-mono text-slate-600">{fu.date}</strong> : {fu.summary}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={newFollowUpInputs[exam.id] || ''}
                              onChange={(e) => setNewFollowUpInputs(prev => ({ ...prev, [exam.id]: e.target.value }))}
                              placeholder="Ajouter un résultat de contrôle ultérieur..."
                              className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const txt = (newFollowUpInputs[exam.id] || '').trim();
                                if (!txt) return;
                                const nextFu = [
                                  ...(exam.followUpEntries || []),
                                  {
                                    id: `fu-${Date.now()}`,
                                    date: new Date().toISOString().split('T')[0],
                                    summary: txt
                                  }
                                ];
                                handleUpdateDetailedExam(exam.id, { followUpEntries: nextFu });
                                setNewFollowUpInputs(prev => ({ ...prev, [exam.id]: '' }));
                              }}
                              className="text-[11px] px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer"
                            >
                              + Suivi
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="text-xxs font-bold text-slate-600 block mb-1">
                  Indications cliniques et précisions complémentaires pour les explorations
                </label>
                <textarea
                  rows={2}
                  value={form12Steps.paraclinicalOrdered.otherNotes || ''}
                  onChange={(e) => setForm12Steps({
                    ...form12Steps,
                    paraclinicalOrdered: {
                      ...form12Steps.paraclinicalOrdered,
                      otherNotes: e.target.value
                    }
                  })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>
            </div>
          )}

          {/* STEP 10: DIAGNOSTICS RETENUS AVEC CIM-11 & STATUTS (Section 5) */}
          {(activeStepTab === 10 || viewMode === 'CONTINUOUS_SHEET') && (
            <div id="step-10" className={`space-y-4 ${viewMode === 'CONTINUOUS_SHEET' ? 'pt-4 border-b border-slate-200 pb-6' : ''}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    10) Diagnostics Retenus & Codification CIM-11
                  </h3>
                  <p className="text-xxs text-slate-500">
                    Multi-diagnostics avec typage (Principal, Associé, Complication, Chronique) et statut longitudinal
                  </p>
                </div>
              </div>

              {/* Active Diagnoses Cards */}
              <div className="space-y-2.5">
                {form12Steps.diagnoses.map((diag, index) => (
                  <div key={diag.id || index} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-teal-600 text-white font-mono font-bold text-xxs">
                          CIM-11: {diag.codeCIM11}
                        </span>
                        <span className="font-bold text-slate-900">{diag.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDiagnosis(diag.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Retirer ce diagnostic"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">TYPE DIAGNOSTIC :</span>
                        <select
                          value={diag.type}
                          onChange={(e) => handleUpdateDiagnosisProperty(diag.id, 'type', e.target.value)}
                          className="w-full text-xxs bg-white border border-slate-200 rounded-lg p-1.5 font-bold text-slate-700"
                        >
                          <option value="PRINCIPAL">PRINCIPAL (Motif majeur)</option>
                          <option value="ASSOCIE">ASSOCIÉ (Affections actives)</option>
                          <option value="COMPLICATION">COMPLICATION (Événement lié)</option>
                          <option value="CHRONIQUE_ANTECEDENT">CHRONIQUE / ANTÉCÉDENT</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">STATUT LONGITUDINAL :</span>
                        <select
                          value={diag.status}
                          onChange={(e) => handleUpdateDiagnosisProperty(diag.id, 'status', e.target.value)}
                          className="w-full text-xxs bg-white border border-slate-200 rounded-lg p-1.5 font-bold text-slate-700"
                        >
                          <option value="CONFIRME">CONFIRMÉ (Prouvé)</option>
                          <option value="SUSPECTE">SUSPECTÉ (À étayer)</option>
                          <option value="CHRONIQUE">CHRONIQUE (Suivi au long cours)</option>
                          <option value="RESOLU">RÉSOLU (Guéri)</option>
                          <option value="ECARTE">ÉCARTÉ</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Diagnosis from CIM-11 Search */}
              <div className="p-4 bg-teal-50/40 rounded-xl border border-teal-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xxs font-black uppercase text-teal-900 tracking-wider">
                    Catalogue CIM-11 Pneumologie & Pathologies associées
                  </span>
                  <select
                    value={selectedCimCategory}
                    onChange={(e) => setSelectedCimCategory(e.target.value)}
                    className="text-xxs bg-white border border-teal-200 rounded-lg px-2 py-1 text-teal-900 font-bold cursor-pointer"
                  >
                    <option value="TOUS">Toutes catégories</option>
                    <option value="Tuberculose">Tuberculose</option>
                    <option value="BPCO">BPCO</option>
                    <option value="Asthme">Asthme</option>
                    <option value="Infectiologie">Infectiologie / Pneumonie</option>
                    <option value="Plèvre">Plèvre</option>
                    <option value="Vasculaire">Vasculaire</option>
                    <option value="Comorbidité">Comorbidités</option>
                  </select>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={cim11Query}
                    onChange={(e) => setCim11Query(e.target.value)}
                    placeholder="Rechercher par code (ex: 1B10) ou intitulé (ex: Asthme, BPCO, Pneumonie)..."
                    className="w-full text-xs bg-white border border-teal-200 rounded-xl p-2.5 pl-8 focus:outline-teal-600 font-medium"
                  />
                  <Search className="w-3.5 h-3.5 text-teal-600 absolute left-2.5 top-3.5" />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-teal-100">
                  {filteredCimList.map(item => (
                    <div
                      key={item.code}
                      onClick={() => handleAddCimDiagnosis(item)}
                      className="pt-1.5 pb-1.5 flex items-center justify-between hover:bg-teal-100/60 p-2 rounded-lg cursor-pointer transition"
                    >
                      <div>
                        <span className="font-mono text-xxs font-bold text-teal-800 bg-white px-1.5 py-0.5 rounded border border-teal-200 mr-2">
                          {item.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-teal-700 font-bold shrink-0">+ Ajouter</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contextual Clinical Scores suggested according to Retained Diagnoses */}
              {renderContextualClinicalScores()}
            </div>
          )}

          {/* STEP 11: CONDUITE À TENIR, ORDONNANCE & ANTIBIOGOUVERNANCE */}
          {(activeStepTab === 11 || viewMode === 'CONTINUOUS_SHEET') && (
            <div id="step-11" className={`space-y-4 ${viewMode === 'CONTINUOUS_SHEET' ? 'pt-4 border-b border-slate-200 pb-6' : ''}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800">
                  11) Conduite à Tenir, Ordonnance & Antibiogouvernance
                </h3>
                <VoiceDictationButton
                  value={form12Steps.managementPlan.medicationsPrescribed}
                  onTranscript={(text) => setForm12Steps(prev => ({
                    ...prev,
                    managementPlan: { ...prev.managementPlan, medicationsPrescribed: text }
                  }))}
                  fieldName="Prescriptions et ordonnance"
                  buttonText="Dicter l'ordonnance"
                  size="sm"
                />
              </div>

              {/* Protocol quick-fill pills */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xxs font-bold text-slate-400 uppercase py-1">Protocoles types :</span>
                {Object.entries(PRESCRIPTION_TEMPLATES).map(([key, proto]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm12Steps({
                      ...form12Steps,
                      managementPlan: {
                        ...form12Steps.managementPlan,
                        medicationsPrescribed: proto.text
                      }
                    })}
                    className="text-xxs font-bold px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 rounded-lg border border-slate-200 cursor-pointer transition"
                  >
                    {proto.title}
                  </button>
                ))}
              </div>

              {/* Calculateur Posologique PNT Sénégal 2RHZE */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                      TB
                    </span>
                    <div>
                      <span className="text-xs font-black text-emerald-950 block">
                        Calculateur Posologique 2RHZE (Directives PNT Sénégal)
                      </span>
                      <span className="text-3xs text-emerald-700">
                        Poids actuel : <strong>{form12Steps.vitals.weight || 55} kg</strong> &bull; Tranche de poids : {pntDosage.range}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-white px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-900 shadow-2xs">
                      {pntDosage.tablets} comprimés / jour de 2RHZE
                    </span>
                    <button
                      type="button"
                      onClick={handleInsertPntRhze}
                      className="text-xxs font-black px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      <span>+ Insérer Schéma 2RHZE PNT</span>
                    </button>
                  </div>
                </div>
                <div className="text-xxs text-emerald-800 bg-white/80 p-2 rounded-lg border border-emerald-200/60 flex items-center justify-between flex-wrap gap-1">
                  <span><strong>Formule FDC :</strong> Rifampicine 150mg + Isoniazide 75mg + Pyrazinamide 400mg + Éthambutol 275mg (1 prise matinale unique à jeun).</span>
                  <span className="font-bold text-emerald-950 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">{pntDosage.b6}</span>
                </div>
              </div>

              {/* Formulaire Hospitalier Instantané CHREIN */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-xxs font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-600" />
                    <span>Formulaire Médicamenteux Hospitalier (Pneumologie CHREIN)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Cliquez sur "+ Ajouter" pour insérer directement la posologie
                  </span>
                </div>

                {/* Category tabs */}
                <div className="flex flex-wrap gap-1">
                  {PNEUMO_DRUG_FORMULARY.map(cat => (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => setSelectedDrugCategory(cat.category)}
                      className={`text-xxs font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        selectedDrugCategory === cat.category
                          ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {cat.category}
                    </button>
                  ))}
                </div>

                {/* Drugs in selected category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                  {PNEUMO_DRUG_FORMULARY.find(c => c.category === selectedDrugCategory)?.items.map((item, idx) => (
                    <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{item.posology}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAppendPrescription(item.name, item.posology)}
                        className="text-xxs font-bold px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md shrink-0 transition cursor-pointer"
                      >
                        + Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1">
                  Ordonnance Médicale Détaillée (Médicaments, posologies, durées, précautions)
                </label>
                <textarea
                  rows={6}
                  value={form12Steps.managementPlan.medicationsPrescribed}
                  onChange={(e) => setForm12Steps({
                    ...form12Steps,
                    managementPlan: {
                      ...form12Steps.managementPlan,
                      medicationsPrescribed: e.target.value
                    }
                  })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono leading-relaxed"
                />
              </div>

              {/* Fiche d'Antibiogouvernance (Section 8) */}
              <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xxs font-extrabold uppercase text-teal-900 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>Fiche de Bon Usage des Antibiotiques (Stewardship)</span>
                  </span>
                  <span className="text-[10px] text-teal-700 font-bold">Réévaluation obligatoire à 48-72h</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-xxs font-bold text-slate-600 block mb-0.5">Molécule prescrite</label>
                    <input
                      type="text"
                      value={form12Steps.managementPlan.antibioticStewardship?.molecule || ''}
                      onChange={(e) => setForm12Steps({
                        ...form12Steps,
                        managementPlan: {
                          ...form12Steps.managementPlan,
                          antibioticStewardship: {
                            ...form12Steps.managementPlan.antibioticStewardship!,
                            molecule: e.target.value
                          }
                        }
                      })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xxs font-bold text-slate-600 block mb-0.5">Durée prévue (jours)</label>
                    <input
                      type="number"
                      value={form12Steps.managementPlan.antibioticStewardship?.durationDays || 7}
                      onChange={(e) => setForm12Steps({
                        ...form12Steps,
                        managementPlan: {
                          ...form12Steps.managementPlan,
                          antibioticStewardship: {
                            ...form12Steps.managementPlan.antibioticStewardship!,
                            durationDays: Number(e.target.value)
                          }
                        }
                      })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 12: ÉVOLUTION ET SUIVI */}
          {(activeStepTab === 12 || viewMode === 'CONTINUOUS_SHEET') && (
            <div id="step-12" className={`space-y-4 ${viewMode === 'CONTINUOUS_SHEET' ? 'pt-4 pb-4' : ''}`}>
              <h3 className="text-sm font-black text-slate-800 pb-2 border-b border-slate-100">
                12) Évolution, Orientation & Calendrier de Suivi
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-xxs font-bold text-slate-700 block mb-1">Orientation clinique du patient *</label>
                  <select
                    value={form12Steps.managementPlan.orientation}
                    onChange={(e) => setForm12Steps({
                      ...form12Steps,
                      managementPlan: { ...form12Steps.managementPlan, orientation: e.target.value as any }
                    })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  >
                    <option value="AMBULATOIRE">Prise en charge ambulatoire (Domicile)</option>
                    <option value="HOSPITALISATION">Hospitalisation CHREIN (Service Pneumologie)</option>
                    <option value="TRANSFERT">Transfert spécialisé (Réanimation / Chirurgie thoracique)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xxs font-bold text-slate-700 block mb-1">Date du prochain rendez-vous de suivi</label>
                  <input
                    type="date"
                    value={form12Steps.followUp.nextAppointmentDate}
                    onChange={(e) => setForm12Steps({
                      ...form12Steps,
                      followUp: { ...form12Steps.followUp, nextAppointmentDate: e.target.value }
                    })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1">
                  Signes d'alerte et consignes communiqués au patient
                </label>
                <input
                  type="text"
                  value={form12Steps.followUp.keyWarningSigns}
                  onChange={(e) => setForm12Steps({
                    ...form12Steps,
                    followUp: { ...form12Steps.followUp, keyWarningSigns: e.target.value }
                  })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1">
                  Notes de suivi et examens prévus au prochain contrôle
                </label>
                <textarea
                  rows={2}
                  value={form12Steps.followUp.notes || ''}
                  onChange={(e) => setForm12Steps({
                    ...form12Steps,
                    followUp: { ...form12Steps.followUp, notes: e.target.value }
                  })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
            </div>
          )}

          {/* Stepper Footer Navigation */}
          {viewMode === 'STEP_BY_STEP' ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 mt-6 border-t border-slate-200 bg-slate-50/80 -mx-6 -mb-6 p-4 sm:p-5 rounded-b-2xl">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStepTab(prev => Math.max(1, prev - 1))}
                  disabled={activeStepTab === 1}
                  title="Étape précédente (Alt+←)"
                  className="px-3.5 sm:px-4 py-2 border border-slate-300 bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer flex items-center gap-1.5 shadow-2xs transition whitespace-nowrap"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Précédent</span>
                </button>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xxs font-mono text-slate-600 tabular-nums">
                  <span className="font-black text-teal-800">Étape {activeStepTab}/12</span>
                  <span>•</span>
                  <span className="text-slate-600 font-medium font-sans">
                    {CLINICAL_PHASES.find(p => p.steps.includes(activeStepTab))?.shortTitle}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeStepTab < 12 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStepTab(prev => Math.min(12, prev + 1))}
                    title="Étape suivante (Alt+→)"
                    className="px-4 sm:px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <span>Étape suivante</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveConsultation}
                    title="Clôturer et enregistrer la consultation (Ctrl+S)"
                    className="px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terminer &amp; Archiver (12/12)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 mt-6 border-t border-slate-200 bg-slate-50/80 -mx-6 -mb-6 p-4 sm:p-5 rounded-b-2xl">
              <a
                href="#step-1"
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                ↑ Retour en haut (Étape 1)
              </a>
              <button
                type="button"
                onClick={handleSaveConsultation}
                title="Enregistrer la fiche complète (Ctrl+S)"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Save className="w-4 h-4" />
                <span>Valider et Archiver la Fiche Complète (12 Étapes)</span>
              </button>
            </div>
          )}
        </div>
      )}

        {/* Docked AI Assistant & Dossier Column (rendered when dockAiPanel is enabled) */}
        {dockAiPanel && (
          <div className="lg:col-span-3 xl:col-span-3 space-y-4">
            {/* AI Medical Assistant Card (Section 10) */}
            <div className="bg-gradient-to-br from-teal-50/80 to-blue-50/50 p-4 rounded-2xl border border-teal-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xxs font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Assistance IA (Sec. 10)</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDockAiPanel(false)}
                    title="Détacher en tiroir flottant"
                    className="p-1 rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 transition cursor-pointer"
                  >
                    <PinOff className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleTriggerAiAssistance}
                    disabled={isAiLoading}
                    className="text-3xs px-2.5 py-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isAiLoading ? '...' : 'Actualiser'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {/* Reformulated clinical synthesis */}
                <div className="p-3 bg-white/95 rounded-xl border border-teal-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-xxs text-teal-900 font-extrabold uppercase block">
                      Synthèse Reformulée
                    </strong>
                    <button
                      onClick={() => setForm12Steps(prev => ({ ...prev, syndromicSummary: aiSuggestions.summary || prev.syndromicSummary }))}
                      className="text-[10px] text-teal-700 hover:underline font-bold"
                    >
                      Utiliser
                    </button>
                  </div>
                  <p className="text-xxs text-slate-700 leading-relaxed">
                    {aiSuggestions.summary}
                  </p>
                </div>

                {/* Hypotheses */}
                <div className="p-3 bg-white/95 rounded-xl border border-teal-100 space-y-1">
                  <strong className="text-xxs text-teal-900 font-extrabold uppercase block">
                    Hypothèses Diagnostiques
                  </strong>
                  <ul className="text-xxs text-slate-700 space-y-1 list-disc pl-4">
                    {aiSuggestions.hypotheses?.map((h, idx) => (
                      <li key={idx} className="flex items-center justify-between">
                        <span className="truncate">{h}</span>
                        <button
                          onClick={() => {
                            if (!form12Steps.diagnosticHypotheses.includes(h)) {
                              setForm12Steps(prev => ({
                                ...prev,
                                diagnosticHypotheses: [...prev.diagnosticHypotheses, h]
                              }));
                            }
                          }}
                          className="text-[9px] text-teal-700 font-bold hover:underline shrink-0 ml-1"
                        >
                          + Ajouter
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing critical items */}
                {(aiSuggestions.missingFields || []).length > 0 && (
                  <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 space-y-1">
                    <strong className="text-xxs text-amber-900 font-extrabold uppercase block flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Données à vérifier</span>
                    </strong>
                    <ul className="text-xxs text-amber-800 space-y-0.5 list-disc pl-4">
                      {aiSuggestions.missingFields?.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Antibiotic stewardship advice */}
                {aiSuggestions.antibioticGuidance && (
                  <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 text-xxs text-blue-900">
                    <span className="font-bold block uppercase text-[9px] text-blue-950 mb-0.5">Antibiogouvernance :</span>
                    {aiSuggestions.antibioticGuidance}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Consultation Summary Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Aperçu du Dossier</span>
              </h4>

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-xxs space-y-1.5 font-mono">
                <div className="text-center border-b pb-1">
                  <strong className="block text-slate-900 font-bold">CHREIN KAOLACK</strong>
                  <span className="text-slate-500 text-[10px]">Pneumologie & Maladies Infectieuses</span>
                </div>
                <div className="space-y-0.5 text-slate-700 font-sans">
                  <p><strong>Patient :</strong> {selectedPatient?.firstName} {selectedPatient?.lastName}</p>
                  <p><strong>N° IP :</strong> {selectedPatient?.code}</p>
                  <p><strong>Diagnostics :</strong> {form12Steps.diagnoses.map(d => d.codeCIM11).join(', ') || 'En cours'}</p>
                  <p><strong>Orientation :</strong> {form12Steps.managementPlan.orientation}</p>
                </div>
              </div>

              <button
                onClick={() => setShowPrintModal(true)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer l'Observation</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SLIDE-OVER DRAWER: ASSISTANCE IA MÉDICALE CHREIN */}
      {showAiDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto border-l border-slate-200 flex flex-col">
            {/* Drawer Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-teal-950 text-white flex items-center justify-between border-b border-teal-900 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
                    <span>Assistance IA Médicale</span>
                    <span className="px-1.5 py-0.5 text-3xs font-mono font-bold bg-teal-500/30 text-teal-200 rounded border border-teal-400/30">
                      CHREIN
                    </span>
                  </h3>
                  <p className="text-xxs text-teal-300/80">
                    Aide diagnostique & antibiogouvernance (Section 10)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDockAiPanel(!dockAiPanel);
                    setShowAiDrawer(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-teal-200 text-xxs font-bold flex items-center gap-1 cursor-pointer transition"
                  title={dockAiPanel ? "Détacher l'assistant" : "Épingler l'assistant sur l'écran"}
                >
                  {dockAiPanel ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                  <span>{dockAiPanel ? 'Détacher' : 'Épingler'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiDrawer(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-5 space-y-4 flex-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xxs text-slate-500 italic">
                  « Le praticien contrôle, corrige et valide ; aucune modification autonome par l'IA. »
                </span>
                <button
                  onClick={handleTriggerAiAssistance}
                  disabled={isAiLoading}
                  className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xxs transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isAiLoading ? 'Analyse en cours...' : 'Rafraîchir les suggestions'}</span>
                </button>
              </div>

              {/* Reformulated clinical synthesis */}
              <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-teal-950 font-black uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-700" />
                    <span>Synthèse Clinique Reformulée</span>
                  </strong>
                  <button
                    onClick={() => {
                      setForm12Steps(prev => ({ ...prev, syndromicSummary: aiSuggestions.summary || prev.syndromicSummary }));
                      setShowAiDrawer(false);
                    }}
                    className="text-xxs px-2 py-0.5 rounded-md bg-teal-600 text-white hover:bg-teal-700 font-bold transition shadow-2xs cursor-pointer"
                  >
                    Appliquer en résumé (Étape 7)
                  </button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-teal-100">
                  {aiSuggestions.summary || "En attente des données d'anamnèse et d'examen physique pour formuler la synthèse."}
                </p>
              </div>

              {/* Hypotheses */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <strong className="text-xs text-slate-900 font-black uppercase tracking-wide flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  <span>Hypothèses Diagnostiques Suggérées</span>
                </strong>
                <div className="space-y-1.5">
                  {aiSuggestions.hypotheses?.map((h, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-800">{h}</span>
                      <button
                        onClick={() => {
                          if (!form12Steps.diagnosticHypotheses.includes(h)) {
                            setForm12Steps(prev => ({
                              ...prev,
                              diagnosticHypotheses: [...prev.diagnosticHypotheses, h]
                            }));
                          }
                        }}
                        className="text-xxs px-2 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded font-bold cursor-pointer transition"
                      >
                        + Ajouter à l'étape 8
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing critical items */}
              {(aiSuggestions.missingFields || []).length > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <strong className="text-xs text-amber-950 font-black uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Paramètres Critiques Manquants</span>
                  </strong>
                  <ul className="text-xs text-amber-900 space-y-1 list-disc pl-5">
                    {aiSuggestions.missingFields?.map((m, idx) => (
                      <li key={idx} className="font-medium">{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Antibiotic stewardship advice */}
              {aiSuggestions.antibioticGuidance && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                  <strong className="text-xs text-blue-950 font-black uppercase tracking-wide flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-blue-600" />
                    <span>Recommandations Antibiogouvernance</span>
                  </strong>
                  <p className="text-xs text-blue-900 bg-white p-3 rounded-lg border border-blue-100 font-medium">
                    {aiSuggestions.antibioticGuidance}
                  </p>
                </div>
              )}

              {/* Quick Summary Preview */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-slate-900 font-bold uppercase tracking-wide">
                    Aperçu Impression
                  </strong>
                  <button
                    onClick={() => {
                      setShowAiDrawer(false);
                      setShowPrintModal(true);
                    }}
                    className="text-xxs font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Ouvrir l'impression</span>
                  </button>
                </div>
                <div className="text-xxs font-mono bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                  <p><strong>Patient :</strong> {selectedPatient?.firstName} {selectedPatient?.lastName}</p>
                  <p><strong>Orientation :</strong> {form12Steps.managementPlan.orientation}</p>
                  <p><strong>Diagnostics retenus :</strong> {form12Steps.diagnoses.map(d => d.codeCIM11).join(', ') || 'En cours'}</p>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowAiDrawer(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 cursor-pointer shadow-2xs"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAiDrawer(false);
                  setShowPrintModal(true);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer la Fiche</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER / HISTORIQUE LONGITUDINAL DES CONSULTATIONS */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-4 border-l border-slate-200 animate-slide-left">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase">
                  Historique Longitudinal
                </h3>
                <p className="text-xxs text-slate-500">
                  {selectedPatient?.firstName} {selectedPatient?.lastName} ({selectedPatient?.code})
                </p>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {patientConsultations.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                Aucune consultation archivée antérieure pour ce patient.
              </p>
            ) : (
              <div className="space-y-3">
                {patientConsultations.map(c => (
                  <div key={c.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xxs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                        {c.date}
                      </span>
                      <span className="text-xxs text-slate-400">{c.doctorName}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Motif :</span>
                      <p className="font-medium text-slate-800 text-xs">{c.chiefComplaint}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Diagnostic :</span>
                      <p className="font-bold text-teal-900 text-xs">{c.diagnosis}</p>
                    </div>

                    {c.prescription && (
                      <div className="pt-1 border-t border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Prescription :</span>
                        <p className="font-mono text-3xs text-slate-700 whitespace-pre-line truncate max-h-16">
                          {c.prescription}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRINT MODAL: DOCUMENTS OFFICIELS CHREIN */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 print-modal-overlay print-modal-active">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[95vh] overflow-y-auto space-y-4 border border-slate-200 shadow-2xl print-modal-content">
            <div className="flex items-center justify-between border-b pb-3 no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-800">
                    Édition de Document Médical Officiel — CHREIN
                  </h3>
                  <span className="text-3xs text-slate-400 font-mono">Format A4 Portrait Conforme</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer le Document A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Type Selector (Hidden in print) */}
            <div className="flex items-center gap-2 no-print bg-slate-100 p-1 rounded-xl text-xxs font-bold">
              {[
                { type: 'OBSERVATION', label: 'Observation Complète' },
                { type: 'ORDONNANCE', label: 'Ordonnance Médicale' },
                { type: 'EXAMENS', label: 'Demande d\'Examens' },
                { type: 'CERTIFICAT', label: 'Certificat / Repos' }
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => setPrintDocumentType(item.type as any)}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                    printDocumentType === item.type
                      ? 'bg-white text-teal-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Printable Document Body - A4 Standard Sheet */}
            <div className="a4-document-sheet p-6 sm:p-8 bg-white border-2 border-slate-800 rounded-xl space-y-5 text-slate-900 font-sans shadow-sm">
              {/* National Emblem & Official Hospital Header */}
              <div className="avoid-page-break space-y-2 border-b-2 border-slate-900 pb-4">
                <div className="flex h-2.5 w-full rounded-md border border-slate-300 overflow-hidden shadow-2xs">
                  <div className="w-1/3 bg-[#00853F]" />
                  <div className="w-1/3 bg-[#FDEF42] flex items-center justify-center">
                    <span className="text-[#00853F] text-[9px] leading-none select-none font-bold">★</span>
                  </div>
                  <div className="w-1/3 bg-[#E31B23]" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                    RÉPUBLIQUE DU SÉNÉGAL • Un Peuple - Un But - Une Foi
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                    MINISTÈRE DE LA SANTÉ ET DE L'ACTION SOCIALE
                  </p>
                  <h2 className="text-base font-black text-slate-950 uppercase tracking-tight">
                    CENTRE HOSPITALIER RÉGIONAL EL HADJI IBRAHIMA NIASS (CHREIN) — KAOLACK
                  </h2>
                  <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide">
                    SERVICE DE PNEUMOLOGIE ET MALADIES INFECTIEUSES
                  </p>
                  <p className="text-3xs text-slate-500 font-medium">
                    Route Nationale, Quartier Ndangane • B.P. 42 Kaolack • Tél: +221 33 941 12 34 • Kaolack, Sénégal
                  </p>
                </div>
              </div>

              {/* Patient Card */}
              <div className="avoid-page-break grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs">
                <div className="space-y-1">
                  <p><span className="text-slate-500 font-medium">Nom & Prénom :</span> <strong className="text-slate-950 font-bold uppercase">{selectedPatient?.lastName}</strong> <strong className="text-slate-900">{selectedPatient?.firstName}</strong></p>
                  <p><span className="text-slate-500 font-medium">N° IP / Dossier :</span> <strong className="font-mono text-teal-800 font-bold">{selectedPatient?.code}</strong> (N° Hosp: <span className="font-mono">{selectedPatient?.hospitalNumber || 'CHREIN-PNEUMO'}</span>)</p>
                  <p><span className="text-slate-500 font-medium">Date Naiss. / Âge :</span> <strong>{selectedPatient?.birthDate ? `${new Date(selectedPatient.birthDate).toLocaleDateString('fr-FR')} (${selectedPatient.age} ans)` : `${selectedPatient?.age} ans`} ({selectedPatient?.gender === 'M' ? 'Masculin' : 'Féminin'})</strong></p>
                  <p><span className="text-slate-500 font-medium">Situation / Études :</span> <span>{form12Steps.maritalStatus || selectedPatient?.maritalStatus || 'Non renseigné'} • {form12Steps.educationLevel || selectedPatient?.educationLevel || 'Non renseigné'}</span></p>
                  <p><span className="text-slate-500 font-medium">Domicile :</span> <span>{selectedPatient?.district ? `${selectedPatient.district}, Kaolack` : selectedPatient?.address || 'Kaolack, Sénégal'}</span></p>
                  <p><span className="text-slate-500 font-medium">Téléphone :</span> <span className="font-mono">{form12Steps.emergencyPhone || selectedPatient?.phone || 'Non renseigné'}</span></p>
                  {selectedPatient?.bloodGroup && (
                    <p><span className="text-slate-500 font-medium">Groupe Sanguin :</span> <strong className="font-mono text-rose-700">{selectedPatient.bloodGroup}</strong></p>
                  )}
                  {selectedPatient?.allergies && (
                    <p><span className="text-slate-500 font-medium">Allergies connues :</span> <strong className="text-amber-800">{selectedPatient.allergies}</strong></p>
                  )}
                </div>
                <div className="space-y-1 text-right sm:text-left">
                  <p><span className="text-slate-500 font-medium">Date de consultation :</span> <strong>{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></p>
                  <p><span className="text-slate-500 font-medium">Praticien :</span> <strong>{currentUser?.name || 'Dr. Cheikh Ndao'}</strong></p>
                  <p><span className="text-slate-500 font-medium">Titre :</span> <span>Médecin Spécialiste Pneumologue</span></p>
                  <p><span className="text-slate-500 font-medium">N° Inscription Ordre (CNOM) :</span> <span className="font-mono text-slate-700">SN-1428</span></p>
                  <p><span className="text-slate-500 font-medium">Spécialité :</span> <strong>Pneumologie & Maladies Infectieuses</strong></p>
                  <p><span className="text-slate-500 font-medium">Lieu de consultation :</span> <strong>CHREIN Kaolack</strong></p>
                </div>
              </div>

              {/* TYPE 1: OBSERVATION COMPLÈTE */}
              {printDocumentType === 'OBSERVATION' && (
                <div className="space-y-4 text-xs">
                  <div className="avoid-page-break py-2 text-center bg-teal-50 rounded-lg border border-teal-200">
                    <span className="font-black text-xs text-teal-950 uppercase tracking-widest">OBSERVATION MÉDICALE CLINIQUE COMPLÈTE</span>
                  </div>

                  <div className="avoid-page-break p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                    <h4 className="font-black uppercase text-teal-900 text-xxs border-b pb-1">1. Motif de Consultation, Anamnèse & Antécédents DPI</h4>
                    <p className="leading-relaxed"><strong>Motif principal :</strong> {form12Steps.chiefComplaint || 'Non spécifié'}</p>
                    <p className="leading-relaxed text-slate-700"><strong>Histoire de la maladie :</strong> {form12Steps.historyOfIllness || 'Aucune précision complémentaire.'}</p>
                    {form12Steps.mmrcGrade !== undefined && (
                      <p className="text-xxs text-teal-900"><strong>Dyspnée mMRC :</strong> Stade {form12Steps.mmrcGrade}</p>
                    )}
                    <div className="text-xxs text-slate-700 space-y-0.5 pt-1 border-t border-slate-100">
                      <p>
                        <strong>Tabagisme :</strong>{' '}
                        {dpiAntecedentsValue.smokingStatus === 'JAMAIS'
                          ? 'Jamais fumeur'
                          : `${dpiAntecedentsValue.smokingStatus === 'ANCIEN' ? `Ancien fumeur (arrêt ${dpiAntecedentsValue.smokingStoppedYear || 'N/A'})` : 'Fumeur actuel'} — ${dpiAntecedentsValue.smokingPackYears || 0} PA`}
                      </p>
                      {(dpiAntecedentsValue.medicalAntecedents?.length > 0 || form12Steps.antecedentsText) && (
                        <p>
                          <strong>Antécédents médicaux :</strong>{' '}
                          {dpiAntecedentsValue.medicalAntecedents?.length > 0
                            ? [
                                ...dpiAntecedentsValue.medicalAntecedents,
                                dpiAntecedentsValue.medicalAntecedentsOther
                              ].filter(Boolean).join(', ')
                            : form12Steps.antecedentsText}
                        </p>
                      )}
                      {(dpiAntecedentsValue.cannabis.status !== 'JAMAIS' || dpiAntecedentsValue.alcohol.status !== 'JAMAIS' || dpiAntecedentsValue.otherDrugs.status === 'OUI') && (
                        <p>
                          <strong>Autres consommations :</strong>{' '}
                          Cannabis : {dpiAntecedentsValue.cannabis.status} · Alcool : {dpiAntecedentsValue.alcohol.status}
                          {dpiAntecedentsValue.otherDrugs.status === 'OUI' ? ` · Autres substances : ${dpiAntecedentsValue.otherDrugs.substance || 'Oui'}` : ''}
                        </p>
                      )}
                      {(dpiAntecedentsValue.occupationalProfile?.exposures?.length || 0) > 0 && (
                        <p>
                          <strong>Expositions pro/environnementales :</strong>{' '}
                          {dpiAntecedentsValue.occupationalProfile.exposures.join(', ')}
                          {dpiAntecedentsValue.occupationalProfile.durationYears ? ` (${dpiAntecedentsValue.occupationalProfile.durationYears} ans)` : ''}
                        </p>
                      )}
                      {dpiAntecedentsValue.surgicalHistory.length > 0 && (
                        <p>
                          <strong>ATCD chirurgicaux :</strong>{' '}
                          {dpiAntecedentsValue.surgicalHistory.map(s => `${s.procedure} (${s.dateOrYear})`).join(' ; ')}
                        </p>
                      )}
                      {selectedPatient?.gender === 'F' && (dpiAntecedentsValue.obgynHistory.gestite !== undefined || dpiAntecedentsValue.obgynHistory.isPregnant) && (
                        <p>
                          <strong>Gynéco-obstétrique :</strong>{' '}
                          G{dpiAntecedentsValue.obgynHistory.gestite ?? '-'} P{dpiAntecedentsValue.obgynHistory.parite ?? '-'}
                          {dpiAntecedentsValue.obgynHistory.isPregnant ? ` · Grossesse (${dpiAntecedentsValue.obgynHistory.gestationalAgeWeeks || '?'} SA)` : ''}
                          {dpiAntecedentsValue.obgynHistory.menopause ? ' · Ménopause' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="avoid-page-break p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                    <h4 className="font-black uppercase text-teal-900 text-xxs border-b pb-1">2. Constantes Vitales & Examen Physique</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-2 bg-slate-50 rounded-lg text-center font-mono text-xxs tabular-nums">
                      <div><span className="block text-slate-400 text-3xs">TA</span><strong>{form12Steps.vitals.bp || '--/--'}</strong></div>
                      <div><span className="block text-slate-400 text-3xs">FC</span><strong>{form12Steps.vitals.pulse || '--'} bpm</strong></div>
                      <div><span className="block text-slate-400 text-3xs">FR</span><strong>{form12Steps.vitals.rr || '--'}/min</strong></div>
                      <div>
                        <span className="block text-slate-400 text-3xs">SpO₂</span>
                        <strong>
                          {form12Steps.vitals.spo2Mode === 'SOUS_O2'
                            ? `${form12Steps.vitals.spo2O2 || '--'}% (${form12Steps.vitals.o2FlowLiters || 0}L ${form12Steps.vitals.o2Device || 'O2'}${form12Steps.vitals.fio2 ? ` FiO₂ ${form12Steps.vitals.fio2}%` : ''})`
                            : `${form12Steps.vitals.spo2Ambient || '--'}% (AA)`}
                        </strong>
                      </div>
                      <div><span className="block text-slate-400 text-3xs">T°</span><strong>{form12Steps.vitals.temperature || '--'}°C</strong></div>
                      <div><span className="block text-slate-400 text-3xs">Poids / Taille / IMC</span><strong>{form12Steps.vitals.weight || '--'}kg / {form12Steps.vitals.height || '--'}cm {bmiCalculation ? `(${bmiCalculation.value})` : ''}</strong></div>
                    </div>
                    <div className="space-y-1 text-slate-700 text-xxs leading-relaxed">
                      {form12Steps.systems.pulmonaryVesicularBreath && <p><strong>Murmure vésiculaire :</strong> {form12Steps.systems.pulmonaryVesicularBreath}</p>}
                      {form12Steps.systems.pulmonaryCrackles && <p><strong>Râles crépitants :</strong> {form12Steps.systems.pulmonaryCrackles}</p>}
                      {form12Steps.systems.pulmonaryWheezes && <p><strong>Sibilants :</strong> {form12Steps.systems.pulmonaryWheezes}</p>}
                      {form12Steps.systems.pulmonaryRhonchi && <p><strong>Ronchis :</strong> {form12Steps.systems.pulmonaryRhonchi}</p>}
                      {form12Steps.systems.pleuralFriction && <p><strong>Frottement pleural :</strong> {form12Steps.systems.pleuralFriction}</p>}
                      {form12Steps.systems.cyanosisClubbing && <p><strong>Cyanose / Hippocratisme :</strong> {form12Steps.systems.cyanosisClubbing}</p>}
                      {form12Steps.systems.cardiovascular && <p><strong>Cardiovasculaire :</strong> {form12Steps.systems.cardiovascular}</p>}
                      {form12Steps.systems.abdomen && <p><strong>Abdomen :</strong> {form12Steps.systems.abdomen}</p>}
                      {form12Steps.systems.neurological && <p><strong>Neurologique :</strong> {form12Steps.systems.neurological}</p>}
                      {form12Steps.systems.entLymphNodes && <p><strong>ORL & Ganglions :</strong> {form12Steps.systems.entLymphNodes}</p>}
                      {form12Steps.systems.cutaneous && <p><strong>Cutané / Muqueuses :</strong> {form12Steps.systems.cutaneous}</p>}
                    </div>
                  </div>

                  {form12Steps.syndromicSummary && (
                    <div className="avoid-page-break p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                      <h4 className="font-black uppercase text-teal-900 text-xxs border-b pb-1">3. Résumé Syndromique</h4>
                      <p className="whitespace-pre-line text-slate-800 leading-relaxed">{form12Steps.syndromicSummary}</p>
                    </div>
                  )}

                  {(form12Steps.paraclinicalOrdered.orderedExamsDetailed?.length || 0) > 0 && (
                    <div className="avoid-page-break p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                      <h4 className="font-black uppercase text-teal-900 text-xxs border-b pb-1">4. Examens Paracliniques & Résultats</h4>
                      <ul className="list-disc pl-4 space-y-1 text-slate-800">
                        {form12Steps.paraclinicalOrdered.orderedExamsDetailed?.map(ex => (
                          <li key={ex.id}>
                            <strong>{ex.examName}</strong> ({ex.macroCategory} · {ex.status})
                            {ex.resultsText ? ` : ${ex.resultsText}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="avoid-page-break p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                    <h4 className="font-black uppercase text-teal-900 text-xxs border-b pb-1">5. Diagnostics Retenus (CIM-11) & Scores</h4>
                    {form12Steps.diagnoses && form12Steps.diagnoses.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-1 text-slate-800">
                        {form12Steps.diagnoses.map(d => (
                          <li key={d.id}><strong>{d.label}</strong> [CIM-11: <span className="font-mono">{d.codeCIM11}</span>] — {d.type} ({d.status})</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 italic">Aucun diagnostic codifié renseigné.</p>
                    )}
                    {patientScoresToday.length > 0 && (
                      <p className="text-xxs text-slate-700 pt-1">
                        <strong>Scores cliniques calculés :</strong>{' '}
                        {patientScoresToday.slice(0, 4).map(s => `${s.scoreName} = ${s.calculatedValue}`).join(' ; ')}
                      </p>
                    )}
                  </div>

                  <div className="avoid-page-break p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                    <h4 className="font-black uppercase text-teal-900 text-xxs border-b pb-1">6. Conduite Thérapeutique & Suivi</h4>
                    <p className="font-sans whitespace-pre-line text-slate-900 text-xs leading-relaxed font-medium">
                      {form12Steps.managementPlan.medicationsPrescribed || 'Plan de soins en cours de stabilisation.'}
                    </p>
                    {form12Steps.followUp.nextAppointmentDate && (
                      <p className="text-xxs text-slate-700 pt-1 border-t border-slate-100">
                        <strong>Orientation :</strong> {form12Steps.managementPlan.orientation} · <strong>Prochain suivi :</strong> {new Date(form12Steps.followUp.nextAppointmentDate).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TYPE 2: ORDONNANCE */}
              {printDocumentType === 'ORDONNANCE' && (
                <div className="space-y-4 text-xs">
                  <div className="avoid-page-break py-2 text-center bg-teal-50 rounded-lg border border-teal-200">
                    <span className="font-black text-xs text-teal-950 uppercase tracking-widest">ORDONNANCE MÉDICALE SÉCURISÉE</span>
                  </div>
                  <div className="avoid-page-break p-6 bg-white border border-slate-300 rounded-xl font-sans text-xs font-medium leading-loose whitespace-pre-line text-slate-950 shadow-2xs">
                    {form12Steps.managementPlan.medicationsPrescribed || 'Aucun médicament saisi dans cette consultation.'}
                  </div>
                  <div className="avoid-page-break p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-3xs text-amber-900">
                    <p className="font-bold">Instructions au patient :</p>
                    <p>Respecter rigoureusement les posologies et la durée du traitement prescrit. Durée de validité de l'ordonnance : 3 mois. Ne pas interrompre le traitement sans avis médical.</p>
                  </div>
                </div>
              )}

              {/* TYPE 3: DEMANDE D'EXAMENS */}
              {printDocumentType === 'EXAMENS' && (
                <div className="space-y-4 text-xs">
                  <div className="avoid-page-break py-2 text-center bg-teal-50 rounded-lg border border-teal-200">
                    <span className="font-black text-xs text-teal-950 uppercase tracking-widest">BON D'EXAMENS PARACLINIQUES & EXPLORATIONS</span>
                  </div>
                  <div className="avoid-page-break p-5 bg-white border border-slate-200 rounded-xl space-y-3">
                    <p className="font-bold text-slate-800">Prière de réaliser pour le patient susnommé les explorations suivantes :</p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-900">
                      {form12Steps.paraclinicalOrdered.geneXpertBK && <li><strong>GeneXpert MTB/RIF</strong> sur expectorations matinales (suspicion tuberculose)</li>}
                      {form12Steps.paraclinicalOrdered.chestXray && <li><strong>Radiographie Pulmonaire</strong> face debout</li>}
                      {form12Steps.paraclinicalOrdered.bloodGas && <li><strong>Gazométrie artérielle</strong> en air ambiant (pH, PaO2, PaCO2, SaO2, HCO3-)</li>}
                      {form12Steps.paraclinicalOrdered.nfsCrp && <li><strong>NFS complète + CRP + Vitesse de sédimentation</strong></li>}
                      {form12Steps.paraclinicalOrdered.chestCT && <li><strong>Scanner Thoracique (TDM-HR)</strong> haute résolution</li>}
                      {form12Steps.paraclinicalOrdered.spirometry && <li><strong>EFR / Spirométrie</strong> avec test de réversibilité aux bronchodilatateurs</li>}
                      {form12Steps.paraclinicalOrdered.pleuralPuncture && <li><strong>Ponction pleurale</strong> avec analyse biochimique (protéines, LDH) et cytologique</li>}
                      {(form12Steps.paraclinicalOrdered.orderedExamsDetailed || []).map(ex => (
                        <li key={ex.id}>
                          <strong>{ex.examName}</strong> ({ex.macroCategory} — {ex.status}){ex.resultsText ? ` : ${ex.resultsText}` : ''}
                        </li>
                      ))}
                    </ul>
                    {form12Steps.paraclinicalOrdered.otherNotes && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-3xs font-bold text-slate-500 uppercase block">Renseignements cliniques :</span>
                        <p className="mt-0.5 text-xxs font-mono text-slate-700">{form12Steps.paraclinicalOrdered.otherNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TYPE 4: CERTIFICAT */}
              {printDocumentType === 'CERTIFICAT' && (
                <div className="space-y-4 text-xs">
                  <div className="avoid-page-break py-2 text-center bg-teal-50 rounded-lg border border-teal-200">
                    <span className="font-black text-xs text-teal-950 uppercase tracking-widest">CERTIFICAT MÉDICAL DE REPOS & DISPENSE</span>
                  </div>
                  <div className="avoid-page-break p-6 bg-white border border-slate-200 rounded-xl leading-relaxed text-xs space-y-4 text-slate-800">
                    <p>
                      Je soussigné, <strong>{currentUser?.name || 'Dr. Cheikh Ndao'}</strong>, Médecin Spécialiste au Service de Pneumologie et Maladies Infectieuses du Centre Hospitalier Régional El Hadji Ibrahima Niass (CHREIN) de Kaolack, certifie avoir examiné ce jour :
                    </p>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-medium">
                      M./Mme <strong>{selectedPatient?.firstName} {selectedPatient?.lastName}</strong>, âgé(e) de <strong>{selectedPatient?.age} ans</strong>, demeurant à {selectedPatient?.address || 'Kaolack'}, N° IP : <span className="font-mono font-bold">{selectedPatient?.code}</span>.
                    </div>
                    <p>
                      L'état de santé du patient nécessite un repos médical à domicile avec dispense de toute activité professionnelle et physique intense pour une durée de <strong>15 (quinze) jours</strong> à compter de ce jour, sauf complication ultérieure.
                    </p>
                    <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                      Certificat délivré en main propre à l'intéressé(e) pour faire valoir ce que de droit en application des dispositions légales et réglementaires en vigueur.
                    </p>
                  </div>
                </div>
              )}

              {/* Doctor Signature Block & Authentic Stamp Frame */}
              <div className="avoid-page-break pt-5 border-t-2 border-slate-900 flex flex-col sm:flex-row items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 border border-slate-300 rounded-lg flex flex-col items-center justify-center p-1 bg-slate-50">
                    <QrCode className="w-8 h-8 text-slate-700" />
                    <span className="text-[7px] font-mono text-slate-400 mt-0.5 uppercase">CHREIN VÉRIF</span>
                  </div>
                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-800">Authentification Documentaire DPI CHREIN</p>
                    <p>Code QR : <span className="font-mono text-3xs">CHREIN-CONS-{selectedPatient?.code}-{new Date().getFullYear()}</span></p>
                    <p>Date de consultation : {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p className="text-3xs text-slate-400">Dossier Patient Informatisé — Hôpital Régional de Kaolack</p>
                  </div>
                </div>

                <div className="text-right space-y-1 min-w-[220px]">
                  <p className="text-xs font-semibold text-slate-600">
                    Fait à Kaolack, le <strong className="text-slate-900">{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                  </p>
                  <p className="text-xs font-bold text-slate-950 mt-1">Le Médecin Praticien Consultant</p>
                  <p className="text-xs text-slate-900 font-black">{currentUser?.name || 'Dr. Cheikh Ndao'}</p>
                  <p className="text-3xs text-slate-500 font-mono">N° Inscription CNOM : SN-1428</p>
                  <div className="mt-2 w-48 h-20 border border-slate-300 rounded-lg ml-auto bg-slate-50/50 flex flex-col justify-between p-2 text-center">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                      Cadre réservé au Cachet & Signature
                    </span>
                    <span className="text-[7px] text-slate-300 font-mono">
                      Visa & Empreinte du Praticien
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Notice Footer */}
              <div className="avoid-page-break pt-3 text-center border-t border-slate-200 text-[8px] text-slate-500 leading-normal">
                <p>
                  Document médical officiel généré par le Système d'Information Hospitalier (DPI) du Service de Pneumologie — CHREIN Kaolack.
                  Soumis au secret médical professionnel (Article 378 du Code Pénal Sénégalais et Article 12 du Code de Déontologie Médicale).
                  Toute falsification, altération ou usage frauduleux de ce document expose aux sanctions prévues par la législation en vigueur.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 no-print">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Microphone Guidance & Clinical Presets Modal */}
      <MicrophonePermissionModal
        onInsertSample={(formattedText) => {
          const activeField = speechTargetFieldRef.current || 'historyOfIllness';
          if (activeField === 'historyOfIllness') {
            setForm12Steps(prev => ({
              ...prev,
              historyOfIllness: prev.historyOfIllness ? `${prev.historyOfIllness}\n\n${formattedText}` : formattedText
            }));
          } else if (activeField === 'chiefComplaint') {
            setForm12Steps(prev => ({
              ...prev,
              chiefComplaint: prev.chiefComplaint ? `${prev.chiefComplaint}\n\n${formattedText}` : formattedText
            }));
          } else if (activeField === 'syndromicSummary') {
            setForm12Steps(prev => ({
              ...prev,
              syndromicSummary: prev.syndromicSummary ? `${prev.syndromicSummary}\n\n${formattedText}` : formattedText
            }));
          } else if (activeField === 'medicationsPrescribed') {
            setForm12Steps(prev => ({
              ...prev,
              managementPlan: {
                ...prev.managementPlan,
                medicationsPrescribed: prev.managementPlan.medicationsPrescribed
                  ? `${prev.managementPlan.medicationsPrescribed}\n\n${formattedText}`
                  : formattedText
              }
            }));
          }
          setTranscriptNotice(`✓ Modèle de dictée inséré avec ponctuation médicale automatique`);
          setTimeout(() => setTranscriptNotice(null), 4500);
        }}
      />
    </div>
  );
};

export default Consultations;
