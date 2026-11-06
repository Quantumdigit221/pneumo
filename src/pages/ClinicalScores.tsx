import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ClinicalScoreCalculation } from '../types';
import {
  Calculator,
  Activity,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Info,
  Save,
  Search,
  Filter,
  Stethoscope,
  TrendingUp,
  FileSpreadsheet,
  RotateCcw,
  X
} from 'lucide-react';

interface ScoreDefinition {
  id: ClinicalScoreCalculation['scoreId'];
  name: string;
  category: ClinicalScoreCalculation['scoreCategory'];
  categoryLabel: string;
  shortDesc: string;
  reference: string;
  calculate: (inputs: Record<string, any>) => {
    value: number | string;
    interpretation: string;
    recommendation: string;
    missing: string[];
    details: Record<string, any>;
  };
  fields: {
    key: string;
    label: string;
    type: 'select' | 'number' | 'boolean';
    options?: { label: string; value: any; points?: number }[];
    unit?: string;
    placeholder?: string;
    defaultValue?: any;
  }[];
}

export const CLINICAL_SCORES_DEFINITIONS: ScoreDefinition[] = [
  // 1. ASTHME - ACT (Asthma Control Test)
  {
    id: 'ACT',
    name: 'ACT (Asthma Control Test)',
    category: 'ASTHMA',
    categoryLabel: 'Asthme',
    shortDesc: 'Évaluation standardisée du contrôle de l\'asthme sur les 4 dernières semaines (score de 5 à 25).',
    reference: 'Nathan RA et al. J Allergy Clin Immunol. 2004; GINA 2024.',
    fields: [
      {
        key: 'q1',
        label: 'Gêne au travail / activités quotidiennes',
        type: 'select',
        options: [
          { label: 'Tout le temps (1 pt)', value: 1 },
          { label: 'La plupart du temps (2 pts)', value: 2 },
          { label: 'De temps en temps (3 pts)', value: 3 },
          { label: 'Rarement (4 pts)', value: 4 },
          { label: 'Jamais (5 pts)', value: 5 }
        ]
      },
      {
        key: 'q2',
        label: 'Fréquence de l\'essoufflement',
        type: 'select',
        options: [
          { label: 'Plus d\'une fois par jour (1 pt)', value: 1 },
          { label: 'Une fois par jour (2 pts)', value: 2 },
          { label: '3 à 6 fois par semaine (3 pts)', value: 3 },
          { label: '1 à 2 fois par semaine (4 pts)', value: 4 },
          { label: 'Jamais (5 pts)', value: 5 }
        ]
      },
      {
        key: 'q3',
        label: 'Réveils nocturnes ou précoces par l\'asthme',
        type: 'select',
        options: [
          { label: '4 nuits ou plus par semaine (1 pt)', value: 1 },
          { label: '2 à 3 nuits par semaine (2 pts)', value: 2 },
          { label: 'Une fois par semaine (3 pts)', value: 3 },
          { label: '1 ou 2 fois dans le mois (4 pts)', value: 4 },
          { label: 'Jamais (5 pts)', value: 5 }
        ]
      },
      {
        key: 'q4',
        label: 'Recours au traitement de secours (ex: Salbutamol)',
        type: 'select',
        options: [
          { label: '3 fois ou plus par jour (1 pt)', value: 1 },
          { label: '1 à 2 fois par jour (2 pts)', value: 2 },
          { label: '2 à 3 fois par semaine (3 pts)', value: 3 },
          { label: '1 fois par semaine ou moins (4 pts)', value: 4 },
          { label: 'Jamais (5 pts)', value: 5 }
        ]
      },
      {
        key: 'q5',
        label: 'Auto-évaluation du contrôle de l\'asthme',
        type: 'select',
        options: [
          { label: 'Pas du tout contrôlé (1 pt)', value: 1 },
          { label: 'Mal contrôlé (2 pts)', value: 2 },
          { label: 'Assez bien contrôlé (3 pts)', value: 3 },
          { label: 'Bien contrôlé (4 pts)', value: 4 },
          { label: 'Parfaitement contrôlé (5 pts)', value: 5 }
        ]
      }
    ],
    calculate: (inputs) => {
      const keys = ['q1', 'q2', 'q3', 'q4', 'q5'];
      const missing = keys.filter(k => inputs[k] === undefined || inputs[k] === null || inputs[k] === '');
      if (missing.length > 0) {
        return {
          value: 'Incomplet',
          interpretation: `${missing.length} question(s) non renseignée(s).`,
          recommendation: 'Compléter toutes les 5 rubriques pour calculer le score ACT.',
          missing,
          details: {}
        };
      }
      const sum = keys.reduce((acc, k) => acc + Number(inputs[k]), 0);
      let interp = '';
      let reco = '';
      if (sum >= 20) {
        interp = `Score ${sum}/25 — Asthme bien contrôlé.`;
        reco = 'Maintenir le palier thérapeutique actuel. Vérifier l\'observance et le carnet de suivi à 3-6 mois.';
      } else if (sum >= 16) {
        interp = `Score ${sum}/25 — Asthme partiellement contrôlé.`;
        reco = 'Évaluer l\'observance et la technique de prise du traitement de fond (CSI/LABA). Discuter une escalade thérapeutique.';
      } else {
        interp = `Score ${sum}/25 — Asthme non contrôlé / sévère.`;
        reco = 'Alerte : Risque élevé d\'exacerbation aiguë. Escalade d\'au moins 1 palier GINA requise. Vérifier comorbidités (rhinite, RGO) et environnement.';
      }
      return { value: sum, interpretation: interp, recommendation: reco, missing: [], details: { total: sum } };
    }
  },

  // 2. BPCO - mMRC Dyspnea Scale
  {
    id: 'mMRC',
    name: 'Échelle de Dyspnée mMRC (Modified Medical Research Council)',
    category: 'COPD',
    categoryLabel: 'BPCO & Tabac',
    shortDesc: 'Cotation clinique standardisée du niveau de dyspnée d\'effort chez le patient BPCO (stades 0 à 4).',
    reference: 'Fletcher CM. BMJ 1960; Cellelli BR et al. GOLD 2024.',
    fields: [
      {
        key: 'grade',
        label: 'Sélectionnez le niveau d\'essoufflement correspondant au patient :',
        type: 'select',
        options: [
          { label: 'Grade 0 : Essoufflement uniquement lors d\'efforts physiques intenses', value: 0 },
          { label: 'Grade 1 : Essoufflement à la marche rapide à plat ou en montant une légère pente', value: 1 },
          { label: 'Grade 2 : Marche plus lentement que les personnes du même âge ou doit s\'arrêter à son propre rythme à plat', value: 2 },
          { label: 'Grade 3 : S\'arrête pour respirer après avoir marché environ 100 mètres ou après quelques minutes à plat', value: 3 },
          { label: 'Grade 4 : Trop essoufflé pour quitter la maison ou essoufflé en s\'habillant / se déshabillant', value: 4 }
        ]
      }
    ],
    calculate: (inputs) => {
      if (inputs.grade === undefined || inputs.grade === null || inputs.grade === '') {
        return {
          value: 'Incomplet',
          interpretation: 'Aucun grade sélectionné.',
          recommendation: 'Sélectionner le grade de dyspnée.',
          missing: ['grade'],
          details: {}
        };
      }
      const g = Number(inputs.grade);
      const isHighSymptom = g >= 2;
      return {
        value: `Grade ${g}`,
        interpretation: `mMRC = ${g} : ${isHighSymptom ? 'Haut niveau de symptômes de dyspnée (≥ 2).' : 'Niveau de dyspnée faible (< 2).'}`,
        recommendation: isHighSymptom
          ? 'Groupe B ou E selon l\'historique d\'exacerbations. Indication prioritaire à une bithérapie bronchodilatatrice (LAMA + LABA) et réhabilitation respiratoire.'
          : 'Groupe A ou E. Monothérapie bronchodilatatrice initiale (LAMA ou LABA) envisageable selon exacerbations.',
        missing: [],
        details: { grade: g, highSymptom: isHighSymptom }
      };
    }
  },

  // 3. BPCO - Classification GOLD A/B/E
  {
    id: 'GOLD_ABE',
    name: 'Classification GOLD 2024 (Groupes A, B, E)',
    category: 'COPD',
    categoryLabel: 'BPCO & Tabac',
    shortDesc: 'Stratification combinée des patients BPCO selon la dyspnée (mMRC/CAT) et le risque d\'exacerbations.',
    reference: 'Global Initiative for Chronic Obstructive Lung Disease (GOLD) Report 2023-2024.',
    fields: [
      {
        key: 'mmrc',
        label: 'Score mMRC de dyspnée',
        type: 'select',
        options: [
          { label: 'mMRC 0 à 1 (Peu symptomatique)', value: 'LOW' },
          { label: 'mMRC ≥ 2 (Très symptomatique)', value: 'HIGH' }
        ]
      },
      {
        key: 'moderateExacerbations',
        label: 'Nombre d\'exacerbations modérées (sans hospitalisation) sur les 12 derniers mois',
        type: 'number',
        placeholder: 'ex: 1',
        defaultValue: 0
      },
      {
        key: 'hospitalExacerbations',
        label: 'Nombre d\'exacerbations sévères ayant nécessité une hospitalisation (CHREIN ou autre)',
        type: 'number',
        placeholder: 'ex: 0',
        defaultValue: 0
      }
    ],
    calculate: (inputs) => {
      const missing = [];
      if (!inputs.mmrc) missing.push('mmrc');
      if (inputs.moderateExacerbations === undefined) missing.push('moderateExacerbations');
      if (inputs.hospitalExacerbations === undefined) missing.push('hospitalExacerbations');
      if (missing.length > 0) {
        return {
          value: 'Incomplet',
          interpretation: 'Données manquantes pour la classification GOLD.',
          recommendation: 'Renseigner le mMRC et le nombre d\'exacerbations annuelles.',
          missing,
          details: {}
        };
      }
      const mod = Number(inputs.moderateExacerbations || 0);
      const hosp = Number(inputs.hospitalExacerbations || 0);
      const totalExac = mod + hosp;
      const isHighRisk = hosp >= 1 || totalExac >= 2;
      const isHighSymptom = inputs.mmrc === 'HIGH';

      let group = 'A';
      let reco = '';
      if (isHighRisk) {
        group = 'Groupe E (Exacerbateur)';
        reco = 'Trithérapie ou bithérapie LAMA + LABA d\'emblée. Si éosinophiles sanguins ≥ 300/µL ou antécédent d\'hospitalisation sévère : ajouter Corticoïde Inhalé (CSI). Vaccinations antipneumococcique et antigrippale.';
      } else if (isHighSymptom) {
        group = 'Groupe B (Symptomatique non-exacerbateur)';
        reco = 'Association LAMA + LABA recommandée pour soulager la dyspnée et améliorer la capacité à l\'exercice. Réhabilitation respiratoire.';
      } else {
        group = 'Groupe A (Peu symptomatique, faible risque)';
        reco = 'Bronchodilatateur à longue durée d\'action en monothérapie (LAMA ou LABA). Sevrage tabagique impératif.';
      }

      return {
        value: group,
        interpretation: `Patient classé ${group} (${totalExac} exacerbation(s) dont ${hosp} hospitalisation(s)).`,
        recommendation: reco,
        missing: [],
        details: { group, totalExac, hosp, isHighRisk }
      };
    }
  },

  // 4. PNEUMONIE - Score CURB-65 / CRB-65
  {
    id: 'CURB65',
    name: 'Score de Gravité CURB-65 & CRB-65 (Pneumonies Aiguës)',
    category: 'PNEUMONIA',
    categoryLabel: 'Pneumonie & Détresse',
    shortDesc: 'Évaluation du risque de mortalité à 30 jours pour guider l\'orientation : Ambulatoire vs Hospitalisation CHREIN vs Soins Intensifs.',
    reference: 'Lim WS et al. Thorax 2003; British Thoracic Society (BTS).',
    fields: [
      {
        key: 'confusion',
        label: 'C - Confusion mentale / désorientation temporo-spatiale récente',
        type: 'boolean',
        defaultValue: false
      },
      {
        key: 'urea',
        label: 'U - Urée sanguine > 7 mmol/L (ou > 0.40 g/L) [Si non dosée, évaluation CRB-65]',
        type: 'select',
        options: [
          { label: 'Non dosée / Urée normale (≤ 7 mmol/L)', value: 0 },
          { label: 'Urée élevée (> 7 mmol/L ou > 0.40 g/L) (+1 pt)', value: 1 }
        ]
      },
      {
        key: 'rr',
        label: 'R - Fréquence respiratoire ≥ 30 cycles/minute (Tachypnée)',
        type: 'boolean',
        defaultValue: false
      },
      {
        key: 'bp',
        label: 'B - Pression artérielle basse : PAS < 90 mmHg OU PAD ≤ 60 mmHg',
        type: 'boolean',
        defaultValue: false
      },
      {
        key: 'age65',
        label: '65 - Âge du patient ≥ 65 ans',
        type: 'boolean',
        defaultValue: false
      }
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
        reco = 'Prise en charge ambulatoire envisageable avec antibiothérapie orale (Amoxicilline 1g x3/j). Réévaluation obligatoire à 48 heures.';
      } else if (score === 1) {
        interp = `CURB-65 = 1 point (Mortalité estimée 2.7%). Risque faible.`;
        reco = 'Traitement à domicile possible sous surveillance rapprochée, sauf facteurs sociaux défavorables ou comorbidités décompensées.';
      } else if (score === 2) {
        interp = `CURB-65 = 2 points (Mortalité estimée 6.8%). Risque modéré.`;
        reco = 'Hospitalisation recommandée dans le service de Pneumologie CHREIN (lit conventionnel). Antibiothérapie IV ou orale supervisée.';
      } else if (score >= 3) {
        interp = `CURB-65 = ${score} points (Mortalité estimée 14 à 30%). PNEUMONIE GRAVE.`;
        reco = 'URGENCE : Hospitalisation immédiate en soins continus respiratoires ou réanimation. Oxygénothérapie haut débit, bithérapie IV (Ceftriaxone + Macrolide ou Fluoroquinolone).';
      }

      return {
        value: `${score} / 5 points`,
        interpretation: interp,
        recommendation: reco,
        missing: [],
        details: { score }
      };
    }
  },

  // 5. EMBOLIE PULMONAIRE - Score de Wells révisé
  {
    id: 'WELLS_PE',
    name: 'Score de Wells (Suspicion d\'Embolie Pulmonaire)',
    category: 'EMBOLISM',
    categoryLabel: 'Embolie Pulmonaire',
    shortDesc: 'Calcul de probabilité clinique d\'embolie pulmonaire aiguë pour orienter D-Dimères vs Angioscanner thoracique.',
    reference: 'Wells PS et al. Ann Intern Med 2001; ESC Guidelines 2019.',
    fields: [
      {
        key: 'signsDVT',
        label: 'Signes cliniques de thrombose veineuse profonde (mollet gonflé, douloureux à la palpation) (+3 pts)',
        type: 'boolean',
        defaultValue: false
      },
      {
        key: 'noAltDiagnosis',
        label: 'Diagnostic alternatif moins probable que l\'embolie pulmonaire (+3 pts)',
        type: 'boolean',
        defaultValue: false
      },
      {
        key: 'hrAbove100',
        label: 'Fréquence cardiaque > 100 battements/minute (Tachycardie) (+1.5 pt)',
        type: 'boolean',
        defaultValue: false
      },
      {
        key: 'priorImmobilization',
        label: 'Immobilisation récente (alitement > 3j) ou chirurgie dans les 4 dernières semaines (+1.5 pt)',
        type: 'boolean',
        defaultValue: false
      },
      {
        key: 'priorPEorDVT',
        label: 'Antécédent personnel documenté de MTEV (TVP ou EP) (+1.5 pt)',
        type: 'boolean',
        defaultValue: false
      },
      {
        key: 'hemoptysis',
        label: 'Présence d\'hémoptysie (+1 pt)',
        type: 'boolean',
        defaultValue: false
      },
      {
        key: 'cancerActive',
        label: 'Cancer actif ou traité dans les 6 derniers mois (+1 pt)',
        type: 'boolean',
        defaultValue: false
      }
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
        interp = `Score = ${score} — Probabilité clinique FAIBLE (Risque EP ~10%).`;
        reco = 'Dosage des D-Dimères en première intention. Si D-Dimères négatifs (< 500 ng/mL ou ajustés à l\'âge) : diagnostic écarté sans scanner.';
      } else if (score <= 6) {
        interp = `Score = ${score} — Probabilité clinique INTERMÉDIAIRE (Risque EP ~30%).`;
        reco = 'Dosage des D-Dimères ou Angioscanner thoracique direct selon disponibilité au CHREIN. Anticoagulation préventive à discuter.';
      } else {
        interp = `Score = ${score} — Probabilité clinique FORTE (Risque EP > 65%).`;
        reco = 'Angioscanner thoracique spiralé en URGENCE sans attendre les D-Dimères. Initier immédiatement une héparinothérapie curative sauf contre-indication majeure.';
      }

      return {
        value: `${score} points`,
        interpretation: interp,
        recommendation: reco,
        missing: [],
        details: { score }
      };
    }
  },

  // 6. TUBERCULOSE - Score de Ralph (Lésions Radiologiques de Tuberculose)
  {
    id: 'RALPH_SCORE',
    name: 'Score de Ralph (Gravité Radiologique de la Tuberculose)',
    category: 'TUBERCULOSIS',
    categoryLabel: 'Tuberculose & Séquelles',
    shortDesc: 'Quantification objective de l\'atteinte radiologique thoracique initiale et du risque de décès/séquelles.',
    reference: 'Ralph AP et al. Eur Respir J. 2010; 35(6):1343-50.',
    fields: [
      {
        key: 'extentPercent',
        label: 'Étendue des opacités/infiltrats sur l\'ensemble des deux champs pulmonaires (%)',
        type: 'select',
        options: [
          { label: 'Moins de 25% des poumons', value: 20 },
          { label: '25% à 50% des poumons', value: 40 },
          { label: '50% à 75% des poumons', value: 65 },
          { label: 'Plus de 75% des deux poumons', value: 85 }
        ]
      },
      {
        key: 'cavities',
        label: 'Présence de cavernes/cavités tuberculeuses à la radiographie',
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
        interp = `Score de Ralph = ${total} — Atteinte radiologique légère.`;
        reco = 'Schéma antituberculeux standard 2RHZE/4RH en ambulatoire sous supervision directe (DOTS).';
      } else if (total <= 70) {
        interp = `Score de Ralph = ${total} — Atteinte radiologique modérée à sévère.`;
        reco = 'Surveillance clinique et bactériologique rapprochée (frottis/GeneXpert à M2). Vérifier fonction respiratoire.';
      } else {
        interp = `Score de Ralph = ${total} — Atteinte radiologique TRÈS SÉVÈRE (Risque élevé de séquelles et mortalité).`;
        reco = 'Hospitalisation initiale recommandée au CHREIN. Bilan nutritionnel, recherche de résistance (GeneXpert MTB/RIF), prévention des hémoptysies de survenue cavitaire.';
      }

      return {
        value: `${total} / 125`,
        interpretation: interp,
        recommendation: reco,
        missing: [],
        details: { total, ext, cav }
      };
    }
  },

  // 7. SEPSIS & DÉFAILLANCE - qSOFA (Quick SOFA)
  {
    id: 'QSOFA',
    name: 'qSOFA (Quick SOFA - Dépistage du Sepsis Grave)',
    category: 'SEPSIS_NEURO',
    categoryLabel: 'Sepsis & Défaillance',
    shortDesc: 'Score d\'alerte rapide au lit du malade pour identifier les infections respiratoires à haut risque de défaillance d\'organe.',
    reference: 'Singer M et al. JAMA. 2016 (Third International Consensus Definitions for Sepsis).',
    fields: [
      {
        key: 'alteredMental',
        label: 'Altération de la conscience (Score de Glasgow < 15)',
        type: 'boolean',
        defaultValue: false
      },
      {
        key: 'tachypnea',
        label: 'Fréquence respiratoire ≥ 22 cycles/minute',
        type: 'boolean',
        defaultValue: false
      },
      {
        key: 'hypotension',
        label: 'Pression artérielle systolique (PAS) ≤ 100 mmHg',
        type: 'boolean',
        defaultValue: false
      }
    ],
    calculate: (inputs) => {
      let score = 0;
      if (inputs.alteredMental) score += 1;
      if (inputs.tachypnea) score += 1;
      if (inputs.hypotension) score += 1;

      let interp = '';
      let reco = '';
      if (score >= 2) {
        interp = `qSOFA = ${score}/3 — POSITIF : SUSPICION DE SEPSIS GRAVE. Risque élevé de mortalité hospitalière.`;
        reco = 'ALERTE IMMÉDIATE : Remplissage vasculaire, antibiothérapie IV urgente à large spectre, prélèvements d\'hémocultures, dosage des lactates et surveillance continue en unité de soins intensifs.';
      } else {
        interp = `qSOFA = ${score}/3 — Négatif (< 2 critères). Faible probabilité de défaillance d\'organe immédiate.`;
        reco = 'Poursuivre la surveillance régulière des constantes et traiter le foyer infectieux sous surveillance.';
      }

      return {
        value: `${score} / 3 critères`,
        interpretation: interp,
        recommendation: reco,
        missing: [],
        details: { score, isPositive: score >= 2 }
      };
    }
  },

  // 8. NEUROLOGIE / CONSCIENCE - Échelle de Glasgow (GCS)
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
          { label: 'Sons incompréhensibles / gémissements (2 pts)', value: 2 },
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
          { label: 'Retrait à la douleur (évitement) (4 pts)', value: 4 },
          { label: 'Flexion anormale (décortication) (3 pts)', value: 3 },
          { label: 'Extension anormale (décérébration) (2 pts)', value: 2 },
          { label: 'Nulle / hypotonie (1 pt)', value: 1 }
        ]
      }
    ],
    calculate: (inputs) => {
      const keys = ['eyes', 'verbal', 'motor'];
      const missing = keys.filter(k => inputs[k] === undefined || inputs[k] === null || inputs[k] === '');
      if (missing.length > 0) {
        return {
          value: 'Incomplet',
          interpretation: 'Renseigner les 3 composantes (Yeux, Verbal, Moteur).',
          recommendation: 'Compléter l\'examen neurologique.',
          missing,
          details: {}
        };
      }
      const total = Number(inputs.eyes) + Number(inputs.verbal) + Number(inputs.motor);
      let interp = '';
      let reco = '';
      if (total === 15) {
        interp = `GCS = 15/15 (Y${inputs.eyes} V${inputs.verbal} M${inputs.motor}) — Conscience normale.`;
        reco = 'Surveillance standard.';
      } else if (total >= 13) {
        interp = `GCS = ${total}/15 (Y${inputs.eyes} V${inputs.verbal} M${inputs.motor}) — Somnolence ou confusion légère.`;
        reco = 'Surveiller glycémie capillaire, oxymétrie et gazométrie artérielle (encéphalopathie hypercapnique ?).';
      } else if (total >= 9) {
        interp = `GCS = ${total}/15 — Altération modérée de la conscience / Obnubilation.`;
        reco = 'Surveillance rapprochée en soins continus. Protéger les voies aériennes, oxygéner, éliminer cause métabolique ou méningée.';
      } else {
        interp = `GCS = ${total}/15 — COMA GRAVE (GCS ≤ 8).`;
        reco = 'URGENCE VITALE : Protection des voies aériennes supérieures (intubation orotrachéale). Appel réanimateur CHREIN.';
      }

      return {
        value: `${total} / 15`,
        interpretation: interp,
        recommendation: reco,
        missing: [],
        details: { total, eyes: inputs.eyes, verbal: inputs.verbal, motor: inputs.motor }
      };
    }
  }
];

