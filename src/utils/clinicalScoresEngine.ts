import { ClinicalDiagnosis, ClinicalScoreCalculation, ConsultationTwelveSteps, MedicalExploration, Patient } from '../types';

export interface ScoreFieldOption {
  label: string;
  value: any;
  points?: number;
}

export interface ScoreFieldDefinition {
  key: string;
  label: string;
  type: 'select' | 'number' | 'boolean';
  options?: ScoreFieldOption[];
  unit?: string;
  placeholder?: string;
  defaultValue?: any;
}

export interface ScoreDefinition {
  id: ClinicalScoreCalculation['scoreId'];
  name: string;
  category: ClinicalScoreCalculation['scoreCategory'];
  categoryLabel: string;
  shortDesc: string;
  reference: string;
  fields: ScoreFieldDefinition[];
  calculate: (inputs: Record<string, any>) => {
    value: number | string;
    interpretation: string;
    recommendation: string;
    missing: string[];
    details: Record<string, any>;
  };
}

export const CLINICAL_SCORES_DEFINITIONS: ScoreDefinition[] = [
  // ------------------------------------------------------------------
  // PNEUMONIES AIGUËS COMMUNAUTAIRES (PAC) : CRB-65, CURB-65, PSI (Port)
  // ------------------------------------------------------------------
  {
    id: 'CRB65',
    name: 'Score CRB-65 (PAC sans biologie)',
    category: 'PNEUMONIA',
    categoryLabel: 'Pneumonie (PAC)',
    shortDesc: 'Score clinique rapide (0 à 4) pour évaluer la gravité d\'une pneumonie aiguë communautaire sans dosage biologique.',
    reference: 'Bauer TT et al. J Intern Med 2006; SPLF / SPILF.',
    fields: [
      { key: 'confusion', label: 'C - Confusion mentale récente (ou Glasgow < 15)', type: 'boolean', defaultValue: false },
      { key: 'rr', label: 'R - Fréquence respiratoire ≥ 30 cycles/min', type: 'boolean', defaultValue: false },
      { key: 'bp', label: 'B - Pression artérielle basse (PAS < 90 mmHg ou PAD ≤ 60 mmHg)', type: 'boolean', defaultValue: false },
      { key: 'age65', label: '65 - Âge ≥ 65 ans', type: 'boolean', defaultValue: false }
    ],
    calculate: (inputs) => {
      let score = 0;
      if (inputs.confusion) score += 1;
      if (inputs.rr) score += 1;
      if (inputs.bp) score += 1;
      if (inputs.age65) score += 1;

      let interp = '';
      let reco = '';
      if (score === 0) {
        interp = 'CRB-65 = 0/4 — Risque faible (mortalité < 1%).';
        reco = 'Traitement ambulatoire possible en l\'absence de comorbidités décompensées ou d\'hypoxémie. Réévaluation à 48-72h.';
      } else if (score <= 2) {
        interp = `CRB-65 = ${score}/4 — Risque intermédiaire (mortalité 1 à 10%).`;
        reco = 'Évaluation hospitalière recommandée (hospitalisation conventionnelle en Pneumologie CHREIN si signes de gravité associés ou isolement).';
      } else {
        interp = `CRB-65 = ${score}/4 — PNEUMONIE GRAVE (mortalité > 20%).`;
        reco = 'Hospitalisation urgente en soins continus / réanimation. Oxygénothérapie, prélèvements microbiologiques et antibiothérapie IV immédiate.';
      }
      return { value: `${score} / 4`, interpretation: interp, recommendation: reco, missing: [], details: { score } };
    }
  },
  {
    id: 'CURB65',
    name: 'Score CURB-65 (Pneumonies Aiguës)',
    category: 'PNEUMONIA',
    categoryLabel: 'Pneumonie (PAC)',
    shortDesc: 'Évaluation du risque de mortalité à 30 jours avec urée sanguine pour orienter Ambulatoire vs Hospitalisation vs Soins Intensifs.',
    reference: 'Lim WS et al. Thorax 2003; British Thoracic Society (BTS).',
    fields: [
      { key: 'confusion', label: 'C - Confusion mentale / désorientation temporo-spatiale récente', type: 'boolean', defaultValue: false },
      {
        key: 'urea',
        label: 'U - Urée sanguine > 7 mmol/L (ou > 0,42 g/L)',
        type: 'select',
        options: [
          { label: 'Non dosée ou normale (≤ 7 mmol/L)', value: 0 },
          { label: 'Urée élevée (> 7 mmol/L ou > 0,42 g/L) (+1 pt)', value: 1 }
        ]
      },
      { key: 'rr', label: 'R - Fréquence respiratoire ≥ 30 cycles/minute (Tachypnée)', type: 'boolean', defaultValue: false },
      { key: 'bp', label: 'B - Pression artérielle basse : PAS < 90 mmHg OU PAD ≤ 60 mmHg', type: 'boolean', defaultValue: false },
      { key: 'age65', label: '65 - Âge du patient ≥ 65 ans', type: 'boolean', defaultValue: false }
    ],
    calculate: (inputs) => {
      let score = 0;
      if (inputs.confusion) score += 1;
      if (Number(inputs.urea) === 1) score += 1;
      if (inputs.rr) score += 1;
      if (inputs.bp) score += 1;
      if (inputs.age65) score += 1;

      let interp = '';
      let reco = '';
      if (score === 0) {
        interp = `CURB-65 = 0 point (Mortalité estimée < 1%). Risque très faible.`;
        reco = 'Prise en charge ambulatoire envisageable avec antibiothérapie orale. Réévaluation obligatoire à 48 heures.';
      } else if (score === 1) {
        interp = `CURB-65 = 1 point (Mortalité estimée 2,7%). Risque faible.`;
        reco = 'Traitement ambulatoire possible sous surveillance rapprochée, sauf facteurs sociaux défavorables ou comorbidités décompensées.';
      } else if (score === 2) {
        interp = `CURB-65 = 2 points (Mortalité estimée 6,8%). Risque modéré.`;
        reco = 'Hospitalisation recommandée en Pneumologie CHREIN (lit conventionnel). Antibiothérapie IV ou orale supervisée.';
      } else {
        interp = `CURB-65 = ${score} points (Mortalité estimée 14 à 30%). PNEUMONIE GRAVE.`;
        reco = 'URGENCE : Hospitalisation immédiate en soins continus respiratoires ou réanimation. Oxygénothérapie et bithérapie IV.';
      }

      return { value: `${score} / 5 points`, interpretation: interp, recommendation: reco, missing: [], details: { score } };
    }
  },
  {
    id: 'PSI_PORT',
    name: 'Score PSI / Index de Fine (Port)',
    category: 'PNEUMONIA',
    categoryLabel: 'Pneumonie (PAC)',
    shortDesc: 'Score de stratification fine des pneumonies aiguës communautaires en 5 classes pronostiques (I à V).',
    reference: 'Fine MJ et al. N Engl J Med 1997; PORT Study.',
    fields: [
      { key: 'age', label: 'Âge du patient (années)', type: 'number', unit: 'ans', placeholder: 'Ex: 58' },
      {
        key: 'gender',
        label: 'Sexe',
        type: 'select',
        options: [
          { label: 'Masculin (score = âge)', value: 'M' },
          { label: 'Féminin (score = âge - 10)', value: 'F' }
        ]
      },
      { key: 'nursingHome', label: 'Résident en institution / dépendance majeure (+10 pts)', type: 'boolean', defaultValue: false },
      { key: 'neoplasia', label: 'Néoplasie active (+30 pts)', type: 'boolean', defaultValue: false },
      { key: 'liverDisease', label: 'Hépatopathie chronique (+20 pts)', type: 'boolean', defaultValue: false },
      { key: 'heartFailure', label: 'Insuffisance cardiaque congestive (+10 pts)', type: 'boolean', defaultValue: false },
      { key: 'cerebrovascular', label: 'Maladie cérébro-vasculaire / AVC (+10 pts)', type: 'boolean', defaultValue: false },
      { key: 'renalDisease', label: 'Maladie rénale chronique (+10 pts)', type: 'boolean', defaultValue: false },
      { key: 'confusion', label: 'Altération de la conscience (+20 pts)', type: 'boolean', defaultValue: false },
      { key: 'rr30', label: 'Fréquence respiratoire ≥ 30/min (+20 pts)', type: 'boolean', defaultValue: false },
      { key: 'pas90', label: 'PAS < 90 mmHg (+20 pts)', type: 'boolean', defaultValue: false },
      { key: 'tempExtreme', label: 'Température < 35°C ou ≥ 40°C (+15 pts)', type: 'boolean', defaultValue: false },
      { key: 'hr125', label: 'Fréquence cardiaque ≥ 125 bpm (+10 pts)', type: 'boolean', defaultValue: false },
      { key: 'phLow', label: 'pH artériel < 7,35 (+30 pts)', type: 'boolean', defaultValue: false },
      { key: 'ureaHigh', label: 'Urée ≥ 11 mmol/L (≥ 0,65 g/L) (+20 pts)', type: 'boolean', defaultValue: false },
      { key: 'naLow', label: 'Natrémie < 130 mmol/L (+20 pts)', type: 'boolean', defaultValue: false },
      { key: 'glucoseHigh', label: 'Glycémie ≥ 14 mmol/L (≥ 2,5 g/L) (+10 pts)', type: 'boolean', defaultValue: false },
      { key: 'htLow', label: 'Hématocrite < 30% (+10 pts)', type: 'boolean', defaultValue: false },
      { key: 'hypoxemia', label: 'PaO2 < 60 mmHg ou SpO2 < 90% (+10 pts)', type: 'boolean', defaultValue: false },
      { key: 'pleuralEffusion', label: 'Épanchement pleural à l\'imagerie (+10 pts)', type: 'boolean', defaultValue: false }
    ],
    calculate: (inputs) => {
      if (inputs.age === undefined || inputs.age === '' || !inputs.gender) {
        return {
          value: 'Incomplet',
          interpretation: 'Âge et sexe requis pour calculer le score PSI (Port).',
          recommendation: 'Renseigner au minimum l\'âge, le sexe et les critères disponibles.',
          missing: ['age', 'gender'].filter(k => inputs[k] === undefined || inputs[k] === ''),
          details: {}
        };
      }
      const age = Number(inputs.age);
      let pts = inputs.gender === 'F' ? Math.max(0, age - 10) : age;
      if (inputs.nursingHome) pts += 10;
      if (inputs.neoplasia) pts += 30;
      if (inputs.liverDisease) pts += 20;
      if (inputs.heartFailure) pts += 10;
      if (inputs.cerebrovascular) pts += 10;
      if (inputs.renalDisease) pts += 10;
      if (inputs.confusion) pts += 20;
      if (inputs.rr30) pts += 20;
      if (inputs.pas90) pts += 20;
      if (inputs.tempExtreme) pts += 15;
      if (inputs.hr125) pts += 10;
      if (inputs.phLow) pts += 30;
      if (inputs.ureaHigh) pts += 20;
      if (inputs.naLow) pts += 20;
      if (inputs.glucoseHigh) pts += 10;
      if (inputs.htLow) pts += 10;
      if (inputs.hypoxemia) pts += 10;
      if (inputs.pleuralEffusion) pts += 10;

      const hasAnyRiskFactor = Boolean(
        age > 50 || inputs.neoplasia || inputs.liverDisease || inputs.heartFailure || inputs.cerebrovascular || inputs.renalDisease ||
        inputs.confusion || inputs.rr30 || inputs.pas90 || inputs.tempExtreme || inputs.hr125
      );

      let riskClass = 'Classe I';
      let reco = '';
      if (!hasAnyRiskFactor && pts <= 50) {
        riskClass = 'Classe I';
        reco = 'Mortalité < 0,1%. Traitement ambulatoire recommandé sauf obstacle socio-économique.';
      } else if (pts <= 70) {
        riskClass = 'Classe II';
        reco = 'Mortalité ~0,6%. Prise en charge ambulatoire généralement adaptée avec réévaluation précoce.';
      } else if (pts <= 90) {
        riskClass = 'Classe III';
        reco = 'Mortalité ~2,8%. Courte hospitalisation ou surveillance ambulatoire stricte selon hypoxémie et contexte.';
      } else if (pts <= 130) {
        riskClass = 'Classe IV';
        reco = 'Mortalité ~8,2%. Hospitalisation conventionnelle nécessaire en Pneumologie.';
      } else {
        riskClass = 'Classe V';
        reco = 'Mortalité ~29,2%. Hospitalisation urgente en soins continus / réanimation.';
      }

      return {
        value: `${pts} pts (${riskClass})`,
        interpretation: `Score PSI (Port) = ${pts} points — ${riskClass}.`,
        recommendation: reco,
        missing: [],
        details: { pts, riskClass }
      };
    }
  },

  // ------------------------------------------------------------------
  // EMBOLIE PULMONAIRE (EP) : Wells, Genève révisé, PESI, sPESI
  // ------------------------------------------------------------------
  {
    id: 'WELLS_PE',
    name: 'Score de Wells (Embolie Pulmonaire)',
    category: 'EMBOLISM',
    categoryLabel: 'Embolie Pulmonaire',
    shortDesc: 'Probabilité clinique d\'embolie pulmonaire aiguë pour orienter D-Dimères vs Angioscanner thoracique.',
    reference: 'Wells PS et al. Ann Intern Med 2001; ESC Guidelines 2019.',
    fields: [
      { key: 'signsDVT', label: 'Signes cliniques de TVP (mollet gonflé, douleur à la palpation) (+3 pts)', type: 'boolean', defaultValue: false },
      { key: 'noAltDiagnosis', label: 'Diagnostic alternatif moins probable que l\'embolie pulmonaire (+3 pts)', type: 'boolean', defaultValue: false },
      { key: 'hrAbove100', label: 'Fréquence cardiaque > 100 battements/minute (+1,5 pt)', type: 'boolean', defaultValue: false },
      { key: 'priorImmobilization', label: 'Immobilisation (> 3j) ou chirurgie dans les 4 dernières semaines (+1,5 pt)', type: 'boolean', defaultValue: false },
      { key: 'priorPEorDVT', label: 'Antécédent personnel de TVP ou EP (+1,5 pt)', type: 'boolean', defaultValue: false },
      { key: 'hemoptysis', label: 'Hémoptysie (+1 pt)', type: 'boolean', defaultValue: false },
      { key: 'cancerActive', label: 'Cancer actif ou traité dans les 6 derniers mois (+1 pt)', type: 'boolean', defaultValue: false }
    ],
    calculate: (inputs) => {
      let score = 0;
      if (inputs.signsDVT) score += 3;
      if (inputs.noAltDiagnosis) score += 3;
      if (inputs.hrAbove100) score += 1.5;
      if (inputs.priorImmobilization) score += 1.5;
      if (inputs.priorPEorDVT) score += 1.5;
      if (inputs.hemoptysis) score += 1;
      if (inputs.cancerActive) score += 1;

      let interp = '';
      let reco = '';
      if (score <= 1.5) {
        interp = `Score de Wells = ${score} — Probabilité clinique FAIBLE.`;
        reco = 'Dosage des D-Dimères en première intention. Si négatifs (< 500 ng/mL ou ajustés à l\'âge), EP écartée.';
      } else if (score <= 6) {
        interp = `Score de Wells = ${score} — Probabilité clinique INTERMÉDIAIRE.`;
        reco = 'D-Dimères ou Angioscanner thoracique direct selon contexte clinique.';
      } else {
        interp = `Score de Wells = ${score} — Probabilité clinique FORTE.`;
        reco = 'Angioscanner thoracique spiralé en URGENCE sans attendre les D-Dimères. Discuter anticoagulation curative immédiate.';
      }
      return { value: `${score} pts`, interpretation: interp, recommendation: reco, missing: [], details: { score } };
    }
  },
  {
    id: 'GENEVA_REVISED',
    name: 'Score de Genève Révisé (Embolie Pulmonaire)',
    category: 'EMBOLISM',
    categoryLabel: 'Embolie Pulmonaire',
    shortDesc: 'Score clinique purement objectif (sans critère subjectif) de probabilité pré-test d\'embolie pulmonaire.',
    reference: 'Le Gal G et al. Ann Intern Med 2006; ESC Guidelines 2019.',
    fields: [
      { key: 'age65', label: 'Âge > 65 ans (+1 pt)', type: 'boolean', defaultValue: false },
      { key: 'priorDVTPE', label: 'Antécédent de TVP ou d\'EP (+3 pts)', type: 'boolean', defaultValue: false },
      { key: 'surgeryFracture', label: 'Chirurgie ou fracture d\'un membre inférieur < 1 mois (+2 pts)', type: 'boolean', defaultValue: false },
      { key: 'activeCancer', label: 'Cancer actif ou en rémission < 1 an (+2 pts)', type: 'boolean', defaultValue: false },
      { key: 'unilateralLegPain', label: 'Douleur unilatérale d\'un membre inférieur (+3 pts)', type: 'boolean', defaultValue: false },
      { key: 'hemoptysis', label: 'Hémoptysie (+2 pts)', type: 'boolean', defaultValue: false },
      {
        key: 'heartRateBand',
        label: 'Fréquence cardiaque',
        type: 'select',
        options: [
          { label: '< 75 bpm (0 pt)', value: 0 },
          { label: '75 à 94 bpm (+3 pts)', value: 3 },
          { label: '≥ 95 bpm (+5 pts)', value: 5 }
        ]
      },
      { key: 'palpationPainEdema', label: 'Douleur à la palpation du trajet veineux profond ET œdème unilatéral (+4 pts)', type: 'boolean', defaultValue: false }
    ],
    calculate: (inputs) => {
      let score = 0;
      if (inputs.age65) score += 1;
      if (inputs.priorDVTPE) score += 3;
      if (inputs.surgeryFracture) score += 2;
      if (inputs.activeCancer) score += 2;
      if (inputs.unilateralLegPain) score += 3;
      if (inputs.hemoptysis) score += 2;
      score += Number(inputs.heartRateBand || 0);
      if (inputs.palpationPainEdema) score += 4;

      let interp = '';
      let reco = '';
      if (score <= 3) {
        interp = `Genève révisé = ${score} pts — Probabilité clinique FAIBLE (~8%).`;
        reco = 'Dosage des D-Dimères. Si négatifs, EP exclue.';
      } else if (score <= 10) {
        interp = `Genève révisé = ${score} pts — Probabilité clinique INTERMÉDIAIRE (~28%).`;
        reco = 'D-Dimères haute sensibilité ou Angioscanner thoracique selon disponibilité.';
      } else {
        interp = `Genève révisé = ${score} pts — Probabilité clinique FORTE (> 70%).`;
        reco = 'Angioscanner thoracique urgent d\'emblée + initiation anticoagulation curative sauf contre-indication.';
      }
      return { value: `${score} pts`, interpretation: interp, recommendation: reco, missing: [], details: { score } };
    }
  },
  {
    id: 'PESI',
    name: 'Score PESI (Pronostic Embolie Pulmonaire)',
    category: 'EMBOLISM',
    categoryLabel: 'Embolie Pulmonaire',
    shortDesc: 'Stratification du risque de mortalité à 30 jours après confirmation d\'embolie pulmonaire (Classes I à V).',
    reference: 'Aujesky D et al. Am J Respir Crit Care Med 2005; ESC 2019.',
    fields: [
      { key: 'age', label: 'Âge en années (+1 pt/an)', type: 'number', unit: 'ans', placeholder: 'Ex: 62' },
      { key: 'male', label: 'Sexe masculin (+10 pts)', type: 'boolean', defaultValue: false },
      { key: 'cancer', label: 'Cancer actif (+30 pts)', type: 'boolean', defaultValue: false },
      { key: 'heartFailure', label: 'Insuffisance cardiaque chronique (+10 pts)', type: 'boolean', defaultValue: false },
      { key: 'chronicLungDisease', label: 'Pathologie respiratoire chronique (+10 pts)', type: 'boolean', defaultValue: false },
      { key: 'hr110', label: 'Fréquence cardiaque ≥ 110 bpm (+20 pts)', type: 'boolean', defaultValue: false },
      { key: 'pas100', label: 'PAS < 100 mmHg (+30 pts)', type: 'boolean', defaultValue: false },
      { key: 'rr30', label: 'Fréquence respiratoire ≥ 30/min (+20 pts)', type: 'boolean', defaultValue: false },
      { key: 'temp36', label: 'Température < 36°C (+20 pts)', type: 'boolean', defaultValue: false },
      { key: 'alteredMental', label: 'Altération de la conscience (+60 pts)', type: 'boolean', defaultValue: false },
      { key: 'spo2Low', label: 'SpO2 < 90% (+20 pts)', type: 'boolean', defaultValue: false }
    ],
    calculate: (inputs) => {
      if (inputs.age === undefined || inputs.age === '') {
        return { value: 'Incomplet', interpretation: 'Âge requis.', recommendation: 'Renseigner l\'âge du patient.', missing: ['age'], details: {} };
      }
      let score = Number(inputs.age);
      if (inputs.male) score += 10;
      if (inputs.cancer) score += 30;
      if (inputs.heartFailure) score += 10;
      if (inputs.chronicLungDisease) score += 10;
      if (inputs.hr110) score += 20;
      if (inputs.pas100) score += 30;
      if (inputs.rr30) score += 20;
      if (inputs.temp36) score += 20;
      if (inputs.alteredMental) score += 60;
      if (inputs.spo2Low) score += 20;

      let classe = 'Classe I';
      let reco = '';
      if (score <= 65) {
        classe = 'Classe I (Très faible risque, mortalité ≤ 1,6%)';
        reco = 'EP à faible risque : prise en charge ambulatoire précoce envisageable si contexte social favorable et absence de dysfonction VD.';
      } else if (score <= 85) {
        classe = 'Classe II (Faible risque, mortalité 1,7-3,5%)';
        reco = 'Hospitalisation courte ou sortie précoce sous anticoagulation orale directe selon échocardiographie / troponine.';
      } else if (score <= 105) {
        classe = 'Classe III (Risque modéré, mortalité 3,2-7,1%)';
        reco = 'Hospitalisation recommandée. Évaluer la fonction VD (ETT / BNP / Troponine).';
      } else if (score <= 125) {
        classe = 'Classe IV (Risque élevé, mortalité 4-11,4%)';
        reco = 'Hospitalisation sous monitorage rapproché (soins continus), oxygénothérapie et évaluation hémodynamique.';
      } else {
        classe = 'Classe V (Risque très élevé, mortalité 10-24,5%)';
        reco = 'Soins intensifs immédiats. Surveillance hémodynamique continue et évaluation d\'une thrombolyse si instabilité.';
      }
      return { value: `${score} pts`, interpretation: `PESI = ${score} pts — ${classe}`, recommendation: reco, missing: [], details: { score, classe } };
    }
  },
  {
    id: 'SPESI',
    name: 'Score sPESI (PESI Simplifié)',
    category: 'EMBOLISM',
    categoryLabel: 'Embolie Pulmonaire',
    shortDesc: 'Version simplifiée en 6 items (0 vs ≥ 1) pour identifier rapidement les embolies pulmonaires à bas risque.',
    reference: 'Jiménez D et al. Arch Intern Med 2010; ESC 2019.',
    fields: [
      { key: 'age80', label: 'Âge > 80 ans (+1 pt)', type: 'boolean', defaultValue: false },
      { key: 'cancer', label: 'Antécédent de cancer (+1 pt)', type: 'boolean', defaultValue: false },
      { key: 'cardioPulm', label: 'Insuffisance cardiaque ou pathologie pulmonaire chronique (+1 pt)', type: 'boolean', defaultValue: false },
      { key: 'hr110', label: 'Fréquence cardiaque ≥ 110 bpm (+1 pt)', type: 'boolean', defaultValue: false },
      { key: 'pas100', label: 'Pression artérielle systolique < 100 mmHg (+1 pt)', type: 'boolean', defaultValue: false },
      { key: 'spo2Low', label: 'Saturation artérielle en O2 < 90% (+1 pt)', type: 'boolean', defaultValue: false }
    ],
    calculate: (inputs) => {
      let score = 0;
      if (inputs.age80) score += 1;
      if (inputs.cancer) score += 1;
      if (inputs.cardioPulm) score += 1;
      if (inputs.hr110) score += 1;
      if (inputs.pas100) score += 1;
      if (inputs.spo2Low) score += 1;

      const interp = score === 0
        ? 'sPESI = 0 — Risque faible (mortalité à 30j ≈ 1%).'
        : `sPESI = ${score}/6 (≥ 1) — Risque intermédiaire à élevé (mortalité ≈ 10,9%).`;
      const reco = score === 0
        ? 'Candidat à un traitement ambulatoire si aucune dysfonction VD (Hestia négatif).'
        : 'Hospitalisation requise + bilan cardiaque (ETT, troponine, BNP) pour stratification ESC.';
      return { value: `${score} / 6`, interpretation: interp, recommendation: reco, missing: [], details: { score } };
    }
  },

  // ------------------------------------------------------------------
  // BPCO : CAT, mMRC, BODE, GOLD A/B/E
  // ------------------------------------------------------------------
  {
    id: 'CAT',
    name: 'Score CAT (COPD Assessment Test)',
    category: 'COPD',
    categoryLabel: 'BPCO & Tabac',
    shortDesc: 'Questionnaire validé en 8 items (score de 0 à 40) mesurant l\'impact de la BPCO sur la qualité de vie.',
    reference: 'Jones PW et al. Eur Respir J 2009; GOLD 2024.',
    fields: [
      { key: 'q1', label: 'Toux (0 = jamais → 5 = tout le temps)', type: 'select', options: [0,1,2,3,4,5].map(v => ({ label: `${v} / 5`, value: v })) },
      { key: 'q2', label: 'Encombrement bronchique / glaires (0 → 5)', type: 'select', options: [0,1,2,3,4,5].map(v => ({ label: `${v} / 5`, value: v })) },
      { key: 'q3', label: 'Oppression thoracique (0 → 5)', type: 'select', options: [0,1,2,3,4,5].map(v => ({ label: `${v} / 5`, value: v })) },
      { key: 'q4', label: 'Essoufflement en montant une côte / un étage (0 → 5)', type: 'select', options: [0,1,2,3,4,5].map(v => ({ label: `${v} / 5`, value: v })) },
      { key: 'q5', label: 'Limitation des activités domestiques (0 → 5)', type: 'select', options: [0,1,2,3,4,5].map(v => ({ label: `${v} / 5`, value: v })) },
      { key: 'q6', label: 'Appréhension à sortir de chez soi (0 → 5)', type: 'select', options: [0,1,2,3,4,5].map(v => ({ label: `${v} / 5`, value: v })) },
      { key: 'q7', label: 'Troubles du sommeil liés à l\'état respiratoire (0 → 5)', type: 'select', options: [0,1,2,3,4,5].map(v => ({ label: `${v} / 5`, value: v })) },
      { key: 'q8', label: 'Manque d\'énergie / fatigue (0 → 5)', type: 'select', options: [0,1,2,3,4,5].map(v => ({ label: `${v} / 5`, value: v })) }
    ],
    calculate: (inputs) => {
      const keys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'];
      const missing = keys.filter(k => inputs[k] === undefined || inputs[k] === null || inputs[k] === '');
      if (missing.length > 0) {
        return {
          value: 'Incomplet',
          interpretation: `${missing.length} item(s) manquant(s) sur 8.`,
          recommendation: 'Compléter les 8 items du questionnaire CAT.',
          missing,
          details: {}
        };
      }
      const sum = keys.reduce((acc, k) => acc + Number(inputs[k]), 0);
      let interp = '';
      let reco = '';
      if (sum < 10) {
        interp = `CAT = ${sum}/40 (< 10) — Impact faible sur la vie quotidienne.`;
        reco = 'Symptomatologie légère (GOLD A si faible risque d\'exacerbation). Sevrage tabagique + bronchodilatateur selon GOLD.';
      } else if (sum <= 20) {
        interp = `CAT = ${sum}/40 (≥ 10) — Impact modéré (seuil symptomatique GOLD B/E atteint).`;
        reco = 'Bithérapie bronchodilatatrice LAMA + LABA indiquée. Réhabilitation respiratoire recommandée.';
      } else if (sum <= 30) {
        interp = `CAT = ${sum}/40 — Impact élevé de la BPCO.`;
        reco = 'Optimiser le traitement inhalé (LAMA+LABA ± CSI selon éosinophiles/exacerbations) et programme de réhabilitation.';
      } else {
        interp = `CAT = ${sum}/40 — Impact TRÈS ÉLEVÉ / handicap respiratoire majeur.`;
        reco = 'Prise en charge pneumologique rapprochée, rechercher hypoxémie chronique / hypercapnie et discuter VNI / OLD.';
      }
      return { value: `${sum} / 40`, interpretation: interp, recommendation: reco, missing: [], details: { total: sum } };
    }
  },
  {
    id: 'mMRC',
    name: 'Échelle de Dyspnée mMRC',
    category: 'COPD',
    categoryLabel: 'BPCO & Tabac',
    shortDesc: 'Cotation clinique standardisée du niveau de dyspnée d\'effort (stades 0 à 4).',
    reference: 'Fletcher CM. BMJ 1960; GOLD 2024.',
    fields: [
      {
        key: 'grade',
        label: 'Niveau d\'essoufflement du patient :',
        type: 'select',
        options: [
          { label: 'Grade 0 : Essoufflement uniquement lors d\'efforts physiques intenses', value: 0 },
          { label: 'Grade 1 : Essoufflement à la marche rapide à plat ou en montant une légère pente', value: 1 },
          { label: 'Grade 2 : Marche plus lentement que les personnes du même âge à plat', value: 2 },
          { label: 'Grade 3 : S\'arrête pour respirer après ~100 mètres ou quelques minutes à plat', value: 3 },
          { label: 'Grade 4 : Trop essoufflé pour quitter la maison ou en s\'habillant', value: 4 }
        ]
      }
    ],
    calculate: (inputs) => {
      if (inputs.grade === undefined || inputs.grade === null || inputs.grade === '') {
        return { value: 'Incomplet', interpretation: 'Aucun grade sélectionné.', recommendation: 'Sélectionner un grade mMRC.', missing: ['grade'], details: {} };
      }
      const g = Number(inputs.grade);
      const isHighSymptom = g >= 2;
      return {
        value: `Grade ${g}`,
        interpretation: `mMRC = ${g} : ${isHighSymptom ? 'Haut niveau de symptômes (≥ 2).' : 'Niveau de dyspnée faible (< 2).'}`,
        recommendation: isHighSymptom
          ? 'Groupe B ou E selon exacerbations. Bithérapie bronchodilatatrice (LAMA + LABA) et réhabilitation respiratoire.'
          : 'Groupe A ou E selon exacerbations.',
        missing: [],
        details: { grade: g, highSymptom: isHighSymptom }
      };
    }
  },
  {
    id: 'BODE',
    name: 'Index BODE (Pronostic BPCO)',
    category: 'COPD',
    categoryLabel: 'BPCO & Tabac',
    shortDesc: 'Score multidimensionnel (0 à 10) prédictif de survie dans la BPCO (IMC, VEMS %, mMRC, Test de marche 6 min).',
    reference: 'Celli BR et al. N Engl J Med 2004.',
    fields: [
      { key: 'bmi', label: 'B - Indice de Masse Corporelle (IMC)', type: 'number', unit: 'kg/m²', placeholder: 'Ex: 22.5' },
      { key: 'vemsPct', label: 'O - VEMS post-bronchodilatateur (% théorique)', type: 'number', unit: '%', placeholder: 'Ex: 52' },
      {
        key: 'mmrc',
        label: 'D - Échelle de dyspnée mMRC',
        type: 'select',
        options: [
          { label: 'mMRC 0 ou 1 (0 pt)', value: 0 },
          { label: 'mMRC 2 (+1 pt)', value: 1 },
          { label: 'mMRC 3 (+2 pts)', value: 2 },
          { label: 'mMRC 4 (+3 pts)', value: 3 }
        ]
      },
      { key: 'tm6Meters', label: 'E - Distance parcourue au Test de Marche de 6 min (TM6)', type: 'number', unit: 'm', placeholder: 'Ex: 320' }
    ],
    calculate: (inputs) => {
      const missing: string[] = [];
      if (inputs.bmi === undefined || inputs.bmi === '') missing.push('bmi');
      if (inputs.vemsPct === undefined || inputs.vemsPct === '') missing.push('vemsPct');
      if (inputs.mmrc === undefined || inputs.mmrc === '') missing.push('mmrc');
      if (inputs.tm6Meters === undefined || inputs.tm6Meters === '') missing.push('tm6Meters');
      if (missing.length > 0) {
        return {
          value: 'Incomplet',
          interpretation: 'Données EFR/TM6/IMC requises pour le calcul complet du BODE.',
          recommendation: 'Renseigner IMC, VEMS %, mMRC et distance au TM6.',
          missing,
          details: {}
        };
      }
      let pts = 0;
      const bmi = Number(inputs.bmi);
      const vems = Number(inputs.vemsPct);
      const mmrcPts = Number(inputs.mmrc);
      const tm6 = Number(inputs.tm6Meters);

      if (bmi <= 21) pts += 1;
      if (vems >= 65) pts += 0;
      else if (vems >= 50) pts += 1;
      else if (vems >= 36) pts += 2;
      else pts += 3;

      pts += mmrcPts;

      if (tm6 >= 350) pts += 0;
      else if (tm6 >= 250) pts += 1;
      else if (tm6 >= 150) pts += 2;
      else pts += 3;

      let interp = '';
      let reco = '';
      if (pts <= 2) {
        interp = `Index BODE = ${pts}/10 (Quartile 1 — Survie estimée à 4 ans ~80%).`;
        reco = 'Pronostic favorable. Maintien du traitement de fond, sevrage tabagique et activité physique.';
      } else if (pts <= 4) {
        interp = `Index BODE = ${pts}/10 (Quartile 2 — Survie à 4 ans ~67%).`;
        reco = 'Réhabilitation respiratoire structurée et suivi nutritionnel recommandés.';
      } else if (pts <= 6) {
        interp = `Index BODE = ${pts}/10 (Quartile 3 — Survie à 4 ans ~57%).`;
        reco = 'BPCO sévère. Bilan gazométrique (indication OLD ?), soutien nutritionnel et suivi pneumologique rapproché.';
      } else {
        interp = `Index BODE = ${pts}/10 (Quartile 4 — Pronostic réservé, survie à 4 ans ~18%).`;
        reco = 'Prise en charge multidisciplinaire intensive : OLD/VNI si indiquée, réhabilitation adaptée, prévention des exacerbations.';
      }
      return { value: `${pts} / 10`, interpretation: interp, recommendation: reco, missing: [], details: { pts, bmi, vems, tm6 } };
    }
  },
  {
    id: 'GOLD_ABE',
    name: 'Classification GOLD 2024 (Groupes A, B, E)',
    category: 'COPD',
    categoryLabel: 'BPCO & Tabac',
    shortDesc: 'Stratification combinée des patients BPCO selon la dyspnée (mMRC/CAT) et le risque d\'exacerbations.',
    reference: 'Global Initiative for Chronic Obstructive Lung Disease (GOLD) Report 2024.',
    fields: [
      {
        key: 'mmrc',
        label: 'Score mMRC / CAT',
        type: 'select',
        options: [
          { label: 'mMRC 0-1 ou CAT < 10 (Peu symptomatique)', value: 'LOW' },
          { label: 'mMRC ≥ 2 ou CAT ≥ 10 (Très symptomatique)', value: 'HIGH' }
        ]
      },
      { key: 'moderateExacerbations', label: 'Exacerbations modérées (sans hospitalisation) sur 12 mois', type: 'number', placeholder: '0', defaultValue: 0 },
      { key: 'hospitalExacerbations', label: 'Exacerbations sévères (avec hospitalisation) sur 12 mois', type: 'number', placeholder: '0', defaultValue: 0 }
    ],
    calculate: (inputs) => {
      const missing = [];
      if (!inputs.mmrc) missing.push('mmrc');
      if (inputs.moderateExacerbations === undefined || inputs.moderateExacerbations === '') missing.push('moderateExacerbations');
      if (inputs.hospitalExacerbations === undefined || inputs.hospitalExacerbations === '') missing.push('hospitalExacerbations');
      if (missing.length > 0) {
        return { value: 'Incomplet', interpretation: 'Données manquantes.', recommendation: 'Renseigner le niveau symptomatique et les exacerbations.', missing, details: {} };
      }
      const mod = Number(inputs.moderateExacerbations || 0);
      const hosp = Number(inputs.hospitalExacerbations || 0);
      const totalExac = mod + hosp;
      const isHighRisk = hosp >= 1 || totalExac >= 2;
      const isHighSymptom = inputs.mmrc === 'HIGH';

      let group = 'Groupe A';
      let reco = '';
      if (isHighRisk) {
        group = 'Groupe E (Exacerbateur)';
        reco = 'Bithérapie LAMA + LABA d\'emblée. Ajouter CSI si éosinophiles ≥ 300/µL. Vaccinations antipneumococcique et antigrippale.';
      } else if (isHighSymptom) {
        group = 'Groupe B (Symptomatique)';
        reco = 'Association LAMA + LABA recommandée + réhabilitation respiratoire.';
      } else {
        group = 'Groupe A (Peu symptomatique)';
        reco = 'Monothérapie bronchodilatatrice (LAMA ou LABA) et sevrage tabagique.';
      }
      return { value: group, interpretation: `Patient classé ${group} (${totalExac} exac., dont ${hosp} hosp.).`, recommendation: reco, missing: [], details: { group, totalExac, hosp } };
    }
  },

  // ------------------------------------------------------------------
  // ASTHME : ACT, ACQ
  // ------------------------------------------------------------------
  {
    id: 'ACT',
    name: 'ACT (Asthma Control Test)',
    category: 'ASTHMA',
    categoryLabel: 'Asthme',
    shortDesc: 'Évaluation standardisée du contrôle de l\'asthme sur les 4 dernières semaines (score de 5 à 25).',
    reference: 'Nathan RA et al. J Allergy Clin Immunol 2004; GINA 2024.',
    fields: [
      {
        key: 'q1',
        label: 'Gêne au travail / activités quotidiennes',
        type: 'select',
        options: [1,2,3,4,5].map(v => ({
          label: ['Tout le temps (1 pt)', 'La plupart du temps (2 pts)', 'De temps en temps (3 pts)', 'Rarement (4 pts)', 'Jamais (5 pts)'][v-1],
          value: v
        }))
      },
      {
        key: 'q2',
        label: 'Fréquence de l\'essoufflement',
        type: 'select',
        options: [1,2,3,4,5].map(v => ({
          label: ['> 1 fois/jour (1 pt)', '1 fois/jour (2 pts)', '3-6 fois/semaine (3 pts)', '1-2 fois/semaine (4 pts)', 'Jamais (5 pts)'][v-1],
          value: v
        }))
      },
      {
        key: 'q3',
        label: 'Réveils nocturnes ou précoces par l\'asthme',
        type: 'select',
        options: [1,2,3,4,5].map(v => ({
          label: ['≥ 4 nuits/semaine (1 pt)', '2-3 nuits/semaine (2 pts)', '1 fois/semaine (3 pts)', '1-2 fois/mois (4 pts)', 'Jamais (5 pts)'][v-1],
          value: v
        }))
      },
      {
        key: 'q4',
        label: 'Recours au traitement de secours (Salbutamol)',
        type: 'select',
        options: [1,2,3,4,5].map(v => ({
          label: ['≥ 3 fois/jour (1 pt)', '1-2 fois/jour (2 pts)', '2-3 fois/semaine (3 pts)', '≤ 1 fois/semaine (4 pts)', 'Jamais (5 pts)'][v-1],
          value: v
        }))
      },
      {
        key: 'q5',
        label: 'Auto-évaluation du contrôle de l\'asthme',
        type: 'select',
        options: [1,2,3,4,5].map(v => ({
          label: ['Pas du tout contrôlé (1 pt)', 'Mal contrôlé (2 pts)', 'Assez bien contrôlé (3 pts)', 'Bien contrôlé (4 pts)', 'Parfaitement contrôlé (5 pts)'][v-1],
          value: v
        }))
      }
    ],
    calculate: (inputs) => {
      const keys = ['q1', 'q2', 'q3', 'q4', 'q5'];
      const missing = keys.filter(k => inputs[k] === undefined || inputs[k] === null || inputs[k] === '');
      if (missing.length > 0) {
        return { value: 'Incomplet', interpretation: `${missing.length} question(s) non renseignée(s).`, recommendation: 'Compléter les 5 items ACT.', missing, details: {} };
      }
      const sum = keys.reduce((acc, k) => acc + Number(inputs[k]), 0);
      let interp = '';
      let reco = '';
      if (sum >= 20) {
        interp = `Score ${sum}/25 — Asthme bien contrôlé.`;
        reco = 'Maintenir le palier thérapeutique actuel et vérifier l\'observance.';
      } else if (sum >= 16) {
        interp = `Score ${sum}/25 — Asthme partiellement contrôlé.`;
        reco = 'Vérifier technique d\'inhalation et observance. Discuter escalade thérapeutique GINA.';
      } else {
        interp = `Score ${sum}/25 — Asthme non contrôlé / sévère.`;
        reco = 'Escalade d\'au moins 1 palier GINA requise, rechercher facteurs aggravants (allergènes, RGO, rhinite).';
      }
      return { value: `${sum} / 25`, interpretation: interp, recommendation: reco, missing: [], details: { total: sum } };
    }
  },
  {
    id: 'ACQ',
    name: 'Score ACQ-6 (Asthma Control Questionnaire)',
    category: 'ASTHMA',
    categoryLabel: 'Asthme',
    shortDesc: 'Questionnaire clinique validé sur 7 jours (moyenne de 0 à 6) mesurant le niveau de contrôle de l\'asthme.',
    reference: 'Juniper EF et al. Eur Respir J 1999; GINA 2024.',
    fields: [
      { key: 'q1', label: 'Réveils nocturnes par l\'asthme (0 = jamais → 6 = impossible de dormir)', type: 'select', options: [0,1,2,3,4,5,6].map(v => ({ label: `${v} / 6`, value: v })) },
      { key: 'q2', label: 'Intensité des symptômes au réveil (0 = aucun → 6 = très sévères)', type: 'select', options: [0,1,2,3,4,5,6].map(v => ({ label: `${v} / 6`, value: v })) },
      { key: 'q3', label: 'Limitation des activités quotidiennes (0 = pas limité → 6 = totalement limité)', type: 'select', options: [0,1,2,3,4,5,6].map(v => ({ label: `${v} / 6`, value: v })) },
      { key: 'q4', label: 'Essoufflement lié à l\'asthme (0 = aucun → 6 = très sévère)', type: 'select', options: [0,1,2,3,4,5,6].map(v => ({ label: `${v} / 6`, value: v })) },
      { key: 'q5', label: 'Sifflements thoraciques (0 = jamais → 6 = tout le temps)', type: 'select', options: [0,1,2,3,4,5,6].map(v => ({ label: `${v} / 6`, value: v })) },
      { key: 'q6', label: 'Bouffées de BDCA (Salbutamol) / jour (0 = aucune, 1 = 1-2, 2 = 3-4, 3 = 5-8, 4 = 9-12, 5 = 13-16, 6 = >16)', type: 'select', options: [0,1,2,3,4,5,6].map(v => ({ label: `${v} / 6`, value: v })) }
    ],
    calculate: (inputs) => {
      const keys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];
      const missing = keys.filter(k => inputs[k] === undefined || inputs[k] === null || inputs[k] === '');
      if (missing.length > 0) {
        return { value: 'Incomplet', interpretation: `${missing.length} item(s) manquant(s) sur 6.`, recommendation: 'Compléter les 6 items ACQ.', missing, details: {} };
      }
      const mean = Number((keys.reduce((acc, k) => acc + Number(inputs[k]), 0) / 6).toFixed(2));
      let interp = '';
      let reco = '';
      if (mean <= 0.75) {
        interp = `ACQ-6 = ${mean} (≤ 0,75) — Asthme bien contrôlé.`;
        reco = 'Maintenir le palier GINA actuel et réévaluer à 3-6 mois.';
      } else if (mean < 1.5) {
        interp = `ACQ-6 = ${mean} (0,76 - 1,49) — Zone intermédiaire / contrôle partiel.`;
        reco = 'Vérifier observance, technique de prise et éviction allergénique avant ajustement.';
      } else {
        interp = `ACQ-6 = ${mean} (≥ 1,50) — Asthme NON CONTRÔLÉ.`;
        reco = 'Ajustement à la hausse du traitement de fond (CSI/formotérol ou CSI/LABA) indiqué.';
      }
      return { value: `${mean} / 6`, interpretation: interp, recommendation: reco, missing: [], details: { mean } };
    }
  },

  // ------------------------------------------------------------------
  // SEPSIS & NEUROLOGIE : qSOFA, SOFA, Glasgow
  // ------------------------------------------------------------------
  {
    id: 'QSOFA',
    name: 'qSOFA (Quick SOFA - Dépistage Sepsis)',
    category: 'SEPSIS_NEURO',
    categoryLabel: 'Sepsis & Défaillance',
    shortDesc: 'Score d\'alerte rapide au lit du malade pour identifier un sepsis à haut risque de mortalité.',
    reference: 'Singer M et al. JAMA 2016 (Sepsis-3).',
    fields: [
      { key: 'alteredMental', label: 'Altération de la conscience (Score de Glasgow < 15)', type: 'boolean', defaultValue: false },
      { key: 'tachypnea', label: 'Fréquence respiratoire ≥ 22 cycles/minute', type: 'boolean', defaultValue: false },
      { key: 'hypotension', label: 'Pression artérielle systolique (PAS) ≤ 100 mmHg', type: 'boolean', defaultValue: false }
    ],
    calculate: (inputs) => {
      let score = 0;
      if (inputs.alteredMental) score += 1;
      if (inputs.tachypnea) score += 1;
      if (inputs.hypotension) score += 1;
      const interp = score >= 2
        ? `qSOFA = ${score}/3 — POSITIF : SUSPICION DE SEPSIS GRAVE.`
        : `qSOFA = ${score}/3 — Négatif (< 2 critères).`;
      const reco = score >= 2
        ? 'Calculer le score SOFA complet, hémocultures, lactates, remplissage vasculaire et antibiothérapie IV urgente.'
        : 'Poursuivre la surveillance clinique rapprochée des constantes.';
      return { value: `${score} / 3`, interpretation: interp, recommendation: reco, missing: [], details: { score } };
    }
  },
  {
    id: 'SOFA',
    name: 'Score SOFA (Défaillance d\'Organe / Sepsis-3)',
    category: 'SEPSIS_NEURO',
    categoryLabel: 'Sepsis & Défaillance',
    shortDesc: 'Évaluation quantitative de 6 défaillances d\'organes (0 à 24 points) : respiratoire, coagulation, hépatique, hémodynamique, neuro, rénale.',
    reference: 'Vincent JL et al. Intensive Care Med 1996; Sepsis-3 2016.',
    fields: [
      {
        key: 'resp',
        label: 'Respiratoire : PaO2/FiO2 (mmHg)',
        type: 'select',
        options: [
          { label: '≥ 400 (ou SpO2 normale air ambiant) (0 pt)', value: 0 },
          { label: '< 400 (+1 pt)', value: 1 },
          { label: '< 300 (+2 pts)', value: 2 },
          { label: '< 200 avec support ventilatoire (+3 pts)', value: 3 },
          { label: '< 100 avec support ventilatoire (+4 pts)', value: 4 }
        ]
      },
      {
        key: 'coag',
        label: 'Coagulation : Plaquettes (×10³/mm³)',
        type: 'select',
        options: [
          { label: '≥ 150 (0 pt)', value: 0 },
          { label: '< 150 (+1 pt)', value: 1 },
          { label: '< 100 (+2 pts)', value: 2 },
          { label: '< 50 (+3 pts)', value: 3 },
          { label: '< 20 (+4 pts)', value: 4 }
        ]
      },
      {
        key: 'liver',
        label: 'Hépatique : Bilirubine totale (mg/L / µmol/L)',
        type: 'select',
        options: [
          { label: '< 12 mg/L (< 20 µmol/L) (0 pt)', value: 0 },
          { label: '12 - 19 mg/L (20 - 32 µmol/L) (+1 pt)', value: 1 },
          { label: '20 - 59 mg/L (33 - 101 µmol/L) (+2 pts)', value: 2 },
          { label: '60 - 119 mg/L (102 - 204 µmol/L) (+3 pts)', value: 3 },
          { label: '≥ 120 mg/L (≥ 204 µmol/L) (+4 pts)', value: 4 }
        ]
      },
      {
        key: 'cardio',
        label: 'Cardiovasculaire : PAM / Catécholamines',
        type: 'select',
        options: [
          { label: 'PAM ≥ 70 mmHg (0 pt)', value: 0 },
          { label: 'PAM < 70 mmHg (+1 pt)', value: 1 },
          { label: 'Dopamine ≤ 5 µg/kg/min ou Dobutamine (+2 pts)', value: 2 },
          { label: 'Noradrénaline ≤ 0,1 µg/kg/min (+3 pts)', value: 3 },
          { label: 'Noradrénaline > 0,1 µg/kg/min (+4 pts)', value: 4 }
        ]
      },
      {
        key: 'cns',
        label: 'Neurologique : Score de Glasgow',
        type: 'select',
        options: [
          { label: 'GCS = 15 (0 pt)', value: 0 },
          { label: 'GCS 13 - 14 (+1 pt)', value: 1 },
          { label: 'GCS 10 - 12 (+2 pts)', value: 2 },
          { label: 'GCS 6 - 9 (+3 pts)', value: 3 },
          { label: 'GCS < 6 (+4 pts)', value: 4 }
        ]
      },
      {
        key: 'renal',
        label: 'Rénale : Créatininémie ou Diurèse',
        type: 'select',
        options: [
          { label: '< 12 mg/L (< 110 µmol/L) (0 pt)', value: 0 },
          { label: '12 - 19 mg/L (110 - 170 µmol/L) (+1 pt)', value: 1 },
          { label: '20 - 34 mg/L (171 - 299 µmol/L) (+2 pts)', value: 2 },
          { label: '35 - 49 mg/L ou diurèse < 500 mL/24h (+3 pts)', value: 3 },
          { label: '≥ 50 mg/L ou diurèse < 200 mL/24h (+4 pts)', value: 4 }
        ]
      }
    ],
    calculate: (inputs) => {
      const keys = ['resp', 'coag', 'liver', 'cardio', 'cns', 'renal'];
      const missing = keys.filter(k => inputs[k] === undefined || inputs[k] === null || inputs[k] === '');
      if (missing.length > 0) {
        return {
          value: 'Incomplet',
          interpretation: `${missing.length} défaillance(s) d'organe non renseignée(s).`,
          recommendation: 'Renseigner les 6 systèmes pour calculer le score SOFA.',
          missing,
          details: {}
        };
      }
      const total = keys.reduce((acc, k) => acc + Number(inputs[k]), 0);
      let interp = '';
      let reco = '';
      if (total < 2) {
        interp = `SOFA = ${total}/24 — Pas de critère Sepsis-3 (< 2 pts).`;
        reco = 'Surveillance clinique et biologique adaptée au tableau infectieux.';
      } else if (total <= 6) {
        interp = `SOFA = ${total}/24 (≥ 2) — SEPSIS CONFIRMÉ (Défaillance d'organe modérée).`;
        reco = 'Admission en soins continus / surveillance intensive, antibiothérapie IV probabiliste immédiate, optimisation hémodynamique.';
      } else {
        interp = `SOFA = ${total}/24 — SEPSIS SÉVÈRE / CHOC SEPTIQUE probable (mortalité élevée).`;
        reco = 'URGENCE RÉANIMATOIRE : Monitorage invasif, amines vasoactives si hypotension persistante, support ventilatoire / rénal.';
      }
      return { value: `${total} / 24`, interpretation: interp, recommendation: reco, missing: [], details: { total } };
    }
  },
  {
    id: 'GLASGOW',
    name: 'Échelle de Coma de Glasgow (GCS)',
    category: 'SEPSIS_NEURO',
    categoryLabel: 'Sepsis & Défaillance',
    shortDesc: 'Évaluation clinique chiffrée de l\'état de conscience (Yeux, Verbal, Moteur : score de 3 à 15).',
    reference: 'Teasdale G, Jennett B. Lancet 1974.',
    fields: [
      {
        key: 'eyes',
        label: 'Ouverture des yeux (Y)',
        type: 'select',
        options: [
          { label: 'Spontanée (4 pts)', value: 4 },
          { label: 'À la demande / à la voix (3 pts)', value: 3 },
          { label: 'À la douleur / stimulation (2 pts)', value: 2 },
          { label: 'Nulle (1 pt)', value: 1 }
        ]
      },
      {
        key: 'verbal',
        label: 'Réponse verbale (V)',
        type: 'select',
        options: [
          { label: 'Orientée (5 pts)', value: 5 },
          { label: 'Confuse (4 pts)', value: 4 },
          { label: 'Mots inappropriés (3 pts)', value: 3 },
          { label: 'Sons incompréhensibles (2 pts)', value: 2 },
          { label: 'Nulle (1 pt)', value: 1 }
        ]
      },
      {
        key: 'motor',
        label: 'Réponse motrice (M)',
        type: 'select',
        options: [
          { label: 'Obéit aux ordres (6 pts)', value: 6 },
          { label: 'Localise la douleur (5 pts)', value: 5 },
          { label: 'Retrait à la douleur (4 pts)', value: 4 },
          { label: 'Flexion anormale (3 pts)', value: 3 },
          { label: 'Extension anormale (2 pts)', value: 2 },
          { label: 'Nulle (1 pt)', value: 1 }
        ]
      }
    ],
    calculate: (inputs) => {
      const keys = ['eyes', 'verbal', 'motor'];
      const missing = keys.filter(k => inputs[k] === undefined || inputs[k] === null || inputs[k] === '');
      if (missing.length > 0) {
        return { value: 'Incomplet', interpretation: 'Renseigner les 3 composantes (Y, V, M).', recommendation: 'Compléter l\'examen neurologique.', missing, details: {} };
      }
      const total = Number(inputs.eyes) + Number(inputs.verbal) + Number(inputs.motor);
      let interp = '';
      let reco = '';
      if (total === 15) {
        interp = `GCS = 15/15 — Conscience normale.`;
        reco = 'Surveillance standard.';
      } else if (total >= 13) {
        interp = `GCS = ${total}/15 — Somnolence ou confusion légère.`;
        reco = 'Vérifier glycémie, oxymétrie et gazométrie artérielle (encéphalopathie hypercapnique ?).';
      } else if (total >= 9) {
        interp = `GCS = ${total}/15 — Obnubilation / altération modérée.`;
        reco = 'Soins continus, protéger les voies aériennes, oxygénothérapie.';
      } else {
        interp = `GCS = ${total}/15 — COMA GRAVE (GCS ≤ 8).`;
        reco = 'URGENCE VITALE : Protection des voies aériennes (intubation) et appel réanimation.';
      }
      return { value: `${total} / 15`, interpretation: interp, recommendation: reco, missing: [], details: { total } };
    }
  },

  // ------------------------------------------------------------------
  // TUBERCULOSE : Score de Ralph
  // ------------------------------------------------------------------
  {
    id: 'RALPH_SCORE',
    name: 'Score de Ralph (Gravité Radiologique TB)',
    category: 'TUBERCULOSIS',
    categoryLabel: 'Tuberculose & Séquelles',
    shortDesc: 'Quantification objective de l\'atteinte radiologique thoracique initiale dans la tuberculose pulmonaire.',
    reference: 'Ralph AP et al. Eur Respir J 2010.',
    fields: [
      {
        key: 'extentPercent',
        label: 'Étendue des opacités sur les deux champs pulmonaires (%)',
        type: 'select',
        options: [
          { label: '< 25% des poumons', value: 20 },
          { label: '25% à 50% des poumons', value: 40 },
          { label: '50% à 75% des poumons', value: 65 },
          { label: '> 75% des deux poumons', value: 85 }
        ]
      },
      {
        key: 'cavities',
        label: 'Présence de cavernes tuberculeuses à la radiographie',
        type: 'select',
        options: [
          { label: 'Aucune cavité visible (0 pt)', value: 0 },
          { label: 'Cavité(s) présente(s) (+40 pts)', value: 40 }
        ]
      }
    ],
    calculate: (inputs) => {
      const ext = Number(inputs.extentPercent || 0);
      const cav = Number(inputs.cavities || 0);
      const total = ext + cav;
      let interp = '';
      let reco = '';
      if (total < 40) {
        interp = `Score de Ralph = ${total}/125 — Atteinte radiologique légère.`;
        reco = 'Schéma antituberculeux standard 2RHZE/4RH en ambulatoire sous DOTS.';
      } else if (total <= 70) {
        interp = `Score de Ralph = ${total}/125 — Atteinte modérée à sévère.`;
        reco = 'Surveillance clinique et bactériologique rapprochée à M2.';
      } else {
        interp = `Score de Ralph = ${total}/125 — Atteinte TRÈS SÉVÈRE (risque élevé de séquelles).`;
        reco = 'Hospitalisation initiale recommandée, bilan nutritionnel, GeneXpert et surveillance des hémoptysies.';
      }
      return { value: `${total} / 125`, interpretation: interp, recommendation: reco, missing: [], details: { total, ext, cav } };
    }
  }
];

