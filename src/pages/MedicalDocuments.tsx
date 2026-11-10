import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import {
  MedicalDocumentRecord,
  MedicalDocumentType,
  MedicalDocumentStatus
} from '../types';
import {
  FileText,
  Printer,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  Edit,
  Eye,
  X,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  QrCode,
  FileCheck,
  ArrowRight,
  AlertCircle,
  FilePlus,
  Check,
  Stethoscope,
  Pill,
  Ambulance,
  HeartPulse,
  Save
} from 'lucide-react';
import { VoiceDictationButton } from '../components/VoiceDictationButton';

// Document Archetypes Metadata
const DOCUMENT_TYPES_CONFIG: Record<MedicalDocumentType, {
  label: string;
  badge: string;
  color: string;
  icon: any;
  prefix: string;
  defaultTitle: string;
}> = {
  CRH: {
    label: 'Compte-Rendu d\'Hospitalisation (CRH)',
    badge: 'CRH / Sortie',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Building2,
    prefix: 'CRH-CHREIN',
    defaultTitle: 'Compte-Rendu d\'Hospitalisation & Résumé de Sortie'
  },
  ORDONNANCE: {
    label: 'Ordonnance Médicale Sécurisée',
    badge: 'Ordonnance',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: Pill,
    prefix: 'ORD-CHREIN',
    defaultTitle: 'Ordonnance Médicale Hospitalière Sécurisée'
  },
  CERTIFICAT: {
    label: 'Certificat Médical & Repos PNT',
    badge: 'Certificat',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: FileCheck,
    prefix: 'CERT-CHREIN',
    defaultTitle: 'Certificat Médical Hospitalier de Repos & PNT'
  },
  DEMANDE_EXAMENS: {
    label: 'Demande d\'Examens & Plateau Technique',
    badge: 'Examens',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Stethoscope,
    prefix: 'DEM-CHREIN',
    defaultTitle: 'Demande d\'Explorations Paracliniques & Imagerie'
  },
  FICHE_LIAISON: {
    label: 'Fiche de Liaison & Contre-Référence',
    badge: 'Liaison',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: HeartPulse,
    prefix: 'LIAIS-CHREIN',
    defaultTitle: 'Fiche de Liaison Médicale & Contre-Référence Régionale'
  },
  EVACUATION: {
    label: 'Fiche d\'Évacuation Sanitaire Inter-Hospitalière',
    badge: 'Évacuation',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: Ambulance,
    prefix: 'EVAC-CHREIN',
    defaultTitle: 'Fiche d\'Évacuation Sanitaire Médicalisée (SAMU / CHU)'
  }
};

