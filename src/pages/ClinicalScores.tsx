import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { ClinicalScoreCalculation } from '../types';
import {
  CLINICAL_SCORES_DEFINITIONS,
  buildAutoFilledScoreInputs
} from '../utils/clinicalScoresEngine';
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Save,
  Search,
  Stethoscope,
  TrendingUp,
  RotateCcw,
  Sparkles,
  X
} from 'lucide-react';

export { CLINICAL_SCORES_DEFINITIONS };

export const ClinicalScores: React.FC = () => {
  const {
    patients,
    consultations,
    medicalExplorations,
    clinicalScoreCalculations,
    saveClinicalScoreCalculation,
    currentUser,
    currentCenter
  } = useStore();

  const [selectedScoreId, setSelectedScoreId] = useState<ClinicalScoreCalculation['scoreId']>('CRB65');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [formInputs, setFormInputs] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [autoFilledNotice, setAutoFilledNotice] = useState(false);

  const selectedPatient = useMemo(
    () => patients.find(p => p.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const latestPatientConsultation = useMemo(() => {
    if (!selectedPatientId) return null;
    const list = consultations
      .filter(c => c.patientId === selectedPatientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list[0] || null;
  }, [consultations, selectedPatientId]);

  const applyAutoFillFromDossier = (scoreId: ClinicalScoreCalculation['scoreId']) => {
    const auto = buildAutoFilledScoreInputs(
      scoreId,
      selectedPatient,
      latestPatientConsultation?.twelveSteps || null,
      medicalExplorations
    );
    setFormInputs(auto);
    setAutoFilledNotice(Object.keys(auto).length > 0);
  };

  useEffect(() => {
    applyAutoFillFromDossier(selectedScoreId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId, selectedScoreId]);

  // Direct voice action listener for clinical scores
  useEffect(() => {
    const handleVoiceAction = (event: any) => {
      const detail = event?.detail;
      if (!detail) return;
      if (detail.actionType === 'CALCULATE_SCORE') {
        const scType = String(detail.actionData?.scoreType || detail.actionData?.scoreCalculation?.scoreId || '').toUpperCase();
        if (scType.includes('WELLS')) setSelectedScoreId('WELLS_PE');
        else if (scType.includes('GENEV')) setSelectedScoreId('GENEVA_REVISED');
        else if (scType.includes('SPESI')) setSelectedScoreId('SPESI');
        else if (scType.includes('PESI')) setSelectedScoreId('PESI');
        else if (scType.includes('CRB')) setSelectedScoreId('CRB65');
        else if (scType.includes('CURB')) setSelectedScoreId('CURB65');
        else if (scType.includes('PSI')) setSelectedScoreId('PSI_PORT');
        else if (scType.includes('MMRC')) setSelectedScoreId('mMRC');
        else if (scType.includes('CAT')) setSelectedScoreId('CAT');
        else if (scType.includes('BODE')) setSelectedScoreId('BODE');
        else if (scType.includes('GOLD')) setSelectedScoreId('GOLD_ABE');
        else if (scType.includes('ACQ')) setSelectedScoreId('ACQ');
        else if (scType.includes('ACT')) setSelectedScoreId('ACT');
        else if (scType.includes('GLASGOW')) setSelectedScoreId('GLASGOW');
        else if (scType.includes('QSOFA')) setSelectedScoreId('QSOFA');
        else if (scType.includes('SOFA')) setSelectedScoreId('SOFA');

        const scoreName = detail.actionData?.scoreCalculation?.scoreName || 'Score clinique';
        const calcVal = detail.actionData?.scoreCalculation?.calculatedValue || '';
        setVoiceNotice(`⚡ ${scoreName} calculé et consigné directement (Résultat : ${calcVal}).`);
        setTimeout(() => setVoiceNotice(null), 7000);
      }
    };
    window.addEventListener('clinical-voice-action', handleVoiceAction);
    return () => window.removeEventListener('clinical-voice-action', handleVoiceAction);
  }, []);

  const activeScoreDef =
    CLINICAL_SCORES_DEFINITIONS.find(s => s.id === selectedScoreId) || CLINICAL_SCORES_DEFINITIONS[0];

  const handleInputChange = (key: string, value: any) => {
    setFormInputs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReset = () => {
    setFormInputs({});
    setAutoFilledNotice(false);
  };

  const calculationResult = activeScoreDef.calculate(formInputs);

  const handleSaveToPatientDossier = () => {
    if (!selectedPatientId) return;
    const targetPatient = patients.find(p => p.id === selectedPatientId);

    const record: ClinicalScoreCalculation = {
      id: 'score-' + Date.now(),
      patientId: selectedPatientId,
      patientName: targetPatient ? `${targetPatient.firstName} ${targetPatient.lastName}` : 'Patient',
      centerId: currentCenter?.id || 'center-1',
      doctorId: currentUser?.id || 'doc-1',
      doctorName: currentUser?.name || 'Dr. Pneumologue CHREIN',
      scoreId: activeScoreDef.id,
      scoreName: activeScoreDef.name,
      scoreCategory: activeScoreDef.category,
      calculatedValue: calculationResult.value,
      variables: formInputs,
      missingVariables: calculationResult.missing,
      interpretation: calculationResult.interpretation,
      clinicalRecommendation: calculationResult.recommendation,
      referenceSource: activeScoreDef.reference,
      date: new Date().toISOString()
    };

    saveClinicalScoreCalculation(record);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const filteredScores = CLINICAL_SCORES_DEFINITIONS.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'ALL' || s.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {voiceNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{voiceNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setVoiceNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Bibliothèque de Scores Cliniques & Pronostiques
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              PAC (CRB-65, CURB-65, PSI) • EP (Wells, Genève, PESI/sPESI) • BPCO (CAT, mMRC, BODE, GOLD) • Asthme (ACT, ACQ) • Sepsis (qSOFA, SOFA)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Dossier patient :</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-teal-600 max-w-xs truncate"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} ({p.code} - {p.hospitalNumber || 'CHREIN'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Score catalog */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher un score (CRB-65, PSI, PESI, CAT, BODE, SOFA...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-600"
              />
            </div>

            <div className="flex flex-wrap gap-1 text-xxs font-bold">
              {[
                { id: 'ALL', label: 'Tous' },
                { id: 'PNEUMONIA', label: 'PAC / Pneumonie' },
                { id: 'EMBOLISM', label: 'Embolie Pulm.' },
                { id: 'COPD', label: 'BPCO' },
                { id: 'ASTHMA', label: 'Asthme' },
                { id: 'SEPSIS_NEURO', label: 'Sepsis / Neuro' },
                { id: 'TUBERCULOSIS', label: 'Tuberculose' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-teal-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-1 max-h-[540px] overflow-y-auto pr-1">
              {filteredScores.map(score => {
                const isSelected = score.id === selectedScoreId;
                return (
                  <button
                    key={score.id}
                    type="button"
                    onClick={() => setSelectedScoreId(score.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xxs uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {score.categoryLabel}
                      </span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />}
                    </div>
                    <h3 className={`text-xs font-bold mt-1.5 ${isSelected ? 'text-teal-900' : 'text-slate-800'}`}>
                      {score.name}
                    </h3>
                    <p className="text-xxs text-slate-500 line-clamp-2 mt-0.5">
                      {score.shortDesc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Interactive Calculator Card */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xxs font-extrabold px-2.5 py-1 rounded-md bg-teal-100 text-teal-800 uppercase tracking-wider">
                    {activeScoreDef.categoryLabel}
                  </span>
                  <span className="text-xxs text-slate-400 font-mono">ID: {activeScoreDef.id}</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  {activeScoreDef.name}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {activeScoreDef.shortDesc}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start">
                <button
                  type="button"
                  onClick={() => applyAutoFillFromDossier(activeScoreDef.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pré-remplir depuis DPI</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réinitialiser</span>
                </button>
              </div>
            </div>

            {autoFilledNotice && (
              <div className="px-3.5 py-2 rounded-xl bg-teal-50/70 border border-teal-200 text-xxs text-teal-800 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>
                  Variables disponibles extraites automatiquement du dossier patient (âge, constantes, antécédents, EFR/biologie récentes). Complétez les paramètres manquants ci-dessous.
                </span>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Paramètres & Variables Cliniques
              </h4>

              <div className="space-y-3">
                {activeScoreDef.fields.map((field) => {
                  const currentValue = formInputs[field.key];

                  if (field.type === 'boolean') {
                    return (
                      <label
                        key={field.key}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                          currentValue
                            ? 'bg-teal-50/60 border-teal-400 text-teal-950 font-semibold'
                            : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/60 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(currentValue)}
                          onChange={(e) => handleInputChange(field.key, e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                        />
                        <span className="text-xs select-none leading-relaxed">{field.label}</span>
                      </label>
                    );
                  }

                  if (field.type === 'select') {
                    return (
                      <div key={field.key} className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">
                          {field.label}
                        </label>
                        <select
                          value={currentValue !== undefined ? currentValue : ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value === '' ? '' : e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-teal-600 focus:bg-white transition"
                        >
                          <option value="">-- Sélectionner une option --</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (field.type === 'number') {
                    return (
                      <div key={field.key} className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">
                          {field.label} {field.unit && `(${field.unit})`}
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder={field.placeholder}
                          value={currentValue !== undefined ? currentValue : ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-teal-600 focus:bg-white transition"
                        />
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>

            {/* Live Result */}
            <div className="p-4 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/70 to-blue-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xxs font-extrabold uppercase tracking-widest text-teal-800 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  <span>Résultat & Conduite Médicale Recommandée</span>
                </span>
                <span className="text-base font-black text-teal-900 bg-white/90 px-3 py-1 rounded-lg border border-teal-200/80 shadow-2xs">
                  {calculationResult.value}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="font-bold text-slate-800 leading-snug">
                  {calculationResult.interpretation}
                </p>
                <p className="text-slate-600 bg-white/60 p-2.5 rounded-lg border border-teal-100/50 leading-relaxed text-xs">
                  <strong className="text-teal-950 font-bold">Orientation clinique : </strong>
                  {calculationResult.recommendation}
                </p>
              </div>

              {calculationResult.missing.length > 0 && (
                <div className="flex items-center gap-2 text-xxs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Données incomplètes : veuillez renseigner les champs en attente pour un calcul médical certifié.</span>
                </div>
              )}

              <div className="pt-2 border-t border-teal-100 flex items-center gap-1.5 text-xxs text-slate-500 font-mono">
                <BookOpen className="w-3 h-3 text-slate-400" />
                <span>Source de référence : {activeScoreDef.reference}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                {saveSuccessMsg ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Score enregistré dans le dossier du patient !
                  </span>
                ) : (
                  <span>Ce calcul sera rattaché au dossier du patient sélectionné.</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveToPatientDossier}
                disabled={calculationResult.value === 'Incomplet'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer dans le dossier</span>
              </button>
            </div>
          </div>

          {/* Historical calculations */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>Historique des scores calculés pour ce patient</span>
            </h4>

            {clinicalScoreCalculations.filter(c => c.patientId === selectedPatientId).length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Aucun score clinique archivé pour ce patient à ce jour.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {clinicalScoreCalculations
                  .filter(c => c.patientId === selectedPatientId)
                  .map(rec => (
                    <div key={rec.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{rec.scoreName}</span>
                          <span className="text-xxs px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-mono font-bold">
                            {rec.calculatedValue}
                          </span>
                        </div>
                        <p className="text-xxs text-slate-500 mt-0.5">{rec.interpretation}</p>
                        <p className="text-xxs text-slate-400">
                          Calculé le {new Date(rec.date).toLocaleDateString('fr-FR')} par {rec.doctorName}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
