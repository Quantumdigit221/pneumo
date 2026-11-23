export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR', // Médecin Pneumologue / Infectiologue
  NURSE = 'NURSE', // Infirmier(e) de soins / transmissions paramédicales
  SECRETARY = 'SECRETARY', // Secrétariat Médical / Accueil
  RECEPTIONIST = 'RECEPTIONIST',
  PHARMACIST = 'PHARMACIST',
  LAB_TECHNICIAN = 'LAB_TECHNICIAN',
  IMAGING_TECHNICIAN = 'IMAGING_TECHNICIAN',
  OWNER = 'OWNER',
  OFFICINE_MANAGER = 'OFFICINE_MANAGER'
}

export enum TicketStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NOSHOW = 'NOSHOW'
}

export interface HealthCenter {
  id: string;
  name: string;
  serviceName?: string; // e.g. "Service de Pneumologie et Maladies Infectieuses"
  hospitalName?: string; // e.g. "Centre Hospitalier Régional El Hadji Ibrahima Niass (CHREIN)"
  locationCity?: string; // Kaolack
  address: string;
  phone: string;
  email: string;
  directorName: string;
  rnis?: string;
  logoUrl?: string;
  capacity?: number;
  pispialias?: string;
  isActive: boolean;
  structureType?: 'CHREIN_HOPITAL' | 'CLINIQUE_PRIVEE' | 'CABINET_INDIVIDUEL';
  subscriptionPlan?: 'basic' | 'pro' | 'expert';
  subscriptionStatus?: 'active' | 'suspended' | 'trial';
}

export interface User {
  id: string;
  centerId: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  specialty?: string; // Pneumologie, Infectiologie, Médecine Interne, Soins Infirmiers
  phone?: string;
  password?: string;
  isActive?: boolean;
  officineId?: string;
  officineName?: string;
}

// -------------------------------------------------------------
// PATIENT ET IDENTITE MULTISTRUCTURE (Section 3 du Cahier des Charges)
// -------------------------------------------------------------
export type MaritalStatus =
  | 'Célibataire'
  | 'Marié(e) monogame'
  | 'Marié(e) polygame'
  | 'Divorcé(e)'
  | 'Veuf / Veuve'
  | 'Autre'
  | 'Non renseigné';

export type EducationLevel =
  | 'Non scolarisé'
  | 'Primaire'
  | 'Secondaire'
  | 'Supérieur'
  | 'École coranique'
  | 'Autre'
  | 'Non renseigné';

export type SmokingStatus = 'JAMAIS' | 'ACTUEL' | 'ANCIEN';
export type ConsumptionStatus = 'JAMAIS' | 'ACTUEL' | 'ANCIEN';

export interface SmokingPeriod {
  id: string;
  label?: string;
  cigarettesPerDay: number;
  durationYears: number;
  startYear?: string;
  stopYear?: string;
  packYears: number;
}

export interface PatientConsumptions {
  smoking?: {
    status: SmokingStatus;
    cigarettesPerDay?: number;
    durationYears?: number;
    stoppedYear?: string;
    packYears?: number;
    periods?: SmokingPeriod[];
    biomassExposure?: boolean;
    passiveSmoking?: boolean;
  };
  cannabis?: {
    status: ConsumptionStatus;
    frequency?: string;
    duration?: string;
  };
  alcohol?: {
    status: ConsumptionStatus;
    frequency?: string;
    quantity?: string;
  };
  otherDrugs?: {
    status: 'OUI' | 'NON' | 'NON_RENSEIGNE';
    substance?: string;
    frequency?: string;
    duration?: string;
    route?: string;
  };
}

export interface OccupationalExposureProfile {
  currentProfession?: string;
  previousProfessions?: string;
  exposures: string[];
  otherExposures?: string;
  durationYears?: number;
  exposureConditions?: string;
}

export interface SurgicalHistoryEntry {
  id: string;
  procedure: string;
  dateOrYear: string;
  complications?: string;
}

export interface ObgynHistory {
  gestite?: number;
  parite?: number;
  miscarriagesOrAbortions?: number;
  lastMenstrualPeriod?: string;
  isPregnant?: boolean;
  gestationalAgeWeeks?: number;
  menopause?: boolean;
  menopauseAge?: number;
  contraception?: string;
  obstetricComplications?: string;
  otherGynHistory?: string;
}

