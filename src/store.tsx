import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  User, HealthCenter, Ticket, Service, Medicine, Sale, Role, 
  TicketStatus, Consultation, Patient, LabResult, Appointment, AppointmentStatus, PrescriptionItem,
  Bed, Hospitalization, MutualFirm, PARTNER_MUTUALS, Expense, BankTransfer,
  OfficinePartner, OfficinePrescriptionOrder, OfficineOrderStatus, OfficineOrderItem, ClinicProspect, ProspectStatus,
  SpecializedPneumoRecord, ClinicalScoreCalculation, NurseVitalRecord, NurseRespiratoryRecord,
  FluidBalanceRecord, NurseAdministeredMed, NurseAdminMed, NurseTargetedTransmission, MedicalExploration,
  MedicalDocumentRecord
} from './types';

export interface PlanMetadata {
  id: 'basic' | 'pro' | 'expert';
  name: string;
  price: number;
  description: string;
  allowedModules: string[];
}

const DEFAULT_SUBSCRIPTION_PLANS: Record<'basic' | 'pro' | 'expert', PlanMetadata> = {
  basic: { id: 'basic', name: 'Standard Hospitalier', price: 0, description: 'Service Pneumologie CHREIN', allowedModules: ['patients', 'consultations', 'specialized-forms', 'clinical-scores', 'hospitalization', 'nursing', 'explorations', 'imaging-ai', 'research-stats', 'appointments', 'users'] },
  pro: { id: 'pro', name: 'Professionnel Hospitalier', price: 0, description: 'Service Pneumologie CHREIN', allowedModules: ['patients', 'consultations', 'specialized-forms', 'clinical-scores', 'hospitalization', 'nursing', 'explorations', 'imaging-ai', 'research-stats', 'appointments', 'users'] },
  expert: { id: 'expert', name: 'Hospitalier CHREIN Spécialisé', price: 0, description: 'Service Pneumologie & Maladies Infectieuses CHREIN', allowedModules: ['patients', 'consultations', 'specialized-forms', 'clinical-scores', 'hospitalization', 'nursing', 'explorations', 'imaging-ai', 'research-stats', 'appointments', 'users'] }
};

// Stubs for legacy / compatibility exports
export const db = null as any;
export const auth = null as any;

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let userEmail: string | undefined;
  let userId: string | undefined;
  try {
    const saved = localStorage.getItem('current_user');
    if (saved) {
      const u = JSON.parse(saved);
      userEmail = u?.email;
      userId = u?.id;
    }
  } catch {}

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId,
      email: userEmail,
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Store Operation Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const MOCK_CENTERS: HealthCenter[] = [
  {
    id: 'center-1',
    name: 'CHREIN — Service de Pneumologie et Maladies Infectieuses',
    hospitalName: 'Centre Hospitalier Régional El Hadji Ibrahima Niass',
    serviceName: 'Service de Pneumologie et Maladies Infectieuses',
    locationCity: 'Kaolack, Sénégal',
    address: 'Route Nationale, Quartier Ndangane, Kaolack',
    phone: '+221 33 941 12 34',
    email: 'pneumo.chrein@sante.gouv.sn',
    directorName: 'Pr. / Dr. Cheikh Ndao (Chef de Service)',
    rnis: 'SN-KLK-CHREIN-01',
    capacity: 30,
    pispialias: 'CHREIN_PNEUMO_KAOLACK',
    isActive: true,
    structureType: 'CHREIN_HOPITAL',
    subscriptionPlan: 'expert',
    subscriptionStatus: 'active'
  },
  {
    id: 'center-2',
    name: 'Clinique Médicale Privée du Saloum',
    address: 'Boulevard Cheikh Ibrahima Fall, Kaolack',
    phone: '+221 33 941 55 55',
    email: 'contact@clinique-saloum.sn',
    directorName: 'Dr. Aminata Touré',
    rnis: 'SN-KLK-CLIN-02',
    capacity: 15,
    pispialias: 'CLINIQUE_SALOUM',
    isActive: true,
    structureType: 'CLINIQUE_PRIVEE',
    subscriptionPlan: 'pro',
    subscriptionStatus: 'active'
  },
  {
    id: 'center-3',
    name: 'Cabinet Médical de Pneumologie (Activité Libérale)',
    address: 'Avenue Valdiodio Ndiaye, Kaolack',
    phone: '+221 77 650 00 11',
    email: 'consultation@cabinet-pneumo.sn',
    directorName: 'Dr. Cheikh Ndao',
    capacity: 5,
    isActive: true,
    structureType: 'CABINET_INDIVIDUEL',
    subscriptionPlan: 'pro',
    subscriptionStatus: 'active'
  }
];

const MOCK_USERS: User[] = [
  { id: 'u1', centerId: 'center-1', name: 'Dr. Cheikh Ndao', email: 'doc@chrein.sn', role: Role.DOCTOR, specialty: 'Chef de Service - Pneumologie & Maladies Infectieuses', phone: '+221 77 111 22 33', avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80', password: 'password' },
  { id: 'u2', centerId: 'center-1', name: 'Dr. Aminata Touré', email: 'toure@chrein.sn', role: Role.DOCTOR, specialty: 'Pneumo-Phtisiologue', phone: '+221 77 222 33 44', password: 'password' },
  { id: 'u3', centerId: 'center-1', name: 'Mme Fatou Binetou Sarr', email: 'infirmiere@chrein.sn', role: Role.NURSE, specialty: 'Infirmière Major - Soins Respiratoires & Transmissions', phone: '+221 77 333 44 55', password: 'password' },
  { id: 'u4', centerId: 'center-1', name: 'M. Mamadou Diallo', email: 'infirmier@chrein.sn', role: Role.NURSE, specialty: 'Infirmier d\'Hospitalisation & VNI', phone: '+221 77 444 55 66', password: 'password' },
  { id: 'u5', centerId: '', name: 'Ministère de la Santé (DPI National)', email: 'superadmin@senegal-sante.sn', role: Role.SUPER_ADMIN, phone: '338000000', password: 'SenegalSante2026!' },
  { id: 'u-admin', centerId: 'center-1', name: 'Admin Médical CHREIN', email: 'admin@chrein.sn', role: Role.ADMIN, phone: '+221 33 941 12 34', password: 'password' },
  // Fallbacks for testing
  { id: 'u-leg1', centerId: 'center-1', name: 'Dr. Cheikh Ndao', email: 'doc@medina.sn', role: Role.DOCTOR, specialty: 'Chef de Service - Pneumologie', phone: '771111111', password: 'password' },
  { id: 'u-leg2', centerId: 'center-1', name: 'Admin Médical CHREIN', email: 'admin@medina.sn', role: Role.ADMIN, phone: '770000000', password: 'password' }
];

const MOCK_SERVICES: Service[] = [
  { id: 's1', centerId: 'center-1', name: 'Consultation Spécialisée Pneumologie', category: 'Consultation', price: 0, isActive: true },
  { id: 's2', centerId: 'center-1', name: 'Spirométrie / EFR avec test de réversibilité', category: 'Exploration', price: 0, isActive: true },
  { id: 's3', centerId: 'center-1', name: 'Ponction Pleurale Écho-guidée', category: 'Geste', price: 0, isActive: true },
  { id: 's4', centerId: 'center-1', name: 'Gazométrie Artérielle', category: 'Exploration', price: 0, isActive: true }
];

const MOCK_MEDICINES: Medicine[] = [
  { id: 'm1', centerId: 'center-1', name: 'RHZE (Rifampicine/Isoniazide/Pyrazinamide/Éthambutol)', dci: 'RHZE', stock: 500, minStock: 50, price: 0, expiryDate: '2027-12-31', category: 'Antituberculeux', batchNumber: 'PNT-2026-01' },
  { id: 'm2', centerId: 'center-1', name: 'Salbutamol Aérosol-doseur 100µg', dci: 'Salbutamol', stock: 120, minStock: 20, price: 0, expiryDate: '2027-06-30', category: 'Bronchodilatateur', batchNumber: 'LOT-SALB-01' },
  { id: 'm3', centerId: 'center-1', name: 'Béclométasone/Formotérol 100/6µg', dci: 'Béclométasone/Formotérol', stock: 80, minStock: 15, price: 0, expiryDate: '2027-04-15', category: 'CSI-LABA', batchNumber: 'LOT-BEC-02' },
  { id: 'm4', centerId: 'center-1', name: 'Ceftriaxone 1g Injectable', dci: 'Ceftriaxone', stock: 150, minStock: 30, price: 0, expiryDate: '2026-12-31', category: 'Antibiotique', batchNumber: 'LOT-CEFT-03' }
];

const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    centerId: 'center-1',
    code: 'IP-2026-0041',
    hospitalNumber: 'CHREIN-PNEUMO-2026-014',
    firstName: 'Mamadou',
    lastName: 'Diop',
    age: 46,
    birthDate: '1980-04-12',
    gender: 'M',
    phone: '+221 77 512 34 56',
    address: 'Quartier Ndangane, Kaolack',
    profession: 'Commerçant au marché central',
    emergencyContact: 'Mariama Diop (Épouse) - 77 654 32 10',
    bloodGroup: 'O+',
    allergies: 'Aucune connue',
    chronicConditions: 'Tuberculose pulmonaire TPM+ sensible (sous 2RHZE, M1), HTA',
    smokingHistory: { isSmoker: true, packYears: 18, stoppedYear: '2024', biomassExposure: false },
    createdAt: new Date().toISOString()
  },
  {
    id: 'p2',
    centerId: 'center-1',
    code: 'IP-2026-0088',
    hospitalNumber: 'CHREIN-PNEUMO-2026-052',
    firstName: 'Aissatou',
    lastName: 'Sow',
    age: 34,
    birthDate: '1992-09-18',
    gender: 'F',
    phone: '+221 78 234 56 78',
    address: 'Quartier Kasnack, Kaolack',
    profession: 'Enseignante',
    emergencyContact: 'Amadou Sow (Frère) - 76 112 23 34',
    bloodGroup: 'A+',
    allergies: 'Aspirine / AINS (Syndrome de Widal suspecté)',
    chronicConditions: 'Asthme sévère non contrôlé sous CSI/LABA fort dosage',
    smokingHistory: { isSmoker: false, biomassExposure: true },
    createdAt: new Date().toISOString()
  },
  {
    id: 'p3',
    centerId: 'center-1',
    code: 'IP-2026-0105',
    hospitalNumber: 'CHREIN-PNEUMO-2026-068',
    firstName: 'Ibrahima',
    lastName: 'Cissé',
    age: 62,
    birthDate: '1964-01-20',
    gender: 'M',
    phone: '+221 70 890 12 34',
    address: 'Quartier Médina Baye, Kaolack',
    profession: 'Chauffeur retraité',
    emergencyContact: 'Cheikh Cissé (Fils) - 77 345 67 89',
    bloodGroup: 'B+',
    allergies: 'Aucune',
    chronicConditions: 'BPCO Post-tabagique Stade 3 GOLD Groupe E, Emphysème centrolobulaire, Exacerbations fréquentes sous VNI',
    smokingHistory: { isSmoker: true, packYears: 35, biomassExposure: false },
    createdAt: new Date().toISOString()
  },
  {
    id: 'p4',
    centerId: 'center-1',
    code: 'IP-2026-0142',
    hospitalNumber: 'CHREIN-PNEUMO-2026-095',
    firstName: 'Ousmane',
    lastName: 'Ba',
    age: 52,
    birthDate: '1974-06-11',
    gender: 'M',
    phone: '+221 76 432 10 98',
    address: 'Commune de Nioro du Rip, Région de Kaolack',
    profession: 'Agriculteur',
    emergencyContact: 'Fatou Ba (Sœur) - 77 876 54 32',
    chronicConditions: 'Séquelles de Tuberculose traitée en 2018 (Cavités résiduelles sommet droit, fibrose rétractile, DDB par traction)',
    smokingHistory: { isSmoker: false, biomassExposure: true },
    createdAt: new Date().toISOString()
  },
  {
    id: 'p5',
    centerId: 'center-1',
    code: 'IP-2026-0180',
    hospitalNumber: 'CHREIN-PNEUMO-2026-112',
    firstName: 'Khady',
    lastName: 'Fall',
    age: 58,
    birthDate: '1968-12-05',
    gender: 'F',
    phone: '+221 77 901 23 45',
    address: 'Quartier Sara Ndiougary, Kaolack',
    profession: 'Ménagère',
    chronicConditions: 'Pneumopathie Interstitielle Diffuse (PID) fibrosante, Râles crépitants type velcro bilatéraux',
    smokingHistory: { isSmoker: false, biomassExposure: true },
    createdAt: new Date().toISOString()
  },
  {
    id: 'p6',
    centerId: 'center-1',
    code: 'IP-2026-0210',
    hospitalNumber: 'CHREIN-PNEUMO-2026-133',
    firstName: 'Abdoulaye',
    lastName: 'Guèye',
    age: 67,
    birthDate: '1959-03-30',
    gender: 'M',
    phone: '+221 77 333 44 55',
    address: 'Guinguinéo, Région de Kaolack',
    chronicConditions: 'Pneumonie Aiguë Communautaire bactérienne sévère (CURB-65 = 3, sous oxygène et Ceftriaxone)',
    smokingHistory: { isSmoker: true, packYears: 20, biomassExposure: false },
    createdAt: new Date().toISOString()
  }
];

const MOCK_TICKETS: Ticket[] = [
  {
    id: 't1',
    centerId: 'center-1',
    ticketNumber: 'CS-20260521-001',
    patientId: 'p1',
    patientName: 'Mamadou Diop',
    patientAge: 44,
    patientGender: 'M',
    patientPhone: '771234567',
    patientAddress: 'Médina Rue 6 x 11, Dakar',
    serviceId: 's1',
    serviceName: 'Consultation Générale',
    serviceCategory: 'Consultation',
    services: [
      { id: 's1', name: 'Consultation Générale', category: 'Consultation', price: 2000, status: 'COMPLETED', performedBy: 'Dr. Moussa Fall' }
    ],
    amount: 2000,
    paymentMethod: 'CASH',
    status: TicketStatus.COMPLETED,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 3.5).toISOString()
  },
  {
    id: 't2',
    centerId: 'center-1',
    ticketNumber: 'CS-20260521-002',
    patientId: 'p2',
    patientName: 'Aissatou Sow',
    patientAge: 29,
    patientGender: 'F',
    patientPhone: '779876543',
    patientAddress: 'Fass Delorme, Dakar',
    serviceId: 's2,s5',
    serviceName: 'Consultation Prénatale + Échographie',
    serviceCategory: 'Maternité',
    services: [
      { id: 's2', name: 'Consultation Prénatale', category: 'Maternité', price: 1500, status: 'IN_PROGRESS', performedBy: 'Dr. Moussa Fall' },
      { id: 's5', name: 'Échographie Obstétricale', category: 'Imagerie', price: 10000, status: 'WAITING' }
    ],
    amount: 11500,
    paymentMethod: 'MOBILE_MONEY',
    status: TicketStatus.IN_PROGRESS,
    doctorId: 'u2',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 't3',
    centerId: 'center-1',
    ticketNumber: 'CS-20260521-003',
    patientId: 'p3',
    patientName: 'Ibrahima Ndiaye',
    patientAge: 9,
    patientGender: 'M',
    patientPhone: '706543210',
    patientAddress: 'Gueule Tapée, Dakar',
    serviceId: 's6',
    serviceName: 'NFS (Hémogramme)',
    serviceCategory: 'Laboratoire',
    services: [
      { id: 's6', name: 'NFS (Hémogramme)', category: 'Laboratoire', price: 3000, status: 'WAITING' }
    ],
    amount: 3000,
    paymentMethod: 'CASH',
    status: TicketStatus.WAITING,
    createdAt: new Date().toISOString()
  }
];

const MOCK_CONSULTATIONS: Consultation[] = [
  {
    id: 'c1',
    centerId: 'center-1',
    ticketId: 't1',
    patientId: 'p1',
    doctorId: 'u2',
    patientName: 'Mamadou Diop',
    doctorName: 'Dr. Moussa Fall',
    serviceName: 'Consultation Générale',
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    weight: 78,
    temperature: 38.6,
    bloodPressure: '130/85',
    symptoms: 'Fièvre, frissons et toux sèche depuis 3 jours.',
    diagnosis: 'Paludisme simple suspecté + Bronchite légère',
    prescription: JSON.stringify([
      { medicineId: 'm3', medicineName: 'Artéméther/Luméfantrine (Coartem)', dosage: '1 comprimé matin et soir pendant 3 jours', quantity: 6 },
      { medicineId: 'm1', medicineName: 'Paracétamol 500mg', dosage: '1 comprimé toutes les 8h si fièvre', quantity: 10 }
    ]),
    prescriptionItems: [
      { medicineId: 'm3', medicineName: 'Artéméther/Luméfantrine (Coartem)', dosage: '1 comprimé matin et soir pendant 3 jours', quantity: 6 },
      { medicineId: 'm1', medicineName: 'Paracétamol 500mg', dosage: '1 comprimé toutes les 8h si fièvre', quantity: 10 }
    ],
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    centerId: 'center-1',
    patientId: 'p1',
    patientName: 'Mamadou Diop',
    patientPhone: '771234567',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:00',
    reason: 'Suivi post-paludisme',
    status: AppointmentStatus.SCHEDULED,
    smsSent: true,
    reminderSent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    doctorId: 'u2',
    doctorName: 'Dr. Moussa Fall'
  }
];

const MOCK_BEDS: Bed[] = [
  { id: 'b1', centerId: 'center-1', roomNumber: 'Lit 101 (Isolement TB)', serviceCategory: 'PNEUMO_ISOLEMENT_TB', status: 'available', pricePerDay: 0 },
  { id: 'b2', centerId: 'center-1', roomNumber: 'Lit 102 (Isolement TB)', serviceCategory: 'PNEUMO_ISOLEMENT_TB', status: 'occupied', patientId: 'p1', patientName: 'Mamadou Diop', pricePerDay: 0 },
  { id: 'b3', centerId: 'center-1', roomNumber: 'Lit 201 (Soins Continus VNI)', serviceCategory: 'PNEUMO_SOINS_CONTINUS_VNI', status: 'occupied', patientId: 'p3', patientName: 'Ibrahima Cissé', pricePerDay: 0 },
  { id: 'b4', centerId: 'center-1', roomNumber: 'Lit 202 (Soins Continus VNI)', serviceCategory: 'PNEUMO_SOINS_CONTINUS_VNI', status: 'available', pricePerDay: 0 },
  { id: 'b5', centerId: 'center-1', roomNumber: 'Lit 301 (Pneumo Hommes)', serviceCategory: 'PNEUMO_HOMMES', status: 'occupied', patientId: 'p6', patientName: 'Abdoulaye Guèye', pricePerDay: 0 },
  { id: 'b6', centerId: 'center-1', roomNumber: 'Lit 302 (Pneumo Hommes)', serviceCategory: 'PNEUMO_HOMMES', status: 'available', pricePerDay: 0 },
  { id: 'b7', centerId: 'center-1', roomNumber: 'Lit 401 (Pneumo Femmes)', serviceCategory: 'PNEUMO_FEMMES', status: 'available', pricePerDay: 0 },
  { id: 'b8', centerId: 'center-1', roomNumber: 'Lit 501 (Maladies Infectieuses)', serviceCategory: 'INFECTIOLOGIE_GENERALE', status: 'available', pricePerDay: 0 }
];

