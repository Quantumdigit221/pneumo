import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import {
  MedicalExploration,
  ExplorationCategory,
  ExplorationStatus,
  ExplorationPriority,
  ExplorationExtractedItem,
  StructuredImagingReport,
  ExplorationAuditEntry,
  ExplorationResultVersion,
  SpirometryStructuredData,
  Role
} from '../types';
import { PARACLINICAL_CATALOG, MacroExplorationCategoryId } from '../utils/dpiConstants';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Eye,
  FileCheck,
  TrendingUp,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Camera,
  Activity,
  FileSpreadsheet,
  Download,
  Calendar,
  Save,
  Check,
  Search,
  Filter,
  Plus,
  Clock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  AlertCircle,
  X,
  Printer,
  ChevronRight,
  FileSearch,
  BarChart3,
  Stethoscope,
  Microscope,
  Edit3
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { VoiceDictationButton } from '../components/VoiceDictationButton';

type ActiveView = 'LISTE' | 'NOUVELLE' | 'DETAIL' | 'SAISIE_RESULTATS' | 'VALIDATION' | 'OCR_VERIFICATION' | 'TENDANCES' | 'STATISTIQUES';

// Standardized laboratory presets for rapid structured results entry
const LAB_PARAMETER_PRESETS: Record<string, { label: string; defaultUnit: string; defaultRef: string; criticalHigh?: number; criticalLow?: number }[]> = {
  HEMATOLOGIE: [
    { label: 'Hémoglobine (Hb)', defaultUnit: 'g/dL', defaultRef: '13.0 - 17.5', criticalLow: 7.0 },
    { label: 'Hématocrite', defaultUnit: '%', defaultRef: '40.0 - 52.0' },
    { label: 'Leucocytes (Globules Blancs)', defaultUnit: '/mm³', defaultRef: '4000 - 10000', criticalHigh: 25000, criticalLow: 1500 },
    { label: 'Polynucléaires Neutrophiles', defaultUnit: '/mm³', defaultRef: '2000 - 7500' },
    { label: 'Polynucléaires Éosinophiles', defaultUnit: '/mm³', defaultRef: '50 - 500' },
    { label: 'Lymphocytes', defaultUnit: '/mm³', defaultRef: '1000 - 4000' },
    { label: 'Plaquettes sanguines', defaultUnit: '/mm³', defaultRef: '150000 - 450000', criticalLow: 50000 }
  ],
  BIOCHIMIE: [
    { label: 'Créatinine sérique', defaultUnit: 'mg/L', defaultRef: '7.0 - 12.0', criticalHigh: 30.0 },
    { label: 'Urée sanguine', defaultUnit: 'g/L', defaultRef: '0.15 - 0.45' },
    { label: 'Clairance MDRD estimée', defaultUnit: 'mL/min', defaultRef: '> 60' },
    { label: 'Glycémie à jeun', defaultUnit: 'g/L', defaultRef: '0.70 - 1.10', criticalLow: 0.5, criticalHigh: 3.0 },
    { label: 'Sodium (Na+)', defaultUnit: 'mmol/L', defaultRef: '135 - 145', criticalLow: 125, criticalHigh: 155 },
    { label: 'Potassium (K+)', defaultUnit: 'mmol/L', defaultRef: '3.5 - 5.0', criticalLow: 2.8, criticalHigh: 6.0 },
    { label: 'Chlore (Cl-)', defaultUnit: 'mmol/L', defaultRef: '98 - 106' },
    { label: 'ASAT (TGO)', defaultUnit: 'UI/L', defaultRef: '< 35' },
    { label: 'ALAT (TGP)', defaultUnit: 'UI/L', defaultRef: '< 45' },
    { label: 'Bilirubine totale', defaultUnit: 'µmol/L', defaultRef: '< 17.0' }
  ],
  INFLAMMATION: [
    { label: 'Protéine C-Réactive (CRP)', defaultUnit: 'mg/L', defaultRef: '< 5.0', criticalHigh: 150.0 },
    { label: 'Vitesse de Sédimentation (VS 1ère heure)', defaultUnit: 'mm', defaultRef: '< 15' },
    { label: 'Procalcitonine (PCT)', defaultUnit: 'ng/mL', defaultRef: '< 0.25', criticalHigh: 2.0 }
  ],
  GAZOMETRIE: [
    { label: 'pH artériel', defaultUnit: '', defaultRef: '7.35 - 7.45', criticalLow: 7.30, criticalHigh: 7.55 },
    { label: 'PaO2 (Pression O2)', defaultUnit: 'mmHg', defaultRef: '80.0 - 100.0', criticalLow: 60.0 },
    { label: 'PaCO2 (Pression CO2)', defaultUnit: 'mmHg', defaultRef: '35.0 - 45.0', criticalHigh: 50.0 },
    { label: 'Bicarbonates (HCO3-)', defaultUnit: 'mmol/L', defaultRef: '22.0 - 26.0' },
    { label: 'SaO2 calculée', defaultUnit: '%', defaultRef: '95.0 - 99.0', criticalLow: 90.0 },
    { label: 'Lactates sanguins', defaultUnit: 'mmol/L', defaultRef: '0.5 - 2.0', criticalHigh: 4.0 }
  ],
  MICROBIOLOGIE: [
    { label: 'GeneXpert MTB complex', defaultUnit: '', defaultRef: 'Non Détecté' },
    { label: 'Résistance Rifampicine (RIF)', defaultUnit: '', defaultRef: 'Non Détectée' },
    { label: 'Examen direct crachats (BAAR / Ziehl)', defaultUnit: '', defaultRef: 'Négatif' },
    { label: 'Culture sur milieu de Löwenstein', defaultUnit: '', defaultRef: 'Stérile' }
  ],
  EFR_RESPIRATOIRE: [
    { label: 'CVF pré-BD (Capacité Vitale Forcée)', defaultUnit: 'L', defaultRef: '> 80% prédit' },
    { label: 'VEMS pré-BD (Volume Expiratoire Max/Seconde)', defaultUnit: 'L', defaultRef: '> 80% prédit' },
    { label: 'Rapport VEMS/CVF pré-BD (Tiffeneau)', defaultUnit: '%', defaultRef: '> 70.0%' },
    { label: 'VEMS post-BD (Salbutamol 400µg)', defaultUnit: 'L', defaultRef: '> 80% prédit' },
    { label: 'Gain VEMS absolu', defaultUnit: 'mL', defaultRef: '< 200 mL' },
    { label: 'Gain VEMS relatif', defaultUnit: '%', defaultRef: '< 12.0%' }
  ]
};