export interface Patient {
  id: string;
  centerId: string; // Cloisonnement multistructure
  code: string; // Identifiant interne unique IP (ex: IP-2026-0042)
  hospitalNumber?: string; // Numéro hospitalier CHREIN (ex: CHREIN-PNEUMO-2026-089)
  firstName: string;
  lastName: string;
  birthDate: string;
  age: number;
  gender: 'M' | 'F';
  phone: string;
  address: string;
  district?: string; // Quartier (ex: Ndangane, Médina Baye, Kasnack, Sara...)
  region?: string; // Kaolack, Fatick, Kaffrine, etc.
  profession?: string;
  maritalStatus?: MaritalStatus;
  educationLevel?: EducationLevel;
  emergencyContact?: string;
  emergencyPhone?: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies?: string;
  chronicConditions?: string; // Séquelles TB, BPCO, Diabète, HTA, Asthme, VIH
  medicalAntecedents?: {
    selected: string[];
    other?: string;
    notes?: string;
  };
  smokingHistory?: {
    isSmoker: boolean;
    status?: SmokingStatus;
    cigarettesPerDay?: number;
    durationYears?: number;
    packYears?: number; // Paquets-années (PA)
    stoppedYear?: string;
    periods?: SmokingPeriod[];
    biomassExposure?: boolean; // Exposition feux de bois / biomasse cuisine
    passiveSmoking?: boolean;
  };
  consumptions?: PatientConsumptions;
  occupationalExposures?: OccupationalExposureProfile;
  surgicalHistory?: SurgicalHistoryEntry[];
  obgynHistory?: ObgynHistory;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// DIAGNOSTICS MULTIPLES ET LONGITUDINALITE (Section 5 du Cahier des Charges)
// -------------------------------------------------------------
export type DiagnosisType =
  | 'PRINCIPAL' // Motif principal de prise en charge
  | 'ASSOCIE' // Affections actives ayant influencé la prise en charge
  | 'COMPLICATION' // Événements liés à la maladie ou au séjour
  | 'CHRONIQUE_ANTECEDENT'; // Conditions longitudinales

export type DiagnosisStatus =
  | 'SUSPECTE'
  | 'CONFIRME'
  | 'ECARTE'
  | 'RESOLU'
  | 'CHRONIQUE';

export interface ClinicalDiagnosis {
  id: string;
  codeCIM11: string; // Ex: 1B10 (Tuberculose respiratoire), CA22 (BPCO), CA23 (Asthme)
  label: string; // Libellé clinique
  type: DiagnosisType;
  status: DiagnosisStatus;
  dateDiagnosed: string;
  notes?: string;
}

// -------------------------------------------------------------
// CONSULTATION STANDARDISÉE EN 12 ÉTAPES (Section 4 du Cahier des Charges)
// -------------------------------------------------------------
export interface SpirometryStructuredData {
  cvfPreL?: number;
  cvfPrePct?: number;
  vemsPreL?: number;
  vemsPrePct?: number;
  tiffeneauPre?: number;
  cvfPostL?: number;
  cvfPostPct?: number;
  vemsPostL?: number;
  vemsPostPct?: number;
  tiffeneauPost?: number;
  gainMl?: number;
  gainPct?: number;
}

export interface OrderedParaclinicalExam {
  id: string;
  macroCategory: 'BIOLOGIE' | 'MICROBIOLOGIE' | 'IMAGERIE' | 'CARDIOVASCULAIRE' | 'EFR' | 'AUTRES';
  subCategory?: string;
  examName: string;
  status: 'PRESCRIT' | 'EN_ATTENTE' | 'REALISE';
  prescribedDate: string;
  realizedDate?: string;
  resultsText?: string;
  followUpEntries?: Array<{
    id: string;
    date: string;
    summary: string;
  }>;
  attachmentName?: string;
  attachmentType?: 'PHOTO' | 'PDF' | 'DICOM';
  attachmentUrl?: string;
  spirometryData?: SpirometryStructuredData;
  linkedExplorationId?: string;
}

export interface VitalsSeriesEntry {
  id: string;
  timestamp: string;
  bp?: string;
  pulse?: number;
  rr?: number;
  spo2Mode?: 'AIR_AMBIANT' | 'SOUS_O2';
  spo2Ambient?: number;
  spo2O2?: number;
  o2FlowLiters?: number;
  o2Device?: string;
  fio2?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  generalState?: 'BON' | 'ALTERE_LEGER' | 'ALTERE_SEVERE' | 'CACHECTION';
  notes?: string;
}

export interface SyndromicPriorityItem {
  id: string;
  text: string;
  severity?: 'CRITIQUE' | 'MAJEUR' | 'MODERE';
}

export interface ConsultationTwelveSteps {
  // 1) État civil et identification (lié au patient)
  civilStatusNotes?: string;
  maritalStatus?: MaritalStatus;
  educationLevel?: EducationLevel;
  profession?: string;
  emergencyPhone?: string;
  
  // 2) Motif de consultation
  chiefComplaint: string;
  
  // 3) Histoire de la maladie (+ échelle mMRC déplacée ici)
  historyOfIllness: string;
  mmrcGrade?: number;
  
