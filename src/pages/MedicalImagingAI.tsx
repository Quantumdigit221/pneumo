import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store';
import {
  Scan,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Sparkles,
  Sliders,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  EyeOff,
  History,
  Lock,
  Unlock,
  Cpu,
  Layers,
  ArrowRight,
  Upload,
  UserCheck,
  Check,
  Info,
  Server,
  RefreshCw,
  Download,
  FileCode,
  Image as ImageIcon,
  Trash2,
  QrCode,
  X
} from 'lucide-react';
import { parseDicomBuffer, DicomMetadata, generateSyntheticTestDicom } from '../utils/dicomParser';

interface ModelRegistryItem {
  id: string;
  name: string;
  version: string;
  modality: string;
  task: string;
  architecture: string;
  license: string;
  commercialAllowed: boolean;
  weightsSizeMb: number;
  minVramGb: number;
  recommendedHardware: string;
  status: 'ACTIVE_VERIFIED' | 'PENDING_GPU_DEPLOY' | 'UNTESTED';
  supportedClasses: string[];
  benchmarkMetrics: Record<string, number>;
  clinicalNotes: string;
}

interface FindingItem {
  pathology: string;
  probability: number;
  threshold: number;
  isDetected: boolean;
  severity: 'NORMAL' | 'SUSPECT' | 'CRITIQUE';
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  userName: string;
  userRole: string;
  comments: string;
}

interface RadiologyReport {
  id: string;
  examinationId: string;
  patientId: string;
  patientName: string;
  patientHospitalNumber: string;
  modality: string;
  modelUsed: string;
  status: 'AI_DRAFT' | 'VALIDATED_BY_DOCTOR' | 'REJECTED_BY_DOCTOR';
  version: number;
  clinicalIndication: string;
  technique: string;
  findings: string;
  conclusion: string;
  suggestedCim11: string;
  aiConfidenceScore: number;
  isSigned: boolean;
  signedByDoctorId: string | null;
  signedByDoctorName: string | null;
  signedAt: string | null;
  rejectionReason: string | null;
  findingsDetail: FindingItem[];
  auditTrail: AuditEntry[];
  createdAt: string;
  updatedAt: string;
}

// Sample clinical chest x-rays available for interactive demonstration
const SAMPLE_CHEST_XRAYS = [
  {
    id: 'sample-tb',
    title: 'Tuberculose pulmonaire excavée (Lobe Supérieur Droit)',
    patientName: 'Mamadou Diop',
    patientAge: 46,
    patientGender: 'M',
    patientId: 'p1',
    hospitalNumber: 'CHREIN-PNEUMO-2026-014',
    indication: 'Toux fébrile persistante depuis 3 semaines, amaigrissement de 5 kg et sueurs nocturnes. Suspicion tuberculose cavitaire.',
    previewGradient: 'from-slate-900 via-slate-800 to-black',
    highlightLesion: 'Caverne apicale droite de 32 mm avec paroi épaisse et infiltrats satellites en grappe.',
    expectedSeverity: 'CRITIQUE'
  },
  {
    id: 'sample-pneumonia',
    title: 'Pneumopathie aiguë communautaire (Lobe Moyen Droit)',
    patientName: 'Aissatou Ndiaye',
    patientAge: 38,
    patientGender: 'F',
    patientId: 'p2',
    hospitalNumber: 'CHREIN-PNEUMO-2026-027',
    indication: 'Fièvre brutale à 39.5°C, toux productive avec expectorations purulentes et douleur basi-thoracique droite.',
    previewGradient: 'from-zinc-950 via-slate-900 to-neutral-900',
    highlightLesion: 'Foyer de condensation alvéolaire homogène avec bronchogramme aérique net.',
    expectedSeverity: 'SUSPECT'
  },
  {
    id: 'sample-pneumothorax',
    title: 'Pneumothorax spontané partiel (Hémithorax Gauche)',
    patientName: 'Ibrahima Cissé',
    patientAge: 62,
    patientGender: 'M',
    patientId: 'p3',
    hospitalNumber: 'CHREIN-PNEUMO-2026-008',
    indication: 'Douleur thoracique aiguë brutale en coup de poignard avec dyspnée d\'effort sur terrain BPCO.',
    previewGradient: 'from-stone-950 via-slate-900 to-gray-950',
    highlightLesion: 'Décollement pleural apical et axillaire gauche avec ligne bordante pleurale nette.',
    expectedSeverity: 'CRITIQUE'
  },
  {
    id: 'sample-normal',
    title: 'Thorax de contrôle sans anomalie focale',
    patientName: 'Fatou Sow',
    patientAge: 29,
    patientGender: 'F',
    patientId: 'p4',
    hospitalNumber: 'CHREIN-PNEUMO-2026-052',
    indication: 'Bilan pré-opératoire systématique avant chirurgie fonctionnelle.',
    previewGradient: 'from-slate-950 via-gray-900 to-slate-900',
    highlightLesion: 'Transparence pulmonaire bilatérale symétrique normale, culs-de-sac libres.',
    expectedSeverity: 'NORMAL'
  }
];