const MOCK_HOSPITALIZATIONS: Hospitalization[] = [
  {
    id: 'h1',
    centerId: 'center-1',
    patientId: 'p1',
    patientName: 'Mamadou Diop',
    patientGender: 'M',
    patientAge: 46,
    bedId: 'b2',
    roomNumber: 'Lit 102 (Isolement TB)',
    doctorName: 'Dr. Cheikh Ndao',
    reason: 'Tuberculose pulmonaire TPM+ sévère avec hémoptysie minime et altération marquée de l\'état général',
    admissionDiagnoses: [
      { id: 'd1', codeCIM11: '1B10.0', label: 'Tuberculose pulmonaire TPM+', type: 'PRINCIPAL', status: 'CONFIRME', dateDiagnosed: '2026-10-18' }
    ],
    admissionDate: new Date(Date.now() - 3600000 * 48).toISOString().split('T')[0],
    status: 'active',
    dailyNotes: [
      { date: new Date(Date.now() - 3600000 * 24).toISOString().split('T')[0], note: 'Patient apyrétique sous 2RHZE. Pas de récidive d\'hémoptysie. Bonne tolérance gastrique.', author: 'Dr. Cheikh Ndao' }
    ],
    medications: [
      { medicineName: 'RHZE (Rifampicine/Isoniazide/Pyrazinamide/Éthambutol)', dosage: '4 cp le matin à jeun', frequency: 'Quotidien' },
      { medicineName: 'Vitamine B6', dosage: '50mg', frequency: '1 cp/jour' }
    ]
  },
  {
    id: 'h2',
    centerId: 'center-1',
    patientId: 'p3',
    patientName: 'Ibrahima Cissé',
    patientGender: 'M',
    patientAge: 62,
    bedId: 'b3',
    roomNumber: 'Lit 201 (Soins Continus VNI)',
    doctorName: 'Dr. Aminata Touré',
    reason: 'Exacerbation aiguë sévère de BPCO avec acidose respiratoire et hypercapnie sous VNI BiPAP',
    admissionDiagnoses: [
      { id: 'd2', codeCIM11: 'CA22.0', label: 'Exacerbation aiguë de BPCO', type: 'PRINCIPAL', status: 'CONFIRME', dateDiagnosed: '2026-10-20' }
    ],
    admissionDate: new Date(Date.now() - 3600000 * 36).toISOString().split('T')[0],
    status: 'active',
    dailyNotes: [
      { date: new Date().toISOString().split('T')[0], note: 'Séance de VNI 2h le matin bien tolérée. PaCO2 en amélioration (48 mmHg vs 58 à l\'entrée).', author: 'Dr. Aminata Touré' }
    ],
    medications: [
      { medicineName: 'Nébulisation Salbutamol/Ipratropium', dosage: '5mg/0.5mg', frequency: 'Toutes les 6h' },
      { medicineName: 'Méthylprednisolone IV', dosage: '40mg/j', frequency: 'Pendant 5 jours' }
    ]
  }
];