export const Explorations: React.FC = () => {
  const {
    patients,
    medicalExplorations,
    saveMedicalExploration,
    currentUser,
    currentCenter
  } = useStore();

  // Active view
  const [activeView, setActiveView] = useState<ActiveView>('LISTE');
  const [selectedExplorationId, setSelectedExplorationId] = useState<string | null>(medicalExplorations[0]?.id || null);

  // Simulated Active User Role switcher (to demonstrate strict RBAC / Security)
  const [activeSimulatedRole, setActiveSimulatedRole] = useState<'CLINICIAN' | 'NURSE' | 'LABORATORY' | 'SECRETARY' | 'STRUCTURE_ADMIN'>('CLINICIAN');
  const [rbacAlertMessage, setRbacAlertMessage] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterPatientId, setFilterPatientId] = useState<string>('ALL');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Modals & Action Dialogs
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [amendmentModalOpen, setAmendmentModalOpen] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState('');
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  // New Exploration Form State
  const [newPatientId, setNewPatientId] = useState<string>(patients[0]?.id || '');
  const [newMacroCategory, setNewMacroCategory] = useState<MacroExplorationCategoryId>('BIOLOGIE');
  const [newSubCategory, setNewSubCategory] = useState<string>('Hématologie');
  const [newCategory, setNewCategory] = useState<ExplorationCategory>('HEMATOLOGIE');
  const [newExamTitle, setNewExamTitle] = useState('NFS (Numération Formule Sanguine)');
  const [newExamType, setNewExamType] = useState('Biologie médicale');
  const [newIndication, setNewIndication] = useState('Bilan systématique d\'évaluation respiratoire.');
  const [newPriority, setNewPriority] = useState<ExplorationPriority>('NORMALE');
  const [newLabDestination, setNewLabDestination] = useState('Laboratoire Central CHREIN');
  const [newSpecimenType, setNewSpecimenType] = useState('Sang veineux EDTA');
  const [newPrescribedDate, setNewPrescribedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newRealizationDate, setNewRealizationDate] = useState('');
  const [newSimpleStatus, setNewSimpleStatus] = useState<'PRESCRIT' | 'EN_ATTENTE' | 'REALISE'>('PRESCRIT');

  // Results Entry Form State (Structured + Narrative + Spirometry + Attachment + Follow-ups)
  const [entryParameters, setEntryParameters] = useState<ExplorationExtractedItem[]>([]);
  const [entryNarrative, setEntryNarrative] = useState('');
  const [entryConclusion, setEntryConclusion] = useState('');
  const [entrySpecimenDate, setEntrySpecimenDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [entryRealizationDate, setEntryRealizationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [entrySimpleStatus, setEntrySimpleStatus] = useState<'PRESCRIT' | 'EN_ATTENTE' | 'REALISE'>('REALISE');
  const [entrySourceType, setEntrySourceType] = useState<'PHOTO' | 'PDF' | 'DICOM' | 'SAISIE_DIRECTE'>('SAISIE_DIRECTE');
  const [entryAttachmentName, setEntryAttachmentName] = useState('');
  const [entryFileUrl, setEntryFileUrl] = useState('');
  const [entrySpiro, setEntrySpiro] = useState<SpirometryStructuredData>({});
  const [entryFollowUpSummary, setEntryFollowUpSummary] = useState('');
  const [entryFollowUps, setEntryFollowUps] = useState<Array<{ id: string; date: string; summary: string }>>([]);

  // OCR Side-by-side Verification State
  const [ocrConfidence, setOcrConfidence] = useState(94);
  const [ocrDocumentPreview, setOcrDocumentPreview] = useState('https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80');
  const [ocrExtractedItems, setOcrExtractedItems] = useState<ExplorationExtractedItem[]>([
    { parameter: 'Hémoglobine (Hb)', value: '11.4', unit: 'g/dL', referenceInterval: '13.0 - 17.5', flag: 'BAS', confidence: 98 },
    { parameter: 'Leucocytes (GB)', value: '12400', unit: '/mm³', referenceInterval: '4000 - 10000', flag: 'ELEVE', confidence: 96 },
    { parameter: 'Polynucléaires Neutrophiles', value: '8800', unit: '/mm³', referenceInterval: '2000 - 7500', flag: 'ELEVE', confidence: 92 },
    { parameter: 'Plaquettes', value: '345000', unit: '/mm³', referenceInterval: '150000 - 450000', flag: 'NORMAL', confidence: 95 }
  ]);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  // Active Exploration lookup
  const activeExploration = useMemo(() => {
    return medicalExplorations.find(e => e.id === selectedExplorationId) || medicalExplorations[0];
  }, [medicalExplorations, selectedExplorationId]);

  // Pending validation items count (Section 7.6)
  const pendingValidationCount = useMemo(() => {
    return medicalExplorations.filter(e => e.status === 'SUBMITTED').length;
  }, [medicalExplorations]);

  // Critical alerts count (Section 7.7)
  const criticalAlertsCount = useMemo(() => {
    return medicalExplorations.filter(e => e.hasCriticalFlag).length;
  }, [medicalExplorations]);

  // Multi-criteria Filtered Explorations List
  const filteredExplorations = useMemo(() => {
    return medicalExplorations.filter(exp => {
      // Patient Filter
      if (filterPatientId !== 'ALL' && exp.patientId !== filterPatientId) return false;

      // Category Filter
      if (filterCategory !== 'ALL' && !exp.category.includes(filterCategory)) return false;

      // Status Filter
      if (filterStatus !== 'ALL' && exp.status !== filterStatus) return false;

      // Priority Filter
      if (filterPriority !== 'ALL' && exp.priority !== filterPriority) return false;

      // Date Range Filter
      if (dateStart && exp.date < dateStart) return false;
      if (dateEnd && exp.date > dateEnd) return false;

      // Search Query Filter (Request Number, Patient Name, Exam Title, IP)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = exp.requestNumber?.toLowerCase().includes(q);
        const matchesPatient = exp.patientName?.toLowerCase().includes(q);
        const matchesTitle = exp.title?.toLowerCase().includes(q);
        const matchesIp = exp.patientHospitalNumber?.toLowerCase().includes(q);
        if (!matchesNum && !matchesPatient && !matchesTitle && !matchesIp) return false;
      }

      return true;
    });
  }, [medicalExplorations, filterPatientId, filterCategory, filterStatus, filterPriority, dateStart, dateEnd, searchQuery]);

  // Pagination Slicing
  const totalPages = Math.ceil(filteredExplorations.length / itemsPerPage) || 1;
  const paginatedExplorations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredExplorations.slice(start, start + itemsPerPage);
  }, [filteredExplorations, currentPage]);

  // Longitudinal Trends Data (Hb, CRP, PaO2, VEMS, SpO2)
  const longitudinalTrendsData = useMemo(() => {
    return [
      { date: '18/10/2026', crp: 68.5, hb: 11.2, pao2: 78, vems: 55, spo2: 93, refCrp: 5, refPao2: 80 },
      { date: '20/10/2026', crp: 45.0, hb: 11.4, pao2: 82, vems: 58, spo2: 95, refCrp: 5, refPao2: 80 },
      { date: '22/10/2026', crp: 28.0, hb: 11.8, pao2: 85, vems: 62, spo2: 96, refCrp: 5, refPao2: 80 },
      { date: '24/10/2026', crp: 14.5, hb: 12.1, pao2: 89, vems: 68, spo2: 97, refCrp: 5, refPao2: 80 },
      { date: '25/10/2026', crp: 6.2, hb: 12.6, pao2: 92, vems: 74, spo2: 98, refCrp: 5, refPao2: 80 }
    ];
  }, []);

  // Handlers for State Machine Transitions (Section 7.3)
  const handleTransitionStatus = (expId: string, targetStatus: ExplorationStatus, notes?: string) => {
    const exp = medicalExplorations.find(e => e.id === expId);
    if (!exp) return;

    // RBAC Security Guard: Validation requires CLINICIAN or STRUCTURE_ADMIN
    if (targetStatus === 'VALIDATED') {
      if (activeSimulatedRole === 'SECRETARY' || activeSimulatedRole === 'NURSE') {
        setRbacAlertMessage(`Accès Refusé (403) : Le rôle « ${activeSimulatedRole} » n'est pas habilité à valider médicalement un résultat. Seul un CLINICIAN ou STRUCTURE_ADMIN peut signer.`);
        setTimeout(() => setRbacAlertMessage(null), 5000);
        return;
      }
    }

    const currentUserName = activeSimulatedRole === 'CLINICIAN' ? 'Dr. Cheikh Ndao' : activeSimulatedRole === 'NURSE' ? 'Mme Fatou Binetou Sarr' : activeSimulatedRole === 'LABORATORY' ? 'Technicien Labo CHREIN' : 'Admin CHREIN';

    const newAuditEntry: ExplorationAuditEntry = {
      id: 'aud-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: targetStatus === 'VALIDATED' ? 'VALIDATION' : targetStatus === 'SUBMITTED' ? 'SOUMISSION' : targetStatus === 'SPECIMEN_COLLECTED' ? 'PRELEVEMENT' : targetStatus === 'IN_PROGRESS' ? 'ANALYSE' : 'TRANSITION_STATUT',
      userId: currentUser?.id || 'u-active',
      userName: currentUserName,
      userRole: activeSimulatedRole,
      notes: notes || `Changement d'état vers ${targetStatus}`
    };

    const updated: MedicalExploration = {
      ...exp,
      status: targetStatus,
      validated: targetStatus === 'VALIDATED' ? true : exp.validated,
      validatedByDoctor: targetStatus === 'VALIDATED' ? currentUserName : exp.validatedByDoctor,
      validatedById: targetStatus === 'VALIDATED' ? (currentUser?.id || 'u1') : exp.validatedById,
      validationDate: targetStatus === 'VALIDATED' ? new Date().toISOString() : exp.validationDate,
      auditTrail: [...(exp.auditTrail || []), newAuditEntry],
      updatedAt: new Date().toISOString()
    };

    saveMedicalExploration(updated);
  };

  // Open Results Entry View with pre-populated parameters for category
  const handleOpenResultsEntry = (exp: MedicalExploration) => {
    setSelectedExplorationId(exp.id);
    if (exp.extractedParameters && exp.extractedParameters.length > 0) {
      setEntryParameters(exp.extractedParameters);
    } else {
      // Preload standard parameters according to category
      const catKey = Object.keys(LAB_PARAMETER_PRESETS).find(k => exp.category.includes(k)) || 'HEMATOLOGIE';
      const presets = LAB_PARAMETER_PRESETS[catKey] || LAB_PARAMETER_PRESETS.HEMATOLOGIE;
      setEntryParameters(presets.map(p => ({
        parameter: p.label,
        value: '',
        unit: p.defaultUnit,
        referenceInterval: p.defaultRef,
        flag: 'NORMAL'
      })));
    }
    setEntryNarrative(exp.narrativeReport || '');
    setEntryConclusion(exp.conclusion || '');
    setEntryRealizationDate(exp.realizationDate || new Date().toISOString().split('T')[0]);
    setEntrySimpleStatus(exp.simpleStatus || (exp.validated ? 'REALISE' : 'EN_ATTENTE'));
    setEntrySourceType(exp.sourceType || 'SAISIE_DIRECTE');
    setEntryAttachmentName(exp.attachmentName || '');
    setEntryFileUrl(exp.fileUrl || '');
    setEntrySpiro(exp.spirometryData || {});
    setEntryFollowUps(exp.followUpResults || []);
    setEntryFollowUpSummary('');
    setActiveView('SAISIE_RESULTATS');
  };

  // Save Results & Submit for Validation (Section 7.4 & 7.6)
  const handleSaveAndSubmitResults = (isSubmitForValidation: boolean) => {
    if (!activeExploration) return;

    // Detect abnormal and critical flags automatically
    let hasAbnormal = false;
    let hasCritical = false;

    const evaluatedParams = entryParameters.map(p => {
      let f = p.flag;
      const numVal = parseFloat(p.value.replace(',', '.'));
      if (!isNaN(numVal)) {
        // Compare with presets critical thresholds if available
        if (p.parameter.includes('pH') && numVal < 7.30) { f = 'CRITIQUE'; hasCritical = true; }
        else if (p.parameter.includes('PaO2') && numVal < 60) { f = 'CRITIQUE'; hasCritical = true; }
        else if (p.parameter.includes('PaCO2') && numVal > 50) { f = 'CRITIQUE'; hasCritical = true; }
        else if (p.parameter.includes('Hémoglobine') && numVal < 7.0) { f = 'CRITIQUE'; hasCritical = true; }
        else if (p.parameter.includes('Plaquettes') && numVal < 50000) { f = 'CRITIQUE'; hasCritical = true; }
        else if (p.parameter.includes('CRP') && numVal > 150) { f = 'CRITIQUE'; hasCritical = true; }
      }
      if (f !== 'NORMAL') hasAbnormal = true;
      return { ...p, flag: f };
    });

    const targetStatus: ExplorationStatus = isSubmitForValidation ? 'SUBMITTED' : 'RESULT_ENTERED';
    const currentUserName = activeSimulatedRole === 'LABORATORY' ? 'Technicien Labo CHREIN' : 'Dr. Cheikh Ndao';

    const newAudit: ExplorationAuditEntry = {
      id: 'aud-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: isSubmitForValidation ? 'SOUMISSION' : 'SAISIE_RESULTAT',
      userId: currentUser?.id || 'u-active',
      userName: currentUserName,
      userRole: activeSimulatedRole,
      notes: isSubmitForValidation ? 'Résultat saisi et soumis pour validation médicale' : 'Résultat sauvegardé en brouillon'
    };

    const finalSpiro: SpirometryStructuredData | undefined =
      activeExploration.category.includes('EFR') ||
      activeExploration.macroCategory === 'EFR' ||
      activeExploration.title.toLowerCase().includes('spirom')
        ? {
            ...entrySpiro,
            tiffeneauPre:
              entrySpiro.vemsPreL && entrySpiro.cvfPreL
                ? Number(((entrySpiro.vemsPreL / entrySpiro.cvfPreL) * 100).toFixed(1))
                : entrySpiro.tiffeneauPre,
            tiffeneauPost:
              entrySpiro.vemsPostL && entrySpiro.cvfPostL
                ? Number(((entrySpiro.vemsPostL / entrySpiro.cvfPostL) * 100).toFixed(1))
                : entrySpiro.tiffeneauPost,
            gainMl:
              entrySpiro.vemsPostL && entrySpiro.vemsPreL
                ? Math.round((entrySpiro.vemsPostL - entrySpiro.vemsPreL) * 1000)
                : entrySpiro.gainMl,
            gainPct:
              entrySpiro.vemsPostL && entrySpiro.vemsPreL && entrySpiro.vemsPreL > 0
                ? Number((((entrySpiro.vemsPostL - entrySpiro.vemsPreL) / entrySpiro.vemsPreL) * 100).toFixed(1))
                : entrySpiro.gainPct
          }
        : activeExploration.spirometryData;

    const updated: MedicalExploration = {
      ...activeExploration,
      extractedParameters: evaluatedParams,
      narrativeReport: entryNarrative,
      conclusion: entryConclusion,
      realizationDate: entryRealizationDate || new Date().toISOString().split('T')[0],
      simpleStatus: isSubmitForValidation ? 'REALISE' : entrySimpleStatus,
      sourceType: entrySourceType,
      attachmentName: entryAttachmentName || undefined,
      fileUrl: entryFileUrl || undefined,
      spirometryData: finalSpiro,
      followUpResults: entryFollowUps,
      hasAbnormalFlag: hasAbnormal,
      hasCriticalFlag: hasCritical,
      status: targetStatus,
      auditTrail: [...(activeExploration.auditTrail || []), newAudit],
      updatedAt: new Date().toISOString()
    };

    saveMedicalExploration(updated);
    setActiveView('LISTE');
  };

  // Create New Exploration Request (Section 7.2)
  const handleCreateNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === newPatientId) || patients[0];
    const generatedNumber = `EXP-2026-${String(medicalExplorations.length + 48).padStart(4, '0')}`;

    const newExp: MedicalExploration = {
      id: 'exp-' + Date.now(),
      requestNumber: generatedNumber,
      patientId: pat.id,
      patientName: `${pat.firstName} ${pat.lastName}`,
      patientHospitalNumber: pat.hospitalNumber || pat.code,
      patientAge: pat.age,
      patientGender: pat.gender,
      centerId: currentCenter?.id || 'center-1',
      category: newCategory,
      macroCategory: newMacroCategory,
      subCategory: newSubCategory,
      title: newExamTitle,
      examType: newExamType,
      clinicalIndication: newIndication,
      priority: newPriority,
      status: newSimpleStatus === 'REALISE' ? 'RESULT_ENTERED' : newSimpleStatus === 'EN_ATTENTE' ? 'IN_PROGRESS' : 'REQUESTED',
      simpleStatus: newSimpleStatus,
      date: newPrescribedDate || new Date().toISOString().split('T')[0],
      prescribedDate: newPrescribedDate || new Date().toISOString().split('T')[0],
      realizationDate: newRealizationDate || undefined,
      requestedAt: new Date().toISOString(),
      prescribedById: currentUser?.id || 'u1',
      prescribedByName: currentUser?.name || 'Dr. Cheikh Ndao',
      laboratoryDestination: newLabDestination,
      specimenType: newSpecimenType,
      sourceType: 'SAISIE_DIRECTE',
      extractedParameters: [],
      validated: false,
      auditTrail: [
        {
          id: 'aud-' + Date.now(),
          timestamp: new Date().toISOString(),
          action: 'CREATION',
          userId: currentUser?.id || 'u1',
          userName: currentUser?.name || 'Dr. Cheikh Ndao',
          userRole: 'CLINICIAN',
          notes: `Prescription médicale émise (${newPriority} - Statut ${newSimpleStatus})`
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveMedicalExploration(newExp);
    setSelectedExplorationId(newExp.id);
    setActiveView('LISTE');
  };

  // Return for Correction Handler
  const handleConfirmReturnForCorrection = () => {
    if (!activeExploration || !correctionReason.trim()) return;
    const currentUserName = activeSimulatedRole === 'CLINICIAN' ? 'Dr. Cheikh Ndao' : 'Praticien CHREIN';

    const newAudit: ExplorationAuditEntry = {
      id: 'aud-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'RETOURNER_CORRECTION',
      userId: currentUser?.id || 'u1',
      userName: currentUserName,
      userRole: activeSimulatedRole,
      notes: `Retourné pour correction : ${correctionReason}`
    };

    const updated: MedicalExploration = {
      ...activeExploration,
      status: 'RESULT_ENTERED',
      rejectionReason: correctionReason,
      auditTrail: [...(activeExploration.auditTrail || []), newAudit],
      updatedAt: new Date().toISOString()
    };

    saveMedicalExploration(updated);
    setCorrectionModalOpen(false);
    setCorrectionReason('');
  };

  // Create Amendment (Section 7.3)
  const handleConfirmAmendment = () => {
    if (!activeExploration || !amendmentReason.trim()) return;
    const currentUserName = activeSimulatedRole === 'CLINICIAN' ? 'Dr. Cheikh Ndao' : 'Biologiste CHREIN';
    const newVersionNum = (activeExploration.currentVersion || 1) + 1;

    const newVersion: ExplorationResultVersion = {
      versionNumber: newVersionNum,
      enteredAt: new Date().toISOString(),
      enteredById: currentUser?.id || 'u1',
      enteredByName: currentUserName,
      reasonForAmendment: amendmentReason,
      structuredParameters: activeExploration.extractedParameters,
      narrativeReport: activeExploration.narrativeReport,
      conclusion: activeExploration.conclusion
    };

    const newAudit: ExplorationAuditEntry = {
      id: 'aud-' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'AMENDEMENT',
      userId: currentUser?.id || 'u1',
      userName: currentUserName,
      userRole: activeSimulatedRole,
      notes: `Création de l'amendement V${newVersionNum} : ${amendmentReason}`
    };

    const updated: MedicalExploration = {
      ...activeExploration,
      status: 'AMENDED',
      currentVersion: newVersionNum,
      versions: [...(activeExploration.versions || []), newVersion],
      auditTrail: [...(activeExploration.auditTrail || []), newAudit],
      updatedAt: new Date().toISOString()
    };

    saveMedicalExploration(updated);
    setAmendmentModalOpen(false);
    setAmendmentReason('');
  };

  // OCR Side-by-side verification validation
  const handleValidateOcrExtraction = () => {
    if (!activeExploration) return;
    const updated: MedicalExploration = {
      ...activeExploration,
      extractedParameters: ocrExtractedItems,
      sourceType: 'PDF',
      status: 'RESULT_ENTERED',
      auditTrail: [
        ...(activeExploration.auditTrail || []),
        {
          id: 'aud-' + Date.now(),
          timestamp: new Date().toISOString(),
          action: 'EXTRACTION_OCR_VALIDEE',
          userId: currentUser?.id || 'u1',
          userName: 'Dr. Cheikh Ndao',
          userRole: 'CLINICIAN',
          notes: `Extraction OCR vérifiée et validée par le praticien (${ocrConfidence}% confiance globale)`
        }
      ]
    };
    saveMedicalExploration(updated);
    setActiveView('SAISIE_RESULTATS');
  };

  return (
    <div className="space-y-6">
      {/* Top Clinical Header & Active Simulated Role Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Microscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Module Explorations Médicales & Biologie
              </h1>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 uppercase">
                CHREIN Kaolack
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Conforme aux Sections 7, 8, 9 & 13 • Machine à états stricte • Traçabilité des versions • Alertes critiques
            </p>
          </div>
        </div>

        {/* Role Selector & Quick Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Simulated Active Role (RBAC Demo) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-xxs font-extrabold text-slate-400 uppercase">Rôle actif :</span>
            <select
              value={activeSimulatedRole}
              onChange={(e) => setActiveSimulatedRole(e.target.value as any)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="CLINICIAN">Médecin Praticien (CLINICIAN)</option>
              <option value="LABORATORY">Biologiste / Technicien (LABORATORY)</option>
              <option value="NURSE">Infirmier(e) Soins (NURSE)</option>
              <option value="SECRETARY">Secrétariat Médical (SECRETARY)</option>
              <option value="STRUCTURE_ADMIN">Administrateur (STRUCTURE_ADMIN)</option>
            </select>
          </div>

          <button
            onClick={() => setActiveView('NOUVELLE')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Demande</span>
          </button>
        </div>
      </div>

      {/* RBAC Security Alert Banner */}
      {rbacAlertMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-900 font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{rbacAlertMessage}</span>
          </div>
          <button onClick={() => setRbacAlertMessage(null)} className="p-1 hover:bg-rose-100 rounded text-rose-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Critical Value Alert Banner */}
      {criticalAlertsCount > 0 && (
        <div className="p-3.5 bg-rose-600 text-white rounded-2xl shadow-xs flex items-center justify-between text-xs font-bold animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 fill-current" />
            <span>
              <strong>Alerte de Sécurité Clinique :</strong> {criticalAlertsCount} exploration(s) présente(nt) des résultats au-dessus des seuils critiques (Acidose pH &lt; 7.30, Hypoxémie PaO2 &lt; 60 mmHg). Prise en charge immédiate requise.
            </span>
          </div>
          <button
            onClick={() => { setFilterPriority('CRITIQUE'); setActiveView('LISTE'); }}
            className="px-3 py-1 bg-white text-rose-700 rounded-lg text-xxs font-black hover:bg-rose-50 cursor-pointer shadow-2xs"
          >
            Voir les urgences
          </button>
        </div>
      )}

      {/* Navigation Tabs (Sections 7 & 8) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 overflow-x-auto text-xs font-bold">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView('LISTE')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeView === 'LISTE'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Toutes les Demandes ({medicalExplorations.length})</span>
          </button>

          <button
            onClick={() => setActiveView('VALIDATION')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 relative ${
              activeView === 'VALIDATION'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>File de Validation</span>
            {pendingValidationCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {pendingValidationCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('OCR_VERIFICATION')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeView === 'OCR_VERIFICATION'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSearch className="w-4 h-4" />
            <span>Import & OCR Côte à Côte</span>
          </button>

          <button
            onClick={() => setActiveView('TENDANCES')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeView === 'TENDANCES'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Courbes & Biomarqueurs</span>
          </button>

          <button
            onClick={() => setActiveView('STATISTIQUES')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeView === 'STATISTIQUES'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Indicateurs du Service</span>
          </button>
        </div>

        {/* Structure Context Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xxs font-mono text-slate-500 pr-2">
          <span>Service Pneumologie & Maladies Infectieuses</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VUE 1 : LISTE GÉNÉRALE & FILTRES MULTICRITÈRES (Section 8)               */}
      {/* ========================================================================= */}
      {activeView === 'LISTE' && (
        <div className="space-y-4">
          {/* Multi-criteria Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              {/* Search Bar */}
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Rechercher par N° de demande (ex: EXP-2026), patient, N° IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-teal-600 font-medium"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="ALL">Toutes Catégories (A–F)</option>
                  <option value="HEMATOLOGIE">A. Biologie — Hématologie</option>
                  <option value="BIOCHIMIE">A. Biologie — Biochimie</option>
                  <option value="GAZOMETRIE">A. Biologie — Gaz du sang / Autres</option>
                  <option value="INFLAMMATION">A. Biologie — Inflammation (CRP/VS)</option>
                  <option value="MICROBIOLOGIE">B. Microbiologie — Bactériologie</option>
                  <option value="MYCOBACTERIOLOGIE">B. Microbiologie — Mycobactériologie (BAAR / GeneXpert)</option>
                  <option value="VIROLOGIE">B. Microbiologie — Virologie</option>
                  <option value="MYCOLOGIE">B. Microbiologie — Mycologie & Parasitologie</option>
                  <option value="IMAGERIE">C. Imagerie Médicale (Radio / TDM / IRM / Écho)</option>
                  <option value="CARDIOVASCULAIRE">D. Explorations Cardiovasculaires (ECG / ETT / Holter)</option>
                  <option value="EFR">E. Explorations Fonctionnelles Respiratoires (Spirométrie / DLCO / TM6)</option>
                  <option value="AUTRES">F. Autres Explorations</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="ALL">Tous les Statuts</option>
                  <option value="REQUESTED">Prescrit (REQUESTED)</option>
                  <option value="SPECIMEN_COLLECTED">Prélevé (SPECIMEN_COLLECTED)</option>
                  <option value="IN_PROGRESS">En attente / Analyse (IN_PROGRESS)</option>
                  <option value="RESULT_ENTERED">Réalisé — Résultat saisi (RESULT_ENTERED)</option>
                  <option value="SUBMITTED">Réalisé — À valider (SUBMITTED)</option>
                  <option value="VALIDATED">Réalisé — Validé médicalement (VALIDATED)</option>
                  <option value="AMENDED">Amendé V2+ (AMENDED)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xxs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-400 uppercase">Priorité :</span>
                {['ALL', 'NORMALE', 'URGENTE', 'CRITIQUE'].map(prio => (
                  <button
                    key={prio}
                    onClick={() => setFilterPriority(prio)}
                    className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${
                      filterPriority === prio
                        ? prio === 'CRITIQUE' ? 'bg-rose-600 text-white' : 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {prio === 'ALL' ? 'Toutes' : prio}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">{filteredExplorations.length} exploration(s) trouvée(s)</span>
                {(searchQuery || filterCategory !== 'ALL' || filterStatus !== 'ALL' || filterPriority !== 'ALL') && (
                  <button
                    onClick={() => { setSearchQuery(''); setFilterCategory('ALL'); setFilterStatus('ALL'); setFilterPriority('ALL'); }}
                    className="text-teal-700 hover:underline font-bold"
                  >
                    Réinitialiser filtres
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table of Explorations */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xxs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">N° Demande</th>
                    <th className="p-3.5">Date & Heure</th>
                    <th className="p-3.5">Patient (N° IP)</th>
                    <th className="p-3.5">Examen & Catégorie</th>
                    <th className="p-3.5">Prescripteur</th>
                    <th className="p-3.5">Priorité</th>
                    <th className="p-3.5">Statut Cycle de Vie</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedExplorations.map(exp => (
                    <tr key={exp.id} className="hover:bg-teal-50/30 transition">
                      {/* Request Number */}
                      <td className="p-3.5 font-mono font-bold text-teal-900">
                        {exp.requestNumber}
                        {exp.currentVersion && exp.currentVersion > 1 && (
                          <span className="ml-1 text-3xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                            V{exp.currentVersion}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-slate-600 font-medium">
                        <div>Prescrit : {exp.prescribedDate || exp.date}</div>
                        {exp.realizationDate && (
                          <div className="text-3xs text-emerald-700 font-bold">
                            Réalisé : {exp.realizationDate}
                          </div>
                        )}
                      </td>

                      {/* Patient */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900">{exp.patientName}</div>
                        <div className="text-xxs font-mono text-slate-400">{exp.patientHospitalNumber} • {exp.patientAge} ans</div>
                      </td>

                      {/* Exam */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{exp.title}</div>
                        <span className="text-[10px] font-mono font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          {exp.subCategory || exp.category}
                        </span>
                        {exp.attachmentName && (
                          <span className="ml-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                            {exp.sourceType}: {exp.attachmentName}
                          </span>
                        )}
                      </td>

                      {/* Prescriber */}
                      <td className="p-3.5 text-slate-600">
                        {exp.prescribedByName}
                      </td>

                      {/* Priority */}
                      <td className="p-3.5">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          exp.priority === 'CRITIQUE'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : exp.priority === 'URGENTE'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {exp.priority}
                        </span>
                      </td>

                      {/* Status Machine Badge */}
                      <td className="p-3.5">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 w-fit ${
                            exp.status === 'VALIDATED' || exp.simpleStatus === 'REALISE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : exp.status === 'SUBMITTED' || exp.simpleStatus === 'EN_ATTENTE'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            {exp.status === 'VALIDATED' && <Check className="w-3 h-3 text-emerald-600" />}
                            <span>
                              {exp.status === 'VALIDATED'
                                ? 'Réalisé (Validé)'
                                : exp.simpleStatus === 'REALISE' || exp.status === 'RESULT_ENTERED' || exp.status === 'SUBMITTED'
                                ? 'Réalisé'
                                : exp.simpleStatus === 'EN_ATTENTE' || exp.status === 'IN_PROGRESS' || exp.status === 'SPECIMEN_COLLECTED'
                                ? 'En attente'
                                : 'Prescrit'}
                            </span>
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">{exp.status}</span>
                        </div>
                        {exp.hasCriticalFlag && (
                          <span className="text-[9px] font-black text-rose-600 flex items-center gap-0.5 mt-0.5">
                            <AlertCircle className="w-3 h-3" /> Valeur critique !
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setSelectedExplorationId(exp.id); setActiveView('DETAIL'); }}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                            title="Consulter le dossier et l'historique"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {exp.status !== 'VALIDATED' && (
                            <button
                              onClick={() => handleOpenResultsEntry(exp)}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xxs font-bold transition cursor-pointer flex items-center gap-1"
                              title="Saisir ou modifier les résultats"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Résultats</span>
                            </button>
                          )}

                          {exp.status === 'SUBMITTED' && (
                            <button
                              onClick={() => handleTransitionStatus(exp.id, 'VALIDATED', 'Validation médicale directe depuis la liste')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xxs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Valider médicalement le résultat"
                            >
                              <Check className="w-3 h-3" />
                              <span>Valider</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="text-xxs font-mono">
                Page {currentPage} sur {totalPages} ({filteredExplorations.length} demandes au total)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xxs font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  Précédent
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xxs font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 2 : NOUVELLE DEMANDE D'EXPLORATION (Section 7.2)                     */}
      {/* ========================================================================= */}
      {activeView === 'NOUVELLE' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Prescription d'une Nouvelle Exploration Médicale
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Conforme aux protocoles diagnostiques du Service de Pneumologie CHREIN Kaolack
              </p>
            </div>
            <button
              onClick={() => setActiveView('LISTE')}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              Retour à la liste
            </button>
          </div>

          <form onSubmit={handleCreateNewRequest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Patient Selection */}
              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                  Patient & N° Hospitalier *
                </label>
                <select
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 cursor-pointer"
                  required
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} — ({p.hospitalNumber || p.code}) • {p.age} ans
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                  Niveau d'Urgence / Priorité *
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 cursor-pointer"
                >
                  <option value="NORMALE">Normale (Bilan programmé)</option>
                  <option value="URGENTE">Urgente (Délai &lt; 24 heures)</option>
                  <option value="CRITIQUE">Critique (Urgence vitale immédiate)</option>
                </select>
              </div>
            </div>

            {/* Catégories structurées A-F */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <span className="text-xxs font-black uppercase text-slate-600 tracking-wider block">
                Sélection Rapide par Catégorie (A – F) *
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PARACLINICAL_CATALOG.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setNewMacroCategory(cat.id);
                      const firstSub = cat.subCategories[0];
                      setNewSubCategory(firstSub.label);
                      setNewCategory(firstSub.explorationCategory);
                      setNewExamTitle(firstSub.exams[0]);
                      setNewLabDestination(cat.defaultLab);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      newMacroCategory === cat.id
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-teal-50'
                    }`}
                  >
                    {cat.letter}. {cat.label}
                  </button>
                ))}
              </div>

              {/* Subcategories & Quick Exam Chips */}
              {(() => {
                const activeCat = PARACLINICAL_CATALOG.find(c => c.id === newMacroCategory) || PARACLINICAL_CATALOG[0];
                return (
                  <div className="space-y-2.5 pt-1">
                    {activeCat.subCategories.map(sub => (
                      <div key={sub.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-xxs font-extrabold text-teal-900 uppercase tracking-wide block">
                          {sub.label}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {sub.exams.map(exam => (
                            <button
                              key={exam}
                              type="button"
                              onClick={() => {
                                setNewSubCategory(sub.label);
                                setNewCategory(sub.explorationCategory);
                                setNewExamTitle(exam);
                                setNewExamType(sub.label);
                                setNewLabDestination(activeCat.defaultLab);
                              }}
                              className={`px-2.5 py-1 rounded-md text-xxs font-semibold transition cursor-pointer ${
                                newExamTitle === exam
                                  ? 'bg-teal-600 text-white font-bold'
                                  : 'bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-800'
                              }`}
                            >
                              {exam}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="text-xxs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                  Intitulé Précis de l'Examen (libre ou sélectionné) *
                </label>
                <input
                  type="text"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                  Statut
                </label>
                <select
                  value={newSimpleStatus}
                  onChange={(e) => setNewSimpleStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                >
                  <option value="PRESCRIT">Prescrit</option>
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="REALISE">Réalisé</option>
                </select>
              </div>

              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                  Date de prescription *
                </label>
                <input
                  type="date"
                  value={newPrescribedDate}
                  onChange={(e) => setNewPrescribedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                  Date de réalisation (si effectué)
                </label>
                <input
                  type="date"
                  value={newRealizationDate}
                  onChange={(e) => setNewRealizationDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                  Laboratoire ou Service Destinataire
                </label>
                <input
                  type="text"
                  value={newLabDestination}
                  onChange={(e) => setNewLabDestination(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                />
              </div>
              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                  Type de Prélèvement / Échantillon
                </label>
                <input
                  type="text"
                  value={newSpecimenType}
                  onChange={(e) => setNewSpecimenType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                />
              </div>
            </div>

            {/* Clinical Indication */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xxs font-bold text-slate-700 block uppercase tracking-wider">
                  Indication Clinique & Renseignements Médicaux *
                </label>
                <VoiceDictationButton
                  value={newIndication}
                  onTranscript={(val) => setNewIndication(val)}
                  fieldName="Indication clinique d'exploration"
                  buttonText="Dicter indication"
                  size="xs"
                />
              </div>
              <textarea
                rows={3}
                value={newIndication}
                onChange={(e) => setNewIndication(e.target.value)}
                placeholder="Préciser les signes fonctionnels, les hypothèses diagnostiques et le contexte médical..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-teal-600"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveView('LISTE')}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Générer et Transmettre la Demande</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 3 : FILE DE VALIDATION MÉDICALE (Section 7.6)                         */}
      {/* ========================================================================= */}
      {activeView === 'VALIDATION' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <strong>File d'attente des résultats soumis à validation médicale :</strong> Seuls les praticiens habilités (CLINICIAN) peuvent apposer leur signature électronique.
              </div>
            </div>
            <span className="text-xxs font-mono font-bold bg-amber-100 px-2.5 py-1 rounded-lg">
              {pendingValidationCount} résultat(s) en attente
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {medicalExplorations.filter(e => e.status === 'SUBMITTED').map(exp => (
              <div key={exp.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {exp.requestNumber}
                    </span>
                    <h3 className="font-black text-slate-900 text-sm">{exp.title}</h3>
                    {exp.priority === 'CRITIQUE' && (
                      <span className="text-3xs font-black bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                        URGENCE CRITIQUE
                      </span>
                    )}
                  </div>
                  <div className="text-xxs text-slate-400 font-mono">
                    Patient : <strong className="text-slate-800">{exp.patientName}</strong> ({exp.patientHospitalNumber})
                  </div>
                </div>

                {/* Structured Parameters Table */}
                {exp.extractedParameters && exp.extractedParameters.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xxs font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="p-2.5">Paramètre</th>
                          <th className="p-2.5">Valeur observée</th>
                          <th className="p-2.5">Unité</th>
                          <th className="p-2.5">Intervalle de référence laboratoire</th>
                          <th className="p-2.5">Alerte</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {exp.extractedParameters.map((p, idx) => (
                          <tr key={idx} className={p.flag === 'CRITIQUE' ? 'bg-rose-50/60 font-bold' : p.flag !== 'NORMAL' ? 'bg-amber-50/40' : ''}>
                            <td className="p-2.5 font-medium">{p.parameter}</td>
                            <td className="p-2.5 font-mono font-bold text-slate-900">{p.value}</td>
                            <td className="p-2.5 text-slate-500">{p.unit}</td>
                            <td className="p-2.5 text-slate-500 font-mono text-xxs">{p.referenceInterval || p.referenceRange}</td>
                            <td className="p-2.5">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                p.flag === 'CRITIQUE' ? 'bg-rose-600 text-white' : p.flag === 'ELEVE' || p.flag === 'BAS' || p.flag === 'POSITIF' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {p.flag}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Narrative & Conclusion */}
                {exp.conclusion && (
                  <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 text-xs">
                    <span className="text-xxs font-extrabold uppercase text-teal-900 block mb-0.5">
                      Conclusion Technique Provisoire :
                    </span>
                    <p className="font-semibold text-slate-800">{exp.conclusion}</p>
                  </div>
                )}

                {/* Action Controls for Validation */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xxs text-slate-500">
                    Saisi par le laboratoire • En attente de signature médicale
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedExplorationId(exp.id); setCorrectionModalOpen(true); }}
                      className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Retourner pour correction
                    </button>

                    <button
                      onClick={() => handleTransitionStatus(exp.id, 'VALIDATED', 'Validation médicale officielle avec signature électronique')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valider & Signer le Résultat</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {pendingValidationCount === 0 && (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
                <p className="font-bold text-slate-700 text-sm">Tous les résultats sont validés</p>
                <p className="text-xs">Aucun résultat en attente de signature médicale dans la file.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 4 : SAISIE DES RÉSULTATS STRUCTURÉS & NARRATIFS (Section 7.4)         */}
      {/* ========================================================================= */}
      {activeView === 'SAISIE_RESULTATS' && activeExploration && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {activeExploration.requestNumber}
                </span>
                <h2 className="text-base font-black text-slate-900">
                  Saisie des Résultats d'Exploration : {activeExploration.title}
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Patient : {activeExploration.patientName} ({activeExploration.patientHospitalNumber}) • Indication : {activeExploration.clinicalIndication}
              </p>
            </div>
            <button
              onClick={() => setActiveView('LISTE')}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              Fermer la saisie
            </button>
          </div>

          {/* Quick preset insert bar */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
              Paramètres types de la spécialité :
            </span>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => {
                  setEntryParameters([
                    { parameter: 'Hémoglobine (Hb)', value: '11.4', unit: 'g/dL', referenceInterval: '13.0 - 17.5', flag: 'BAS' },
                    { parameter: 'Leucocytes', value: '12400', unit: '/mm³', referenceInterval: '4000 - 10000', flag: 'ELEVE' },
                    { parameter: 'Plaquettes', value: '345000', unit: '/mm³', referenceInterval: '150000 - 450000', flag: 'NORMAL' }
                  ]);
                }}
                className="text-xxs font-bold px-2 py-1 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-800 rounded-md transition cursor-pointer"
              >
                + Modèle NFS
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntryParameters([
                    { parameter: 'pH artériel', value: '7.38', unit: '', referenceInterval: '7.35 - 7.45', flag: 'NORMAL' },
                    { parameter: 'PaO2', value: '62.0', unit: 'mmHg', referenceInterval: '80 - 100', flag: 'BAS' },
                    { parameter: 'PaCO2', value: '47.5', unit: 'mmHg', referenceInterval: '35 - 45', flag: 'ELEVE' },
                    { parameter: 'HCO3-', value: '28.2', unit: 'mmol/L', referenceInterval: '22 - 26', flag: 'ELEVE' }
                  ]);
                }}
                className="text-xxs font-bold px-2 py-1 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-800 rounded-md transition cursor-pointer"
              >
                + Modèle Gazométrie
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntryParameters([
                    { parameter: 'GeneXpert MTB', value: 'DÉTECTÉ (High)', unit: '', referenceInterval: 'Non Détecté', flag: 'POSITIF' },
                    { parameter: 'Résistance RIF', value: 'NON DÉTECTÉE (Sensible)', unit: '', referenceInterval: 'Non Détectée', flag: 'NORMAL' }
                  ]);
                }}
                className="text-xxs font-bold px-2 py-1 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-800 rounded-md transition cursor-pointer"
              >
                + Modèle GeneXpert PNT
              </button>
            </div>
          </div>

          {/* Structured Parameters Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800">Paramètres Biologiques & Mesures Structurées :</span>
              <button
                type="button"
                onClick={() => setEntryParameters(prev => [...prev, { parameter: 'Nouveau paramètre', value: '', unit: '', referenceInterval: '', flag: 'NORMAL' }])}
                className="text-xxs font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-xxs font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="p-2.5">Paramètre</th>
                    <th className="p-2.5">Valeur</th>
                    <th className="p-2.5">Unité</th>
                    <th className="p-2.5">Norme / Réf. Labo</th>
                    <th className="p-2.5">Indicateur</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entryParameters.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.parameter}
                          onChange={(e) => {
                            const updated = [...entryParameters];
                            updated[idx].parameter = e.target.value;
                            setEntryParameters(updated);
                          }}
                          className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) => {
                            const updated = [...entryParameters];
                            updated[idx].value = e.target.value;
                            setEntryParameters(updated);
                          }}
                          placeholder="Valeur"
                          className="w-24 p-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.unit}
                          onChange={(e) => {
                            const updated = [...entryParameters];
                            updated[idx].unit = e.target.value;
                            setEntryParameters(updated);
                          }}
                          placeholder="Unité"
                          className="w-20 p-1.5 border border-slate-200 rounded-lg text-xs text-slate-600"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.referenceInterval || ''}
                          onChange={(e) => {
                            const updated = [...entryParameters];
                            updated[idx].referenceInterval = e.target.value;
                            setEntryParameters(updated);
                          }}
                          placeholder="Ex: 12.0 - 16.0"
                          className="w-32 p-1.5 border border-slate-200 rounded-lg text-xxs text-slate-500 font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={row.flag}
                          onChange={(e) => {
                            const updated = [...entryParameters];
                            updated[idx].flag = e.target.value as any;
                            setEntryParameters(updated);
                          }}
                          className={`p-1.5 rounded-lg text-xxs font-bold border ${
                            row.flag === 'CRITIQUE' ? 'bg-rose-100 text-rose-800 border-rose-300' : row.flag !== 'NORMAL' ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-white border-slate-200'
                          }`}
                        >
                          <option value="NORMAL">NORMAL</option>
                          <option value="BAS">BAS</option>
                          <option value="ELEVE">ELEVE</option>
                          <option value="POSITIF">POSITIF</option>
                          <option value="ANORMAL">ANORMAL</option>
                          <option value="CRITIQUE">CRITIQUE (Urgence)</option>
                        </select>
                      </td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => setEntryParameters(entryParameters.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dates, Statut et Pièce jointe (Photo / PDF / DICOM) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="text-xxs font-bold text-slate-700 block mb-1">Date de réalisation</label>
              <input
                type="date"
                value={entryRealizationDate}
                onChange={(e) => setEntryRealizationDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-mono"
              />
            </div>
            <div>
              <label className="text-xxs font-bold text-slate-700 block mb-1">Statut clinique</label>
              <select
                value={entrySimpleStatus}
                onChange={(e) => setEntrySimpleStatus(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-bold"
              >
                <option value="PRESCRIT">Prescrit</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="REALISE">Réalisé</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xxs font-bold text-slate-700 block mb-1">
                Joindre un fichier (Photo, PDF ou DICOM)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*,.pdf,.dcm,application/dicom"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setEntryAttachmentName(f.name);
                    const ext = f.name.toLowerCase();
                    if (ext.endsWith('.dcm')) setEntrySourceType('DICOM');
                    else if (ext.endsWith('.pdf')) setEntrySourceType('PDF');
                    else setEntrySourceType('PHOTO');
                    const reader = new FileReader();
                    reader.onload = () => setEntryFileUrl(String(reader.result || ''));
                    reader.readAsDataURL(f);
                  }}
                  className="text-xxs bg-white border border-slate-200 rounded-lg p-1.5 flex-1"
                />
                {entryAttachmentName && (
                  <span className="px-2 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded text-3xs font-bold truncate max-w-[140px]">
                    {entryAttachmentName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Spirométrie structurée pré/post-BD si EFR */}
          {(activeExploration.category.includes('EFR') ||
            activeExploration.macroCategory === 'EFR' ||
            activeExploration.title.toLowerCase().includes('spirom')) && (
            <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-teal-950 uppercase tracking-wide text-xxs">
                  Spirométrie Structurée — Pré & Post-Bronchodilatateurs
                </span>
                <span className="text-xxs font-mono text-teal-800 font-bold">
                  {entrySpiro.vemsPreL && entrySpiro.cvfPreL
                    ? `VEMS/CVF Pré: ${((entrySpiro.vemsPreL / entrySpiro.cvfPreL) * 100).toFixed(1)}%`
                    : ''}
                  {entrySpiro.vemsPostL && entrySpiro.vemsPreL
                    ? ` • Gain BD: ${Math.round((entrySpiro.vemsPostL - entrySpiro.vemsPreL) * 1000)} mL (${(((entrySpiro.vemsPostL - entrySpiro.vemsPreL) / entrySpiro.vemsPreL) * 100).toFixed(1)}%)`
                    : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
                <div>
                  <label className="text-3xs font-bold text-slate-600 block mb-0.5">VEMS Pré (L)</label>
                  <input type="number" step="0.01" value={entrySpiro.vemsPreL ?? ''} onChange={(e) => setEntrySpiro({ ...entrySpiro, vemsPreL: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-mono" />
                </div>
                <div>
                  <label className="text-3xs font-bold text-slate-600 block mb-0.5">VEMS Pré (%)</label>
                  <input type="number" step="0.1" value={entrySpiro.vemsPrePct ?? ''} onChange={(e) => setEntrySpiro({ ...entrySpiro, vemsPrePct: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-mono" />
                </div>
                <div>
                  <label className="text-3xs font-bold text-slate-600 block mb-0.5">CVF Pré (L)</label>
                  <input type="number" step="0.01" value={entrySpiro.cvfPreL ?? ''} onChange={(e) => setEntrySpiro({ ...entrySpiro, cvfPreL: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-mono" />
                </div>
                <div>
                  <label className="text-3xs font-bold text-slate-600 block mb-0.5">VEMS Post (L)</label>
                  <input type="number" step="0.01" value={entrySpiro.vemsPostL ?? ''} onChange={(e) => setEntrySpiro({ ...entrySpiro, vemsPostL: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-mono" />
                </div>
                <div>
                  <label className="text-3xs font-bold text-slate-600 block mb-0.5">VEMS Post (%)</label>
                  <input type="number" step="0.1" value={entrySpiro.vemsPostPct ?? ''} onChange={(e) => setEntrySpiro({ ...entrySpiro, vemsPostPct: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-mono" />
                </div>
                <div>
                  <label className="text-3xs font-bold text-slate-600 block mb-0.5">CVF Post (L)</label>
                  <input type="number" step="0.01" value={entrySpiro.cvfPostL ?? ''} onChange={(e) => setEntrySpiro({ ...entrySpiro, cvfPostL: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-mono" />
                </div>
              </div>
            </div>
          )}

          {/* Narrative Compte Rendu & Conclusion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xxs font-bold text-slate-700 block uppercase tracking-wider">
                  Compte Rendu Narratif / Méthodologie
                </label>
                <VoiceDictationButton
                  value={entryNarrative}
                  onTranscript={(val) => setEntryNarrative(val)}
                  fieldName="Compte rendu narratif d'exploration"
                  buttonText="Dicter CR"
                  size="xs"
                />
              </div>
              <textarea
                rows={4}
                value={entryNarrative}
                onChange={(e) => setEntryNarrative(e.target.value)}
                placeholder="Détails techniques, automate utilisé, qualité du prélèvement..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-xs focus:outline-teal-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xxs font-bold text-slate-700 block uppercase tracking-wider">
                  Conclusion Biologique / Diagnostique
                </label>
                <VoiceDictationButton
                  value={entryConclusion}
                  onTranscript={(val) => setEntryConclusion(val)}
                  fieldName="Conclusion diagnostique d'exploration"
                  buttonText="Dicter conclusion"
                  size="xs"
                />
              </div>
              <textarea
                rows={4}
                value={entryConclusion}
                onChange={(e) => setEntryConclusion(e.target.value)}
                placeholder="Synthèse claire pour le clinicien..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-xs text-slate-900 focus:outline-teal-600"
              />
            </div>
          </div>

          {/* Résultats successifs / Suivi longitudinal sur le même examen */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
            <span className="text-xxs font-black uppercase text-slate-600 tracking-wider block">
              Enregistrement de Résultats Successifs (Contrôles itératifs)
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={entryFollowUpSummary}
                onChange={(e) => setEntryFollowUpSummary(e.target.value)}
                placeholder="Ex: Contrôle J7 : CRP descendue à 18 mg/L, normalisation leucocytaire..."
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (!entryFollowUpSummary.trim()) return;
                  setEntryFollowUps(prev => [
                    ...prev,
                    { id: `fu-${Date.now()}`, date: entryRealizationDate || new Date().toISOString().split('T')[0], summary: entryFollowUpSummary.trim() }
                  ]);
                  setEntryFollowUpSummary('');
                }}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xxs cursor-pointer"
              >
                + Ajouter suivi
              </button>
            </div>
            {entryFollowUps.length > 0 && (
              <div className="space-y-1 pt-1">
                {entryFollowUps.map(fu => (
                  <div key={fu.id} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <span><strong className="font-mono text-teal-800">{fu.date}</strong> — {fu.summary}</span>
                    <button
                      type="button"
                      onClick={() => setEntryFollowUps(prev => prev.filter(x => x.id !== fu.id))}
                      className="text-rose-500 hover:text-rose-700 text-xxs font-bold cursor-pointer"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xxs text-slate-500">
              « Les résultats soumis apparaîtront immédiatement dans la file de validation médicale. »
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveAndSubmitResults(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Sauvegarder Brouillon
              </button>

              <button
                type="button"
                onClick={() => handleSaveAndSubmitResults(true)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Soumettre pour Validation Médicale</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 5 : IMPORTATION CONTRÔLÉE & EXTRACTION ASSISTÉE CÔTE À CÔTE (Sec. 7.5)  */}
      {/* ========================================================================= */}
      {activeView === 'OCR_VERIFICATION' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Section 7.5
                </span>
                <h2 className="text-base font-black text-slate-900">
                  Importation Contrôlée & Vérification Assistée Côte à Côte
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                « Aucune extraction OCR ne doit être intégrée comme résultat validé sans intervention humaine vérifiée. »
              </p>
            </div>
            <button
              onClick={() => setActiveView('LISTE')}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              Fermer
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 Columns: Original Document Preview */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-teal-600" />
                  <span>Document Source (PDF / Cliché)</span>
                </span>
                <span className="text-xxs font-mono text-slate-400">laboratoire_chrein_bio.pdf</span>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-2 bg-slate-900/5 relative group overflow-hidden h-[420px] flex items-center justify-center">
                <img
                  src={ocrDocumentPreview}
                  alt="Compte rendu original"
                  className="max-h-full max-w-full object-contain rounded-xl shadow-xs"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xxs font-bold text-slate-700 shadow-xs">
                  Zoom 100%
                </div>
              </div>

              <div className="flex items-center justify-between text-xxs text-slate-500">
                <span>Format vérifié : PDF médical / PNG • Pas d'exécution de code</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOcrProcessing(true);
                    setTimeout(() => {
                      setIsOcrProcessing(false);
                      setOcrConfidence(97);
                    }, 800);
                  }}
                  className="text-teal-700 font-bold hover:underline"
                >
                  {isOcrProcessing ? 'Analyse OCR en cours...' : 'Re-scanner le document'}
                </button>
              </div>
            </div>

            {/* Right 6 Columns: Extracted Data with Confidence & Validation */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Données Extraites Assistées</span>
                </span>
                <span className="text-xxs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Indice de confiance global : {ocrConfidence}%
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-50 text-xxs font-sans font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="p-2">Paramètre</th>
                      <th className="p-2">Valeur</th>
                      <th className="p-2">Unité</th>
                      <th className="p-2">Réf.</th>
                      <th className="p-2 text-right">Confiance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {ocrExtractedItems.map((r, i) => (
                      <tr key={i} className="hover:bg-teal-50/30">
                        <td className="p-2 font-sans font-medium">{r.parameter}</td>
                        <td className="p-2 font-bold text-teal-900">{r.value}</td>
                        <td className="p-2 text-slate-500">{r.unit}</td>
                        <td className="p-2 text-slate-400 text-xxs">{r.referenceInterval}</td>
                        <td className="p-2 text-right">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            (r.confidence || 95) > 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {r.confidence || 95}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xxs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Contrôle humain obligatoire :</span>
                </div>
                <p>
                  Vérifiez attentivement les unités et les valeurs par rapport au document original avant de les intégrer au dossier médical informatisé.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleValidateOcrExtraction}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valider et Transférer vers la Saisie du Dossier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 6 : DÉTAIL D'UNE EXPLORATION & AUDIT TRAIL (Section 8)                 */}
      {/* ========================================================================= */}
      {activeView === 'DETAIL' && activeExploration && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                  {activeExploration.requestNumber}
                </span>
                <h2 className="text-base font-black text-slate-900">{activeExploration.title}</h2>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  activeExploration.status === 'VALIDATED' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}>
                  {activeExploration.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Prescrit le {activeExploration.date} par {activeExploration.prescribedByName} pour {activeExploration.patientName} ({activeExploration.patientHospitalNumber})
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeExploration.status === 'VALIDATED' && (
                <button
                  type="button"
                  onClick={() => setAmendmentModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Créer un Amendement</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveView('LISTE')}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>

          {/* Machine à états : progression visuelle */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
              Cycle de Vie de la Demande :
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xxs font-bold">
              {[
                { s: 'REQUESTED', label: '1. Prescrite' },
                { s: 'SPECIMEN_COLLECTED', label: '2. Prélèvement' },
                { s: 'IN_PROGRESS', label: '3. Analyse' },
                { s: 'SUBMITTED', label: '4. Soumise' },
                { s: 'VALIDATED', label: '5. Validée' }
              ].map((step, idx) => {
                const isPassed = activeExploration.status === 'VALIDATED' || (activeExploration.status === 'SUBMITTED' && idx < 4) || (activeExploration.status === 'REQUESTED' && idx === 0);
                const isCurrent = activeExploration.status === step.s;
                return (
                  <div key={step.s} className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg border ${
                      isCurrent
                        ? 'bg-teal-600 text-white border-teal-700 shadow-2xs'
                        : isPassed
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-white text-slate-400 border-slate-200'
                    }`}>
                      {step.label}
                    </span>
                    {idx < 4 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Results Display */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Résultats Validés & Paramètres Mesurés :
            </h3>

            {activeExploration.extractedParameters && activeExploration.extractedParameters.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xxs font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="p-3">Paramètre</th>
                      <th className="p-3">Valeur</th>
                      <th className="p-3">Unité</th>
                      <th className="p-3">Norme Laboratoire</th>
                      <th className="p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeExploration.extractedParameters.map((p, i) => (
                      <tr key={i} className={p.flag === 'CRITIQUE' ? 'bg-rose-50/70 font-bold' : ''}>
                        <td className="p-3 font-medium">{p.parameter}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{p.value}</td>
                        <td className="p-3 text-slate-500">{p.unit}</td>
                        <td className="p-3 text-slate-400 font-mono text-xxs">{p.referenceInterval || p.referenceRange}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            p.flag === 'CRITIQUE' ? 'bg-rose-600 text-white' : p.flag === 'ELEVE' || p.flag === 'BAS' || p.flag === 'POSITIF' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {p.flag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Aucun paramètre saisi pour le moment.</p>
            )}

            {activeExploration.spirometryData && (
              <div className="p-3 bg-teal-50/40 rounded-xl border border-teal-200 text-xs space-y-1">
                <strong className="text-xxs font-extrabold uppercase text-teal-900 block">
                  Paramètres Spirométriques (Pré & Post-Bronchodilatateurs) :
                </strong>
                <div className="flex flex-wrap gap-3 font-mono text-xxs">
                  <span>Pré-BD : VEMS {activeExploration.spirometryData.vemsPreL ?? '-'} L ({activeExploration.spirometryData.vemsPrePct ?? '-'}%) • CVF {activeExploration.spirometryData.cvfPreL ?? '-'} L • VEMS/CVF {activeExploration.spirometryData.tiffeneauPre ?? '-'}%</span>
                  <span>Post-BD : VEMS {activeExploration.spirometryData.vemsPostL ?? '-'} L ({activeExploration.spirometryData.vemsPostPct ?? '-'}%) • CVF {activeExploration.spirometryData.cvfPostL ?? '-'} L • VEMS/CVF {activeExploration.spirometryData.tiffeneauPost ?? '-'}%</span>
                  {activeExploration.spirometryData.gainMl !== undefined && (
                    <span className="font-bold text-teal-800">Gain : +{activeExploration.spirometryData.gainMl} mL ({activeExploration.spirometryData.gainPct ?? '-'}%)</span>
                  )}
                </div>
              </div>
            )}

            {activeExploration.attachmentName && (
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 text-xs flex items-center justify-between">
                <div>
                  <strong className="text-indigo-900">Pièce jointe ({activeExploration.sourceType}) :</strong>{' '}
                  <span className="font-mono">{activeExploration.attachmentName}</span>
                </div>
                {activeExploration.fileUrl && activeExploration.sourceType === 'PHOTO' && (
                  <img src={activeExploration.fileUrl} alt={activeExploration.attachmentName} className="h-14 rounded border border-indigo-200" />
                )}
              </div>
            )}

            {activeExploration.followUpResults && activeExploration.followUpResults.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <strong className="text-xxs font-extrabold uppercase text-slate-600 block">
                  Résultats Successifs / Contrôles :
                </strong>
                {activeExploration.followUpResults.map(fu => (
                  <div key={fu.id} className="bg-white p-2 rounded border border-slate-200">
                    <strong className="font-mono text-teal-800">{fu.date}</strong> — {fu.summary}
                  </div>
                ))}
              </div>
            )}

            {activeExploration.conclusion && (
              <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200 text-xs">
                <strong className="text-xxs font-extrabold uppercase text-teal-900 block mb-1">
                  Conclusion Médicale Officielle :
                </strong>
                <p className="font-semibold text-slate-800">{activeExploration.conclusion}</p>
                {activeExploration.validatedByDoctor && (
                  <span className="text-[10px] text-teal-700 font-mono mt-2 block">
                    Validé et signé par : {activeExploration.validatedByDoctor} • {activeExploration.validationDate}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Audit Trail Timeline (Section 6 & 7.3) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Journal d'Audit Inaltérable & Traçabilité :</span>
            </h3>

            <div className="space-y-2">
              {(activeExploration.auditTrail || []).map((entry, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xxs font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {entry.action}
                      </span>
                      <strong className="text-slate-800">{entry.userName}</strong>
                      <span className="text-[10px] text-slate-400">({entry.userRole})</span>
                    </div>
                    {entry.notes && <p className="text-xxs text-slate-600 mt-1">{entry.notes}</p>}
                  </div>
                  <span className="text-3xs font-mono text-slate-400 whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 7 : COURBES & TENDANCES BIOLOGIQUES (Section 7.8)                      */}
      {/* ========================================================================= */}
      {activeView === 'TENDANCES' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Section 7.8
                </span>
                <h2 className="text-base font-black text-slate-900">
                  Chronologie & Évolution des Biomarqueurs Respiratoires
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Suivi longitudinal de l'inflammation (CRP), oxygénation (PaO2, SpO2), fonction respiratoire (VEMS) et hémoglobine (Hb)
              </p>
            </div>
            <button
              onClick={() => setActiveView('LISTE')}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              Fermer
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1 : CRP & Hémoglobine */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-black text-slate-800 block">
                Évolution de la Protéine C-Réactive (CRP en mg/L)
              </span>
              <p className="text-xxs text-slate-500">
                Seuil normal &lt; 5 mg/L • Baisse sous traitement antibiotique / antituberculeux
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={longitudinalTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={5} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Norme (5)', fill: '#10b981', fontSize: 10 }} />
                    <Line type="monotone" dataKey="crp" name="CRP (mg/L)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2 : PaO2 & VEMS */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-black text-slate-800 block">
                Évolution de l'Oxygénation Artérielle (PaO2 en mmHg) & VEMS (%)
              </span>
              <p className="text-xxs text-slate-500">
                Seuil hypoxémie PaO2 &lt; 80 mmHg • Amélioration clinique sous oxygénothérapie titrée
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={longitudinalTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={80} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'PaO2 Norme (80)', fill: '#3b82f6', fontSize: 10 }} />
                    <Line type="monotone" dataKey="pao2" name="PaO2 (mmHg)" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="vems" name="VEMS (% prédit)" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 8 : INDICATEURS & STATISTIQUES DU SERVICE (Section 8)                 */}
      {/* ========================================================================= */}
      {activeView === 'STATISTIQUES' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Indicateurs d'Activité des Explorations & Traçabilité
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Délais moyens de réponse, volumes par catégorie et alertes critiques (Pneumologie CHREIN)
              </p>
            </div>
            <button
              onClick={() => setActiveView('LISTE')}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              Fermer
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-center">
              <span className="text-xxs font-extrabold uppercase text-teal-800 tracking-wider block">
                Total Explorations
              </span>
              <span className="text-2xl font-black text-teal-900 block mt-1">
                {medicalExplorations.length}
              </span>
              <span className="text-3xs text-teal-700">100% informatisées</span>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
              <span className="text-xxs font-extrabold uppercase text-emerald-800 tracking-wider block">
                Résultats Validés
              </span>
              <span className="text-2xl font-black text-emerald-900 block mt-1">
                {medicalExplorations.filter(e => e.status === 'VALIDATED').length}
              </span>
              <span className="text-3xs text-emerald-700">Signés électroniquement</span>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center">
              <span className="text-xxs font-extrabold uppercase text-amber-800 tracking-wider block">
                En Attente de Signature
              </span>
              <span className="text-2xl font-black text-amber-900 block mt-1">
                {pendingValidationCount}
              </span>
              <span className="text-3xs text-amber-700">Délai moyen &lt; 2h</span>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-center">
              <span className="text-xxs font-extrabold uppercase text-rose-800 tracking-wider block">
                Alertes Critiques
              </span>
              <span className="text-2xl font-black text-rose-900 block mt-1">
                {criticalAlertsCount}
              </span>
              <span className="text-3xs text-rose-700">Notifiées en temps réel</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : RETOURNER POUR CORRECTION AVEC MOTIF OBLIGATOIRE (Section 7.6)     */}
      {/* ========================================================================= */}
      {correctionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Retourner pour correction</span>
              </h3>
              <button onClick={() => setCorrectionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Précisez le motif exact du rejet ou de la demande de réévaluation à destination du laboratoire :
            </p>

            <textarea
              rows={3}
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="Ex : Valeur de PaCO2 discordante avec la clinique, merci de re-vérifier l'échantillon..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-teal-600"
              required
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCorrectionModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReturnForCorrection}
                disabled={!correctionReason.trim()}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 cursor-pointer"
              >
                Confirmer le retour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : CRÉER UN AMENDEMENT AVEC VERSIONING (Section 7.3 & 7.6)           */}
      {/* ========================================================================= */}
      {amendmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Créer un Amendement (Règle anti-effacement)</span>
              </h3>
              <button onClick={() => setAmendmentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              « Un résultat validé ne doit jamais être modifié silencieusement. Tout amendement génère une version V2 avec motif justifié. »
            </p>

            <textarea
              rows={3}
              value={amendmentReason}
              onChange={(e) => setAmendmentReason(e.target.value)}
              placeholder="Ex : Ajout des valeurs de Bilirubine totale demandées en complément sur le même échantillon..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-teal-600"
              required
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAmendmentModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmAmendment}
                disabled={!amendmentReason.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 cursor-pointer"
              >
                Créer l'Amendement V{((activeExploration?.currentVersion || 1) + 1)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