// Document Templates for Quick 1-Click Clinical Insertion
const CLINICAL_DOCUMENT_TEMPLATES = [
  {
    id: 'tmpl-crh-tb',
    type: 'CRH' as MedicalDocumentType,
    name: 'CRH Tuberculose Pulmonaire (PNT)',
    title: 'Compte-Rendu d\'Hospitalisation — Tuberculose Pulmonaire Bacillifère (PNT)',
    content: `MOTIF D'ADMISSION :
Toux fébrile subaiguë évoluant depuis plus de 3 semaines, avec crachats mucopurulents hémoptoïques, sueurs nocturnes profuses et amaigrissement chiffré à 5 kg chez un patient avec contage tuberculeux intrafamilial.

BILAN INITIAL & EXPLORATIONS :
- GeneXpert MTB/RIF Ultra (crachats) : Détection abondante d'ADN de Mycobacterium tuberculosis. Absence de résistance à la Rifampicine (souche sensible).
- Téléthorax de face : Opacité excavée apicale droite avec nodules confluents péri-lésionnels.
- Biologie pré-thérapeutique : NFS (Hb 11.5 g/dL, GB 9 800/mm3), CRP 64 mg/L, transaminases ALAT/ASAT et créatinine normales.

TRAITEMENT REÇU EN HOSPITALISATION :
Initiation de la quadrithérapie fixe selon directives du PNT Sénégal : 2RHZE (4 comprimés le matin à jeun) associé à la Pyridoxine (Vitamine B6) 50 mg/j.

ÉVOLUTION CLINIQUE :
Apyrexie durable obtenue à J+3, disparition des hémoptysies, nette reprise d'appétit (+2 kg). Excellente tolérance digestive et absence d'ictère ou d'élévation des enzymes hépatiques.

CONDUITE ET TRAITEMENT DE SORTIE :
1. Poursuite du schéma 2RHZE (4 comprimés/jour en prise matinale unique à jeun) pendant 60 jours.
2. Vitamine B6 50 mg : 1 comprimé par jour.
3. Repos complet à domicile pendant 30 jours (certificat délivré).
4. Prise en charge à 100% gratuite dans le cadre du PNT.
5. Rendez-vous de contrôle bactériologique des crachats à M2 au CHREIN Kaolack.`,
    diagnosesCim11: ['1B10.0 - Tuberculose de l\'appareil respiratoire, confirmée par bactériologie'],
    medicationsPrescribed: '2RHZE (R150/H75/Z400/E275) : 4 cp/j le matin + Vitamine B6 50 mg : 1 cp/j',
    restDurationDays: 30
  },
  {
    id: 'tmpl-ordo-bpco',
    type: 'ORDONNANCE' as MedicalDocumentType,
    name: 'Ordonnance Exacerbation BPCO (Trithérapie)',
    title: 'Ordonnance Médicale Sécurisée — Exacerbation Aiguë BPCO & Antibiothérapie',
    content: `1. Trimbow 87/5/9 µg (Béclométasone / Formotérol / Glycopyrronium) :
   2 inhalations matin et 2 inhalations soir au moyen d'une chambre d'inhalation. Se rincer la bouche à l'eau après inhalation.
   QSP 3 mois renouvelable.

2. Salbutamol 100 µg (Ventoline) flacon aérosol :
   1 à 2 bouffées toutes les 4 heures en cas de dyspnée aiguë ou sifflements (max 8 bouffées/j).

3. Amoxicilline + Acide Clavulanique 1g (Augmentin) :
   1 comprimé matin et soir au cours des repas pendant 7 jours.

4. Prednisolone 20 mg :
   2 comprimés le matin (40 mg/jour) pendant 5 jours (cure courte sans sevrage progressif).

5. Consignes et sécurité :
   - Arrêt impératif et définitif du tabagisme.
   - Consulter en urgence au CHREIN si fièvre > 38.5°C ou cyanose des lèvres.`,
    diagnosesCim11: ['CA22.0 - Bronchopneumopathie chronique obstructive avec exacerbation aiguë'],
    medicationsPrescribed: 'Trimbow, Salbutamol 100µg, Amox/Clav 1g, Prednisolone 20mg',
    costFcfa: 42000
  },
  {
    id: 'tmpl-cert-repos',
    type: 'CERTIFICAT' as MedicalDocumentType,
    name: 'Certificat Repos Médical (Pneumopathie / Asthme)',
    title: 'Certificat Médical Hospitalier de Repos & Inaptitude Temporaire',
    content: `Je soussigné, Dr. Cheikh Ndao, Médecin Spécialiste au Service de Pneumologie et Maladies Infectieuses du Centre Hospitalier Régional El Hadji Ibrahima Niass (CHREIN) de Kaolack, certifie avoir examiné ce jour le patient susmentionné.

L'état de santé du patient nécessite un arrêt complet de travail et un repos strict à domicile pour une durée de 15 (quinze) jours, sauf complication.

Certificat délivré en main propre à l'intéressé(e) pour faire valoir ce que de droit.`,
    restDurationDays: 15
  },
  {
    id: 'tmpl-liais-nioro',
    type: 'FICHE_LIAISON' as MedicalDocumentType,
    name: 'Fiche de Liaison District Sanitaire (Contre-Référence)',
    title: 'Fiche de Liaison Médicale & Contre-Référence vers le District',
    content: `À l'attention du Médecin-Chef du Centre de Santé :

Cher(e) Confrère,

Nous vous réadressons ce jour le patient susnommé après prise en charge spécialisée et stabilisation complète dans notre service de pneumologie du CHREIN Kaolack.

ÉLÉMENTS CLINIQUES MARQUANTS DU SÉJOUR :
- Stabilisation de la fonction ventilatoire et sevrage réussi de l'oxygénothérapie.
- Traitement de fond optimisé et bien toléré.

CONDUITE RECOMMANDÉE POUR LE SUIVI AU POSTE / CENTRE DE SANTÉ :
- Surveillance régulière de la SpO2 en consultation de proximité.
- Vérification de la bonne observance du traitement prescrit.
- En cas de signes de décompensation ou d'aggravation, réadresser au Service de Pneumologie du CHREIN.`,
    destinationHospital: 'Centre de Santé de District'
  },
  {
    id: 'tmpl-evac-dakar',
    type: 'EVACUATION' as MedicalDocumentType,
    name: 'Évacuation Sanitaire Réanimation CHU Fann',
    title: 'Fiche d\'Évacuation Sanitaire Inter-Hospitalière — Réanimation Respiratoire CHU',
    content: `STRUCTURE ÉMETTRICE : CHREIN Kaolack — Service de Pneumologie et Soins Continus
STRUCTURE DESTINATAIRE : CHU de Fann (Dakar) — Service de Réanimation Médicale Respiratoire

DONNÉES CLINIQUES & PARAMÈTRES VITAUX AU DÉPART :
- Fréquence respiratoire > 32/min, tirage et mise en jeu des muscles respiratoires accessoires.
- SpO2 sous O2 à fort débit (15 L/min au masque à haute concentration) : hypoxémie persistante.
- Gazométrie : Acidose respiratoire aiguë non compensée / syndrome de détresse respiratoire aiguë.

MOTIF DU TRANSFERT :
Nécessité impérative d'une assistance ventilatoire invasive et d'une réanimation spécialisée dépassant les capacités du plateau technique local.

CONDITIONNEMENT ET ACCOMPAGNEMENT :
Transfert médicalisé par Ambulance SAMU équipée, avec médecin urgentiste et oxygène continu.`,
    destinationHospital: 'CHU de Fann (Dakar) - Réanimation Respiratoire'
  }
];

