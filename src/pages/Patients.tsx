import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { EducationLevel, MaritalStatus, Patient, SpecializedPneumoRecord } from '../types';
import {
  Users,
  Search,
  Plus,
  AlertTriangle,
  FileText,
  Activity,
  HeartPulse,
  Wind,
  Stethoscope,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  Eye,
  Edit3,
  Trash2,
  Microscope,
  Pill,
  BedDouble
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { SpecializedSheetModal, SPECIALIZED_FORM_CONFIGS } from '../components/SpecializedSheetModal';
import {
  PatientDpiHistoryEditor,
  DpiAntecedentsValue,
  createEmptyDpiAntecedents,
  buildDpiFromPatient,
  extractConsumptionsFromDpi
} from '../components/PatientDpiHistoryEditor';
import { EDUCATION_LEVEL_OPTIONS, MARITAL_STATUS_OPTIONS, OCCUPATIONAL_EXPOSURE_OPTIONS } from '../utils/dpiConstants';

export const Patients: React.FC = () => {
  const {
    patients,
    addPatient,
    updatePatient,
    consultations,
    hospitalizations,
    specializedPneumoRecords,
    deleteSpecializedPneumoRecord,
    clinicalScoreCalculations,
    medicalExplorations,
    medicalDocuments,
    currentCenter,
    findDuplicatePatients
  } = useStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const paramPatientId = searchParams.get('patientId');
  const paramNew = searchParams.get('new');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(() => {
    if (paramPatientId && patients.some(p => p.id === paramPatientId)) {
      return paramPatientId;
    }
    return patients[0]?.id || null;
  });
  const [activeTab, setActiveTab] = useState<'info' | 'consultations' | 'hospitalizations' | 'specialized' | 'scores' | 'explorations' | 'documents'>('info');
  const [showNewPatientModal, setShowNewPatientModal] = useState(() => paramNew === '1');
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);

  useEffect(() => {
    if (paramPatientId && patients.some(p => p.id === paramPatientId)) {
      setSelectedPatientId(paramPatientId);
    }
  }, [paramPatientId, patients]);

  useEffect(() => {
    if (paramNew === '1') {
      setShowNewPatientModal(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [paramNew, searchParams, setSearchParams]);

  // Specialized sheets modal state
  const [selectedSpecializedRecord, setSelectedSpecializedRecord] = useState<SpecializedPneumoRecord | null>(null);
  const [specializedModalOpen, setSpecializedModalOpen] = useState(false);
  const [specializedModalMode, setSpecializedModalMode] = useState<'view' | 'edit' | 'create' | 'print'>('view');
  const [specializedFilter, setSpecializedFilter] = useState<string>('ALL');
  const [sheetToDelete, setSheetToDelete] = useState<string | null>(null);

  // New patient modal state
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '1985-06-15',
    age: 41,
    gender: 'M' as 'M' | 'F',
    phone: '+221 ',
    address: 'Kaolack',
    hospitalNumber: 'CHREIN-PNEUMO-2026-',
    profession: '',
    maritalStatus: 'Non renseigné' as MaritalStatus,
    educationLevel: 'Non renseigné' as EducationLevel,
    emergencyContact: '',
    emergencyPhone: '',
    allergies: '',
    chronicConditions: ''
  });
  const [newPatientDpi, setNewPatientDpi] = useState<DpiAntecedentsValue>(() => createEmptyDpiAntecedents());

  // Edit patient modal state
  const [editPatientForm, setEditPatientForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '1985-06-15',
    age: 40,
    gender: 'M' as 'M' | 'F',
    phone: '',
    address: '',
    hospitalNumber: '',
    profession: '',
    maritalStatus: 'Non renseigné' as MaritalStatus,
    educationLevel: 'Non renseigné' as EducationLevel,
    emergencyContact: '',
    emergencyPhone: '',
    allergies: '',
    chronicConditions: ''
  });
  const [editPatientDpi, setEditPatientDpi] = useState<DpiAntecedentsValue>(() => createEmptyDpiAntecedents());

  // Duplicate warning detection (Section 3)
  const potentialDuplicates = useMemo(() => {
    if (!newPatientForm.firstName || !newPatientForm.lastName) return [];
    return findDuplicatePatients({
      firstName: newPatientForm.firstName,
      lastName: newPatientForm.lastName,
      phone: newPatientForm.phone,
      birthDate: newPatientForm.birthDate,
      hospitalNumber: newPatientForm.hospitalNumber
    });
  }, [newPatientForm, findDuplicatePatients]);

  // Filtered patients list by center and search query
  const filteredPatients = useMemo(() => {
    return patients
      .filter(p => !currentCenter || p.centerId === currentCenter.id)
      .filter(p => {
        const query = searchTerm.toLowerCase();
        return (
          (p.firstName || '').toLowerCase().includes(query) ||
          (p.lastName || '').toLowerCase().includes(query) ||
          (p.code || '').toLowerCase().includes(query) ||
          (p.hospitalNumber || '').toLowerCase().includes(query) ||
          (p.phone || '').includes(query) ||
          (p.chronicConditions || '').toLowerCase().includes(query)
        );
      });
  }, [patients, currentCenter, searchTerm]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || filteredPatients[0];

  // Associated records for selected patient
  const patientConsultations = consultations.filter(c => c.patientId === selectedPatient?.id);
  const patientHospitalizations = hospitalizations.filter(h => h.patientId === selectedPatient?.id);
  const patientSpecialized = specializedPneumoRecords.filter(r => r.patientId === selectedPatient?.id);
  const patientScores = clinicalScoreCalculations.filter(s => s.patientId === selectedPatient?.id);
  const patientExplorations = medicalExplorations.filter(e => e.patientId === selectedPatient?.id);
  const patientDocuments = medicalDocuments.filter(d => d.patientId === selectedPatient?.id);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const combinedChronic = [
      ...newPatientDpi.medicalAntecedents,
      ...(newPatientDpi.medicalAntecedentsOther ? [newPatientDpi.medicalAntecedentsOther] : []),
      ...(newPatientForm.chronicConditions ? [newPatientForm.chronicConditions] : [])
    ]
      .filter((v, i, arr) => v && arr.indexOf(v) === i)
      .join(', ');

    const consumptions = extractConsumptionsFromDpi(newPatientDpi);
    const created = await addPatient({
      hospitalNumber: newPatientForm.hospitalNumber || `CHREIN-2026-${String(patients.length + 1).padStart(3, '0')}`,
      firstName: newPatientForm.firstName,
      lastName: newPatientForm.lastName,
      birthDate: newPatientForm.birthDate,
      gender: newPatientForm.gender,
      phone: newPatientForm.phone,
      address: newPatientForm.address,
      profession: newPatientForm.profession || newPatientDpi.occupationalProfile.currentProfession,
      maritalStatus: newPatientForm.maritalStatus,
      educationLevel: newPatientForm.educationLevel,
      emergencyContact: newPatientForm.emergencyContact,
      emergencyPhone: newPatientForm.emergencyPhone,
      allergies: newPatientForm.allergies,
      chronicConditions: combinedChronic,
      medicalAntecedents: {
        selected: newPatientDpi.medicalAntecedents,
        other: newPatientDpi.medicalAntecedentsOther
      },
      smokingHistory: {
        isSmoker: newPatientDpi.smokingStatus !== 'JAMAIS',
        status: newPatientDpi.smokingStatus,
        cigarettesPerDay: newPatientDpi.cigarettesPerDay,
        durationYears: newPatientDpi.smokingDurationYears,
        stoppedYear: newPatientDpi.smokingStoppedYear,
        packYears: newPatientDpi.smokingPackYears,
        periods: newPatientDpi.smokingPeriods,
        biomassExposure: newPatientDpi.biomassExposure || newPatientDpi.occupationalProfile.exposures.includes('BIOMASSE'),
        passiveSmoking: newPatientDpi.passiveSmoking
      },
      consumptions,
      occupationalExposures: newPatientDpi.occupationalProfile,
      surgicalHistory: newPatientDpi.surgicalHistory,
      obgynHistory: newPatientForm.gender === 'F' ? newPatientDpi.obgynHistory : undefined
    });

    if (created) {
      setSelectedPatientId(created.id);
    }
    setShowNewPatientModal(false);
    setNewPatientDpi(createEmptyDpiAntecedents());
  };

  const openEditPatientModal = (p: Patient) => {
    setEditPatientForm({
      firstName: p.firstName,
      lastName: p.lastName,
      birthDate: p.birthDate || '1985-06-15',
      age: p.age,
      gender: p.gender,
      phone: p.phone || '',
      address: p.address || '',
      hospitalNumber: p.hospitalNumber || '',
      profession: p.profession || '',
      maritalStatus: p.maritalStatus || 'Non renseigné',
      educationLevel: p.educationLevel || 'Non renseigné',
      emergencyContact: p.emergencyContact || '',
      emergencyPhone: p.emergencyPhone || '',
      allergies: p.allergies || '',
      chronicConditions: p.chronicConditions || ''
    });
    setEditPatientDpi(buildDpiFromPatient(p));
    setShowEditPatientModal(true);
  };

  const handleSaveEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const combinedChronic = [
      ...editPatientDpi.medicalAntecedents,
      ...(editPatientDpi.medicalAntecedentsOther ? [editPatientDpi.medicalAntecedentsOther] : [])
    ].join(', ') || editPatientForm.chronicConditions;

    const consumptions = extractConsumptionsFromDpi(editPatientDpi);
    await updatePatient(selectedPatient.id, {
      firstName: editPatientForm.firstName,
      lastName: editPatientForm.lastName,
      birthDate: editPatientForm.birthDate,
      age: Number(editPatientForm.age || selectedPatient.age),
      gender: editPatientForm.gender,
      phone: editPatientForm.phone,
      address: editPatientForm.address,
      hospitalNumber: editPatientForm.hospitalNumber,
      profession: editPatientForm.profession || editPatientDpi.occupationalProfile.currentProfession,
      maritalStatus: editPatientForm.maritalStatus,
      educationLevel: editPatientForm.educationLevel,
      emergencyContact: editPatientForm.emergencyContact,
      emergencyPhone: editPatientForm.emergencyPhone,
      allergies: editPatientForm.allergies,
      chronicConditions: combinedChronic,
      medicalAntecedents: {
        selected: editPatientDpi.medicalAntecedents,
        other: editPatientDpi.medicalAntecedentsOther
      },
      smokingHistory: {
        isSmoker: editPatientDpi.smokingStatus !== 'JAMAIS',
        status: editPatientDpi.smokingStatus,
        cigarettesPerDay: editPatientDpi.cigarettesPerDay,
        durationYears: editPatientDpi.smokingDurationYears,
        stoppedYear: editPatientDpi.smokingStoppedYear,
        packYears: editPatientDpi.smokingPackYears,
        periods: editPatientDpi.smokingPeriods,
        biomassExposure: editPatientDpi.biomassExposure || editPatientDpi.occupationalProfile.exposures.includes('BIOMASSE'),
        passiveSmoking: editPatientDpi.passiveSmoking
      },
      consumptions,
      occupationalExposures: editPatientDpi.occupationalProfile,
      surgicalHistory: editPatientDpi.surgicalHistory,
      obgynHistory: editPatientDpi.obgynHistory
    });
    setShowEditPatientModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Dossiers Patients Longitudinaux (DPI)
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Identifiant IP unique, détection des doublons & historique complet • {currentCenter?.name || 'CHREIN'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewPatientModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Dossier Patient</span>
        </button>
      </div>

      {/* Main Grid: Patient List & Longitudinal Dossier View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Search & Patient List */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par nom, IP, N° CHREIN, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-600"
            />
          </div>

          <div className="flex items-center justify-between px-1 text-xxs font-mono text-slate-400">
            <span>{filteredPatients.length} patient(s) trouvé(s)</span>
            <span>Cloisonnement actif</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredPatients.map(p => {
              const isSelected = selectedPatient?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xxs px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
                      {p.code}
                    </span>
                    <span className="text-xxs text-slate-400 font-mono">
                      {p.hospitalNumber || 'CHREIN'}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-slate-800 mt-1">
                    {p.firstName} {p.lastName}
                  </h4>

                  <p className="text-xxs text-slate-500 mt-0.5">
                    {p.age} ans ({p.gender}) • {p.address}
                  </p>

                  {p.chronicConditions && (
                    <div className="mt-1.5 text-3xs font-medium text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded-md truncate">
                      {p.chronicConditions}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Longitudinal Dossier Viewer */}
        <div className="lg:col-span-8 space-y-4">
          {selectedPatient ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                    {selectedPatient.firstName?.[0] || 'P'}{selectedPatient.lastName?.[0] || ''}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </h2>
                      <span className="text-xxs font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                        {selectedPatient.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      N° Dossier CHREIN : <strong className="font-mono text-slate-700">{selectedPatient.hospitalNumber || 'N/A'}</strong> • {selectedPatient.age} ans ({selectedPatient.gender})
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditPatientModal(selectedPatient)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Modifier DPI</span>
                  </button>
                  <Link
                    to={`/hospitalization?admit=1&patientId=${selectedPatient.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs rounded-xl transition whitespace-nowrap shrink-0"
                  >
                    <BedDouble className="w-3.5 h-3.5" />
                    <span>Hospitaliser</span>
                  </Link>
                  <Link
                    to={`/consultations?patientId=${selectedPatient.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition whitespace-nowrap shrink-0"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>+ Consultation</span>
                  </Link>
                </div>
              </div>

              {/* Sub-tabs for patient's dossier */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 text-xxs font-bold">
                {[
                  { id: 'info', label: '1. Fiche & Risques', count: null },
                  { id: 'consultations', label: '2. Consultations (12 étapes)', count: patientConsultations.length },
                  { id: 'hospitalizations', label: '3. Hospitalisations', count: patientHospitalizations.length },
                  { id: 'specialized', label: '4. Fiches Spécialisées', count: patientSpecialized.length },
                  { id: 'scores', label: '5. Scores Cliniques', count: patientScores.length },
                  { id: 'explorations', label: '6. Explorations & Courbes', count: patientExplorations.length },
                  { id: 'documents', label: '7. Documents Officiels', count: patientDocuments.length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-2 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span className={`px-1.5 py-0.2 rounded-full text-3xs ${
                        activeTab === tab.id ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* TAB 1: IDENTITÉ & FACTEURS DE RISQUE */}
              {activeTab === 'info' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">
                      Synthèse DPI — État Civil & Antécédents Structurés
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        1. État Civil & Coordonnées
                      </span>
                      <p><strong>Nom & Prénom :</strong> {selectedPatient.lastName} {selectedPatient.firstName}</p>
                      <p><strong>N° Dossier :</strong> <span className="font-mono">{selectedPatient.code}</span> • {selectedPatient.hospitalNumber || 'CHREIN'}</p>
                      <p><strong>Âge / Sexe :</strong> {selectedPatient.age} ans ({selectedPatient.gender === 'F' ? 'Féminin' : 'Masculin'}) • Né(e) le {selectedPatient.birthDate}</p>
                      <p><strong>Situation matrimoniale :</strong> {selectedPatient.maritalStatus || 'Non renseigné'}</p>
                      <p><strong>Niveau d'études :</strong> {selectedPatient.educationLevel || 'Non renseigné'}</p>
                      <p><strong>Profession :</strong> {selectedPatient.profession || 'Non renseignée'}</p>
                      <p><strong>Téléphone patient :</strong> {selectedPatient.phone}</p>
                      <p><strong>Adresse :</strong> {selectedPatient.address}</p>
                      <p><strong>Contact & Tél. d'urgence :</strong> {selectedPatient.emergencyContact || 'Non renseigné'} {selectedPatient.emergencyPhone ? `(${selectedPatient.emergencyPhone})` : ''}</p>
                    </div>

                    <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200 space-y-1.5">
                      <span className="text-xxs font-bold text-teal-900 uppercase tracking-widest block mb-1">
                        2. Antécédents & Consommations
                      </span>
                      <p>
                        <strong>Tabagisme : </strong>
                        {selectedPatient.smokingHistory?.status === 'ANCIEN'
                          ? `Ancien fumeur (arrêt ${selectedPatient.smokingHistory.stoppedYear || 'N/A'}) — ${selectedPatient.smokingHistory.packYears || 0} PA`
                          : selectedPatient.smokingHistory?.isSmoker || (selectedPatient.smokingHistory?.packYears || 0) > 0
                            ? `Fumeur actuel — ${selectedPatient.smokingHistory?.packYears || 0} PA`
                            : 'Jamais fumeur'}
                      </p>
                      <p>
                        <strong>Cannabis / Alcool / Drogues : </strong>
                        Cannabis : {selectedPatient.consumptions?.cannabis?.status || 'JAMAIS'} • Alcool : {selectedPatient.consumptions?.alcohol?.status || 'JAMAIS'} • Autres : {selectedPatient.consumptions?.otherDrugs?.status || 'NON_RENSEIGNE'}
                      </p>
                      <p>
                        <strong>Antécédents médicaux : </strong>
                        {selectedPatient.medicalAntecedents?.selected?.length
                          ? selectedPatient.medicalAntecedents.selected.join(', ')
                          : (selectedPatient.chronicConditions || 'Aucun renseigné')}
                      </p>
                      <p>
                        <strong>Allergies / Terrain : </strong>
                        {selectedPatient.allergies || 'Aucune allergie connue'}
                      </p>
                      <p>
                        <strong>Expositions pro/env. : </strong>
                        {selectedPatient.occupationalExposures?.exposures?.length
                          ? selectedPatient.occupationalExposures.exposures
                              .map(id => OCCUPATIONAL_EXPOSURE_OPTIONS.find(o => o.id === id)?.label || id)
                              .join(', ')
                          : selectedPatient.smokingHistory?.biomassExposure
                            ? 'Fumée de biomasse (bois, charbon)'
                            : 'Aucune exposition signalée'}
                      </p>
                      <p>
                        <strong>ATCD chirurgicaux : </strong>
                        {selectedPatient.surgicalHistory?.length
                          ? selectedPatient.surgicalHistory.map(s => `${s.procedure} (${s.dateOrYear})`).join(' ; ')
                          : 'Aucun'}
                      </p>
                      {selectedPatient.gender === 'F' && selectedPatient.obgynHistory && (
                        <p>
                          <strong>Gynéco-obstétrique : </strong>
                          G{selectedPatient.obgynHistory.gestite ?? '-'} P{selectedPatient.obgynHistory.parite ?? '-'}
                          {selectedPatient.obgynHistory.isPregnant ? ` • Grossesse en cours (${selectedPatient.obgynHistory.gestationalAgeWeeks || '?'} SA)` : ''}
                          {selectedPatient.obgynHistory.menopause ? ' • Ménopausée' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONSULTATIONS (12 ÉTAPES) */}
              {activeTab === 'consultations' && (
                <div className="space-y-3">
                  {patientConsultations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">Aucune consultation enregistrée.</p>
                  ) : (
                    patientConsultations.map(c => (
                      <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            Consultation du {new Date(c.date).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-xxs font-mono text-slate-500">
                            Dr. {c.doctorName}
                          </span>
                        </div>
                        <p className="text-xxs text-slate-600">
                          <strong>Motif :</strong> {c.chiefComplaint || c.notes}
                        </p>
                        {c.twelveSteps?.syndromicSummary && (
                          <div className="p-2.5 bg-teal-50 rounded-lg text-xxs text-teal-900 font-medium">
                            <strong>Résumé syndromique :</strong> {c.twelveSteps.syndromicSummary}
                          </div>
                        )}
                        <p className="text-xxs text-slate-700">
                          <strong>Diagnostic(s) :</strong> {c.diagnosis}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: HOSPITALISATIONS */}
              {activeTab === 'hospitalizations' && (
                <div className="space-y-3">
                  {patientHospitalizations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">Aucun séjour hospitalier pour ce patient.</p>
                  ) : (
                    patientHospitalizations.map(h => (
                      <div key={h.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            Chambre {h.roomNumber || 'N/A'} ({h.status === 'active' ? 'Séjour en cours' : 'Séjour clos'})
                          </span>
                          <span className="text-xxs font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                            Entrée le {h.admissionDate ? new Date(h.admissionDate).toLocaleDateString('fr-FR') : '--'}
                          </span>
                        </div>
                        <p className="text-xxs text-slate-600"><strong>Motif d'admission :</strong> {h.reason}</p>
                        {h.dischargeType && (
                          <p className="text-xxs text-emerald-700"><strong>Mode de sortie :</strong> {h.dischargeType}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: FICHES SPÉCIALISÉES */}
              {activeTab === 'specialized' && (
                <div className="space-y-4">
                  {/* Top Bar inside Tab */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-teal-50/60 border border-teal-100 rounded-2xl">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-teal-950 uppercase tracking-wide">
                          Protocoles Spécialisés & Fiches Cliniques
                        </span>
                        <span className="text-xxs font-mono font-bold px-2 py-0.5 bg-teal-600 text-white rounded-full">
                          {patientSpecialized.length} fiche{patientSpecialized.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-xxs text-slate-600">
                        Protocoles standardisés : Tuberculose (PNT), BPCO GOLD, Asthme GINA, Séquelles TB, PID, DDB, Pleurésie & Antibiogouvernance.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSpecializedRecord(null);
                        setSpecializedModalMode('create');
                        setSpecializedModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Rédiger une Fiche Spécialisée</span>
                    </button>
                  </div>

                  {/* Filter Pills */}
                  {patientSpecialized.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xxs font-bold">
                      {[
                        { id: 'ALL', label: `Toutes (${patientSpecialized.length})` },
                        { id: 'TUBERCULOSIS', label: 'Tuberculose' },
                        { id: 'COPD', label: 'BPCO' },
                        { id: 'ASTHMA', label: 'Asthme' },
                        { id: 'TB_SEQUELAE', label: 'Séquelles TB' },
                        { id: 'PID_IPAF', label: 'PID & Fibroses' },
                        { id: 'BRONCHIECTASIS', label: 'DDB' },
                        { id: 'PLEURAL_DISEASE', label: 'Pleurésie' },
                        { id: 'ANTIBIOTIC_STEWARDSHIP', label: 'Bon Usage ATB' }
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSpecializedFilter(f.id)}
                          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                            specializedFilter === f.id
                              ? 'bg-slate-800 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fiches List */}
                  {(() => {
                    const filtered = patientSpecialized.filter(r => {
                      if (specializedFilter === 'ALL') return true;
                      return r.formType === specializedFilter;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                            <Wind className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-700">
                              {specializedFilter === 'ALL'
                                ? 'Aucune fiche spécialisée rédigée pour ce patient'
                                : 'Aucune fiche pour cette catégorie'}
                            </p>
                            <p className="text-xxs text-slate-500 max-w-sm mx-auto">
                              Rédigez une évaluation protocolisée pour assurer la continuité des soins et le suivi pneumologique.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSpecializedRecord(null);
                              setSpecializedModalMode('create');
                              setSpecializedModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Rédiger une fiche</span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {filtered.map(r => {
                          const cfg = SPECIALIZED_FORM_CONFIGS[r.formType] || SPECIALIZED_FORM_CONFIGS.TUBERCULOSIS;
                          return (
                            <div
                              key={r.id}
                              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition p-4 space-y-3"
                            >
                              {/* Header Card */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${cfg.color}`}>
                                    {cfg.icon}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-black text-slate-900">{r.title}</h4>
                                      <span className={`text-3xs font-extrabold uppercase px-2 py-0.5 rounded border ${cfg.color}`}>
                                        {cfg.badge}
                                      </span>
                                    </div>
                                    <p className="text-xxs text-slate-500">
                                      Évalué le <strong className="text-slate-700">{new Date(r.date).toLocaleDateString('fr-FR')}</strong> • Par {r.doctorName}
                                    </p>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSpecializedRecord(r);
                                      setSpecializedModalMode('view');
                                      setSpecializedModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xxs rounded-lg transition cursor-pointer"
                                    title="Consulter les détails"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-teal-600" />
                                    <span>Consulter</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSpecializedRecord(r);
                                      setSpecializedModalMode('view');
                                      setSpecializedModalOpen(true);
                                      setTimeout(() => window.print(), 350);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xxs rounded-lg transition cursor-pointer"
                                    title="Imprimer au format A4"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Imprimer A4</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSpecializedRecord(r);
                                      setSpecializedModalMode('edit');
                                      setSpecializedModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xxs rounded-lg border border-teal-200 transition cursor-pointer"
                                    title="Modifier la fiche"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Modifier</span>
                                  </button>

                                  {sheetToDelete === r.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          await deleteSpecializedPneumoRecord(r.id);
                                          setSheetToDelete(null);
                                        }}
                                        className="px-2 py-1 bg-rose-600 text-white rounded text-3xs font-bold"
                                      >
                                        Oui
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSheetToDelete(null)}
                                        className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-3xs font-semibold"
                                      >
                                        Non
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setSheetToDelete(r.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                      title="Supprimer la fiche"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Key Clinical Badges */}
                              <div className="flex flex-wrap gap-2 text-xxs">
                                {r.formType === 'TUBERCULOSIS' && (
                                  <>
                                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                                      Forme : <strong>{r.data?.tbForm || 'TPM+'}</strong>
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-md font-bold ${
                                      (r.data?.genexpertResult || '').includes('RES') ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      GeneXpert : {r.data?.genexpertResult || 'Sensible RIF'}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 font-mono font-bold">
                                      Régime : {r.data?.regimen || '2RHZE/4RH'}
                                    </span>
                                    {r.data?.adherence && (
                                      <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-medium">
                                        Observance : {r.data.adherence}
                                      </span>
                                    )}
                                  </>
                                )}

                                {r.formType === 'COPD' && (
                                  <>
                                    <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-bold">
                                      {r.data?.packYears || 0} Paquets-Années
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold">
                                      Stade : {r.data?.goldStage || 'GOLD 2'}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-bold">
                                      {r.data?.goldGroup || 'Groupe E'}
                                    </span>
                                    {r.data?.mmrcScore !== undefined && (
                                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                                        mMRC : Stade {r.data.mmrcScore}
                                      </span>
                                    )}
                                  </>
                                )}

                                {r.formType === 'ASTHMA' && (
                                  <>
                                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                                      Contrôle : {r.data?.ginaControl || 'Bien contrôlé'}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 font-bold">
                                      {r.data?.ginaStep || 'Palier 3'}
                                    </span>
                                    {r.data?.peakFlow && (
                                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono font-bold">
                                        DEP : {r.data.peakFlow} L/min
                                      </span>
                                    )}
                                  </>
                                )}

                                {r.formType === 'TB_SEQUELAE' && (
                                  <>
                                    <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 font-bold">
                                      6MWT : {r.data?.walkDistance ? `${r.data.walkDistance} m` : 'Mesuré'}
                                    </span>
                                    {r.data?.minSpo2 && (
                                      <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-mono font-bold">
                                        SpO2 min : {r.data.minSpo2}%
                                      </span>
                                    )}
                                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                                      Séquelles : {r.data?.sequelaeType || 'DDB post-TB'}
                                    </span>
                                  </>
                                )}

                                {r.formType === 'PID_IPAF' && (
                                  <>
                                    <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 font-bold">
                                      Auscultation : {r.data?.auscultation || 'Râles velcro'}
                                    </span>
                                    {r.data?.hrctPattern && (
                                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                                        HRCT : {r.data.hrctPattern}
                                      </span>
                                    )}
                                  </>
                                )}

                                {r.formType === 'BRONCHIECTASIS' && (
                                  <>
                                    <span className="px-2.5 py-1 rounded-md bg-cyan-100 text-cyan-800 font-bold">
                                      Expectoration : {r.data?.sputumVolume || '30ml/j'}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                                      ECBC : {r.data?.colonization || 'Non colonisé'}
                                    </span>
                                  </>
                                )}

                                {r.formType === 'PLEURAL_DISEASE' && (
                                  <>
                                    <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-bold">
                                      Côté : {r.data?.pleuralSide || 'Droit'}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                                      Aspect : {r.data?.fluidAspect || 'Citrin'}
                                    </span>
                                    {r.data?.fluidChemistry && (
                                      <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 font-mono">
                                        {r.data.fluidChemistry}
                                      </span>
                                    )}
                                  </>
                                )}

                                {r.formType === 'ANTIBIOTIC_STEWARDSHIP' && (
                                  <>
                                    <span className="px-2.5 py-1 rounded-md bg-teal-100 text-teal-800 font-bold">
                                      Molécule : {r.data?.antibioticMolecule || 'Ceftriaxone'}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-medium">
                                      48-72h : {r.data?.reassessment || 'Évalué'}
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Clinical Synthesis Quote */}
                              {r.data?.clinicalSynthesis && (
                                <div className="text-xxs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                                  « {r.data.clinicalSynthesis} »
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 5: SCORES CLINIQUES CALCULÉS */}
              {activeTab === 'scores' && (
                <div className="space-y-3">
                  {patientScores.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">Aucun score archivé.</p>
                  ) : (
                    patientScores.map(s => (
                      <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-900">{s.scoreName}</span>
                          <span className="text-xxs font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-mono">
                            {s.calculatedValue}
                          </span>
                        </div>
                        <p className="text-xxs text-slate-700">{s.interpretation}</p>
                        <p className="text-xxs text-slate-500 italic">Source : {s.referenceSource}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 6: EXPLORATIONS */}
              {activeTab === 'explorations' && (
                <div className="space-y-3">
                  {patientExplorations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">Aucune exploration médicale disponible.</p>
                  ) : (
                    patientExplorations.map(e => (
                      <div key={e.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-800">{e.title}</span>
                            <span className="ml-2 text-xxs text-slate-500">
                              Prescrit le {e.prescribedDate || e.date}
                              {e.realizationDate ? ` • Réalisé le ${e.realizationDate}` : ''}
                            </span>
                          </div>
                          <span
                            className={`text-xxs font-bold px-2 py-0.5 rounded ${
                              e.simpleStatus === 'REALISE' || e.validated
                                ? 'bg-emerald-100 text-emerald-800'
                                : e.simpleStatus === 'EN_ATTENTE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {e.simpleStatus === 'REALISE' || e.validated
                              ? 'Réalisé / Validé'
                              : e.simpleStatus === 'EN_ATTENTE'
                                ? 'En attente'
                                : 'Prescrit'}
                          </span>
                        </div>
                        {e.spirometryData && (
                          <div className="flex flex-wrap gap-2 text-xxs bg-white p-2 rounded border border-teal-100 font-mono">
                            <span>Pré-BD : VEMS {e.spirometryData.vemsPreL ?? '-'}L ({e.spirometryData.vemsPrePct ?? '-'}%) • CVF {e.spirometryData.cvfPreL ?? '-'}L • VEMS/CVF {e.spirometryData.tiffeneauPre ?? '-'}%</span>
                            <span>| Post-BD : VEMS {e.spirometryData.vemsPostL ?? '-'}L ({e.spirometryData.vemsPostPct ?? '-'}%) • VEMS/CVF {e.spirometryData.tiffeneauPost ?? '-'}%</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 pt-1 font-mono text-xxs">
                          {(e.extractedParameters || []).map((p, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white rounded border border-slate-200">
                              {p.parameter}: <strong>{p.value} {p.unit}</strong>
                            </span>
                          ))}
                        </div>
                        {e.conclusion && <p className="text-xxs text-slate-600 italic">{e.conclusion}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 7: DOCUMENTS MÉDICAUX OFFICIELS (SECTION 10) */}
              {activeTab === 'documents' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xxs font-extrabold uppercase text-slate-400">
                      Documents, Certificats & Ordonnances du Dossier
                    </span>
                    <Link
                      to="/documents"
                      className="text-xxs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Éditer / Créer dans Documents</span>
                    </Link>
                  </div>

                  {patientDocuments.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                      <FileText className="w-6 h-6 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-400 italic">Aucun document médical officiel archivé pour ce patient.</p>
                      <Link
                        to="/documents"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xxs font-bold"
                      >
                        Générer un premier document (CRH, Ordonnance...)
                      </Link>
                    </div>
                  ) : (
                    patientDocuments.map(doc => (
                      <div key={doc.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-3xs font-extrabold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                              {doc.referenceNumber}
                            </span>
                            <span className="font-bold text-slate-900">{doc.title}</span>
                          </div>
                          <span className="text-3xs font-bold text-slate-500">
                            {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-xxs text-slate-600 line-clamp-2 font-mono bg-white p-2 rounded border border-slate-100">
                          {doc.content}
                        </p>
                        <div className="flex items-center justify-between pt-1 text-3xs border-t border-slate-100">
                          <span className="text-slate-500">Praticien : <strong>{doc.signedByName || doc.createdByName}</strong></span>
                          <Link
                            to="/documents"
                            className="px-2 py-1 bg-white border border-slate-200 hover:bg-teal-50 text-teal-700 rounded-lg font-bold flex items-center gap-1 shadow-2xs"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Consulter & Imprimer</span>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 text-center text-slate-400 text-xs rounded-2xl border border-slate-200">
              Sélectionnez un patient dans la colonne de gauche.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Nouveau Patient avec État civil complet et Antécédents DPI */}
      {showNewPatientModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">
                Création d'un Nouveau Dossier Patient (DPI Complet)
              </h3>
              <button
                type="button"
                onClick={() => setShowNewPatientModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {potentialDuplicates.length > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-black text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Doublon potentiel détecté (Section 3)</span>
                </div>
                <p className="text-xxs text-amber-800">
                  Le système a identifié {potentialDuplicates.length} dossier(s) existant(s) similaire(s).
                </p>
                <div className="space-y-1 font-mono text-xxs bg-white/70 p-2 rounded border border-amber-200">
                  {potentialDuplicates.map(d => (
                    <div key={d.id} className="flex justify-between">
                      <span>{d.firstName} {d.lastName} ({d.code})</span>
                      <span>{d.phone} • {d.address}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleCreatePatient} className="space-y-5 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-black text-slate-800 uppercase tracking-wide text-xxs">1. État Civil & Identification</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={newPatientForm.firstName}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, firstName: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      value={newPatientForm.lastName}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, lastName: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">N° Dossier CHREIN</label>
                    <input
                      type="text"
                      value={newPatientForm.hospitalNumber}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, hospitalNumber: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Date de naissance</label>
                    <input
                      type="date"
                      value={newPatientForm.birthDate}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, birthDate: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Âge</label>
                    <input
                      type="number"
                      value={newPatientForm.age}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, age: Number(e.target.value) })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Sexe</label>
                    <select
                      value={newPatientForm.gender}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value as 'M' | 'F' })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    >
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Téléphone *</label>
                    <input
                      type="text"
                      required
                      value={newPatientForm.phone}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Adresse / Quartier</label>
                    <input
                      type="text"
                      value={newPatientForm.address}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, address: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Profession</label>
                    <input
                      type="text"
                      value={newPatientForm.profession}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, profession: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tél. à contacter en urgence</label>
                    <input
                      type="text"
                      value={newPatientForm.emergencyPhone}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, emergencyPhone: e.target.value })}
                      placeholder="+221 77..."
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">A. Situation matrimoniale</label>
                    <select
                      value={newPatientForm.maritalStatus}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, maritalStatus: e.target.value as MaritalStatus })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    >
                      {MARITAL_STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">B. Niveau d'études</label>
                    <select
                      value={newPatientForm.educationLevel}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, educationLevel: e.target.value as EducationLevel })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    >
                      {EDUCATION_LEVEL_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nom personne d'urgence / Allergies</label>
                    <input
                      type="text"
                      value={newPatientForm.emergencyContact}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, emergencyContact: e.target.value })}
                      placeholder="Nom du proche / tuteur"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                </div>
              </div>

              <PatientDpiHistoryEditor
                value={newPatientDpi}
                onChange={setNewPatientDpi}
                gender={newPatientForm.gender}
                compact
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewPatientModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                >
                  Créer le dossier IP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Éditer État Civil & Antécédents DPI */}
      {showEditPatientModal && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">
                Édition DPI — {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.code})
              </h3>
              <button
                type="button"
                onClick={() => setShowEditPatientModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditPatient} className="space-y-5 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-black text-slate-800 uppercase tracking-wide text-xxs">1. État Civil & Identification</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={editPatientForm.firstName}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, firstName: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      value={editPatientForm.lastName}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, lastName: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">N° Dossier CHREIN</label>
                    <input
                      type="text"
                      value={editPatientForm.hospitalNumber}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, hospitalNumber: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Âge</label>
                    <input
                      type="number"
                      value={editPatientForm.age}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, age: Number(e.target.value) })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Sexe</label>
                    <select
                      value={editPatientForm.gender}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, gender: e.target.value as 'M' | 'F' })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    >
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Téléphone</label>
                    <input
                      type="text"
                      value={editPatientForm.phone}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, phone: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tél. urgence</label>
                    <input
                      type="text"
                      value={editPatientForm.emergencyPhone}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, emergencyPhone: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Adresse</label>
                    <input
                      type="text"
                      value={editPatientForm.address}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, address: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Profession</label>
                    <input
                      type="text"
                      value={editPatientForm.profession}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, profession: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">A. Situation matrimoniale</label>
                    <select
                      value={editPatientForm.maritalStatus}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, maritalStatus: e.target.value as MaritalStatus })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    >
                      {MARITAL_STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">B. Niveau d'études</label>
                    <select
                      value={editPatientForm.educationLevel}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, educationLevel: e.target.value as EducationLevel })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    >
                      {EDUCATION_LEVEL_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Personne à contacter en urgence</label>
                    <input
                      type="text"
                      value={editPatientForm.emergencyContact}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, emergencyContact: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Allergies connues</label>
                    <input
                      type="text"
                      value={editPatientForm.allergies}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, allergies: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                </div>
              </div>

              <PatientDpiHistoryEditor
                value={editPatientDpi}
                onChange={setEditPatientDpi}
                gender={editPatientForm.gender}
                compact
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditPatientModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                >
                  Enregistrer les modifications DPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Specialized Sheet Modal (Consultation, Edition, Creation, Impression A4) */}
      {selectedPatient && specializedModalOpen && (
        <SpecializedSheetModal
          isOpen={specializedModalOpen}
          onClose={() => setSpecializedModalOpen(false)}
          record={selectedSpecializedRecord}
          patient={selectedPatient}
          initialMode={specializedModalMode}
        />
      )}
    </div>
  );
};
