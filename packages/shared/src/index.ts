// Packages/Shared — DPI CHREIN (Kaolack, Sénégal)
// Types, énumérations et contrats partagés entre le frontend Next.js et le backend NestJS.

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  STRUCTURE_ADMIN = 'STRUCTURE_ADMIN',
  CLINICIAN = 'CLINICIAN',
  NURSE = 'NURSE',
  SECRETARY = 'SECRETARY',
  LABORATORY = 'LABORATORY',
  VIEWER = 'VIEWER'
}

export enum ExplorationCategory {
  BIOLOGIE_MEDICALE = 'BIOLOGIE_MEDICALE',
  MICROBIOLOGIE = 'MICROBIOLOGIE',
  IMAGERIE = 'IMAGERIE',
  EFR_FONCTIONNEL = 'EFR_FONCTIONNEL',
  ENDOSCOPIE = 'ENDOSCOPIE',
  GAZOMETRIE = 'GAZOMETRIE',
  ANAPATH = 'ANAPATH'
}

export enum ExplorationPriority {
  NORMALE = 'NORMALE',
  URGENTE = 'URGENTE',
  CRITIQUE = 'CRITIQUE'
}

export enum ExplorationStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  SPECIMEN_COLLECTED = 'SPECIMEN_COLLECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESULT_ENTERED = 'RESULT_ENTERED',
  SUBMITTED = 'SUBMITTED',
  VALIDATED = 'VALIDATED',
  AMENDED = 'AMENDED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED'
}

export enum ResultStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  VALIDATED = 'VALIDATED',
  AMENDED = 'AMENDED'
}

export interface StructuredParameter {
  parameter: string;
  value: string;
  unit: string;
  referenceInterval?: string;
  flag?: 'NORMAL' | 'ANORMAL' | 'CRITIQUE_HAUT' | 'CRITIQUE_BAS' | 'POSITIF' | 'NEGATIF' | 'ELEVE' | 'BAS';
}

export interface ExplorationAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  userName: string;
  userRole: string;
  notes?: string;
}

export interface ExplorationResultVersion {
  versionNumber: number;
  enteredAt: string;
  enteredById: string;
  enteredByName: string;
  validatedAt?: string;
  validatedById?: string;
  validatedByName?: string;
  structuredParameters: StructuredParameter[];
  narrativeResult?: string;
  conclusion?: string;
  amendmentReason?: string;
}

export interface MedicalExplorationDto {
  id: string;
  requestNumber: string;
  patientId: string;
  patientName: string;
  patientHospitalNumber?: string;
  patientAge?: number;
  patientGender?: 'M' | 'F';
  centerId: string;
  category: ExplorationCategory;
  title: string;
  examType: string;
  clinicalIndication: string;
  priority: ExplorationPriority;
  status: ExplorationStatus;
  date: string;
  requestedAt: string;
  prescribedById: string;
  prescribedByName: string;
  laboratoryDestination?: string;
  specimenType?: string;
  specimenCollectedAt?: string;
  specimenCollectedBy?: string;
  extractedParameters?: StructuredParameter[];
  narrativeReport?: string;
  conclusion?: string;
  hasAbnormalFlag: boolean;
  hasCriticalFlag: boolean;
  validated: boolean;
  validatedByDoctor?: string;
  validatedById?: string;
  validationDate?: string;
  doctorNotes?: string;
  currentVersion: number;
  versions?: ExplorationResultVersion[];
  auditTrail: ExplorationAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

// Machine à états autorisée
export const ALLOWED_STATUS_TRANSITIONS: Record<ExplorationStatus, ExplorationStatus[]> = {
  [ExplorationStatus.REQUESTED]: [
    ExplorationStatus.ACCEPTED,
    ExplorationStatus.CANCELLED,
    ExplorationStatus.REJECTED
  ],
  [ExplorationStatus.ACCEPTED]: [
    ExplorationStatus.SPECIMEN_COLLECTED,
    ExplorationStatus.IN_PROGRESS,
    ExplorationStatus.CANCELLED
  ],
  [ExplorationStatus.SPECIMEN_COLLECTED]: [
    ExplorationStatus.IN_PROGRESS,
    ExplorationStatus.CANCELLED
  ],
  [ExplorationStatus.IN_PROGRESS]: [
    ExplorationStatus.RESULT_ENTERED,
    ExplorationStatus.CANCELLED
  ],
  [ExplorationStatus.RESULT_ENTERED]: [
    ExplorationStatus.SUBMITTED,
    ExplorationStatus.IN_PROGRESS,
    ExplorationStatus.CANCELLED
  ],
  [ExplorationStatus.SUBMITTED]: [
    ExplorationStatus.VALIDATED,
    ExplorationStatus.RESULT_ENTERED, // Demande de correction
    ExplorationStatus.CANCELLED
  ],
  [ExplorationStatus.VALIDATED]: [
    ExplorationStatus.AMENDED // Version V2+ uniquement avec motif
  ],
  [ExplorationStatus.AMENDED]: [
    ExplorationStatus.AMENDED // Nouvelle révision
  ],
  [ExplorationStatus.CANCELLED]: [],
  [ExplorationStatus.REJECTED]: []
};

// Matrice RBAC pour la validation des résultats
export function canUserValidateExploration(role: Role): boolean {
  return [Role.CLINICIAN, Role.STRUCTURE_ADMIN, Role.SUPER_ADMIN].includes(role);
}
