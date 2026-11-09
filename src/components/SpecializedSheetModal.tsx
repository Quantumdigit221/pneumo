import React, { useState } from 'react';
import { SpecializedPneumoRecord, SpecializedFormType, Patient } from '../types';
import { useStore } from '../store';
import {
  Printer,
  X,
  Edit3,
  Trash2,
  CheckCircle2,
  Save,
  FileText,
  Wind,
  HeartPulse,
  Activity,
  Stethoscope,
  Microscope,
  Pill,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  Eye,
  ArrowLeft,
  QrCode
} from 'lucide-react';
import { VoiceDictationButton } from './VoiceDictationButton';

interface SpecializedSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: SpecializedPneumoRecord | null;
  patient: Patient;
  initialMode?: 'view' | 'edit' | 'create';
  onRecordSaved?: (record: SpecializedPneumoRecord) => void;
}

export const SPECIALIZED_FORM_CONFIGS: Record<SpecializedFormType, {
  label: string;
  badge: string;
  color: string;
  icon: React.ReactNode;
}> = {
  TUBERCULOSIS: {
    label: 'Tuberculose & Résistance (PNT)',
    badge: 'PNT Sénégal',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: <Microscope className="w-4 h-4 text-rose-600" />
  },
  COPD: {
    label: 'BPCO & Tabacologie GOLD',
    badge: 'GOLD 2023',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Wind className="w-4 h-4 text-amber-600" />
  },
  ASTHMA: {
    label: 'Asthme & Contrôle GINA',
    badge: 'GINA 2024',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <HeartPulse className="w-4 h-4 text-emerald-600" />
  },
  TB_SEQUELAE: {
    label: 'Séquelles de Tuberculose & 6MWT',
    badge: 'Post-TB / 6MWT',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: <Activity className="w-4 h-4 text-indigo-600" />
  },
  PID_IPAF: {
    label: 'Pneumopathie Interstitielle Diffuse (PID)',
    badge: 'PID / Fibrose',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: <Stethoscope className="w-4 h-4 text-purple-600" />
  },
  BRONCHIECTASIS: {
    label: 'Dilatation des Bronches (DDB)',
    badge: 'DDB / Bronchectasies',
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: <Wind className="w-4 h-4 text-cyan-600" />
  },
  PLEURAL_DISEASE: {
    label: 'Pleurésie & Drainage Pleural',
    badge: 'Ponction / Drainage',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <FileText className="w-4 h-4 text-blue-600" />
  },
  THORACIC_CANCER: {
    label: 'Oncologie Thoracique',
    badge: 'Onco-Pneumo',
    color: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: <Activity className="w-4 h-4 text-slate-700" />
  },
  PULMONARY_EMBOLISM: {
    label: 'Embolie Pulmonaire & HTP',
    badge: 'Vasculaire Pulmonaire',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: <AlertCircle className="w-4 h-4 text-red-600" />
  },
  ACUTE_PNEUMONIA: {
    label: 'Pneumonie Aiguë Communautaire',
    badge: 'PAC / Infectieux',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: <AlertCircle className="w-4 h-4 text-orange-600" />
  },
  ANTIBIOTIC_STEWARDSHIP: {
    label: 'Bon Usage des Antibiotiques (Antibiogouvernance)',
    badge: 'Stewardship 48-72h',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: <Pill className="w-4 h-4 text-teal-600" />
  }
};

