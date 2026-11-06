import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Patient } from '../types';
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
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Patients: React.FC = () => {
  const {
    patients,
    addPatient,
    updatePatient,
    consultations,
    hospitalizations,
    specializedPneumoRecords,
    clinicalScoreCalculations,
    medicalExplorations,
    medicalDocuments,
    currentCenter,
    findDuplicatePatients
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patients[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'info' | 'consultations' | 'hospitalizations' | 'specialized' | 'scores' | 'explorations' | 'documents'>('info');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  // New patient modal state
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '1985-06-15',
    age: 41,
    gender: 'M' as const,
    phone: '+221 ',
    address: 'Kaolack',
    hospitalNumber: 'CHREIN-PNEUMO-2026-',
    profession: '',
    emergencyContact: '',
    allergies: '',
    chronicConditions: '',
    smokingPackYears: 0,
    biomassExposure: false
  });

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
          p.firstName.toLowerCase().includes(query) ||
          p.lastName.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          (p.hospitalNumber && p.hospitalNumber.toLowerCase().includes(query)) ||
          p.phone.includes(query) ||
          (p.chronicConditions && p.chronicConditions.toLowerCase().includes(query))
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

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    const newCode = `IP-2026-${String(patients.length + 1).padStart(4, '0')}`;
    const newRecord: Patient = {
      id: 'p-' + Date.now(),
      centerId: currentCenter?.id || 'center-1',
      code: newCode,
      hospitalNumber: newPatientForm.hospitalNumber || `CHREIN-${newCode}`,
      firstName: newPatientForm.firstName,
      lastName: newPatientForm.lastName,
      birthDate: newPatientForm.birthDate,
      age: Number(newPatientForm.age || 40),
      gender: newPatientForm.gender,
      phone: newPatientForm.phone,
      address: newPatientForm.address,
      profession: newPatientForm.profession,
      emergencyContact: newPatientForm.emergencyContact,
      allergies: newPatientForm.allergies,
      chronicConditions: newPatientForm.chronicConditions,
      smokingHistory: {
        isSmoker: newPatientForm.smokingPackYears > 0,
        packYears: Number(newPatientForm.smokingPackYears || 0),
        biomassExposure: newPatientForm.biomassExposure
      },
      createdAt: new Date().toISOString()
    };

    addPatient(newRecord);
    setSelectedPatientId(newRecord.id);
    setShowNewPatientModal(false);
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
                    {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
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

                <div className="flex items-center gap-2">
                  <Link
                    to="/consultations"
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    + Nouvelle Consultation
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
                <div className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">
                        Coordonnées & État Civil
                      </span>
                      <p><strong>Téléphone :</strong> {selectedPatient.phone}</p>
                      <p><strong>Adresse :</strong> {selectedPatient.address}</p>
                      <p><strong>Profession :</strong> {selectedPatient.profession || 'Non renseignée'}</p>
                      <p><strong>Contact d'urgence :</strong> {selectedPatient.emergencyContact || 'Non renseigné'}</p>
                      <p><strong>Date de naissance :</strong> {selectedPatient.birthDate}</p>
                    </div>

                    <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200 space-y-2">
                      <span className="text-xxs font-bold text-teal-900 uppercase tracking-widest block">
                        Facteurs de Risque Respiratoires (Section 4)
                      </span>
                      <p>
                        <strong>Tabagisme : </strong>
                        {selectedPatient.smokingHistory?.packYears ? `${selectedPatient.smokingHistory.packYears} Paquets-Années (PA)` : 'Non-fumeur'}
                      </p>
                      <p>
                        <strong>Exposition Biomasse : </strong>
                        {selectedPatient.smokingHistory?.biomassExposure ? 'OUI (Cuisine feu de bois/charbon)' : 'NON'}
                      </p>
                      <p>
                        <strong>Allergies / Terrain : </strong>
                        {selectedPatient.allergies || 'Pas d\'allergie connue'}
                      </p>
                      <p>
                        <strong>Conditions Chroniques : </strong>
                        <span className="font-semibold text-teal-950">{selectedPatient.chronicConditions || 'Aucune'}</span>
                      </p>
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
                            Chambre {h.roomNumber} ({h.status === 'active' ? 'Séjour en cours' : 'Séjour clos'})
                          </span>
                          <span className="text-xxs font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                            Entrée le {new Date(h.admissionDate).toLocaleDateString('fr-FR')}
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
                <div className="space-y-3">
                  {patientSpecialized.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">Aucune fiche spécialisée rédigée.</p>
                  ) : (
                    patientSpecialized.map(r => (
                      <div key={r.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{r.title}</span>
                          <span className="text-xxs font-mono text-slate-500">
                            {new Date(r.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-xxs text-slate-600 font-mono bg-white p-2 rounded border border-slate-100">
                          {JSON.stringify(r.data)}
                        </p>
                      </div>
                    ))
                  )}
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
                      <div key={e.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{e.title}</span>
                          <span className="text-xxs text-emerald-700 font-bold">Validé conforme</span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1 font-mono text-xxs">
                          {e.extractedParameters.map((p, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white rounded border border-slate-200">
                              {p.parameter}: <strong>{p.value} {p.unit}</strong>
                            </span>
                          ))}
                        </div>
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

      {/* Modal: Nouveau Patient avec détection de doublons (Section 3) */}
      {showNewPatientModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">
                Création d'un Nouveau Dossier Patient
              </h3>
              <button
                onClick={() => setShowNewPatientModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* DUPLICATE WARNING BANNER (Section 3) */}
            {potentialDuplicates.length > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-black text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Doublon potentiel détecté (Cahier des charges — Section 3)</span>
                </div>
                <p className="text-xxs text-amber-800">
                  Le système a identifié {potentialDuplicates.length} dossier(s) existant(s) avec des coordonnées similaires. La fusion automatique est strictement proscrite.
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

            <form onSubmit={handleCreatePatient} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={newPatientForm.firstName}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, firstName: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={newPatientForm.lastName}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, lastName: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">N° Hospitalier CHREIN</label>
                  <input
                    type="text"
                    value={newPatientForm.hospitalNumber}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, hospitalNumber: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Âge</label>
                  <input
                    type="number"
                    value={newPatientForm.age}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, age: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sexe</label>
                  <select
                    value={newPatientForm.gender}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={newPatientForm.phone}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quartier / Adresse (Kaolack)</label>
                  <input
                    type="text"
                    value={newPatientForm.address}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, address: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tabagisme (Paquets-Années)</label>
                  <input
                    type="number"
                    value={newPatientForm.smokingPackYears}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, smokingPackYears: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPatientForm.biomassExposure}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, biomassExposure: e.target.checked })}
                      className="h-4 w-4 text-teal-600 rounded"
                    />
                    <span className="font-bold text-slate-700">Exposition feux de bois / biomasse</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pathologie Principale / Antécédents respiratoires</label>
                <input
                  type="text"
                  placeholder="ex: Tuberculose TPM+, BPCO, Asthme, PID..."
                  value={newPatientForm.chronicConditions}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, chronicConditions: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

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
    </div>
  );
};
