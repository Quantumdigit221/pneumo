import { EducationLevel, ExplorationCategory, MaritalStatus, SmokingPeriod } from '../types';

export const MARITAL_STATUS_OPTIONS: MaritalStatus[] = [
  'Célibataire',
  'Marié(e) monogame',
  'Marié(e) polygame',
  'Divorcé(e)',
  'Veuf / Veuve',
  'Autre',
  'Non renseigné'
];

export const EDUCATION_LEVEL_OPTIONS: EducationLevel[] = [
  'Non scolarisé',
  'Primaire',
  'Secondaire',
  'Supérieur',
  'École coranique',
  'Autre',
  'Non renseigné'
];

export const MEDICAL_ANTECEDENTS_OPTIONS: string[] = [
  'Hypertension artérielle',
  'Diabète',
  'Asthme',
  'BPCO',
  'Tuberculose antérieure',
  'Drépanocytose',
  'Maladie rénale chronique',
  'Cardiopathie',
  'Hépatopathie chronique / hépatite virale',
  'Infection à VIH'
];

export const OCCUPATIONAL_EXPOSURE_OPTIONS: { id: string; label: string }[] = [
  { id: 'SILICE', label: 'Exposition à la silice' },
  { id: 'AMIANTE', label: 'Exposition à l\'amiante' },
  { id: 'POUSSIERES_BOIS', label: 'Exposition aux poussières de bois' },
  { id: 'POUSSIERES_AGRICOLES', label: 'Exposition aux poussières agricoles ou organiques' },
  { id: 'FUMEES_GAZ', label: 'Exposition aux fumées et gaz' },
  { id: 'PRODUITS_CHIMIQUES', label: 'Exposition aux produits chimiques' },
  { id: 'BIOMASSE', label: 'Exposition à la fumée de biomasse (bois, charbon)' },
  { id: 'AUTRES', label: 'Autres expositions' }
];

export const O2_DEVICE_OPTIONS: string[] = [
  'Lunettes nasales',
  'Masque simple',
  'Masque à haute concentration (MHC)',
  'VNI / CPAP / BiPAP',
  'Optiflow / Haut débit nasal',
  'Autre dispositif'
];

export function calcPackYears(cigarettesPerDay?: number, durationYears?: number): number {
  const cig = Number(cigarettesPerDay || 0);
  const yrs = Number(durationYears || 0);
  if (cig <= 0 || yrs <= 0) return 0;
  return Number(((cig * yrs) / 20).toFixed(1));
}

export function sumSmokingPeriodsPA(periods: SmokingPeriod[] = []): number {
  return Number(
    periods
      .reduce((acc, p) => acc + calcPackYears(p.cigarettesPerDay, p.durationYears), 0)
      .toFixed(1)
  );
}

export function calcBmi(weightKg?: number, heightCm?: number): number | undefined {
  const w = Number(weightKg || 0);
  const h = Number(heightCm || 0);
  if (w <= 0 || h <= 0) return undefined;
  const hMeters = h > 3 ? h / 100 : h; // supports cm or meters safely
  return Number((w / (hMeters * hMeters)).toFixed(1));
}

export type MacroExplorationCategoryId =
  | 'BIOLOGIE'
  | 'MICROBIOLOGIE'
  | 'IMAGERIE'
  | 'CARDIOVASCULAIRE'
  | 'EFR'
  | 'AUTRES';

export interface ParaclinicalSubCategory {
  id: string;
  label: string;
  explorationCategory: ExplorationCategory;
  exams: string[];
}

export interface ParaclinicalMacroCategory {
  id: MacroExplorationCategoryId;
  letter: string;
  label: string;
  defaultLab: string;
  subCategories: ParaclinicalSubCategory[];
}

