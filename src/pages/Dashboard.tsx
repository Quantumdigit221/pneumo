import React from 'react';
import { useStore } from '../store';
import {
  Users,
  Wind,
  Bed,
  Stethoscope,
  Microscope,
  ShieldAlert,
  UserPlus,
  BedDouble,
  Zap,
  Scan,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const {
    patients,
    consultations,
    hospitalizations,
    beds,
    nurseVitalRecords
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
    ((h.reason || '').toLowerCase().includes('vni') ||
      (h.reason || '').toLowerCase().includes('oxygène') ||
      (h.roomNumber || '').includes('VNI'))
  ).length;

  // Latest critical vitals (SpO2 < 92%)
  const criticalVitals = nurseVitalRecords.filter(v => v.spo2 < 92).slice(0, 3);

  // Recent consultations
  const recentConsultations = [...consultations].reverse().slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Critical Clinical Alerts Bar if any */}
      {criticalVitals.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-red-900">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>Alertes Hypoxémie & Défaillance Respiratoire (Service CHREIN)</span>
            </div>
            <Link to="/nursing" className="text-xxs font-bold text-red-700 hover:underline whitespace-nowrap shrink-0">
              Ouvrir soins paramédicaux →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {criticalVitals.map(v => {
              const pt = patients.find(p => p.id === v.patientId);
              const activeHosp = hospitalizations.find(h => h.patientId === v.patientId && h.status === 'active');
              const targetPath = activeHosp
                ? `/hospitalization?hospId=${activeHosp.id}`
                : `/patients?patientId=${v.patientId}`;
              return (
                <Link
                  key={v.id}
                  to={targetPath}
                  className="bg-white hover:border-red-400 p-3 rounded-xl border border-red-200 text-xs flex items-center justify-between transition"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">
                      {pt?.firstName} {pt?.lastName}
                    </span>
                    <span className="text-xxs text-slate-500 tabular-nums">
                      TA {v.bp} · FR {v.rr}/min
                    </span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="font-mono font-extrabold text-xs text-red-700 tabular-nums block">
                      SpO2 {v.spo2}%
                    </span>
                    <span className="text-3xs text-red-600 font-semibold">O2 requis</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Workflow-Specific Action Shortcuts (distinct from left sidebar navigation) */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xxs font-extrabold uppercase tracking-wider text-slate-400 mr-1">
            Actions Rapides
          </span>
          <Link
            to="/consultations"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0"
            title="Raccourci : Alt+C"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>+ Consultation</span>
          </Link>
          <Link
            to="/patients?new=1"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0"
            title="Raccourci : Alt+P"
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-600" />
            <span>+ Nouveau Patient</span>
          </Link>
          <Link
            to="/hospitalization?admit=1"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0"
            title="Raccourci : Alt+H"
          >
            <BedDouble className="w-3.5 h-3.5 text-sky-600" />
            <span>+ Admettre en Lit</span>
          </Link>
          <Link
            to="/consultations?mode=urgency"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0"
            title="Raccourci : Alt+U"
          >
            <Zap className="w-3.5 h-3.5 text-rose-600" />
            <span>Triage Urgence</span>
          </Link>
          <Link
            to="/imaging-ai"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0"
            title="Raccourci : Alt+I"
          >
            <Scan className="w-3.5 h-3.5 text-indigo-600" />
            <span>Radio IA</span>
          </Link>
        </div>

        <span className="hidden xl:inline text-xxs font-mono text-slate-400">
          Ctrl+K : accès patient &amp; raccourcis
        </span>
      </div>

      {/* 4 Key Clinical Metric Cards (All clickable shortcuts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/patients"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xxs font-extrabold uppercase tracking-widest text-slate-400">
              File Active Patients
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{totalPatients}</span>
            <span className="text-xxs text-emerald-700 font-bold">Patients uniques</span>
          </div>
          <p className="text-xxs text-slate-500 flex items-center justify-between">
            <span>Dossiers longitudinaux (DPI)</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition" />
          </p>
        </Link>

        <Link
          to="/hospitalization"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-400 transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xxs font-extrabold uppercase tracking-widest text-slate-400">
              Lits d'Hospitalisation
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Bed className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              {occupiedBeds} / {totalBeds}
            </span>
            <span className="text-xxs text-sky-700 font-bold tabular-nums">{occupancyRate}% occupé</span>
          </div>
          <p className="text-xxs text-slate-500 flex items-center justify-between">
            <span>{activeHospitalized.length} séjour(s) actif(s)</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600 transition" />
          </p>
        </Link>

        <Link
          to="/specialized-forms"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xxs font-extrabold uppercase tracking-widest text-slate-400">
              Programme Tuberculose (PNT)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Microscope className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{tbCohortCount}</span>
            <span className="text-xxs text-amber-700 font-bold">Sous 2RHZE/4RH</span>
          </div>
          <p className="text-xxs text-slate-500 flex items-center justify-between">
            <span>Suivi M2, M5, M6</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 transition" />
          </p>
        </Link>

        <Link
          to="/hospitalization?tab=active"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-violet-400 transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xxs font-extrabold uppercase tracking-widest text-slate-400">
              Assistance Respiratoire & VNI
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Wind className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{oxygenVniCount}</span>
            <span className="text-xxs text-violet-700 font-bold">O2 / BiPAP actif</span>
          </div>
          <p className="text-xxs text-slate-500 flex items-center justify-between">
            <span>Surveillance continue</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-violet-600 transition" />
          </p>
        </Link>
      </div>

      {/* Main Grid: Active Beds Matrix & Recent Consultations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 cols: Active Beds Matrix */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Occupation des Lits ({beds.length} lits)
              </h3>
            </div>
            <Link to="/hospitalization" className="text-xxs font-bold text-teal-600 hover:underline whitespace-nowrap">
              Gérer les lits →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {beds.map(bed => {
              const isOccupied = bed.status === 'occupied';
              const hosp = hospitalizations.find(h => h.bedId === bed.id && h.status === 'active');
              const targetUrl = isOccupied && hosp
                ? `/hospitalization?hospId=${hosp.id}`
                : `/hospitalization?admit=1`;
              return (
                <Link
                  key={bed.id}
                  to={targetUrl}
                  className={`p-3 rounded-xl border transition text-xs space-y-1 block ${
                    isOccupied
                      ? 'bg-amber-50/50 border-amber-300 hover:border-amber-500'
                      : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 truncate">{bed.roomNumber}</span>
                    <span className={`text-3xs font-extrabold uppercase shrink-0 ${
                      isOccupied ? 'text-amber-800' : 'text-emerald-700'
                    }`}>
                      {isOccupied ? 'Occupé' : 'Libre'}
                    </span>
                  </div>
                  <span className="text-3xs text-slate-500 block truncate">{bed.serviceCategory}</span>
                  {isOccupied && (
                    <div className="pt-1 border-t border-amber-200/70 text-xxs font-semibold text-slate-800 truncate">
                      {bed.patientName || hosp?.patientName || 'Hospitalisé'}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right 6 cols: Recent Consultations */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Dernières Consultations
              </h3>
            </div>
            <Link to="/consultations" className="text-xxs font-bold text-teal-600 hover:underline whitespace-nowrap">
              Nouvelle consultation →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentConsultations.map(c => (
              <div key={c.id} className="py-3 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to={`/patients?patientId=${c.patientId}`}
                    className="font-bold text-slate-900 hover:text-teal-700 truncate"
                  >
                    {c.patientName || 'Patient'}
                  </Link>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xxs text-slate-400 font-mono tabular-nums">
                      {c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '--'}
                    </span>
                    <Link
                      to={`/consultations?patientId=${c.patientId}`}
                      className="text-3xs font-bold text-teal-700 hover:underline whitespace-nowrap"
                    >
                      Consulter →
                    </Link>
                  </div>
                </div>
                <p className="text-xxs text-slate-600 truncate">
                  <strong>Motif :</strong> {c.chiefComplaint || c.notes}
                </p>
                <div className="flex items-center justify-between pt-0.5 text-xxs text-slate-500">
                  <span className="text-teal-800 font-medium truncate max-w-xs">
                    {c.diagnosis}
                  </span>
                  <span className="text-slate-400 font-mono shrink-0">Dr. {c.doctorName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
