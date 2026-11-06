import React from 'react';
import { useStore } from '../store';
import {
  Users,
  Wind,
  Bed,
  Stethoscope,
  Microscope,
  ShieldAlert,
  FileText,
  Activity,
  HeartPulse,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const {
    patients,
    consultations,
    hospitalizations,
    beds,
    specializedPneumoRecords,
    clinicalScoreCalculations,
    nurseVitalRecords,
    medicalExplorations,
    currentUser,
    currentCenter
  } = useStore();

  const totalPatients = patients.length;
  const activeHospitalized = hospitalizations.filter(h => h.status === 'active');
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
  const totalBeds = beds.length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Active TB cohort count
  const tbCohortCount = patients.filter(p =>
    (p.chronicConditions || '').toLowerCase().includes('tuberculo') ||
    (p.chronicConditions || '').toLowerCase().includes('tb')
  ).length;

  // Severe patients on Oxygen or VNI
  const oxygenVniCount = hospitalizations.filter(h =>
    h.status === 'active' &&
    (h.reason.toLowerCase().includes('vni') || h.reason.toLowerCase().includes('oxygène') || h.roomNumber.includes('VNI'))
  ).length;

  // Latest critical vitals (SpO2 < 90%)
  const criticalVitals = nurseVitalRecords.filter(v => v.spo2 < 92).slice(0, 3);

  // Recent consultations
  const recentConsultations = [...consultations].reverse().slice(0, 4);

  // Recent explorations
  const recentExplorations = [...medicalExplorations].reverse().slice(0, 4);

  return (
    <div className="space-y-6">

      {/* Critical Clinical Alerts Bar if any */}
      {criticalVitals.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-red-900">
            <ShieldAlert className="w-4 h-4 text-red-600 animate-bounce" />
            <span>Alertes Hypoxémie & Défaillance Respiratoire (Service CHREIN)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {criticalVitals.map(v => {
              const pt = patients.find(p => p.id === v.patientId);
              return (
                <div key={v.id} className="bg-white p-2.5 rounded-xl border border-red-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">{pt?.firstName} {pt?.lastName}</span>
                    <span className="text-xxs text-slate-500">TA: {v.bp} • FR: {v.rr}/min</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono font-black text-xs">
                      SpO2 {v.spo2}%
                    </span>
                    <span className="text-3xs text-red-600 block mt-0.5 font-bold">O2 Requis</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4 Key Clinical Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-extrabold uppercase tracking-widest text-slate-400">
              File Active Patients
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalPatients}</span>
            <span className="text-xxs text-emerald-600 font-bold">Patients uniques</span>
          </div>
          <p className="text-xxs text-slate-500">Dossiers longitudinaux informatisés</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-extrabold uppercase tracking-widest text-slate-400">
              Lits d'Hospitalisation
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Bed className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{occupiedBeds} / {totalBeds}</span>
            <span className="text-xxs text-sky-700 font-bold">{occupancyRate}% occupé</span>
          </div>
          <p className="text-xxs text-slate-500">{activeHospitalized.length} séjour(s) en cours au CHREIN</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-extrabold uppercase tracking-widest text-slate-400">
              Programme Tuberculose (PNT)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Microscope className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{tbCohortCount}</span>
            <span className="text-xxs text-amber-700 font-bold">Sous 2RHZE/4RH</span>
          </div>
          <p className="text-xxs text-slate-500">Suivi bactériologique à M2, M5, M6</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-extrabold uppercase tracking-widest text-slate-400">
              Assistance Respiratoire & VNI
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Wind className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{oxygenVniCount}</span>
            <span className="text-xxs text-violet-700 font-bold">O2 / BiPAP actif</span>
          </div>
          <p className="text-xxs text-slate-500">Surveillance paramédicale continue</p>
        </div>
      </div>

      {/* Quick Launch Cards (Cleaned of title text) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <Link
          to="/consultations"
          className="p-3.5 rounded-2xl border border-teal-200/80 bg-white hover:bg-teal-50/50 hover:border-teal-400 transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Consultation</span>
            <span className="text-xxs text-slate-500">Plan en 12 étapes</span>
          </div>
        </Link>

        <Link
          to="/documents"
          className="p-3.5 rounded-2xl border border-purple-200/80 bg-white hover:bg-purple-50/50 hover:border-purple-400 transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Documents</span>
            <span className="text-xxs text-slate-500">CRH, Ordonnances, PNT</span>
          </div>
        </Link>

        <Link
          to="/clinical-scores"
          className="p-3.5 rounded-2xl border border-sky-200/80 bg-white hover:bg-sky-50/50 hover:border-sky-400 transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Scores Cliniques</span>
            <span className="text-xxs text-slate-500">ACT, mMRC, CURB-65</span>
          </div>
        </Link>

        <Link
          to="/specialized-forms"
          className="p-3.5 rounded-2xl border border-amber-200/80 bg-white hover:bg-amber-50/50 hover:border-amber-400 transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Formulaires Fiches</span>
            <span className="text-xxs text-slate-500">TB, BPCO, Asthme, PID</span>
          </div>
        </Link>

        <Link
          to="/nursing"
          className="p-3.5 rounded-2xl border border-pink-200/80 bg-white hover:bg-pink-50/50 hover:border-pink-400 transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Paramédical</span>
            <span className="text-xxs text-slate-500">Constantes & DAR</span>
          </div>
        </Link>

        <Link
          to="/explorations"
          className="p-3.5 rounded-2xl border border-indigo-200/80 bg-white hover:bg-indigo-50/50 hover:border-indigo-400 transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Explorations</span>
            <span className="text-xxs text-slate-500">NFS, Radio, EFR</span>
          </div>
        </Link>

        <Link
          to="/research-stats"
          className="p-3.5 rounded-2xl border border-emerald-200/80 bg-white hover:bg-emerald-50/50 hover:border-emerald-400 transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Statistiques</span>
            <span className="text-xxs text-slate-500">XLSX & Recherche</span>
          </div>
        </Link>
      </div>

      {/* Main Grid: Active Beds Matrix & Recent Consultations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 cols: Active Beds Matrix */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Occupation des Lits de Pneumologie ({beds.length} lits)
              </h3>
            </div>
            <Link to="/hospitalization" className="text-xxs font-bold text-teal-600 hover:underline">
              Gérer les hospitalisations →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {beds.map(bed => {
              const isOccupied = bed.status === 'occupied';
              const hosp = hospitalizations.find(h => h.bedId === bed.id && h.status === 'active');
              return (
                <div
                  key={bed.id}
                  className={`p-3 rounded-xl border transition text-xs space-y-1 ${
                    isOccupied
                      ? 'bg-amber-50/50 border-amber-300'
                      : 'bg-emerald-50/40 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{bed.roomNumber}</span>
                    <span className={`px-1.5 py-0.5 rounded text-3xs font-extrabold uppercase ${
                      isOccupied ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                    }`}>
                      {isOccupied ? 'Occupé' : 'Libre'}
                    </span>
                  </div>
                  <span className="text-3xs text-slate-500 block truncate">{bed.serviceCategory}</span>
                  {isOccupied && (
                    <div className="pt-1 border-t border-amber-200 text-xxs font-semibold text-slate-800 truncate">
                      Patient : {bed.patientName || hosp?.patientName || 'Hospitalisé'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 6 cols: Recent Consultations (12 steps) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Dernières Consultations Pneumologiques
              </h3>
            </div>
            <Link to="/consultations" className="text-xxs font-bold text-teal-600 hover:underline">
              Voir tout →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentConsultations.map(c => (
              <div key={c.id} className="py-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{c.patientName || 'Patient'}</span>
                  <span className="text-xxs text-slate-400 font-mono">
                    {new Date(c.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="text-xxs text-slate-600 truncate">
                  <strong>Motif :</strong> {c.chiefComplaint || c.notes}
                </p>
                <div className="flex items-center justify-between pt-0.5 text-xxs">
                  <span className="text-teal-800 font-medium truncate max-w-xs">
                    {c.diagnosis}
                  </span>
                  <span className="text-slate-400 font-mono">Dr. {c.doctorName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