export const SpecializedSheetModal: React.FC<SpecializedSheetModalProps> = ({
  isOpen,
  onClose,
  record,
  patient,
  initialMode = 'view',
  onRecordSaved
}) => {
  const {
    saveSpecializedPneumoRecord,
    deleteSpecializedPneumoRecord,
    currentUser,
    currentCenter
  } = useStore();

  const [mode, setMode] = useState<'view' | 'edit' | 'create' | 'print'>(initialMode);
  const [formType, setFormType] = useState<SpecializedFormType>(record?.formType || 'TUBERCULOSIS');
  const [formData, setFormData] = useState<Record<string, any>>(record?.data || {});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleFieldChange = (key: string, val: any) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const titles: Record<SpecializedFormType, string> = {
      TUBERCULOSIS: 'Fiche Spécialisée — Tuberculose & Résistance (PNT)',
      COPD: 'Fiche Spécialisée — BPCO & Spirométrie GOLD',
      ASTHMA: 'Fiche Spécialisée — Suivi & Contrôle de l\'Asthme GINA',
      TB_SEQUELAE: 'Fiche Spécialisée — Séquelles de Tuberculose & 6MWT',
      PID_IPAF: 'Fiche Spécialisée — Pneumopathie Interstitielle Diffuse (PID)',
      BRONCHIECTASIS: 'Fiche Spécialisée — Dilatation des Bronches (DDB)',
      PLEURAL_DISEASE: 'Fiche Spécialisée — Pleurésie & Drainage Pleural',
      THORACIC_CANCER: 'Fiche Spécialisée — Oncologie Thoracique',
      PULMONARY_EMBOLISM: 'Fiche Spécialisée — Embolie Pulmonaire & HTP',
      ACUTE_PNEUMONIA: 'Fiche Spécialisée — Pneumonie Aiguë & Oxygénothérapie',
      ANTIBIOTIC_STEWARDSHIP: 'Fiche de Bon Usage des Antibiotiques (Antibiogouvernance)'
    };

    const targetId = record?.id || `spec-${Date.now()}`;
    const newRecord: SpecializedPneumoRecord = {
      id: targetId,
      patientId: patient.id,
      centerId: currentCenter?.id || 'center-1',
      doctorId: currentUser?.id || record?.doctorId || 'doc-1',
      doctorName: currentUser?.name || record?.doctorName || 'Dr. Pneumologue CHREIN',
      formType,
      date: record?.date || new Date().toISOString(),
      title: titles[formType],
      data: formData,
      createdAt: record?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveSpecializedPneumoRecord(newRecord);
    if (onRecordSaved) onRecordSaved(newRecord);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setMode('view');
    }, 1200);
  };

  const handleDelete = async () => {
    if (!record) return;
    await deleteSpecializedPneumoRecord(record.id);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  const activeConfig = SPECIALIZED_FORM_CONFIGS[formType] || SPECIALIZED_FORM_CONFIGS.TUBERCULOSIS;
  const currentRecord = record ? { ...record, data: formData } : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs print-modal-overlay print-modal-active">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto space-y-4 border border-slate-200 shadow-2xl p-6 print-modal-content">
        
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 no-print">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${activeConfig.color}`}>
              {activeConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-800">
                  {mode === 'create' ? 'Nouvelle Fiche Spécialisée' : (record?.title || activeConfig.label)}
                </h3>
                <span className={`text-3xs font-extrabold uppercase px-2 py-0.5 rounded-md border ${activeConfig.color}`}>
                  {activeConfig.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Patient : <strong className="text-slate-700">{patient.firstName} {patient.lastName}</strong> ({patient.code})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'view' && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  title="Imprimer au format A4"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-600" />
                  <span>Imprimer A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </button>
                {deleteConfirm ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition"
                    >
                      Confirmer
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Supprimer la fiche"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            {(mode === 'edit' || mode === 'create') && record && (
              <button
                type="button"
                onClick={() => setMode('view')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1: VIEW (CONSULTATION) & PRINT (A4 DOCUMENT)                        */}
        {/* ========================================================================= */}
        {(mode === 'view' || mode === 'print') && (
          <div className="a4-document-sheet p-6 sm:p-8 bg-white border border-slate-300 rounded-xl space-y-5 text-slate-900 font-sans shadow-xs">
            {/* Senegal National Flag Stripe & Hospital Header */}
            <div className="avoid-page-break space-y-2 border-b-2 border-slate-900 pb-4">
              <div className="flex h-2 w-full rounded-full overflow-hidden shadow-2xs">
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

            {/* Document Title Banner */}
            <div className="avoid-page-break py-2.5 px-4 text-center bg-teal-50 border border-teal-200 rounded-xl">
              <span className="font-black text-sm text-teal-950 uppercase tracking-widest block">
                {record?.title || activeConfig.label}
              </span>
              <span className="text-xxs font-mono font-bold text-teal-800">
                DOSSIER MÉDICAL SPÉCIALISÉ • {activeConfig.badge} • RÉF : {record?.id || 'NOUVEAU'}
              </span>
            </div>

            {/* Patient Demographics Box */}
            <div className="avoid-page-break grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs">
              <div className="space-y-1">
                <p><span className="text-slate-500 font-medium">Nom & Prénom :</span> <strong className="text-slate-950 font-bold uppercase">{patient.lastName}</strong> <strong className="text-slate-900">{patient.firstName}</strong></p>
                <p><span className="text-slate-500 font-medium">Code IP / Dossier :</span> <strong className="font-mono text-teal-800 font-bold">{patient.code}</strong> (N° Hosp: <span className="font-mono">{patient.hospitalNumber || 'CHREIN-PNEUMO'}</span>)</p>
                <p><span className="text-slate-500 font-medium">Date Naiss. / Âge :</span> <strong>{patient.birthDate ? `${new Date(patient.birthDate).toLocaleDateString('fr-FR')} (${patient.age} ans)` : `${patient.age} ans`} ({patient.gender === 'M' ? 'Masculin' : 'Féminin'})</strong></p>
                <p><span className="text-slate-500 font-medium">Domicile :</span> <span>{patient.district ? `${patient.district}, Kaolack` : patient.address || 'Kaolack, Sénégal'}</span></p>
                <p><span className="text-slate-500 font-medium">Téléphone :</span> <span className="font-mono">{patient.phone || 'Non renseigné'}</span></p>
                {patient.bloodGroup && (
                  <p><span className="text-slate-500 font-medium">Groupe Sanguin :</span> <strong className="font-mono text-rose-700">{patient.bloodGroup}</strong></p>
                )}
                {patient.allergies && (
                  <p><span className="text-slate-500 font-medium">Allergies connues :</span> <strong className="text-amber-800">{patient.allergies}</strong></p>
                )}
              </div>
              <div className="space-y-1 text-right sm:text-left">
                <p><span className="text-slate-500 font-medium">Date d'évaluation :</span> <strong>{new Date(record?.date || Date.now()).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></p>
                <p><span className="text-slate-500 font-medium">Praticien référent :</span> <strong>{record?.doctorName || currentUser?.name || 'Dr. Cheikh Ndao'}</strong></p>
                <p><span className="text-slate-500 font-medium">Titre :</span> <span>Médecin Spécialiste Pneumologue</span></p>
                <p><span className="text-slate-500 font-medium">N° Inscription Ordre (CNOM) :</span> <span className="font-mono text-slate-700">SN-1428</span></p>
                <p><span className="text-slate-500 font-medium">Service émetteur :</span> <strong>Pneumo-Phtisiologie & Soins Respiratoires</strong></p>
                {patient.chronicConditions && (
                  <p><span className="text-slate-500 font-medium">Antécédents / Terrain :</span> <span className="text-slate-700 font-medium">{patient.chronicConditions}</span></p>
                )}
                <p><span className="text-slate-500 font-medium">Statut :</span> <strong className="text-emerald-700 font-bold">Validé au Dossier Patient Informatisé (DPI)</strong></p>
              </div>
            </div>

            {/* Specialized Clinical Data Rendered by Form Type */}
            <div className="avoid-page-break space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Données Cliniques et Explorations Spécifiques</span>
              </h4>

              {/* TUBERCULOSE */}
              {formType === 'TUBERCULOSIS' && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Forme Clinique</span>
                    <strong className="text-slate-900">{formData.tbForm || 'Non précisé'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">GeneXpert MTB/RIF</span>
                    <strong className={formData.genexpertResult?.includes('RES') ? 'text-rose-700' : 'text-emerald-700'}>
                      {formData.genexpertResult || 'En attente'}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Schéma Thérapeutique</span>
                    <strong className="text-slate-900">{formData.regimen || '2RHZE / 4RH standard'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Observance / Tolérance</span>
                    <strong className="text-slate-900">{formData.adherence || 'Bonne observance sous TDO'}</strong>
                  </div>
                </div>
              )}

              {/* BPCO */}
              {formType === 'COPD' && (
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Intoxication Tabagique</span>
                    <strong className="text-slate-900">{formData.packYears || 0} Paquets-Années</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Stade Spirométrique GOLD</span>
                    <strong className="text-amber-800">{formData.goldStage || 'Non renseigné'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Groupe GOLD 2023</span>
                    <strong className="text-indigo-800 font-bold">{formData.goldGroup || 'Groupe E'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Dyspnée mMRC</span>
                    <strong className="text-slate-900">{formData.mmrcScore !== undefined ? `Stade ${formData.mmrcScore} / 4` : 'Évalué'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Exacerbations / an</span>
                    <strong className="text-slate-900">{formData.exacerbationsPastYear || 0} (dont sévères)</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Traitement de fond</span>
                    <strong className="text-slate-900">{formData.maintenanceTreatment || 'LAMA + LABA'}</strong>
                  </div>
                </div>
              )}

              {/* ASTHME */}
              {formType === 'ASTHMA' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Contrôle de l'Asthme (GINA)</span>
                    <strong className="text-emerald-700">{formData.ginaControl || 'Bien contrôlé'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Palier Thérapeutique</span>
                    <strong className="text-slate-900">{formData.ginaStep || 'Palier 3'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">DEP Mesuré</span>
                    <strong className="text-slate-900">{formData.peakFlow ? `${formData.peakFlow} L/min` : 'N/A'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Technique d'Inhalation</span>
                    <strong className="text-slate-900">{formData.inhalerTechnique || 'Vérifiée correcte'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                    <span className="text-slate-500 block text-xxs font-semibold">Facteurs Déclenchants Identifiés</span>
                    <span className="text-slate-800">{formData.triggers || 'Poussière d\'Harmattan, fumée de biomasse'}</span>
                  </div>
                </div>
              )}

              {/* SÉQUELLES TB & 6MWT */}
              {formType === 'TB_SEQUELAE' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Type de Séquelles Pulmonaires</span>
                    <strong className="text-slate-900">{formData.sequelaeType || 'Bronchectasies / Fibrose'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Distance 6MWT (Test Marche 6 min)</span>
                    <strong className="text-indigo-700 font-mono text-sm">{formData.walkDistance ? `${formData.walkDistance} mètres` : 'Évalué'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Désaturation Effort (SpO2 min)</span>
                    <strong className="text-rose-700 font-mono">{formData.minSpo2 ? `${formData.minSpo2} %` : 'N/A'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-3">
                    <span className="text-slate-500 block text-xxs font-semibold">Réhabilitation Respiratoire</span>
                    <span className="text-slate-800">{formData.rehabPlan || 'Kinésithérapie respiratoire de désencombrement et réentraînement à l\'effort'}</span>
                  </div>
                </div>
              )}

              {/* PID / FIBROSE */}
              {formType === 'PID_IPAF' && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Auscultation Pulmonaire</span>
                    <strong className="text-slate-900">{formData.auscultation || 'Râles crépitants type velcro bilatéraux'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Pattern TDM Thoracique Haute Résolution (HRCT)</span>
                    <strong className="text-slate-900">{formData.hrctPattern || 'Rayon de miel sous-pleural'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Bilan Auto-immun / Connectivite</span>
                    <strong className="text-slate-900">{formData.autoimmunity || 'AAN / Facteur rhumatoïde recherché'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Oxygéno-requérance au repos</span>
                    <strong className="text-slate-900">{formData.oxygenRequired ? 'Oui (O2-dépendant)' : 'Non (SpO2 repos > 92%)'}</strong>
                  </div>
                </div>
              )}

              {/* DDB */}
              {formType === 'BRONCHIECTASIS' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Topographie des Bronchectasies</span>
                    <strong className="text-slate-900">{formData.topography || 'Lobes inférieurs bilatéraux'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Volume d'Expectoration Quotidien</span>
                    <strong className="text-slate-900">{formData.sputumVolume || '30 - 50 ml/jour'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Colonisation Bactérienne (ECBC)</span>
                    <strong className="text-slate-900">{formData.colonization || 'Haemophilus influenzae'}</strong>
                  </div>
                </div>
              )}

              {/* PLEURÉSIE */}
              {formType === 'PLEURAL_DISEASE' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Côté & Abord</span>
                    <strong className="text-slate-900">{formData.pleuralSide || 'Hémithorax droit, écho-guidé'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Aspect Macro du Liquide</span>
                    <strong className="text-slate-900">{formData.fluidAspect || 'Jaune citrin clair'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Formule / Exsudat</span>
                    <strong className="text-slate-900">{formData.fluidChemistry || 'Exsudat lymphocytaire (> 40 g/L)'}</strong>
                  </div>
                </div>
              )}

              {/* BON USAGE ANTIBIOTIQUES */}
              {formType === 'ANTIBIOTIC_STEWARDSHIP' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Molécule & Posologie</span>
                    <strong className="text-teal-800">{formData.antibioticMolecule || 'Ceftriaxone 2g/jour IV'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Indication Documentée</span>
                    <strong className="text-slate-900">{formData.indication || 'Infection respiratoire basse'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-xxs font-semibold">Réévaluation à 48-72h</span>
                    <strong className="text-emerald-700">{formData.reassessment || 'Efficace, relais per os programmé'}</strong>
                  </div>
                </div>
              )}

              {/* Generic parameters fallback */}
              {Object.keys(formData).length > 0 && !['TUBERCULOSIS', 'COPD', 'ASTHMA', 'TB_SEQUELAE', 'PID_IPAF', 'BRONCHIECTASIS', 'PLEURAL_DISEASE', 'ANTIBIOTIC_STEWARDSHIP'].includes(formType) && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {Object.entries(formData).filter(([k]) => k !== 'clinicalSynthesis').map(([k, v]) => (
                    <div key={k} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-xxs font-semibold capitalize">{k}</span>
                      <strong className="text-slate-900">{String(v)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clinical Synthesis / Doctor's Conclusion */}
            <div className="avoid-page-break space-y-2 p-4 bg-teal-50/50 border border-teal-200 rounded-xl">
              <span className="text-xxs font-black uppercase tracking-wider text-teal-800 block">
                Synthèse Clinique & Conduite à Tenir Spécialisée
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {formData.clinicalSynthesis || 'Évaluation spécialisée conforme aux protocoles du service de pneumologie du CHREIN. Surveillance clinique et radiologique programmée selon les recommandations en vigueur.'}
              </p>
            </div>

            {/* Signature & Official Seal Box */}
            <div className="avoid-page-break pt-6 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 border-2 border-slate-300 rounded-xl flex flex-col items-center justify-center p-1 bg-slate-50">
                  <QrCode className="w-8 h-8 text-slate-700" />
                  <span className="text-[7px] font-mono text-slate-400 mt-0.5 uppercase">CHREIN VÉRIF</span>
                </div>
                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <p className="font-bold text-slate-800">Authentification Documentaire DPI CHREIN</p>
                  <p>Réf Fiche : <span className="font-mono text-3xs font-bold text-slate-700">{record?.id || 'DPI-PNEUMO'}</span></p>
                  <p>Fait à Kaolack, le : <strong className="text-slate-800">{new Date(record?.date || Date.now()).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></p>
                  <p className="text-3xs text-slate-400">Document médical certifié conforme au Code de Déontologie Médicale</p>
                </div>
              </div>

              <div className="text-right space-y-1 min-w-[200px]">
                <p className="text-xs font-bold text-slate-900">Le Médecin Spécialiste Traitant</p>
                <p className="text-xs text-teal-700 font-extrabold">{record?.doctorName || currentUser?.name || 'Dr. Cheikh Ndao'}</p>
                <div className="inline-block w-44 h-18 border-2 border-dashed border-teal-300 bg-teal-50/40 rounded-xl p-1.5 text-center text-[9px] text-teal-800 font-semibold">
                  <span className="block font-bold">Cachet Officiel CHREIN</span>
                  <span className="block text-teal-600">Pneumologie & Phtisiologie</span>
                  <span className="block text-slate-500 text-[8px] mt-0.5">Signature Électronique Certifiée ✓</span>
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
        )}

        {/* ========================================================================= */}
        {/* MODE 2: EDIT OR CREATE (FORMULAIRE MÉDICAL DE SAISIE)                     */}
        {/* ========================================================================= */}
        {(mode === 'edit' || mode === 'create') && (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Protocol Type Selector (only enabled when creating) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Protocole Spécialisé</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(SPECIALIZED_FORM_CONFIGS) as SpecializedFormType[]).slice(0, 8).map(typeKey => {
                  const cfg = SPECIALIZED_FORM_CONFIGS[typeKey];
                  const isSelected = formType === typeKey;
                  return (
                    <button
                      type="button"
                      key={typeKey}
                      onClick={() => {
                        setFormType(typeKey);
                        if (mode === 'create') setFormData({});
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/70 text-teal-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium text-xs'
                      }`}
                    >
                      <div className="shrink-0">{cfg.icon}</div>
                      <span className="text-xs truncate">{cfg.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Protocol specific inputs */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                {activeConfig.icon}
                <span>Paramètres cliniques : {activeConfig.label}</span>
              </h4>

              {/* TUBERCULOSE FORM */}
              {formType === 'TUBERCULOSIS' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Forme Clinique TB</label>
                    <select
                      value={formData.tbForm || ''}
                      onChange={(e) => handleFieldChange('tbForm', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="Tuberculose Pulmonaire TPM+">Tuberculose Pulmonaire TPM+</option>
                      <option value="Tuberculose Pulmonaire TPM-">Tuberculose Pulmonaire TPM-</option>
                      <option value="Pleurésie Tuberculeuse">Pleurésie Tuberculeuse (TEP)</option>
                      <option value="Tuberculose Ganglionnaire">Tuberculose Ganglionnaire</option>
                      <option value="Mal de Pott / Osseuse">Mal de Pott / Osseuse</option>
                      <option value="Tuberculose Miliaire">Tuberculose Miliaire</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Résultat GeneXpert MTB/RIF</label>
                    <select
                      value={formData.genexpertResult || ''}
                      onChange={(e) => handleFieldChange('genexpertResult', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="MTB Détecté - Sensible Rifampicine">MTB Détecté - Sensible Rifampicine</option>
                      <option value="MTB Détecté - RÉSISTANT Rifampicine (MDR/RR)">MTB Détecté - RÉSISTANT Rifampicine (MDR/RR)</option>
                      <option value="MTB Non Détecté">MTB Non Détecté</option>
                      <option value="En attente de résultat">En attente de résultat</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Schéma Thérapeutique PNT</label>
                    <select
                      value={formData.regimen || ''}
                      onChange={(e) => handleFieldChange('regimen', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="2RHZE / 4RH (Standard 6 mois)">2RHZE / 4RH (Standard 6 mois)</option>
                      <option value="2RHZ / 4RH (Alternative)">2RHZ / 4RH (Alternative)</option>
                      <option value="Régime MDR-TB 9-11 mois">Régime MDR-TB 9-11 mois</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Observance / Suivi TDO</label>
                    <select
                      value={formData.adherence || ''}
                      onChange={(e) => handleFieldChange('adherence', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="Bonne observance (> 95%)">Bonne observance (&gt; 95%)</option>
                      <option value="Irrégulière / Oublis déclarés">Irrégulière / Oublis déclarés</option>
                      <option value="Intolérance digestive / Prurit">Intolérance digestive / Prurit</option>
                    </select>
                  </div>
                </div>
              )}

              {/* BPCO FORM */}
              {formType === 'COPD' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Tabac (Paquets-Années)</label>
                    <input
                      type="number"
                      value={formData.packYears || ''}
                      onChange={(e) => handleFieldChange('packYears', e.target.value)}
                      placeholder="Ex: 25"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Stade Spirométrique GOLD</label>
                    <select
                      value={formData.goldStage || ''}
                      onChange={(e) => handleFieldChange('goldStage', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Stade --</option>
                      <option value="GOLD 1 (Léger, VEMS >= 80%)">GOLD 1 (Léger, VEMS &gt;= 80%)</option>
                      <option value="GOLD 2 (Modéré, 50-79%)">GOLD 2 (Modéré, 50-79%)</option>
                      <option value="GOLD 3 (Sévère, 30-49%)">GOLD 3 (Sévère, 30-49%)</option>
                      <option value="GOLD 4 (Très Sévère, < 30%)">GOLD 4 (Très Sévère, &lt; 30%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Groupe GOLD 2023</label>
                    <select
                      value={formData.goldGroup || ''}
                      onChange={(e) => handleFieldChange('goldGroup', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Groupe --</option>
                      <option value="Groupe A (Peu de symptômes, faible risque)">Groupe A (Peu de symptômes, faible risque)</option>
                      <option value="Groupe B (Symptômes marqués, faible risque)">Groupe B (Symptômes marqués, faible risque)</option>
                      <option value="Groupe E (Exacerbateur fréquent / hospitalisé)">Groupe E (Exacerbateur fréquent / hospitalisé)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ASTHME FORM */}
              {formType === 'ASTHMA' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Contrôle GINA</label>
                    <select
                      value={formData.ginaControl || ''}
                      onChange={(e) => handleFieldChange('ginaControl', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Contrôle --</option>
                      <option value="Bien contrôlé">Bien contrôlé</option>
                      <option value="Partiellement contrôlé">Partiellement contrôlé</option>
                      <option value="Non contrôlé">Non contrôlé</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Palier Thérapeutique GINA</label>
                    <select
                      value={formData.ginaStep || ''}
                      onChange={(e) => handleFieldChange('ginaStep', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Palier --</option>
                      <option value="Palier 1 (CSI-Formotérol au besoin)">Palier 1 (CSI-Formotérol au besoin)</option>
                      <option value="Palier 2 (CSI dose faible quotidienne)">Palier 2 (CSI dose faible quotidienne)</option>
                      <option value="Palier 3 (CSI dose faible + LABA)">Palier 3 (CSI dose faible + LABA)</option>
                      <option value="Palier 4 (CSI dose moyenne + LABA)">Palier 4 (CSI dose moyenne + LABA)</option>
                      <option value="Palier 5 (CSI forte dose + Biothérapie)">Palier 5 (CSI forte dose + Biothérapie)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Débit de Pointe DEP (L/min)</label>
                    <input
                      type="number"
                      value={formData.peakFlow || ''}
                      onChange={(e) => handleFieldChange('peakFlow', e.target.value)}
                      placeholder="Ex: 350"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>
              )}

              {/* SÉQUELLES TB */}
              {formType === 'TB_SEQUELAE' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Type de Séquelles</label>
                    <input
                      type="text"
                      value={formData.sequelaeType || ''}
                      onChange={(e) => handleFieldChange('sequelaeType', e.target.value)}
                      placeholder="Ex: DDB localisées lobe supérieur"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Distance 6MWT (mètres)</label>
                    <input
                      type="number"
                      value={formData.walkDistance || ''}
                      onChange={(e) => handleFieldChange('walkDistance', e.target.value)}
                      placeholder="Ex: 420"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">SpO2 minimale à l'effort (%)</label>
                    <input
                      type="number"
                      value={formData.minSpo2 || ''}
                      onChange={(e) => handleFieldChange('minSpo2', e.target.value)}
                      placeholder="Ex: 89"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>
              )}

              {/* PLEURÉSIE */}
              {formType === 'PLEURAL_DISEASE' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Côté & Repérage</label>
                    <input
                      type="text"
                      value={formData.pleuralSide || ''}
                      onChange={(e) => handleFieldChange('pleuralSide', e.target.value)}
                      placeholder="Ex: Droit, repérage écho"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Aspect Macro</label>
                    <select
                      value={formData.fluidAspect || ''}
                      onChange={(e) => handleFieldChange('fluidAspect', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Aspect --</option>
                      <option value="Jaune citrin clair">Jaune citrin clair</option>
                      <option value="Séro-fibrineux">Séro-fibrineux</option>
                      <option value="Hémorragique">Hémorragique</option>
                      <option value="Purulent (Empyème)">Purulent (Empyème)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Protéines Pleurales</label>
                    <input
                      type="text"
                      value={formData.fluidChemistry || ''}
                      onChange={(e) => handleFieldChange('fluidChemistry', e.target.value)}
                      placeholder="Ex: Exsudat 48 g/L"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>
              )}

              {/* BON USAGE ATB */}
              {formType === 'ANTIBIOTIC_STEWARDSHIP' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Molécule prescrite</label>
                    <input
                      type="text"
                      value={formData.antibioticMolecule || ''}
                      onChange={(e) => handleFieldChange('antibioticMolecule', e.target.value)}
                      placeholder="Ex: Ceftriaxone 2g IV"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Indication documentée</label>
                    <input
                      type="text"
                      value={formData.indication || ''}
                      onChange={(e) => handleFieldChange('indication', e.target.value)}
                      placeholder="Ex: Pneumonie communautaire grave"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Réévaluation 48-72h</label>
                    <input
                      type="text"
                      value={formData.reassessment || ''}
                      onChange={(e) => handleFieldChange('reassessment', e.target.value)}
                      placeholder="Ex: Relais oral amoxicilline-clavulanate"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Clinical Synthesis / Textarea with Voice Dictation Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>Synthèse Clinique & Conduite à Tenir</span>
                </label>
                <VoiceDictationButton
                  onTranscript={(text) => {
                    const current = formData.clinicalSynthesis || '';
                    handleFieldChange('clinicalSynthesis', current ? `${current} ${text}` : text);
                  }}
                  title="Dicter la synthèse"
                  className="scale-90"
                />
              </div>
              <textarea
                rows={4}
                value={formData.clinicalSynthesis || ''}
                onChange={(e) => handleFieldChange('clinicalSynthesis', e.target.value)}
                placeholder="Rédigez ou dictez les observations cliniques, l'évolution, le protocole thérapeutique ou les consignes de suivi..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-teal-600 focus:bg-white transition"
              />
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                {saveSuccess && (
                  <span className="text-emerald-600 font-bold text-xs flex items-center gap-1.5 animate-bounce">
                    <CheckCircle2 className="w-4 h-4" /> Enregistré avec succès dans le DPI !
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (record) setMode('view');
                    else onClose();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer la Fiche Spécialisée</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