export const ClinicalScores: React.FC = () => {
  const { patients, clinicalScoreCalculations, saveClinicalScoreCalculation, currentUser, currentCenter } = useStore();

  const [selectedScoreId, setSelectedScoreId] = useState<string>('CURB65');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [formInputs, setFormInputs] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Direct voice action listener for clinical scores
  useEffect(() => {
    const handleVoiceAction = (event: any) => {
      const detail = event?.detail;
      if (!detail) return;
      if (detail.actionType === 'CALCULATE_SCORE') {
        const scType = String(detail.actionData?.scoreType || detail.actionData?.scoreCalculation?.scoreId || '').toUpperCase();
        if (scType.includes('WELLS')) setSelectedScoreId('WELLS_PE');
        else if (scType.includes('CURB')) setSelectedScoreId('CURB65');
        else if (scType.includes('MMRC')) setSelectedScoreId('mMRC');
        else if (scType.includes('GOLD')) setSelectedScoreId('GOLD_ABE');
        else if (scType.includes('ACT')) setSelectedScoreId('ACT');
        else if (scType.includes('GLASGOW')) setSelectedScoreId('GLASGOW');
        else if (scType.includes('SOFA')) setSelectedScoreId('QSOFA');

        const scoreName = detail.actionData?.scoreCalculation?.scoreName || 'Score clinique';
        const calcVal = detail.actionData?.scoreCalculation?.calculatedValue || '';
        setVoiceNotice(`⚡ ${scoreName} calculé et consigné directement (Résultat : ${calcVal}).`);
        setTimeout(() => setVoiceNotice(null), 7000);
      }
    };
    window.addEventListener('clinical-voice-action', handleVoiceAction);
    return () => window.removeEventListener('clinical-voice-action', handleVoiceAction);
  }, []);

  const activeScoreDef = CLINICAL_SCORES_DEFINITIONS.find(s => s.id === selectedScoreId) || CLINICAL_SCORES_DEFINITIONS[0];

  const handleInputChange = (key: string, value: any) => {
    setFormInputs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReset = () => {
    setFormInputs({});
  };

  // Live calculation
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
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'ALL' || s.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Voice Action Direct Execution Banner */}
      {voiceNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
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
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                Bibliothèque de Scores Cliniques
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Pneumologie, Tuberculose, Embolie, Pneumonies & Sepsis • Service CHREIN Kaolack
              </p>
            </div>
          </div>
        </div>

        {/* Patient Selection Bar */}
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

      {/* Main Grid: Selector Sidebar & Interactive Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Score catalog */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher un score ou pathologie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-600"
              />
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 text-xxs font-bold">
              {[
                { id: 'ALL', label: 'Tous' },
                { id: 'PNEUMONIA', label: 'Pneumonie' },
                { id: 'COPD', label: 'BPCO' },
                { id: 'ASTHMA', label: 'Asthme' },
                { id: 'TUBERCULOSIS', label: 'TB' },
                { id: 'EMBOLISM', label: 'Embolie' },
                { id: 'SEPSIS_NEURO', label: 'Sepsis/Glasgow' }
              ].map(cat => (
                <button
                  key={cat.id}
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

            {/* List of scores */}
            <div className="space-y-2 pt-1 max-h-[520px] overflow-y-auto pr-1">
              {filteredScores.map(score => {
                const isSelected = score.id === selectedScoreId;
                return (
                  <button
                    key={score.id}
                    onClick={() => {
                      setSelectedScoreId(score.id);
                      setFormInputs({});
                    }}
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
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                      )}
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
            {/* Header of selected score */}
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

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer self-start"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réinitialiser</span>
              </button>
            </div>

            {/* Inputs Form */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Paramètres & Variables Cliniques
              </h4>

              <div className="space-y-3.5">
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

            {/* Live Result & Clinical Interpretation Box */}
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

              {/* Reference */}
              <div className="pt-2 border-t border-teal-100 flex items-center gap-1.5 text-xxs text-slate-500 font-mono">
                <BookOpen className="w-3 h-3 text-slate-400" />
                <span>Source de référence : {activeScoreDef.reference}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                {saveSuccessMsg ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1.5 animate-bounce">
                    <CheckCircle2 className="w-4 h-4" /> Score enregistré dans le dossier du patient !
                  </span>
                ) : (
                  <span>Ce calcul sera rattaché au dossier du patient sélectionné.</span>
                )}
              </div>

              <button
                onClick={handleSaveToPatientDossier}
                disabled={calculationResult.value === 'Incomplet'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer dans le dossier</span>
              </button>
            </div>
          </div>

          {/* Historical calculations for current patient */}
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
