import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Bed, Hospitalization as HospType, Patient, User, NurseVitalRecord } from '../types';
import {
  Bed as BedIcon,
  Plus,
  Search,
  Trash2,
  UserPlus,
  LogOut,
  Clipboard,
  FileText,
  Clock,
  Pill,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  User as UserIcon,
  Stethoscope,
  X,
  FileSignature,
  Activity,
  Printer,
  ShieldAlert,
  Wind,
  Thermometer,
  Gauge,
  HeartPulse,
  Eye,
  ArrowRight,
  ShieldCheck,
  Check,
  Phone,
  Droplet,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceDictationButton } from '../components/VoiceDictationButton';

export function Hospitalization() {
  const {
    beds,
    hospitalizations,
    patients,
    users,
    currentUser,
    currentCenter,
    addBed,
    updateBed,
    deleteBed,
    admitPatient,
    dischargePatient,
    updateHospitalization,
    deleteHospitalization,
    nurseVitalRecords,
    nurseTargetedTransmissions,
    medicalExplorations,
    addNurseVitalRecord
  } = useStore();

  // Search & Filter state
  const [activeTab, setActiveTab] = useState<'beds' | 'active' | 'archived'>('beds');
  const [bedFilterCategory, setBedFilterCategory] = useState<string>('all');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [voiceActionNotice, setVoiceActionNotice] = useState<string | null>(null);

  // Direct voice action listener
  useEffect(() => {
    const handleVoiceAction = (event: any) => {
      const detail = event?.detail;
      if (!detail) return;
      if (detail.actionType === 'ASSIGN_BED') {
        setActiveTab('beds');
        setVoiceActionNotice(`⚡ Lit attribué et validé directement par l'assistante vocale clinique.`);
        setTimeout(() => setVoiceActionNotice(null), 6000);
      }
    };
    window.addEventListener('clinical-voice-action', handleVoiceAction);
    return () => window.removeEventListener('clinical-voice-action', handleVoiceAction);
  }, []);

  // Dialog/Modal overlay states
  const [isAddBedModalOpen, setIsAddBedModalOpen] = useState(false);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [selectedBedIdForDirectEntry, setSelectedBedIdForDirectEntry] = useState<string | null>(null);
  const [selectedHospForDetail, setSelectedHospForDetail] = useState<HospType | null>(null);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [showDischargeLetterModal, setShowDischargeLetterModal] = useState(false);

  // Form states - Add Bed
  const [newBedRoom, setNewBedRoom] = useState('');
  const [newBedCategory, setNewBedCategory] = useState('Pneumologie Générale');
  const [newBedEquipment, setNewBedEquipment] = useState('Prise Oxygène Murale');

  // Form states - Admission
  const [admitPatientId, setAdmitPatientId] = useState('');
  const [admitBedId, setAdmitBedId] = useState('');
  const [admitDoctorName, setAdmitDoctorName] = useState('');
  const [admitReason, setAdmitReason] = useState('');
  const [admitOxygenNeed, setAdmitOxygenNeed] = useState('Air ambiant');
  const [admitEstimatedDischarge, setAdmitEstimatedDischarge] = useState('');

  // Dropdown states for searchable patient selector inside admission
  const [patientDropdownSearchQuery, setPatientDropdownSearchQuery] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);

  // Form states - Clinical Discharge (Lettre de sortie)
  const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [dischargeMode, setDischargeMode] = useState<string>('Amélioration clinique (suivi ambulatoire)');
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState('');
  const [dischargeSummaryText, setDischargeSummaryText] = useState('');
  const [dischargeTreatments, setDischargeTreatments] = useState('');
  const [dischargeFollowUp, setDischargeFollowUp] = useState('');

  // Form states - Add Chronology/Medication notes
  const [newProgressNote, setNewProgressNote] = useState('');
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');

  // Patient Care Detail Drawer states
  const [drawerCareTab, setDrawerCareTab] = useState<'soins' | 'constantes' | 'traitements' | 'notes' | 'transmissions'>('soins');
  const [isAddingVital, setIsAddingVital] = useState(false);
  const [quickVitalBp, setQuickVitalBp] = useState('120/75');
  const [quickVitalPulse, setQuickVitalPulse] = useState(82);
  const [quickVitalRr, setQuickVitalRr] = useState(20);
  const [quickVitalSpo2, setQuickVitalSpo2] = useState(96);
  const [quickVitalTemp, setQuickVitalTemp] = useState(37.2);
  const [quickVitalO2Flow, setQuickVitalO2Flow] = useState(2);
  const [quickVitalO2Mode, setQuickVitalO2Mode] = useState('Lunettes nasales');
  const [quickVitalGlucose, setQuickVitalGlucose] = useState(1.05);
  const [quickVitalNotes, setQuickVitalNotes] = useState('');

  // Service departments according to CHREIN Service Pneumologie & Infectiologie
  const AVAILABLE_DEPARTMENTS = [
    'Isolement Tuberculose (TB)',
    'Soins Continus & VNI',
    'Pneumologie Générale',
    'Post-Aigus & Réhabilitation'
  ];

  const AVAILABLE_EQUIPMENTS = [
    'Prise Oxygène Murale',
    'Concentrateur O2 Dédié',
    'Chambre à Pression Négative (TB Contagieuse)',
    'Appareil VNI / BiPAP',
    'Moniteur Multiparamétrique ECG/SpO2',
    'Standard (Lit pneumo)'
  ];

  // Calculate stats
  const activeHospitalizationsCount = hospitalizations.filter(h => h.status === 'active').length;
  const occupiedBedsCount = beds.filter(b => b.status === 'occupied').length;
  const maintenanceBedsCount = beds.filter(b => b.status === 'maintenance').length;
  const availableBedsCount = beds.filter(b => b.status === 'available').length;
  const totalBedsCount = beds.length;

  const getDepartmentStats = (category: string) => {
    const deptBeds = beds.filter(b => b.serviceCategory === category);
    const occupiedCount = deptBeds.filter(b => b.status === 'occupied').length;
    return {
      total: deptBeds.length,
      occupied: occupiedCount,
      percentage: deptBeds.length > 0 ? Math.round((occupiedCount / deptBeds.length) * 100) : 0
    };
  };

  // Safe dates helper
  const getDaysDifference = (startStr: string, endStr: string) => {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  };

  // Event handlers
  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBedRoom || !newBedCategory) return;
    await addBed({
      roomNumber: `${newBedRoom} (${newBedEquipment})`,
      serviceCategory: newBedCategory,
      status: 'available',
      pricePerDay: 0
    });
    setNewBedRoom('');
    setIsAddBedModalOpen(false);
  };

  const handleOpenAdmitModal = (targetBedId?: string) => {
    if (targetBedId) {
      setAdmitBedId(targetBedId);
    } else {
      const firstAvail = beds.find(b => b.status === 'available');
      setAdmitBedId(firstAvail ? firstAvail.id : '');
    }
    setAdmitPatientId('');
    setPatientDropdownSearchQuery('');
    setIsPatientDropdownOpen(false);
    setAdmitDoctorName('');
    setAdmitReason('');
    setAdmitOxygenNeed('Air ambiant');
    setAdmitEstimatedDischarge('');
    setIsAdmitModalOpen(true);
  };

  const handleAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitPatientId || !admitBedId || !admitReason) {
      alert("Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    const patient = patients.find(p => p.id === admitPatientId);
    const bed = beds.find(b => b.id === admitBedId);
    if (!patient || !bed) return;

    // Doctor standard display
    const selectedDocName = admitDoctorName || currentUser?.name || 'Médecin de garde';

    await admitPatient({
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientGender: patient.gender as 'M' | 'F',
      patientAge: Number(patient.age) || 30,
      bedId: bed.id,
      roomNumber: bed.roomNumber,
      doctorName: selectedDocName,
      reason: `${admitReason} [Support resp: ${admitOxygenNeed}]`,
      estimatedDischargeDate: admitEstimatedDischarge || undefined,
      dailyNotes: [
        {
          date: new Date().toISOString().split('T')[0],
          note: `Admission en ${bed.serviceCategory} (${bed.roomNumber}). Motif : ${admitReason}. Oxygénothérapie initiale : ${admitOxygenNeed}.`,
          author: currentUser?.name || 'Praticien'
        }
      ],
      medications: []
    });

    setIsAdmitModalOpen(false);
    setActiveTab('active');
  };

  const handleAddProgressNote = async () => {
    if (!selectedHospForDetail || !newProgressNote.trim()) return;

    const currentNotes = selectedHospForDetail.dailyNotes || [];
    const updatedNotes = [
      ...currentNotes,
      {
        date: new Date().toISOString().split('T')[0],
        note: newProgressNote,
        author: currentUser?.name || 'Praticien'
      }
    ];

    await updateHospitalization(selectedHospForDetail.id, {
      dailyNotes: updatedNotes
    });

    setSelectedHospForDetail(prev => prev ? { ...prev, dailyNotes: updatedNotes } : null);
    setNewProgressNote('');
  };

  const handleAddMedication = async () => {
    if (!selectedHospForDetail || !newMedName.trim() || !newMedDosage.trim()) return;

    const currentMeds = selectedHospForDetail.medications || [];
    const updatedMeds = [
      ...currentMeds,
      {
        medicineName: newMedName,
        dosage: newMedDosage,
        frequency: newMedFreq || "1 fois par jour"
      }
    ];

    await updateHospitalization(selectedHospForDetail.id, {
      medications: updatedMeds
    });

    setSelectedHospForDetail(prev => prev ? { ...prev, medications: updatedMeds } : null);
    setNewMedName('');
    setNewMedDosage('');
    setNewMedFreq('');
  };

  const handleSaveQuickVital = () => {
    if (!selectedHospForDetail) return;
    const newVital: NurseVitalRecord = {
      id: 'vital-' + Date.now(),
      patientId: selectedHospForDetail.patientId,
      hospitalizationId: selectedHospForDetail.id,
      centerId: currentCenter?.id || 'center-1',
      timestamp: new Date().toISOString(),
      bp: quickVitalBp || '120/75',
      pulse: Number(quickVitalPulse) || 82,
      rr: Number(quickVitalRr) || 20,
      spo2: Number(quickVitalSpo2) || 96,
      temperature: Number(quickVitalTemp) || 37.2,
      bloodGlucose: Number(quickVitalGlucose) || 1.05,
      painEva: 1,
      consciousnessGlasgow: 15,
      nurseName: currentUser?.name || 'Infirmier de garde',
      notes: quickVitalNotes || `Surveillance régulière lit ${selectedHospForDetail.roomNumber}. Support O2 : ${quickVitalO2Mode} à ${quickVitalO2Flow} L/min.`
    };

    addNurseVitalRecord(newVital);
    setIsAddingVital(false);
    setQuickVitalNotes('');
    setVoiceActionNotice(`✓ Constantes enregistrées pour ${selectedHospForDetail.patientName} (SpO2 ${newVital.spo2}%, TA ${newVital.bp}, FR ${newVital.rr}/min)`);
    setTimeout(() => setVoiceActionNotice(null), 4000);
  };

  const handleOpenDischargeModal = (hosp: HospType) => {
    setSelectedHospForDetail(hosp);
    setDischargeDate(new Date().toISOString().split('T')[0]);
    setDischargeMode('Amélioration clinique (suivi ambulatoire)');
    setDischargeDiagnosis(hosp.reason || 'Affection respiratoire aiguë');
    setDischargeSummaryText(`Patient hospitalisé du ${hosp.admissionDate} au ${new Date().toISOString().split('T')[0]} pour ${hosp.reason}. Évolution favorable sous protocole thérapeutique. Constantes stabilisées, apyrexie, sevrage O2 réussi.`);
    const existingMeds = (hosp.medications || []).map(m => `${m.medicineName} ${m.dosage} (${m.frequency})`).join('\n');
    setDischargeTreatments(existingMeds || 'Traitement inhalé / antibiotique oral selon protocole');
    setDischargeFollowUp('Consultation de suivi pneumologique dans 15 jours au CHREIN. Radiographie pulmonaire de contrôle.');
    setIsDischargeModalOpen(true);
  };

  const handleCompleteDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospForDetail) return;

    const currentNotes = selectedHospForDetail.dailyNotes || [];
    const updatedNotes = [
      ...currentNotes,
      {
        date: dischargeDate,
        note: `[SORTIE MÉDICALE] Mode : ${dischargeMode}. Diagnostic final : ${dischargeDiagnosis}. Recommandations : ${dischargeFollowUp}. Traitement : ${dischargeTreatments}`,
        author: currentUser?.name || 'Praticien référent'
      }
    ];

    await updateHospitalization(selectedHospForDetail.id, {
      dailyNotes: updatedNotes
    });

    await dischargePatient(selectedHospForDetail.id, dischargeDate, 0);
    setIsDischargeModalOpen(false);
    setShowDischargeLetterModal(true);
  };

  const handleDeleteHospitalization = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cet enregistrement d'hospitalisation ? Cette action libérera également le lit lié.")) {
      await deleteHospitalization(id);
      setSelectedHospForDetail(null);
    }
  };

  // Filtering Bed lists based on Category
  const filteredBeds = beds.filter(b => {
    if (bedFilterCategory === 'all') return true;
    return b.serviceCategory.toLowerCase() === bedFilterCategory.toLowerCase();
  });

  // Searching Active & Archives Based on names
  const activeHospitalizationsFiltered = hospitalizations
    .filter(h => h.status === 'active')
    .filter(h => (h.patientName || '').toLowerCase().includes(patientSearchQuery.toLowerCase()));

  const archivedHospitalizationsFiltered = hospitalizations
    .filter(h => h.status === 'discharged')
    .filter(h => (h.patientName || '').toLowerCase().includes(patientSearchQuery.toLowerCase()));

  const selectedPatientForAdmission = patients.find(p => p.id === admitPatientId);
  const filteredDropdownPatients = patients.filter(p => {
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
    const query = patientDropdownSearchQuery.toLowerCase();
    return fullName.includes(query) || (p.code || '').toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm select-none">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center text-teal-650 border border-teal-100 shadow-inner">
              <BedIcon className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Gestion des Hospitalisations & Lits
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Planifiez la capacité d’accueil, suivez le statut d’occupation des chambres de l’établissement, et préparez les bilans cliniques de sortie.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-center">
          <button
            onClick={() => setIsAddBedModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            <span>Nouveau Lit</span>
          </button>
          <button
            onClick={() => handleOpenAdmitModal()}
            className="flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Admettre un Patient</span>
          </button>
        </div>
      </div>

      {/* Visual Activity Counters Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-xs space-y-1.5 select-none">
          <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest block">Patients Hospitalisés</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{activeHospitalizationsCount}</span>
            <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-1.5 py-0.5 rounded">En observation</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-xs space-y-1.5 select-none">
          <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest block">Taux d'occupation</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">
              {totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0}%
            </span>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
              {occupiedBedsCount} lits occupés
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-xs space-y-1.5 select-none">
          <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest block">Lits Libres</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-600">{availableBedsCount}</span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Immédiatement disponibles</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-xs space-y-1.5 select-none">
          <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest block">Lits en Maintenance</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{maintenanceBedsCount}</span>
            <span className="text-[10px] text-amber-500 font-bold bg-amber-50 px-1.5 py-0.5 rounded">Hors-service</span>
          </div>
        </div>
      </div>

      {/* Direct Voice Action Banner */}
      {voiceActionNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{voiceActionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setVoiceActionNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-slate-100 rounded-xl p-1 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('beds')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'beds'
                ? 'bg-white text-slate-850 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BedIcon className="w-4 h-4" />
            <span>Plan des Lits</span>
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white text-slate-850 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Suivi Actif ({activeHospitalizationsCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'archived'
                ? 'bg-white text-slate-850 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Archive des sorties</span>
          </button>
        </div>

        {/* Global Seachers and Categories filter controls */}
        <div className="w-full md:w-auto flex items-center gap-3">
          {activeTab === 'beds' ? (
            <div className="flex items-center gap-2 w-full md:w-auto bg-slate-150/40 p-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 pl-2 pr-1 select-none">SERVICE :</span>
              <select
                value={bedFilterCategory}
                onChange={(e) => setBedFilterCategory(e.target.value)}
                className="text-xs bg-white border border-slate-250/20 font-bold px-3 py-1 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="all">Tous les services</option>
                {AVAILABLE_DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="relative w-full md:w-64">
              <span className="absolute left-3.5 top-2.5 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher par nom de patient..."
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none placeholder:text-slate-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* Primary Tab Panel Layout */}
      <div>
        {activeTab === 'beds' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBeds.map((bed) => {
                const isOccupied = bed.status === 'occupied';
                const isMaintenance = bed.status === 'maintenance';
                const currentStay = isOccupied ? hospitalizations.find(h => h.bedId === bed.id && h.status === 'active') : null;
                const patient = currentStay ? patients.find(p => p.id === currentStay.patientId) : null;
                const stayDays = currentStay ? getDaysDifference(currentStay.admissionDate, new Date().toISOString().split('T')[0]) : 0;
                
                // Get patient vital signs
                const vitals = currentStay 
                  ? nurseVitalRecords.filter(v => v.patientId === currentStay.patientId || v.hospitalizationId === currentStay.id)
                  : [];
                const latestVital = vitals.length > 0 ? vitals[vitals.length - 1] : null;

                if (isOccupied && currentStay) {
                  return (
                    <div
                      key={bed.id}
                      onClick={() => setSelectedHospForDetail(currentStay)}
                      role="button"
                      tabIndex={0}
                      className="bg-gradient-to-b from-white via-white to-teal-50/20 border-2 border-teal-200/90 hover:border-teal-600 rounded-2xl p-4.5 shadow-xs hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer group flex flex-col justify-between space-y-3 relative overflow-hidden ring-0 hover:ring-4 hover:ring-teal-100/70"
                    >
                      {/* Top Bar with Room and Occupied status */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-widest block truncate max-w-[170px]">
                              {bed.serviceCategory}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 tracking-tight mt-0.5 flex items-center gap-1.5">
                              <span>Chambre {bed.roomNumber}</span>
                            </h4>
                          </div>

                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300 flex items-center gap-1 shadow-2xs shrink-0">
                            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                            <span>Occupé</span>
                          </span>
                        </div>

                        {/* Patient Identity & Duration */}
                        <div className="mt-3 p-3 bg-white/95 rounded-xl border border-teal-100/80 shadow-2xs space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {currentStay.patientName ? currentStay.patientName[0].toUpperCase() : 'P'}
                            </div>
                            <div className="truncate flex-1">
                              <h5 className="text-xs font-black text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                                {currentStay.patientName}
                              </h5>
                              <span className="text-[10px] text-slate-500 font-semibold block">
                                {currentStay.patientAge} ans • {currentStay.patientGender === 'M' ? 'Homme' : 'Femme'} • IP: {patient?.hospitalNumber || patient?.code || currentStay.patientId}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                            <span className="font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                              J+{stayDays} d'hospitalisation
                            </span>
                            <span>Entrée : {currentStay.admissionDate}</span>
                          </div>
                        </div>

                        {/* Reason / Motif preview */}
                        <div className="mt-2 text-[11px] text-slate-600 line-clamp-2 italic px-1" title={currentStay.reason}>
                          « {currentStay.reason} »
                        </div>

                        {/* Care Highlights & Vitals Preview */}
                        <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                          <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center gap-1.5 text-slate-700">
                            <Wind className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="truncate">O2: {latestVital?.o2FlowLiters ? `${latestVital.o2FlowLiters} L/min` : 'Air ambiant'}</span>
                          </div>
                          <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center gap-1.5 text-slate-700">
                            <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">SpO2: <strong className="text-slate-900">{latestVital?.spo2 || 96}%</strong></span>
                          </div>
                        </div>

                        {/* Meds & Doctor Tag */}
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 px-1">
                          <span className="flex items-center gap-1">
                            <Pill className="w-3 h-3 text-teal-600" />
                            <span>{(currentStay.medications || []).length} traitement(s) actif(s)</span>
                          </span>
                          <span className="truncate max-w-[120px] font-medium text-slate-600">
                            {currentStay.doctorName || 'Dr. Cheikh Ndao'}
                          </span>
                        </div>
                      </div>

                      {/* Click-to-view Action Banner */}
                      <div className="space-y-2 pt-2 border-t border-teal-100/60">
                        <div className="w-full py-2 px-3 bg-teal-600 group-hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-between shadow-xs">
                          <span className="flex items-center gap-1.5">
                            <Stethoscope className="w-4 h-4" />
                            <span>Voir les détails des soins du patient</span>
                          </span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>

                        {/* Secondary controls stopPropagation */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-between text-[10px]"
                        >
                          <select
                            value={bed.status}
                            onChange={(e) => updateBed(bed.id, { status: e.target.value as any })}
                            className="text-[9px] font-bold uppercase text-slate-500 bg-white border border-slate-200 py-1 px-1.5 rounded-lg focus:outline-none cursor-pointer"
                          >
                            <option value="occupied" disabled>Occupé</option>
                            <option value="available">Libérer lit</option>
                            <option value="maintenance">Maintenance</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleOpenDischargeModal(currentStay)}
                            className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                          >
                            Bilan de sortie
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isMaintenance) {
                  return (
                    <div
                      key={bed.id}
                      className="bg-amber-50/30 border-2 border-amber-200 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest block">
                              {bed.serviceCategory}
                            </span>
                            <h4 className="text-sm font-black text-slate-800 tracking-tight mt-0.5">
                              Chambre {bed.roomNumber}
                            </h4>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800">
                            En Maintenance
                          </span>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-white/80 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Désinfection terminale ou réparation en cours</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
                        <select
                          value={bed.status}
                          onChange={(e) => updateBed(bed.id, { status: e.target.value as any })}
                          className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 py-1 px-2 rounded-lg cursor-pointer"
                        >
                          <option value="maintenance">En Maintenance</option>
                          <option value="available">Remettre en service (Libre)</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Supprimer ce lit ?")) deleteBed(bed.id);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Supprimer ce lit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                }

                // Available bed
                return (
                  <div
                    key={bed.id}
                    onClick={() => handleOpenAdmitModal(bed.id)}
                    role="button"
                    tabIndex={0}
                    className="bg-white border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between space-y-3 group bg-gradient-to-b from-white to-slate-50/50 hover:to-teal-50/20"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                            {bed.serviceCategory}
                          </span>
                          <h4 className="text-sm font-black text-slate-800 tracking-tight mt-0.5">
                            Chambre {bed.roomNumber}
                          </h4>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                          Disponible
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 group-hover:bg-teal-50/60 rounded-xl border border-slate-100 group-hover:border-teal-200 transition-colors space-y-1">
                        <span className="text-[11px] font-bold text-slate-700 block">
                          Lit immédiatement disponible
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Prise O2 murale et aspiration testées et prêtes.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="w-full py-2 px-3 bg-slate-100 group-hover:bg-teal-600 text-slate-700 group-hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Admettre un patient</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>

                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-between text-[10px]"
                      >
                        <select
                          value={bed.status}
                          onChange={(e) => updateBed(bed.id, { status: e.target.value as any })}
                          className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 py-1 px-1.5 rounded-lg cursor-pointer"
                        >
                          <option value="available">Disponible</option>
                          <option value="maintenance">Mettre en maintenance</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Supprimer ce lit ?")) deleteBed(bed.id);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Supprimer ce lit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredBeds.length === 0 && (
                <div className="col-span-full bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-3 select-none">
                  <BedIcon className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-bold">Aucun lit enregistré dans ce service ou répondant aux filtres.</p>
                  <button
                    onClick={() => setIsAddBedModalOpen(true)}
                    className="text-teal-600 hover:underline text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    Créer un nouveau lit ?
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-850 select-none">Suivi Médical des Patients Hospitalisés</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold select-none">
                    <th className="py-3 px-4">Patient / Dossier</th>
                    <th className="py-3 px-4">Chambre & Lit</th>
                    <th className="py-3 px-4">Médecin Référent</th>
                    <th className="py-3 px-4">Date d'entrée</th>
                    <th className="py-3 px-4">Motif Principal</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeHospitalizationsFiltered.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${h.patientGender === 'M' ? 'bg-blue-400' : 'bg-rose-450'} text-[7px] text-white font-bold flex items-center justify-center shrink-0`}>
                            {h.patientGender}
                          </span>
                          <div>
                            <span className="font-bold text-slate-800 text-[13px]">{h.patientName}</span>
                            <span className="text-[10px] text-slate-400 block font-normal">{h.patientAge} ans</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-55 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold text-[11px] border border-indigo-100/50">
                          {h.roomNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-normal text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                          <span>{h.doctorName || 'Praticien'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {h.admissionDate}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 truncate max-w-[200px]" title={h.reason}>
                        {h.reason}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedHospForDetail(h)}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer"
                          >
                            Dossier clinique
                          </button>
                          <button
                            onClick={() => handleOpenDischargeModal(h)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Bilan de sortie</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {activeHospitalizationsFiltered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium select-none">
                        Aucun patient actuellement hospitalisé ne correspond à la recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'archived' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-850 select-none">Archive Historique des Hospitalisations</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold select-none">
                    <th className="py-3 px-4">Patient / Dossier</th>
                    <th className="py-3 px-4">Chambre libérée</th>
                    <th className="py-3 px-4">Date d'admission</th>
                    <th className="py-3 px-4">Date de sortie</th>
                    <th className="py-3 px-4">Durée séjour</th>
                    <th className="py-3 px-4">Mode de sortie</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {archivedHospitalizationsFiltered.map((h) => {
                    const days = getDaysDifference(h.admissionDate, h.actualDischargeDate || h.admissionDate);
                    return (
                      <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-850">
                          <div>
                            <span className="font-bold text-slate-800 text-[13px]">{h.patientName}</span>
                            <span className="text-[10px] text-slate-400 block font-normal">{h.patientAge} ans</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                            {h.roomNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-normal">
                          {h.admissionDate}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-normal">
                          {h.actualDischargeDate}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {days} {days > 1 ? 'jours' : 'jour'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-150">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Sortie validée
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedHospForDetail(h);
                                setShowDischargeLetterModal(true);
                              }}
                              className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 px-2.5 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer flex items-center gap-1"
                              title="Imprimer / Visualiser la lettre de sortie"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Lettre de sortie</span>
                            </button>
                            <button
                              onClick={() => setSelectedHospForDetail(h)}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer"
                            >
                              Dossier
                            </button>
                            <button
                              onClick={() => handleDeleteHospitalization(h.id)}
                              className="text-slate-350 hover:text-red-500 p-1 rounded-md transition-colors cursor-pointer"
                              title="Supprimer historique"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {archivedHospitalizationsFiltered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium select-none">
                        Aucune fiche d’archivage de sortie enregistrée dans l’établissement.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* OVERLAY DIALOGS & SLIDEOVERS */}

      {/* MODAL 1: ADD BED */}
      <AnimatePresence>
        {isAddBedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-150 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 select-none">
                <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                  <BedIcon className="w-4 h-4 text-teal-600" />
                  <span>Enregistrer un Nouveau Lit</span>
                </h3>
                <button
                  onClick={() => setIsAddBedModalOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateBed} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Numéro Lit / Chambre</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Chambre 204-B"
                    value={newBedRoom}
                    onChange={(e) => setNewBedRoom(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-bold">Unité Clinique Hospitalière</label>
                  <select
                    value={newBedCategory}
                    onChange={(e) => setNewBedCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-semibold text-slate-705"
                  >
                    {AVAILABLE_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-bold">Équipement / Support respiratoire</label>
                  <select
                    value={newBedEquipment}
                    onChange={(e) => setNewBedEquipment(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-medium text-slate-700"
                  >
                    {AVAILABLE_EQUIPMENTS.map(eq => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddBedModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Valider le Lit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADMIT PATIENT */}
      <AnimatePresence>
        {isAdmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-150 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 select-none">
                <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  <span>Formulaire d'Admission Patient</span>
                </h3>
                <button
                  onClick={() => setIsAdmitModalOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdmission} className="space-y-4">
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-bold">Patient à hospitaliser *</label>
                  
                  {selectedPatientForAdmission ? (
                    <div className="flex items-center justify-between p-3 bg-teal-50/50 border border-teal-200 rounded-xl animate-fade-in select-none">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center font-bold text-teal-800 text-xs">
                          {selectedPatientForAdmission.firstName?.[0] || ""}{selectedPatientForAdmission.lastName?.[0] || ""}
                        </div>
                        <div>
                          <span className="text-slate-800 font-extrabold text-xs block">
                            {selectedPatientForAdmission.firstName} {selectedPatientForAdmission.lastName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                            Code Patient : {selectedPatientForAdmission.code}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAdmitPatientId('');
                          setPatientDropdownSearchQuery('');
                          setIsPatientDropdownOpen(true);
                        }}
                        className="p-1 px-2.5 text-[10px] bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-600 font-bold transition-all shrink-0 cursor-pointer"
                      >
                        Changer
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Rechercher par prénom, nom ou code patient..."
                          value={patientDropdownSearchQuery}
                          onChange={(e) => {
                            setPatientDropdownSearchQuery(e.target.value);
                            setIsPatientDropdownOpen(true);
                          }}
                          onFocus={() => setIsPatientDropdownOpen(true)}
                          className="w-full text-xs px-3.5 py-2.5 pl-9 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-semibold text-slate-700 bg-slate-50/30"
                        />
                        <span className="absolute left-3.5 top-3.5 text-slate-400">
                          <Search className="w-3.5 h-3.5" />
                        </span>
                        {patientDropdownSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setPatientDropdownSearchQuery('')}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {isPatientDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsPatientDropdownOpen(false)} 
                          />
                          <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
                            {filteredDropdownPatients.length > 0 ? (
                              filteredDropdownPatients.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setAdmitPatientId(p.id);
                                    setIsPatientDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between"
                                >
                                  <div>
                                    <span className="text-slate-800 font-bold block text-xs">
                                      {p.firstName} {p.lastName}
                                    </span>
                                    <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                                      Code : {p.code}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-black text-teal-600 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg">
                                    Sélectionner
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="p-4 text-center text-xs text-slate-400">
                                Aucun patient trouvé pour "{patientDropdownSearchQuery}"
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-bold">Chambre & Lit d’accueil *</label>
                    <select
                      required
                      value={admitBedId}
                      onChange={(e) => setAdmitBedId(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-semibold text-slate-705"
                    >
                      <option value="">-- Choisissez un lit --</option>
                      {beds.map(b => (
                        <option
                          key={b.id}
                          value={b.id}
                          disabled={b.status !== 'available' && b.id !== admitBedId}
                        >
                          {b.roomNumber} ({b.serviceCategory}) {b.status !== 'available' ? '• Occupé' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-bold">Médecin responsable</label>
                    <input
                      type="text"
                      placeholder="laissez vide pour vous attribuer"
                      value={admitDoctorName}
                      onChange={(e) => setAdmitDoctorName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-bold">Support respiratoire requis à l'admission</label>
                  <select
                    value={admitOxygenNeed}
                    onChange={(e) => setAdmitOxygenNeed(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-medium text-slate-700"
                  >
                    <option value="Air ambiant">Air ambiant (SpO2 &gt; 94% sous AA)</option>
                    <option value="Oxygénothérapie Lunettes (1 à 4 L/min)">Oxygénothérapie Lunettes (1 à 4 L/min)</option>
                    <option value="Masque Haute Concentration (8 à 15 L/min)">Masque Haute Concentration (8 à 15 L/min)</option>
                    <option value="Ventilation Non Invasive (VNI BiPAP)">Ventilation Non Invasive (VNI BiPAP / CPAP)</option>
                    <option value="Oxygénothérapie Haut Débit (Optiflow)">Oxygénothérapie Haut Débit (Optiflow)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-bold">
                      Motif principal de l'hospitalisation *
                    </label>
                    <VoiceDictationButton
                      value={admitReason}
                      onTranscript={(val) => setAdmitReason(val)}
                      fieldName="Motif d'hospitalisation"
                      buttonText="Dicter"
                      size="xs"
                    />
                  </div>
                  <textarea
                    required
                    rows={2}
                    placeholder="Indiquez le diagnostic initial ou la surveillance clinique requise..."
                    value={admitReason}
                    onChange={(e) => setAdmitReason(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-bold">Date de sortie estimée (facultatif)</label>
                  <input
                    type="date"
                    value={admitEstimatedDischarge}
                    onChange={(e) => setAdmitEstimatedDischarge(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAdmitModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Enregistrer l'Admission
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: CLINICAL DISCHARGE & CRH */}
      <AnimatePresence>
        {isDischargeModalOpen && selectedHospForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-150 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 select-none">
                <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                  <FileSignature className="w-4 h-4 text-teal-600" />
                  <span>Validation Sortie & Compte-Rendu d'Hospitalisation</span>
                </h3>
                <button
                  onClick={() => setIsDischargeModalOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCompleteDischarge} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 select-none border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-800 text-xs">{selectedHospForDetail.patientName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Chambre : {selectedHospForDetail.roomNumber}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Entrée : <span className="font-bold text-slate-700">{selectedHospForDetail.admissionDate}</span></span>
                    <span>Durée séjour : <span className="font-black text-slate-800">{getDaysDifference(selectedHospForDetail.admissionDate, dischargeDate)} jour(s)</span></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Date effective de sortie *</label>
                    <input
                      type="date"
                      required
                      value={dischargeDate}
                      onChange={(e) => setDischargeDate(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-bold">Mode de sortie *</label>
                    <select
                      value={dischargeMode}
                      onChange={(e) => setDischargeMode(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-semibold text-slate-700"
                    >
                      <option value="Amélioration clinique (suivi ambulatoire)">Amélioration clinique (suivi ambulatoire)</option>
                      <option value="Guérison complète / Fin de phase intensive">Guérison complète / Fin de traitement</option>
                      <option value="Transfert en Réanimation / USI">Transfert en Réanimation / USI</option>
                      <option value="Transfert dans une autre structure">Transfert externe</option>
                      <option value="Sortie contre avis médical">Sortie contre avis médical</option>
                      <option value="Décès">Décès</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-bold">
                      Diagnostic principal de sortie (CIM-11) *
                    </label>
                    <VoiceDictationButton
                      value={dischargeDiagnosis}
                      onTranscript={(val) => setDischargeDiagnosis(val)}
                      fieldName="Diagnostic de sortie"
                      buttonText="Dicter"
                      size="xs"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={dischargeDiagnosis}
                    onChange={(e) => setDischargeDiagnosis(e.target.value)}
                    placeholder="Ex: CA23.0 - Tuberculose pulmonaire confirmée bactériologiquement"
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-bold">
                      Résumé clinique du séjour (Compte-rendu)
                    </label>
                    <VoiceDictationButton
                      value={dischargeSummaryText}
                      onTranscript={(val) => setDischargeSummaryText(val)}
                      fieldName="Résumé clinique d'hospitalisation"
                      buttonText="Dicter résumé"
                      size="xs"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={dischargeSummaryText}
                    onChange={(e) => setDischargeSummaryText(e.target.value)}
                    placeholder="Synthèse de l'évolution, sevrage O2, examens de contrôle..."
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-bold">
                      Traitement de sortie (Ordonnance)
                    </label>
                    <VoiceDictationButton
                      value={dischargeTreatments}
                      onTranscript={(val) => setDischargeTreatments(val)}
                      fieldName="Traitement de sortie"
                      buttonText="Dicter traitement"
                      size="xs"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={dischargeTreatments}
                    onChange={(e) => setDischargeTreatments(e.target.value)}
                    placeholder="Traitements à poursuivre à domicile..."
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-bold">
                      Consignes & Rendez-vous de suivi
                    </label>
                    <VoiceDictationButton
                      value={dischargeFollowUp}
                      onTranscript={(val) => setDischargeFollowUp(val)}
                      fieldName="Consignes de suivi"
                      buttonText="Dicter consignes"
                      size="xs"
                    />
                  </div>
                  <input
                    type="text"
                    value={dischargeFollowUp}
                    onChange={(e) => setDischargeFollowUp(e.target.value)}
                    placeholder="Ex: Rendez-vous de contrôle à M2 avec radiographie de contrôle"
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsDischargeModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Valider la Sortie & Générer CRH
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: PRINTABLE LETTRE DE SORTIE OFFICIELLE CHREIN */}
      <AnimatePresence>
        {showDischargeLetterModal && selectedHospForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 print-modal-overlay print-modal-active">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto print-modal-content"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 no-print">
                <div className="flex items-center gap-2 text-teal-700">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wide">Compte-Rendu d'Hospitalisation / Lettre de Sortie</h3>
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
                    onClick={() => {
                      setShowDischargeLetterModal(false);
                      setSelectedHospForDetail(null);
                      setActiveTab('archived');
                    }}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Medical Document Body (Standard A4 Portrait) */}
              <div className="a4-document-sheet p-8 bg-white rounded-xl border border-slate-300 space-y-5 text-slate-800 font-sans shadow-xs">
                {/* National Emblem & Hospital Header */}
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
                      SERVICE DE PNEUMOLOGIE ET MALADIES INFECTIEUSES
                    </p>
                    <p className="text-3xs text-slate-500 font-medium">
                      Route Nationale, Quartier Ndangane • Tél: +221 33 941 12 34 • Kaolack, Sénégal
                    </p>
                  </div>
                </div>

                <div className="avoid-page-break text-center py-2 bg-teal-50 border border-teal-200 rounded-xl">
                  <span className="text-xs font-black text-teal-950 tracking-widest uppercase block">
                    COMPTE-RENDU D'HOSPITALISATION (CRH) & LETTRE DE SORTIE
                  </span>
                  <span className="text-xxs font-mono font-bold text-teal-800">
                    SÉJOUR N° {selectedHospForDetail.id.slice(-6).toUpperCase()} • SERVICE PNEUMO
                  </span>
                </div>

                {/* Patient & Stay Identity Card */}
                <div className="avoid-page-break grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="space-y-1">
                    <p><span className="text-slate-500 font-medium">Patient :</span> <strong className="text-slate-900">{selectedHospForDetail.patientName}</strong></p>
                    <p><span className="text-slate-500 font-medium">Sexe / Âge :</span> <strong>{selectedHospForDetail.patientGender} • {selectedHospForDetail.patientAge} ans</strong></p>
                    <p><span className="text-slate-500 font-medium">Unité / Lit :</span> <strong>{selectedHospForDetail.roomNumber}</strong></p>
                    <p><span className="text-slate-500 font-medium">Dossier / IP :</span> <strong className="font-mono">{selectedHospForDetail.patientId.slice(-6).toUpperCase()}</strong></p>
                  </div>
                  <div className="space-y-1 text-right sm:text-left">
                    <p><span className="text-slate-500 font-medium">Date d'admission :</span> <strong>{selectedHospForDetail.admissionDate}</strong></p>
                    <p><span className="text-slate-500 font-medium">Date de sortie :</span> <strong>{selectedHospForDetail.actualDischargeDate || dischargeDate}</strong></p>
                    <p><span className="text-slate-500 font-medium">Médecin référent :</span> <strong>{selectedHospForDetail.doctorName || currentUser?.name || 'Dr Cheikh Ndao'}</strong></p>
                    <p><span className="text-slate-500 font-medium">Statut de sortie :</span> <strong className="text-emerald-700">Sortie autorisée par médecin</strong></p>
                  </div>
                </div>

                {/* Diagnostic Section */}
                <div className="avoid-page-break space-y-1">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-teal-900 border-b pb-1">
                    1. Diagnostic Principal & Diagnostics Associés de Sortie
                  </h4>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900">
                    {dischargeDiagnosis || selectedHospForDetail.reason}
                  </div>
                </div>

                {/* Clinical Evolution Summary */}
                <div className="avoid-page-break space-y-1">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-teal-900 border-b pb-1">
                    2. Résumé de l'Évolution Clinique du Séjour
                  </h4>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed">
                    {dischargeSummaryText || `Patient admis pour ${selectedHospForDetail.reason}. Surveillance quotidienne des constantes, auscultation pulmonaire et SpO2. Amélioration respiratoire significative constatée, apyrexie confirmée et autonomisation complète.`}
                  </div>
                </div>

                {/* Discharge Prescriptions */}
                <div className="avoid-page-break space-y-1">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-teal-900 border-b pb-1">
                    3. Traitement de Sortie Prescrit & Posologie
                  </h4>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 whitespace-pre-line leading-relaxed">
                    {dischargeTreatments || 'Ordonnance remise au patient selon protocole du service.'}
                  </div>
                </div>

                {/* Follow-up instructions */}
                <div className="avoid-page-break space-y-1">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-teal-900 border-b pb-1">
                    4. Modalités de Suivi, Surveillance & Rendez-vous de Contrôle
                  </h4>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800">
                    {dischargeFollowUp || 'Consultation de contrôle en externe dans 15 jours au Service Pneumologie du CHREIN. En cas de réapparition de dyspnée ou fièvre, consulter en urgence.'}
                  </div>
                </div>

                {/* Signature & QR Official Block */}
                <div className="avoid-page-break pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 border-2 border-slate-300 rounded-xl flex flex-col items-center justify-center p-1 bg-slate-50">
                      <QrCode className="w-8 h-8 text-slate-700" />
                      <span className="text-[7px] font-mono text-slate-400 mt-0.5 uppercase">CHREIN VÉRIF</span>
                    </div>
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <p className="font-bold text-slate-800">Authentification Documentaire DPI CHREIN</p>
                      <p>Réf Séjour : <span className="font-mono text-3xs">CRH-{selectedHospForDetail.id.slice(-6).toUpperCase()}-{new Date().getFullYear()}</span></p>
                      <p>Horodatage certifié : {new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' })}</p>
                    </div>
                  </div>

                  <div className="text-right space-y-1 min-w-[200px]">
                    <p className="text-xs font-bold text-slate-900">Le Médecin Chef / Référent</p>
                    <p className="text-xs text-teal-700 font-extrabold">{selectedHospForDetail.doctorName || currentUser?.name || 'Dr Cheikh Ndao'}</p>
                    <div className="w-40 h-16 border-2 border-dashed border-teal-300 bg-teal-50/40 rounded-xl mt-1 flex flex-col items-center justify-center text-[9px] text-teal-800 font-semibold p-1">
                      <span>Cachet Officiel CHREIN</span>
                      <span className="text-[8px] text-teal-600">Service de Pneumologie</span>
                      <span className="text-[8px] text-slate-500">Signé électroniquement ✓</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 no-print">
                <button
                  type="button"
                  onClick={() => {
                    setShowDischargeLetterModal(false);
                    setSelectedHospForDetail(null);
                    setActiveTab('archived');
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SLIDEOVER PANEL / DETAIL DRAWER CLINIC DOSSIER */}
      <AnimatePresence>
        {selectedHospForDetail && !isDischargeModalOpen && (
          <div className="fixed inset-0 z-40 overflow-hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedHospForDetail(null)}
            />

            <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl flex flex-col h-full z-10 border-l border-slate-200">
              {/* Header */}
              {(() => {
                const detailPatient = patients.find(p => p.id === selectedHospForDetail.patientId);
                const detailBed = beds.find(b => b.id === selectedHospForDetail.bedId);
                const detailVitals = nurseVitalRecords.filter(v => v.patientId === selectedHospForDetail.patientId || v.hospitalizationId === selectedHospForDetail.id);
                const latestDetailVital = detailVitals.length > 0 ? detailVitals[detailVitals.length - 1] : null;
                const detailTransmissions = nurseTargetedTransmissions.filter(t => t.patientId === selectedHospForDetail.patientId);
                const stayDays = getDaysDifference(selectedHospForDetail.admissionDate, new Date().toISOString().split('T')[0]);

                return (
                  <>
                    <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-teal-50/70 via-slate-50 to-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                          {selectedHospForDetail.patientName ? selectedHospForDetail.patientName[0].toUpperCase() : 'P'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black tracking-widest text-teal-800 uppercase bg-teal-100/70 px-2 py-0.5 rounded-full border border-teal-200">
                              Dossier de Soins Hospitaliers
                            </span>
                            <span className="text-3xs font-mono text-slate-400">
                              Chambre {selectedHospForDetail.roomNumber}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-slate-900 tracking-tight mt-0.5">
                            {selectedHospForDetail.patientName}
                          </h3>
                          <div className="flex items-center gap-2 text-xxs text-slate-500 font-medium mt-0.5">
                            <span>{selectedHospForDetail.patientAge} ans ({selectedHospForDetail.patientGender === 'M' ? 'Homme' : 'Femme'})</span>
                            <span>•</span>
                            <span>IP : <strong className="font-mono text-slate-700">{detailPatient?.hospitalNumber || detailPatient?.code || selectedHospForDetail.patientId}</strong></span>
                            <span>•</span>
                            <span className="font-bold text-teal-700">J+{stayDays} de séjour</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDischargeModal(selectedHospForDetail)}
                          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xxs font-black transition cursor-pointer"
                          title="Préparer le compte-rendu de sortie"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sortie / CRH</span>
                        </button>
                        <button
                          onClick={() => setSelectedHospForDetail(null)}
                          className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Navigation Sub-Tabs inside Care Drawer */}
                    <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setDrawerCareTab('soins')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xxs whitespace-nowrap ${
                          drawerCareTab === 'soins'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-white'
                        }`}
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Vue Globale des Soins</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDrawerCareTab('constantes')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xxs whitespace-nowrap ${
                          drawerCareTab === 'constantes'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-white'
                        }`}
                      >
                        <HeartPulse className="w-3.5 h-3.5" />
                        <span>Constantes & O2 ({detailVitals.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDrawerCareTab('traitements')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xxs whitespace-nowrap ${
                          drawerCareTab === 'traitements'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-white'
                        }`}
                      >
                        <Pill className="w-3.5 h-3.5" />
                        <span>Traitements ({(selectedHospForDetail.medications || []).length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDrawerCareTab('notes')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xxs whitespace-nowrap ${
                          drawerCareTab === 'notes'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-white'
                        }`}
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>Observations ({(selectedHospForDetail.dailyNotes || []).length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDrawerCareTab('transmissions')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xxs whitespace-nowrap ${
                          drawerCareTab === 'transmissions'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-white'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Transmissions DAR ({detailTransmissions.length})</span>
                      </button>
                    </div>

                    {/* Scrollable Main Content */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                      {/* TAB 1: VUE GLOBALE DES SOINS */}
                      {drawerCareTab === 'soins' && (
                        <div className="space-y-4">
                          {/* 4 Vital Signs Key Cards */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                Surveillance des Constantes Vitales en Temps Réel
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setDrawerCareTab('constantes');
                                  setIsAddingVital(true);
                                }}
                                className="text-[10px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Relever une constante</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {/* SpO2 */}
                              <div className={`p-3 rounded-2xl border ${
                                (latestDetailVital?.spo2 || 96) < 90
                                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                                  : (latestDetailVital?.spo2 || 96) < 94
                                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                              }`}>
                                <span className="text-[9px] font-black uppercase tracking-wider block opacity-70">
                                  Saturation SpO2
                                </span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  <span className="text-xl font-black">{latestDetailVital?.spo2 || 96}%</span>
                                  <span className="text-[10px] font-bold opacity-80">
                                    {(latestDetailVital?.spo2 || 96) >= 94 ? 'Normal' : 'Alerte'}
                                  </span>
                                </div>
                                <span className="text-[9px] block mt-1 font-medium opacity-80 truncate">
                                  O2: {latestDetailVital?.o2FlowLiters ? `${latestDetailVital.o2FlowLiters} L/min` : 'Air ambiant'}
                                </span>
                              </div>

                              {/* Tension Artérielle */}
                              <div className="p-3 rounded-2xl border border-blue-200 bg-blue-50/50 text-blue-950">
                                <span className="text-[9px] font-black uppercase tracking-wider block opacity-70">
                                  Pression Artérielle
                                </span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  <span className="text-xl font-black">{latestDetailVital?.bp || '120/75'}</span>
                                  <span className="text-[9px] font-medium opacity-70">mmHg</span>
                                </div>
                                <span className="text-[9px] block mt-1 font-medium opacity-80">
                                  Pouls : <strong>{latestDetailVital?.pulse || 82} bpm</strong>
                                </span>
                              </div>

                              {/* Fréquence Respiratoire */}
                              <div className="p-3 rounded-2xl border border-teal-200 bg-teal-50/50 text-teal-950">
                                <span className="text-[9px] font-black uppercase tracking-wider block opacity-70">
                                  Fréq. Respiratoire
                                </span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  <span className="text-xl font-black">{latestDetailVital?.rr || 20}</span>
                                  <span className="text-[9px] font-medium opacity-70">/min</span>
                                </div>
                                <span className="text-[9px] block mt-1 font-medium opacity-80 truncate">
                                  {latestDetailVital?.rr && latestDetailVital.rr > 24 ? 'Tachypnée' : 'Eupnéique'}
                                </span>
                              </div>

                              {/* Température */}
                              <div className="p-3 rounded-2xl border border-amber-200 bg-amber-50/50 text-amber-950">
                                <span className="text-[9px] font-black uppercase tracking-wider block opacity-70">
                                  Température
                                </span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  <span className="text-xl font-black">{latestDetailVital?.temperature || 37.2}</span>
                                  <span className="text-[9px] font-medium opacity-70">°C</span>
                                </div>
                                <span className="text-[9px] block mt-1 font-medium opacity-80">
                                  {(latestDetailVital?.temperature || 37.2) >= 38 ? 'Fébrile' : 'Apyrétique'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Admission Reason & Clinical Summary */}
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                Motif d'Hospitalisation & Surveillance
                              </span>
                              <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-full border border-teal-200">
                                Responsable : {selectedHospForDetail.doctorName || 'Dr. Cheikh Ndao'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-800 font-medium leading-relaxed italic bg-white p-3 rounded-xl border border-slate-200/80">
                              « {selectedHospForDetail.reason} »
                            </p>
                          </div>

                          {/* Patient Context & Demographics Card */}
                          <div className="grid grid-cols-2 gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl text-xs">
                            <div className="space-y-1">
                              <span className="text-3xs uppercase font-extrabold text-slate-400 block">Antécédents & Terrain</span>
                              <p className="text-slate-700 font-medium">
                                {detailPatient?.chronicConditions || 'Aucune comorbidité majeure renseignée'}
                              </p>
                              <p className="text-slate-500 text-xxs">
                                Allergies : <strong className="text-rose-600">{detailPatient?.allergies || 'Pas d\'allergie connue'}</strong>
                              </p>
                            </div>
                            <div className="space-y-1 text-right sm:text-left">
                              <span className="text-3xs uppercase font-extrabold text-slate-400 block">Contact & Localisation</span>
                              <p className="text-slate-700 font-medium">
                                Chambre {selectedHospForDetail.roomNumber} ({detailBed?.serviceCategory || 'Pneumologie'})
                              </p>
                              <p className="text-slate-500 text-xxs font-mono">
                                Tél : {detailPatient?.phone || 'Non renseigné'} • Kaolack
                              </p>
                            </div>
                          </div>

                          {/* Current Active Prescriptions preview */}
                          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Pill className="w-4 h-4 text-teal-600" />
                                <span className="text-xs font-black text-slate-900 uppercase">
                                  Traitements Actifs en Cours ({(selectedHospForDetail.medications || []).length})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setDrawerCareTab('traitements')}
                                className="text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
                              >
                                Gérer les ordonnances ➔
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {(selectedHospForDetail.medications || []).length === 0 ? (
                                <p className="text-xs text-slate-400 italic">Aucun traitement administré renseigné pour le moment.</p>
                              ) : (
                                (selectedHospForDetail.medications || []).slice(0, 3).map((m, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                      <strong className="text-slate-900">{m.medicineName}</strong>
                                      <span className="text-slate-500 font-mono text-3xs">({m.dosage})</span>
                                    </div>
                                    <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                      {m.frequency}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Quick Add Note with Voice Dictation */}
                          <div className="p-4 bg-teal-50/40 border border-teal-200/80 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-teal-900 tracking-wider flex items-center gap-1.5">
                                <Clipboard className="w-3.5 h-3.5 text-teal-700" />
                                <span>Ajouter une observation d'évolution clinique</span>
                              </span>
                              <VoiceDictationButton
                                value={newProgressNote}
                                onTranscript={(v) => setNewProgressNote(v)}
                                fieldName="Observation clinique de surveillance"
                                buttonText="Dicter note"
                                size="xs"
                                appendMode={true}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Dictez ou écrivez ici l'évolution clinique, constante, confort respiratoire..."
                                value={newProgressNote}
                                onChange={(e) => setNewProgressNote(e.target.value)}
                                className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 focus:border-teal-500 rounded-xl outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleAddProgressNote}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
                              >
                                Enregistrer
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: CONSTANTES VITALES & O2 */}
                      {drawerCareTab === 'constantes' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-black text-slate-900 uppercase">
                                Relevés des Constantes & Oxygénothérapie
                              </h4>
                              <p className="text-3xs text-slate-500">
                                Suivi continu des paramètres respiratoires et hémodynamiques
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setIsAddingVital(!isAddingVital)}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isAddingVital ? 'Fermer le formulaire' : 'Nouvelle Prise de Constantes'}</span>
                            </button>
                          </div>

                          {/* Quick Vital Entry Card */}
                          {isAddingVital && (
                            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3 animate-fade-in">
                              <span className="text-[10px] font-black text-teal-900 uppercase tracking-wider block">
                                Saisie Immédiate des Constantes au Lit du Patient
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                <div>
                                  <label className="text-3xs font-bold text-slate-600 block mb-0.5">SpO2 (%) *</label>
                                  <input
                                    type="number"
                                    min={50}
                                    max={100}
                                    value={quickVitalSpo2}
                                    onChange={(e) => setQuickVitalSpo2(Number(e.target.value))}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-3xs font-bold text-slate-600 block mb-0.5">Débit O2 (L/min)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={15}
                                    step={0.5}
                                    value={quickVitalO2Flow}
                                    onChange={(e) => setQuickVitalO2Flow(Number(e.target.value))}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-3xs font-bold text-slate-600 block mb-0.5">Pression Art. (TA)</label>
                                  <input
                                    type="text"
                                    value={quickVitalBp}
                                    onChange={(e) => setQuickVitalBp(e.target.value)}
                                    placeholder="120/80"
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-3xs font-bold text-slate-600 block mb-0.5">Pouls (bpm)</label>
                                  <input
                                    type="number"
                                    min={30}
                                    max={220}
                                    value={quickVitalPulse}
                                    onChange={(e) => setQuickVitalPulse(Number(e.target.value))}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-3xs font-bold text-slate-600 block mb-0.5">Fréq. Resp. (/min)</label>
                                  <input
                                    type="number"
                                    min={8}
                                    max={60}
                                    value={quickVitalRr}
                                    onChange={(e) => setQuickVitalRr(Number(e.target.value))}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-3xs font-bold text-slate-600 block mb-0.5">Température (°C)</label>
                                  <input
                                    type="number"
                                    min={34}
                                    max={43}
                                    step={0.1}
                                    value={quickVitalTemp}
                                    onChange={(e) => setQuickVitalTemp(Number(e.target.value))}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-3xs font-bold text-slate-600 block mb-0.5">Mode Oxygénothérapie</label>
                                  <select
                                    value={quickVitalO2Mode}
                                    onChange={(e) => setQuickVitalO2Mode(e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                                  >
                                    <option value="Air ambiant">Air ambiant</option>
                                    <option value="Lunettes nasales">Lunettes nasales</option>
                                    <option value="Masque haute concentration">Masque HC</option>
                                    <option value="VNI BiPAP / CPAP">VNI BiPAP / CPAP</option>
                                    <option value="Optiflow / Haut débit">Optiflow</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-3xs font-bold text-slate-600 block mb-0.5">Glycémie (g/L)</label>
                                  <input
                                    type="number"
                                    step={0.05}
                                    value={quickVitalGlucose}
                                    onChange={(e) => setQuickVitalGlucose(Number(e.target.value))}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={handleSaveQuickVital}
                                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
                                >
                                  Valider & Consigner les Constantes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsAddingVital(false)}
                                  className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Historical Vitals Table */}
                          <div className="space-y-2">
                            {detailVitals.length === 0 ? (
                              <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl text-center">
                                Aucune constante enregistrée pour cette hospitalisation.
                              </p>
                            ) : (
                              detailVitals.map((v, idx) => (
                                <div key={v.id || idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                                  <div className="flex items-center justify-between text-3xs font-mono text-slate-500">
                                    <span className="font-bold text-slate-700">{new Date(v.timestamp).toLocaleString('fr-FR')}</span>
                                    <span>Par : <strong>{v.nurseName}</strong></span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2 text-xs font-bold text-slate-800">
                                    <span className="text-teal-700">SpO2 : {v.spo2}%</span>
                                    <span>TA : {v.bp}</span>
                                    <span>Pouls : {v.pulse} bpm</span>
                                    <span>Temp : {v.temperature}°C</span>
                                  </div>
                                  {v.notes && (
                                    <p className="text-3xs text-slate-600 italic bg-slate-50 p-1.5 rounded">
                                      {v.notes}
                                    </p>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* TAB 3: TRAITEMENTS ADMINISTRÉS */}
                      {drawerCareTab === 'traitements' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-900 uppercase">
                              Prescriptions & Traitements de Séjour
                            </h4>
                            <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              Service Pneumologie CHREIN
                            </span>
                          </div>

                          {/* Add medication card */}
                          {selectedHospForDetail.status === 'active' && (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                                Ajouter un Médicament / Protocole au Traitement
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <input
                                  type="text"
                                  placeholder="Molécule / Spécialité (ex: Ventoline 100µg)"
                                  value={newMedName}
                                  onChange={(e) => setNewMedName(e.target.value)}
                                  className="p-2 bg-white border border-slate-200 rounded-xl font-bold"
                                />
                                <input
                                  type="text"
                                  placeholder="Dosage (ex: 2 bouffées avec chambre)"
                                  value={newMedDosage}
                                  onChange={(e) => setNewMedDosage(e.target.value)}
                                  className="p-2 bg-white border border-slate-200 rounded-xl font-medium"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Rythme / Fréquence (ex: Toutes les 4 heures si dyspnée)"
                                  value={newMedFreq}
                                  onChange={(e) => setNewMedFreq(e.target.value)}
                                  className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddMedication}
                                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer shrink-0"
                                >
                                  Ajouter au Traitement
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Active Treatments List */}
                          <div className="space-y-2">
                            {(selectedHospForDetail.medications || []).length === 0 ? (
                              <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-xl">
                                Aucune prescription enregistrée pour cette hospitalisation.
                              </p>
                            ) : (
                              (selectedHospForDetail.medications || []).map((m, idx) => (
                                <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-2xs">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold">
                                      <Pill className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <strong className="text-slate-900 block">{m.medicineName}</strong>
                                      <span className="text-[10px] text-slate-500 font-mono">Dosage : {m.dosage}</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-lg">
                                    {m.frequency}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* TAB 4: OBSERVATIONS & ÉVOLUTION */}
                      {drawerCareTab === 'notes' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-900 uppercase">
                              Observations Médicales & Évolution Quotidienne
                            </h4>
                            <VoiceDictationButton
                              value={newProgressNote}
                              onTranscript={(v) => setNewProgressNote(v)}
                              fieldName="Observation clinique"
                              buttonText="Dicter observation"
                              size="xs"
                              appendMode={true}
                            />
                          </div>

                          {selectedHospForDetail.status === 'active' && (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Nouvelle note d'observation (constantes, état respiratoire, consignes)..."
                                value={newProgressNote}
                                onChange={(e) => setNewProgressNote(e.target.value)}
                                className="flex-1 text-xs px-3.5 py-2.5 border border-slate-200 focus:border-teal-500 rounded-xl outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleAddProgressNote}
                                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer shrink-0"
                              >
                                Enregistrer
                              </button>
                            </div>
                          )}

                          <div className="space-y-2.5">
                            {(selectedHospForDetail.dailyNotes || []).length === 0 ? (
                              <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-xl">
                                Aucune note d'évolution enregistrée pour cette hospitalisation.
                              </p>
                            ) : (
                              (selectedHospForDetail.dailyNotes || []).map((n, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1 shadow-2xs">
                                  <div className="flex justify-between text-3xs font-bold text-slate-400">
                                    <span>Date : {n.date}</span>
                                    <span className="text-teal-800 font-extrabold">{n.author}</span>
                                  </div>
                                  <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                                    {n.note}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* TAB 5: TRANSMISSIONS INFIRMIÈRES DAR */}
                      {drawerCareTab === 'transmissions' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-900 uppercase">
                              Transmissions Ciblées Infirmières (DAR)
                            </h4>
                            <span className="text-3xs text-slate-400">
                              Section 13 • Données, Actions, Résultats
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {detailTransmissions.length === 0 ? (
                              <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-xl">
                                Aucune transmission ciblée infirmière enregistrée pour ce patient.
                              </p>
                            ) : (
                              detailTransmissions.map((t, idx) => (
                                <div key={t.id || idx} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-xxs">
                                      Cible : {t.target}
                                    </span>
                                    <span className="text-3xs text-slate-400 font-mono">
                                      {new Date(t.timestamp).toLocaleString('fr-FR')} • {t.nurseName}
                                    </span>
                                  </div>
                                  <div className="space-y-1 text-3xs leading-relaxed">
                                    <p><strong className="text-slate-800 uppercase">D (Données) :</strong> {t.data}</p>
                                    <p><strong className="text-teal-800 uppercase">A (Actions) :</strong> {t.action}</p>
                                    <p><strong className="text-emerald-800 uppercase">R (Résultat) :</strong> {t.result}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Quick Bar */}
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedHospForDetail(null)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      >
                        Fermer le dossier
                      </button>

                      {selectedHospForDetail.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleOpenDischargeModal(selectedHospForDetail)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Engager la sortie clinique (CRH)</span>
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