  // 4) Antécédents et facteurs de risque
  riskFactors: {
    smokingPA?: number;
    smokingStatus?: SmokingStatus;
    cigarettesPerDay?: number;
    smokingDurationYears?: number;
    smokingStoppedYear?: string;
    smokingPeriods?: SmokingPeriod[];
    cannabis?: {
      status: ConsumptionStatus;
      frequency?: string;
      duration?: string;
    };
    alcohol?: {
      status: ConsumptionStatus;
      frequency?: string;
      quantity?: string;
    };
    otherDrugs?: {
      status: 'OUI' | 'NON' | 'NON_RENSEIGNE';
      substance?: string;
      frequency?: string;
      duration?: string;
      route?: string;
    };
    medicalAntecedents?: string[];
    medicalAntecedentsOther?: string;
    biomassExposure?: boolean;
    tbContact?: boolean;
    allergiesAtopy?: string;
    previousTB?: boolean;
    hivStatus?: 'POSITIF' | 'NEGATIF' | 'INCONNU';
    diabetesHta?: string;
    occupationalExposure?: string; // Poussières de ciment, arachide, solvants...
    occupationalProfile?: OccupationalExposureProfile;
    surgicalHistory?: SurgicalHistoryEntry[];
    obgynHistory?: ObgynHistory;
  };
  antecedentsText?: string;
  
  // 5) Examen général et constantes
  vitals: {
    bp?: string; // Ex: 120/80 mmHg
    pulse?: number; // bpm
    rr?: number; // Fréquence respiratoire /min
    spo2Mode?: 'AIR_AMBIANT' | 'SOUS_O2';
    spo2Ambient?: number; // % en air ambiant
    spo2O2?: number; // % sous oxygène
    o2FlowLiters?: number; // L/min
    o2Device?: string; // Lunettes nasales, Masque simple, MHC...
    fio2?: number; // % FiO2 si disponible
    temperature?: number; // °C
    weight?: number; // kg
    height?: number; // cm
    bmi?: number;
    glasgowScore?: number; // /15
    painEva?: number; // 0 à 10
    generalState?: 'BON' | 'ALTERE_LEGER' | 'ALTERE_SEVERE' | 'CACHECTION';
  };
  vitalsSeries?: VitalsSeriesEntry[];
  
  // 6) Appareils et systèmes (avec parenthèses () sans signes préimprimés)
  systems: {
    pulmonaryVesicularBreath: string; // Murmure vésiculaire (conservé / diminué / aboli)
    pulmonaryCrackles: string; // Râles crépitants (absents / bases / apex)
    pulmonaryWheezes: string; // Sibilants ()
    pulmonaryRhonchi: string; // Ronchis / sous-crépitants ()
    pleuralFriction: string; // Frottement pleural ()
    cyanosisClubbing: string; // Cyanose / hippocratisme digital ()
    cardiovascular: string; // Bruits du coeur, turgescence jugulaire, reflux hépato-jugulaire ()
    abdomen: string; // Souple, hépatomégalie ()
    neurological: string; // Conscience, réflexes ()
    entLymphNodes: string; // Ganglions cervicaux, ADP ()
    cutaneous: string; // Éruption, sueurs nocturnes ()
  };
  
  // 7) Résumé syndromique
  syndromicSummary: string; // Ex: Syndrome de condensation pulmonaire fébrile, syndrome bronchique obstructif
  syndromicIntro?: string;
  syndromicSelectedAntecedents?: string[];
  syndromicItems?: SyndromicPriorityItem[];
  
  // 8) Hypothèses diagnostiques
  diagnosticHypotheses: string[];
  
  // 9) Examens complémentaires demandés
  paraclinicalOrdered: {
    chestXray?: boolean;
    chestCT?: boolean;
    spirometry?: boolean;
    bloodGas?: boolean;
    nfsCrp?: boolean;
    geneXpertBK?: boolean;
    pleuralPuncture?: boolean;
    otherNotes?: string;
    orderedExamsDetailed?: OrderedParaclinicalExam[];
  };
  
  // 10) Diagnostics retenus (multiples avec CIM-11, type et statut)
  diagnoses: ClinicalDiagnosis[];
  
  // 11) Conduite à tenir
  managementPlan: {
    medicationsPrescribed: string;
    antibioticStewardship?: {
      molecule: string;
      dose: string;
      route: string;
      durationDays: number;
      indication: string;
      reassessmentDate: string;
    };
    oxygenotherapy?: string;
    inhalationTherapy?: string;
    physiotherapy?: boolean;
    orientation: 'AMBULATOIRE' | 'HOSPITALISATION' | 'TRANSFERT';
    hospitalizationReason?: string;
  };
  