export const MedicalDocuments: React.FC = () => {
  const {
    medicalDocuments,
    saveMedicalDocument,
    deleteMedicalDocument,
    patients,
    currentUser,
    currentCenter
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>('ALL');

  // Preview & Print Modal
  const [activePreviewDoc, setActivePreviewDoc] = useState<MedicalDocumentRecord | null>(null);

  // New / Edit Document Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  // Form State
  const [formPatientId, setFormPatientId] = useState<string>(patients[0]?.id || '');
  const [formType, setFormType] = useState<MedicalDocumentType>('CRH');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formDiagnosesCim, setFormDiagnosesCim] = useState<string>('');
  const [formMedications, setFormMedications] = useState<string>('');
  const [formRestDays, setFormRestDays] = useState<number>(15);
  const [formCostFcfa, setFormCostFcfa] = useState<number>(0);
  const [formDestination, setFormDestination] = useState<string>('');
  const [formAdmissionDate, setFormAdmissionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formDischargeDate, setFormDischargeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<MedicalDocumentStatus>('SIGNE_VALIDE');
  const [formNotes, setFormNotes] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return medicalDocuments.filter(doc => {
      const matchesSearch = 
        doc.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedTypeFilter === 'ALL' || doc.type === selectedTypeFilter;
      const matchesStatus = selectedStatusFilter === 'ALL' || doc.status === selectedStatusFilter;
      const matchesPatient = selectedPatientFilter === 'ALL' || doc.patientId === selectedPatientFilter;

      return matchesSearch && matchesType && matchesStatus && matchesPatient;
    });
  }, [medicalDocuments, searchQuery, selectedTypeFilter, selectedStatusFilter, selectedPatientFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = medicalDocuments.length;
    const crhCount = medicalDocuments.filter(d => d.type === 'CRH').length;
    const ordoCount = medicalDocuments.filter(d => d.type === 'ORDONNANCE').length;
    const certCount = medicalDocuments.filter(d => d.type === 'CERTIFICAT').length;
    const liaisonEvacCount = medicalDocuments.filter(d => d.type === 'FICHE_LIAISON' || d.type === 'EVACUATION').length;
    const signedCount = medicalDocuments.filter(d => d.status === 'SIGNE_VALIDE').length;
    return { total, crhCount, ordoCount, certCount, liaisonEvacCount, signedCount };
  }, [medicalDocuments]);

  // Open Editor for Creation
  const handleOpenCreateModal = (preselectedType?: MedicalDocumentType) => {
    const docType = preselectedType || 'CRH';
    const cfg = DOCUMENT_TYPES_CONFIG[docType];
    const initialPatient = patients[0];

    setEditingDocId(null);
    setFormPatientId(initialPatient?.id || '');
    setFormType(docType);
    setFormTitle(cfg.defaultTitle);
    setFormContent('');
    setFormDiagnosesCim('');
    setFormMedications('');
    setFormRestDays(15);
    setFormCostFcfa(0);
    setFormDestination('');
    setFormAdmissionDate(new Date().toISOString().split('T')[0]);
    setFormDischargeDate(new Date().toISOString().split('T')[0]);
    setFormStatus('SIGNE_VALIDE');
    setFormNotes('');
    setIsEditorOpen(true);
  };

  // Open Editor for Modification
  const handleOpenEditModal = (doc: MedicalDocumentRecord) => {
    setEditingDocId(doc.id);
    setFormPatientId(doc.patientId);
    setFormType(doc.type);
    setFormTitle(doc.title);
    setFormContent(doc.content);
    setFormDiagnosesCim((doc.metadata?.diagnosesCim11 || []).join(', '));
    setFormMedications(doc.metadata?.medicationsPrescribed || '');
    setFormRestDays(doc.metadata?.restDurationDays || 15);
    setFormCostFcfa(doc.metadata?.costFcfa || 0);
    setFormDestination(doc.metadata?.destinationHospital || '');
    setFormAdmissionDate(doc.metadata?.admissionDate || new Date().toISOString().split('T')[0]);
    setFormDischargeDate(doc.metadata?.dischargeDate || new Date().toISOString().split('T')[0]);
    setFormStatus(doc.status);
    setFormNotes(doc.notes || '');
    setIsEditorOpen(true);
  };

  // Apply Template
  const handleApplyTemplate = (templateId: string) => {
    const tmpl = CLINICAL_DOCUMENT_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return;

    setFormType(tmpl.type);
    setFormTitle(tmpl.title);
    setFormContent(tmpl.content);
    if (tmpl.diagnosesCim11) setFormDiagnosesCim(tmpl.diagnosesCim11.join(', '));
    if (tmpl.medicationsPrescribed) setFormMedications(tmpl.medicationsPrescribed);
    if (tmpl.restDurationDays) setFormRestDays(tmpl.restDurationDays);
    if (tmpl.costFcfa) setFormCostFcfa(tmpl.costFcfa);
    if (tmpl.destinationHospital) setFormDestination(tmpl.destinationHospital);

    showNotification(`Modèle « ${tmpl.name} » injecté avec succès !`, 'info');
  };

  // Save Document
  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === formPatientId) || patients[0];
    const cfg = DOCUMENT_TYPES_CONFIG[formType];

    const refNumber = editingDocId 
      ? (medicalDocuments.find(d => d.id === editingDocId)?.referenceNumber || `${cfg.prefix}-2026-${String(Date.now()).slice(-4)}`)
      : `${cfg.prefix}-2026-${String(Date.now()).slice(-4)}`;

    const isSigned = formStatus === 'SIGNE_VALIDE';

    const newDoc: MedicalDocumentRecord = {
      id: editingDocId || `doc-${Date.now()}`,
      referenceNumber: refNumber,
      centerId: currentCenter?.id || 'center-1',
      patientId: pat.id,
      patientName: `${pat.firstName} ${pat.lastName}`,
      patientHospitalNumber: pat.hospitalNumber || pat.code,
      patientAge: pat.age,
      patientGender: pat.gender,
      patientAddress: pat.address,
      patientPhone: pat.phone,
      type: formType,
      title: formTitle.trim() || cfg.defaultTitle,
      content: formContent.trim(),
      metadata: {
        admissionDate: formAdmissionDate,
        dischargeDate: formDischargeDate,
        diagnosesCim11: formDiagnosesCim ? formDiagnosesCim.split(',').map(s => s.trim()) : undefined,
        medicationsPrescribed: formMedications || undefined,
        restDurationDays: formType === 'CERTIFICAT' ? formRestDays : undefined,
        costFcfa: formType === 'ORDONNANCE' && formCostFcfa > 0 ? formCostFcfa : undefined,
        destinationHospital: formDestination || undefined,
        attendingPhysician: currentUser?.name || 'Dr. Cheikh Ndao',
        qrCodeString: `${refNumber}-${pat.code}-PNEUMO-CHREIN`
      },
      status: formStatus,
      createdById: currentUser?.id || 'u1',
      createdByName: currentUser?.name || 'Dr. Cheikh Ndao',
      createdAt: new Date().toISOString(),
      signedById: isSigned ? (currentUser?.id || 'u1') : undefined,
      signedByName: isSigned ? (currentUser?.name || 'Dr. Cheikh Ndao') : undefined,
      signedAt: isSigned ? new Date().toISOString() : undefined,
      notes: formNotes
    };

    saveMedicalDocument(newDoc);
    setIsEditorOpen(false);
    showNotification(
      editingDocId ? 'Document médical mis à jour et réarchivé.' : 'Nouveau document médical créé et signé avec succès.',
      'success'
    );
  };

  // Delete Document
  const handleDeleteDocument = (id: string, ref: string) => {
    if (confirm(`Confirmez-vous la suppression du document ${ref} du dossier hospitalier ?`)) {
      deleteMedicalDocument(id);
      showNotification(`Document ${ref} supprimé de l'archive.`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Clinical Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                Documents Médicaux & Certificats Officiels
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100/70 text-teal-800 border border-teal-200">
                CHREIN Kaolack
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Section 10 du Cahier des Charges • CRH, Ordonnances sécurisées (FCFA), Certificats PNT, Fiches de liaison & Évacuation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Document Médical</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold animate-fade-in ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs'
            : 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Key Metric Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-3xs uppercase font-extrabold tracking-wider text-slate-400 block">Total Archivé</span>
          <span className="text-xl font-black text-slate-900">{stats.total}</span>
          <span className="text-4xs text-teal-700 font-semibold block mt-0.5">Documents traçables</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-xs">
          <span className="text-3xs uppercase font-extrabold tracking-wider text-blue-600 block">Comptes-Rendus</span>
          <span className="text-xl font-black text-blue-900">{stats.crhCount}</span>
          <span className="text-4xs text-blue-700 font-semibold block mt-0.5">CRH & Résumés sortie</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-teal-200 shadow-xs">
          <span className="text-3xs uppercase font-extrabold tracking-wider text-teal-600 block">Ordonnances</span>
          <span className="text-xl font-black text-teal-900">{stats.ordoCount}</span>
          <span className="text-4xs text-teal-700 font-semibold block mt-0.5">Sécurisées en FCFA</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-3xs uppercase font-extrabold tracking-wider text-emerald-600 block">Certificats</span>
          <span className="text-xl font-black text-emerald-900">{stats.certCount}</span>
          <span className="text-4xs text-emerald-700 font-semibold block mt-0.5">PNT & Repos médical</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-xs">
          <span className="text-3xs uppercase font-extrabold tracking-wider text-rose-600 block">Évacuations/Liaison</span>
          <span className="text-xl font-black text-rose-900">{stats.liaisonEvacCount}</span>
          <span className="text-4xs text-rose-700 font-semibold block mt-0.5">Régionale & CHU</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-3xs uppercase font-extrabold tracking-wider text-emerald-600 block">Signés & Validés</span>
          <span className="text-xl font-black text-emerald-800">{stats.signedCount}</span>
          <span className="text-4xs text-slate-500 font-semibold block mt-0.5">Avec cachet & QR</span>
        </div>
      </div>

      {/* Quick Archetype Action Buttons */}
      <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xxs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Création Rapide par Catégorie Réglementaire :</span>
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(DOCUMENT_TYPES_CONFIG) as MedicalDocumentType[]).map(typeKey => {
            const cfg = DOCUMENT_TYPES_CONFIG[typeKey];
            const Icon = cfg.icon;
            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => handleOpenCreateModal(typeKey)}
                className={`text-xxs font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 bg-white hover:bg-slate-100 ${cfg.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>+ {cfg.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par référence, patient, diagnostic, texte..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/60"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 cursor-pointer"
          >
            <option value="ALL">Tous les types</option>
            <option value="CRH">Comptes-Rendus (CRH)</option>
            <option value="ORDONNANCE">Ordonnances Médicales</option>
            <option value="CERTIFICAT">Certificats & Repos</option>
            <option value="DEMANDE_EXAMENS">Demandes d'Examens</option>
            <option value="FICHE_LIAISON">Fiches de Liaison</option>
            <option value="EVACUATION">Évacuations Sanitaires</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="SIGNE_VALIDE">Signé & Validé</option>
            <option value="BROUILLON">Brouillon</option>
            <option value="DELIVRE">Délivré au patient</option>
          </select>

          {/* Patient Filter */}
          <select
            value={selectedPatientFilter}
            onChange={(e) => setSelectedPatientFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 cursor-pointer max-w-[160px] truncate"
          >
            <option value="ALL">Tous les patients</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid / List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Aucun document médical trouvé</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Aucun document ne correspond aux filtres sélectionnés. Cliquez sur « Nouveau Document Médical » pour générer un compte-rendu, une ordonnance ou un certificat.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(doc => {
            const cfg = DOCUMENT_TYPES_CONFIG[doc.type] || DOCUMENT_TYPES_CONFIG.CRH;
            const Icon = cfg.icon;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-3xs uppercase font-extrabold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      <span>{cfg.badge}</span>
                    </span>

                    <span className={`text-4xs font-bold px-2 py-0.5 rounded-full ${
                      doc.status === 'SIGNE_VALIDE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : doc.status === 'DELIVRE'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.status === 'SIGNE_VALIDE' ? '✓ Signé & Validé' : doc.status === 'DELIVRE' ? 'Délivré' : 'Brouillon'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                      {doc.title}
                    </h3>
                    <span className="font-mono text-3xs text-slate-400 block mt-0.5">
                      Réf: {doc.referenceNumber}
                    </span>
                  </div>
                </div>

                {/* Patient & Content Preview */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-xxs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <strong className="text-slate-800">{doc.patientName}</strong> ({doc.patientAge} ans)
                    </span>
                    <span className="text-slate-400 font-mono">{doc.patientHospitalNumber}</span>
                  </div>

                  <p className="text-3xs text-slate-600 line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-sans">
                    {doc.content}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {doc.metadata?.costFcfa && (
                      <span className="text-3xs font-mono font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                        {doc.metadata.costFcfa.toLocaleString()} FCFA
                      </span>
                    )}
                    {doc.metadata?.restDurationDays && (
                      <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Repos {doc.metadata.restDurationDays} jours
                      </span>
                    )}
                    {doc.metadata?.destinationHospital && (
                      <span className="text-3xs font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 truncate max-w-[170px]">
                        → {doc.metadata.destinationHospital}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-3xs text-slate-400 font-medium">
                    <span>{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                    {doc.signedByName && <span className="block text-slate-500 font-semibold">{doc.signedByName}</span>}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActivePreviewDoc(doc);
                        setTimeout(() => window.print(), 350);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xxs font-bold transition cursor-pointer"
                      title="Imprimer directement au format A4"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-600" />
                      <span className="hidden sm:inline">Imprimer A4</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewDoc(doc)}
                      className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-bold transition cursor-pointer"
                      title="Aperçu officiel CHREIN"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(doc)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id, doc.referenceNumber)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULLSCREEN OFFICIAL PREVIEW & PRINT MODAL */}
      {activePreviewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs print-modal-overlay print-modal-active">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto space-y-4 border border-slate-200 shadow-2xl p-6 print-modal-content">
            {/* Modal Control Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wide text-slate-800">
                    Aperçu Officiel & Impression Sécurisée CHREIN
                  </h3>
                  <span className="text-3xs text-slate-400 font-mono">
                    Format A4 • Réf: {activePreviewDoc.referenceNumber}
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
                  <span>Imprimer le Document A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewDoc(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Printable Document Paper Format (Standard A4 Portrait) */}
            <div className="a4-document-sheet p-8 bg-white border border-slate-300 rounded-xl space-y-5 text-slate-900 font-sans shadow-xs">
              {/* National Emblem & Hospital Header Bar */}
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
                  {DOCUMENT_TYPES_CONFIG[activePreviewDoc.type]?.label || activePreviewDoc.title}
                </span>
                <span className="text-xxs font-mono font-bold text-teal-800">
                  N° D'ORDRE : {activePreviewDoc.referenceNumber}
                </span>
              </div>

              {/* Patient Demographics Box */}
              {(() => {
                const docPatient = patients.find(p => p.id === activePreviewDoc.patientId || p.code === activePreviewDoc.patientHospitalNumber);
                return (
                  <div className="avoid-page-break grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs">
                    <div className="space-y-1">
                      <p><span className="text-slate-500 font-medium">Nom & Prénom :</span> <strong className="text-slate-950 font-bold uppercase">{docPatient ? `${docPatient.lastName} ${docPatient.firstName}` : activePreviewDoc.patientName}</strong></p>
                      <p><span className="text-slate-500 font-medium">N° Hospitalier / IP :</span> <strong className="font-mono text-teal-800 font-bold">{docPatient?.code || activePreviewDoc.patientHospitalNumber}</strong> {docPatient?.hospitalNumber && <span className="font-mono text-slate-500">({docPatient.hospitalNumber})</span>}</p>
                      <p><span className="text-slate-500 font-medium">Date Naiss. / Âge :</span> <strong>{docPatient?.birthDate ? `${new Date(docPatient.birthDate).toLocaleDateString('fr-FR')} (${activePreviewDoc.patientAge} ans)` : `${activePreviewDoc.patientAge} ans`} ({activePreviewDoc.patientGender === 'M' ? 'Masculin' : 'Féminin'})</strong></p>
                      <p><span className="text-slate-500 font-medium">Domicile :</span> <span>{docPatient?.district ? `${docPatient.district}, Kaolack` : activePreviewDoc.patientAddress || 'Kaolack, Sénégal'}</span></p>
                      <p><span className="text-slate-500 font-medium">Téléphone :</span> <span className="font-mono">{docPatient?.phone || 'Non renseigné'}</span></p>
                      {docPatient?.bloodGroup && (
                        <p><span className="text-slate-500 font-medium">Groupe Sanguin :</span> <strong className="font-mono text-rose-700">{docPatient.bloodGroup}</strong></p>
                      )}
                      {docPatient?.allergies && (
                        <p><span className="text-slate-500 font-medium">Allergies connues :</span> <strong className="text-amber-800">{docPatient.allergies}</strong></p>
                      )}
                    </div>
                    <div className="space-y-1 text-right sm:text-left">
                      <p><span className="text-slate-500 font-medium">Date d'émission :</span> <strong>{new Date(activePreviewDoc.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></p>
                      <p><span className="text-slate-500 font-medium">Praticien :</span> <strong>{activePreviewDoc.signedByName || activePreviewDoc.createdByName}</strong></p>
                      <p><span className="text-slate-500 font-medium">Titre :</span> <span>Médecin Spécialiste Pneumologue</span></p>
                      <p><span className="text-slate-500 font-medium">N° Inscription Ordre (CNOM) :</span> <span className="font-mono text-slate-700">SN-1428</span></p>
                      <p><span className="text-slate-500 font-medium">Spécialité :</span> <strong>Pneumologie & Maladies Infectieuses</strong></p>
                      <p><span className="text-slate-500 font-medium">Structure :</span> <span>CHREIN Kaolack</span></p>
                      {activePreviewDoc.metadata?.costFcfa && (
                        <p><span className="text-slate-500 font-medium">Montant estimé :</span> <strong className="text-teal-700 font-mono">{activePreviewDoc.metadata.costFcfa.toLocaleString()} FCFA</strong></p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Diagnostics CIM-11 if any */}
              {activePreviewDoc.metadata?.diagnosesCim11 && activePreviewDoc.metadata.diagnosesCim11.length > 0 && (
                <div className="avoid-page-break p-3 bg-teal-50/50 rounded-xl border border-teal-100 text-xs">
                  <span className="text-3xs uppercase font-extrabold text-teal-900 block mb-1">
                    Diagnostic(s) Retenu(s) Codifié(s) CIM-11 :
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-800 font-semibold">
                    {activePreviewDoc.metadata.diagnosesCim11.map((diag, i) => (
                      <li key={i}>{diag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Main Document Body */}
              <div className="p-6 bg-white border border-slate-300 rounded-xl text-xs leading-relaxed font-sans text-slate-900 whitespace-pre-line break-words shadow-2xs">
                {activePreviewDoc.content}
              </div>

              {/* Specific Metadata Highlights */}
              {activePreviewDoc.metadata?.medicationsPrescribed && (
                <div className="avoid-page-break p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-1">
                  <span className="text-3xs uppercase font-extrabold text-teal-900 block">
                    Prescriptions Détaillées / Posologie :
                  </span>
                  <p className="font-sans text-xs font-medium whitespace-pre-line text-slate-950 leading-relaxed">
                    {activePreviewDoc.metadata.medicationsPrescribed}
                  </p>
                </div>
              )}

              {/* Official Seal, Timestamp & QR Code Footer */}
              <div className="avoid-page-break pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 border-2 border-slate-300 rounded-xl flex flex-col items-center justify-center p-1 bg-slate-50">
                    <QrCode className="w-8 h-8 text-slate-700" />
                    <span className="text-[7px] font-mono text-slate-400 mt-0.5 uppercase">CHREIN VÉRIF</span>
                  </div>
                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-800">Authentification Documentaire DPI CHREIN</p>
                    <p>Code QR : <span className="font-mono text-3xs">{activePreviewDoc.metadata?.qrCodeString || activePreviewDoc.referenceNumber}</span></p>
                    <p>Horodatage certifié : {new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' })}</p>
                  </div>
                </div>

                <div className="text-right space-y-1 min-w-[200px]">
                  <p className="text-xs font-bold text-slate-900">Le Médecin Spécialiste Traitant</p>
                  <p className="text-xs text-teal-700 font-extrabold">{activePreviewDoc.signedByName || activePreviewDoc.createdByName}</p>
                  <div className="inline-block w-44 h-18 border-2 border-dashed border-teal-300 bg-teal-50/40 rounded-xl p-1.5 text-center text-[9px] text-teal-800 font-semibold">
                    <span className="block font-bold">Cachet Officiel CHREIN</span>
                    <span className="block text-teal-600">Pneumologie & Infectiologie</span>
                    <span className="block text-slate-500 text-[8px] mt-0.5">Signé électroniquement ✓</span>
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

            {/* Bottom Actions */}
            <div className="flex justify-end gap-2 pt-2 no-print">
              <button
                type="button"
                onClick={() => setActivePreviewDoc(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW / EDIT DOCUMENT MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto space-y-4 border border-slate-200 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-black uppercase text-slate-800">
                  {editingDocId ? 'Modifier le Document Médical' : 'Générer un Document Médical Officiel CHREIN'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1-Click Quick Template Loader */}
            <div className="p-3 bg-gradient-to-r from-teal-50 via-slate-50 to-blue-50 rounded-xl border border-teal-200 space-y-2">
              <span className="text-xxs font-black uppercase text-teal-900 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Modèles Cliniques Prédéfinis (1 clic pour pré-remplir) :</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {CLINICAL_DOCUMENT_TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl.id)}
                    className="text-3xs font-bold px-2.5 py-1 rounded-lg bg-white hover:bg-teal-100 text-teal-800 border border-teal-200 transition cursor-pointer shadow-2xs"
                  >
                    ⚡ {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4 text-xs">
              {/* Row 1: Patient & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">
                    Patient (Dossier IP) *
                  </label>
                  <select
                    value={formPatientId}
                    onChange={(e) => setFormPatientId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-bold text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.code} • {p.age} ans)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">
                    Type de Document Officiel *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const newType = e.target.value as MedicalDocumentType;
                      setFormType(newType);
                      setFormTitle(DOCUMENT_TYPES_CONFIG[newType]?.defaultTitle || '');
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-bold text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="CRH">Compte-Rendu d'Hospitalisation (CRH)</option>
                    <option value="ORDONNANCE">Ordonnance Médicale Sécurisée (FCFA)</option>
                    <option value="CERTIFICAT">Certificat Médical / Repos PNT</option>
                    <option value="DEMANDE_EXAMENS">Demande d'Examens & Plateau Technique</option>
                    <option value="FICHE_LIAISON">Fiche de Liaison & Contre-Référence</option>
                    <option value="EVACUATION">Fiche d'Évacuation Sanitaire (SAMU / CHU)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xxs font-bold text-slate-700 uppercase">
                    Intitulé du Document *
                  </label>
                  <VoiceDictationButton
                    value={formTitle}
                    onTranscript={(val) => setFormTitle(val)}
                    fieldName="Intitulé du document"
                    buttonText="Dicter le titre"
                    size="xs"
                    appendMode={false}
                  />
                </div>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                  placeholder="Ex: Compte-Rendu d'Hospitalisation — Tuberculose Pulmonaire"
                />
              </div>

              {/* Row 3: Content Body with Voice Dictation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label className="block text-xxs font-black text-slate-800 uppercase tracking-wide">
                      Corps du Document Médical (Texte structuré) *
                    </label>
                    <span className="text-[10px] text-teal-700 font-bold bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                      Dictée vocale active
                    </span>
                  </div>
                  <VoiceDictationButton
                    value={formContent}
                    onTranscript={(val) => setFormContent(val)}
                    fieldName="Corps du document médical"
                    buttonText="Commande vocale / Dicter le texte"
                    size="xs"
                    appendMode={true}
                  />
                </div>
                <textarea
                  rows={9}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl font-mono text-xs leading-relaxed focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                  placeholder="Rédigez ou dictez ici le contenu officiel du document (motif, anamnèse, bilan, évolution, traitement, consignes). Vous pouvez dire : « à la ligne », « point », « virgule », « deux points »..."
                />
              </div>

              {/* Row 4: Diagnostics CIM-11 & Prescriptions (with Voice Dictation) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-teal-50/40 rounded-xl border border-teal-200/70">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-3xs font-black text-teal-900 uppercase">
                      Diagnostic(s) Retenu(s) CIM-11
                    </label>
                    <VoiceDictationButton
                      value={formDiagnosesCim}
                      onTranscript={(val) => setFormDiagnosesCim(val)}
                      fieldName="Diagnostics CIM-11"
                      buttonText="Dicter diagnostics"
                      size="xs"
                      appendMode={true}
                    />
                  </div>
                  <input
                    type="text"
                    value={formDiagnosesCim}
                    onChange={(e) => setFormDiagnosesCim(e.target.value)}
                    className="w-full p-2 border border-teal-200 rounded-lg text-xs bg-white font-medium"
                    placeholder="Ex: 1B10.0 Tuberculose respiratoire confirmée, CA22.0 BPCO"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-3xs font-black text-teal-900 uppercase">
                      Prescriptions Détaillées / Posologie
                    </label>
                    <VoiceDictationButton
                      value={formMedications}
                      onTranscript={(val) => setFormMedications(val)}
                      fieldName="Prescriptions et posologie"
                      buttonText="Dicter ordonnance"
                      size="xs"
                      appendMode={true}
                    />
                  </div>
                  <input
                    type="text"
                    value={formMedications}
                    onChange={(e) => setFormMedications(e.target.value)}
                    className="w-full p-2 border border-teal-200 rounded-lg text-xs bg-white font-mono"
                    placeholder="Ex: 2RHZE 4 cp/j le matin pendant 60 jours..."
                  />
                </div>
              </div>

              {/* Conditional Row 5: Extra Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {formType === 'CRH' && (
                  <>
                    <div>
                      <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">Date d'admission</label>
                      <input
                        type="date"
                        value={formAdmissionDate}
                        onChange={(e) => setFormAdmissionDate(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">Date de sortie</label>
                      <input
                        type="date"
                        value={formDischargeDate}
                        onChange={(e) => setFormDischargeDate(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </>
                )}

                {formType === 'CERTIFICAT' && (
                  <div>
                    <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">Durée du Repos (Jours)</label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={formRestDays}
                      onChange={(e) => setFormRestDays(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                    />
                  </div>
                )}

                {formType === 'ORDONNANCE' && (
                  <div>
                    <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">Coût Estimé (FCFA)</label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={formCostFcfa}
                      onChange={(e) => setFormCostFcfa(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                      placeholder="Ex: 25000"
                    />
                  </div>
                )}

                {(formType === 'FICHE_LIAISON' || formType === 'EVACUATION') && (
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-3xs font-bold text-slate-500 uppercase">
                        Établissement / Service Destinataire
                      </label>
                      <VoiceDictationButton
                        value={formDestination}
                        onTranscript={(val) => setFormDestination(val)}
                        fieldName="Établissement destinataire"
                        buttonText="Dicter destinataire"
                        size="xs"
                        appendMode={false}
                      />
                    </div>
                    <input
                      type="text"
                      value={formDestination}
                      onChange={(e) => setFormDestination(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                      placeholder="Ex: CHU de Fann (Dakar) ou Centre de Santé de Nioro"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">Statut du Document</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as MedicalDocumentStatus)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-bold"
                  >
                    <option value="SIGNE_VALIDE">Signé & Validé (Cachet actif)</option>
                    <option value="BROUILLON">Brouillon de travail</option>
                    <option value="DELIVRE">Délivré au patient</option>
                  </select>
                </div>
              </div>

              {/* Row 6: Notes & Consignes particulières */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-3xs font-bold text-slate-600 uppercase">
                    Consignes & Notes Médicales Particulières (Optionnel)
                  </label>
                  <VoiceDictationButton
                    value={formNotes}
                    onTranscript={(val) => setFormNotes(val)}
                    fieldName="Consignes et notes du document"
                    buttonText="Dicter consignes"
                    size="xs"
                    appendMode={true}
                  />
                </div>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-sans"
                  placeholder="Ex: Prévoir transport allongé, surveillance de la glycémie, oxygène continu..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer & Archiver le Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalDocuments;