export interface SuggestedScoreGroup {
  pathologyLabel: string;
  badgeColor: string;
  scoreIds: ClinicalScoreCalculation['scoreId'][];
}

export function getSuggestedScoresForHypotheses(
  hypotheses: string[] = [],
  diagnoses: ClinicalDiagnosis[] = []
): SuggestedScoreGroup[] {
  const combinedText = [
    ...hypotheses,
    ...diagnoses.map(d => `${d.label} ${d.codeCIM11 || ''}`)
  ]
    .join(' ')
    .toLowerCase();

  const groups: SuggestedScoreGroup[] = [];

  if (/pneumoni|pac\b|pneumopathie|foyer infectieux|condensation/i.test(combinedText)) {
    groups.push({
      pathologyLabel: 'Pneumonie Aiguë Communautaire (PAC)',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      scoreIds: ['CRB65', 'CURB65', 'PSI_PORT']
    });
  }

  if (/embolie|\bep\b|thrombo|mtev|phlébite|tvp/i.test(combinedText)) {
    const hasConfirmedPE = diagnoses.some(
      d => d.status === 'CONFIRME' && /embolie|\bep\b/i.test(d.label)
    );
    groups.push({
      pathologyLabel: hasConfirmedPE ? 'Embolie Pulmonaire (Probabilité & Pronostic)' : 'Suspicion d\'Embolie Pulmonaire',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      scoreIds: hasConfirmedPE ? ['PESI', 'SPESI', 'WELLS_PE', 'GENEVA_REVISED'] : ['WELLS_PE', 'GENEVA_REVISED', 'PESI', 'SPESI']
    });
  }

  if (/bpco|bronchopneumopathie|emphys[eè]me/i.test(combinedText)) {
    groups.push({
      pathologyLabel: 'BPCO',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      scoreIds: ['CAT', 'mMRC', 'BODE', 'GOLD_ABE']
    });
  }

  if (/asthme|crise d'asthme|hyperr[ée]activit[ée]/i.test(combinedText)) {
    groups.push({
      pathologyLabel: 'Asthme',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      scoreIds: ['ACT', 'ACQ']
    });
  }

  if (/sepsis|choc septique|d[ée]tresse|septique|bact[ée]ri[ée]mie/i.test(combinedText)) {
    groups.push({
      pathologyLabel: 'Sepsis & Défaillance d\'Organe',
      badgeColor: 'bg-red-100 text-red-800 border-red-200',
      scoreIds: ['QSOFA', 'SOFA', 'GLASGOW']
    });
  }

  if (/tuberculose|\btb\b|bk\b|phtisi/i.test(combinedText)) {
    groups.push({
      pathologyLabel: 'Tuberculose Pulmonaire',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      scoreIds: ['RALPH_SCORE', 'mMRC']
    });
  }

  return groups;
}