  // 12) Évolution et suivi
  followUp: {
    nextAppointmentDate?: string;
    keyWarningSigns?: string;
    notes?: string;
  };
}

export interface Consultation {
  id: string;
  centerId: string;
  patientId: string;
  doctorId?: string;
  doctorName?: string;
  date: string;
  
  // Données rapides et compatibilité
  chiefComplaint?: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  
  // Plan médical standardisé complet en 12 étapes
  twelveSteps?: ConsultationTwelveSteps;
  
  // Assistance IA horodatée
  aiAssistance?: {
    rawAudioTranscript?: string;
    extractedSummary?: string;
    suggestedHypotheses?: string[];
    missingFieldsIdentified?: string[];
    validatedByDoctor: boolean;
    validatedAt?: string;
  };
  
  createdAt: string;
  updatedAt: string;
  patientName?: string;
  ticketId?: string;
  serviceId?: string;
  serviceName?: string;
  prescriptionItems?: PrescriptionItem[];
  weight?: number;
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  spo2?: number;
  pulse?: number;
  symptoms?: string;
  officineOrderId?: string;
  pharmacyType?: string;
  officineName?: string;
  deliveryAddress?: string;
  deliveryPhone?: string;
  [key: string]: any;
}

export interface PrescriptionItem {
  medicineId?: string;
  medicineName: string;
  dosage: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  quantity: number;
  form?: string;
}

// -------------------------------------------------------------
// FORMULAIRES SPÉCIALISÉS PNEUMOLOGIE & INFECTIOLOGIE (Section 6 & 8)
// -------------------------------------------------------------
export type SpecializedFormType =
  | 'ASTHMA'
  | 'COPD'
  | 'TUBERCULOSIS'
  | 'TB_SEQUELAE'
  | 'PID_IPAF'
  | 'BRONCHIECTASIS'
  | 'PLEURAL_DISEASE'
  | 'THORACIC_CANCER'
  | 'PULMONARY_EMBOLISM'
  | 'ACUTE_PNEUMONIA'
  | 'ANTIBIOTIC_STEWARDSHIP';

export interface SpecializedPneumoRecord {
  id: string;
  patientId: string;
  centerId: string;
  doctorId: string;
  doctorName: string;
  formType: SpecializedFormType;
  date: string;
  title: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// SCORES CLINIQUES (Section 7 du Cahier des Charges)
// -------------------------------------------------------------
export interface ClinicalScoreCalculation {
  id: string;
  patientId: string;
  patientName?: string;
  centerId: string;
  doctorId: string;
  doctorName: string;
  scoreId:
    | 'mMRC'
    | 'CAT'
    | 'GOLD_ABE'
    | 'BODE'
    | 'DECAF'
    | 'ACT'
    | 'ACQ'
    | 'GINA'
    | 'TB_SCORE'
    | 'RALPH_SCORE'
    | 'CRB65'
    | 'CURB65'
    | 'PSI_PORT'
    | 'WELLS_PE'
    | 'GENEVA_REVISED'
    | 'PESI'
    | 'SPESI'
    | 'HESTIA'
    | 'GAP_ILD'
    | 'BSI_DDB'
    | 'FACED'
    | 'QSOFA'
    | 'SOFA'
    | 'NEWS2'
    | 'GLASGOW';
  scoreName: string;
  scoreCategory: 'ASTHMA' | 'COPD' | 'TUBERCULOSIS' | 'PNEUMONIA' | 'EMBOLISM' | 'ILD_DDB' | 'SEPSIS_NEURO';
  calculatedValue: number | string;
  variables: Record<string, any>;
  missingVariables?: string[];
  interpretation: string;
  clinicalRecommendation: string;
  referenceSource: string; // Ex: GINA 2024, GOLD 2024, BMJ 2021...
  date: string;
}

// -------------------------------------------------------------
// HOSPITALISATIONS & GESTION DES LITS (Section 9 du Cahier des Charges)
// -------------------------------------------------------------
export interface Bed {
  id: string;
  centerId: string;
  roomNumber: string;
  serviceCategory: 'PNEUMO_ISOLEMENT_TB' | 'PNEUMO_SOINS_CONTINUS_VNI' | 'PNEUMO_HOMMES' | 'PNEUMO_FEMMES' | 'INFECTIOLOGIE_GENERALE';
  status: 'available' | 'occupied' | 'maintenance';
  patientId?: string | null;
  patientName?: string | null;
  pricePerDay?: number;
}

export interface HospitalizationDailyNote {
  id?: string;
  date: string;
  time?: string;
  note: string;
  author: string;
  temperature?: number;
  bp?: string;
  spo2?: number;
  o2Flow?: number;
  evolution?: string;
}

export interface HospitalizationMedication {
  medicineName: string;
  dosage: string;
  frequency: string;
  route?: string;
  startDate?: string;
  endDate?: string;
  prescribedBy?: string;
}

export interface HospitalizationAdverseEvent {
  id: string;
  date: string;
  type: 'DESATURATION_AIGUE' | 'HEMOPTYSIE' | 'PNEUMOTHORAX_SOUS_VNI' | 'CHOC_SEPTIQUE' | 'REACTION_ALLERGIQUE' | 'AUTRE';
  severity: 'MODEREE' | 'GRAVE' | 'CRITIQUE';
  description: string;
  actionTaken: string;
  reportedBy: string;
}

export interface Hospitalization {
  id: string;
  centerId: string;
  patientId: string;
  patientName: string;
  patientGender: 'M' | 'F';
  patientAge: number;
  bedId: string;
  roomNumber: string;
  doctorName?: string;
  reason: string;
  admissionDiagnoses: ClinicalDiagnosis[];
  admissionDate: string;
  estimatedDischargeDate?: string;
  actualDischargeDate?: string;
  status: 'active' | 'discharged';
  dischargeType?: 'GUERISON_AMELIORATION' | 'TRANSFERT' | 'DECES' | 'CONTRE_AVIS_MEDICAL';
  dischargeDestination?: string; // Hôpital Fann, Domicile...
  dischargeSummary?: string;
  adverseEvents?: HospitalizationAdverseEvent[];
  dailyNotes?: HospitalizationDailyNote[];
  medications?: HospitalizationMedication[];
  totalCost?: number;
}

// -------------------------------------------------------------
// MODULE PARAMÉDICAL / SOINS INFIRMIERS (Section 13 du Cahier des Charges)
// -------------------------------------------------------------
export interface NurseVitalRecord {
  id: string;
  patientId: string;
  hospitalizationId?: string;
  centerId: string;
  timestamp: string;
  bp: string; // TA
  pulse: number; // FC
  rr: number; // FR
  spo2: number; // SpO2 %
  spo2Mode?: 'AIR_AMBIANT' | 'SOUS_O2';
  o2FlowLiters?: number; // Débit O2 L/min
  o2Device?: string; // Lunettes nasales, Masque simple, Masque HC, VNI...
  fio2?: number; // FiO2 %
  temperature: number; // T°C
  weight?: number; // kg
  height?: number; // cm
  bmi?: number; // IMC kg/m2
  generalState?: 'BON' | 'ALTERE_LEGER' | 'ALTERE_SEVERE' | 'CACHECTION';
  bloodGlucose?: number; // Glycémie g/L
  painEva?: number; // 0 - 10
  consciousnessGlasgow?: number; // 3 - 15
  nurseName: string;
  notes?: string;
}

export interface NurseRespiratoryRecord {
  id: string;
  patientId: string;
  hospitalizationId?: string;
  centerId: string;
  timestamp: string;
  o2FlowLiters: number; // Débit O2 L/min
  device: 'LUNETTES' | 'MASQUE_SIMPLE' | 'MASQUE_HAUTE_CONCENTRATION' | 'VNI_CPAP' | 'VNI_BIPAP' | 'AIR_AMBIANT';
  vniParameters?: {
    ipap?: number;
    epap?: number;
    fio2?: number;
  };
  tolerance: 'BONNE' | 'AGITATION' | 'FUITE' | 'ENCOMBREMENT';
  nurseName: string;
  notes?: string;
}

export interface FluidBalanceRecord {
  id: string;
  patientId: string;
  hospitalizationId?: string;
  centerId: string;
  date: string;
  period: 'MATIN' | 'SOIR' | 'NUIT' | '24H';
  oralIntakeMl: number;
  ivInfusionMl: number;
  diuresisMl: number;
  stoolStomasMl?: number;
  vomitingMl?: number;
  netBalanceMl: number; // (apports - pertes)
  nurseName: string;
}

export interface NurseAdministeredMed {
  id: string;
  patientId: string;
  hospitalizationId?: string;
  centerId: string;
  medicineName: string;
  dose: string;
  route: 'PO' | 'IV' | 'SC' | 'IM' | 'INHALATION' | 'NEBULISATION';
  scheduledTime: string;
  administeredAt: string;
  status: 'ADMINISTRE' | 'REFUSE' | 'REPORTE' | 'NON_DISPONIBLE';
  nurseName: string;
  nurseSignature: string;
  notes?: string;
}

export type NurseAdminMed = NurseAdministeredMed;
export type NurseMedAdministration = NurseAdministeredMed;

export interface NurseTargetedTransmission {
  id: string;
  patientId: string;
  patientName?: string;
  hospitalizationId?: string;
  centerId: string;
  timestamp: string;
  target: string; // Ex: 'Détresse respiratoire', 'Fièvre persistante', 'Douleur thoracique', 'Encombrement'
  data: string; // Données (D)
  action: string; // Actions (A)
  result: string; // Résultats (R)
  nurseName: string;
  nurseSignature: string;
}

// -------------------------------------------------------------
// EXPLORATIONS BIOLOGIQUES & IMAGERIE (Section 7, 8 & 9 du Cahier des Charges)
// -------------------------------------------------------------
export type ExplorationStatus =
  | 'REQUESTED'          // Demande créée
  | 'ACCEPTED'           // Demande prise en charge
  | 'SPECIMEN_COLLECTED' // Prélèvement effectué
  | 'IN_PROGRESS'        // Examen en cours d'analyse
  | 'RESULT_ENTERED'     // Résultat saisi, non validé
  | 'SUBMITTED'          // Résultat soumis pour validation médicale
  | 'VALIDATED'          // Résultat validé par une personne habilitée
  | 'AMENDED'            // Résultat amendé après validation (traçabilité V2+)
  | 'CANCELLED'          // Demande annulée avec motif obligatoire
  | 'REJECTED';          // Demande rejetée avec motif obligatoire

export type ExplorationPriority = 'NORMALE' | 'URGENTE' | 'CRITIQUE';

export type ExplorationCategory =
  | 'HEMATOLOGIE'
  | 'BIOCHIMIE'
  | 'INFLAMMATION'
  | 'MICROBIOLOGIE'
  | 'MYCOBACTERIOLOGIE'
  | 'VIROLOGIE'
  | 'MYCOLOGIE_PARASITOLOGIE'
  | 'IMMUNOLOGIE'
  | 'GAZOMETRIE'
  | 'ANAPATH'
  | 'EFR_RESPIRATOIRE'
  | 'CARDIOVASCULAIRE'
  | 'IMAGERIE'
  | 'AUTRES'
  // Compatibilité historique
  | 'HEMATOLOGIE_NFS'
  | 'BIOCHIMIE_IONO'
  | 'GAZOMETRIE_ARTERIELLE'
  | 'INFLAMMATION_CRP'
  | 'MICROBIOLOGIE_GENEXPERT_BK'
  | 'EFR_SPIROMETRIE'
  | 'RADIO_THORAX'
  | 'TDM_SCANNER_THORACIQUE'
  | 'ECHOGRAPHIE_PLEURALE';

export interface ExplorationExtractedItem {
  parameter: string; // Ex: Hémoglobine, CRP, PaO2, PaCO2, VEMS, GeneXpert MTB
  value: string; // Ex: 11.2, 85, 62, 1.45, Détecté trace
  unit: string; // Ex: g/dL, mg/L, mmHg, L
  referenceRange?: string; // Ex: 12.0 - 16.0
  referenceInterval?: string; // Compatibilité
  flag: 'NORMAL' | 'BAS' | 'ELEVE' | 'POSITIF' | 'ANORMAL' | 'CRITIQUE';
  criticalThreshold?: string; // Ex: < 7.0 g/dL ou > 60 mmHg
  confidence?: number; // 0 à 100 pour extraction OCR assistée
  notes?: string;
}

export interface StructuredImagingReport {
  technique: string; // Incidence face debout, TDM spiralé sans/avec injection...
  parenchyma: string; // Opacités, cavités, emphysème, bronchectasies, verre dépoli...
  bronchi: string; // Épaississement pariétal, impactions mucoïdes...
  pleura: string; // Épanchement pleural, épaississement, pneumothorax...
  mediastinum: string; // Adénomégalies hilaires ou médiastinales, silhouette cardiaque...
  vessels: string; // Artères pulmonaires, embolie, signes d'HTP...
  bones: string; // Côtes, rachis dorsal...
  conclusion: string; // Synthèse diagnostique
}

export interface ExplorationAuditEntry {
  id: string;
  timestamp: string;
  action: string; // 'CREATION' | 'ACCEPTATION' | 'PRELEVEMENT' | 'SAISIE_RESULTAT' | 'SOUMISSION' | 'VALIDATION' | 'AMENDEMENT' | 'REJET' | 'ANNULATION'
  userId: string;
  userName: string;
  userRole: string;
  notes?: string;
  details?: Record<string, any>;
}

export interface ExplorationResultVersion {
  versionNumber: number;
  enteredAt: string;
  enteredById: string;
  enteredByName: string;
  validatedAt?: string;
  validatedById?: string;
  validatedByName?: string;
  reasonForAmendment?: string;
  structuredParameters: ExplorationExtractedItem[];
  narrativeReport?: string;
  conclusion?: string;
}

export interface MedicalExploration {
  id: string;
  requestNumber: string; // Ex: EXP-2026-0042 (unique, lisible et non prédictible)
  patientId: string;
  patientName: string;
  patientHospitalNumber?: string;
  patientAge?: number;
  patientGender?: 'M' | 'F';
  centerId: string;
  consultationId?: string;
  episodeId?: string;
  category: ExplorationCategory;
  macroCategory?: 'BIOLOGIE' | 'MICROBIOLOGIE' | 'IMAGERIE' | 'CARDIOVASCULAIRE' | 'EFR' | 'AUTRES';
  subCategory?: string;
  title: string;
  examType?: string;
  clinicalIndication: string;
  priority: ExplorationPriority;
  status: ExplorationStatus;
  simpleStatus?: 'PRESCRIT' | 'EN_ATTENTE' | 'REALISE';
  date: string;
  prescribedDate?: string;
  realizationDate?: string;
  requestedAt: string;
  prescribedById: string;
  prescribedByName: string;
  laboratoryDestination: string; // Ex: Laboratoire Central CHREIN, Unité PNT, Service d'Imagerie
  