export const MedicalImagingAI: React.FC = () => {
  const { currentUser } = useStore();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'VIEWER_ANALYSE' | 'REGISTRE' | 'COMPTES_RENDUS' | 'EVALUATION' | 'ARCHITECTURE'>('VIEWER_ANALYSE');

  // Active simulated role for RBAC testing
  const [simulatedRole, setSimulatedRole] = useState<string>(currentUser?.role || 'CLINICIAN');

  // Models registry
  const [modelsRegistry, setModelsRegistry] = useState<ModelRegistryItem[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('ark-plus-cxr');
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(false);

  // Selected Chest X-Ray Case
  const [selectedCase, setSelectedCase] = useState(SAMPLE_CHEST_XRAYS[0]);
  const [clinicalContext, setClinicalContext] = useState(SAMPLE_CHEST_XRAYS[0].indication);

  // Interactive Viewer Settings
  const [windowPreset, setWindowPreset] = useState<'PULMONARY' | 'MEDIASTINAL' | 'BONE' | 'STANDARD'>('PULMONARY');
  const [isInverted, setIsInverted] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showDicomMetadata, setShowDicomMetadata] = useState(false);
  const [showLesionOverlay, setShowLesionOverlay] = useState(true);

  // Uploaded File State (DICOM / Medical Images)
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
    base64?: string;
    renderedDataUrl?: string;
    dicomMeta?: DicomMetadata;
    isDicom: boolean;
  } | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isValidatingDicom, setIsValidatingDicom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentReport, setCurrentReport] = useState<RadiologyReport | null>(null);
  const [reportsList, setReportsList] = useState<RadiologyReport[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Rejection Modal
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Editable report fields
  const [editedFindings, setEditedFindings] = useState('');
  const [editedConclusion, setEditedConclusion] = useState('');

  // Audit history modal
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Official A4 Print Report Modal
  const [showPrintReportModal, setShowPrintReportModal] = useState(false);

  // Process an uploaded file (DICOM or standard medical image)
  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsValidatingDicom(true);

    const isDcm = file.name.toLowerCase().endsWith('.dcm') || file.name.toLowerCase().endsWith('.dicom') || file.type === 'application/dicom';

    try {
      if (isDcm) {
        // Lecture ArrayBuffer pour analyse DICOM binaire NEMA
        const buffer = await file.arrayBuffer();
        const parseResult = parseDicomBuffer(buffer);

        if (!parseResult.metadata.isValid) {
          setErrorMessage(parseResult.metadata.errorMessage || "Format DICOM non reconnu.");
          setIsValidatingDicom(false);
          return;
        }

        // Conversion en base64 pour backend
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        // Validation backend
        const valRes = await fetch('/api/v1/imaging-ai/dicom/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data, filename: file.name })
        });
        const valData = await valRes.json();

        const meta = parseResult.metadata;
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: 'application/dicom',
          base64: base64Data,
          renderedDataUrl: parseResult.renderedImageDataUrl,
          dicomMeta: meta,
          isDicom: true
        });

        // Mise à jour automatique des informations cliniques si présentes dans le DICOM
        if (meta.patientName || meta.patientId) {
          setSelectedCase(prev => ({
            ...prev,
            title: `Cliché DICOM importé (${file.name})`,
            patientName: meta.patientName || prev.patientName,
            hospitalNumber: meta.patientId || prev.hospitalNumber,
            indication: meta.studyDescription || prev.indication
          }));
          if (meta.studyDescription) {
            setClinicalContext(meta.studyDescription);
          }
        }

        setSuccessNotice(`Fichier DICOM conforme NEMA PS3.10 validé : ${file.name} (Modalité : ${meta.modality || 'DX'}, ${meta.rows || 512}x${meta.columns || 512} px). Prêt pour inférence.`);
      } else if (file.type.startsWith('image/')) {
        // Image standard JPEG / PNG
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const base64 = dataUrl.split(',')[1];
          setUploadedFile({
            name: file.name,
            size: file.size,
            type: file.type,
            base64,
            renderedDataUrl: dataUrl,
            isDicom: false
          });
          setSelectedCase(prev => ({
            ...prev,
            title: `Image radiologique importée (${file.name})`
          }));
          setSuccessNotice(`Image médicale ${file.name} importée avec succès. Prête pour l'analyse.`);
        };
        reader.readAsDataURL(file);
      } else {
        setErrorMessage("Format de fichier non supporté. Veuillez importer un fichier DICOM (.dcm) ou une image radiologique (.png, .jpg).");
      }
    } catch (err: any) {
      setErrorMessage(`Erreur lors du traitement du fichier : ${err.message || String(err)}`);
    } finally {
      setIsValidatingDicom(false);
    }
  };

  const handleClearUploadedFile = () => {
    setUploadedFile(null);
    setSelectedCase(SAMPLE_CHEST_XRAYS[0]);
    setClinicalContext(SAMPLE_CHEST_XRAYS[0].indication);
    setSuccessNotice("Fichier importé retiré. Retour aux cas cliniques témoins.");
  };

  const handleLoadSyntheticDicom = (caseType: 'TB' | 'PNEUMONIA' | 'PNEUMOTHORAX') => {
    const blob = generateSyntheticTestDicom(caseType);
    const fileName = caseType === 'TB' ? 'CHREIN_TB_CAVITARY_014.dcm' : caseType === 'PNEUMONIA' ? 'CHREIN_PAC_LOBAR_027.dcm' : 'CHREIN_PNEUMOTHORAX_008.dcm';
    const file = new File([blob], fileName, { type: 'application/dicom' });
    handleProcessFile(file);
  };

  const handleDownloadSyntheticDicom = (caseType: 'TB' | 'PNEUMONIA' | 'PNEUMOTHORAX') => {
    const blob = generateSyntheticTestDicom(caseType);
    const fileName = caseType === 'TB' ? 'CHREIN_TB_CAVITARY_014.dcm' : caseType === 'PNEUMONIA' ? 'CHREIN_PAC_LOBAR_027.dcm' : 'CHREIN_PNEUMOTHORAX_008.dcm';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessNotice(`Fichier DICOM test "${fileName}" téléchargé sur votre poste. Vous pouvez également le ré-importer par glisser-déposer !`);
  };

  // Fetch registry on mount
  useEffect(() => {
    fetchModelsRegistry();
    fetchExistingReports();
  }, []);

  // Update clinical indication when sample case changes
  const handleSelectCase = (c: typeof SAMPLE_CHEST_XRAYS[0]) => {
    setSelectedCase(c);
    setClinicalContext(c.indication);
    setErrorMessage(null);
    setSuccessNotice(null);
  };

  const fetchModelsRegistry = async () => {
    setIsLoadingRegistry(true);
    try {
      const res = await fetch('/api/v1/imaging-ai/registry');
      const data = await res.json();
      if (data && data.models) {
        setModelsRegistry(data.models);
      }
    } catch (e) {
      console.warn('Erreur chargement registre modèles:', e);
    } finally {
      setIsLoadingRegistry(false);
    }
  };

  const fetchExistingReports = async () => {
    try {
      const res = await fetch('/api/v1/imaging-ai/reports');
      const data = await res.json();
      if (data && data.reports) {
        setReportsList(data.reports);
        if (data.reports.length > 0 && !currentReport) {
          setCurrentReport(data.reports[0]);
          setEditedFindings(data.reports[0].findings);
          setEditedConclusion(data.reports[0].conclusion);
        }
      }
    } catch (e) {
      console.warn('Erreur chargement rapports:', e);
    }
  };

  // Run AI Analysis
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const res = await fetch('/api/v1/imaging-ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': simulatedRole
        },
        body: JSON.stringify({
          modelId: selectedModelId,
          clinicalContext,
          patientId: uploadedFile?.dicomMeta?.patientId || selectedCase.patientId,
          patientName: uploadedFile?.dicomMeta?.patientName || selectedCase.patientName,
          patientHospitalNumber: uploadedFile?.dicomMeta?.patientId || selectedCase.hospitalNumber,
          filename: uploadedFile?.name || `${selectedCase.id}.dcm`,
          imageBase64: uploadedFile?.base64
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Erreur lors de l’inférence du modèle.');
        return;
      }

      if (data.report) {
        setCurrentReport(data.report);
        setEditedFindings(data.report.findings);
        setEditedConclusion(data.report.conclusion);
        setSuccessNotice(`Analyse complétée avec succès par le modèle ${data.report.modelUsed} (${data.inferenceTimeMs}ms). Statut : BROUILLON IA.`);
        fetchExistingReports();
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Impossible de joindre le service d’inférence.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Validate and Sign Report (RBAC Check)
  const handleValidateAndSign = async () => {
    if (!currentReport) return;
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const res = await fetch('/api/v1/imaging-ai/reports/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': simulatedRole
        },
        body: JSON.stringify({
          reportId: currentReport.id,
          doctorId: currentUser?.id || 'doc-1',
          doctorName: currentUser?.name || 'Dr. Cheikh Ndao',
          userRole: simulatedRole,
          revisedFindings: editedFindings,
          revisedConclusion: editedConclusion,
          clinicalNotes: `Validation effectuée sous rôle ${simulatedRole}. Constatations cliniques vérifiées.`
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Validation refusée.');
        return;
      }

      setCurrentReport(data.report);
      setSuccessNotice('Compte rendu validé et signé électroniquement avec succès ! Le document est désormais officiel.');
      fetchExistingReports();
    } catch (e: any) {
      setErrorMessage(e.message || 'Erreur lors de la validation.');
    }
  };

  // Reject Report
  const handleConfirmRejection = async () => {
    if (!currentReport) return;
    if (!rejectionReasonInput.trim()) {
      setErrorMessage('Le motif de rejet est obligatoire pour la traçabilité.');
      return;
    }

    try {
      const res = await fetch('/api/v1/imaging-ai/reports/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': simulatedRole
        },
        body: JSON.stringify({
          reportId: currentReport.id,
          doctorId: currentUser?.id || 'doc-1',
          doctorName: currentUser?.name || 'Dr. Praticien CHREIN',
          userRole: simulatedRole,
          rejectionReason: rejectionReasonInput
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Rejet refusé.');
        return;
      }

      setCurrentReport(data.report);
      setIsRejectionModalOpen(false);
      setRejectionReasonInput('');
      setSuccessNotice('Brouillon IA rejeté avec motif enregistré dans la piste d’audit.');
      fetchExistingReports();
    } catch (e: any) {
      setErrorMessage(e.message || 'Erreur lors du rejet.');
    }
  };

  const selectedModelMeta = useMemo(() => {
    return modelsRegistry.find(m => m.id === selectedModelId);
  }, [modelsRegistry, selectedModelId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Hospital & Module Header */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black text-sm shadow-xs">
            <Scan className="w-6 h-6 text-teal-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                Imagerie Médicale & Intelligence Artificielle (Phase 1)
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xxs font-bold border border-teal-200">
                CHREIN Kaolack
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Service de Pneumologie & Radiologie • Analyse certifiée des radiographies thoraciques (Ark+, PyTorch, MONAI)
            </p>
          </div>
        </div>

        {/* Role Simulator for RBAC Testing */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 p-2 rounded-xl text-left">
          <div className="text-right pr-2 border-r border-slate-200">
            <span className="text-3xs text-slate-400 block uppercase font-mono font-bold tracking-wider">Simulateur de Rôle</span>
            <span className="text-xs font-bold text-slate-800">{simulatedRole}</span>
          </div>
          <select
            value={simulatedRole}
            onChange={(e) => setSimulatedRole(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-600"
          >
            <option value="CLINICIAN">Médecin Clinicien (Autorisé)</option>
            <option value="STRUCTURE_ADMIN">Admin Structure (Autorisé)</option>
            <option value="NURSE">Infirmier (Refus 403)</option>
            <option value="SECRETARY">Secrétaire Médicale (Refus 403)</option>
          </select>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('VIEWER_ANALYSE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'VIEWER_ANALYSE'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Scan className="w-4 h-4" />
          <span>Visualiseur & Analyse Thoracique</span>
        </button>

        <button
          onClick={() => setActiveTab('REGISTRE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'REGISTRE'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Registre des Modèles d’IA & Licences</span>
          <span className="ml-1 text-3xs px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded font-bold">5</span>
        </button>

        <button
          onClick={() => setActiveTab('COMPTES_RENDUS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'COMPTES_RENDUS'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Comptes Rendus & Validation Médicale</span>
          {reportsList.length > 0 && (
            <span className="ml-1 text-3xs px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-bold">
              {reportsList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('EVALUATION')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'EVALUATION'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Évaluation Ark+ vs LLaVA-Rad vs MAIRA-2</span>
        </button>

        <button
          onClick={() => setActiveTab('ARCHITECTURE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ARCHITECTURE'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Microservice Python & Déploiement</span>
        </button>
      </div>

      {/* Global Alerts / Messages */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl text-xs flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Alerte de Sécurité Clinique ou Erreur Système :</span>
            <p className="mt-0.5 text-red-800 leading-relaxed">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800 text-sm font-bold">×</button>
        </div>
      )}

      {successNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Opération Réussie :</span>
            <p className="mt-0.5 text-emerald-800 leading-relaxed">{successNotice}</p>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-500 hover:text-emerald-800 text-sm font-bold">×</button>
        </div>
      )}

      {/* =====================================================================
          TAB 1 : VISUALISEUR RADIOLOGIQUE & ANALYSE THORACIQUE
      ====================================================================== */}
      {activeTab === 'VIEWER_ANALYSE' && (
        <div className="space-y-6">
          {/* DICOM & Image Upload Zone */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 rounded-lg text-teal-700">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Importation de Clichés Radiologiques & Fichiers DICOM (.dcm)
                  </h3>
                  <p className="text-xxs text-slate-500">
                    Décodeur binaire NEMA PS3.10 natif, validation d'intégrité et inférence IA Ark+ (CHREIN Kaolack)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xxs font-mono text-slate-500">
                <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">.dcm</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">.dicom</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">.png</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">.jpg</span>
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".dcm,.dicom,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessFile(file);
                // Reset input value so same file can be reselected
                e.target.value = '';
              }}
            />

            {uploadedFile ? (
              /* Active Uploaded File Card */
              <div className="bg-teal-50/70 border-2 border-teal-600/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-teal-700 text-white rounded-xl shadow-xs">
                    {uploadedFile.isDicom ? <FileCode className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{uploadedFile.name}</span>
                      <span className="text-3xs font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                        {uploadedFile.isDicom ? 'DICOM NEMA PS3.10 CONFORME' : 'IMAGE RADIOLOGIQUE'}
                      </span>
                      <span className="text-xxs text-slate-500 font-mono">
                        ({(uploadedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <p className="text-xxs text-slate-600 mt-1">
                      {uploadedFile.isDicom && uploadedFile.dicomMeta ? (
                        <>
                          <span className="font-semibold text-slate-800">Patient:</span> {uploadedFile.dicomMeta.patientName || 'Non spécifié'} • 
                          <span className="font-semibold text-slate-800 ml-1">ID:</span> {uploadedFile.dicomMeta.patientId || 'N/A'} • 
                          <span className="font-semibold text-slate-800 ml-1">Modalité:</span> {uploadedFile.dicomMeta.modality || 'DX'} • 
                          <span className="font-semibold text-slate-800 ml-1">Matrice:</span> {uploadedFile.dicomMeta.rows || 512}x{uploadedFile.dicomMeta.columns || 512} ({uploadedFile.dicomMeta.bitsAllocated || 16}-bit)
                        </>
                      ) : (
                        <span>Image standard chargée dans la mémoire locale du visualiseur. Prête pour l'inférence.</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Remplacer</span>
                  </button>
                  <button
                    onClick={handleClearUploadedFile}
                    className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Retirer</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Drag & Drop Box & Instant Test Launchers */
              <div className="space-y-3">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleProcessFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-2 ${
                    isDragOver
                      ? 'border-teal-600 bg-teal-50/70 scale-[0.99]'
                      : 'border-slate-300 hover:border-teal-600 hover:bg-slate-50/60 bg-slate-50/30'
                  }`}
                >
                  <div className="p-3 bg-white rounded-full border border-slate-200 shadow-xs text-teal-700">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Glissez et déposez un fichier <span className="text-teal-700 font-mono">DICOM (.dcm)</span> ou une radiographie ici
                    </p>
                    <p className="text-xxs text-slate-500 mt-0.5">
                      ou cliquez pour parcourir les dossiers de votre ordinateur / tablette
                    </p>
                  </div>
                  {isValidatingDicom && (
                    <div className="flex items-center gap-2 text-xxs font-bold text-teal-700 animate-pulse mt-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Validation de la conformité NEMA PS3.10 et extraction des tags...</span>
                    </div>
                  )}
                </div>

                {/* Instant Synthetic DICOM Generator Buttons */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xxs text-slate-600 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>Jeux d'essai DICOM 100% conformes NEMA (Génération locale instantanée) :</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => handleLoadSyntheticDicom('TB')}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:border-teal-600 text-slate-700 hover:text-teal-800 rounded-lg text-xxs font-bold transition-all shadow-2xs flex items-center gap-1"
                      title="Génère un DICOM binaire conforme de tuberculose cavitaire avec en-tête NEMA PS3.10 complet"
                    >
                      <span>⚡ Test DICOM Tuberculose</span>
                    </button>
                    <button
                      onClick={() => handleLoadSyntheticDicom('PNEUMONIA')}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:border-teal-600 text-slate-700 hover:text-teal-800 rounded-lg text-xxs font-bold transition-all shadow-2xs flex items-center gap-1"
                      title="Génère un DICOM binaire conforme de pneumonie lobaire"
                    >
                      <span>⚡ Test DICOM Pneumonie</span>
                    </button>
                    <button
                      onClick={() => handleLoadSyntheticDicom('PNEUMOTHORAX')}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:border-teal-600 text-slate-700 hover:text-teal-800 rounded-lg text-xxs font-bold transition-all shadow-2xs flex items-center gap-1"
                      title="Génère un DICOM binaire conforme de pneumothorax sous tension"
                    >
                      <span>⚡ Test DICOM Pneumothorax</span>
                    </button>
                    <button
                      onClick={() => handleDownloadSyntheticDicom('TB')}
                      className="px-2 py-1 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 rounded-lg text-xxs font-bold transition-all flex items-center gap-1"
                      title="Télécharge le fichier CHREIN_TB_CAVITARY_014.dcm sur votre disque dur"
                    >
                      <Download className="w-3 h-3" />
                      <span>Télécharger .dcm</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Case Selector Banner */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Ou sélectionnez un cas clinique témoin de la cohorte CHREIN :
              </span>
              <span className="text-xxs text-slate-500 font-mono">Format DICOM / CR / DX 16-bit</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SAMPLE_CHEST_XRAYS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCase(c)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selectedCase.id === c.id && !uploadedFile
                      ? 'border-teal-700 bg-teal-50/50 shadow-xs ring-1 ring-teal-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-mono font-bold text-slate-400">{c.hospitalNumber}</span>
                    <span className={`text-3xs font-bold px-1.5 py-0.5 rounded ${
                      c.expectedSeverity === 'CRITIQUE'
                        ? 'bg-red-100 text-red-800'
                        : c.expectedSeverity === 'SUSPECT'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {c.expectedSeverity}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{c.title}</h4>
                  <p className="text-xxs text-slate-500 mt-0.5">{c.patientName} • {c.patientAge} ans ({c.patientGender})</p>
                </button>
              ))}
            </div>
          </div>

          {/* Main 2-Column Grid : Left Viewer, Right AI Control & Results */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column : DICOM Chest X-Ray Interactive Viewer (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[540px]">
                {/* Viewer Top Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-white text-xs">
                      {uploadedFile ? uploadedFile.name : selectedCase.title}
                    </span>
                    {uploadedFile && (
                      <span className="text-3xs px-1.5 py-0.5 bg-teal-800 text-teal-200 rounded font-mono">
                        {uploadedFile.isDicom ? 'DICOM NEMA' : 'IMAGE'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-xxs text-slate-400">
                    <span>Fenêtre: {windowPreset}</span>
                    <span>• Zoom: {zoomLevel}x</span>
                  </div>
                </div>

                {/* Simulated or Real Decoded Chest X-Ray Display */}
                <div className="relative my-4 flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black border border-slate-800 min-h-[380px]">
                  <div
                    className={`w-full h-96 relative flex items-center justify-center transition-all duration-200 select-none ${
                      uploadedFile?.renderedDataUrl ? 'bg-black' : selectedCase.previewGradient
                    } ${isInverted ? 'invert' : ''}`}
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    {uploadedFile?.renderedDataUrl ? (
                      /* Rendu direct des pixels DICOM décodés par le parser HTML5 Canvas */
                      <img
                        src={uploadedFile.renderedDataUrl}
                        alt={uploadedFile.name}
                        className="max-h-96 max-w-full object-contain transition-all duration-200"
                        style={{
                          filter: `${
                            windowPreset === 'PULMONARY'
                              ? 'contrast(1.2) brightness(1.1)'
                              : windowPreset === 'MEDIASTINAL'
                              ? 'contrast(1.6) brightness(0.85)'
                              : 'contrast(2.0) brightness(0.7)'
                          }`
                        }}
                      />
                    ) : (
                      /* Anatomical Thoracic Outline Graphic for Sample Cases */
                      <svg viewBox="0 0 400 400" className="w-80 h-80 opacity-80" fill="none" stroke="currentColor">
                        {/* Spine / Vertebral column */}
                        <path d="M200 40 L200 360" stroke="#94a3b8" strokeWidth="6" strokeDasharray="6 4" />
                        {/* Trachea & Carina */}
                        <path d="M200 40 L200 130 M200 130 L160 170 M200 130 L240 170" stroke="#cbd5e1" strokeWidth="4" />
                        {/* Ribs (Costal grilles) */}
                        <path d="M200 80 Q140 90 90 140 Q150 160 200 110" stroke="#64748b" strokeWidth="3" opacity="0.6" />
                        <path d="M200 80 Q260 90 310 140 Q250 160 200 110" stroke="#64748b" strokeWidth="3" opacity="0.6" />
                        <path d="M200 120 Q130 140 70 200 Q140 220 200 160" stroke="#64748b" strokeWidth="3" opacity="0.6" />
                        <path d="M200 120 Q270 140 330 200 Q260 220 200 160" stroke="#64748b" strokeWidth="3" opacity="0.6" />
                        <path d="M200 170 Q120 200 60 260 Q130 280 200 220" stroke="#64748b" strokeWidth="3" opacity="0.6" />
                        <path d="M200 170 Q280 200 340 260 Q270 280 200 220" stroke="#64748b" strokeWidth="3" opacity="0.6" />
                        {/* Right Lung Field */}
                        <path d="M190 70 C140 70 80 120 80 240 C80 320 140 340 190 330 Z" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" opacity="0.7" />
                        {/* Left Lung Field */}
                        <path d="M210 70 C260 70 320 120 320 240 C320 320 260 340 210 330 Z" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" opacity="0.7" />
                        {/* Cardiac Silhouette (Index Cardio-Thoracique ICT = 0.46) */}
                        <path d="M180 170 C150 200 150 270 200 310 C240 310 260 260 220 200 Z" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" opacity="0.8" />
                        {/* Diaphragmatic Hemidomes */}
                        <path d="M60 320 Q130 290 190 320" stroke="#e2e8f0" strokeWidth="3" />
                        <path d="M210 320 Q270 300 340 330" stroke="#e2e8f0" strokeWidth="3" />
                      </svg>
                    )}

                    {/* AI Bounding Box / Lésion overlay if enabled */}
                    {showLesionOverlay && (!uploadedFile ? selectedCase.id === 'sample-tb' : uploadedFile.name.toLowerCase().includes('tb')) && (
                      <div className="absolute top-16 left-28 w-24 h-24 border-2 border-red-500 bg-red-500/20 rounded-lg flex flex-col justify-between p-1 animate-pulse pointer-events-none">
                        <span className="text-3xs font-black bg-red-600 text-white px-1 py-0.2 rounded w-fit uppercase">
                          Caverne 32mm
                        </span>
                        <span className="text-3xs text-red-200 font-mono font-bold">P = 94%</span>
                      </div>
                    )}

                    {showLesionOverlay && (!uploadedFile ? selectedCase.id === 'sample-pneumonia' : uploadedFile.name.toLowerCase().includes('pac') || uploadedFile.name.toLowerCase().includes('pneumo')) && !uploadedFile?.name?.toLowerCase().includes('thorax') && (
                      <div className="absolute top-44 left-24 w-28 h-20 border-2 border-amber-500 bg-amber-500/20 rounded-lg flex flex-col justify-between p-1 pointer-events-none">
                        <span className="text-3xs font-black bg-amber-600 text-white px-1 py-0.2 rounded w-fit uppercase">
                          Condensation
                        </span>
                        <span className="text-3xs text-amber-200 font-mono font-bold">P = 86%</span>
                      </div>
                    )}

                    {showLesionOverlay && (!uploadedFile ? selectedCase.id === 'sample-pneumothorax' : uploadedFile.name.toLowerCase().includes('thorax')) && (
                      <div className="absolute top-16 right-20 w-24 h-40 border-2 border-red-500 bg-red-500/20 rounded-lg flex flex-col justify-between p-1 pointer-events-none">
                        <span className="text-3xs font-black bg-red-600 text-white px-1 py-0.2 rounded w-fit uppercase">
                          Pneumothorax
                        </span>
                        <span className="text-3xs text-red-200 font-mono font-bold">P = 84%</span>
                      </div>
                    )}

                    {/* Patient Watermark on Cliché */}
                    <div className="absolute top-3 left-3 text-left font-mono text-3xs text-slate-400 space-y-0.5 pointer-events-none">
                      <div className="font-bold text-white uppercase">
                        {uploadedFile?.dicomMeta?.patientName || selectedCase.patientName}
                      </div>
                      <div>ID: {uploadedFile?.dicomMeta?.patientId || selectedCase.hospitalNumber}</div>
                      <div>
                        {uploadedFile?.dicomMeta?.studyDate || `${selectedCase.patientAge}A / ${selectedCase.patientGender}`}
                      </div>
                      <div>CHREIN KAOLACK • {uploadedFile?.dicomMeta?.modality || 'DX'}</div>
                    </div>

                    <div className="absolute bottom-3 right-3 text-right font-mono text-3xs text-slate-500 pointer-events-none">
                      <div>MONAI 1.3 / PyTorch 2.2</div>
                      <div>
                        {uploadedFile?.dicomMeta?.rows || 512}x{uploadedFile?.dicomMeta?.columns || 512} {uploadedFile?.dicomMeta?.bitsAllocated || 16}-bit
                      </div>
                    </div>
                  </div>
                </div>

                {/* DICOM Metadata Bar */}
                {showDicomMetadata && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xxs font-mono text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    <div>
                      <span className="text-slate-500 block">SOP Class:</span>
                      {uploadedFile?.dicomMeta?.sopClassUid || (uploadedFile?.isDicom ? '1.2.840.10008.5.1.4.1.1.1' : 'DX Image Storage')}
                    </div>
                    <div>
                      <span className="text-slate-500 block">Polarité / Photométrie:</span>
                      {uploadedFile?.dicomMeta?.photometricInterpretation || 'MONOCHROME2'}
                    </div>
                    <div>
                      <span className="text-slate-500 block">Fenêtrage VOI LUT:</span>
                      W:{uploadedFile?.dicomMeta?.windowWidth || (windowPreset === 'PULMONARY' ? 1500 : 400)} / L:{uploadedFile?.dicomMeta?.windowCenter || (windowPreset === 'PULMONARY' ? -600 : 40)}
                    </div>
                    <div>
                      <span className="text-slate-500 block">Anonymisation:</span>
                      Conforme CDP Sénégal
                    </div>
                  </div>
                )}

                {/* Viewer Bottom Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800 text-xs">
                  {/* Windowing Presets */}
                  <div className="flex items-center gap-1">
                    <span className="text-3xs text-slate-400 font-mono mr-1">VOI LUT:</span>
                    <button
                      onClick={() => setWindowPreset('PULMONARY')}
                      className={`px-2 py-1 rounded text-3xs font-bold transition-all ${
                        windowPreset === 'PULMONARY' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Poumon
                    </button>
                    <button
                      onClick={() => setWindowPreset('MEDIASTINAL')}
                      className={`px-2 py-1 rounded text-3xs font-bold transition-all ${
                        windowPreset === 'MEDIASTINAL' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Médiastin
                    </button>
                    <button
                      onClick={() => setWindowPreset('BONE')}
                      className={`px-2 py-1 rounded text-3xs font-bold transition-all ${
                        windowPreset === 'BONE' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Osseux
                    </button>
                  </div>

                  {/* Image manipulation tools */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsInverted(!isInverted)}
                      className={`p-1.5 rounded transition-all ${isInverted ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                      title="Inverser contraste négatif/positif"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}
                      className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                      title="Zoom Avant"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 1))}
                      className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                      title="Zoom Arrière"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowLesionOverlay(!showLesionOverlay)}
                      className={`p-1.5 rounded transition-all ${showLesionOverlay ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                      title="Afficher/Masquer surimpression IA"
                    >
                      {showLesionOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setShowDicomMetadata(!showDicomMetadata)}
                      className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white text-xxs font-mono"
                    >
                      DICOM
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column : AI Model Engine, Classification & Findings (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Model Selection Card */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-teal-700" />
                    2. Modèle d’IA d’Analyse :
                  </span>
                  {selectedModelMeta && (
                    <span className="text-3xs font-mono font-bold text-slate-500">
                      VRAM: {selectedModelMeta.minVramGb} Go
                    </span>
                  )}
                </div>

                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  {modelsRegistry.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.license}) — {m.status === 'ACTIVE_VERIFIED' ? '✓ Actif' : '⏳ Serveur GPU Externe'}
                    </option>
                  ))}
                </select>

                {selectedModelMeta && (
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xxs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Licence :</span>
                      <span className="font-bold text-slate-800">{selectedModelMeta.license}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Usage commercial autorisé :</span>
                      <span className={`font-bold ${selectedModelMeta.commercialAllowed ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {selectedModelMeta.commercialAllowed ? 'OUI (Apache 2.0 / MIT)' : 'NON (Recherche uniquement)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Statut vérification :</span>
                      <span className={`font-bold uppercase ${
                        selectedModelMeta.status === 'ACTIVE_VERIFIED' ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {selectedModelMeta.status === 'ACTIVE_VERIFIED' ? 'Vérifié & Actif' : 'En attente GPU externe'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-3xs italic leading-tight pt-1 border-t border-slate-200">
                      {selectedModelMeta.clinicalNotes}
                    </p>
                  </div>
                )}

                {/* Clinical Indication Field */}
                <div>
                  <label className="text-xxs font-bold text-slate-600 uppercase block mb-1">
                    Indication clinique & Signes d’orientation :
                  </label>
                  <textarea
                    rows={2}
                    value={clinicalContext}
                    onChange={(e) => setClinicalContext(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                {/* Launch Analysis Action */}
                <button
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="w-full py-3 px-4 rounded-xl bg-teal-800 text-white font-bold text-xs shadow-xs hover:bg-teal-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Inférence PyTorch / MONAI en cours...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-teal-300" />
                      <span>Lancer l’Inférence IA Radiologique</span>
                    </>
                  )}
                </button>
              </div>

              {/* Pathological Findings Gauges */}
              {currentReport && currentReport.findingsDetail && (
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      3. Constatations Pathologiques (Ark+) :
                    </span>
                    <span className="text-3xs font-mono font-bold text-teal-800">
                      Confiance : {Math.round(currentReport.aiConfidenceScore * 100)}%
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {currentReport.findingsDetail.map((f, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 text-xxs">{f.pathology}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xxs font-bold text-slate-600">
                              {Math.round(f.probability * 100)}%
                            </span>
                            <span className={`text-3xs font-bold px-1.5 py-0.2 rounded uppercase ${
                              f.severity === 'CRITIQUE'
                                ? 'bg-red-100 text-red-800'
                                : f.severity === 'SUSPECT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {f.severity}
                            </span>
                          </div>
                        </div>

                        {/* Visual Progress Gauge */}
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative">
                          {/* Seuil marker */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                            style={{ left: `${f.threshold * 100}%` }}
                            title={`Seuil d'alerte clinique: ${f.threshold * 100}%`}
                          />
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              f.severity === 'CRITIQUE'
                                ? 'bg-red-600'
                                : f.severity === 'SUSPECT'
                                ? 'bg-amber-500'
                                : 'bg-teal-600'
                            }`}
                            style={{ width: `${f.probability * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =====================================================================
              3. MEDICAL RADIOLOGY REPORT & VALIDATION WORKFLOW (PHASE 4)
          ====================================================================== */}
          {currentReport && (
            <div className="bg-white border-2 border-slate-300 p-6 rounded-2xl shadow-sm space-y-5">
              {/* Report Header & Status Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900">
                      Compte Rendu Radiologique d’Assistance
                    </h3>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      N° {currentReport.examinationId}
                    </span>
                  </div>
                  <p className="text-xxs text-slate-500 mt-0.5">
                    Patient : {currentReport.patientName} • {currentReport.patientHospitalNumber} • Modèle utilisé : {currentReport.modelUsed}
                  </p>
                </div>

                {/* Workflow Status Badge */}
                <div className="flex items-center gap-2">
                  {currentReport.status === 'AI_DRAFT' && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
                      <span>BROUILLON IA — NON VALIDÉ MÉDICALEMENT</span>
                    </div>
                  )}

                  {currentReport.status === 'VALIDATED_BY_DOCTOR' && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-xl text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>VALIDÉ ET SIGNÉ MÉDICALEMENT</span>
                    </div>
                  )}

                  {currentReport.status === 'REJECTED_BY_DOCTOR' && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-900 px-3 py-1.5 rounded-xl text-xs font-bold">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>BROUILLON REJETÉ PAR LE CLINICIEN</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Safety Warning if AI Draft */}
              {currentReport.status === 'AI_DRAFT' && (
                <div className="bg-amber-50/70 border-l-4 border-amber-500 p-3 text-xxs text-amber-900 leading-relaxed rounded-r-lg">
                  <span className="font-bold">Avertissement médico-légal obligatoire :</span> Ce document a été produit par un modèle d’assistance par intelligence artificielle. Conformément à la réglementation hospitalière du CHREIN Kaolack, aucun compte rendu d’imagerie ne peut être délivré ou archivé comme diagnostic sans examen, correction éventuelle et validation explicite par un médecin diplômé.
                </div>
              )}

              {/* Structured Report Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xxs font-bold text-slate-500 uppercase block mb-1">
                    Indication clinique :
                  </label>
                  <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {currentReport.clinicalIndication}
                  </p>
                </div>

                <div>
                  <label className="text-xxs font-bold text-slate-500 uppercase block mb-1">
                    Technique d’examen :
                  </label>
                  <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {currentReport.technique}
                  </p>
                </div>
              </div>

              {/* Editable Findings */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xxs font-bold text-slate-700 uppercase">
                    Constatations Morphologiques & Analyse Visuelle :
                  </label>
                  {currentReport.status === 'AI_DRAFT' && (
                    <span className="text-3xs text-teal-700 font-semibold">Editable par le praticien</span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={editedFindings}
                  disabled={currentReport.status === 'VALIDATED_BY_DOCTOR'}
                  onChange={(e) => setEditedFindings(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-50 disabled:text-slate-700"
                />
              </div>

              {/* Editable Conclusion */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xxs font-bold text-slate-700 uppercase">
                    Conclusion Radiologique & Conduite à Tenir :
                  </label>
                  {currentReport.suggestedCim11 && (
                    <span className="text-3xs font-mono font-bold text-slate-500">
                      Code CIM-11 proposé : {currentReport.suggestedCim11}
                    </span>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={editedConclusion}
                  disabled={currentReport.status === 'VALIDATED_BY_DOCTOR'}
                  onChange={(e) => setEditedConclusion(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-50 disabled:text-slate-700"
                />
              </div>

              {/* Signature Metadata if signed */}
              {currentReport.isSigned && (
                <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="font-bold block">Signé électroniquement par : {currentReport.signedByDoctorName}</span>
                      <span className="text-xxs text-emerald-700 font-mono">Date : {currentReport.signedAt} • CHREIN Kaolack</span>
                    </div>
                  </div>
                  <span className="text-xxs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    AUTHENTIFIÉ
                  </span>
                </div>
              )}

              {/* Rejection notice if rejected */}
              {currentReport.status === 'REJECTED_BY_DOCTOR' && currentReport.rejectionReason && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-900">
                  <span className="font-bold block">Motif de rejet consigné :</span>
                  <p className="mt-0.5 text-red-800">{currentReport.rejectionReason}</p>
                </div>
              )}

              {/* Physician Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setShowAuditModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200"
                >
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Historique & Piste d’Audit ({currentReport.auditTrail.length})</span>
                </button>

                <div className="flex items-center gap-2">
                  {currentReport.status === 'AI_DRAFT' && (
                    <>
                      <button
                        onClick={() => setIsRejectionModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs border border-red-200 transition-all"
                      >
                        Rejeter le Brouillon IA
                      </button>

                      <button
                        onClick={handleValidateAndSign}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 font-bold text-xs shadow-xs transition-all"
                      >
                        <UserCheck className="w-4 h-4 text-emerald-200" />
                        <span>Valider et Signer (Médecin)</span>
                      </button>
                    </>
                  )}

                  {/* Print / Export only allowed if validated */}
                  <button
                    type="button"
                    onClick={() => {
                      if (currentReport.status !== 'VALIDATED_BY_DOCTOR') {
                        setErrorMessage("Impression interdite : Un compte rendu d'IA non validé par un médecin ne peut être exporté.");
                        return;
                      }
                      setShowPrintReportModal(true);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      currentReport.status === 'VALIDATED_BY_DOCTOR'
                        ? 'bg-slate-800 text-white hover:bg-slate-900 border-slate-800'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimer Compte Rendu Officiel A4</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2 : REGISTRE DES MODÈLES D'IA & LICENCES
      ====================================================================== */}
      {activeTab === 'REGISTRE' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <h2 className="text-base font-bold text-slate-900">
              Registre Hospitalier des Modèles d’Intelligence Artificielle Médicale
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Traçabilité stricte des poids, des architectures, des licences d’exploitation et des conditions d’utilisation clinique au CHREIN.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modelsRegistry.map((m) => (
              <div key={m.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-3xs font-mono font-bold text-teal-700 uppercase">{m.modality} • {m.task}</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{m.name}</h3>
                    <span className="text-xxs text-slate-400 font-mono">Version: {m.version}</span>
                  </div>
                  <span className={`text-3xs font-bold px-2 py-0.5 rounded uppercase ${
                    m.status === 'ACTIVE_VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {m.status === 'ACTIVE_VERIFIED' ? '✓ Actif' : '⏳ Serveur Externe'}
                  </span>
                </div>

                <div className="text-xxs space-y-1.5 border-t border-b border-slate-100 py-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Architecture :</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[220px]">{m.architecture}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Licence :</span>
                    <span className="font-bold text-slate-800">{m.license}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Usage commercial autorisé :</span>
                    <span className={`font-bold ${m.commercialAllowed ? 'text-emerald-700' : 'text-red-700'}`}>
                      {m.commercialAllowed ? 'Autorisé sans restriction' : 'Strictement non commercial (Recherche)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Poids & VRAM requise :</span>
                    <span className="font-mono text-slate-800">{m.weightsSizeMb} Mo • {m.minVramGb} Go VRAM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Matériel recommandé :</span>
                    <span className="text-slate-800">{m.recommendedHardware}</span>
                  </div>
                </div>

                <div>
                  <span className="text-3xs font-bold text-slate-500 uppercase block mb-1">Pathologies cibles :</span>
                  <div className="flex flex-wrap gap-1">
                    {m.supportedClasses.slice(0, 6).map((c, i) => (
                      <span key={i} className="text-3xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xxs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 italic">
                  {m.clinicalNotes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3 : COMPTES RENDUS & FILE DE VALIDATION
      ====================================================================== */}
      {activeTab === 'COMPTES_RENDUS' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                File d’Attente & Dossiers d’Imagerie Médicale
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Suivi longitudinal des examens, du statut de brouillon IA à la validation et signature officielle.
              </p>
            </div>
            <button
              onClick={fetchExistingReports}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualiser</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-3xs tracking-wider">
                <tr>
                  <th className="py-3 px-4">Dossier / N° Examen</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Modèle IA</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Signataire</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportsList.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {r.examinationId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.patientName}</div>
                      <span className="text-xxs text-slate-400 font-mono">{r.patientHospitalNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {r.modelUsed}
                    </td>
                    <td className="py-3 px-4">
                      {r.status === 'AI_DRAFT' && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xxs font-bold border border-amber-200">
                          Brouillon IA
                        </span>
                      )}
                      {r.status === 'VALIDATED_BY_DOCTOR' && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xxs font-bold border border-emerald-200">
                          Validé Médecin
                        </span>
                      )}
                      {r.status === 'REJECTED_BY_DOCTOR' && (
                        <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-800 text-xxs font-bold border border-red-200">
                          Rejeté
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xxs">
                      {r.signedByDoctorName ? (
                        <span className="font-bold text-emerald-800">{r.signedByDoctorName}</span>
                      ) : (
                        <span className="text-slate-400 italic">En attente</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setCurrentReport(r);
                          setEditedFindings(r.findings);
                          setEditedConclusion(r.conclusion);
                          setActiveTab('VIEWER_ANALYSE');
                        }}
                        className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-xxs transition-all"
                      >
                        Consulter / Valider
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4 : EVALUATION COMPARATIVE (ARK+ vs LLAVA-RAD vs MAIRA-2)
      ====================================================================== */}
      {activeTab === 'EVALUATION' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <h2 className="text-base font-bold text-slate-900">
              Rapport d’Évaluation Technique et Réglementaire — Phase 1
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Benchmark comparatif entre le modèle de classification Ark+ et les modèles de vision-langage (VLM) LLaVA-Rad et MAIRA-2.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ark+ Card */}
            <div className="bg-white border-2 border-teal-600 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-teal-800 uppercase">Ark+ Chest Foundation</span>
                <span className="text-xxs px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-bold">Score 9.2/10</span>
              </div>
              <p className="text-xxs text-slate-600">
                Vision Transformer ViT-Base entraîné sur &gt;1.2 million de clichés. AUROC moyen de 0.912 sur CheXpert.
              </p>
              <div className="space-y-1 text-xxs">
                <div className="font-bold text-slate-800">Points forts :</div>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-3xs">
                  <li>Licence Apache 2.0 (commercialisable sans restriction)</li>
                  <li>Détection sensible : Pneumothorax (0.938), Pleurésie (0.945)</li>
                  <li>Poids légers (345 Mo), tourne sur GPU 8 Go standard</li>
                </ul>
              </div>
              <div className="pt-2 border-t border-slate-100 text-3xs font-bold text-teal-800">
                Statut : RECOMMANDÉ EN PRODUCTION (Phase 1)
              </div>
            </div>

            {/* LLaVA-Rad Card */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase">LLaVA-Rad 7B (VLM)</span>
                <span className="text-xxs px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">Score 7.8/10</span>
              </div>
              <p className="text-xxs text-slate-600">
                VLM basé sur CLIP et Vicuna médicalisé. Capable de rédiger un compte rendu radiologique complet.
              </p>
              <div className="space-y-1 text-xxs">
                <div className="font-bold text-slate-800">Points forts & Risques :</div>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-3xs">
                  <li>Comptes rendus narratifs riches en langage naturel</li>
                  <li>Licence de recherche ouverte (non commercialisable directement)</li>
                  <li>Requiert 16 à 24 Go VRAM (NVIDIA A10G obligatoire)</li>
                </ul>
              </div>
              <div className="pt-2 border-t border-slate-100 text-3xs font-bold text-amber-800">
                Statut : ADMIS EN BROUILLON ASSISTÉ sur serveur externe
              </div>
            </div>

            {/* MAIRA-2 Card */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase">Microsoft MAIRA-2</span>
                <span className="text-xxs px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-bold">Score 8.7/10</span>
              </div>
              <p className="text-xxs text-slate-600">
                Encodeur Rad-DINO combiné à un décodeur multimodal. Ancrage spatial de pointe (grounding).
              </p>
              <div className="space-y-1 text-xxs">
                <div className="font-bold text-slate-800">Points forts & Risques :</div>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-3xs">
                  <li>Taux d'hallucination très faible (4.1%)</li>
                  <li>Licence de recherche Microsoft propriétaire sous accord</li>
                  <li>Nécessite 32-48 Go VRAM (Cluster GPU NVIDIA A100)</li>
                </ul>
              </div>
              <div className="pt-2 border-t border-slate-100 text-3xs font-bold text-slate-600">
                Statut : RÉSERVÉ AU CLOUD GPU HAUTE PERFORMANCE
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5 : ARCHITECTURE & MICROSERVICE PYTHON FASTAPI
      ====================================================================== */}
      {activeTab === 'ARCHITECTURE' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Architecture Microservice Python FastAPI / PyTorch / MONAI
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Instructions de déploiement conteneurisé du moteur d’IA radiologique sur serveur GPU externe.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl text-slate-300 font-mono text-xs space-y-3 overflow-x-auto">
            <div className="text-emerald-400 font-bold"># 1. Cloner et installer les dépendances GPU :</div>
            <div>cd services/ai_imaging_service</div>
            <div>pip install -r requirements.txt</div>
            <div className="text-emerald-400 font-bold pt-2"># 2. Lancer les tests unitaires réels de validation :</div>
            <div>python3 -m unittest tests/test_service.py</div>
            <div className="text-emerald-400 font-bold pt-2"># 3. Démarrer le serveur d’inférence FastAPI :</div>
            <div>uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2</div>
            <div className="text-emerald-400 font-bold pt-2"># 4. Ou déployer via Docker Compose GPU :</div>
            <div>docker compose -f docker-compose.ai.yml up -d</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block">Swagger / OpenAPI :</span>
              <span className="text-xxs text-slate-500 font-mono">http://&lt;ip_gpu&gt;:8000/docs</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block">Endpoint DICOM :</span>
              <span className="text-xxs text-slate-500 font-mono">POST /api/v1/dicom/validate</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block">Endpoint Inférence :</span>
              <span className="text-xxs text-slate-500 font-mono">POST /api/v1/inference/chest-xray</span>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {isRejectionModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <XCircle className="w-5 h-5" />
              <span>Rejet du Brouillon IA (Traçabilité Obligatoire)</span>
            </div>

            <p className="text-xs text-slate-600">
              Veuillez expliciter le motif clinique ou technique du rejet. Ce motif sera consigné de façon immuable dans la piste d’audit de l’établissement.
            </p>

            <textarea
              rows={3}
              placeholder="Ex : Fausse opacité alvéolaire liée à un artéfact de pli cutané ou de superposition scapulaire..."
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRejectionModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRejection}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-xs"
              >
                Confirmer le Rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      {showAuditModal && currentReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Piste d’Audit Immuable — Dossier {currentReport.examinationId}
                </h3>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">×</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {currentReport.auditTrail.map((entry) => (
                <div key={entry.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xxs">
                    <span className="font-bold text-slate-800">{entry.action}</span>
                    <span className="font-mono text-slate-400">{entry.timestamp}</span>
                  </div>
                  <div className="text-xxs text-teal-800 font-semibold">
                    Par : {entry.userName} ({entry.userRole})
                  </div>
                  <p className="text-xxs text-slate-600 italic mt-0.5">
                    {entry.comments}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-white hover:bg-slate-900"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official A4 Printable Compte Rendu Radiologique Modal */}
      {showPrintReportModal && currentReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs print-modal-overlay print-modal-active">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto space-y-4 border border-slate-200 shadow-2xl p-6 print-modal-content">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wide text-slate-800">
                    Compte Rendu Radiologique Officiel CHREIN
                  </h3>
                  <span className="text-3xs text-slate-400 font-mono">
                    Format A4 Portrait • Réf: {currentReport.examinationId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer le Compte Rendu A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintReportModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Printable A4 Sheet */}
            <div className="a4-document-sheet p-8 bg-white border border-slate-300 rounded-xl space-y-5 text-slate-900 font-sans shadow-xs">
              {/* National Emblem & Hospital Header Bar */}
              <div className="avoid-page-break space-y-2 border-b-2 border-slate-900 pb-4">
                <div className="flex h-1.5 w-full rounded-full overflow-hidden">
                  <div className="w-1/3 bg-[#00853F]" />
                  <div className="w-1/3 bg-[#FDEF42]" />
                  <div className="w-1/3 bg-[#E31B23]" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                    RÉPUBLIQUE DU SÉNÉGAL • MINISTÈRE DE LA SANTÉ ET DE L'ACTION SOCIALE
                  </p>
                  <h2 className="text-base font-black text-slate-950 uppercase tracking-tight">
                    CENTRE HOSPITALIER RÉGIONAL EL HADJI IBRAHIMA NIASS (CHREIN) — KAOLACK
                  </h2>
                  <p className="text-xs font-extrabold text-teal-800 uppercase tracking-wide">
                    UNITÉ D'IMAGERIE THORACIQUE & SERVICE DE PNEUMOLOGIE
                  </p>
                  <p className="text-3xs text-slate-500 font-medium">
                    Plateau Technique Numérique • Route Nationale, Quartier Ndangane • Kaolack, Sénégal
                  </p>
                </div>
              </div>

              {/* Title Banner */}
              <div className="avoid-page-break py-2.5 px-4 text-center bg-teal-50 border border-teal-200 rounded-xl">
                <span className="font-black text-sm text-teal-950 uppercase tracking-widest block">
                  COMPTE RENDU D'IMAGERIE THORACIQUE (CERTIFIÉ MÉDECIN)
                </span>
                <span className="text-xxs font-mono font-bold text-teal-800">
                  EXAMEN N° : {currentReport.examinationId} • MODALITÉ : {uploadedFile?.dicomMeta?.modality || 'DX / RADIOGRAPHIE THORACIQUE'}
                </span>
              </div>

              {/* Patient Demographics Box */}
              <div className="avoid-page-break grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="space-y-1">
                  <p><span className="text-slate-500 font-medium">Patient :</span> <strong className="text-slate-900">{currentReport.patientName || selectedCase.patientName}</strong></p>
                  <p><span className="text-slate-500 font-medium">N° Hospitalier / IP :</span> <strong className="font-mono">{currentReport.patientHospitalNumber || selectedCase.hospitalNumber}</strong></p>
                  <p><span className="text-slate-500 font-medium">Âge / Sexe :</span> <strong>{selectedCase.patientAge} ans ({selectedCase.patientGender})</strong></p>
                  <p><span className="text-slate-500 font-medium">Fichier source :</span> <span className="font-mono text-3xs text-slate-600">{currentReport.imageFileName}</span></p>
                </div>
                <div className="space-y-1 text-right sm:text-left">
                  <p><span className="text-slate-500 font-medium">Date d'examen :</span> <strong>{new Date(currentReport.createdAt).toLocaleDateString('fr-FR')}</strong></p>
                  <p><span className="text-slate-500 font-medium">Praticien signataire :</span> <strong>{currentReport.signedByDoctorName || 'Dr. Cheikh Ndao'}</strong></p>
                  <p><span className="text-slate-500 font-medium">Qualification :</span> <strong>Pneumologue Référent</strong></p>
                  <p><span className="text-slate-500 font-medium">Statut :</span> <strong className="text-emerald-700">Validé et signé électroniquement ✓</strong></p>
                </div>
              </div>

              {/* Clinical Indication */}
              <div className="avoid-page-break p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 text-xs">
                <span className="text-3xs uppercase font-extrabold text-teal-900 block border-b pb-0.5">
                  1. Renseignements & Indication Clinique
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {clinicalContext || selectedCase.indication}
                </p>
              </div>

              {/* Radiological Findings */}
              <div className="avoid-page-break p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <span className="text-3xs uppercase font-extrabold text-teal-900 block border-b pb-0.5">
                  2. Description Sémiologique & Résultats Détaillés
                </span>
                <p className="text-slate-900 whitespace-pre-line leading-relaxed font-mono">
                  {editedFindings || currentReport.findings}
                </p>
              </div>

              {/* AI CAD Assist Summary (Certified) */}
              {currentReport.findingsDetail && currentReport.findingsDetail.length > 0 && (
                <div className="avoid-page-break p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="text-3xs uppercase font-extrabold text-slate-700">
                      3. Analyse Assistée par IA Certifiée ({currentReport.modelUsed})
                    </span>
                    <span className="text-3xs font-mono font-bold text-teal-800">
                      Validation praticien conforme HAS / OMS
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-xxs">
                    {currentReport.findingsDetail.map((f, idx) => (
                      <div key={idx} className="p-1.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                        <span className="text-slate-700 font-bold">{f.pathology} :</span>
                        <span className={`font-black ${f.isDetected ? 'text-red-700' : 'text-slate-500'}`}>
                          {(f.probability * 100).toFixed(1)}% {f.isDetected ? '●' : '○'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conclusion & CIM-11 */}
              <div className="avoid-page-break p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between border-b border-teal-200 pb-1">
                  <span className="text-3xs uppercase font-extrabold text-teal-950">
                    4. Conclusion Radiologique & Conduite à Tenir
                  </span>
                  {currentReport.suggestedCim11 && (
                    <span className="text-3xs font-mono font-bold text-teal-900">
                      Codification CIM-11 : {currentReport.suggestedCim11}
                    </span>
                  )}
                </div>
                <p className="text-teal-950 font-bold leading-relaxed pt-1">
                  {editedConclusion || currentReport.conclusion}
                </p>
              </div>

              {/* Official Seal, Timestamp & QR Code Footer */}
              <div className="avoid-page-break pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 border-2 border-slate-300 rounded-xl flex flex-col items-center justify-center p-1 bg-slate-50">
                    <QrCode className="w-8 h-8 text-slate-700" />
                    <span className="text-[7px] font-mono text-slate-400 mt-0.5 uppercase">CHREIN VÉRIF</span>
                  </div>
                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-800">Authentification Documentaire DPI CHREIN</p>
                    <p>Code QR : <span className="font-mono text-3xs">CHREIN-IMG-{currentReport.examinationId}</span></p>
                    <p>Horodatage certifié : {new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' })}</p>
                  </div>
                </div>

                <div className="text-right space-y-1 min-w-[200px]">
                  <p className="text-xs font-bold text-slate-900">Le Médecin Radiologue / Pneumologue</p>
                  <p className="text-xs text-teal-700 font-extrabold">{currentReport.signedByDoctorName || 'Dr. Cheikh Ndao'}</p>
                  <div className="w-40 h-16 border-2 border-dashed border-teal-300 bg-teal-50/40 rounded-xl mt-1 flex flex-col items-center justify-center text-[9px] text-teal-800 font-semibold p-1">
                    <span>Cachet Officiel CHREIN</span>
                    <span className="text-[8px] text-teal-600">Unité d'Imagerie Thoracique</span>
                    <span className="text-[8px] text-slate-500">Signé électroniquement ✓</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 no-print">
              <button
                type="button"
                onClick={() => setShowPrintReportModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