export const PARACLINICAL_CATALOG: ParaclinicalMacroCategory[] = [
  {
    id: 'BIOLOGIE',
    letter: 'A',
    label: 'BIOLOGIE',
    defaultLab: 'Laboratoire Central CHREIN',
    subCategories: [
      {
        id: 'BIO_HEMATO',
        label: 'Hématologie',
        explorationCategory: 'HEMATOLOGIE',
        exams: [
          'NFS (Numération Formule Sanguine)',
          'Vitesse de Sédimentation (VS)',
          'Bilan de coagulation (TP, INR, TCA)'
        ]
      },
      {
        id: 'BIO_BIOCHIMIE',
        label: 'Biochimie',
        explorationCategory: 'BIOCHIMIE',
        exams: [
          'CRP (Protéine C-Réactive)',
          'Glycémie à jeun / capillaire',
          'HbA1c (Hémoglobine glyquée)',
          'Urée sanguine',
          'Créatininémie / DFG',
          'Ionogramme sanguin (Na+, K+, Cl-)',
          'Bilan hépatique (ASAT, ALAT, GGT, PAL, Bilirubine)',
          'Calcémie',
          'Protéinémie / Albuminémie',
          'LDH'
        ]
      },
      {
        id: 'BIO_AUTRES',
        label: 'Autres examens biologiques',
        explorationCategory: 'GAZOMETRIE',
        exams: [
          'Gaz du sang artériel (GDS)',
          'Troponine',
          'BNP / NT-proBNP',
          'D-dimères',
          'Procalcitonine (PCT)',
          'Autres examens biologiques'
        ]
      }
    ]
  },
  {
    id: 'MICROBIOLOGIE',
    letter: 'B',
    label: 'MICROBIOLOGIE',
    defaultLab: 'Laboratoire Microbiologie / PNT CHREIN',
    subCategories: [
      {
        id: 'MICRO_BACTERIO',
        label: 'Bactériologie',
        explorationCategory: 'MICROBIOLOGIE',
        exams: [
          'ECBC (Examen cytobactériologique des crachats)',
          'ECBU (Examen cytobactériologique des urines)',
          'Hémocultures (aérobie / anaérobie)',
          'Ponction / Analyse de liquide pleural',
          'Ponction lombaire / LCR',
          'Antibiogramme',
          'Autres prélèvements bactériologiques'
        ]
      },
      {
        id: 'MICRO_MYCOBACT',
        label: 'Mycobactériologie',
        explorationCategory: 'MYCOBACTERIOLOGIE',
        exams: [
          'Recherche de BAAR (Frottis Ziehl-Neelsen / Auramine)',
          'GeneXpert MTB/RIF ou Ultra',
          'Culture des mycobactéries (Löwenstein / MGIT)',
          'Tests de sensibilité aux antituberculeux (LPA / DST)'
        ]
      },
      {
        id: 'MICRO_VIRO',
        label: 'Virologie',
        explorationCategory: 'VIROLOGIE',
        exams: [
          'Sérologie VIH (Rétrovirale)',
          'Sérologies des hépatites virales (VHB, VHC)',
          'PCR virales respiratoires (SARS-CoV-2, Grippe, VRS)',
          'Autres examens virologiques'
        ]
      },
      {
        id: 'MICRO_MYCO_PARA',
        label: 'Mycologie et parasitologie',
        explorationCategory: 'MYCOLOGIE_PARASITOLOGIE',
        exams: [
          'Examen mycologique direct',
          'Culture fongique (Aspergillus, Candida...)',
          'Recherche de Pneumocystis jirovecii',
          'Examens parasitologiques (Selles, sang, crachats)',
          'Autres examens mycologiques / parasitologiques'
        ]
      }
    ]
  },
  {
    id: 'IMAGERIE',
    letter: 'C',
    label: 'IMAGERIE MÉDICALE',
    defaultLab: 'Service d\'Imagerie Médicale CHREIN',
    subCategories: [
      {
        id: 'IMG_THORAX_SCAN',
        label: 'Imagerie thoracique & TDM / IRM / Écho',
        explorationCategory: 'IMAGERIE',
        exams: [
          'Radiographie thoracique (Face ± Profil)',
          'Scanner thoracique (TDM)',
          'Angioscanner thoracique',
          'Scanner abdominal',
          'Scanner cérébral',
          'Scanner thoraco-abdomino-pelvien (TAP)',
          'IRM',
          'Échographie pleuropulmonaire',
          'Échographie abdominale',
          'Échographie Doppler vasculaire (MI / TSA)',
          'Autres examens d\'imagerie'
        ]
      }
    ]
  },
  {
    id: 'CARDIOVASCULAIRE',
    letter: 'D',
    label: 'EXPLORATIONS CARDIOVASCULAIRES',
    defaultLab: 'Unité de Cardiologie / Explorations CHREIN',
    subCategories: [
      {
        id: 'CARDIO_ALL',
        label: 'Explorations cardiaques',
        explorationCategory: 'CARDIOVASCULAIRE',
        exams: [
          'Électrocardiogramme (ECG 12 dérivations)',
          'Échocardiographie Doppler transthoracique (ETT)',
          'Holter ECG 24h / 48h',
          'Autres explorations cardiovasculaires'
        ]
      }
    ]
  },
  {
    id: 'EFR',
    letter: 'E',
    label: 'EXPLORATIONS FONCTIONNELLES RESPIRATOIRES',
    defaultLab: 'Laboratoire d\'EFR Pneumologie CHREIN',
    subCategories: [
      {
        id: 'EFR_ALL',
        label: 'Explorations respiratoires',
        explorationCategory: 'EFR_RESPIRATOIRE',
        exams: [
          'Spirométrie (VEMS, CVF, VEMS/CVF pré et post-BD)',
          'Test de réversibilité aux bronchodilatateurs',
          'Pléthysmographie corporelle totale',
          'Mesure de la DLCO (Diffusion libre du CO)',
          'Test de marche de 6 minutes (TM6)',
          'Oxymétrie nocturne',
          'Polygraphie ventilatoire nocturne',
          'Autres explorations respiratoires'
        ]
      }
    ]
  },
  {
    id: 'AUTRES',
    letter: 'F',
    label: 'AUTRES EXPLORATIONS',
    defaultLab: 'Plateau Technique CHREIN',
    subCategories: [
      {
        id: 'AUTRES_ALL',
        label: 'Examens complémentaires divers',
        explorationCategory: 'AUTRES',
        exams: [
          'Fibroscopie bronchique (LBA / Biopsies)',
          'Biopsie pleurale / Écho-guidée',
          'IDR à la tuberculine / Quantiféron',
          'Autres explorations complémentaires (saisie libre)'
        ]
      }
    ]
  }
];
