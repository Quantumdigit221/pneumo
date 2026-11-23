import React from 'react';
import {
  ConsumptionStatus,
  ObgynHistory,
  OccupationalExposureProfile,
  PatientConsumptions,
  SmokingPeriod,
  SmokingStatus,
  SurgicalHistoryEntry
} from '../types';
import {
  MEDICAL_ANTECEDENTS_OPTIONS,
  OCCUPATIONAL_EXPOSURE_OPTIONS,
  calcPackYears,
  sumSmokingPeriodsPA
} from '../utils/dpiConstants';
import { Plus, Trash2, Flame, ShieldAlert, Briefcase, Scissors, Heart } from 'lucide-react';

export interface DpiAntecedentsValue {
  smokingStatus: SmokingStatus;
  cigarettesPerDay: number;
  smokingDurationYears: number;
  smokingStoppedYear: string;
  smokingPeriods: SmokingPeriod[];
  smokingPackYears: number;
  biomassExposure: boolean;
  passiveSmoking: boolean;
  cannabis: { status: ConsumptionStatus; frequency: string; duration: string };
  alcohol: { status: ConsumptionStatus; frequency: string; quantity: string };
  otherDrugs: { status: 'OUI' | 'NON' | 'NON_RENSEIGNE'; substance: string; frequency: string; duration: string; route: string };
  medicalAntecedents: string[];
  medicalAntecedentsOther: string;
  occupationalProfile: OccupationalExposureProfile;
  surgicalHistory: SurgicalHistoryEntry[];
  obgynHistory: ObgynHistory;
}

export const createEmptyDpiAntecedents = (profession?: string): DpiAntecedentsValue => ({
  smokingStatus: 'JAMAIS',
  cigarettesPerDay: 0,
  smokingDurationYears: 0,
  smokingStoppedYear: '',
  smokingPeriods: [],
  smokingPackYears: 0,
  biomassExposure: false,
  passiveSmoking: false,
  cannabis: { status: 'JAMAIS', frequency: '', duration: '' },
  alcohol: { status: 'JAMAIS', frequency: '', quantity: '' },
  otherDrugs: { status: 'NON_RENSEIGNE', substance: '', frequency: '', duration: '', route: '' },
  medicalAntecedents: [],
  medicalAntecedentsOther: '',
  occupationalProfile: {
    currentProfession: profession || '',
    previousProfessions: '',
    exposures: [],
    otherExposures: '',
    durationYears: undefined,
    exposureConditions: ''
  },
  surgicalHistory: [],
  obgynHistory: {}
});

interface Props {
  value: DpiAntecedentsValue;
  onChange: (next: DpiAntecedentsValue) => void;
  gender?: 'M' | 'F';
  compact?: boolean;
}

const ANTECEDENT_SHORTCUTS: { label: string; items: string[] }[] = [
  { label: 'HTA + Diabète', items: ['Hypertension artérielle', 'Diabète'] },
  { label: 'Terrain Respiratoire Chronique (Asthme/BPCO)', items: ['Asthme', 'BPCO'] },
  { label: 'ATCD TB + VIH', items: ['Tuberculose antérieure', 'Infection à VIH'] },
  { label: 'Aucun antécédent médical connu', items: [] }
];