  // Prélèvement
  specimenType?: string; // Sang veineux, Crachats, Liquide pleural, Biopsie...
  specimenCollectedAt?: string;
  specimenCollectedBy?: string;
  
  // Résultats
  sourceType: 'PHOTO' | 'PDF' | 'DICOM' | 'SAISIE_DIRECTE';
  fileUrl?: string;
  attachmentName?: string;
  rawText?: string;
  extractedParameters: ExplorationExtractedItem[];
  spirometryData?: SpirometryStructuredData;
  followUpResults?: Array<{
    id: string;
    date: string;
    summary: string;
    parameters?: ExplorationExtractedItem[];
    conclusion?: string;
    attachmentName?: string;
    fileUrl?: string;
  }>;
  structuredImagingReport?: StructuredImagingReport;
  narrativeReport?: string;
  conclusion?: string;
  
  // Alertes
  hasAbnormalFlag?: boolean;
  hasCriticalFlag?: boolean;
  criticalAlertAcknowledged?: boolean;
  criticalAlertAcknowledgedBy?: string;
  criticalAlertAcknowledgedAt?: string;
  
  // Validation médicale
  validated: boolean;
  validatedByDoctor?: string;
  validatedById?: string;
  validationDate?: string;
  doctorNotes?: string;
  
  // Cycle de vie & révision
  rejectionReason?: string;
  cancellationReason?: string;
  currentVersion?: number;
  versions?: ExplorationResultVersion[];
  auditTrail?: ExplorationAuditEntry[];
  