function parseSystolicBP(bp?: string): { pas?: number; pad?: number } {
  if (!bp) return {};
  const m = bp.match(/(\d{2,3})\s*[/\\-]\s*(\d{2,3})/);
  if (!m) return {};
  return { pas: Number(m[1]), pad: Number(m[2]) };
}

export function buildAutoFilledScoreInputs(
  scoreId: ClinicalScoreCalculation['scoreId'],
  patient?: Patient | null,
  twelveSteps?: Partial<ConsultationTwelveSteps> | null,
  explorations: MedicalExploration[] = []
): Record<string, any> {
  const vitals = twelveSteps?.vitals;
  const risk = twelveSteps?.riskFactors;
  const { pas, pad } = parseSystolicBP(vitals?.bp);
  const age = patient?.age;
  const gender = patient?.gender;
  const rr = vitals?.rr;
  const pulse = vitals?.pulse;
  const temp = vitals?.temperature;
  const gcs = vitals?.glasgowScore;
  const spo2 = vitals?.spo2Mode === 'SOUS_O2' ? vitals?.spo2O2 : (vitals?.spo2Ambient ?? vitals?.spo2O2);
  const bmi = vitals?.bmi;
  const mmrc = twelveSteps?.mmrcGrade;

  const antecedents = [
    ...(patient?.medicalAntecedents?.selected || []),
    ...(risk?.medicalAntecedents || []),
    patient?.chronicConditions || '',
    risk?.diabetesHta || ''
  ]
    .join(' ')
    .toLowerCase();

  // Extract latest relevant exploration values if available
  const patientExps = patient
    ? explorations.filter(e => e.patientId === patient.id)
    : [];

  let latestVemsPct: number | undefined;
  let latestTm6Meters: number | undefined;
  let latestUreaVal: number | undefined;
  let latestCreatVal: number | undefined;
  let latestPlatelets: number | undefined;

  for (const exp of patientExps) {
    if (exp.spirometryData?.vemsPostPct !== undefined) {
      latestVemsPct = exp.spirometryData.vemsPostPct;
    } else if (exp.spirometryData?.vemsPrePct !== undefined && latestVemsPct === undefined) {
      latestVemsPct = exp.spirometryData.vemsPrePct;
    }
    for (const p of exp.extractedParameters || []) {
      const pname = (p.parameter || '').toLowerCase();
      const numVal = parseFloat(String(p.value || '').replace(',', '.'));
      if (isNaN(numVal)) continue;
      if (pname.includes('vems') && (p.unit || '').includes('%') && latestVemsPct === undefined) {
        latestVemsPct = numVal;
      }
      if ((pname.includes('tm6') || pname.includes('marche')) && latestTm6Meters === undefined) {
        latestTm6Meters = numVal;
      }
      if (pname.includes('urée') || pname.includes('uree')) {
        latestUreaVal = numVal;
      }
      if (pname.includes('créatinine') || pname.includes('creatinine')) {
        latestCreatVal = numVal;
      }
      if (pname.includes('plaquette')) {
        latestPlatelets = numVal;
      }
    }
  }

  const isConfused = gcs !== undefined && gcs < 15;
  const isHypotensive90 = pas !== undefined && (pas < 90 || (pad !== undefined && pad <= 60));

  switch (scoreId) {
    case 'CRB65':
      return {
        confusion: isConfused,
        rr: rr !== undefined ? rr >= 30 : false,
        bp: isHypotensive90,
        age65: age !== undefined ? age >= 65 : false
      };

    case 'CURB65':
      return {
        confusion: isConfused,
        urea: latestUreaVal !== undefined ? (latestUreaVal > 7 || (latestUreaVal > 0.42 && latestUreaVal < 3) ? 1 : 0) : 0,
        rr: rr !== undefined ? rr >= 30 : false,
        bp: isHypotensive90,
        age65: age !== undefined ? age >= 65 : false
      };

    case 'PSI_PORT':
      return {
        age: age ?? '',
        gender: gender ?? '',
        liverDisease: /h[ée]patopathie|cirrhose/i.test(antecedents),
        heartFailure: /cardiopathie|insuffisance cardiaque/i.test(antecedents),
        renalDisease: /r[ée]nale/i.test(antecedents),
        confusion: isConfused,
        rr30: rr !== undefined ? rr >= 30 : false,
        pas90: pas !== undefined ? pas < 90 : false,
        tempExtreme: temp !== undefined ? (temp < 35 || temp >= 40) : false,
        hr125: pulse !== undefined ? pulse >= 125 : false,
        hypoxemia: spo2 !== undefined ? spo2 < 90 : false
      };

    case 'WELLS_PE':
      return {
        hrAbove100: pulse !== undefined ? pulse > 100 : false,
        hemoptysis: /h[ée]moptysie/i.test(`${twelveSteps?.chiefComplaint || ''} ${twelveSteps?.historyOfIllness || ''}`)
      };

    case 'GENEVA_REVISED':
      return {
        age65: age !== undefined ? age > 65 : false,
        hemoptysis: /h[ée]moptysie/i.test(`${twelveSteps?.chiefComplaint || ''} ${twelveSteps?.historyOfIllness || ''}`),
        heartRateBand: pulse === undefined ? 0 : pulse >= 95 ? 5 : pulse >= 75 ? 3 : 0
      };

    case 'PESI':
      return {
        age: age ?? '',
        male: gender === 'M',
        heartFailure: /cardiopathie|insuffisance cardiaque/i.test(antecedents),
        chronicLungDisease: /bpco|asthme|fibrose/i.test(antecedents),
        hr110: pulse !== undefined ? pulse >= 110 : false,
        pas100: pas !== undefined ? pas < 100 : false,
        rr30: rr !== undefined ? rr >= 30 : false,
        temp36: temp !== undefined ? temp < 36 : false,
        alteredMental: isConfused,
        spo2Low: spo2 !== undefined ? spo2 < 90 : false
      };

    case 'SPESI':
      return {
        age80: age !== undefined ? age > 80 : false,
        cardioPulm: /cardiopathie|bpco|asthme/i.test(antecedents),
        hr110: pulse !== undefined ? pulse >= 110 : false,
        pas100: pas !== undefined ? pas < 100 : false,
        spo2Low: spo2 !== undefined ? spo2 < 90 : false
      };

    case 'mMRC':
      return mmrc !== undefined ? { grade: mmrc } : {};

    case 'GOLD_ABE':
      return {
        mmrc: mmrc !== undefined ? (mmrc >= 2 ? 'HIGH' : 'LOW') : '',
        moderateExacerbations: 0,
        hospitalExacerbations: 0
      };

    case 'BODE':
      return {
        bmi: bmi ?? '',
        vemsPct: latestVemsPct ?? '',
        mmrc: mmrc !== undefined ? (mmrc <= 1 ? 0 : mmrc === 2 ? 1 : mmrc === 3 ? 2 : 3) : '',
        tm6Meters: latestTm6Meters ?? ''
      };

    case 'QSOFA':
      return {
        alteredMental: isConfused,
        tachypnea: rr !== undefined ? rr >= 22 : false,
        hypotension: pas !== undefined ? pas <= 100 : false
      };

    case 'SOFA': {
      let cns = 0;
      if (gcs !== undefined) {
        if (gcs === 15) cns = 0;
        else if (gcs >= 13) cns = 1;
        else if (gcs >= 10) cns = 2;
        else if (gcs >= 6) cns = 3;
        else cns = 4;
      }
      let coag = '';
      if (latestPlatelets !== undefined) {
        if (latestPlatelets >= 150) coag = '0';
        else if (latestPlatelets >= 100) coag = '1';
        else if (latestPlatelets >= 50) coag = '2';
        else if (latestPlatelets >= 20) coag = '3';
        else coag = '4';
      }
      let renal = '';
      if (latestCreatVal !== undefined) {
        if (latestCreatVal < 12) renal = '0';
        else if (latestCreatVal <= 19) renal = '1';
        else if (latestCreatVal <= 34) renal = '2';
        else if (latestCreatVal <= 49) renal = '3';
        else renal = '4';
      }
      return {
        cns: gcs !== undefined ? cns : '',
        coag,
        renal
      };
    }

    default:
      return {};
  }
}
