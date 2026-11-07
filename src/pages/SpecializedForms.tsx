import React, { useState } from 'react';
import { useStore } from '../store';
import { SpecializedFormType, SpecializedPneumoRecord } from '../types';
import {
  FileText,
  Activity,
  HeartPulse,
  Wind,
  ShieldCheck,
  Stethoscope,
  Microscope,
  Pill,
  Save,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileCheck,
  ChevronRight,
  Printer,
  Eye,
  Edit3,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { VoiceDictationButton } from '../components/VoiceDictationButton';
import { SpecializedSheetModal, SPECIALIZED_FORM_CONFIGS } from '../components/SpecializedSheetModal';

export const SpecializedForms: React.FC = () => {
  const {
    patients,
    specializedPneumoRecords,
    saveSpecializedPneumoRecord,
    deleteSpecializedPneumoRecord,
    currentUser,
    currentCenter
  } = useStore();

  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [activeFormType, setActiveFormType] = useState<SpecializedFormType>('TUBERCULOSIS');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [previewModalRecord, setPreviewModalRecord] = useState<SpecializedPneumoRecord | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState<string | null>(null);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

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

    const targetId = editingRecordId || ('spec-' + Date.now());
    const existing = specializedPneumoRecords.find(r => r.id === targetId);

    const newRecord: SpecializedPneumoRecord = {
      id: targetId,
      patientId: selectedPatient.id,
      centerId: currentCenter?.id || 'center-1',
      doctorId: currentUser?.id || existing?.doctorId || 'doc-1',
      doctorName: currentUser?.name || existing?.doctorName || 'Dr. Pneumologue CHREIN',
      formType: activeFormType,
      date: existing?.date || new Date().toISOString(),
      title: titles[activeFormType],
      data: formData,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveSpecializedPneumoRecord(newRecord);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const patientRecords = specializedPneumoRecords.filter(r => r.patientId === selectedPatient?.id);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Formulaires Spécialisés Pneumologie & Infectiologie
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Fiches protocolisées : TB, BPCO, Asthme, PID, DDB, Pleurésie & Antibiothérapie • CHREIN
            </p>
          </div>
        </div>

        {/* Patient selection */}
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

      {/* Tabs navigation for forms */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { type: 'TUBERCULOSIS', label: 'Tuberculose (PNT)', icon: <Microscope className="w-3.5 h-3.5" /> },
          { type: 'COPD', label: 'BPCO & Tabac', icon: <Wind className="w-3.5 h-3.5" /> },
          { type: 'ASTHMA', label: 'Asthme & GINA', icon: <HeartPulse className="w-3.5 h-3.5" /> },
          { type: 'TB_SEQUELAE', label: 'Séquelles TB & 6MWT', icon: <Activity className="w-3.5 h-3.5" /> },
          { type: 'PID_IPAF', label: 'PID & Fibroses', icon: <Stethoscope className="w-3.5 h-3.5" /> },
          { type: 'BRONCHIECTASIS', label: 'DDB', icon: <Wind className="w-3.5 h-3.5" /> },
          { type: 'PLEURAL_DISEASE', label: 'Pleurésie & Drainage', icon: <FileText className="w-3.5 h-3.5" /> },
          { type: 'ANTIBIOTIC_STEWARDSHIP', label: 'Bon Usage Antibiotiques', icon: <Pill className="w-3.5 h-3.5" /> }
        ].map(tab => (
          <button
            key={tab.type}
            onClick={() => {
              setActiveFormType(tab.type as SpecializedFormType);
              setFormData({});
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeFormType === tab.type
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xxs font-extrabold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 uppercase tracking-wider">
                Protocole Spécialisé
              </span>
              <h2 className="text-base font-black text-slate-800 mt-1">
                {activeFormType === 'TUBERCULOSIS' && 'Fiche Tuberculose & Programme National Antituberculeux (PNT)'}
                {activeFormType === 'COPD' && 'Fiche d\'Évaluation BPCO, Spirométrie & Risque d\'Exacerbation'}
                {activeFormType === 'ASTHMA' && 'Fiche de Suivi de l\'Asthme, Contrôle GINA & Inhalateurs'}
                {activeFormType === 'TB_SEQUELAE' && 'Fiche Séquelles de Tuberculose & Test de Marche (6MWT)'}
                {activeFormType === 'PID_IPAF' && 'Fiche Pneumopathie Interstitielle Diffuse & Connectivite'}
                {activeFormType === 'BRONCHIECTASIS' && 'Fiche Dilatation des Bronches (DDB / Bronchectasies)'}
                {activeFormType === 'PLEURAL_DISEASE' && 'Fiche Pleurésie, Ponction & Drainage Thoracique'}
                {activeFormType === 'ANTIBIOTIC_STEWARDSHIP' && 'Fiche de Bon Usage des Antibiotiques & Réévaluation 48-72h'}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xxs text-slate-400 font-mono block">Patient actif :</span>
              <span className="text-xs font-bold text-slate-700">
                {selectedPatient?.firstName} {selectedPatient?.lastName}
              </span>
            </div>
          </div>

          {editingRecordId && (
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Mode modification :</strong> Vous éditez une fiche spécialisée existante.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingRecordId(null);
                  setFormData({});
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-800 font-bold text-xxs rounded-lg border border-amber-300 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Nouveau formulaire vierge</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* 1. TUBERCULOSE */}
            {activeFormType === 'TUBERCULOSIS' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Forme Clinique</label>
                    <select
                      value={formData.tbForm || ''}
                      onChange={(e) => handleFieldChange('tbForm', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Sélectionner la forme --</option>
                      <option value="TPM_PLUS">Tuberculose Pulmonaire à Microscopie Positive (TPM+)</option>
                      <option value="TPM_MOINS">Tuberculose Pulmonaire à Microscopie Négative (TPM-)</option>
                      <option value="TEP_PLEURALE">Tuberculose Extra-Pulmonaire : Pleurale</option>
                      <option value="TEP_GANGLION">Tuberculose Extra-Pulmonaire : Ganglionnaire</option>
                      <option value="TEP_OSSEUSE">Tuberculose Extra-Pulmonaire : Mal de Pott / Osseuse</option>
                      <option value="DISSEMINEE">Tuberculose Miliaire / Disséminée</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Bactériologie & GeneXpert MTB/RIF</label>
                    <select
                      value={formData.genexpertResult || ''}
                      onChange={(e) => handleFieldChange('genexpertResult', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Résultat GeneXpert --</option>
                      <option value="MTB_POS_RIF_SENS">MTB Détecté - Sensible à la Rifampicine</option>
                      <option value="MTB_POS_RIF_RES">MTB Détecté - RÉSISTANT à la Rifampicine (MDR/RR)</option>
                      <option value="MTB_POS_RIF_INDET">MTB Détecté - Résistance RIF indéterminée</option>
                      <option value="MTB_NEG">MTB Non Détecté</option>
                      <option value="EN_ATTENTE">En attente de résultat</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Schéma Thérapeutique</label>
                    <select
                      value={formData.regimen || ''}
                      onChange={(e) => handleFieldChange('regimen', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Régime PNT --</option>
                      <option value="2RHZE_4RH">2RHZE / 4RH (Schéma standard nouveau cas)</option>
                      <option value="RETRAITEMENT">Schéma de retraitement</option>
                      <option value="LIGNE_2_MDR">Traitement de 2ème ligne (TB Multirésistante)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Date d'initiation du traitement</label>
                    <input
                      type="date"
                      value={formData.treatmentStartDate || ''}
                      onChange={(e) => handleFieldChange('treatmentStartDate', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Observance (Supervision DOTS)</label>
                    <select
                      value={formData.adherence || ''}
                      onChange={(e) => handleFieldChange('adherence', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Observance --</option>
                      <option value="BONNE">Excellente (100% prises supervisées)</option>
                      <option value="MOYENNE">Moyenne (quelques oublis)</option>
                      <option value="RUPTURE">Rupture / Abandon temporaire</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Calendrier des Contrôles Bactériologiques (Frottis crachats)</span>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-500">Mois 2 (Fin phase intensive)</span>
                      <input
                        type="text"
                        placeholder="Négatif / Positif / Date"
                        value={formData.controlM2 || ''}
                        onChange={(e) => handleFieldChange('controlM2', e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5 mt-1"
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Mois 5 (Phase de continuation)</span>
                      <input
                        type="text"
                        placeholder="Négatif / Positif / Date"
                        value={formData.controlM5 || ''}
                        onChange={(e) => handleFieldChange('controlM5', e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5 mt-1"
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Mois 6 (Fin de traitement)</span>
                      <input
                        type="text"
                        placeholder="Négatif (Guérison) / Date"
                        value={formData.controlM6 || ''}
                        onChange={(e) => handleFieldChange('controlM6', e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5 mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. BPCO */}
            {activeFormType === 'COPD' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Stade VEMS post-BD (GOLD 1 à 4)</label>
                    <select
                      value={formData.goldStage || ''}
                      onChange={(e) => handleFieldChange('goldStage', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Stade spirométrique --</option>
                      <option value="GOLD_1">GOLD 1 : VEMS ≥ 80% (Léger)</option>
                      <option value="GOLD_2">GOLD 2 : 50% ≤ VEMS &lt; 80% (Modéré)</option>
                      <option value="GOLD_3">GOLD 3 : 30% ≤ VEMS &lt; 50% (Sévère)</option>
                      <option value="GOLD_4">GOLD 4 : VEMS &lt; 30% (Très sévère)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">VEMS mesuré (Litres et %)</label>
                    <input
                      type="text"
                      placeholder="ex: 1.45 L (48% théorique)"
                      value={formData.vemsValue || ''}
                      onChange={(e) => handleFieldChange('vemsValue', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Rapport de Tiffeneau (VEMS/CVF)</label>
                    <input
                      type="text"
                      placeholder="ex: 0.58 (&lt; 0.70 fixe)"
                      value={formData.tiffeneau || ''}
                      onChange={(e) => handleFieldChange('tiffeneau', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Score CAT (COPD Assessment Test)</label>
                    <input
                      type="number"
                      placeholder="Score de 0 à 40 (ex: 18)"
                      value={formData.catScore || ''}
                      onChange={(e) => handleFieldChange('catScore', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Éosinophiles sanguins (/µL)</label>
                    <input
                      type="number"
                      placeholder="ex: 280 (Seuil d'indication CSI : 300)"
                      value={formData.eosinophils || ''}
                      onChange={(e) => handleFieldChange('eosinophils', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Stratégie Thérapeutique Médicamenteuse</label>
                  <select
                    value={formData.treatmentPlan || ''}
                    onChange={(e) => handleFieldChange('treatmentPlan', e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  >
                    <option value="">-- Choix du traitement --</option>
                    <option value="MONO_LAMA">Monothérapie LAMA (ex: Tiotropium)</option>
                    <option value="BI_LABA_LAMA">Bithérapie LAMA + LABA (Association bronchodilatatrice)</option>
                    <option value="TRI_LABA_LAMA_CSI">Trithérapie LAMA + LABA + CSI (Exacerbateur fréquent)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 3. ASTHME */}
            {activeFormType === 'ASTHMA' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Palier Thérapeutique GINA (1 à 5)</label>
                    <select
                      value={formData.ginaStep || ''}
                      onChange={(e) => handleFieldChange('ginaStep', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Palier GINA --</option>
                      <option value="STEP_1">Palier 1 : CSI-Formotérol à faible dose à la demande</option>
                      <option value="STEP_2">Palier 2 : CSI faible dose quotidien + secours</option>
                      <option value="STEP_3">Palier 3 : CSI faible dose + LABA en fond</option>
                      <option value="STEP_4">Palier 4 : CSI dose moyenne/forte + LABA</option>
                      <option value="STEP_5">Palier 5 : CSI-LABA haute dose + Biothérapie / Phénotypage</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Évaluation de la Technique d'Inhalation</label>
                    <select
                      value={formData.inhalerTechnique || ''}
                      onChange={(e) => handleFieldChange('inhalerTechnique', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Vérification au cabinet --</option>
                      <option value="CORRECTE">Technique correcte vérifiée devant le médecin</option>
                      <option value="ERREUR_APNEE">Erreur : Pas d'apnée post-inhalation de 5-10s</option>
                      <option value="ERREUR_EXPIRATION">Erreur : Absence d'expiration complète préalable</option>
                      <option value="NON_VERIFIEE">Non vérifiée ce jour</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Facteurs Déclenchants & Comorbidités Identifiés</label>
                  <input
                    type="text"
                    placeholder="ex: Poussières saisonnières (Harmattan), fumée de bois cuisine, rhinite allergique associée, RGO"
                    value={formData.triggers || ''}
                    onChange={(e) => handleFieldChange('triggers', e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
            )}

            {/* 4. SÉQUELLES TB */}
            {activeFormType === 'TB_SEQUELAE' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Type de Lésions Séquellaires Radiologiques</label>
                    <select
                      value={formData.lesionType || ''}
                      onChange={(e) => handleFieldChange('lesionType', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Lésions dominantes --</option>
                      <option value="CAVITES_RESIDUELLES">Cavernes résiduelles détergées (Risque aspergillome)</option>
                      <option value="FIBROSE_RETRACTILE">Fibrose rétractile péri-lésionnelle</option>
                      <option value="DDB_TRACTION">Bronchectasies par traction séquellaires</option>
                      <option value="PACHYPLEURITE">Pachypleurite / Symphyse pleurale calcifiée</option>
                      <option value="DESTRUCTION_LOBE">Poumon détruit / Lobe détruit</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Test de Marche de 6 minutes (6MWT)</label>
                    <input
                      type="text"
                      placeholder="Distance (mètres), SpO2 départ et fin (ex: 380m, SpO2 96% -> 89%)"
                      value={formData.sixMinuteWalk || ''}
                      onChange={(e) => handleFieldChange('sixMinuteWalk', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Recherche de Complications Séquellaires</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {['Hémoptysie minime', 'Aspergillome intracavitaire', 'Surinfection bactérienne', 'Insuffisance respiratoire chronique'].map(comp => (
                      <label key={comp} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <input
                          type="checkbox"
                          checked={Boolean(formData[comp])}
                          onChange={(e) => handleFieldChange(comp, e.target.checked)}
                          className="h-3.5 w-3.5 text-teal-600 rounded"
                        />
                        <span className="text-xxs">{comp}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. BON USAGE DES ANTIBIOTIQUES (Section 8) */}
            {activeFormType === 'ANTIBIOTIC_STEWARDSHIP' && (
              <div className="space-y-4">
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 text-xs text-teal-900">
                  <strong>Antibiogouvernance CHREIN : </strong> Tout traitement antibiotique doit comporter une indication claire, une molécule ciblée, une durée maximale prévisionnelle et une réévaluation clinique obligatoire à J2-J3 (48h à 72h).
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Indication Documentée</label>
                    <input
                      type="text"
                      placeholder="ex: Pneumonie Aiguë Communautaire sévère, Pyothorax"
                      value={formData.indication || ''}
                      onChange={(e) => handleFieldChange('indication', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Molécule & Classe</label>
                    <input
                      type="text"
                      placeholder="ex: Ceftriaxone 2g/jour IV + Clarithromycine 500mg x2/j"
                      value={formData.molecule || ''}
                      onChange={(e) => handleFieldChange('molecule', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Voie d'administration</label>
                    <select
                      value={formData.route || ''}
                      onChange={(e) => handleFieldChange('route', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    >
                      <option value="">-- Voie --</option>
                      <option value="IV">Intraveineuse (IV)</option>
                      <option value="PO">Orale (Per os)</option>
                      <option value="IM">Intramusculaire (IM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Durée prévisionnelle (jours)</label>
                    <input
                      type="number"
                      placeholder="ex: 7"
                      value={formData.durationDays || ''}
                      onChange={(e) => handleFieldChange('durationDays', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Date de réévaluation obligatoire (J+2/J+3)</label>
                    <input
                      type="date"
                      value={formData.reassessmentDate || ''}
                      onChange={(e) => handleFieldChange('reassessmentDate', e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Critères de Réévaluation & Décision à 48h-72h</label>
                  <select
                    value={formData.reassessmentOutcome || ''}
                    onChange={(e) => handleFieldChange('reassessmentOutcome', e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  >
                    <option value="">-- Décision à 48h-72h --</option>
                    <option value="MAINTIEN">Poursuite du traitement à l'identique (Amélioration clinique)</option>
                    <option value="RELAIS_ORAL">Désescalade / Relais oral précoce (Apyrexie & stabilité)</option>
                    <option value="ADAPTATION_ANTIBIOGRAMME">Adaptation ciblée selon l'antibiogramme / bactériologie</option>
                    <option value="ARRET">Arrêt précoce (Infection bactérienne écartée)</option>
                    <option value="ESCALADE">Escalade thérapeutique (Échec clinique ou aggravation)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Fallback for other forms */}
            {!['TUBERCULOSIS', 'COPD', 'ASTHMA', 'TB_SEQUELAE', 'ANTIBIOTIC_STEWARDSHIP'].includes(activeFormType) && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 block">Constatations Spécialisées</label>
                    <VoiceDictationButton
                      value={formData.notes || ''}
                      onTranscript={(val) => handleFieldChange('notes', val)}
                      fieldName="Constatations spécialisées"
                      buttonText="Dicter constatations"
                      size="xs"
                    />
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Saisir les éléments cliniques, paramètres d'exploration et décision thérapeutique..."
                    value={formData.notes || ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-teal-600"
                  />
                </div>
              </div>
            )}

            {/* Universal Clinical Synthesis & Observations with Voice Dictation */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Notes & Synthèse Spécialisée (Dictée vocale)
                </label>
                <VoiceDictationButton
                  value={formData.clinicalSynthesis || ''}
                  onTranscript={(val) => handleFieldChange('clinicalSynthesis', val)}
                  fieldName="Synthèse clinique spécialisée"
                  buttonText="Dicter synthèse"
                  size="xs"
                />
              </div>
              <textarea
                rows={3}
                placeholder="Rédigez ou dictez les observations cliniques, l'évolution ou les consignes spécialisées du patient..."
                value={formData.clinicalSynthesis || ''}
                onChange={(e) => handleFieldChange('clinicalSynthesis', e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-teal-600"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-xs">
                {saveSuccess && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1.5 animate-bounce">
                    <CheckCircle2 className="w-4 h-4" /> Formulaire enregistré avec succès dans le DPI !
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer la fiche spécialisée</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right column: Patient's archived specialized records */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-teal-600" />
                <span>Fiches du Patient ({patientRecords.length})</span>
              </h3>
            </div>

            {patientRecords.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Aucune fiche spécialisée enregistrée pour ce dossier.
              </p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {patientRecords.map(rec => {
                  const cfg = SPECIALIZED_FORM_CONFIGS[rec.formType] || SPECIALIZED_FORM_CONFIGS.TUBERCULOSIS;
                  return (
                    <div
                      key={rec.id}
                      className={`p-3 rounded-xl border transition text-xs space-y-2 ${
                        editingRecordId === rec.id
                          ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400'
                          : 'border-slate-200 bg-slate-50/70 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className={`text-3xs font-extrabold uppercase px-1.5 py-0.5 rounded border inline-block ${cfg.color}`}>
                            {cfg.badge}
                          </span>
                          <h4 className="font-bold text-slate-900 leading-tight">{rec.title}</h4>
                          <span className="text-xxs text-slate-400 font-mono block">
                            {new Date(rec.date).toLocaleDateString('fr-FR')} • {rec.doctorName}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewModalRecord(rec);
                              setPreviewModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                            title="Consulter et Imprimer A4"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingRecordId(rec.id);
                              setActiveFormType(rec.formType);
                              setFormData(rec.data || {});
                              window.scrollTo({ top: 150, behavior: 'smooth' });
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Modifier dans le formulaire"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {sheetToDelete === rec.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteSpecializedPneumoRecord(rec.id);
                                  if (editingRecordId === rec.id) {
                                    setEditingRecordId(null);
                                    setFormData({});
                                  }
                                  setSheetToDelete(null);
                                }}
                                className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-3xs font-bold"
                              >
                                Oui
                              </button>
                              <button
                                type="button"
                                onClick={() => setSheetToDelete(null)}
                                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-3xs"
                              >
                                Non
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSheetToDelete(rec.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Supprimer la fiche"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Brief clinical summary */}
                      {rec.data?.clinicalSynthesis && (
                        <p className="text-xxs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 line-clamp-2 italic">
                          « {rec.data.clinicalSynthesis} »
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview & Print Modal */}
      {selectedPatient && previewModalOpen && previewModalRecord && (
        <SpecializedSheetModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          record={previewModalRecord}
          patient={selectedPatient}
          initialMode="view"
        />
      )}
    </div>
  );
};