export const PatientDpiHistoryEditor: React.FC<Props> = ({ value, onChange, gender = 'M', compact = false }) => {
  const [showObgynAnyway, setShowObgynAnyway] = React.useState(false);

  const updateSmoking = (patch: Partial<DpiAntecedentsValue>) => {
    const next = { ...value, ...patch };
    if (next.smokingStatus === 'JAMAIS') {
      next.smokingPackYears = 0;
    } else if (next.smokingPeriods.length > 0) {
      next.smokingPackYears = sumSmokingPeriodsPA(next.smokingPeriods);
    } else {
      next.smokingPackYears = calcPackYears(next.cigarettesPerDay, next.smokingDurationYears);
    }
    onChange(next);
  };

  const addSmokingPeriod = () => {
    const cig = Number(value.cigarettesPerDay || 10);
    const yrs = Number(value.smokingDurationYears || 5);
    const newPeriod: SmokingPeriod = {
      id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: `Période ${value.smokingPeriods.length + 1}`,
      cigarettesPerDay: cig,
      durationYears: yrs,
      stopYear: value.smokingStoppedYear || '',
      packYears: calcPackYears(cig, yrs)
    };
    const nextPeriods = [...value.smokingPeriods, newPeriod];
    onChange({
      ...value,
      smokingPeriods: nextPeriods,
      smokingPackYears: sumSmokingPeriodsPA(nextPeriods)
    });
  };

  const updateSmokingPeriod = (id: string, patch: Partial<SmokingPeriod>) => {
    const nextPeriods = value.smokingPeriods.map(p => {
      if (p.id !== id) return p;
      const merged = { ...p, ...patch };
      merged.packYears = calcPackYears(merged.cigarettesPerDay, merged.durationYears);
      return merged;
    });
    onChange({
      ...value,
      smokingPeriods: nextPeriods,
      smokingPackYears: sumSmokingPeriodsPA(nextPeriods)
    });
  };

  const removeSmokingPeriod = (id: string) => {
    const nextPeriods = value.smokingPeriods.filter(p => p.id !== id);
    const totalPA = nextPeriods.length > 0
      ? sumSmokingPeriodsPA(nextPeriods)
      : calcPackYears(value.cigarettesPerDay, value.smokingDurationYears);
    onChange({
      ...value,
      smokingPeriods: nextPeriods,
      smokingPackYears: value.smokingStatus === 'JAMAIS' ? 0 : totalPA
    });
  };

  const toggleAntecedent = (item: string) => {
    const exists = value.medicalAntecedents.includes(item);
    const next = exists
      ? value.medicalAntecedents.filter(x => x !== item)
      : [...value.medicalAntecedents, item];
    onChange({ ...value, medicalAntecedents: next });
  };

  const toggleExposure = (id: string) => {
    const current = value.occupationalProfile.exposures || [];
    const exists = current.includes(id);
    const nextExp = exists ? current.filter(x => x !== id) : [...current, id];
    onChange({
      ...value,
      biomassExposure: id === 'BIOMASSE' ? !exists : value.biomassExposure,
      occupationalProfile: { ...value.occupationalProfile, exposures: nextExp }
    });
  };

  const addSurgicalEntry = () => {
    onChange({
      ...value,
      surgicalHistory: [
        ...value.surgicalHistory,
        { id: `surg-${Date.now()}`, procedure: '', dateOrYear: '', complications: '' }
      ]
    });
  };

  const updateSurgicalEntry = (id: string, patch: Partial<SurgicalHistoryEntry>) => {
    onChange({
      ...value,
      surgicalHistory: value.surgicalHistory.map(s => (s.id === id ? { ...s, ...patch } : s))
    });
  };

  const removeSurgicalEntry = (id: string) => {
    onChange({
      ...value,
      surgicalHistory: value.surgicalHistory.filter(s => s.id !== id)
    });
  };

  return (
    <div className={compact ? 'space-y-4 text-xs' : 'space-y-5 text-xs'}>
      {/* A. TABAGISME */}
      <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-black text-amber-950 uppercase tracking-wide text-xxs">
            <Flame className="w-4 h-4 text-amber-600" />
            <span>A. Tabagisme (Calcul automatique en Paquets-Années)</span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 font-mono font-black text-amber-900 text-xs">
            Total : {value.smokingPackYears} Paquets-Années (PA)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="text-xxs font-bold text-slate-700 block mb-1">Statut tabagique</label>
            <select
              value={value.smokingStatus}
              onChange={(e) => updateSmoking({ smokingStatus: e.target.value as SmokingStatus })}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-semibold"
            >
              <option value="JAMAIS">Jamais fumeur</option>
              <option value="ACTUEL">Fumeur actuel</option>
              <option value="ANCIEN">Ancien fumeur</option>
            </select>
          </div>

          {value.smokingStatus !== 'JAMAIS' && (
            <>
              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1">Cigarettes / jour</label>
                <input
                  type="number"
                  min={0}
                  value={value.cigarettesPerDay || ''}
                  onChange={(e) => updateSmoking({ cigarettesPerDay: Number(e.target.value) })}
                  placeholder="Ex: 20"
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-mono"
                />
              </div>
              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1">Durée (années)</label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={value.smokingDurationYears || ''}
                  onChange={(e) => updateSmoking({ smokingDurationYears: Number(e.target.value) })}
                  placeholder="Ex: 15"
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-mono"
                />
              </div>
              {value.smokingStatus === 'ANCIEN' ? (
                <div>
                  <label className="text-xxs font-bold text-slate-700 block mb-1">Année d'arrêt</label>
                  <input
                    type="text"
                    value={value.smokingStoppedYear}
                    onChange={(e) => updateSmoking({ smokingStoppedYear: e.target.value })}
                    placeholder="Ex: 2021"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-mono"
                  />
                </div>
              ) : (
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addSmokingPeriod}
                    className="w-full px-2.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg border border-amber-300 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Période variable</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {value.smokingStatus !== 'JAMAIS' && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xxs text-amber-900">
              <span>Formule : PA = (cigarettes/jour × durée en années) / 20</span>
              {value.smokingStatus === 'ANCIEN' && (
                <button
                  type="button"
                  onClick={addSmokingPeriod}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg border border-amber-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Ajouter plusieurs périodes (consommation variable)</span>
                </button>
              )}
            </div>

            {value.smokingPeriods.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {value.smokingPeriods.map((period, idx) => (
                  <div key={period.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-amber-200">
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={period.label || `Période ${idx + 1}`}
                        onChange={(e) => updateSmokingPeriod(period.id, { label: e.target.value })}
                        placeholder="Période"
                        className="w-full text-xxs border border-slate-200 rounded px-2 py-1"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min={0}
                        value={period.cigarettesPerDay}
                        onChange={(e) => updateSmokingPeriod(period.id, { cigarettesPerDay: Number(e.target.value) })}
                        placeholder="Cig/j"
                        className="w-full text-xxs border border-slate-200 rounded px-2 py-1 font-mono"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        value={period.durationYears}
                        onChange={(e) => updateSmokingPeriod(period.id, { durationYears: Number(e.target.value) })}
                        placeholder="Ans"
                        className="w-full text-xxs border border-slate-200 rounded px-2 py-1 font-mono"
                      />
                    </div>
                    <div className="col-span-2 text-right font-mono font-bold text-amber-900 text-xxs">
                      {period.packYears} PA
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => removeSmokingPeriod(period.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={value.passiveSmoking}
            onChange={(e) => onChange({ ...value, passiveSmoking: e.target.checked })}
            className="h-4 w-4 text-teal-600 rounded"
          />
          <span>Tabagisme passif (domicile ou milieu professionnel)</span>
        </label>
      </div>

      {/* B. AUTRES CONSOMMATIONS */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <span className="font-black text-slate-800 uppercase tracking-wide text-xxs block">
          B. Autres consommations (Cannabis, Alcool, Autres substances)
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Cannabis */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
            <label className="font-bold text-slate-700 text-xxs block">Cannabis</label>
            <select
              value={value.cannabis.status}
              onChange={(e) =>
                onChange({ ...value, cannabis: { ...value.cannabis, status: e.target.value as ConsumptionStatus } })
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5"
            >
              <option value="JAMAIS">Jamais</option>
              <option value="ACTUEL">Actuel</option>
              <option value="ANCIEN">Ancien</option>
            </select>
            {value.cannabis.status !== 'JAMAIS' && (
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={value.cannabis.frequency}
                  onChange={(e) => onChange({ ...value, cannabis: { ...value.cannabis, frequency: e.target.value } })}
                  placeholder="Fréquence (ex: 2/sem)"
                  className="text-xxs border border-slate-200 rounded px-2 py-1"
                />
                <input
                  type="text"
                  value={value.cannabis.duration}
                  onChange={(e) => onChange({ ...value, cannabis: { ...value.cannabis, duration: e.target.value } })}
                  placeholder="Durée (ex: 5 ans)"
                  className="text-xxs border border-slate-200 rounded px-2 py-1"
                />
              </div>
            )}
          </div>

          {/* Alcool */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
            <label className="font-bold text-slate-700 text-xxs block">Alcool</label>
            <select
              value={value.alcohol.status}
              onChange={(e) =>
                onChange({ ...value, alcohol: { ...value.alcohol, status: e.target.value as ConsumptionStatus } })
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5"
            >
              <option value="JAMAIS">Jamais</option>
              <option value="ACTUEL">Actuel</option>
              <option value="ANCIEN">Ancien</option>
            </select>
            {value.alcohol.status !== 'JAMAIS' && (
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={value.alcohol.frequency}
                  onChange={(e) => onChange({ ...value, alcohol: { ...value.alcohol, frequency: e.target.value } })}
                  placeholder="Fréquence"
                  className="text-xxs border border-slate-200 rounded px-2 py-1"
                />
                <input
                  type="text"
                  value={value.alcohol.quantity}
                  onChange={(e) => onChange({ ...value, alcohol: { ...value.alcohol, quantity: e.target.value } })}
                  placeholder="Quantité (verres/j)"
                  className="text-xxs border border-slate-200 rounded px-2 py-1"
                />
              </div>
            )}
          </div>

          {/* Autres drogues */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
            <label className="font-bold text-slate-700 text-xxs block">Autres drogues / toxiques</label>
            <select
              value={value.otherDrugs.status}
              onChange={(e) =>
                onChange({
                  ...value,
                  otherDrugs: { ...value.otherDrugs, status: e.target.value as 'OUI' | 'NON' | 'NON_RENSEIGNE' }
                })
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5"
            >
              <option value="NON_RENSEIGNE">Non renseigné</option>
              <option value="NON">Non</option>
              <option value="OUI">Oui</option>
            </select>
            {value.otherDrugs.status === 'OUI' && (
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={value.otherDrugs.substance}
                  onChange={(e) => onChange({ ...value, otherDrugs: { ...value.otherDrugs, substance: e.target.value } })}
                  placeholder="Substance"
                  className="text-xxs border border-slate-200 rounded px-2 py-1"
                />
                <input
                  type="text"
                  value={value.otherDrugs.route}
                  onChange={(e) => onChange({ ...value, otherDrugs: { ...value.otherDrugs, route: e.target.value } })}
                  placeholder="Voie (inhalée, IV...)"
                  className="text-xxs border border-slate-200 rounded px-2 py-1"
                />
                <input
                  type="text"
                  value={value.otherDrugs.frequency}
                  onChange={(e) => onChange({ ...value, otherDrugs: { ...value.otherDrugs, frequency: e.target.value } })}
                  placeholder="Fréquence"
                  className="text-xxs border border-slate-200 rounded px-2 py-1"
                />
                <input
                  type="text"
                  value={value.otherDrugs.duration}
                  onChange={(e) => onChange({ ...value, otherDrugs: { ...value.otherDrugs, duration: e.target.value } })}
                  placeholder="Durée"
                  className="text-xxs border border-slate-200 rounded px-2 py-1"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* C. ANTÉCÉDENTS MÉDICAUX ET TERRAINS PARTICULIERS */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-black text-slate-800 uppercase tracking-wide text-xxs">
            <ShieldAlert className="w-4 h-4 text-teal-600" />
            <span>C. Antécédents médicaux et terrains particuliers</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ANTECEDENT_SHORTCUTS.map((sc) => (
              <button
                key={sc.label}
                type="button"
                onClick={() => onChange({ ...value, medicalAntecedents: sc.items })}
                className="px-2 py-1 text-3xs font-bold rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 cursor-pointer"
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {MEDICAL_ANTECEDENTS_OPTIONS.map((item) => {
            const checked = value.medicalAntecedents.includes(item);
            return (
              <label
                key={item}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                  checked ? 'bg-teal-50 border-teal-400 text-teal-950 font-semibold' : 'bg-slate-50/70 border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAntecedent(item)}
                  className="h-4 w-4 text-teal-600 rounded"
                />
                <span className="text-xs">{item}</span>
              </label>
            );
          })}
        </div>

        <div>
          <label className="text-xxs font-bold text-slate-600 block mb-1">Autres antécédents médicaux (à préciser)</label>
          <input
            type="text"
            value={value.medicalAntecedentsOther}
            onChange={(e) => onChange({ ...value, medicalAntecedentsOther: e.target.value })}
            placeholder="Ex: Lupus, polyarthrite rhumatoïde, épilepsie, RGO..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {/* D. EXPOSITIONS PROFESSIONNELLES ET ENVIRONNEMENTALES */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 font-black text-slate-800 uppercase tracking-wide text-xxs">
          <Briefcase className="w-4 h-4 text-indigo-600" />
          <span>D. Expositions professionnelles et environnementales</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xxs font-bold text-slate-700 block mb-1">Profession actuelle</label>
            <input
              type="text"
              value={value.occupationalProfile.currentProfession || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  occupationalProfile: { ...value.occupationalProfile, currentProfession: e.target.value }
                })
              }
              placeholder="Ex: Maçon, Agriculteur, Commerçant..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
            />
          </div>
          <div>
            <label className="text-xxs font-bold text-slate-700 block mb-1">Professions antérieures</label>
            <input
              type="text"
              value={value.occupationalProfile.previousProfessions || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  occupationalProfile: { ...value.occupationalProfile, previousProfessions: e.target.value }
                })
              }
              placeholder="Ex: Soudeur, Tailleur de pierre..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
            />
          </div>
          <div>
            <label className="text-xxs font-bold text-slate-700 block mb-1">Durée d'exposition (années)</label>
            <input
              type="number"
              min={0}
              value={value.occupationalProfile.durationYears ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  occupationalProfile: {
                    ...value.occupationalProfile,
                    durationYears: e.target.value === '' ? undefined : Number(e.target.value)
                  }
                })
              }
              placeholder="Ex: 12"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {OCCUPATIONAL_EXPOSURE_OPTIONS.map((exp) => {
            const checked = (value.occupationalProfile.exposures || []).includes(exp.id);
            return (
              <label
                key={exp.id}
                className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition ${
                  checked ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-semibold' : 'bg-slate-50/70 border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleExposure(exp.id)}
                  className="mt-0.5 h-4 w-4 text-indigo-600 rounded"
                />
                <span className="text-xxs leading-snug">{exp.label}</span>
              </label>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xxs font-bold text-slate-600 block mb-1">Précision autres expositions</label>
            <input
              type="text"
              value={value.occupationalProfile.otherExposures || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  occupationalProfile: { ...value.occupationalProfile, otherExposures: e.target.value }
                })
              }
              placeholder="Ex: Poussières d'arachide, ciment, fiente d'oiseaux..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
            />
          </div>
          <div>
            <label className="text-xxs font-bold text-slate-600 block mb-1">Conditions d'exposition (ventilation, EPI...)</label>
            <input
              type="text"
              value={value.occupationalProfile.exposureConditions || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  occupationalProfile: { ...value.occupationalProfile, exposureConditions: e.target.value }
                })
              }
              placeholder="Ex: Travail en local clos sans masque, cuisine au bois..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
            />
          </div>
        </div>
      </div>

      {/* E. ANTÉCÉDENTS CHIRURGICAUX */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-slate-800 uppercase tracking-wide text-xxs">
            <Scissors className="w-4 h-4 text-slate-600" />
            <span>E. Antécédents chirurgicaux</span>
          </div>
          <button
            type="button"
            onClick={addSurgicalEntry}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xxs rounded-lg inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter une intervention</span>
          </button>
        </div>

        {value.surgicalHistory.length === 0 ? (
          <p className="text-xxs text-slate-400 italic">Aucune intervention chirurgicale renseignée.</p>
        ) : (
          <div className="space-y-2">
            {value.surgicalHistory.map((entry) => (
              <div key={entry.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={entry.procedure}
                    onChange={(e) => updateSurgicalEntry(entry.id, { procedure: e.target.value })}
                    placeholder="Type d'intervention (ex: Appendicectomie, Décortication pleurale...)"
                    className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={entry.dateOrYear}
                    onChange={(e) => updateSurgicalEntry(entry.id, { dateOrYear: e.target.value })}
                    placeholder="Année / Date"
                    className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={entry.complications || ''}
                    onChange={(e) => updateSurgicalEntry(entry.id, { complications: e.target.value })}
                    placeholder="Complications éventuelles (ou Suites simples)"
                    className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5"
                  />
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeSurgicalEntry(entry.id)}
                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* F. ANTÉCÉDENTS GYNÉCOLOGIQUES ET OBSTÉTRICAUX */}
      {(gender === 'F' || showObgynAnyway) ? (
        <div className="p-4 bg-rose-50/40 rounded-xl border border-rose-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-rose-950 uppercase tracking-wide text-xxs">
              <Heart className="w-4 h-4 text-rose-600" />
              <span>F. Antécédents gynécologiques et obstétricaux</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="text-xxs font-bold text-slate-700 block mb-1">Gestité (G)</label>
              <input
                type="number"
                min={0}
                value={value.obgynHistory.gestite ?? ''}
                onChange={(e) =>
                  onChange({
                    ...value,
                    obgynHistory: { ...value.obgynHistory, gestite: e.target.value === '' ? undefined : Number(e.target.value) }
                  })
                }
                placeholder="Ex: 3"
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="text-xxs font-bold text-slate-700 block mb-1">Parité (P)</label>
              <input
                type="number"
                min={0}
                value={value.obgynHistory.parite ?? ''}
                onChange={(e) =>
                  onChange({
                    ...value,
                    obgynHistory: { ...value.obgynHistory, parite: e.target.value === '' ? undefined : Number(e.target.value) }
                  })
                }
                placeholder="Ex: 2"
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="text-xxs font-bold text-slate-700 block mb-1">Fausses couches / Avortements</label>
              <input
                type="number"
                min={0}
                value={value.obgynHistory.miscarriagesOrAbortions ?? ''}
                onChange={(e) =>
                  onChange({
                    ...value,
                    obgynHistory: {
                      ...value.obgynHistory,
                      miscarriagesOrAbortions: e.target.value === '' ? undefined : Number(e.target.value)
                    }
                  })
                }
                placeholder="0"
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="text-xxs font-bold text-slate-700 block mb-1">Date dernières règles (DDR)</label>
              <input
                type="date"
                value={value.obgynHistory.lastMenstrualPeriod || ''}
                onChange={(e) =>
                  onChange({ ...value, obgynHistory: { ...value.obgynHistory, lastMenstrualPeriod: e.target.value } })
                }
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
            <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-rose-200 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value.obgynHistory.isPregnant)}
                onChange={(e) =>
                  onChange({ ...value, obgynHistory: { ...value.obgynHistory, isPregnant: e.target.checked } })
                }
                className="h-4 w-4 text-rose-600 rounded"
              />
              <span className="font-bold text-rose-900">Grossesse en cours</span>
            </label>

            {value.obgynHistory.isPregnant && (
              <div>
                <label className="text-xxs font-bold text-slate-700 block mb-1">Âge gestationnel (SA)</label>
                <input
                  type="number"
                  min={1}
                  max={44}
                  value={value.obgynHistory.gestationalAgeWeeks ?? ''}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      obgynHistory: {
                        ...value.obgynHistory,
                        gestationalAgeWeeks: e.target.value === '' ? undefined : Number(e.target.value)
                      }
                    })
                  }
                  placeholder="Ex: 24 SA"
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                />
              </div>
            )}

            <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value.obgynHistory.menopause)}
                onChange={(e) =>
                  onChange({ ...value, obgynHistory: { ...value.obgynHistory, menopause: e.target.checked } })
                }
                className="h-4 w-4 text-rose-600 rounded"
              />
              <span className="font-semibold text-slate-700">Ménopause</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-xxs font-bold text-slate-700 block mb-1">Contraception</label>
              <input
                type="text"
                value={value.obgynHistory.contraception || ''}
                onChange={(e) =>
                  onChange({ ...value, obgynHistory: { ...value.obgynHistory, contraception: e.target.value } })
                }
                placeholder="Ex: Pilule, Implant, DIU, Aucune..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="text-xxs font-bold text-slate-700 block mb-1">Complications obstétricales</label>
              <input
                type="text"
                value={value.obgynHistory.obstetricComplications || ''}
                onChange={(e) =>
                  onChange({ ...value, obgynHistory: { ...value.obgynHistory, obstetricComplications: e.target.value } })
                }
                placeholder="Ex: Pré-éclampsie, césarienne, hémorragie..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="text-xxs font-bold text-slate-700 block mb-1">Autres antécédents gynécologiques</label>
              <input
                type="text"
                value={value.obgynHistory.otherGynHistory || ''}
                onChange={(e) =>
                  onChange({ ...value, obgynHistory: { ...value.obgynHistory, otherGynHistory: e.target.value } })
                }
                placeholder="Ex: Fibromes, kyste ovarien..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowObgynAnyway(true)}
            className="text-xxs text-slate-400 hover:text-slate-600 underline cursor-pointer"
          >
            Afficher la rubrique F. Antécédents gynéco-obstétricaux
          </button>
        </div>
      )}
    </div>
  );
};

export function extractConsumptionsFromDpi(dpi: DpiAntecedentsValue): PatientConsumptions {
  return {
    smoking: {
      status: dpi.smokingStatus,
      cigarettesPerDay: dpi.cigarettesPerDay,
      durationYears: dpi.smokingDurationYears,
      stoppedYear: dpi.smokingStoppedYear,
      packYears: dpi.smokingPackYears,
      periods: dpi.smokingPeriods,
      biomassExposure: dpi.biomassExposure || dpi.occupationalProfile.exposures.includes('BIOMASSE'),
      passiveSmoking: dpi.passiveSmoking
    },
    cannabis: dpi.cannabis,
    alcohol: dpi.alcohol,
    otherDrugs: dpi.otherDrugs
  };
}

export function buildDpiFromPatient(patient?: {
  profession?: string;
  allergies?: string;
  chronicConditions?: string;
  medicalAntecedents?: { selected: string[]; other?: string };
  smokingHistory?: any;
  consumptions?: PatientConsumptions;
  occupationalExposures?: OccupationalExposureProfile;
  surgicalHistory?: SurgicalHistoryEntry[];
  obgynHistory?: ObgynHistory;
} | null): DpiAntecedentsValue {
  const base = createEmptyDpiAntecedents(patient?.profession);
  if (!patient) return base;

  const sm = patient.consumptions?.smoking || patient.smokingHistory;
  const inferredStatus: SmokingStatus =
    sm?.status || (sm?.stoppedYear ? 'ANCIEN' : sm?.isSmoker || (sm?.packYears && sm.packYears > 0) ? 'ACTUEL' : 'JAMAIS');

  const selectedAntecedents = patient.medicalAntecedents?.selected ? [...patient.medicalAntecedents.selected] : [];
  if (selectedAntecedents.length === 0 && patient.chronicConditions) {
    for (const opt of MEDICAL_ANTECEDENTS_OPTIONS) {
      const keyword = opt.split(' ')[0].toLowerCase();
      if (patient.chronicConditions.toLowerCase().includes(keyword)) {
        selectedAntecedents.push(opt);
      }
    }
  }

  return {
    ...base,
    smokingStatus: inferredStatus,
    cigarettesPerDay: sm?.cigarettesPerDay || 0,
    smokingDurationYears: sm?.durationYears || 0,
    smokingStoppedYear: sm?.stoppedYear || '',
    smokingPeriods: sm?.periods || [],
    smokingPackYears: sm?.packYears || 0,
    biomassExposure: Boolean(sm?.biomassExposure || patient.occupationalExposures?.exposures?.includes('BIOMASSE')),
    passiveSmoking: Boolean(sm?.passiveSmoking),
    cannabis: {
      status: patient.consumptions?.cannabis?.status || 'JAMAIS',
      frequency: patient.consumptions?.cannabis?.frequency || '',
      duration: patient.consumptions?.cannabis?.duration || ''
    },
    alcohol: {
      status: patient.consumptions?.alcohol?.status || 'JAMAIS',
      frequency: patient.consumptions?.alcohol?.frequency || '',
      quantity: patient.consumptions?.alcohol?.quantity || ''
    },
    otherDrugs: {
      status: patient.consumptions?.otherDrugs?.status || 'NON_RENSEIGNE',
      substance: patient.consumptions?.otherDrugs?.substance || '',
      frequency: patient.consumptions?.otherDrugs?.frequency || '',
      duration: patient.consumptions?.otherDrugs?.duration || '',
      route: patient.consumptions?.otherDrugs?.route || ''
    },
    medicalAntecedents: selectedAntecedents,
    medicalAntecedentsOther: patient.medicalAntecedents?.other || '',
    occupationalProfile: {
      currentProfession: patient.occupationalExposures?.currentProfession || patient.profession || '',
      previousProfessions: patient.occupationalExposures?.previousProfessions || '',
      exposures: patient.occupationalExposures?.exposures || (sm?.biomassExposure ? ['BIOMASSE'] : []),
      otherExposures: patient.occupationalExposures?.otherExposures || '',
      durationYears: patient.occupationalExposures?.durationYears,
      exposureConditions: patient.occupationalExposures?.exposureConditions || ''
    },
    surgicalHistory: patient.surgicalHistory || [],
    obgynHistory: patient.obgynHistory || {}
  };
}