  createdAt: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// RECHERCHE SCIENTIFIQUE & PILOTAGE (Section 14 du Cahier des Charges)
// -------------------------------------------------------------
export interface ResearchCohortFilter {
  centerId?: string;
  startDate?: string;
  endDate?: string;
  ageMin?: number;
  ageMax?: number;
  gender?: 'M' | 'F' | 'ALL';
  pathologyCategory?: string; // TB, BPCO, Asthme, PID, DDB, Pneumonie...
  diagnosisStatus?: DiagnosisStatus;
  isHospitalized?: boolean;
  evolutionOutcome?: string;
}

export interface PseudonymizedResearchRecord {
  pseudoId: string; // Ex: RES-KAO-0012 (pas de nom ni téléphone)
  centerType: string;
  age: number;
  gender: 'M' | 'F';
  regionDistrict: string;
  primaryDiagnosis: string;
  cim11Code: string;
  secondaryDiagnoses: string[];
  smokingPackYears?: number;
  biomassExposure?: boolean;
  vemsValue?: string;
  crpValue?: string;
  geneXpertResult?: string;
  lengthOfStayDays?: number;
  outcome: 'AMELIORE' | 'DECEDE' | 'TRANSFERE' | 'PERDU_DE_VUE';
}

// -------------------------------------------------------------
// RENDEZ-VOUS & SUIVI DU SERVICE
// -------------------------------------------------------------
export interface Appointment {
  id: string;
  centerId: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
  appointmentType?: 'SUIVI_TB_M2' | 'SUIVI_TB_M5' | 'SUIVI_TB_M6' | 'CONTROLE_ASTHME' | 'CONTROLE_BPCO' | 'POST_HOSPITALISATION' | 'PREMIERE_CONSULTATION';
  status: AppointmentStatus;
  smsSent: boolean;
  reminderSent: boolean;
  doctorId?: string;
  doctorName?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// DOCUMENTS MÉDICAUX OFFICIELS CHREIN (Section 10 du Cahier des Charges)
// -------------------------------------------------------------
export type MedicalDocumentType = 
  | 'CRH' // Compte-Rendu d'Hospitalisation / Résumé de sortie
  | 'ORDONNANCE' // Ordonnance Médicale Sécurisée
  | 'CERTIFICAT' // Certificat Médical / Repos / Non-contagion TB
  | 'DEMANDE_EXAMENS' // Bon d'Examens & Demande d'imagerie/labo
  | 'FICHE_LIAISON' // Fiche de Liaison Médicale & Contre-Référence
  | 'EVACUATION'; // Fiche d'Évacuation Sanitaire Inter-Hospitalière

export type MedicalDocumentStatus = 'BROUILLON' | 'SIGNE_VALIDE' | 'DELIVRE';

export interface MedicalDocumentRecord {
  id: string;
  referenceNumber: string; // Ex: DOC-CHREIN-2026-0042
  centerId: string;
  patientId: string;
  patientName: string;
  patientHospitalNumber?: string;
  patientAge: number;
  patientGender: 'M' | 'F';
  patientAddress?: string;
  patientPhone?: string;
  type: MedicalDocumentType;
  title: string;
  content: string; // Corps textuel structuré du document
  metadata?: {
    admissionDate?: string;
    dischargeDate?: string;
    hospitalizationRoom?: string;
    diagnosesCim11?: string[];
    medicationsPrescribed?: string;
    restDurationDays?: number;
    destinationHospital?: string;
    attendingPhysician?: string;
    vitalSignsAtDischarge?: string;
    paraclinicalFindings?: string;
    followUpDate?: string;
    qrCodeString?: string;
    costFcfa?: number;
  };
  status: MedicalDocumentStatus;
  createdById: string;
  createdByName: string;
  createdAt: string;
  signedById?: string;
  signedByName?: string;
  signedAt?: string;
  notes?: string;
}

// Stubs for legacy data compatibility if any file still references them
export interface Service {
  id: string;
  centerId: string;
  name: string;
  category: string;
  price: number;
  emergencyPrice?: number;
  ipmPrice?: number;
  insurancePrice?: number;
  description?: string;
  durationMinutes?: number;
  isActive: boolean;
}

export interface TicketServiceItem {
  id: string;
  name: string;
  category?: string;
  price: number;
  status?: string;
}

export interface Ticket {
  id: string;
  centerId: string;
  ticketNumber: string;
  patientId?: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F';
  patientPhone?: string;
  patientAddress?: string;
  serviceId: string;
  serviceName: string;
  serviceCategory?: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  doctorId?: string;
  notes?: string;
  services?: any[];
  insuranceCoverage?: any;
}

export interface Medicine {
  id: string;
  centerId: string;
  name: string;
  dci: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  price: number;
  expiryDate: string;
  category: string;
  batchNumber: string;
  form?: string;
  dosage?: string;
}

export interface Sale {
  id: string;
  centerId: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: any[];
  ticketId?: string;
  patientName?: string;
}

export interface LabResult {
  id: string;
  centerId: string;
  patientId: string;
  patientName: string;
  testName: string;
  category: string;
  status: string;
  result: any;
  doctorId: string;
  doctorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  centerId: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  createdBy: string;
  createdAt: string;
  description?: string;
  receiptName?: string;
  receiptData?: string;
}

export interface BankTransfer {
  id: string;
  centerId: string;
  amount: number;
  method: string;
  bankName: string;
  referenceNumber: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

export type BankTransferMethod = any;
export type LabStructuredData = any;
export type LabAnalysisType = any;
export type LabAnalysisRow = any;

export interface MutualFirm {
  id: string;
  name: string;
  code: string;
  coveragePercent: number;
  unsettledAmount: number;
}
export const PARTNER_MUTUALS: MutualFirm[] = [];

export interface OfficinePartner {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  deliveryAvailable: boolean;
  deliveryFee: number;
  managerUserId?: string;
  managerEmail?: string;
  [key: string]: any;
}
export interface OfficineOrderItem {
  medicineName: string;
  dosage: string;
  quantity: number;
}
export interface OfficinePrescriptionOrder {
  id: string;
  patientName: string;
  status: any;
  items: any[];
  consultationId?: string;
  centerId?: string;
  createdAt?: string;
  [key: string]: any;
}
export type OfficineOrderStatus = any;
export interface ClinicProspect {
  id: string;
  name: string;
  category: any;
  city: string;
  district: string;
  address: string;
  directorName: string;
  phone: string;
  email: string;
  status: any;
  priorityPitch: string;
  estimatedCapacity: number;
  doctorsCount: number;
  estimatedDailyConsultations: number;
  keyNeeds: string[];
  whatsapp?: string;
  notes?: string;
  lastContactDate?: string;
  createdAt?: string;
  [key: string]: any;
}
export type ProspectStatus = any;