const MOCK_SPECIALIZED_RECORDS: SpecializedPneumoRecord[] = [
  {
    id: 'spec-1',
    patientId: 'p1',
    centerId: 'center-1',
    doctorId: 'u1',
    doctorName: 'Dr. Cheikh Ndao',
    formType: 'TUBERCULOSIS',
    date: new Date().toISOString(),
    title: 'Fiche Spécialisée — Tuberculose & Résistance (PNT)',
    data: {
      tbForm: 'TPM_PLUS',
      genexpertResult: 'MTB_POS_RIF_SENS',
      regimen: '2RHZE_4RH',
      treatmentStartDate: '2026-10-18',
      adherence: 'BONNE'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'spec-2',
    patientId: 'p3',
    centerId: 'center-1',
    doctorId: 'u2',
    doctorName: 'Dr. Aminata Touré',
    formType: 'COPD',
    date: new Date().toISOString(),
    title: 'Fiche Spécialisée — BPCO & Spirométrie GOLD',
    data: {
      goldStage: 'GOLD_3',
      vemsValue: '1.45 L (48%)',
      tiffeneau: '0.58',
      catScore: 22,
      treatmentPlan: 'TRI_LABA_LAMA_CSI'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const MOCK_CLINICAL_SCORES: ClinicalScoreCalculation[] = [
  {
    id: 'score-1',
    patientId: 'p6',
    patientName: 'Abdoulaye Guèye',
    centerId: 'center-1',
    doctorId: 'u1',
    doctorName: 'Dr. Cheikh Ndao',
    scoreId: 'CURB65',
    scoreName: 'Score de Gravité CURB-65 & CRB-65',
    scoreCategory: 'PNEUMONIA',
    calculatedValue: '3 / 5 points',
    variables: { confusion: false, urea: 1, rr: true, bp: false, age65: true },
    interpretation: 'PNEUMONIE GRAVE (Mortalité estimée 14-30%). Hospitalisation impérative.',
    clinicalRecommendation: 'Hospitalisation en soins continus, oxygénothérapie et antibiothérapie IV.',
    referenceSource: 'British Thoracic Society (BTS) / Thorax 2003',
    date: new Date().toISOString()
  },
  {
    id: 'score-2',
    patientId: 'p3',
    patientName: 'Ibrahima Cissé',
    centerId: 'center-1',
    doctorId: 'u2',
    doctorName: 'Dr. Aminata Touré',
    scoreId: 'mMRC',
    scoreName: 'Échelle de Dyspnée mMRC',
    scoreCategory: 'COPD',
    calculatedValue: 'Grade 3',
    variables: { grade: 3 },
    interpretation: 'mMRC = 3 : Dyspnée très sévère limitant la marche à 100m.',
    clinicalRecommendation: 'Patient GOLD Groupe E, indication trithérapie inhalée et VNI nocturne.',
    referenceSource: 'GOLD Report 2024',
    date: new Date().toISOString()
  }
];

const MOCK_NURSE_VITALS: NurseVitalRecord[] = [
  {
    id: 'vital-1',
    patientId: 'p1',
    hospitalizationId: 'h1',
    centerId: 'center-1',
    timestamp: new Date().toISOString(),
    bp: '120/75',
    pulse: 82,
    rr: 20,
    spo2: 96,
    temperature: 37.3,
    bloodGlucose: 1.02,
    painEva: 1,
    consciousnessGlasgow: 15,
    nurseName: 'Mme Fatou Binetou Sarr (Major)'
  },
  {
    id: 'vital-2',
    patientId: 'p3',
    hospitalizationId: 'h2',
    centerId: 'center-1',
    timestamp: new Date().toISOString(),
    bp: '135/85',
    pulse: 92,
    rr: 24,
    spo2: 93,
    temperature: 37.0,
    bloodGlucose: 1.15,
    painEva: 2,
    consciousnessGlasgow: 15,
    nurseName: 'M. Mamadou Diallo'
  }
];

const MOCK_NURSE_RESPIRATORY: NurseRespiratoryRecord[] = [
  {
    id: 'resp-1',
    patientId: 'p3',
    hospitalizationId: 'h2',
    centerId: 'center-1',
    timestamp: new Date().toISOString(),
    o2FlowLiters: 2.5,
    device: 'VNI_BIPAP',
    vniParameters: { ipap: 16, epap: 5, fio2: 40 },
    tolerance: 'BONNE',
    nurseName: 'M. Mamadou Diallo',
    notes: 'Séance de 2 heures bien tolérée, fuites minimes autour du masque oronasal.'
  }
];

const MOCK_FLUID_BALANCES: FluidBalanceRecord[] = [
  {
    id: 'fluid-1',
    patientId: 'p1',
    hospitalizationId: 'h1',
    centerId: 'center-1',
    date: new Date().toISOString().split('T')[0],
    period: '24H',
    oralIntakeMl: 1500,
    ivInfusionMl: 500,
    diuresisMl: 1700,
    stoolStomasMl: 200,
    vomitingMl: 0,
    netBalanceMl: 100,
    nurseName: 'Mme Fatou Binetou Sarr'
  }
];

const MOCK_NURSE_ADMIN_MEDS: NurseAdminMed[] = [
  {
    id: 'admin-1',
    patientId: 'p1',
    hospitalizationId: 'h1',
    centerId: 'center-1',
    medicineName: 'RHZE',
    dose: '4 comprimés PO',
    route: 'PO',
    scheduledTime: '07:30',
    administeredAt: '07:35',
    status: 'ADMINISTRE',
    nurseName: 'Mme Fatou Binetou Sarr',
    nurseSignature: 'Signé électroniquement par Fatou Binetou Sarr (Infirmière Major CHREIN)',
    notes: 'Pris avec un grand verre d\'eau à jeun.'
  }
];

const MOCK_NURSE_TRANSMISSIONS: NurseTargetedTransmission[] = [
  {
    id: 'trans-1',
    patientId: 'p3',
    patientName: 'Ibrahima Cissé',
    hospitalizationId: 'h2',
    centerId: 'center-1',
    timestamp: new Date().toISOString(),
    target: 'Encombrement bronchique sous VNI',
    data: 'Patient polypnéique à 26/min avec râles bronchiques ronflants audibles à distance.',
    action: 'Arrêt temporaire de la VNI, aérosol de Salbutamol administré, désencombrement par kiné et aspiration.',
    result: 'Expectoration muqueuse abondante facilitée, reprise de la VNI avec confort restauré. SpO2 94%.',
    nurseName: 'M. Mamadou Diallo',
    nurseSignature: 'Mamadou Diallo (Infirmier Soins Continus CHREIN)'
  }
];

const MOCK_MEDICAL_EXPLORATIONS: MedicalExploration[] = [
  {
    id: 'exp-1',
    requestNumber: 'EXP-2026-0041',
    patientId: 'p1',
    patientName: 'Mamadou Diop',
    patientHospitalNumber: 'CHREIN-PNEUMO-2026-014',
    patientAge: 46,
    patientGender: 'M',
    centerId: 'center-1',
    category: 'MICROBIOLOGIE',
    title: 'GeneXpert MTB/RIF — Crachats du matin',
    examType: 'GeneXpert MTB/RIF Ultra',
    clinicalIndication: 'Toux fébrile subaiguë > 3 semaines avec amaigrissement de 5 kg et sueurs nocturnes. Suspicion tuberculose pulmonaire.',
    priority: 'URGENTE',
    status: 'VALIDATED',
    date: '2026-10-18',
    requestedAt: '2026-10-18T08:30:00Z',
    prescribedById: 'u1',
    prescribedByName: 'Dr. Cheikh Ndao',
    laboratoryDestination: 'Unité PNT / Laboratoire de Bactériologie CHREIN',
    specimenType: 'Crachats purulents matinaux x2',
    specimenCollectedAt: '2026-10-18T09:15:00Z',
    specimenCollectedBy: 'Mme Fatou Binetou Sarr',
    sourceType: 'SAISIE_DIRECTE',
    hasAbnormalFlag: true,
    hasCriticalFlag: false,
    extractedParameters: [
      { parameter: 'Mycobacterium tuberculosis complex (MTB)', value: 'DÉTECTÉ (High)', unit: '', referenceInterval: 'Non Détecté', flag: 'POSITIF' },
      { parameter: 'Résistance à la Rifampicine (RIF)', value: 'NON DÉTECTÉE (Sensible)', unit: '', referenceInterval: 'Non Détectée', flag: 'NORMAL' }
    ],
    narrativeReport: 'Test GeneXpert MTB/RIF Ultra réalisé sur expectoration prélevée à jeun. Présence abondante d\'ADN de M. tuberculosis. Absence de mutation du gène rpoB conférant la résistance à la Rifampicine.',
    conclusion: 'Tuberculose pulmonaire bactériologiquement confirmée (TPM+), souche sensible à la Rifampicine.',
    validated: true,
    validatedByDoctor: 'Dr. Cheikh Ndao',
    validatedById: 'u1',
    validationDate: '2026-10-18T11:00:00Z',
    doctorNotes: 'Résultat PNT conforme, nouveau cas sensible, schéma 2RHZE/4RH initié immédiatement.',
    currentVersion: 1,
    versions: [
      {
        versionNumber: 1,
        enteredAt: '2026-10-18T10:45:00Z',
        enteredById: 'u-lab',
        enteredByName: 'Technicien Labo PNT',
        validatedAt: '2026-10-18T11:00:00Z',
        validatedById: 'u1',
        validatedByName: 'Dr. Cheikh Ndao',
        structuredParameters: [
          { parameter: 'Mycobacterium tuberculosis complex (MTB)', value: 'DÉTECTÉ (High)', unit: '', referenceInterval: 'Non Détecté', flag: 'POSITIF' },
          { parameter: 'Résistance à la Rifampicine (RIF)', value: 'NON DÉTECTÉE (Sensible)', unit: '', referenceInterval: 'Non Détectée', flag: 'NORMAL' }
        ],
        conclusion: 'Tuberculose pulmonaire bactériologiquement confirmée, sensible.'
      }
    ],
    auditTrail: [
      { id: 'aud-1', timestamp: '2026-10-18T08:30:00Z', action: 'CREATION', userId: 'u1', userName: 'Dr. Cheikh Ndao', userRole: 'CLINICIAN', notes: 'Demande urgente émise en consultation.' },
      { id: 'aud-2', timestamp: '2026-10-18T09:15:00Z', action: 'PRELEVEMENT', userId: 'u3', userName: 'Mme Fatou Binetou Sarr', userRole: 'NURSE', notes: 'Crachats recueillis au crachoir stérile.' },
      { id: 'aud-3', timestamp: '2026-10-18T10:45:00Z', action: 'SAISIE_RESULTAT', userId: 'u-lab', userName: 'Technicien Labo PNT', userRole: 'LABORATORY', notes: 'Résultat PCR GeneXpert Ultra saisi.' },
      { id: 'aud-4', timestamp: '2026-10-18T11:00:00Z', action: 'VALIDATION', userId: 'u1', userName: 'Dr. Cheikh Ndao', userRole: 'CLINICIAN', notes: 'Validation médicale et notification PNT.' }
    ],
    createdAt: '2026-10-18T08:30:00Z',
    updatedAt: '2026-10-18T11:00:00Z'
  },
  {
    id: 'exp-2',
    requestNumber: 'EXP-2026-0042',
    patientId: 'p1',
    patientName: 'Mamadou Diop',
    patientHospitalNumber: 'CHREIN-PNEUMO-2026-014',
    patientAge: 46,
    patientGender: 'M',
    centerId: 'center-1',
    category: 'IMAGERIE',
    title: 'Radiographie Thoracique Face Debout',
    examType: 'Téléthorax Face Haute Tension',
    clinicalIndication: 'Bilan initial de tuberculose pulmonaire confirmée. Recherche de cavernes et étendue des lésions.',
    priority: 'NORMALE',
    status: 'VALIDATED',
    date: '2026-10-18',
    requestedAt: '2026-10-18T08:35:00Z',
    prescribedById: 'u1',
    prescribedByName: 'Dr. Cheikh Ndao',
    laboratoryDestination: 'Service de Radiologie & Imagerie Médicale CHREIN',
    sourceType: 'SAISIE_DIRECTE',
    hasAbnormalFlag: true,
    hasCriticalFlag: false,
    extractedParameters: [
      { parameter: 'Caverne sommet pulmonaire droit', value: '32 mm', unit: 'mm', referenceInterval: 'Absente', flag: 'ANORMAL' },
      { parameter: 'Score de Ralph radiologique', value: '60', unit: '/125', referenceInterval: '< 40', flag: 'ELEVE' }
    ],
    structuredImagingReport: {
      technique: 'Cliché thoracique de face debout à haute tension.',
      parenchyma: 'Image cavitaire de 32 mm du lobe supérieur droit avec paroi épaisse et infiltrats nodulaires satellites en grappe.',
      bronchi: 'Parois bronchiques épaissies en péri-hilaire droit.',
      pleura: 'Comblement discret du cul-de-sac pleural costo-diaphragmatique droit.',
      mediastinum: 'Médiastin centré, silhouette cardiaque normale.',
      vessels: 'Pas de redistribution vasculaire apicale.',
      bones: 'Cadre osseux intact.',
      conclusion: 'Tuberculose cavitaire active du lobe supérieur droit.'
    },
    conclusion: 'Lésion excavée apicale droite typique de tuberculose active.',
    validated: true,
    validatedByDoctor: 'Dr. Cheikh Ndao',
    validatedById: 'u1',
    validationDate: '2026-10-18T14:30:00Z',
    auditTrail: [
      { id: 'aud-21', timestamp: '2026-10-18T08:35:00Z', action: 'CREATION', userId: 'u1', userName: 'Dr. Cheikh Ndao', userRole: 'CLINICIAN' },
      { id: 'aud-22', timestamp: '2026-10-18T14:00:00Z', action: 'SAISIE_RESULTAT', userId: 'u-rad', userName: 'Manipulateur Radio CHREIN', userRole: 'IMAGING_TECHNICIAN' },
      { id: 'aud-23', timestamp: '2026-10-18T14:30:00Z', action: 'VALIDATION', userId: 'u1', userName: 'Dr. Cheikh Ndao', userRole: 'CLINICIAN' }
    ],
    createdAt: '2026-10-18T08:35:00Z',
    updatedAt: '2026-10-18T14:30:00Z'
  },
  {
    id: 'exp-3',
    requestNumber: 'EXP-2026-0043',
    patientId: 'p3',
    patientName: 'Ibrahima Cissé',
    patientHospitalNumber: 'CHREIN-PNEUMO-2026-008',
    patientAge: 62,
    patientGender: 'M',
    centerId: 'center-1',
    category: 'GAZOMETRIE',
    title: 'Gazométrie Artérielle en Air Ambiant',
    examType: 'Gazométrie sang artériel (Artère radiale)',
    clinicalIndication: 'Exacerbation sévère de BPCO avec tirage sus-sternal et SpO2 à 88% en air ambiant. Suspicion acidose hypercapnique.',
    priority: 'CRITIQUE',
    status: 'SUBMITTED', // En attente de validation médicale (dans la file de validation)
    date: '2026-10-24',
    requestedAt: '2026-10-24T09:00:00Z',
    prescribedById: 'u2',
    prescribedByName: 'Dr. Aminata Touré',
    laboratoryDestination: 'Laboratoire d\'Urgence CHREIN',
    specimenType: 'Sang artériel hépariné (Seringue gazométrie)',
    specimenCollectedAt: '2026-10-24T09:10:00Z',
    specimenCollectedBy: 'M. Mamadou Diallo',
    sourceType: 'SAISIE_DIRECTE',
    hasAbnormalFlag: true,
    hasCriticalFlag: true, // Valeur critique !
    extractedParameters: [
      { parameter: 'pH artériel', value: '7.28', unit: '', referenceInterval: '7.35 - 7.45', flag: 'CRITIQUE', criticalThreshold: '< 7.30 (Acidose sévère)' },
      { parameter: 'PaO2 (Pression O2)', value: '54.0', unit: 'mmHg', referenceInterval: '80.0 - 100.0', flag: 'CRITIQUE', criticalThreshold: '< 60.0 mmHg (Hypoxémie aiguë)' },
      { parameter: 'PaCO2 (Pression CO2)', value: '58.5', unit: 'mmHg', referenceInterval: '35.0 - 45.0', flag: 'CRITIQUE', criticalThreshold: '> 50.0 mmHg (Hypercapnie)' },
      { parameter: 'Bicarbonates (HCO3-)', value: '29.2', unit: 'mmol/L', referenceInterval: '22.0 - 26.0', flag: 'ELEVE' },
      { parameter: 'SaO2 calculée', value: '86.4', unit: '%', referenceInterval: '95.0 - 99.0', flag: 'CRITIQUE', criticalThreshold: '< 90%' },
      { parameter: 'Lactates sanguins', value: '1.8', unit: 'mmol/L', referenceInterval: '0.5 - 2.0', flag: 'NORMAL' }
    ],
    narrativeReport: 'Prélèvement artériel radial réalisé sous air ambiant. Acidose respiratoire aiguë décompensée avec hypercapnie sévère et hypoxémie profonde.',
    conclusion: 'Insuffisance respiratoire aiguë hypercapnique (Acidose respiratoire aiguë pH 7.28, PaCO2 58.5 mmHg, PaO2 54 mmHg). Indication formelle à la Ventilation Non Invasive (VNI).',
    validated: false,
    auditTrail: [
      { id: 'aud-31', timestamp: '2026-10-24T09:00:00Z', action: 'CREATION', userId: 'u2', userName: 'Dr. Aminata Touré', userRole: 'CLINICIAN', notes: 'Prescription en urgence absolue.' },
      { id: 'aud-32', timestamp: '2026-10-24T09:10:00Z', action: 'PRELEVEMENT', userId: 'u4', userName: 'M. Mamadou Diallo', userRole: 'NURSE', notes: 'Ponction radiale avec test d\'Allen positif préalable.' },
      { id: 'aud-33', timestamp: '2026-10-24T09:25:00Z', action: 'SAISIE_RESULTAT', userId: 'u-lab', userName: 'Technicien Labo Urgences', userRole: 'LABORATORY', notes: 'Automate ABL90 FLEX, passage immédiat.' },
      { id: 'aud-34', timestamp: '2026-10-24T09:30:00Z', action: 'SOUMISSION', userId: 'u-lab', userName: 'Technicien Labo Urgences', userRole: 'LABORATORY', notes: 'Alerte critique transmise pour validation médicale urgente.' }
    ],
    createdAt: '2026-10-24T09:00:00Z',
    updatedAt: '2026-10-24T09:30:00Z'
  },
  {
    id: 'exp-4',
    requestNumber: 'EXP-2026-0044',
    patientId: 'p2',
    patientName: 'Aïssatou Ba',
    patientHospitalNumber: 'CHREIN-PNEUMO-2026-022',
    patientAge: 29,
    patientGender: 'F',
    centerId: 'center-1',
    category: 'EFR_RESPIRATOIRE',
    title: 'Spirométrie avec Test de Réversibilité',
    examType: 'Explorations Fonctionnelles Respiratoires',
    clinicalIndication: 'Asthme difficile ou mal contrôlé. Recherche d\'un trouble ventilatoire obstructif réversible.',
    priority: 'NORMALE',
    status: 'SUBMITTED', // En attente de validation
    date: '2026-10-23',
    requestedAt: '2026-10-23T11:00:00Z',
    prescribedById: 'u1',
    prescribedByName: 'Dr. Cheikh Ndao',
    laboratoryDestination: 'Unité d\'Explorations Fonctionnelles Respiratoires CHREIN',
    sourceType: 'SAISIE_DIRECTE',
    hasAbnormalFlag: true,
    hasCriticalFlag: false,
    extractedParameters: [
      { parameter: 'CVF pré-BD (Capacité Vitale)', value: '3.10', unit: 'L', referenceInterval: '3.40 (91%)', flag: 'NORMAL' },
      { parameter: 'VEMS pré-BD (Volume Expiratoire)', value: '1.85', unit: 'L', referenceInterval: '2.80 (66%)', flag: 'BAS' },
      { parameter: 'Rapport VEMS/CVF pré-BD', value: '59.6', unit: '%', referenceInterval: '> 70.0%', flag: 'BAS' },
      { parameter: 'VEMS post-BD (Salbutamol 400µg)', value: '2.32', unit: 'L', referenceInterval: '2.80 (83%)', flag: 'NORMAL' },
      { parameter: 'Gain VEMS post-BD (Gain absolu)', value: '+470', unit: 'mL', referenceInterval: '< 200 mL', flag: 'ELEVE' },
      { parameter: 'Gain relatif en %', value: '+25.4', unit: '%', referenceInterval: '< 12.0%', flag: 'ELEVE' }
    ],
    narrativeReport: 'Courbe débit-volume montrant un aspect concave typique d\'obstruction bronchique. Gain de +470 mL (+25%) après inhalation de 400 µg de Salbutamol.',
    conclusion: 'Trouble ventilatoire obstructif (TVO) modéré très significativement réversible sous bronchodilatateur, confirmant le diagnostic d\'asthme selon les critères GINA 2024.',
    validated: false,
    auditTrail: [
      { id: 'aud-41', timestamp: '2026-10-23T11:00:00Z', action: 'CREATION', userId: 'u1', userName: 'Dr. Cheikh Ndao', userRole: 'CLINICIAN' },
      { id: 'aud-42', timestamp: '2026-10-23T15:00:00Z', action: 'SAISIE_RESULTAT', userId: 'u-efr', userName: 'Infirmier EFR', userRole: 'LABORATORY' },
      { id: 'aud-43', timestamp: '2026-10-23T15:30:00Z', action: 'SOUMISSION', userId: 'u-efr', userName: 'Infirmier EFR', userRole: 'LABORATORY' }
    ],
    createdAt: '2026-10-23T11:00:00Z',
    updatedAt: '2026-10-23T15:30:00Z'
  },
  {
    id: 'exp-5',
    requestNumber: 'EXP-2026-0045',
    patientId: 'p1',
    patientName: 'Mamadou Diop',
    patientHospitalNumber: 'CHREIN-PNEUMO-2026-014',
    patientAge: 46,
    patientGender: 'M',
    centerId: 'center-1',
    category: 'INFLAMMATION',
    title: 'Protéine C-Réactive (CRP Quantitative)',
    examType: 'Marqueur inflammatoire sérique',
    clinicalIndication: 'Suivi de l\'intensité du syndrome infectieux et surveillance thérapeutique sous 2RHZE.',
    priority: 'NORMALE',
    status: 'VALIDATED',
    date: '2026-10-20',
    requestedAt: '2026-10-20T08:00:00Z',
    prescribedById: 'u1',
    prescribedByName: 'Dr. Cheikh Ndao',
    laboratoryDestination: 'Laboratoire Central de Biochimie CHREIN',
    specimenType: 'Sérum',
    specimenCollectedAt: '2026-10-20T08:30:00Z',
    specimenCollectedBy: 'Mme Fatou Binetou Sarr',
    sourceType: 'SAISIE_DIRECTE',
    hasAbnormalFlag: true,
    hasCriticalFlag: false,
    extractedParameters: [
      { parameter: 'Protéine C-Réactive (CRP)', value: '68.5', unit: 'mg/L', referenceInterval: '< 5.0 mg/L', flag: 'ELEVE' }
    ],
    conclusion: 'Syndrome inflammatoire biologique franc.',
    validated: true,
    validatedByDoctor: 'Dr. Cheikh Ndao',
    validatedById: 'u1',
    validationDate: '2026-10-20T11:15:00Z',
    auditTrail: [
      { id: 'aud-51', timestamp: '2026-10-20T08:00:00Z', action: 'CREATION', userId: 'u1', userName: 'Dr. Cheikh Ndao', userRole: 'CLINICIAN' },
      { id: 'aud-52', timestamp: '2026-10-20T11:15:00Z', action: 'VALIDATION', userId: 'u1', userName: 'Dr. Cheikh Ndao', userRole: 'CLINICIAN' }
    ],
    createdAt: '2026-10-20T08:00:00Z',
    updatedAt: '2026-10-20T11:15:00Z'
  },
  {
    id: 'exp-6',
    requestNumber: 'EXP-2026-0046',
    patientId: 'p1',
    patientName: 'Mamadou Diop',
    patientHospitalNumber: 'CHREIN-PNEUMO-2026-014',
    patientAge: 46,
    patientGender: 'M',
    centerId: 'center-1',
    category: 'BIOCHIMIE',
    title: 'Bilan Hépatique & Fonction Rénale Pré-RHZE',
    examType: 'Transaminases, Bilirubine, Créatininémie, Glycémie',
    clinicalIndication: 'Bilan de sécurité hépatique et rénale obligatoire avant initiation de la quadrithérapie antituberculeuse.',
    priority: 'URGENTE',
    status: 'AMENDED', // Résultat amendé avec traçabilité V2
    date: '2026-10-19',
    requestedAt: '2026-10-19T08:00:00Z',
    prescribedById: 'u1',
    prescribedByName: 'Dr. Cheikh Ndao',
    laboratoryDestination: 'Laboratoire Central de Biochimie CHREIN',
    specimenType: 'Sérum',
    specimenCollectedAt: '2026-10-19T08:20:00Z',
    specimenCollectedBy: 'Mme Fatou Binetou Sarr',
    sourceType: 'SAISIE_DIRECTE',
    hasAbnormalFlag: false,
    hasCriticalFlag: false,
    extractedParameters: [
      { parameter: 'ASAT (TGO)', value: '26', unit: 'UI/L', referenceInterval: '< 35', flag: 'NORMAL' },
      { parameter: 'ALAT (TGP)', value: '28', unit: 'UI/L', referenceInterval: '< 45', flag: 'NORMAL' },
      { parameter: 'Bilirubine totale', value: '8.5', unit: 'µmol/L', referenceInterval: '< 17.0', flag: 'NORMAL' },
      { parameter: 'Créatinine sérique', value: '9.2', unit: 'mg/L', referenceInterval: '7.0 - 12.0', flag: 'NORMAL' },
      { parameter: 'Clairance MDRD estimée', value: '94', unit: 'mL/min', referenceInterval: '> 60', flag: 'NORMAL' },
      { parameter: 'Glycémie à jeun', value: '0.98', unit: 'g/L', referenceInterval: '0.70 - 1.10', flag: 'NORMAL' }
    ],
    conclusion: 'Fonction rénale et transaminases hépatiques strictement normales, autorisant l\'initiation sans restriction de la Rifampicine et de la Pyrazinamide.',
    validated: true,
    validatedByDoctor: 'Dr. Cheikh Ndao',
    validatedById: 'u1',
    validationDate: '2026-10-19T16:00:00Z',
    currentVersion: 2,
    versions: [
      {
        versionNumber: 1,
        enteredAt: '2026-10-19T11:00:00Z',
        enteredById: 'u-lab',
        enteredByName: 'Technicien Biochimie',
        validatedAt: '2026-10-19T11:30:00Z',
        validatedById: 'u1',
        validatedByName: 'Dr. Cheikh Ndao',
        structuredParameters: [
          { parameter: 'ASAT (TGO)', value: '26', unit: 'UI/L', referenceInterval: '< 35', flag: 'NORMAL' },
          { parameter: 'ALAT (TGP)', value: '28', unit: 'UI/L', referenceInterval: '< 45', flag: 'NORMAL' },
          { parameter: 'Créatinine sérique', value: '9.2', unit: 'mg/L', referenceInterval: '7.0 - 12.0', flag: 'NORMAL' }
        ],
        conclusion: 'Bilan normal initial.'
      },
      {
        versionNumber: 2,
        enteredAt: '2026-10-19T15:30:00Z',
        enteredById: 'u-lab',
        enteredByName: 'Biologiste CHREIN',
        validatedAt: '2026-10-19T16:00:00Z',
        validatedById: 'u1',
        validatedByName: 'Dr. Cheikh Ndao',
        reasonForAmendment: 'Ajout de la Bilirubine totale et de la glycémie demandées en complément sur le même tube.',
        structuredParameters: [
          { parameter: 'ASAT (TGO)', value: '26', unit: 'UI/L', referenceInterval: '< 35', flag: 'NORMAL' },
          { parameter: 'ALAT (TGP)', value: '28', unit: 'UI/L', referenceInterval: '< 45', flag: 'NORMAL' },
          { parameter: 'Bilirubine totale', value: '8.5', unit: 'µmol/L', referenceInterval: '< 17.0', flag: 'NORMAL' },
          { parameter: 'Créatinine sérique', value: '9.2', unit: 'mg/L', referenceInterval: '7.0 - 12.0', flag: 'NORMAL' },
          { parameter: 'Clairance MDRD estimée', value: '94', unit: 'mL/min', referenceInterval: '> 60', flag: 'NORMAL' },
          { parameter: 'Glycémie à jeun', value: '0.98', unit: 'g/L', referenceInterval: '0.70 - 1.10', flag: 'NORMAL' }
        ],
        conclusion: 'Bilan complet hépatique et rénal validé.'
      }
    ],
    auditTrail: [
      { id: 'aud-61', timestamp: '2026-10-19T08:00:00Z', action: 'CREATION', userId: 'u1', userName: 'Dr. Cheikh Ndao', userRole: 'CLINICIAN' },
      { id: 'aud-62', timestamp: '2026-10-19T11:30:00Z', action: 'VALIDATION', userId: 'u1', userName: 'Dr. Cheikh Ndao', userRole: 'CLINICIAN' },
      { id: 'aud-63', timestamp: '2026-10-19T15:30:00Z', action: 'AMENDEMENT', userId: 'u-lab', userName: 'Biologiste CHREIN', userRole: 'LABORATORY', notes: 'Ajout de paramètres complémentaires.' },
      { id: 'aud-64', timestamp: '2026-10-19T16:00:00Z', action: 'VALIDATION', userId: 'u1', userName: 'Dr. Cheikh Ndao', userRole: 'CLINICIAN', notes: 'Validation de l\'amendement V2.' }
    ],
    createdAt: '2026-10-19T08:00:00Z',
    updatedAt: '2026-10-19T16:00:00Z'
  },
  {
    id: 'exp-7',
    requestNumber: 'EXP-2026-0047',
    patientId: 'p2',
    patientName: 'Aïssatou Ba',
    patientHospitalNumber: 'CHREIN-PNEUMO-2026-022',
    patientAge: 29,
    patientGender: 'F',
    centerId: 'center-1',
    category: 'HEMATOLOGIE',
    title: 'Hémogramme Complet (NFS + Plaquettes)',
    examType: 'Numération Formule Sanguine',
    clinicalIndication: 'Recherche d\'anémie ou d\'hyperéosinophilie sur terrain d\'asthme atopique.',
    priority: 'NORMALE',
    status: 'REQUESTED', // Demande émise, en attente de prélèvement
    date: '2026-10-25',
    requestedAt: '2026-10-25T08:15:00Z',
    prescribedById: 'u1',
    prescribedByName: 'Dr. Cheikh Ndao',
    laboratoryDestination: 'Laboratoire Central d\'Hématologie CHREIN',
    specimenType: 'Sang total EDTA (Tube mauve)',
    sourceType: 'SAISIE_DIRECTE',
    extractedParameters: [],
    validated: false,
    auditTrail: [
      { id: 'aud-71', timestamp: '2026-10-25T08:15:00Z', action: 'CREATION', userId: 'u1', userName: 'Dr. Cheikh Ndao', userRole: 'CLINICIAN', notes: 'Demande créée en consultation.' }
    ],
    createdAt: '2026-10-25T08:15:00Z',
    updatedAt: '2026-10-25T08:15:00Z'
  }
];

const MOCK_BANK_TRANSFERS: BankTransfer[] = [];

const MOCK_MEDICAL_DOCUMENTS: MedicalDocumentRecord[] = [
  {
    id: 'doc-1',
    referenceNumber: 'CRH-CHREIN-2026-0038',
    centerId: 'center-1',
    patientId: 'p1',
    patientName: 'Mamadou Diop',
    patientHospitalNumber: 'CHREIN-PNEUMO-2026-014',
    patientAge: 46,
    patientGender: 'M',
    patientAddress: 'Quartier Kasnack, Kaolack',
    patientPhone: '+221 77 123 45 67',
    type: 'CRH',
    title: 'Compte-Rendu d\'Hospitalisation — Tuberculose Pulmonaire Bacillifère (PNT)',
    content: `MOTIF D'ADMISSION :
Hospitalisation pour toux fébrile subaiguë évoluant depuis 3 semaines avec expectorations purulentes, hémoptoïques, sueurs nocturnes profuses et amaigrissement chiffré à 5 kg chez un patient de 46 ans tabagique à 15 PA et notion de contage tuberculeux intrafamilial.

EXAMEN CLINIQUE D'ENTRÉE :
Patient asthénique, polypnéique à 24 cycles/min, SpO2 93% en air ambiant, T° 38.6°C, TA 115/75 mmHg, FC 88 bpm.
Auscultation : râles crépitants localisés au sommet pulmonaire droit et diminution du murmure vésiculaire aux deux bases.

EXPLORATIONS PARACLINIQUES :
1. GeneXpert MTB/RIF Ultra : Détection d'ADN de Mycobacterium tuberculosis (charge élevée), sensibilité complète à la Rifampicine conservée.
2. Téléthorax de face : Opacité infiltrative excavée apicale droite (caverne de 2.5 cm) avec micronodules disséminés de voisinage.
3. Bilan biologique pré-thérapeutique : NFS (Hb 11.8 g/dL, leucocytes 9 400/mm3), CRP 68.5 mg/L, transaminases et créatinine normales.

ÉVOLUTION SOUS TRAITEMENT :
Mise sous quadrithérapie antituberculeuse à doses fixes combinées selon les directives du PNT Sénégal : 2RHZE (4 comprimés/jour le matin à jeun) + Pyridoxine (Vitamine B6) 50 mg/j.
Évolution favorable avec apyrexie obtenue à J+4, régression nette de la toux et amélioration de l'appétit (+1.5 kg au cours du séjour). Tolérance hépatique biologique parfaite.

TRAITEMENT ET CONDUITE DE SORTIE :
1. Poursuite du schéma 2RHZE (4 comprimés/j en 1 prise matinale unique à jeun) jusqu'à fin du 2ème mois (M2).
2. Vitamine B6 50 mg : 1 cp/j le matin.
3. Repos médical avec arrêt de travail de 30 jours (certificat délivré).
4. Prise en charge gratuite à 100% dans le cadre du Programme National Antituberculeux du Sénégal.
5. Contrôle bactériologique des crachats et consultation programmés le 18/12/2026 au Service de Pneumologie CHREIN.`,
    metadata: {
      admissionDate: '2026-10-18',
      dischargeDate: '2026-10-25',
      hospitalizationRoom: 'Lit 01 (Chambre 101 - Isolement Respiratoire TB)',
      diagnosesCim11: ['1B10.0 - Tuberculose respiratoire confirmée par bactériologie'],
      medicationsPrescribed: 'RHZE (150/75/400/275 mg) 4 cp/j + Vitamine B6 50 mg/j',
      attendingPhysician: 'Dr. Cheikh Ndao',
      followUpDate: '2026-12-18',
      qrCodeString: 'CHREIN-CRH-2026-0038-PNT-SN'
    },
    status: 'SIGNE_VALIDE',
    createdById: 'u1',
    createdByName: 'Dr. Cheikh Ndao',
    createdAt: '2026-10-25T10:00:00Z',
    signedById: 'u1',
    signedByName: 'Dr. Cheikh Ndao',
    signedAt: '2026-10-25T11:30:00Z',
    notes: 'Document officiel certifié remis en main propre au patient et archivé au DPI CHREIN.'
  },
  {
    id: 'doc-2',
    referenceNumber: 'ORD-CHREIN-2026-0112',
    centerId: 'center-1',
    patientId: 'p3',
    patientName: 'Ibrahima Cissé',
    patientHospitalNumber: 'CHREIN-PNEUMO-2026-031',
    patientAge: 62,
    patientGender: 'M',
    patientAddress: 'Médina Baye, Kaolack',
    patientPhone: '+221 78 345 67 89',
    type: 'ORDONNANCE',
    title: 'Ordonnance Médicale Sécurisée — Trithérapie Inhalée BPCO & Antibiothérapie',
    content: `1. Trimbow (Béclométasone / Formotérol / Glycopyrronium) 87/5/9 µg :
   2 inhalations matin et 2 inhalations soir au moyen de la chambre d'inhalation. Rinçage buccal systématique après chaque prise.
   QSP 3 mois (renouvelable 2 fois).

2. Salbutamol 100 µg (Ventoline) :
   1 à 2 bouffées toutes les 4 à 6 heures en cas de dyspnée aiguë ou sifflements. Ne pas dépasser 8 bouffées/jour.

3. Amoxicilline + Acide Clavulanique 1g :
   1 comprimé matin et soir au milieu des repas pendant 7 jours stricts.

4. Prednisolone 20 mg :
   2 comprimés le matin (40 mg/jour) pendant 5 jours (cure courte de décompensation, arrêt net sans dégression).

5. Règles d'or :
   - Arrêt absolu du tabac et éviction des fumées de biomasse.
   - En cas de fièvre > 38.5°C persistante ou cyanose, contacter immédiatement les urgences du CHREIN.`,
    metadata: {
      diagnosesCim11: ['CA22.0 - BPCO avec exacerbation aiguë purulente (Anthonisen I)'],
      medicationsPrescribed: 'Trimbow, Salbutamol, Augmentin 1g, Prednisolone 20mg',
      attendingPhysician: 'Dr. Cheikh Ndao',
      costFcfa: 38500,
      qrCodeString: 'CHREIN-ORD-2026-0112-FCFA'
    },
    status: 'SIGNE_VALIDE',
    createdById: 'u1',
    createdByName: 'Dr. Cheikh Ndao',
    createdAt: '2026-10-24T12:00:00Z',
    signedById: 'u1',
    signedByName: 'Dr. Cheikh Ndao',
    signedAt: '2026-10-24T12:15:00Z',
    notes: 'Ordonnance sécurisée horodatée conforme aux directives régionales sénégalaises.'
  },
  {
    id: 'doc-3',
    referenceNumber: 'CERT-CHREIN-2026-0045',
    centerId: 'center-1',
    patientId: 'p1',
    patientName: 'Mamadou Diop',
    patientHospitalNumber: 'CHREIN-PNEUMO-2026-014',
    patientAge: 46,
    patientGender: 'M',
    patientAddress: 'Quartier Kasnack, Kaolack',
    patientPhone: '+221 77 123 45 67',
    type: 'CERTIFICAT',
    title: 'Certificat Médical de Prise en Charge PNT & Repos Thérapeutique',
    content: `Je soussigné, Dr. Cheikh Ndao, Médecin Chef du Service de Pneumologie et Maladies Infectieuses au Centre Hospitalier Régional El Hadji Ibrahima Niass (CHREIN) de Kaolack, certifie que :

Le patient Mamadou Diop, né le 12/04/1980, domicilié à Kasnack (Kaolack), identifié sous le n° hospitalier CHREIN-PNEUMO-2026-014, a été pris en charge dans notre service pour une affection respiratoire subaiguë relevant du Programme National Antituberculeux (PNT) du Sénégal.

Le patient bénéficie de la gratuité complète de ses médicaments antituberculeux conformément aux décrets de santé publique en vigueur au Sénégal.

Son état de santé actuel nécessite un arrêt complet de travail et un repos strict à domicile pour une durée de 30 (trente) jours à compter du 25/10/2026.

Certificat médical délivré en main propre à l'intéressé pour servir et valoir ce que de droit.`,
    metadata: {
      restDurationDays: 30,
      attendingPhysician: 'Dr. Cheikh Ndao',
      qrCodeString: 'CHREIN-CERT-2026-0045-PNT'
    },
    status: 'SIGNE_VALIDE',
    createdById: 'u1',
    createdByName: 'Dr. Cheikh Ndao',
    createdAt: '2026-10-25T11:45:00Z',
    signedById: 'u1',
    signedByName: 'Dr. Cheikh Ndao',
    signedAt: '2026-10-25T11:50:00Z'
  },
  {
    id: 'doc-4',
    referenceNumber: 'DEM-CHREIN-2026-0089',
    centerId: 'center-1',
    patientId: 'p2',
    patientName: 'Aïssatou Ba',
    patientHospitalNumber: 'CHREIN-PNEUMO-2026-022',
    patientAge: 29,
    patientGender: 'F',
    patientAddress: 'Quartier Léona, Kaolack',
    patientPhone: '+221 76 234 56 78',
    type: 'DEMANDE_EXAMENS',
    title: 'Demande d\'Explorations Fonctionnelles & Scanner Thoracique Haute Résolution',
    content: `DESTINATION : Plateau Technique & Imagerie Médicale CHREIN

RENSEIGNEMENTS CLINIQUES :
Patiente de 29 ans, suivie pour asthme sévère mal contrôlé sous corticothérapie inhalée forte dose, présentant des épisodes récurrents d'encombrement bronchique muco-purulent et crachats hémoptoïques sporadiques. Recherche de dilatations des bronches (DDB) associées ou d'aspergillose bronchopulmonaire allergique (ABPA).

EXAMENS DEMANDÉS :
1. Tomodensitométrie Thoracique (TDM-HR) en coupes millimétriques de haute résolution :
   - Recherche de bronchectasies (DDB cylindriques ou sacculaires).
   - Évaluation de l'épaississement des parois bronchiques et impactions mucoïdes.
   - Recherche de condensations ou piégeage expiratoire.

2. Explorations Fonctionnelles Respiratoires (EFR) complètes avec Pléthysmographie et DLCO :
   - Évaluation des volumes pulmonaires statiques (VR, CPT) et conductance.

3. Biologie spécialisée :
   - Dosage des IgE totales et IgE spécifiques anti-Aspergillus fumigatus.`,
    metadata: {
      attendingPhysician: 'Dr. Cheikh Ndao',
      qrCodeString: 'CHREIN-DEM-2026-0089'
    },
    status: 'SIGNE_VALIDE',
    createdById: 'u1',
    createdByName: 'Dr. Cheikh Ndao',
    createdAt: '2026-10-23T11:15:00Z',
    signedById: 'u1',
    signedByName: 'Dr. Cheikh Ndao',
    signedAt: '2026-10-23T11:20:00Z'
  },
  {
    id: 'doc-5',
    referenceNumber: 'LIAIS-CHREIN-2026-0021',
    centerId: 'center-1',
    patientId: 'p4',
    patientName: 'Ousmane Sow',
    patientHospitalNumber: 'CHREIN-PNEUMO-2026-045',
    patientAge: 53,
    patientGender: 'M',
    patientAddress: 'Commune de Nioro du Rip, Région de Kaolack',
    patientPhone: '+221 77 456 78 90',
    type: 'FICHE_LIAISON',
    title: 'Fiche de Liaison Médicale & Contre-Référence — District Sanitaire de Nioro',
    content: `À l'attention du Médecin-Chef du Centre de Santé de Nioro du Rip :

Cher(e) Confrère,

Nous vous réadressons ce jour Monsieur Ousmane Sow, 53 ans, agriculteur à Nioro du Rip, après un séjour de 5 jours dans notre service pour décompensation respiratoire aiguë de BPCO post-infectieuse.

Au cours de son séjour au CHREIN :
- Gazométrie initiale : pH 7.34, PaO2 56 mmHg, PaCO2 48 mmHg (hypoxémie hypercapnique modérée).
- Mise sous oxygénothérapie par lunettes à 1.5 L/min (SpO2 cible 88-92%), antibiothérapie par Amoxicilline/Acide Clavulanique et nébulisations répétées de bronchodilatateurs (Salbutamol + Ipratropium).
- Évolution clinique très favorable avec sevrage complet de l'oxygène à J+4 et SpO2 stable à 94% en air ambiant.

Consignes pour le suivi au niveau du district de Nioro :
- Poursuite du traitement de fond par bronchodilatateur de longue durée d'action.
- Surveillance mensuelle de la SpO2 au poste de santé le plus proche.
- Encouragement strict au sevrage tabagique complet.
- En cas de récidive d'expectoration purulente ou dyspnée stade 3 mMRC, réadresser au CHREIN.`,
    metadata: {
      destinationHospital: 'Centre de Santé de Nioro du Rip',
      attendingPhysician: 'Dr. Cheikh Ndao',
      qrCodeString: 'CHREIN-LIAIS-2026-0021'
    },
    status: 'SIGNE_VALIDE',
    createdById: 'u1',
    createdByName: 'Dr. Cheikh Ndao',
    createdAt: '2026-10-22T14:00:00Z',
    signedById: 'u1',
    signedByName: 'Dr. Cheikh Ndao',
    signedAt: '2026-10-22T14:30:00Z'
  },
  {
    id: 'doc-6',
    referenceNumber: 'EVAC-CHREIN-2026-0006',
    centerId: 'center-1',
    patientId: 'p5',
    patientName: 'Fatou Sall',
    patientHospitalNumber: 'CHREIN-PNEUMO-2026-052',
    patientAge: 38,
    patientGender: 'F',
    patientAddress: 'Quartier Ndorong, Kaolack',
    patientPhone: '+221 70 567 89 01',
    type: 'EVACUATION',
    title: 'Fiche d\'Évacuation Sanitaire Inter-Hospitalière — Transfert Réanimation CHU Fann',
    content: `DEMANDE DE TRANSFERT MÉDICALISÉ URGENT :

STRUCTURE ÉMETTRICE : CHREIN Kaolack — Service de Pneumologie et Soins Continus
STRUCTURE DESTINATAIRE : CHU de Fann (Dakar) — Service de Réanimation Médicale Respiratoire

DONNÉES DU PATIENT :
Mme Fatou Sall, 38 ans, admise pour syndrome de détresse respiratoire aiguë (SDRA) compliquant une pneumopathie bilatérale extensive chez une patiente sans comorbidité antérieure connue.

ÉTAT CLINIQUE ET PARAMÈTRES AU DÉPART :
- SpO2 : 86% sous O2 au masque à haute concentration (15 L/min avec réservoir).
- Fréquence respiratoire : 36/min avec tirage sus-sternal et balancement thoraco-abdominal.
- Gazométrie : pH 7.28, PaO2 49 mmHg, PaCO2 52 mmHg, rapport PaO2/FiO2 < 120 (SDRA modéré à sévère).
- Hémodynamique : TA 105/65 mmHg, FC 122 bpm sous perfusion de macromolécules.
- Conscience : Vigilante mais épuisée, Glasgow 14/15.

MOTIF DE L'ÉVACUATION :
Nécessité d'intubation orotrachéale avec ventilation mécanique invasive protectrice et monitorage lourd en milieu de réanimation spécialisée, non réalisable sur le plateau technique actuel de Kaolack.

CONDITIONNEMENT ET TRANSPORT :
Évacuation effectuée par Ambulance Médicalisée du SAMU Régional avec médecin urgentiste à bord, monitorage cardiorespiratoire continu et bouteilles d'oxygène de secours.`,
    metadata: {
      destinationHospital: 'CHU de Fann (Dakar) - Réanimation Respiratoire',
      attendingPhysician: 'Dr. Cheikh Ndao',
      qrCodeString: 'CHREIN-EVAC-2026-0006-SAMU'
    },
    status: 'SIGNE_VALIDE',
    createdById: 'u1',
    createdByName: 'Dr. Cheikh Ndao',
    createdAt: '2026-10-26T04:30:00Z',
    signedById: 'u1',
    signedByName: 'Dr. Cheikh Ndao',
    signedAt: '2026-10-26T04:45:00Z',
    notes: 'Avis préalable favorable obtenu auprès du médecin réanimateur de garde du CHU Fann.'
  }
];

interface AppState {
  currentUser: User | null;
  currentCenter: HealthCenter | null;
  allCenters: HealthCenter[];
  users: User[];
  patients: Patient[];
  tickets: Ticket[];
  services: Service[];
  medicines: Medicine[];
  sales: Sale[];
  consultations: Consultation[];
  labResults: LabResult[];
  appointments: Appointment[];
  beds: Bed[];
  hospitalizations: Hospitalization[];
  mutuals: MutualFirm[];
  expenses: Expense[];
  bankTransfers: BankTransfer[];
  officinePartners: OfficinePartner[];
  officineOrders: OfficinePrescriptionOrder[];
  clinicProspects: ClinicProspect[];
  isLoading: boolean;
  useHostinger: boolean;
  hostingerStatus: {
    connected: boolean;
    error: string | null;
    dbInfo: any;
  };
  subscriptionPlans: Record<'basic' | 'pro' | 'expert', PlanMetadata>;
  specializedPneumoRecords: SpecializedPneumoRecord[];
  clinicalScoreCalculations: ClinicalScoreCalculation[];
  nurseVitalRecords: NurseVitalRecord[];
  nurseRespiratoryRecords: NurseRespiratoryRecord[];
  fluidBalanceRecords: FluidBalanceRecord[];
  nurseAdministeredMeds: NurseAdministeredMed[];
  nurseTargetedTransmissions: NurseTargetedTransmission[];
  medicalExplorations: MedicalExploration[];
  medicalDocuments: MedicalDocumentRecord[];
}

interface AppContextType extends AppState {
  saveSpecializedPneumoRecord: (rec: SpecializedPneumoRecord) => void;
  saveClinicalScoreCalculation: (rec: ClinicalScoreCalculation) => void;
  addNurseVitalRecord: (rec: NurseVitalRecord) => void;
  addNurseRespiratoryRecord: (rec: NurseRespiratoryRecord) => void;
  addFluidBalanceRecord: (rec: FluidBalanceRecord) => void;
  addNurseAdministeredMed: (rec: NurseAdministeredMed) => void;
  addNurseTargetedTransmission: (rec: NurseTargetedTransmission) => void;
  saveMedicalExploration: (rec: MedicalExploration) => void;
  saveMedicalDocument: (doc: MedicalDocumentRecord) => void;
  deleteMedicalDocument: (id: string) => void;
  findDuplicatePatients: (candidate: Partial<Patient>) => Patient[];
  setUseHostinger: (val: boolean) => void;
  checkHostingerStatus: () => Promise<any>;
  loadHostingerData: () => Promise<void>;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  switchCenter: (center: HealthCenter | null) => Promise<void>;
  createTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'ticketNumber' | 'centerId' | 'status'>) => Promise<Ticket | null>;
  updateTicketStatus: (id: string, status: string) => Promise<void>;
  updateTicketTaskStatus: (
    ticketId: string,
    serviceIndexOrId: string | number,
    status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED',
    details?: { performedBy?: string; notes?: string; results?: string; serviceId?: string; serviceName?: string }
  ) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  addSale: (items: any[], paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'CARD', ticketId?: string, patientName?: string) => void;
  registerCenter: (center: Omit<HealthCenter, 'id' | 'isActive'>, admin: Omit<User, 'id' | 'centerId' | 'role'>) => Promise<void>;
  createCenter: (center: any) => Promise<void>;
  updateCenter: (center: Partial<HealthCenter>) => void;
  updateCenterInfo: (id: string, centerData: Partial<HealthCenter>) => Promise<void>;
  deleteCenter: (id: string) => Promise<void>;
  toggleCenterStatus: (id: string, status: boolean) => void;
  addService: (service: Omit<Service, 'id' | 'centerId'>) => void;
  updateService: (id: string, data: Partial<Service>) => void;
  deleteService: (id: string) => void;
  applySenegalConventionPricing: (ipmRate?: number, insuranceRate?: number, category?: string) => Promise<{ updatedCount: number }>;
  addMedicine: (medicine: Omit<Medicine, 'id' | 'centerId'>) => void;
  updateMedicine: (id: string, data: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  addUser: (user: (Omit<User, 'id' | 'centerId'> & { centerId?: string; officineId?: string; officineName?: string }) | Omit<User, 'id'>) => Promise<User | null>;
  updateUser: (id: string, data: Partial<User>) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;
  addPatient: (patient: Omit<Patient, 'id' | 'centerId' | 'code' | 'age' | 'createdAt'>) => Promise<Patient | null>;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  saveConsultation: (consultation: Omit<Consultation, 'id' | 'createdAt'>) => Promise<Consultation | null>;
  addLabResult: (result: Omit<LabResult, 'id' | 'createdAt' | 'updatedAt' | 'centerId'>) => Promise<LabResult | null>;
  updateLabResult: (id: string, data: Partial<LabResult>) => Promise<LabResult | null>;
  deleteLabResult: (id: string) => Promise<boolean>;
  createAppointment: (appointment: Omit<Appointment, 'id' | 'centerId' | 'createdAt' | 'updatedAt' | 'status' | 'smsSent' | 'reminderSent'>) => Promise<Appointment | null>;
  addBed: (bed: Omit<Bed, 'id' | 'centerId'>) => Promise<void>;
  updateBed: (id: string, data: Partial<Bed>) => Promise<void>;
  deleteBed: (id: string) => Promise<void>;
  admitPatient: (hospitalization: Omit<Hospitalization, 'id' | 'centerId' | 'admissionDate' | 'status'>) => Promise<Hospitalization | null>;
  dischargePatient: (id: string, actualDischargeDate: string, totalCost: number) => Promise<void>;
  updateHospitalization: (id: string, data: Partial<Hospitalization>) => Promise<void>;
  deleteHospitalization: (id: string) => Promise<void>;
  addMutual: (mutual: Omit<MutualFirm, 'id'>) => Promise<void>;
  deleteMutual: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'centerId' | 'createdAt' | 'createdBy'>) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addBankTransfer: (transfer: Omit<BankTransfer, 'id' | 'centerId' | 'createdAt' | 'createdBy'>) => Promise<BankTransfer | null>;
  deleteBankTransfer: (id: string) => Promise<void>;
  refreshTickets: () => Promise<void>;
  purgeSimulatedData: (options: { purgePatients: boolean; purgeCatalog: boolean; purgeUsersAndCenters: boolean }) => Promise<void>;
  resetDatabaseSeeding: () => void;
  updateSubscriptionPlans: (newPlans: Record<'basic' | 'pro' | 'expert', PlanMetadata>) => void;
  addOfficinePartner: (partner: Omit<OfficinePartner, 'id'>) => Promise<OfficinePartner>;
  updateOfficinePartner: (id: string, data: Partial<OfficinePartner>) => Promise<void>;
  deleteOfficinePartner: (id: string) => Promise<void>;
  createOfficineOrder: (order: Omit<OfficinePrescriptionOrder, 'id' | 'createdAt' | 'status'>) => Promise<OfficinePrescriptionOrder>;
  updateOfficineOrderStatus: (
    id: string,
    status: OfficineOrderStatus,
    meta?: {
      officineNotes?: string;
      doctorNotes?: string;
      patientNotes?: string;
      totalPrice?: number;
      deliveryDriverName?: string;
      deliveryDriverPhone?: string;
      estimatedDeliveryTime?: string;
      items?: OfficineOrderItem[];
    }
  ) => Promise<void>;
  updateClinicProspectStatus: (id: string, status: ProspectStatus, notes?: string) => void;
  addClinicProspect: (prospect: Omit<ClinicProspect, 'id' | 'createdAt'>) => void;
  updateClinicProspect: (id: string, data: Partial<ClinicProspect>) => void;
  deleteClinicProspect: (id: string) => void;
  createOfficineManagerAccount: (
    officineId: string,
    managerData: { name: string; email: string; phone?: string; password?: string }
  ) => Promise<User | null>;
  deleteOfficineManagerAccount: (officineId: string, userId: string) => Promise<void>;
  resetOfficineManagerPassword: (userId: string, newPassword: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadInitialState<T>(tableName: string, fallback: T[]): T[] {
  try {
    const saved = localStorage.getItem(`offline_${tableName}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return fallback;
}

// Non-blocking, debounced localStorage saver to avoid UI freeze on large datasets
const cacheSaveTimers = new Map<string, any>();
function saveToLocalCache(tableName: string, data: any[]) {
  if (cacheSaveTimers.has(tableName)) {
    clearTimeout(cacheSaveTimers.get(tableName));
  }
  const timer = setTimeout(() => {
    try {
      localStorage.setItem(`offline_${tableName}`, JSON.stringify(data));
    } catch (e) {
      console.warn(`[Local cache] Notice sauvegarde ${tableName}:`, e);
    }
    cacheSaveTimers.delete(tableName);
  }, 40);
  cacheSaveTimers.set(tableName, timer);
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  const [currentCenter, setCurrentCenter] = useState<HealthCenter | null>(() => {
    const saved = localStorage.getItem('current_center');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  const [allCenters, setAllCentersRaw] = useState<HealthCenter[]>(() => loadInitialState('centers', MOCK_CENTERS));
  const [users, setUsersRaw] = useState<User[]>(() => loadInitialState('users', MOCK_USERS));
  const [patients, setPatientsRaw] = useState<Patient[]>(() => loadInitialState('patients', MOCK_PATIENTS));
  const [tickets, setTicketsRaw] = useState<Ticket[]>(() => loadInitialState('tickets', MOCK_TICKETS));
  const [services, setServicesRaw] = useState<Service[]>(() => loadInitialState('services', MOCK_SERVICES));
  const [medicines, setMedicinesRaw] = useState<Medicine[]>(() => loadInitialState('medicines', MOCK_MEDICINES));
  const [sales, setSalesRaw] = useState<Sale[]>(() => loadInitialState('sales', []));
  const [consultations, setConsultationsRaw] = useState<Consultation[]>(() => loadInitialState('consultations', MOCK_CONSULTATIONS));
  const [labResults, setLabResultsRaw] = useState<LabResult[]>(() => loadInitialState('lab_results', []));
  const [appointments, setAppointmentsRaw] = useState<Appointment[]>(() => loadInitialState('appointments', MOCK_APPOINTMENTS));
  const [beds, setBedsRaw] = useState<Bed[]>(() => loadInitialState('beds', MOCK_BEDS));
  const [hospitalizations, setHospitalizationsRaw] = useState<Hospitalization[]>(() => loadInitialState('hospitalizations', MOCK_HOSPITALIZATIONS));
  const [mutuals, setMutualsRaw] = useState<MutualFirm[]>(() => loadInitialState('mutuals', PARTNER_MUTUALS));
  const [expensesRaw, setExpensesRaw] = useState<Expense[]>(() => loadInitialState('expenses', []));
  const [bankTransfersRaw, setBankTransfersRaw] = useState<BankTransfer[]>(() => loadInitialState('bank_transfers', MOCK_BANK_TRANSFERS));

  const [specializedPneumoRecords, setSpecializedPneumoRecords] = useState<SpecializedPneumoRecord[]>(() => loadInitialState('specialized_pneumo', MOCK_SPECIALIZED_RECORDS));
  const [clinicalScoreCalculations, setClinicalScoreCalculations] = useState<ClinicalScoreCalculation[]>(() => loadInitialState('clinical_scores', MOCK_CLINICAL_SCORES));
  const [nurseVitalRecords, setNurseVitalRecords] = useState<NurseVitalRecord[]>(() => loadInitialState('nurse_vitals', MOCK_NURSE_VITALS));
  const [nurseRespiratoryRecords, setNurseRespiratoryRecords] = useState<NurseRespiratoryRecord[]>(() => loadInitialState('nurse_resp', MOCK_NURSE_RESPIRATORY));
  const [fluidBalanceRecords, setFluidBalanceRecords] = useState<FluidBalanceRecord[]>(() => loadInitialState('fluid_balances', MOCK_FLUID_BALANCES));
  const [nurseAdministeredMeds, setNurseAdministeredMeds] = useState<NurseAdministeredMed[]>(() => loadInitialState('nurse_meds', MOCK_NURSE_ADMIN_MEDS));
  const [nurseTargetedTransmissions, setNurseTargetedTransmissions] = useState<NurseTargetedTransmission[]>(() => loadInitialState('nurse_trans', MOCK_NURSE_TRANSMISSIONS));
  const [medicalExplorations, setMedicalExplorations] = useState<MedicalExploration[]>(() => loadInitialState('medical_explorations', MOCK_MEDICAL_EXPLORATIONS));
  const [medicalDocuments, setMedicalDocuments] = useState<MedicalDocumentRecord[]>(() => loadInitialState('medical_documents', MOCK_MEDICAL_DOCUMENTS));

  const [officinePartners, setOfficinePartners] = useState<OfficinePartner[]>(() => {
    const saved = localStorage.getItem('oclic_officine_partners');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });

  const [officineOrders, setOfficineOrders] = useState<OfficinePrescriptionOrder[]>(() => {
    const saved = localStorage.getItem('oclic_officine_orders');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });

  const [clinicProspects, setClinicProspects] = useState<ClinicProspect[]>(() => {
    const saved = localStorage.getItem('oclic_clinic_prospects');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });

  const deduplicate = <T extends { id: string }>(next: T[] | ((prev: T[]) => T[]), prev: T[]): T[] => {
    const list = typeof next === 'function' ? next(prev) : next;
    const seen = new Set<string>();
    return list.filter(item => {
      if (!item || !item.id) return true;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const setAllCenters = (val: HealthCenter[] | ((prev: HealthCenter[]) => HealthCenter[])) => setAllCentersRaw(prev => deduplicate(val, prev));
  const setUsers = (val: User[] | ((prev: User[]) => User[])) => setUsersRaw(prev => {
    const list = typeof val === 'function' ? val(prev) : val;
    const mergedList = [...list];
    MOCK_USERS.forEach(mockU => {
      const exists = mergedList.some(u => u.email.toLowerCase() === mockU.email.toLowerCase());
      if (!exists) {
        mergedList.push(mockU);
      }
    });
    const dedupedList = deduplicate(mergedList, prev);
    return dedupedList.map(u => {
      const fallbackUser = MOCK_USERS.find(mu => mu.email.toLowerCase() === u.email.toLowerCase());
      return {
        ...u,
        password: u.password || fallbackUser?.password || 'password'
      };
    });
  });
  const setPatients = (val: Patient[] | ((prev: Patient[]) => Patient[])) => setPatientsRaw(prev => deduplicate(val, prev));
  const setTickets = (val: Ticket[] | ((prev: Ticket[]) => Ticket[])) => setTicketsRaw(prev => {
    const list = deduplicate(val, prev);
    return list.map(t => ({
      ...t,
      amount: Number(t.amount || 0),
      patientAge: Number(t.patientAge || 0),
      insuranceCoverage: t.insuranceCoverage !== undefined && t.insuranceCoverage !== null ? Number(t.insuranceCoverage) : undefined,
      services: Array.isArray(t.services) ? t.services.map((s: any) => ({
        ...s,
        price: Number(s.price || 0)
      })) : t.services
    }));
  });
  const setServices = (val: Service[] | ((prev: Service[]) => Service[])) => setServicesRaw(prev => {
    const list = deduplicate(val, prev);
    return list.map(s => ({
      ...s,
      price: Number(s.price || 0),
      emergencyPrice: Number(s.emergencyPrice ?? s.price ?? 0),
      ipmPrice: Number(s.ipmPrice !== undefined && s.ipmPrice !== null && !isNaN(Number(s.ipmPrice)) ? s.ipmPrice : s.price ?? 0),
      insurancePrice: Number(s.insurancePrice !== undefined && s.insurancePrice !== null && !isNaN(Number(s.insurancePrice)) ? s.insurancePrice : s.price ?? 0),
      durationMinutes: Number(s.durationMinutes || 0)
    }));
  });
  const setMedicines = (val: Medicine[] | ((prev: Medicine[]) => Medicine[])) => setMedicinesRaw(prev => deduplicate(val, prev));
  const setSales = (val: Sale[] | ((prev: Sale[]) => Sale[])) => setSalesRaw(prev => deduplicate(val, prev));
  const setConsultations = (val: Consultation[] | ((prev: Consultation[]) => Consultation[])) => setConsultationsRaw(prev => deduplicate(val, prev));
  const setLabResults = (val: LabResult[] | ((prev: LabResult[]) => LabResult[])) => setLabResultsRaw(prev => deduplicate(val, prev));
  const setAppointments = (val: Appointment[] | ((prev: Appointment[]) => Appointment[])) => setAppointmentsRaw(prev => deduplicate(val, prev));
  const setBeds = (val: Bed[] | ((prev: Bed[]) => Bed[])) => setBedsRaw(prev => deduplicate(val, prev));
  const setHospitalizations = (val: Hospitalization[] | ((prev: Hospitalization[]) => Hospitalization[])) => setHospitalizationsRaw(prev => deduplicate(val, prev));
  const setMutuals = (val: MutualFirm[] | ((prev: MutualFirm[]) => MutualFirm[])) => setMutualsRaw(prev => {
    const list = deduplicate(val, prev);
    return list.map(m => ({
      ...m,
      coveragePercent: Number(m.coveragePercent || 0),
      unsettledAmount: Number(m.unsettledAmount || 0)
    }));
  });
  const setExpenses = (val: Expense[] | ((prev: Expense[]) => Expense[])) => setExpensesRaw(prev => deduplicate(val, prev));
  const setBankTransfers = (val: BankTransfer[] | ((prev: BankTransfer[]) => BankTransfer[])) => setBankTransfersRaw(prev => deduplicate(val, prev));
  const [isLoading, setIsLoading] = useState(false);

  const [subscriptionPlans, setSubscriptionPlansState] = useState<Record<'basic' | 'pro' | 'expert', PlanMetadata>>(() => DEFAULT_SUBSCRIPTION_PLANS);

  const updateSubscriptionPlans = (newPlans: Record<'basic' | 'pro' | 'expert', PlanMetadata>) => {
    setSubscriptionPlansState(newPlans);
  };

  const [useHostinger, setUseHostingerState] = useState<boolean>(() => {
    localStorage.setItem('use_hostinger', 'true');
    return true;
  });

  const [hostingerStatus, setHostingerStatus] = useState<{
    connected: boolean;
    error: string | null;
    dbInfo: any;
  }>({
    connected: false,
    error: null,
    dbInfo: { host: '', database: '', port: '3306', configured: false }
  });

  const setUseHostinger = (val: boolean) => {
    localStorage.setItem('use_hostinger', 'true');
    setUseHostingerState(true);
  };

  const checkHostingerStatus = async () => {
    try {
      const res = await fetch('/api/mysql/status');
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
      const data = await res.json();
      setHostingerStatus(data);
      return data;
    } catch (err: any) {
      console.warn("Vérification de l'état Hostinger en attente (initialisation du serveur...) :", err.message || err);
      const fallbackData = { 
        connected: false, 
        error: "Connexion au serveur de base de données en cours...", 
        dbInfo: { host: '', database: '', port: '3306', configured: false } 
      };
      setHostingerStatus(fallbackData);
      return fallbackData;
    }
  };

  const loadHostingerData = async () => {
    // Only trigger full loading spinner if we have zero cached items in memory
    const hasInitialData = patients.length > 0 || tickets.length > 0;
    if (!hasInitialData) {
      setIsLoading(true);
    }
    try {
      const isSeedingDisabled = localStorage.getItem('disable_database_seeding') === 'true';

      const tables = [
        { name: 'centers', setter: setAllCenters, mock: MOCK_CENTERS },
        { name: 'users', setter: setUsers, mock: MOCK_USERS },
        { name: 'patients', setter: setPatients, mock: MOCK_PATIENTS },
        { name: 'tickets', setter: setTickets, mock: MOCK_TICKETS },
        { name: 'services', setter: setServices, mock: MOCK_SERVICES },
        { name: 'medicines', setter: setMedicines, mock: MOCK_MEDICINES },
        { name: 'sales', setter: setSales, mock: [] },
        { name: 'consultations', setter: setConsultations, mock: MOCK_CONSULTATIONS },
        { name: 'lab_results', setter: setLabResults, mock: [] },
        { name: 'appointments', setter: setAppointments, mock: MOCK_APPOINTMENTS },
        { name: 'beds', setter: setBeds, mock: MOCK_BEDS },
        { name: 'hospitalizations', setter: setHospitalizations, mock: MOCK_HOSPITALIZATIONS },
        { name: 'mutuals', setter: setMutuals, mock: PARTNER_MUTUALS },
        { name: 'expenses', setter: setExpenses, mock: [] },
        { name: 'bank_transfers', setter: setBankTransfers, mock: MOCK_BANK_TRANSFERS }
      ];

      // Concurrent fetch: verify status and retrieve all table datasets simultaneously
      const [status, batchRes] = await Promise.all([
        checkHostingerStatus(),
        fetch('/api/mysql/data-all').catch(() => null)
      ]);

      if (!status.connected) {
        setIsLoading(false);
        return;
      }

      // 1. Try batch fetch first for high performance and single round-trip
      let batchSuccess = false;
      if (batchRes && batchRes.ok) {
        try {
          const batchJson = await batchRes.json();
          if (batchJson.success && batchJson.data) {
            batchSuccess = true;
            for (const t of tables) {
              const tableData = batchJson.data[t.name];
              if (Array.isArray(tableData) && tableData.length > 0) {
                t.setter(tableData);
                saveToLocalCache(t.name, tableData);
              } else if ((!tableData || tableData.length === 0) && t.mock.length > 0 && !isSeedingDisabled) {
                // If table is completely empty on remote, seed asynchronously
                fetch(`/api/mysql/seed/${t.name}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(t.mock)
                }).catch(() => {});
                t.setter(t.mock as any);
              } else if (Array.isArray(tableData)) {
                t.setter(tableData);
              }
            }
          }
        } catch (batchErr) {
          console.warn("[Hostinger MySQL] Mode batch différé, synchronisation table par table:", batchErr);
        }
      }

      if (!batchSuccess) {
        // 2. Parallel resilient fallback to individual tables
        await Promise.all(tables.map(async (t) => {
          try {
            const res = await fetch(`/api/mysql/data/${t.name}`);
            if (!res.ok) return;
            const result = await res.json();
            if (result.success) {
              if (result.count === 0 && t.mock.length > 0 && !isSeedingDisabled) {
                fetch(`/api/mysql/seed/${t.name}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(t.mock)
                }).catch(() => {});
                t.setter(t.mock as any);
              } else if (Array.isArray(result.data)) {
                t.setter(result.data);
                saveToLocalCache(t.name, result.data);
              }
            }
          } catch (tableErr) {
            console.warn(`[Hostinger MySQL] Synchronisation de la table ${t.name} différée:`, tableErr);
          }
        }));
      }
    } catch (e) {
      console.warn("[Hostinger MySQL] Synchronisation en attente de disponibilité :", e);
    } finally {
      setIsLoading(false);
    }
  };

  const getLocalState = (tableName: string): any[] => {
    switch (tableName) {
      case 'centers': return allCenters;
      case 'users': return users;
      case 'patients': return patients;
      case 'tickets': return tickets;
      case 'services': return services;
      case 'medicines': return medicines;
      case 'sales': return sales;
      case 'consultations': return consultations;
      case 'lab_results': return labResults;
      case 'appointments': return appointments;
      case 'beds': return beds;
      case 'hospitalizations': return hospitalizations;
      case 'expenses': return expensesRaw;
      default: return [];
    }
  };

  const sanitizeForDb = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeForDb(item)).filter(item => item !== undefined);
    }
    const clean: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        clean[key] = sanitizeForDb(val);
      }
    }
    return clean;
  };

  const dbWrite = async (tableName: string, id: string, docData: any) => {
    const tablesRequiringCenterId = [
      'patients', 'tickets', 'services', 'medicines', 'sales',
      'consultations', 'lab_results', 'appointments', 'beds', 'hospitalizations', 'expenses'
    ];
    let preparedData = { ...docData };
    if (tablesRequiringCenterId.includes(tableName)) {
      if (!preparedData.centerId) {
        preparedData.centerId = currentCenter?.id || currentUser?.centerId || 'center-1';
      }
    }

    // 1. Immediate local cache write (resilient offline backup, 0ms latency)
    try {
      const stateList = getLocalState(tableName);
      const exists = stateList.some((x: any) => x.id === id);
      const updated = exists ? stateList.map((x: any) => x.id === id ? { ...x, ...preparedData } : x) : [...stateList, { id, ...preparedData }];
      saveToLocalCache(tableName, updated);
    } catch (e) {
      console.warn(`[Local cache] write notice for ${tableName}:`, e);
    }

    // 2. High-speed database persistence in background (non-blocking for UI fluidity)
    if (useHostinger) {
      const payload = { id, ...preparedData };
      fetch(`/api/mysql/write/${tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(resJson => {
          if (!resJson.success) {
            console.warn(`[Hostinger MySQL] Synchronisation sur ${tableName}:`, resJson.error);
          }
        })
        .catch(err => {
          console.warn(`[Hostinger MySQL] Écriture différée en arrière-plan pour ${tableName}:`, err?.message || err);
        });
    }
  };

  const dbUpdate = async (tableName: string, id: string, changedFields: any) => {
    const stateList = getLocalState(tableName);
    const original = stateList.find((x: any) => x.id === id) || {};
    const merged = { ...original, ...changedFields, id };
    const tablesRequiringCenterId = [
      'patients', 'tickets', 'services', 'medicines', 'sales',
      'consultations', 'lab_results', 'appointments', 'beds', 'hospitalizations', 'expenses'
    ];
    if (tablesRequiringCenterId.includes(tableName)) {
      if (!merged.centerId) {
        merged.centerId = currentCenter?.id || currentUser?.centerId || original.centerId || 'center-1';
      }
    }

    // 1. Immediate local cache update (0ms latency)
    try {
      const updated = stateList.map((x: any) => (x.id === id ? merged : x));
      saveToLocalCache(tableName, updated);
    } catch (e) {
      console.warn(`[Local cache] update notice for ${tableName}:`, e);
    }

    // 2. Database persistence in background (non-blocking for UI fluidity)
    if (useHostinger) {
      fetch(`/api/mysql/write/${tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      })
        .then(res => res.json())
        .then(resJson => {
          if (!resJson.success) {
            console.warn(`[Hostinger MySQL] Mise à jour sur ${tableName}:`, resJson.error);
          }
        })
        .catch(err => {
          console.warn(`[Hostinger MySQL] Mise à jour différée sur ${tableName}:`, err?.message || err);
        });
    }
  };

  const dbDelete = async (tableName: string, id: string) => {
    // 1. Immediate local cache update
    try {
      const stateList = getLocalState(tableName);
      const updated = stateList.filter((x: any) => x.id !== id);
      saveToLocalCache(tableName, updated);
    } catch (e) {
      console.warn(`[Local cache] delete notice for ${tableName}:`, e);
    }

    // 2. Database persistence in background (non-blocking for UI fluidity)
    if (useHostinger) {
      fetch(`/api/mysql/delete/${tableName}/${id}`, {
        method: 'DELETE'
      })
        .then(res => res.json())
        .then(resJson => {
          if (!resJson.success) {
            console.warn(`[Hostinger MySQL] Suppression sur ${tableName}:`, resJson.error);
          }
        })
        .catch(err => {
          console.warn(`[Hostinger MySQL] Suppression différée sur ${tableName}:`, err?.message || err);
        });
    }
  };

  useEffect(() => {
    if (currentUser) {
      const { password: _, ...safeUser } = currentUser;
      localStorage.setItem('current_user', JSON.stringify(safeUser));
    } else {
      localStorage.removeItem('current_user');
    }
    if (currentCenter) {
      localStorage.setItem('current_center', JSON.stringify(currentCenter));
    } else {
      localStorage.removeItem('current_center');
    }
  }, [currentUser, currentCenter]);

  useEffect(() => {
    if (useHostinger) {
      loadHostingerData();
    } else {
      checkHostingerStatus();
    }
  }, [useHostinger]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);

    if (useHostinger && users.length === 0) {
      await loadHostingerData();
    }

    const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      const fallbackUser = MOCK_USERS.find(u => u.email.toLowerCase() === matched.email.toLowerCase());
      const expectedPassword = matched.password || fallbackUser?.password || 'password';
      if (password !== expectedPassword) {
        setIsLoading(false);
        return false;
      }

      if (!matched.password && fallbackUser?.password) {
        matched.password = fallbackUser.password;
      }

      setCurrentUser(matched);
      const isSuper = matched.role === Role.SUPER_ADMIN;
      const isOfficine = matched.role === Role.OFFICINE_MANAGER;
      const center = (isSuper || isOfficine) ? null : allCenters.find(c => c.id === matched.centerId) || MOCK_CENTERS[0];
      setCurrentCenter(center);
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('current_center');
    setCurrentUser(null);
    setCurrentCenter(null);
  };

  const switchCenter = async (center: HealthCenter | null) => {
    setCurrentCenter(center);
    if (currentUser) {
      const updatedUser = { ...currentUser, centerId: center ? center.id : '' };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      try {
        dbWrite('users', currentUser.id, updatedUser);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`);
      }
    }
  };

  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'ticketNumber' | 'centerId' | 'status'>): Promise<Ticket | null> => {
    setIsLoading(true);
    try {
      const codeSuffix = Math.floor(100 + Math.random() * 900);
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const ticketNumber = `CS-${dateStr}-${codeSuffix}`;

      const nameParts = ticketData.patientName.trim().split(' ');
      const searchFirst = nameParts[0]?.toLowerCase() || '';
      const searchLast = nameParts.slice(1).join(' ').toLowerCase() || '';

      let matchedPat = patients.find(p => 
        p.firstName.toLowerCase() === searchFirst && 
        p.lastName.toLowerCase() === searchLast
      );

      if (!matchedPat) {
        const codeValue = `P-2026-${Math.floor(100 + Math.random() * 900)}`;
        const patId = `pat-${Date.now()}`;
        matchedPat = {
          id: patId,
          centerId: currentCenter?.id || 'center-1',
          code: codeValue,
          firstName: nameParts[0] || 'Patient',
          lastName: nameParts.slice(1).join(' ') || 'Anonyme',
          age: ticketData.patientAge,
          birthDate: new Date(Date.now() - 31556952000 * ticketData.patientAge).toISOString().split('T')[0],
          gender: ticketData.patientGender,
          phone: ticketData.patientPhone || '770000000',
          address: ticketData.patientAddress || 'Dakar',
          createdAt: new Date().toISOString()
        };
        await dbWrite('patients', patId, matchedPat);
        setPatients(prev => [...prev, matchedPat!]);
      }

      const ticketId = `ticket-${Date.now()}`;
      const initializedServices = Array.isArray(ticketData.services) && ticketData.services.length > 0
        ? ticketData.services.map(s => {
            const matchedSrv = services.find(os => os.id === s.id || os.name.toLowerCase() === s.name.toLowerCase());
            return {
              ...s,
              category: s.category || matchedSrv?.category || ticketData.serviceCategory || '',
              status: s.status || 'WAITING'
            };
          })
        : [{
            id: ticketData.serviceId || 's-init',
            name: ticketData.serviceName,
            category: ticketData.serviceCategory || services.find(os => os.id === ticketData.serviceId)?.category || 'Consultation',
            price: Number(ticketData.amount || 0),
            status: 'WAITING' as const
          }];

      const deducedCategory = ticketData.serviceCategory ||
        initializedServices.map(s => s.category).filter(Boolean).join(', ') ||
        'Général';

      const newTicket: Ticket = {
        ...ticketData,
        id: ticketId,
        centerId: currentCenter?.id || 'center-1',
        ticketNumber,
        patientId: matchedPat.id,
        serviceCategory: deducedCategory,
        services: initializedServices,
        status: TicketStatus.WAITING,
        createdAt: new Date().toISOString()
      };

      setTickets(prev => [...prev, newTicket]);
      setIsLoading(false);

      try {
        await dbWrite('tickets', ticketId, newTicket);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'tickets');
      }

      return newTicket;
    } catch (err) {
      setIsLoading(false);
      handleFirestoreError(err, OperationType.CREATE, 'tickets');
      return null;
    }
  };

  const updateTicketStatus = async (id: string, status: string) => {
    if (!id) return;
    const isCompleted = ['COMPLETED', 'TERMINE', 'TERMINÉ'].includes(String(status).toUpperCase());
    const isProgress = ['IN_PROGRESS', 'EN_COURS', 'TRAITEMENT'].includes(String(status).toUpperCase());
    const normalizedStatus = isCompleted ? TicketStatus.COMPLETED : isProgress ? TicketStatus.IN_PROGRESS : TicketStatus.WAITING;

    const targetTicket = tickets.find(t => t.id === id || t.ticketNumber === id);
    const resolvedDocId = targetTicket?.id || id;
    let updatedServices: any[] | undefined = undefined;

    setTickets(prev => prev.map(t => {
      if (t.id === id || t.ticketNumber === id || t.id === resolvedDocId) {
        updatedServices = Array.isArray(t.services) && t.services.length > 0
          ? t.services.map(s => ({
              ...s,
              status: isCompleted ? ('COMPLETED' as const) : isProgress ? ('IN_PROGRESS' as const) : ('WAITING' as const)
            }))
          : [{
              id: t.serviceId || 's-main',
              name: t.serviceName,
              category: t.serviceCategory || 'Consultation',
              price: t.amount,
              status: isCompleted ? ('COMPLETED' as const) : isProgress ? ('IN_PROGRESS' as const) : ('WAITING' as const)
            }];

        return {
          ...t,
          status: normalizedStatus,
          services: updatedServices,
          ...(isCompleted ? { completedAt: new Date().toISOString() } : {})
        };
      }
      return t;
    }));

    const patch: Partial<Ticket> = {
      status: normalizedStatus,
      ...(updatedServices ? { services: updatedServices } : {}),
      ...(isCompleted ? { completedAt: new Date().toISOString() } : {})
    };

    try {
      await dbUpdate('tickets', resolvedDocId, patch);
    } catch (err) {
      console.error(`Erreur mise à jour Firestore pour ticket ${resolvedDocId}:`, err);
      handleFirestoreError(err, OperationType.UPDATE, `tickets/${resolvedDocId}`);
    }
  };

  const updateTicketTaskStatus = async (
    ticketId: string,
    serviceIndexOrId: string | number,
    status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED',
    details?: { performedBy?: string; notes?: string; results?: string; serviceId?: string; serviceName?: string }
  ) => {
    if (!ticketId) return;

    const targetTicket = tickets.find(t => t.id === ticketId || t.ticketNumber === ticketId);
    if (!targetTicket) return;

    const resolvedDocId = targetTicket.id || ticketId;
    const targetTaskStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' = status;

    let targetServices = Array.isArray(targetTicket.services) && targetTicket.services.length > 0
      ? [...targetTicket.services]
      : [{
          id: targetTicket.serviceId || 's-main',
          name: targetTicket.serviceName,
          category: targetTicket.serviceCategory,
          price: targetTicket.amount,
          status: 'WAITING' as const
        }];

    targetServices = targetServices.map((srv, idx) => {
      const match =
        (targetServices.length === 1) ||
        (typeof serviceIndexOrId === 'number' && idx === serviceIndexOrId) ||
        (String(idx) === String(serviceIndexOrId)) ||
        (srv.id && String(srv.id) === String(serviceIndexOrId)) ||
        (details?.serviceId && srv.id && String(srv.id) === String(details.serviceId)) ||
        (srv.name && srv.name.toLowerCase() === String(serviceIndexOrId).toLowerCase()) ||
        (details?.serviceName && srv.name && srv.name.toLowerCase() === details.serviceName.toLowerCase());

      if (match) {
        return {
          ...srv,
          status: targetTaskStatus,
          performedBy: details?.performedBy || srv.performedBy,
          performedAt: targetTaskStatus === 'COMPLETED' ? new Date().toISOString() : srv.performedAt,
          notes: details?.notes !== undefined ? details.notes : srv.notes,
          results: details?.results !== undefined ? details.results : srv.results
        };
      }
      return srv;
    });

    const allDone = targetServices.length > 0 && targetServices.every(s => s.status === 'COMPLETED');
    const anyProgress = targetServices.some(s => s.status === 'IN_PROGRESS');
    let overallStatus = targetTicket.status;
    if (allDone) {
      overallStatus = TicketStatus.COMPLETED;
    } else if (anyProgress || targetTaskStatus === 'IN_PROGRESS') {
      overallStatus = TicketStatus.IN_PROGRESS;
    } else if (targetTaskStatus === 'WAITING' && targetServices.every(s => s.status === 'WAITING')) {
      overallStatus = TicketStatus.WAITING;
    }

    const payload: Partial<Ticket> = {
      services: targetServices,
      status: overallStatus,
      ...(details?.performedBy ? { performedBy: details.performedBy } : {}),
      ...(details?.notes ? { taskNotes: details.notes } : {}),
      ...(details?.results ? { taskResults: details.results } : {}),
      ...(allDone || targetTaskStatus === 'COMPLETED' ? { completedAt: new Date().toISOString() } : {})
    };

    setTickets(prev => prev.map(t => (t.id === targetTicket.id || t.ticketNumber === targetTicket.ticketNumber || t.id === resolvedDocId) ? { ...t, ...payload } : t));

    try {
      await dbUpdate('tickets', resolvedDocId, payload);
    } catch (err) {
      console.error(`Erreur mise à jour Firestore tâche pour ticket ${resolvedDocId}:`, err);
      handleFirestoreError(err, OperationType.UPDATE, `tickets/${resolvedDocId}`);
    }
  };

  const deleteTicket = async (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id));
    try {
      await dbDelete('tickets', id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tickets/${id}`);
    }
  };

  const refreshTickets = async () => {
    if (useHostinger) {
      try {
        const res = await fetch('/api/mysql/data/tickets');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setTickets(json.data);
            try { localStorage.setItem('offline_tickets', JSON.stringify(json.data)); } catch {}
          }
        }
      } catch (e) {
        console.warn("[Hostinger MySQL] Rafraîchissement tickets:", e);
      }
    }
  };

  const addSale = async (items: any[], paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'CARD', ticketId?: string, patientName?: string) => {
    try {
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      const saleId = `sale-${Date.now()}`;
      const newSale: Sale = {
        id: saleId,
        centerId: currentCenter?.id || 'center-1',
        ticketId,
        patientName: patientName || 'Achat direct',
        items,
        totalAmount,
        paymentMethod,
        createdAt: new Date().toISOString()
      };
      setSales(prev => [newSale, ...prev]);
      await dbWrite('sales', saleId, newSale);

      for (const item of items) {
        const med = medicines.find(m => m.id === item.medicineId);
        if (med) {
          const newStock = Math.max(0, med.stock - item.quantity);
          setMedicines(prev => prev.map(m => m.id === med.id ? { ...m, stock: newStock } : m));
          await dbUpdate('medicines', med.id, { stock: newStock });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'sales');
    }
  };

  const registerCenter = async (centerData: Omit<HealthCenter, 'id' | 'isActive'>, adminData: Omit<User, 'id' | 'centerId' | 'role'>) => {
    setIsLoading(true);
    try {
      const centerId = `center-${Date.now()}`;
      const newCenter: HealthCenter = { ...centerData, id: centerId, isActive: true };
      const userId = `user-${Date.now()}`;
      const newAdmin: User = { ...adminData, id: userId, centerId, role: Role.ADMIN };

      setAllCenters(prev => [...prev, newCenter]);
      setUsers(prev => [...prev, newAdmin]);

      await dbWrite('centers', centerId, newCenter);
      await dbWrite('users', userId, newAdmin);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'centers_registration');
    } finally {
      setIsLoading(false);
    }
  };

  const createCenter = async (center: any) => {
    setIsLoading(true);
    try {
      const centerId = `center-${Date.now()}`;
      const newCenter: HealthCenter = {
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        ...center,
        id: centerId,
        isActive: true
      };
      setAllCenters(prev => [...prev, newCenter]);
      await dbWrite('centers', centerId, newCenter);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'centers');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCenter = async (center: Partial<HealthCenter>) => {
    if (currentCenter) {
      try {
        const updated = { ...currentCenter, ...center };
        setCurrentCenter(updated);
        setAllCenters(prev => prev.map(c => c.id === currentCenter.id ? updated : c));
        await dbUpdate('centers', currentCenter.id, updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `centers/${currentCenter.id}`);
      }
    }
  };

  const toggleCenterStatus = async (id: string, status: boolean) => {
    setAllCenters(prev => prev.map(c => c.id === id ? { ...c, isActive: status } : c));
    try {
      await dbUpdate('centers', id, { isActive: status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `centers/${id}`);
    }
  };

  const updateCenterInfo = async (id: string, centerData: Partial<HealthCenter>) => {
    setIsLoading(true);
    try {
      setAllCenters(prev => prev.map(c => c.id === id ? { ...c, ...centerData } : c));
      if (currentCenter && currentCenter.id === id) {
        setCurrentCenter(prev => prev ? { ...prev, ...centerData } : null);
      }
      await dbUpdate('centers', id, centerData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `centers/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCenter = async (id: string) => {
    setIsLoading(true);
    try {
      setAllCenters(prev => prev.filter(c => c.id !== id));
      await dbDelete('centers', id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `centers/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addService = async (serviceData: Omit<Service, 'id' | 'centerId'>) => {
    try {
      const serviceId = `service-${Date.now()}`;
      const newService: Service = {
        ...serviceData,
        id: serviceId,
        centerId: currentCenter?.id || 'center-1'
      };
      setServices(prev => [...prev, newService]);
      await dbWrite('services', serviceId, newService);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'services');
    }
  };

  const updateService = async (id: string, data: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    try {
      await dbUpdate('services', id, data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `services/${id}`);
    }
  };

  const deleteService = async (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    try {
      await dbDelete('services', id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `services/${id}`);
    }
  };

  const applySenegalConventionPricing = async (ipmRate: number = 0.80, insuranceRate: number = 0.85, targetCategory?: string): Promise<{ updatedCount: number }> => {
    setIsLoading(true);
    let count = 0;
    try {
      const updatedServices = services.map(s => {
        if (targetCategory && targetCategory !== 'ALL' && s.category?.toLowerCase() !== targetCategory.toLowerCase()) {
          return s;
        }
        const stdPrice = Number(s.price) || 2000;
        // Barème conventionné IPM Sénégal : 80% arrondi à 100 FCFA
        const calculatedIpm = Math.max(100, Math.round((stdPrice * ipmRate) / 100) * 100);
        // Barème conventionné Assurances privées Sénégal : 85% arrondi à 100 FCFA
        const calculatedInsurance = Math.max(100, Math.round((stdPrice * insuranceRate) / 100) * 100);
        // Majoration Urgence / Garde / Nuit
        let calculatedEmergency = Number(s.emergencyPrice);
        if (!calculatedEmergency || calculatedEmergency <= stdPrice) {
          const mult = (s.category === 'Consultation' || s.category === 'Dentaire' || s.category === 'Soins') ? 1.5 : 1.3;
          calculatedEmergency = Math.round((stdPrice * mult) / 100) * 100;
        }
        count++;
        return {
          ...s,
          ipmPrice: calculatedIpm,
          insurancePrice: calculatedInsurance,
          emergencyPrice: calculatedEmergency
        };
      });

      setServices(updatedServices);
      try {
        localStorage.setItem('offline_services', JSON.stringify(updatedServices));
      } catch (_) {}

      if (useHostinger) {
        const modifiedItems = updatedServices.filter(s => {
          if (targetCategory && targetCategory !== 'ALL') {
            return s.category?.toLowerCase() === targetCategory.toLowerCase();
          }
          return true;
        });

        try {
          await fetch('/api/mysql/batch-write/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(modifiedItems)
          });
        } catch (postErr) {
          console.warn("[Hostinger MySQL] Batch write error, falling back to dbUpdate:", postErr);
          for (const s of modifiedItems) {
            await dbUpdate('services', s.id, {
              ipmPrice: s.ipmPrice,
              insurancePrice: s.insurancePrice,
              emergencyPrice: s.emergencyPrice
            });
          }
        }
      }
    } catch (err) {
      console.error("Erreur lors de l'application du barème conventionnel :", err);
    } finally {
      setIsLoading(false);
    }
    return { updatedCount: count };
  };

  const addMedicine = async (medData: Omit<Medicine, 'id' | 'centerId'>) => {
    try {
      const medicineId = `medicine-${Date.now()}`;
      const newMedicine: Medicine = {
        ...medData,
        id: medicineId,
        centerId: currentCenter?.id || 'center-1'
      };
      setMedicines(prev => [...prev, newMedicine]);
      await dbWrite('medicines', medicineId, newMedicine);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'medicines');
    }
  };

  const updateMedicine = async (id: string, data: Partial<Medicine>) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    try {
      await dbUpdate('medicines', id, data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `medicines/${id}`);
    }
  };

  const deleteMedicine = async (id: string) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
    try {
      await dbDelete('medicines', id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `medicines/${id}`);
    }
  };

  const addUser = async (userData: (Omit<User, 'id' | 'centerId'> & { centerId?: string; officineId?: string; officineName?: string }) | Omit<User, 'id'>): Promise<User | null> => {
    setIsLoading(true);
    try {
      const userId = `user-${Date.now()}`;
      const newUser: User = {
        ...userData,
        id: userId,
        centerId: ('centerId' in userData && userData.centerId !== undefined) ? userData.centerId : (currentCenter?.id || 'center-1')
      };
      setUsers(prev => [...prev, newUser]);
      await dbWrite('users', userId, newUser);
      return newUser;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'users');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (id: string, data: Partial<User>): Promise<User | null> => {
    setIsLoading(true);
    try {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
      await dbUpdate('users', id, data);
      const updated = users.find(u => u.id === id);
      const res = updated ? { ...updated, ...data } : null;
      if (currentUser?.id === id && res) {
        setCurrentUser(res);
      }
      return res;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    setUsers(prev => prev.filter(u => u.id !== id));
    try {
      await dbDelete('users', id);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
      return false;
    }
  };

  const addPatient = async (patientData: Omit<Patient, 'id' | 'centerId' | 'code' | 'age' | 'createdAt'>): Promise<Patient | null> => {
    try {
      const codeValue = `P-2026-${Math.floor(100 + Math.random() * 900)}`;
      const ageValue = new Date().getFullYear() - new Date(patientData.birthDate).getFullYear();
      const patientId = `patient-${Date.now()}`;
      const newPatient: Patient = {
        ...patientData,
        id: patientId,
        centerId: currentCenter?.id || 'center-1',
        code: codeValue,
        age: ageValue,
        createdAt: new Date().toISOString()
      };
      setPatients(prev => [...prev, newPatient]);
      await dbWrite('patients', patientId, newPatient);
      return newPatient;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'patients');
      return null;
    }
  };

  const updatePatient = async (id: string, data: Partial<Patient>) => {
    try {
      const p = patients.find(pat => pat.id === id);
      if (p) {
        const ageVal = data.birthDate ? new Date().getFullYear() - new Date(data.birthDate).getFullYear() : p.age;
        const updated = { ...data, age: ageVal };
        setPatients(prev => prev.map(pat => pat.id === id ? { ...pat, ...updated } : pat));
        await dbUpdate('patients', id, updated);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `patients/${id}`);
    }
  };

  const saveConsultation = async (consData: Omit<Consultation, 'id' | 'createdAt'>): Promise<Consultation | null> => {
    try {
      const matchedDoc = users.find(u => u.id === consData.doctorId);
      const matchedPat = patients.find(p => p.id === consData.patientId);
      const consultationId = `consultation-${Date.now()}`;

      let generatedOfficineOrderId = consData.officineOrderId;
      if (consData.pharmacyType === 'OFFICINE' && !generatedOfficineOrderId) {
        const targetOfficine = officinePartners.find(op => op.name.toLowerCase() === (consData.officineName || '').toLowerCase()) || officinePartners[0];
        const orderItems: OfficineOrderItem[] = (consData.prescriptionItems || []).map(pi => ({
          medicineId: pi.medicineId,
          medicineName: pi.medicineName,
          dosage: pi.dosage,
          quantity: pi.quantity,
          available: undefined
        }));

        if (orderItems.length > 0) {
          generatedOfficineOrderId = `cmd-off-${Date.now()}`;
          const newOfficineOrder: OfficinePrescriptionOrder = {
            id: generatedOfficineOrderId,
            consultationId,
            centerId: consData.centerId || currentCenter?.id || 'center-1',
            patientId: consData.patientId,
            patientName: matchedPat ? `${matchedPat.firstName} ${matchedPat.lastName}` : 'Patient',
            patientPhone: matchedPat?.phone || '+221 77 000 00 00',
            patientAddress: consData.deliveryAddress || matchedPat?.address || 'Dakar',
            doctorId: consData.doctorId || 'u2',
            doctorName: matchedDoc ? matchedDoc.name : 'Médecin',
            officineId: targetOfficine?.id || 'off-1',
            officineName: consData.officineName || targetOfficine?.name || 'Grande Pharmacie Guigon',
            officinePhone: targetOfficine?.phone || '+221 33 821 21 00',
            officineAddress: targetOfficine?.address || 'Dakar',
            items: orderItems,
            deliveryFee: targetOfficine?.deliveryFee || 1500,
            deliveryAddress: consData.deliveryAddress || matchedPat?.address || 'Dakar',
            deliveryContactPhone: consData.deliveryPhone || matchedPat?.phone || '+221 77 000 00 00',
            status: 'DEMANDE_ENVOYEE',
            createdAt: new Date().toISOString()
          };
          setOfficineOrders(prev => {
            const updated = [newOfficineOrder, ...prev];
            localStorage.setItem('oclic_officine_orders', JSON.stringify(updated));
            return updated;
          });
        }
      }

      const completeConsultation: Consultation = {
        patientId: (consData as any).patientId || matchedPat?.id || '',
        date: (consData as any).date || new Date().toISOString().split('T')[0],
        status: (consData as any).status || 'completed',
        updatedAt: new Date().toISOString(),
        ...consData,
        id: consultationId,
        centerId: consData.centerId || currentCenter?.id || matchedPat?.centerId || 'center-1',
        patientName: matchedPat ? `${matchedPat.firstName} ${matchedPat.lastName}` : 'Patient',
        doctorName: matchedDoc ? matchedDoc.name : 'Médecin',
        officineOrderId: generatedOfficineOrderId,
        createdAt: new Date().toISOString()
      };

      setConsultations(prev => [completeConsultation, ...prev]);
      await dbWrite('consultations', consultationId, completeConsultation);

      if (consData.ticketId) {
        setTickets(prev => prev.map(t => t.id === consData.ticketId ? { ...t, status: TicketStatus.COMPLETED } : t));
        await dbUpdate('tickets', consData.ticketId, { status: TicketStatus.COMPLETED });
      }
      return completeConsultation;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'consultations');
      return null;
    }
  };

  const addLabResult = async (resData: Omit<LabResult, 'id' | 'createdAt' | 'updatedAt' | 'centerId'>): Promise<LabResult | null> => {
    try {
      const labId = `lab-${Date.now()}`;
      const newLab: LabResult = {
        ...resData,
        id: labId,
        centerId: currentCenter?.id || 'center-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setLabResults(prev => [newLab, ...prev]);
      await dbWrite('lab_results', labId, newLab);
      return newLab;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'lab_results');
      return null;
    }
  };

  const updateLabResult = async (id: string, data: Partial<LabResult>): Promise<LabResult | null> => {
    try {
      const updatedTime = new Date().toISOString();
      setLabResults(prev => prev.map(l => l.id === id ? { ...l, ...data, updatedAt: updatedTime } : l));
      await dbUpdate('lab_results', id, { ...data, updatedAt: updatedTime });
      const updated = labResults.find(l => l.id === id);
      return updated ? { ...updated, ...data, updatedAt: updatedTime } : null;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `lab_results/${id}`);
      return null;
    }
  };

  const deleteLabResult = async (id: string): Promise<boolean> => {
    setLabResults(prev => prev.filter(l => l.id !== id));
    try {
      await dbDelete('lab_results', id);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `lab_results/${id}`);
      return false;
    }
  };

  const createAppointment = async (apptData: Omit<Appointment, 'id' | 'centerId' | 'createdAt' | 'updatedAt' | 'status' | 'smsSent' | 'reminderSent'>): Promise<Appointment | null> => {
    try {
      const matchedDoc = users.find(u => u.id === apptData.doctorId);
      const apptId = `appt-${Date.now()}`;
      const newAppt: Appointment = {
        ...apptData,
        id: apptId,
        centerId: currentCenter?.id || 'center-1',
        status: AppointmentStatus.SCHEDULED,
        smsSent: true,
        reminderSent: false,
        doctorName: matchedDoc ? matchedDoc.name : 'Médecin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setAppointments(prev => [...prev, newAppt]);
      await dbWrite('appointments', apptId, newAppt);
      return newAppt;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'appointments');
      return null;
    }
  };

  const addBed = async (bedData: Omit<Bed, 'id' | 'centerId'>) => {
    try {
      const id = `bed-${Date.now()}`;
      const newBed: Bed = {
        ...bedData,
        id,
        centerId: currentCenter?.id || 'center-1',
        status: bedData.status || 'available'
      };
      setBeds(prev => [...prev, newBed]);
      await dbWrite('beds', id, newBed);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'beds');
    }
  };

  const updateBed = async (id: string, data: Partial<Bed>) => {
    try {
      setBeds(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
      await dbUpdate('beds', id, data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `beds/${id}`);
    }
  };

  const deleteBed = async (id: string) => {
    try {
      setBeds(prev => prev.filter(b => b.id !== id));
      await dbDelete('beds', id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `beds/${id}`);
    }
  };

  const admitPatient = async (hospData: Omit<Hospitalization, 'id' | 'centerId' | 'admissionDate' | 'status'>): Promise<Hospitalization | null> => {
    try {
      const id = `hosp-${Date.now()}`;
      const newHosp: Hospitalization = {
        ...hospData,
        id,
        centerId: currentCenter?.id || 'center-1',
        admissionDate: new Date().toISOString().split('T')[0],
        status: 'active',
        dailyNotes: hospData.dailyNotes || [],
        medications: hospData.medications || []
      };

      setHospitalizations(prev => [...prev, newHosp]);
      await dbWrite('hospitalizations', id, newHosp);

      await updateBed(hospData.bedId, { status: 'occupied', patientId: hospData.patientId });

      return newHosp;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'hospitalizations');
      return null;
    }
  };

  const dischargePatient = async (id: string, actualDischargeDate: string, totalCost: number) => {
    try {
      const hosp = hospitalizations.find(h => h.id === id);
      if (!hosp) return;

      const updated = {
        status: 'discharged' as const,
        actualDischargeDate,
        totalCost
      };

      setHospitalizations(prev => prev.map(h => h.id === id ? { ...h, ...updated } : h));
      await dbUpdate('hospitalizations', id, updated);

      await updateBed(hosp.bedId, { status: 'available', patientId: null });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `hospitalizations/${id}`);
    }
  };

  const updateHospitalization = async (id: string, data: Partial<Hospitalization>) => {
    try {
      setHospitalizations(prev => prev.map(h => h.id === id ? { ...h, ...data } : h));
      await dbUpdate('hospitalizations', id, data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `hospitalizations/${id}`);
    }
  };

  const deleteHospitalization = async (id: string) => {
    try {
      const hosp = hospitalizations.find(h => h.id === id);
      if (hosp) {
        if (hosp.status === 'active') {
          await updateBed(hosp.bedId, { status: 'available', patientId: null });
        }
      }
      setHospitalizations(prev => prev.filter(h => h.id !== id));
      await dbDelete('hospitalizations', id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `hospitalizations/${id}`);
    }
  };

  const addMutual = async (mutualData: Omit<MutualFirm, 'id'>) => {
    try {
      const id = `mutual-${Date.now()}`;
      const newMutual: MutualFirm = {
        ...mutualData,
        id,
        unsettledAmount: mutualData.unsettledAmount ?? 0
      };
      setMutuals(prev => [...prev, newMutual]);
      await dbWrite('mutuals', id, newMutual);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'mutuals');
    }
  };

  const deleteMutual = async (id: string) => {
    try {
      setMutuals(prev => prev.filter(m => m.id !== id));
      await dbDelete('mutuals', id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `mutuals/${id}`);
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'centerId' | 'createdAt' | 'createdBy'>) => {
    try {
      const id = `expense-${Date.now()}`;
      const centerId = currentCenter?.id || currentUser?.centerId || 'center-1';
      const createdBy = currentUser?.name || currentUser?.email || 'Système';
      const createdAt = new Date().toISOString();
      const newExpense: Expense = {
        ...expenseData,
        id,
        centerId,
        createdBy,
        createdAt
      };
      setExpenses(prev => [...prev, newExpense]);
      await dbWrite('expenses', id, newExpense);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'expenses');
    }
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    try {
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
      const current = expensesRaw.find(e => e.id === id);
      if (current) {
        await dbWrite('expenses', id, { ...current, ...data });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `expenses/${id}`);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      setExpenses(prev => prev.filter(e => e.id !== id));
      await dbDelete('expenses', id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `expenses/${id}`);
    }
  };

  const addBankTransfer = async (transferData: Omit<BankTransfer, 'id' | 'centerId' | 'createdAt' | 'createdBy'>): Promise<BankTransfer | null> => {
    try {
      const id = `transfer-${Date.now()}`;
      const centerId = currentCenter?.id || currentUser?.centerId || 'center-1';
      const createdBy = currentUser?.name || currentUser?.email || 'Propriétaire';
      const createdAt = new Date().toISOString();
      const newTransfer: BankTransfer = {
        ...transferData,
        id,
        centerId,
        createdBy,
        createdAt
      };
      setBankTransfers(prev => [newTransfer, ...prev]);
      await dbWrite('bank_transfers', id, newTransfer);
      return newTransfer;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'bank_transfers');
      return null;
    }
  };

  const deleteBankTransfer = async (id: string) => {
    try {
      setBankTransfers(prev => prev.filter(t => t.id !== id));
      await dbDelete('bank_transfers', id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `bank_transfers/${id}`);
    }
  };

  const purgeSimulatedData = async (options: {
    purgePatients: boolean;
    purgeCatalog: boolean;
    purgeUsersAndCenters: boolean;
  }) => {
    setIsLoading(true);
    try {
      localStorage.setItem('disable_database_seeding', 'true');

      const tablesToPurge: string[] = [];
      if (options.purgePatients) {
        tablesToPurge.push('patients', 'tickets', 'sales', 'consultations', 'lab_results', 'appointments');
      }
      if (options.purgeCatalog) {
        tablesToPurge.push('services', 'medicines');
      }
      if (options.purgeUsersAndCenters) {
        tablesToPurge.push('users', 'centers');
      }

      if (useHostinger) {
        const res = await fetch('/api/mysql/truncate-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tables: tablesToPurge })
        });
        const resJson = await res.json();
        if (!resJson.success) {
          throw new Error(resJson.error || "Échec de vidage MySQL par lot");
        }

        if (currentCenter && tablesToPurge.includes('centers')) {
          await dbWrite('centers', currentCenter.id, currentCenter);
        }
        if (currentUser && tablesToPurge.includes('users')) {
          await dbWrite('users', currentUser.id, {
            ...currentUser,
            centerId: currentCenter?.id || currentUser.centerId
          });
        }

        await loadHostingerData();
      } else {
        for (const tableName of tablesToPurge) {
          localStorage.removeItem(`offline_${tableName}`);
        }
      }

      if (options.purgePatients) {
        setPatients([]);
        setTickets([]);
        setSales([]);
        setConsultations([]);
        setLabResults([]);
        setAppointments([]);
      }
      if (options.purgeCatalog) {
        setServices([]);
        setMedicines([]);
      }
      if (options.purgeUsersAndCenters) {
        setAllCenters(currentCenter ? [currentCenter] : []);
        setUsers(currentUser ? [currentUser] : []);
      }
    } catch (e) {
      console.error("Erreur critique lors de la purge :", e);
    } finally {
      setIsLoading(false);
    }
  };

  const resetDatabaseSeeding = () => {
    localStorage.removeItem('disable_database_seeding');
    if (useHostinger) {
      loadHostingerData();
    } else {
      window.location.reload();
    }
  };

  const addOfficinePartner = async (partnerData: Omit<OfficinePartner, 'id'>): Promise<OfficinePartner> => {
    const newPartner: OfficinePartner = {
      ...partnerData,
      id: `off-${Date.now()}`
    } as OfficinePartner;
    setOfficinePartners(prev => {
      const updated = [newPartner, ...prev];
      localStorage.setItem('oclic_officine_partners', JSON.stringify(updated));
      return updated;
    });
    return newPartner;
  };

  const updateOfficinePartner = async (id: string, data: Partial<OfficinePartner>): Promise<void> => {
    setOfficinePartners(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...data } : p);
      localStorage.setItem('oclic_officine_partners', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteOfficinePartner = async (id: string): Promise<void> => {
    setOfficinePartners(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('oclic_officine_partners', JSON.stringify(updated));
      return updated;
    });
  };

  const createOfficineOrder = async (orderData: Omit<OfficinePrescriptionOrder, 'id' | 'createdAt' | 'status'>): Promise<OfficinePrescriptionOrder> => {
    const newOrder: OfficinePrescriptionOrder = {
      ...orderData,
      id: `cmd-off-${Date.now()}`,
      status: 'DEMANDE_ENVOYEE',
      createdAt: new Date().toISOString()
    } as OfficinePrescriptionOrder;
    setOfficineOrders(prev => {
      const updated = [newOrder, ...prev];
      localStorage.setItem('oclic_officine_orders', JSON.stringify(updated));
      return updated;
    });
    return newOrder;
  };

  const updateOfficineOrderStatus = async (
    id: string,
    status: OfficineOrderStatus,
    meta?: {
      officineNotes?: string;
      doctorNotes?: string;
      patientNotes?: string;
      totalPrice?: number;
      deliveryDriverName?: string;
      deliveryDriverPhone?: string;
      estimatedDeliveryTime?: string;
      items?: OfficineOrderItem[];
    }
  ): Promise<void> => {
    const now = new Date().toISOString();
    setOfficineOrders(prev => {
      const updated = prev.map(o => {
        if (o.id !== id) return o;
        return {
          ...o,
          status,
          ...(meta?.officineNotes !== undefined ? { officineNotes: meta.officineNotes } : {}),
          ...(meta?.doctorNotes !== undefined ? { doctorNotes: meta.doctorNotes } : {}),
          ...(meta?.patientNotes !== undefined ? { patientNotes: meta.patientNotes } : {}),
          ...(meta?.totalPrice !== undefined ? { totalPrice: meta.totalPrice } : {}),
          ...(meta?.deliveryDriverName !== undefined ? { deliveryDriverName: meta.deliveryDriverName } : {}),
          ...(meta?.deliveryDriverPhone !== undefined ? { deliveryDriverPhone: meta.deliveryDriverPhone } : {}),
          ...(meta?.estimatedDeliveryTime !== undefined ? { estimatedDeliveryTime: meta.estimatedDeliveryTime } : {}),
          ...(meta?.items !== undefined ? { items: meta.items } : {}),
          ...(status === 'DISPONIBILITE_CONFIRMEE' ? { availabilityConfirmedAt: now } : {}),
          ...(status === 'VALIDE_MEDECIN' ? { doctorValidatedAt: now } : {}),
          ...(status === 'VALIDE_PATIENT' ? { patientValidatedAt: now } : {}),
          ...(status === 'EN_LIVRAISON' ? { dispatchedAt: now } : {}),
          ...(status === 'LIVRE' ? { deliveredAt: now } : {})
        };
      });
      localStorage.setItem('oclic_officine_orders', JSON.stringify(updated));
      return updated;
    });
  };

  const updateClinicProspectStatus = (id: string, status: ProspectStatus, notes?: string) => {
    setClinicProspects(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          status,
          lastContactDate: new Date().toISOString().split('T')[0],
          ...(notes ? { notes: p.notes ? `${p.notes}\n[${new Date().toLocaleDateString('fr-FR')}] ${notes}` : notes } : {})
        };
      });
      localStorage.setItem('oclic_clinic_prospects', JSON.stringify(updated));
      return updated;
    });
  };

  const addClinicProspect = (prospect: Omit<ClinicProspect, 'id' | 'createdAt'>) => {
    const newP: ClinicProspect = {
      ...prospect,
      id: `prosp-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    } as ClinicProspect;
    setClinicProspects(prev => {
      const updated = [newP, ...prev];
      localStorage.setItem('oclic_clinic_prospects', JSON.stringify(updated));
      return updated;
    });
  };

  const updateClinicProspect = (id: string, data: Partial<ClinicProspect>) => {
    setClinicProspects(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...data } : p);
      localStorage.setItem('oclic_clinic_prospects', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteClinicProspect = (id: string) => {
    setClinicProspects(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('oclic_clinic_prospects', JSON.stringify(updated));
      return updated;
    });
  };

  const createOfficineManagerAccount = async (
    officineId: string,
    managerData: { name: string; email: string; phone?: string; password?: string }
  ): Promise<User | null> => {
    setIsLoading(true);
    try {
      const officine = officinePartners.find(p => p.id === officineId);
      const officineName = officine?.name || "Pharmacie d'Officine";
      const userId = `user-off-${Date.now()}`;
      const newUser: User = {
        id: userId,
        centerId: '',
        officineId: officineId,
        officineName: officineName,
        name: managerData.name.trim(),
        email: managerData.email.trim().toLowerCase(),
        role: Role.OFFICINE_MANAGER,
        specialty: "Pharmacien Titulaire & Gérant d'Officine",
        phone: managerData.phone?.trim() || officine?.phone || '',
        password: managerData.password || 'Officine2026!',
        isActive: true
      };

      setUsers(prev => [...prev.filter(u => u.email.toLowerCase() !== newUser.email.toLowerCase()), newUser]);
      await dbWrite('users', userId, newUser);

      await updateOfficinePartner(officineId, {
        managerUserId: userId,
        managerEmail: newUser.email,
        managerName: newUser.name,
        managerPhone: newUser.phone,
        pharmacistName: newUser.name
      });

      return newUser;
    } catch (err) {
      console.error('Erreur création compte gérant officine:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteOfficineManagerAccount = async (officineId: string, userId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await deleteUser(userId);
      await updateOfficinePartner(officineId, {
        managerUserId: undefined,
        managerEmail: undefined,
        managerName: undefined,
        managerPhone: undefined
      });
    } catch (err) {
      console.error('Erreur suppression compte gérant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetOfficineManagerPassword = async (userId: string, newPassword: string): Promise<void> => {
    await updateUser(userId, { password: newPassword });
  };

  const activeCenterId = currentCenter?.id || currentUser?.centerId || 'center-1';
  const isSuperAdmin = currentUser?.role === Role.SUPER_ADMIN;

  const filteredPatients = useMemo(() => (isSuperAdmin && !currentCenter) ? patients : patients.filter(p => p.centerId === activeCenterId), [isSuperAdmin, currentCenter, patients, activeCenterId]);
  const filteredTickets = useMemo(() => (isSuperAdmin && !currentCenter) ? tickets : tickets.filter(t => t.centerId === activeCenterId), [isSuperAdmin, currentCenter, tickets, activeCenterId]);
  const filteredServices = useMemo(() => (isSuperAdmin && !currentCenter) ? services : services.filter(s => s.centerId === activeCenterId), [isSuperAdmin, currentCenter, services, activeCenterId]);
  const filteredMedicines = useMemo(() => (isSuperAdmin && !currentCenter) ? medicines : medicines.filter(m => m.centerId === activeCenterId), [isSuperAdmin, currentCenter, medicines, activeCenterId]);
  const filteredSales = useMemo(() => (isSuperAdmin && !currentCenter) ? sales : sales.filter(s => s.centerId === activeCenterId), [isSuperAdmin, currentCenter, sales, activeCenterId]);
  const filteredConsultations = useMemo(() => (isSuperAdmin && !currentCenter) ? consultations : consultations.filter(c => c.centerId === activeCenterId), [isSuperAdmin, currentCenter, consultations, activeCenterId]);
  const filteredLabResults = useMemo(() => (isSuperAdmin && !currentCenter) ? labResults : labResults.filter(lr => lr.centerId === activeCenterId), [isSuperAdmin, currentCenter, labResults, activeCenterId]);
  const filteredAppointments = useMemo(() => (isSuperAdmin && !currentCenter) ? appointments : appointments.filter(a => a.centerId === activeCenterId), [isSuperAdmin, currentCenter, appointments, activeCenterId]);
  const filteredBeds = useMemo(() => (isSuperAdmin && !currentCenter) ? beds : beds.filter(b => b.centerId === activeCenterId), [isSuperAdmin, currentCenter, beds, activeCenterId]);
  const filteredHospitalizations = useMemo(() => (isSuperAdmin && !currentCenter) ? hospitalizations : hospitalizations.filter(h => h.centerId === activeCenterId), [isSuperAdmin, currentCenter, hospitalizations, activeCenterId]);
  const filteredExpenses = useMemo(() => (isSuperAdmin && !currentCenter) ? expensesRaw : expensesRaw.filter(e => e.centerId === activeCenterId), [isSuperAdmin, currentCenter, expensesRaw, activeCenterId]);
  const filteredBankTransfers = useMemo(() => (isSuperAdmin && !currentCenter) ? bankTransfersRaw : bankTransfersRaw.filter(t => t.centerId === activeCenterId), [isSuperAdmin, currentCenter, bankTransfersRaw, activeCenterId]);
  const filteredUsers = useMemo(() => (isSuperAdmin && !currentCenter) ? users : users.filter(u => u.centerId === activeCenterId && u.role !== Role.SUPER_ADMIN), [isSuperAdmin, currentCenter, users, activeCenterId]);

  const saveSpecializedPneumoRecord = (rec: SpecializedPneumoRecord) => {
    setSpecializedPneumoRecords(prev => {
      const updated = [rec, ...prev.filter(r => r.id !== rec.id)];
      localStorage.setItem('offline_specialized_pneumo', JSON.stringify(updated));
      return updated;
    });
  };

  const saveClinicalScoreCalculation = (rec: ClinicalScoreCalculation) => {
    setClinicalScoreCalculations(prev => {
      const updated = [rec, ...prev.filter(r => r.id !== rec.id)];
      localStorage.setItem('offline_clinical_scores', JSON.stringify(updated));
      return updated;
    });
  };

  const addNurseVitalRecord = (rec: NurseVitalRecord) => {
    setNurseVitalRecords(prev => {
      const updated = [rec, ...prev];
      localStorage.setItem('offline_nurse_vitals', JSON.stringify(updated));
      return updated;
    });
  };

  const addNurseRespiratoryRecord = (rec: NurseRespiratoryRecord) => {
    setNurseRespiratoryRecords(prev => {
      const updated = [rec, ...prev];
      localStorage.setItem('offline_nurse_resp', JSON.stringify(updated));
      return updated;
    });
  };

  const addFluidBalanceRecord = (rec: FluidBalanceRecord) => {
    setFluidBalanceRecords(prev => {
      const updated = [rec, ...prev];
      localStorage.setItem('offline_fluid_balances', JSON.stringify(updated));
      return updated;
    });
  };

  const addNurseAdministeredMed = (rec: NurseAdministeredMed) => {
    setNurseAdministeredMeds(prev => {
      const updated = [rec, ...prev];
      localStorage.setItem('offline_nurse_meds', JSON.stringify(updated));
      return updated;
    });
  };

  const addNurseTargetedTransmission = (rec: NurseTargetedTransmission) => {
    setNurseTargetedTransmissions(prev => {
      const updated = [rec, ...prev];
      localStorage.setItem('offline_nurse_trans', JSON.stringify(updated));
      return updated;
    });
  };

  const saveMedicalExploration = (rec: MedicalExploration) => {
    setMedicalExplorations(prev => {
      const updated = [rec, ...prev.filter(r => r.id !== rec.id)];
      localStorage.setItem('offline_medical_explorations', JSON.stringify(updated));
      return updated;
    });
  };

  const saveMedicalDocument = (doc: MedicalDocumentRecord) => {
    setMedicalDocuments(prev => {
      const exists = prev.some(d => d.id === doc.id);
      const updated = exists ? prev.map(d => d.id === doc.id ? doc : d) : [doc, ...prev];
      localStorage.setItem('offline_medical_documents', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteMedicalDocument = (id: string) => {
    setMedicalDocuments(prev => {
      const updated = prev.filter(d => d.id !== id);
      localStorage.setItem('offline_medical_documents', JSON.stringify(updated));
      return updated;
    });
  };

  const findDuplicatePatients = (candidate: Partial<Patient>): Patient[] => {
    return patients.filter(p => {
      if (candidate.id && p.id === candidate.id) return false;
      const cleanPhone = (candidate.phone || '').replace(/\D/g, '');
      const pPhone = (p.phone || '').replace(/\D/g, '');
      const samePhone = cleanPhone.length >= 7 && pPhone.length >= 7 && (cleanPhone === pPhone || cleanPhone.endsWith(pPhone) || pPhone.endsWith(cleanPhone));
      const sameHosp = candidate.hospitalNumber && p.hospitalNumber &&
        candidate.hospitalNumber.trim().toLowerCase() === p.hospitalNumber.trim().toLowerCase() &&
        candidate.hospitalNumber.trim().length > 3;
      const sameName = candidate.firstName && candidate.lastName &&
        p.firstName.trim().toLowerCase() === candidate.firstName.trim().toLowerCase() &&
        p.lastName.trim().toLowerCase() === candidate.lastName.trim().toLowerCase();
      const sameBirth = candidate.birthDate && p.birthDate === candidate.birthDate;
      return Boolean(samePhone || sameHosp || (sameName && sameBirth));
    });
  };

  const contextValue = useMemo(() => ({
    currentUser,
    currentCenter,
    allCenters,
    users: filteredUsers,
    patients: filteredPatients,
    tickets: filteredTickets,
    services: filteredServices,
    medicines: filteredMedicines,
    sales: filteredSales,
    consultations: filteredConsultations,
    labResults: filteredLabResults,
    appointments: filteredAppointments,
    specializedPneumoRecords,
    clinicalScoreCalculations,
    nurseVitalRecords,
    nurseRespiratoryRecords,
    fluidBalanceRecords,
    nurseAdministeredMeds,
    nurseTargetedTransmissions,
    medicalExplorations,
    medicalDocuments,
    saveSpecializedPneumoRecord,
    saveClinicalScoreCalculation,
    addNurseVitalRecord,
    addNurseRespiratoryRecord,
    addFluidBalanceRecord,
    addNurseAdministeredMed,
    addNurseTargetedTransmission,
    saveMedicalExploration,
    saveMedicalDocument,
    deleteMedicalDocument,
    findDuplicatePatients,
    isLoading,
    useHostinger,
    setUseHostinger,
    hostingerStatus,
    checkHostingerStatus,
    loadHostingerData,
    login,
    logout,
    switchCenter,
    createTicket,
    updateTicketStatus,
    updateTicketTaskStatus,
    deleteTicket,
    addSale,
    registerCenter,
    createCenter,
    updateCenter,
    updateCenterInfo,
    deleteCenter,
    toggleCenterStatus,
    addService,
    updateService,
    deleteService,
    applySenegalConventionPricing,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    addUser,
    updateUser,
    deleteUser,
    addPatient,
    updatePatient,
    saveConsultation,
    addLabResult,
    updateLabResult,
    deleteLabResult,
    createAppointment,
    addBed,
    updateBed,
    deleteBed,
    admitPatient,
    dischargePatient,
    updateHospitalization,
    deleteHospitalization,
    addMutual,
    deleteMutual,
    addExpense,
    updateExpense,
    deleteExpense,
    addBankTransfer,
    deleteBankTransfer,
    beds: filteredBeds,
    hospitalizations: filteredHospitalizations,
    mutuals,
    expenses: filteredExpenses,
    bankTransfers: filteredBankTransfers,
    officinePartners,
    officineOrders,
    clinicProspects,
    addOfficinePartner,
    updateOfficinePartner,
    deleteOfficinePartner,
    createOfficineOrder,
    updateOfficineOrderStatus,
    updateClinicProspectStatus,
    addClinicProspect,
    updateClinicProspect,
    deleteClinicProspect,
    createOfficineManagerAccount,
    deleteOfficineManagerAccount,
    resetOfficineManagerPassword,
    refreshTickets,
    purgeSimulatedData,
    resetDatabaseSeeding,
    subscriptionPlans,
    updateSubscriptionPlans
  }), [
    currentUser, currentCenter, allCenters, filteredUsers, filteredPatients, filteredTickets,
    filteredServices, filteredMedicines, filteredSales, filteredConsultations, filteredLabResults,
    filteredAppointments, isLoading, useHostinger, hostingerStatus, filteredBeds,
    officinePartners, officineOrders, clinicProspects,
    specializedPneumoRecords, clinicalScoreCalculations, nurseVitalRecords, nurseRespiratoryRecords,
    fluidBalanceRecords, nurseAdministeredMeds, nurseTargetedTransmissions, medicalExplorations,
    medicalDocuments
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useStore absolute constraint: must be used from inside an AppProvider');
  }
  return context;
};
