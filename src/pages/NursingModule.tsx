import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import {
  NurseVitalRecord,
  NurseRespiratoryRecord,
  FluidBalanceRecord,
  NurseAdministeredMed,
  NurseTargetedTransmission
} from '../types';
import {
  HeartPulse,
  Activity,
  Wind,
  Droplet,
  Pill,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Clock,
  UserCheck,
  Calendar,
  Save,
  ShieldAlert,
  Search,
  Filter
} from 'lucide-react';

export const NursingModule: React.FC = () => {
  const {
    patients,
    hospitalizations,
    nurseVitalRecords,
    nurseRespiratoryRecords,
    fluidBalanceRecords,
    nurseAdministeredMeds,
    nurseTargetedTransmissions,
    addNurseVitalRecord,
    addNurseRespiratoryRecord,
    addFluidBalanceRecord,
    addNurseAdministeredMed,
    addNurseTargetedTransmission,
    currentUser,
    currentCenter
  } = useStore();

  const [activeTab, setActiveTab] = useState<'VITALS' | 'RESPIRATORY' | 'FLUID' | 'MEDS' | 'TRANSMISSIONS'>('VITALS');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const activeHospitalization = hospitalizations.find(h => h.patientId === selectedPatient?.id && h.status === 'active');

  // Vitals form state
  const [vitalsForm, setVitalsForm] = useState({
    bp: '125/80',
    pulse: 78,
    rr: 20,
    spo2: 95,
    temperature: 37.2,
    bloodGlucose: 1.05,
    painEva: 1,
    consciousnessGlasgow: 15
  });

  // Respiratory form state
  const [respForm, setRespForm] = useState({
    o2FlowLiters: 2,
    device: 'LUNETTES' as const,
    vniIpap: 14,
    vniEpap: 5,
    vniFio2: 40,
    tolerance: 'BONNE' as const,
    notes: 'Respiration calme, pas de tirage ni de battement des ailes du nez.'
  });

  // Fluid balance form state
  const [fluidForm, setFluidForm] = useState({
    period: '24H' as const,
    oralIntakeMl: 1200,
    ivInfusionMl: 1000,
    diuresisMl: 1600,
    stoolStomasMl: 200,
    vomitingMl: 0
  });

  // Administered Med form state
  const [medForm, setMedForm] = useState({
    medicineName: 'Ceftriaxone 1g',
    dose: '1g IVD',
    route: 'IV' as const,
    scheduledTime: '08:00',
    status: 'ADMINISTRE' as const,
    notes: 'Injecté lentement sur 5 minutes. Bonne tolérance.'
  });

  // Targeted Transmission form state
  const [transForm, setTransForm] = useState({
    target: 'Dyspnée & Encombrement bronchique',
    data: 'Patient polypnéique à 26 cycles/min, SpO2 à 91% en air ambiant. Toux grasse productive avec expectorations purulentes.',
    action: 'Mise sous oxygène à 2 L/min par lunettes nasales, séance d\'aérosol de Salbutamol réalisée, kinésithérapie de désencombrement.',
    result: 'SpO2 remontée à 96% sous 2L O2. Respiration plus fluide, patient soulagé.'
  });

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Listen for direct clinical voice actions
  useEffect(() => {
    const handleVoiceAction = (event: any) => {
      const detail = event?.detail;
      if (!detail) return;

      if (detail.actionType === 'ADD_NURSING_DAR') {
        setActiveTab('TRANSMISSIONS');
        if (detail.actionData?.transmission) {
          const t = detail.actionData.transmission;
          setTransForm(prev => ({
            ...prev,
            target: t.target || prev.target,
            data: t.data || prev.data,
            action: t.action || prev.action,
            result: t.result || prev.result
          }));
        }
        showNotification(`⚡ Transmission DAR enregistrée directement par l'assistante vocale.`);
      } else if (detail.actionType === 'RECORD_VITALS' && detail.actionData?.vitals) {
        setActiveTab('VITALS');
        const v = detail.actionData.vitals;
        setVitalsForm(prev => ({
          ...prev,
          bp: v.bp || prev.bp,
          pulse: Number(v.pulse) || prev.pulse,
          rr: Number(v.rr) || prev.rr,
          spo2: Number(v.spo2Ambient) || prev.spo2,
          temperature: Number(v.temperature) || prev.temperature
        }));
        showNotification(`⚡ Constantes injectées et enregistrées directement par l'assistante vocale.`);
      }
    };

    window.addEventListener('clinical-voice-action', handleVoiceAction);
    return () => {
      window.removeEventListener('clinical-voice-action', handleVoiceAction);
    };
  }, []);

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const newRecord: NurseVitalRecord = {
      id: 'vital-' + Date.now(),
      patientId: selectedPatient.id,
      hospitalizationId: activeHospitalization?.id,
      centerId: currentCenter?.id || 'center-1',
      timestamp: new Date().toISOString(),
      bp: vitalsForm.bp,
      pulse: Number(vitalsForm.pulse),
      rr: Number(vitalsForm.rr),
      spo2: Number(vitalsForm.spo2),
      temperature: Number(vitalsForm.temperature),
      bloodGlucose: Number(vitalsForm.bloodGlucose),
      painEva: Number(vitalsForm.painEva),
      consciousnessGlasgow: Number(vitalsForm.consciousnessGlasgow),
      nurseName: currentUser?.name || 'Infirmière CHREIN'
    };
    addNurseVitalRecord(newRecord);
    showNotification('Constantes vitales enregistrées avec succès.');
  };

  const handleSaveRespiratory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const newRecord: NurseRespiratoryRecord = {
      id: 'resp-' + Date.now(),
      patientId: selectedPatient.id,
      hospitalizationId: activeHospitalization?.id,
      centerId: currentCenter?.id || 'center-1',
      timestamp: new Date().toISOString(),
      o2FlowLiters: Number(respForm.o2FlowLiters),
      device: respForm.device,
      vniParameters: respForm.device.startsWith('VNI') ? {
        ipap: Number(respForm.vniIpap),
        epap: Number(respForm.vniEpap),
        fio2: Number(respForm.vniFio2)
      } : undefined,
      tolerance: respForm.tolerance,
      notes: respForm.notes,
      nurseName: currentUser?.name || 'Infirmière CHREIN'
    };
    addNurseRespiratoryRecord(newRecord);
    showNotification('Surveillance respiratoire enregistrée.');
  };

  const handleSaveFluid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const totalIntake = Number(fluidForm.oralIntakeMl || 0) + Number(fluidForm.ivInfusionMl || 0);
    const totalOutput = Number(fluidForm.diuresisMl || 0) + Number(fluidForm.stoolStomasMl || 0) + Number(fluidForm.vomitingMl || 0);
    const netBalance = totalIntake - totalOutput;

    const newRecord: FluidBalanceRecord = {
      id: 'fluid-' + Date.now(),
      patientId: selectedPatient.id,
      hospitalizationId: activeHospitalization?.id,
      centerId: currentCenter?.id || 'center-1',
      date: new Date().toISOString().split('T')[0],
      period: fluidForm.period,
      oralIntakeMl: Number(fluidForm.oralIntakeMl || 0),
      ivInfusionMl: Number(fluidForm.ivInfusionMl || 0),
      diuresisMl: Number(fluidForm.diuresisMl || 0),
      stoolStomasMl: Number(fluidForm.stoolStomasMl || 0),
      vomitingMl: Number(fluidForm.vomitingMl || 0),
      netBalanceMl: netBalance,
      nurseName: currentUser?.name || 'Infirmière CHREIN'
    };
    addFluidBalanceRecord(newRecord);
    showNotification(`Bilan hydrique enregistré (Balance: ${netBalance > 0 ? '+' : ''}${netBalance} mL).`);
  };

  const handleSaveMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const newRecord: NurseAdministeredMed = {
      id: 'admin-' + Date.now(),
      patientId: selectedPatient.id,
      hospitalizationId: activeHospitalization?.id,
      centerId: currentCenter?.id || 'center-1',
      medicineName: medForm.medicineName,
      dose: medForm.dose,
      route: medForm.route,
      scheduledTime: medForm.scheduledTime,
      administeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: medForm.status,
      nurseName: currentUser?.name || 'Infirmière CHREIN',
      nurseSignature: `Signé numériquement par ${currentUser?.name || 'Infirmière CHREIN'} [${new Date().toLocaleString('fr-FR')}]`,
      notes: medForm.notes
    };
    addNurseAdministeredMed(newRecord);
    showNotification('Administration réelle du médicament enregistrée et signée.');
  };

  const handleSaveTransmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const newRecord: NurseTargetedTransmission = {
      id: 'trans-' + Date.now(),
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      hospitalizationId: activeHospitalization?.id,
      centerId: currentCenter?.id || 'center-1',
      timestamp: new Date().toISOString(),
      target: transForm.target,
      data: transForm.data,
      action: transForm.action,
      result: transForm.result,
      nurseName: currentUser?.name || 'Infirmière CHREIN',
      nurseSignature: `${currentUser?.name || 'Infirmière CHREIN'} (${currentUser?.role || 'NURSE'})`
    };
    addNurseTargetedTransmission(newRecord);
    showNotification('Transmission ciblée (DAR) horodatée et archivée.');
  };

  // Filter records for selected patient
  const patientVitals = nurseVitalRecords.filter(r => r.patientId === selectedPatient?.id);
  const patientResp = nurseRespiratoryRecords.filter(r => r.patientId === selectedPatient?.id);
  const patientFluids = fluidBalanceRecords.filter(r => r.patientId === selectedPatient?.id);
  const patientMeds = nurseAdministeredMeds.filter(r => r.patientId === selectedPatient?.id);
  const patientTrans = nurseTargetedTransmissions.filter(r => r.patientId === selectedPatient?.id);

  // Latest vitals alert checks
  const latestVital = patientVitals[0];
  const isHypoxemic = latestVital && latestVital.spo2 < 90;
  const isTachypneic = latestVital && latestVital.rr >= 28;
  const isFebrile = latestVital && latestVital.temperature >= 38.5;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Module Paramédical & Soins Infirmiers
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Constantes, surveillance respiratoire O2/VNI, bilan hydrique, administrations réelles et transmissions ciblées (DAR) • CHREIN
            </p>
          </div>
        </div>

        {/* Patient selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Patient :</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-teal-600 max-w-xs"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} ({p.code} - {p.hospitalNumber || 'CHREIN'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Alert Banner if critical vitals */}
      {(isHypoxemic || isTachypneic || isFebrile) && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-900 text-xs">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 animate-bounce" />
          <div className="flex-1">
            <strong>Alerte Constantes Vitales : </strong>
            {isHypoxemic && <span className="font-bold underline mr-2">Désaturation SpO2 ({latestVital.spo2}%)</span>}
            {isTachypneic && <span className="font-bold underline mr-2">Tachypnée sévère ({latestVital.rr}/min)</span>}
            {isFebrile && <span className="font-bold underline">Hyperthermie ({latestVital.temperature}°C)</span>}
            <span className="text-slate-600 block text-xxs mt-0.5">
              Prévenir le médecin de garde de Pneumologie CHREIN et adapter l'oxygénothérapie.
            </span>
          </div>
        </div>
      )}

      {/* Hospitalization status header pill */}
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-700">Dossier : {selectedPatient?.firstName} {selectedPatient?.lastName}</span>
          <span className="text-xxs px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-mono font-bold">
            {selectedPatient?.code}
          </span>
          {activeHospitalization ? (
            <span className="text-xxs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              Hospitalisé en Chambre {activeHospitalization.roomNumber}
            </span>
          ) : (
            <span className="text-xxs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
              Suivi externe / Ambulatoire
            </span>
          )}
        </div>
        <div className="text-xxs text-slate-500">
          Soignant connecté : <strong className="text-slate-700">{currentUser?.name}</strong>
        </div>
      </div>

      {/* Navigation Tabs for Paramédical sub-modules */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'VITALS', label: 'Constantes Vitales', icon: <Activity className="w-4 h-4" /> },
          { id: 'RESPIRATORY', label: 'Surveillance Respiratoire & O2', icon: <Wind className="w-4 h-4" /> },
          { id: 'FLUID', label: 'Bilan Hydrique 24h', icon: <Droplet className="w-4 h-4" /> },
          { id: 'MEDS', label: 'Administrations Réelles', icon: <Pill className="w-4 h-4" /> },
          { id: 'TRANSMISSIONS', label: 'Transmissions Ciblées (DAR)', icon: <MessageSquare className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Notification toast */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form for current active tab */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {/* TAB 1: VITALS */}
          {activeTab === 'VITALS' && (
            <form onSubmit={handleSaveVitals} className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Saisie des Constantes Vitales</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Tension Artérielle (TA)</label>
                  <input
                    type="text"
                    value={vitalsForm.bp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bp: e.target.value })}
                    placeholder="120/80"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Pouls (FC bpm)</label>
                  <input
                    type="number"
                    value={vitalsForm.pulse}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Fréq. Resp. (FR /min)</label>
                  <input
                    type="number"
                    value={vitalsForm.rr}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, rr: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono font-bold text-teal-700"
                  />
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Saturation SpO2 (%)</label>
                  <input
                    type="number"
                    value={vitalsForm.spo2}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: Number(e.target.value) })}
                    className={`w-full text-xs bg-slate-50 border rounded-xl p-2 font-mono font-black ${
                      vitalsForm.spo2 < 90 ? 'border-red-400 text-red-600 bg-red-50' : 'border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Température (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsForm.temperature}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Glycémie (g/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={vitalsForm.bloodGlucose}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bloodGlucose: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Douleur (EVA 0 à 10)</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={vitalsForm.painEva}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, painEva: Number(e.target.value) })}
                    className="w-full text-teal-600 accent-teal-600"
                  />
                  <div className="flex justify-between text-xxs text-slate-500 font-mono mt-0.5">
                    <span>0 (Nulle)</span>
                    <span className="font-bold text-teal-700">{vitalsForm.painEva} / 10</span>
                    <span>10 (Insoutenable)</span>
                  </div>
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Conscience (Glasgow /15)</label>
                  <select
                    value={vitalsForm.consciousnessGlasgow}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, consciousnessGlasgow: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2"
                  >
                    <option value={15}>15/15 - Conscience normale / Parfaitement orienté</option>
                    <option value={14}>14/15 - Somnolence légère</option>
                    <option value={12}>12/15 - Confusion modérée</option>
                    <option value={9}>9/15 - Obnubilation</option>
                    <option value={8}>8/15 ou moins - Coma (Alerte réa)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer les constantes</span>
              </button>
            </form>
          )}

          {/* TAB 2: RESPIRATORY */}
          {activeTab === 'RESPIRATORY' && (
            <form onSubmit={handleSaveRespiratory} className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Wind className="w-4 h-4 text-teal-600" />
                <span>Surveillance Respiratoire & Oxygène</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Dispositif d'administration</label>
                  <select
                    value={respForm.device}
                    onChange={(e) => setRespForm({ ...respForm, device: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  >
                    <option value="AIR_AMBIANT">Air ambiant (Sans oxygène)</option>
                    <option value="LUNETTES">Lunettes nasales d'O2</option>
                    <option value="MASQUE_SIMPLE">Masque facial simple</option>
                    <option value="MASQUE_HAUTE_CONCENTRATION">Masque à Haute Concentration (MHC)</option>
                    <option value="VNI_CPAP">VNI : Mode CPAP (Pression continue)</option>
                    <option value="VNI_BIPAP">VNI : Mode BiPAP (Bipression)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Débit d'Oxygène (L/min)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={respForm.o2FlowLiters}
                    onChange={(e) => setRespForm({ ...respForm, o2FlowLiters: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono font-bold text-teal-700"
                  />
                </div>
              </div>

              {respForm.device.startsWith('VNI') && (
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 space-y-2">
                  <span className="text-xxs font-bold text-teal-900 uppercase tracking-wider block">
                    Réglages du Respirateur de VNI
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xxs text-slate-600 block">IPAP (cmH2O)</label>
                      <input
                        type="number"
                        value={respForm.vniIpap}
                        onChange={(e) => setRespForm({ ...respForm, vniIpap: Number(e.target.value) })}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-xxs text-slate-600 block">EPAP (cmH2O)</label>
                      <input
                        type="number"
                        value={respForm.vniEpap}
                        onChange={(e) => setRespForm({ ...respForm, vniEpap: Number(e.target.value) })}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-xxs text-slate-600 block">FiO2 (%)</label>
                      <input
                        type="number"
                        value={respForm.vniFio2}
                        onChange={(e) => setRespForm({ ...respForm, vniFio2: Number(e.target.value) })}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xxs font-bold text-slate-600 block mb-1">Tolérance du patient</label>
                <select
                  value={respForm.tolerance}
                  onChange={(e) => setRespForm({ ...respForm, tolerance: e.target.value as any })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                >
                  <option value="BONNE">Bonne tolérance / Confortable</option>
                  <option value="AGITATION">Agitation / Intolérance du masque</option>
                  <option value="FUITE">Fuites d'air importantes au masque</option>
                  <option value="ENCOMBREMENT">Encombrement bronchique majeur (Aspiration requise)</option>
                </select>
              </div>

              <div>
                <label className="text-xxs font-bold text-slate-600 block mb-1">Observations infirmières</label>
                <textarea
                  rows={2}
                  value={respForm.notes}
                  onChange={(e) => setRespForm({ ...respForm, notes: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-teal-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer la surveillance respiratoire</span>
              </button>
            </form>
          )}

          {/* TAB 3: FLUID BALANCE */}
          {activeTab === 'FLUID' && (
            <form onSubmit={handleSaveFluid} className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Droplet className="w-4 h-4 text-teal-600" />
                <span>Bilan Hydrique Entrées / Sorties</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
                  <span className="text-xxs font-black text-emerald-800 uppercase tracking-wider block">
                    Apports (Entrées mL)
                  </span>
                  <div>
                    <label className="text-xxs text-slate-600 block">Boissons / Repas (mL)</label>
                    <input
                      type="number"
                      value={fluidForm.oralIntakeMl}
                      onChange={(e) => setFluidForm({ ...fluidForm, oralIntakeMl: Number(e.target.value) })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-xxs text-slate-600 block">Perfusions IV / Médicaments (mL)</label>
                    <input
                      type="number"
                      value={fluidForm.ivInfusionMl}
                      onChange={(e) => setFluidForm({ ...fluidForm, ivInfusionMl: Number(e.target.value) })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                  <span className="text-xxs font-black text-amber-800 uppercase tracking-wider block">
                    Pertes (Sorties mL)
                  </span>
                  <div>
                    <label className="text-xxs text-slate-600 block">Diurèse (Urine mL)</label>
                    <input
                      type="number"
                      value={fluidForm.diuresisMl}
                      onChange={(e) => setFluidForm({ ...fluidForm, diuresisMl: Number(e.target.value) })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-xxs text-slate-600 block">Selles / Vomissements (mL)</label>
                    <input
                      type="number"
                      value={fluidForm.stoolStomasMl}
                      onChange={(e) => setFluidForm({ ...fluidForm, stoolStomasMl: Number(e.target.value) })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic balance calculation preview */}
              {(() => {
                const totalIn = Number(fluidForm.oralIntakeMl || 0) + Number(fluidForm.ivInfusionMl || 0);
                const totalOut = Number(fluidForm.diuresisMl || 0) + Number(fluidForm.stoolStomasMl || 0) + Number(fluidForm.vomitingMl || 0);
                const diff = totalIn - totalOut;
                return (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span>Balance calculée sur la période :</span>
                    <span className={`font-mono font-black text-sm ${diff >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {diff > 0 ? '+' : ''}{diff} mL
                    </span>
                  </div>
                );
              })()}

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Valider le bilan hydrique</span>
              </button>
            </form>
          )}

          {/* TAB 4: MEDICATIONS REAL ADMINISTRATION */}
          {activeTab === 'MEDS' && (
            <form onSubmit={handleSaveMed} className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Pill className="w-4 h-4 text-teal-600" />
                <span>Administration Réelle de Médicaments (Traçabilité)</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Médicament prescrit</label>
                  <input
                    type="text"
                    value={medForm.medicineName}
                    onChange={(e) => setMedForm({ ...medForm, medicineName: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Posologie administrée</label>
                  <input
                    type="text"
                    value={medForm.dose}
                    onChange={(e) => setMedForm({ ...medForm, dose: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Voie</label>
                  <select
                    value={medForm.route}
                    onChange={(e) => setMedForm({ ...medForm, route: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  >
                    <option value="IV">Intraveineuse (IV)</option>
                    <option value="PO">Orale (Per os)</option>
                    <option value="INHALATION">Aérosol / Inhalation</option>
                    <option value="SC">Sous-cutanée (SC)</option>
                    <option value="IM">Intramusculaire (IM)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Heure prévue</label>
                  <input
                    type="time"
                    value={medForm.scheduledTime}
                    onChange={(e) => setMedForm({ ...medForm, scheduledTime: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-600 block mb-1">Statut</label>
                  <select
                    value={medForm.status}
                    onChange={(e) => setMedForm({ ...medForm, status: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  >
                    <option value="ADMINISTRE">Administré</option>
                    <option value="REFUSE">Refusé par patient</option>
                    <option value="REPORTE">Reporté</option>
                    <option value="NON_DISPONIBLE">Non disponible</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xxs font-bold text-slate-600 block mb-1">Notes & tolérance immédiate</label>
                <input
                  type="text"
                  value={medForm.notes}
                  onChange={(e) => setMedForm({ ...medForm, notes: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xxs text-slate-600 flex items-center justify-between">
                <span>Signataire infirmier : <strong className="text-slate-800">{currentUser?.name}</strong></span>
                <span className="font-mono text-teal-700">Horodatage automatique</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer & Signer l'administration</span>
              </button>
            </form>
          )}

          {/* TAB 5: TRANSMISSIONS CIBLÉES (DAR) */}
          {activeTab === 'TRANSMISSIONS' && (
            <form onSubmit={handleSaveTransmission} className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                <span>Transmission Ciblée Horodatée (Méthode DAR)</span>
              </h3>

              <div>
                <label className="text-xxs font-bold text-slate-600 block mb-1">Cible (Symptôme, Événement ou Problème de soins)</label>
                <input
                  type="text"
                  placeholder="ex: Détresse respiratoire, Fièvre à 39°C, Hémoptysie, Douleur thoracique..."
                  value={transForm.target}
                  onChange={(e) => setTransForm({ ...transForm, target: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-teal-900"
                />
              </div>

              <div>
                <label className="text-xxs font-bold text-slate-600 block mb-1">
                  <strong className="text-teal-700">D — Données : </strong> Constatations cliniques objectives & subjectives
                </label>
                <textarea
                  rows={2}
                  value={transForm.data}
                  onChange={(e) => setTransForm({ ...transForm, data: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="text-xxs font-bold text-slate-600 block mb-1">
                  <strong className="text-teal-700">A — Actions : </strong> Soins prodigués, alertes données, prescriptions appliquées
                </label>
                <textarea
                  rows={2}
                  value={transForm.action}
                  onChange={(e) => setTransForm({ ...transForm, action: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="text-xxs font-bold text-slate-600 block mb-1">
                  <strong className="text-teal-700">R — Résultats : </strong> Évolution constatée après soins
                </label>
                <textarea
                  rows={2}
                  value={transForm.result}
                  onChange={(e) => setTransForm({ ...transForm, result: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-teal-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Archiver & Signer la transmission</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Historical logs and curves for the patient */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Historique Récent ({activeTab})</span>
              <span className="text-xxs font-mono text-slate-400">CHREIN Kaolack</span>
            </h3>

            {/* Content display based on tab */}
            {activeTab === 'VITALS' && (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                {patientVitals.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3">Aucune constante enregistrée pour ce patient.</p>
                ) : (
                  patientVitals.map(v => (
                    <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xxs text-slate-500">
                          {new Date(v.timestamp).toLocaleString('fr-FR')}
                        </span>
                        <span className="text-xxs font-bold text-slate-600">{v.nurseName}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-center">
                        <div className="bg-white p-1 rounded border border-slate-100">
                          <span className="text-xxs text-slate-400 block">TA</span>
                          <span className="font-bold">{v.bp}</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-slate-100">
                          <span className="text-xxs text-slate-400 block">SpO2</span>
                          <span className={`font-bold ${v.spo2 < 90 ? 'text-red-600' : 'text-teal-700'}`}>{v.spo2}%</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-slate-100">
                          <span className="text-xxs text-slate-400 block">FR</span>
                          <span className="font-bold">{v.rr}/m</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-slate-100">
                          <span className="text-xxs text-slate-400 block">T°C</span>
                          <span className="font-bold">{v.temperature}°</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'RESPIRATORY' && (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                {patientResp.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3">Aucune surveillance respiratoire saisie.</p>
                ) : (
                  patientResp.map(r => (
                    <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-800">{r.device} ({r.o2FlowLiters} L/min)</span>
                        <span className="text-xxs text-slate-500">{new Date(r.timestamp).toLocaleTimeString('fr-FR')}</span>
                      </div>
                      <p className="text-xxs text-slate-600">{r.notes}</p>
                      <span className="text-xxs text-slate-400 block">Infirmier : {r.nurseName}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'FLUID' && (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                {patientFluids.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3">Aucun bilan hydrique enregistré.</p>
                ) : (
                  patientFluids.map(f => (
                    <div key={f.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">Bilan du {f.date} ({f.period})</span>
                        <span className={`font-mono font-bold ${f.netBalanceMl >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {f.netBalanceMl > 0 ? '+' : ''}{f.netBalanceMl} mL
                        </span>
                      </div>
                      <div className="flex gap-4 text-xxs text-slate-500">
                        <span>Entrées : {f.oralIntakeMl + f.ivInfusionMl} mL</span>
                        <span>Sorties : {f.diuresisMl + (f.stoolStomasMl || 0)} mL</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'MEDS' && (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                {patientMeds.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3">Aucune administration tracée.</p>
                ) : (
                  patientMeds.map(m => (
                    <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{m.medicineName} ({m.dose})</span>
                        <span className="text-xxs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {m.status} à {m.administeredAt}
                        </span>
                      </div>
                      <p className="text-xxs text-slate-600">{m.notes}</p>
                      <p className="text-xxs text-teal-700 font-mono italic">{m.nurseSignature}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'TRANSMISSIONS' && (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {patientTrans.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3">Aucune transmission ciblée archivée.</p>
                ) : (
                  patientTrans.map(t => (
                    <div key={t.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1">
                        <span className="font-extrabold text-teal-900">CIBLE : {t.target}</span>
                        <span className="text-xxs text-slate-400 font-mono">
                          {new Date(t.timestamp).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-xxs leading-relaxed">
                        <strong className="text-slate-800">D : </strong> {t.data}
                      </p>
                      <p className="text-xxs leading-relaxed">
                        <strong className="text-slate-800">A : </strong> {t.action}
                      </p>
                      <p className="text-xxs leading-relaxed">
                        <strong className="text-slate-800">R : </strong> {t.result}
                      </p>
                      <div className="pt-1 text-xxs text-slate-500 font-mono text-right">
                        Signé par {t.nurseSignature}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
