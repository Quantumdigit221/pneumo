import React, { useState, useEffect } from 'react';
import { LabAnalysisType, LabAnalysisRow, LabStructuredData } from '../types';
import {
  FlaskConical,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Info,
  Table as TableIcon
} from 'lucide-react';

export const LAB_ANALYSIS_PRESETS: Record<
  LabAnalysisType,
  { label: string; icon: string; rows: Omit<LabAnalysisRow, 'id'>[] }
> = {
  HEMATOLOGY: {
    label: 'Hématologie & NFS (Hémogramme)',
    icon: '🩸',
    rows: [
      { parameter: 'Hémoglobine (Hb)', measuredValue: '', unit: 'g/dL', referenceRange: '12.0 - 16.5', status: 'NORMAL', observation: '' },
      { parameter: 'Hématocrite (Ht)', measuredValue: '', unit: '%', referenceRange: '36.0 - 48.0', status: 'NORMAL', observation: '' },
      { parameter: 'Globules Rouges (Hématies)', measuredValue: '', unit: '10⁶/µL', referenceRange: '4.0 - 5.5', status: 'NORMAL', observation: '' },
      { parameter: 'Globules Blancs (Leucocytes)', measuredValue: '', unit: '/mm³', referenceRange: '4 000 - 10 000', status: 'NORMAL', observation: '' },
      { parameter: 'Plaquettes (PLT)', measuredValue: '', unit: '/mm³', referenceRange: '150 000 - 450 000', status: 'NORMAL', observation: '' },
      { parameter: 'VGM (Volume Globulaire Moyen)', measuredValue: '', unit: 'fl', referenceRange: '80 - 100', status: 'NORMAL', observation: '' },
      { parameter: 'CCMH', measuredValue: '', unit: 'g/dL', referenceRange: '32 - 36', status: 'NORMAL', observation: '' },
      { parameter: 'TCMH', measuredValue: '', unit: 'pg', referenceRange: '27 - 33', status: 'NORMAL', observation: '' },
      { parameter: 'Polynucléaires Neutrophiles', measuredValue: '', unit: '%', referenceRange: '45 - 70', status: 'NORMAL', observation: '' },
      { parameter: 'Lymphocytes', measuredValue: '', unit: '%', referenceRange: '20 - 45', status: 'NORMAL', observation: '' },
      { parameter: 'Monocytes', measuredValue: '', unit: '%', referenceRange: '2 - 10', status: 'NORMAL', observation: '' },
      { parameter: 'Polynucléaires Éosinophiles', measuredValue: '', unit: '%', referenceRange: '1 - 4', status: 'NORMAL', observation: '' },
      { parameter: 'Polynucléaires Basophiles', measuredValue: '', unit: '%', referenceRange: '0 - 1', status: 'NORMAL', observation: '' }
    ]
  },
  BIOCHEMISTRY: {
    label: 'Biochimie Clinique & Bilans Métaboliques',
    icon: '🧪',
    rows: [
      { parameter: 'Glycémie à jeun', measuredValue: '', unit: 'g/L', referenceRange: '0.70 - 1.10', status: 'NORMAL', observation: '' },
      { parameter: 'Urée sanguine', measuredValue: '', unit: 'g/L', referenceRange: '0.15 - 0.45', status: 'NORMAL', observation: '' },
      { parameter: 'Créatinine sérique', measuredValue: '', unit: 'mg/L', referenceRange: '7.0 - 12.0', status: 'NORMAL', observation: '' },
      { parameter: 'Acide urique', measuredValue: '', unit: 'mg/L', referenceRange: '35 - 70', status: 'NORMAL', observation: '' },
      { parameter: 'Transaminases ASAT / TGO', measuredValue: '', unit: 'UI/L', referenceRange: '< 35', status: 'NORMAL', observation: '' },
      { parameter: 'Transaminases ALAT / TGP', measuredValue: '', unit: 'UI/L', referenceRange: '< 45', status: 'NORMAL', observation: '' },
      { parameter: 'Bilirubine Totale', measuredValue: '', unit: 'mg/L', referenceRange: '< 12', status: 'NORMAL', observation: '' },
      { parameter: 'Protéines Totales', measuredValue: '', unit: 'g/L', referenceRange: '65 - 82', status: 'NORMAL', observation: '' },
      { parameter: 'Cholestérol Total', measuredValue: '', unit: 'g/L', referenceRange: '< 2.00', status: 'NORMAL', observation: '' },
      { parameter: 'Triglycérides', measuredValue: '', unit: 'g/L', referenceRange: '0.40 - 1.50', status: 'NORMAL', observation: '' },
      { parameter: 'Sodium (Na⁺)', measuredValue: '', unit: 'mmol/L', referenceRange: '136 - 145', status: 'NORMAL', observation: '' },
      { parameter: 'Potassium (K⁺)', measuredValue: '', unit: 'mmol/L', referenceRange: '3.5 - 5.1', status: 'NORMAL', observation: '' },
      { parameter: 'Calcium (Ca²⁺)', measuredValue: '', unit: 'mg/L', referenceRange: '88 - 104', status: 'NORMAL', observation: '' },
      { parameter: 'CRP (Protéine C-Réactive)', measuredValue: '', unit: 'mg/L', referenceRange: '< 6.0', status: 'NORMAL', observation: '' }
    ]
  },
  PARASITOLOGY: {
    label: 'Parasitologie & Paludisme',
    icon: '🔬',
    rows: [
      { parameter: 'Goutte Épaisse (GE)', measuredValue: '', unit: '', referenceRange: 'Négative', status: 'NEGATIVE', observation: 'Recherche de Plasmodium' },
      { parameter: 'Densité Parasitaire (si positive)', measuredValue: '', unit: 'trophozoïtes/µL', referenceRange: '0', status: 'NORMAL', observation: 'Seuil pathologique' },
      { parameter: 'Test Diagnostic Rapide (TDR Palu)', measuredValue: '', unit: '', referenceRange: 'Négatif', status: 'NEGATIVE', observation: 'Antigène Pf / Pan' },
      { parameter: 'EPS : Aspect macroscopique selles', measuredValue: '', unit: '', referenceRange: 'Normal / Moulé', status: 'NORMAL', observation: 'Couleur et consistance' },
      { parameter: 'EPS : Kystes / Amibes', measuredValue: '', unit: '', referenceRange: 'Absence', status: 'NEGATIVE', observation: 'Absence de kystes pathogènes' },
      { parameter: 'EPS : Helminthes & Oeufs', measuredValue: '', unit: '', referenceRange: 'Absence', status: 'NEGATIVE', observation: 'Absence d’œufs' },
      { parameter: 'EPS : Hématies & Leucocytes', measuredValue: '', unit: '', referenceRange: 'Absence', status: 'NEGATIVE', observation: 'Absence d’éléments cellulaires' }
    ]
  },
  SEROLOGY: {
    label: 'Sérologie & Immunologie & Dépistage',
    icon: '🛡️',
    rows: [
      { parameter: 'Sérologie VIH 1 & 2', measuredValue: '', unit: '', referenceRange: 'Négatif (Non Réactif)', status: 'NEGATIVE', observation: 'Test Rapide conventionné' },
      { parameter: 'Antigène HBs (Hépatite B)', measuredValue: '', unit: '', referenceRange: 'Négatif', status: 'NEGATIVE', observation: 'Dépistage Ag HBs' },
      { parameter: 'Anticorps Anti-HCV (Hépatite C)', measuredValue: '', unit: '', referenceRange: 'Négatif', status: 'NEGATIVE', observation: 'Dépistage Ac Anti-HCV' },
      { parameter: 'Syphilis (RPR / VDRL / TPHA)', measuredValue: '', unit: '', referenceRange: 'Négatif / Non Réactif', status: 'NEGATIVE', observation: 'Dépistage tréponémique' },
      { parameter: 'Test de Grossesse (Beta-HCG)', measuredValue: '', unit: '', referenceRange: 'Négatif', status: 'NEGATIVE', observation: 'Urines du matin ou sérum' },
      { parameter: 'Sérodiagnostic Widal & Félix - TO', measuredValue: '', unit: 'Titre', referenceRange: '< 1/80 (Négatif)', status: 'NEGATIVE', observation: 'Agglutinines typhiques' },
      { parameter: 'Sérodiagnostic Widal & Félix - TH', measuredValue: '', unit: 'Titre', referenceRange: '< 1/80 (Négatif)', status: 'NEGATIVE', observation: 'Agglutinines typhiques' },
      { parameter: 'Vitesse de Sédimentation (VS 1ère heure)', measuredValue: '', unit: 'mm', referenceRange: '< 15', status: 'NORMAL', observation: '' },
      { parameter: 'Vitesse de Sédimentation (VS 2ème heure)', measuredValue: '', unit: 'mm', referenceRange: '< 30', status: 'NORMAL', observation: '' }
    ]
  },
  URINE: {
    label: 'Urologie & ECBU & Bandelette Urinaire',
    icon: '🚽',
    rows: [
      { parameter: 'Aspect & Limpidité', measuredValue: '', unit: '', referenceRange: 'Jaune clair / Limpide', status: 'NORMAL', observation: 'Examen macroscopique' },
      { parameter: 'Bandelette : Protéinurie', measuredValue: '', unit: '', referenceRange: 'Négative', status: 'NEGATIVE', observation: 'Absence d’albumine' },
      { parameter: 'Bandelette : Glycosurie', measuredValue: '', unit: '', referenceRange: 'Négative', status: 'NEGATIVE', observation: 'Absence de glucose' },
      { parameter: 'Bandelette : Nitrites', measuredValue: '', unit: '', referenceRange: 'Négatifs', status: 'NEGATIVE', observation: 'Absence d’infection entérique' },
      { parameter: 'Bandelette : Leucocytes', measuredValue: '', unit: '', referenceRange: 'Négatifs', status: 'NEGATIVE', observation: 'Absence de réaction leucocytaire' },
      { parameter: 'Bandelette : Sang / Hémoglobine', measuredValue: '', unit: '', referenceRange: 'Négatif', status: 'NEGATIVE', observation: 'Absence d’hématurie' },
      { parameter: 'Cytologie : Leucocytes', measuredValue: '', unit: '/mm³ ou /mL', referenceRange: '< 10 000 /mL', status: 'NORMAL', observation: 'Absence de pyurie' },
      { parameter: 'Cytologie : Hématies', measuredValue: '', unit: '/mm³ ou /mL', referenceRange: '< 10 000 /mL', status: 'NORMAL', observation: 'Absence d’hématurie microscopique' },
      { parameter: 'Examen Direct (Coloration Gram)', measuredValue: '', unit: '', referenceRange: 'Absence de germes', status: 'NEGATIVE', observation: 'Flore stérile' },
      { parameter: 'Culture bactériologique (UFC/mL)', measuredValue: '', unit: 'UFC/mL', referenceRange: '< 1 000 UFC/mL (Stérile)', status: 'NORMAL', observation: 'Pas de colonisation' }
    ]
  },
  HEMOSTASIS: {
    label: 'Hémostase & Coagulation',
    icon: '⏱️',
    rows: [
      { parameter: 'Taux de Prothrombine (TP)', measuredValue: '', unit: '%', referenceRange: '70 - 100', status: 'NORMAL', observation: '' },
      { parameter: 'INR', measuredValue: '', unit: '', referenceRange: '0.8 - 1.2', status: 'NORMAL', observation: 'Cible sous AVK : 2.0 - 3.0' },
      { parameter: 'Temps de Céphaline Activée (TCA / TCK)', measuredValue: '', unit: 'secondes', referenceRange: '28 - 38', status: 'NORMAL', observation: 'Ratio malade/témoin < 1.20' },
      { parameter: 'Fibrinogène', measuredValue: '', unit: 'g/L', referenceRange: '2.0 - 4.0', status: 'NORMAL', observation: '' }
    ]
  },
  CUSTOM: {
    label: 'Tableau Personnalisé / Analyse Libre',
    icon: '📋',
    rows: [
      { parameter: 'Paramètre 1', measuredValue: '', unit: '', referenceRange: '', status: 'NORMAL', observation: '' }
    ]
  }
};

export function detectLabAnalysisType(testName: string, category?: string): LabAnalysisType {
  const t = (testName || '').toLowerCase().trim();
  const c = (category || '').toLowerCase().trim();

  if (
    t.includes('nfs') ||
    t.includes('hémogramme') ||
    t.includes('hémoglobine') ||
    t.includes('plaquettes') ||
    t.includes('leucocyte') ||
    c.includes('hématol')
  ) {
    return 'HEMATOLOGY';
  }

  if (
    t.includes('glycém') ||
    t.includes('urée') ||
    t.includes('créat') ||
    t.includes('acide urique') ||
    t.includes('asat') ||
    t.includes('alat') ||
    t.includes('transaminase') ||
    t.includes('cholest') ||
    t.includes('trigly') ||
    t.includes('iono') ||
    t.includes('calcium') ||
    t.includes('sodium') ||
    t.includes('potassium') ||
    t.includes('crp') ||
    t.includes('bilan') ||
    c.includes('biochim')
  ) {
    return 'BIOCHEMISTRY';
  }

  if (
    t.includes('palu') ||
    t.includes('goutte') ||
    t.includes('tdr') ||
    t.includes('parasit') ||
    t.includes('selle') ||
    t.includes('eps') ||
    t.includes('amibe') ||
    c.includes('parasit')
  ) {
    return 'PARASITOLOGY';
  }

  if (
    t.includes('vih') ||
    t.includes('hiv') ||
    t.includes('hbs') ||
    t.includes('hcv') ||
    t.includes('hépatite') ||
    t.includes('syphilis') ||
    t.includes('vdrl') ||
    t.includes('tpha') ||
    t.includes('grossesse') ||
    t.includes('hcg') ||
    t.includes('widal') ||
    t.includes('sérol') ||
    c.includes('sérol') ||
    c.includes('immunol')
  ) {
    return 'SEROLOGY';
  }

  if (
    t.includes('ecbu') ||
    t.includes('urine') ||
    t.includes('urinaire') ||
    t.includes('bandelette') ||
    t.includes('culot') ||
    c.includes('bactério')
  ) {
    return 'URINE';
  }

  if (
    t.includes('tp') ||
    t.includes('inr') ||
    t.includes('tck') ||
    t.includes('tca') ||
    t.includes('coag') ||
    t.includes('hémostase') ||
    t.includes('fibrinogène')
  ) {
    return 'HEMOSTASIS';
  }

  return 'CUSTOM';
}

export function parseStoredLabResults(raw: any): {
  structured?: LabStructuredData;
  rawText: string;
  conclusion: 'NORMAL' | 'ANORMAL' | 'A_SURVEILLER';
} {
  if (!raw) {
    return { rawText: '', conclusion: 'NORMAL' };
  }

  if (typeof raw === 'object' && raw.rows && Array.isArray(raw.rows)) {
    return {
      structured: raw as LabStructuredData,
      rawText: raw.generalObservations || '',
      conclusion: raw.conclusion || 'NORMAL'
    };
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.rows && Array.isArray(parsed.rows)) {
          return {
            structured: parsed as LabStructuredData,
            rawText: parsed.generalObservations || '',
            conclusion: parsed.conclusion || 'NORMAL'
          };
        }
      } catch (e) {
        // Fall back to text parsing
      }
    }

    let conclusion: 'NORMAL' | 'ANORMAL' | 'A_SURVEILLER' = 'NORMAL';
    if (trimmed.includes('[Conclusion: ANORMAL]') || trimmed.toLowerCase().includes('anormal')) {
      conclusion = 'ANORMAL';
    } else if (trimmed.includes('[Conclusion: A_SURVEILLER]') || trimmed.toLowerCase().includes('surveill')) {
      conclusion = 'A_SURVEILLER';
    }

    return {
      rawText: trimmed.replace(/\[Conclusion:\s*[A-Z_]+\]\s*/i, ''),
      conclusion
    };
  }

  return { rawText: String(raw), conclusion: 'NORMAL' };
}

interface LabAnalysisTableEditorProps {
  testName: string;
  category?: string;
  initialData?: LabStructuredData;
  initialTextNotes?: string;
  onSave: (data: LabStructuredData, formattedSummary: string) => void;
  onCancel: () => void;
}

export const LabAnalysisTableEditor: React.FC<LabAnalysisTableEditorProps> = ({
  testName,
  category,
  initialData,
  initialTextNotes,
  onSave,
  onCancel
}) => {
  const detectedType = initialData?.analysisType || detectLabAnalysisType(testName, category);
  const [selectedType, setSelectedType] = useState<LabAnalysisType>(detectedType);
  const [conclusion, setConclusion] = useState<'NORMAL' | 'ANORMAL' | 'A_SURVEILLER'>(
    initialData?.conclusion || 'NORMAL'
  );
  const [rows, setRows] = useState<LabAnalysisRow[]>(() => {
    if (initialData?.rows && initialData.rows.length > 0) {
      return initialData.rows;
    }
    const preset = LAB_ANALYSIS_PRESETS[detectedType] || LAB_ANALYSIS_PRESETS.CUSTOM;
    return preset.rows.map((r, i) => ({
      ...r,
      id: `row-${Date.now()}-${i}`
    }));
  });
  const [generalObservations, setGeneralObservations] = useState(
    initialData?.generalObservations || initialTextNotes || ''
  );

  const handleSwitchType = (newType: LabAnalysisType) => {
    setSelectedType(newType);
    const preset = LAB_ANALYSIS_PRESETS[newType];
    setRows(
      preset.rows.map((r, i) => ({
        ...r,
        id: `row-${Date.now()}-${i}`
      }))
    );
  };

  const handleUpdateRow = (id: string, field: keyof LabAnalysisRow, value: any) => {
    setRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };

        // Auto evaluate normal/high/low for numeric values if numeric range exists
        if (field === 'measuredValue' && updated.referenceRange && typeof value === 'string') {
          const valNum = parseFloat(value.replace(',', '.').trim());
          if (!isNaN(valNum)) {
            const rangeMatch = updated.referenceRange.match(/([0-9.,]+)\s*-\s*([0-9.,]+)/);
            if (rangeMatch) {
              const min = parseFloat(rangeMatch[1].replace(',', '.'));
              const max = parseFloat(rangeMatch[2].replace(',', '.'));
              if (!isNaN(min) && !isNaN(max)) {
                if (valNum < min) updated.status = 'LOW';
                else if (valNum > max) updated.status = 'HIGH';
                else updated.status = 'NORMAL';
              }
            } else if (updated.referenceRange.startsWith('<')) {
              const max = parseFloat(updated.referenceRange.replace('<', '').trim());
              if (!isNaN(max)) {
                updated.status = valNum > max ? 'HIGH' : 'NORMAL';
              }
            } else if (updated.referenceRange.startsWith('>')) {
              const min = parseFloat(updated.referenceRange.replace('>', '').trim());
              if (!isNaN(min)) {
                updated.status = valNum < min ? 'LOW' : 'NORMAL';
              }
            }
          } else {
            const lower = value.toLowerCase().trim();
            if (lower === 'positif' || lower === 'positive' || lower === 'présence' || lower === 'reactive' || lower === 'réactif') {
              updated.status = 'POSITIVE';
            } else if (lower === 'négatif' || lower === 'négative' || lower === 'absence' || lower === 'non réactif') {
              updated.status = 'NEGATIVE';
            }
          }
        }

        return updated;
      })
    );
  };

  const handleAddRow = () => {
    const newRow: LabAnalysisRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      parameter: 'Nouveau paramètre',
      measuredValue: '',
      unit: '',
      referenceRange: '',
      status: 'NORMAL',
      observation: ''
    };
    setRows(prev => [...prev, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  // Pre-fill sample normal values helper
  const handleFillSampleValues = () => {
    if (selectedType === 'HEMATOLOGY') {
      setRows(prev =>
        prev.map(r => {
          if (r.parameter.includes('Hémoglobine')) return { ...r, measuredValue: '13.8', status: 'NORMAL', observation: 'Normochrome' };
          if (r.parameter.includes('Hématocrite')) return { ...r, measuredValue: '41.5', status: 'NORMAL' };
          if (r.parameter.includes('Globules Rouges')) return { ...r, measuredValue: '4.75', status: 'NORMAL' };
          if (r.parameter.includes('Globules Blancs')) return { ...r, measuredValue: '6 800', status: 'NORMAL' };
          if (r.parameter.includes('Plaquettes')) return { ...r, measuredValue: '285 000', status: 'NORMAL' };
          if (r.parameter.includes('VGM')) return { ...r, measuredValue: '88.5', status: 'NORMAL', observation: 'Normocytaire' };
          if (r.parameter.includes('CCMH')) return { ...r, measuredValue: '33.2', status: 'NORMAL' };
          if (r.parameter.includes('TCMH')) return { ...r, measuredValue: '29.1', status: 'NORMAL' };
          if (r.parameter.includes('Neutrophiles')) return { ...r, measuredValue: '58', status: 'NORMAL' };
          if (r.parameter.includes('Lymphocytes')) return { ...r, measuredValue: '32', status: 'NORMAL' };
          if (r.parameter.includes('Monocytes')) return { ...r, measuredValue: '6', status: 'NORMAL' };
          if (r.parameter.includes('Éosinophiles')) return { ...r, measuredValue: '3', status: 'NORMAL' };
          if (r.parameter.includes('Basophiles')) return { ...r, measuredValue: '1', status: 'NORMAL' };
          return r;
        })
      );
      setConclusion('NORMAL');
      setGeneralObservations('Formule sanguine normale, absence d’anomalie morphologique érythrocytaire ou leucocytaire.');
    } else if (selectedType === 'BIOCHEMISTRY') {
      setRows(prev =>
        prev.map(r => {
          if (r.parameter.includes('Glycémie')) return { ...r, measuredValue: '0.92', status: 'NORMAL' };
          if (r.parameter.includes('Urée')) return { ...r, measuredValue: '0.28', status: 'NORMAL' };
          if (r.parameter.includes('Créatinine')) return { ...r, measuredValue: '9.4', status: 'NORMAL' };
          if (r.parameter.includes('Acide urique')) return { ...r, measuredValue: '48', status: 'NORMAL' };
          if (r.parameter.includes('ASAT')) return { ...r, measuredValue: '22', status: 'NORMAL' };
          if (r.parameter.includes('ALAT')) return { ...r, measuredValue: '26', status: 'NORMAL' };
          if (r.parameter.includes('Bilirubine')) return { ...r, measuredValue: '6.2', status: 'NORMAL' };
          if (r.parameter.includes('Protéines')) return { ...r, measuredValue: '72', status: 'NORMAL' };
          if (r.parameter.includes('Cholestérol')) return { ...r, measuredValue: '1.75', status: 'NORMAL' };
          if (r.parameter.includes('Triglycérides')) return { ...r, measuredValue: '0.95', status: 'NORMAL' };
          if (r.parameter.includes('Sodium')) return { ...r, measuredValue: '141', status: 'NORMAL' };
          if (r.parameter.includes('Potassium')) return { ...r, measuredValue: '4.2', status: 'NORMAL' };
          if (r.parameter.includes('Calcium')) return { ...r, measuredValue: '94', status: 'NORMAL' };
          if (r.parameter.includes('CRP')) return { ...r, measuredValue: '2.1', status: 'NORMAL', observation: 'Absence de syndrome inflammatoire' };
          return r;
        })
      );
      setConclusion('NORMAL');
      setGeneralObservations('Bilan métabolique, rénal et hépatique dans les limites de la normale.');
    } else if (selectedType === 'PARASITOLOGY') {
      setRows(prev =>
        prev.map(r => {
          if (r.parameter.includes('Goutte Épaisse')) return { ...r, measuredValue: 'Négative', status: 'NEGATIVE', observation: 'Absence d’hématozoaires de paludisme' };
          if (r.parameter.includes('Densité')) return { ...r, measuredValue: '0', status: 'NORMAL' };
          if (r.parameter.includes('TDR')) return { ...r, measuredValue: 'Négatif', status: 'NEGATIVE' };
          if (r.parameter.includes('Aspect')) return { ...r, measuredValue: 'Moulé, coloration normale', status: 'NORMAL' };
          if (r.parameter.includes('Kystes')) return { ...r, measuredValue: 'Absence', status: 'NEGATIVE' };
          if (r.parameter.includes('Helminthes')) return { ...r, measuredValue: 'Absence', status: 'NEGATIVE' };
          if (r.parameter.includes('Hématies')) return { ...r, measuredValue: 'Absence', status: 'NEGATIVE' };
          return r;
        })
      );
      setConclusion('NORMAL');
      setGeneralObservations('Examen parasitologique négatif. Pas de paludisme ni de parasitose digestive détectée.');
    } else if (selectedType === 'SEROLOGY') {
      setRows(prev =>
        prev.map(r => {
          if (r.parameter.includes('VIH')) return { ...r, measuredValue: 'Négatif', status: 'NEGATIVE', observation: 'Non réactif' };
          if (r.parameter.includes('HBs')) return { ...r, measuredValue: 'Négatif', status: 'NEGATIVE', observation: 'Non réactif' };
          if (r.parameter.includes('HCV')) return { ...r, measuredValue: 'Négatif', status: 'NEGATIVE', observation: 'Non réactif' };
          if (r.parameter.includes('Syphilis')) return { ...r, measuredValue: 'Négatif', status: 'NEGATIVE', observation: 'Non réactif' };
          if (r.parameter.includes('Grossesse')) return { ...r, measuredValue: 'Négatif', status: 'NEGATIVE' };
          if (r.parameter.includes('Widal')) return { ...r, measuredValue: '< 1/40', status: 'NEGATIVE' };
          if (r.parameter.includes('VS 1ère')) return { ...r, measuredValue: '8', status: 'NORMAL' };
          if (r.parameter.includes('VS 2ème')) return { ...r, measuredValue: '18', status: 'NORMAL' };
          return r;
        })
      );
      setConclusion('NORMAL');
      setGeneralObservations('Sérologies de dépistage non réactives.');
    } else if (selectedType === 'URINE') {
      setRows(prev =>
        prev.map(r => {
          if (r.parameter.includes('Aspect')) return { ...r, measuredValue: 'Jaune paille, limpide', status: 'NORMAL' };
          if (r.parameter.includes('Bandelette : Protéinurie')) return { ...r, measuredValue: 'Négative', status: 'NEGATIVE' };
          if (r.parameter.includes('Bandelette : Glycosurie')) return { ...r, measuredValue: 'Négative', status: 'NEGATIVE' };
          if (r.parameter.includes('Bandelette : Nitrites')) return { ...r, measuredValue: 'Négatifs', status: 'NEGATIVE' };
          if (r.parameter.includes('Bandelette : Leucocytes')) return { ...r, measuredValue: 'Négatifs', status: 'NEGATIVE' };
          if (r.parameter.includes('Bandelette : Sang')) return { ...r, measuredValue: 'Négatif', status: 'NEGATIVE' };
          if (r.parameter.includes('Cytologie : Leucocytes')) return { ...r, measuredValue: '3 000 /mL', status: 'NORMAL' };
          if (r.parameter.includes('Cytologie : Hématies')) return { ...r, measuredValue: '1 000 /mL', status: 'NORMAL' };
          if (r.parameter.includes('Gram')) return { ...r, measuredValue: 'Absence de bactéries', status: 'NEGATIVE' };
          if (r.parameter.includes('Culture')) return { ...r, measuredValue: '< 1 000 UFC/mL (Stérile)', status: 'NORMAL', observation: 'Absence de bactériurie significative' };
          return r;
        })
      );
      setConclusion('NORMAL');
      setGeneralObservations('Examen cyto-bactériologique des urines stérile.');
    } else if (selectedType === 'HEMOSTASIS') {
      setRows(prev =>
        prev.map(r => {
          if (r.parameter.includes('TP')) return { ...r, measuredValue: '88', status: 'NORMAL' };
          if (r.parameter.includes('INR')) return { ...r, measuredValue: '1.05', status: 'NORMAL' };
          if (r.parameter.includes('TCA')) return { ...r, measuredValue: '31.0', status: 'NORMAL', observation: 'Témoin: 30.5s (Ratio 1.01)' };
          if (r.parameter.includes('Fibrinogène')) return { ...r, measuredValue: '2.85', status: 'NORMAL' };
          return r;
        })
      );
      setConclusion('NORMAL');
      setGeneralObservations('Bilan d’hémostase dans les normes physiologiques.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if any abnormal status exists to suggest conclusion if normal
    const hasAbnormal = rows.some(r => r.status === 'HIGH' || r.status === 'LOW' || r.status === 'POSITIVE' || r.status === 'ATTENTION');
    const finalConclusion = conclusion;

    const structured: LabStructuredData = {
      analysisType: selectedType,
      typeLabel: LAB_ANALYSIS_PRESETS[selectedType]?.label || 'Analyse Biologique',
      conclusion: finalConclusion,
      rows: rows.filter(r => r.parameter.trim() !== ''),
      generalObservations: generalObservations.trim(),
      validationDate: new Date().toISOString()
    };

    // Build human-readable formatted summary string
    const summaryLines = [
      `[Type: ${LAB_ANALYSIS_PRESETS[selectedType]?.label || selectedType}]`,
      `[Conclusion: ${finalConclusion}]`
    ];

    const filledRows = rows.filter(r => r.measuredValue.trim() !== '');
    if (filledRows.length > 0) {
      const rowSummaries = filledRows.map(
        r => `${r.parameter}: ${r.measuredValue}${r.unit ? ' ' + r.unit : ''} (${r.status})${r.observation ? ' - ' + r.observation : ''}`
      );
      summaryLines.push(rowSummaries.join(' | '));
    }

    if (generalObservations.trim()) {
      summaryLines.push(`Obs: ${generalObservations.trim()}`);
    }

    const formattedSummary = summaryLines.join(' • ');

    onSave(structured, formattedSummary);
  };

  const getStatusBadge = (status: LabAnalysisRow['status']) => {
    switch (status) {
      case 'NORMAL':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">✓ Normal</span>;
      case 'HIGH':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">⬆ Élevé</span>;
      case 'LOW':
        return <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-1.5 py-0.5 rounded">⬇ Bas</span>;
      case 'POSITIVE':
        return <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded">⚠️ Positif</span>;
      case 'NEGATIVE':
        return <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-1.5 py-0.5 rounded">✓ Négatif</span>;
      case 'ATTENTION':
        return <span className="bg-orange-100 text-orange-900 text-[10px] font-bold px-1.5 py-0.5 rounded">🔍 À surveiller</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">Normal</span>;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Analysis Type Switcher Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <TableIcon className="w-4 h-4 text-teal-600" />
            <span>Type d'analyse & Modèle de tableau :</span>
          </label>
          <button
            type="button"
            onClick={handleFillSampleValues}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors cursor-pointer"
            title="Pré-remplir avec des valeurs témoins standard pour test rapide"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Exemple Valeurs Normales</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {(Object.keys(LAB_ANALYSIS_PRESETS) as LabAnalysisType[]).map(typeKey => {
            const isSelected = selectedType === typeKey;
            const preset = LAB_ANALYSIS_PRESETS[typeKey];
            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => handleSwitchType(typeKey)}
                className={`flex flex-col items-center justify-center py-2 px-1 text-center rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-teal-900 shadow-xs font-bold border border-teal-300 ring-1 ring-teal-200'
                    : 'text-slate-600 hover:bg-white/60 text-xs font-medium'
                }`}
              >
                <span className="text-base mb-0.5">{preset.icon}</span>
                <span className="text-[10px] leading-tight line-clamp-1">{preset.label.split('&')[0].trim()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table for Measured Values & Biological Observations */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <div className="bg-gradient-to-r from-slate-50 to-teal-50/50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{LAB_ANALYSIS_PRESETS[selectedType]?.icon}</span>
            <span className="text-xs font-bold text-slate-800">
              Tableau des constantes & valeurs mesurées : {LAB_ANALYSIS_PRESETS[selectedType]?.label}
            </span>
            <span className="text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
              {rows.length} paramètres
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-teal-700 bg-white hover:bg-teal-50 border border-teal-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter une ligne</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-[380px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 sticky top-0 z-10 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-2 px-3 w-[28%]">Paramètre Biologique</th>
                <th className="py-2 px-3 w-[22%]">Valeur Mesurée *</th>
                <th className="py-2 px-2 w-[10%]">Unité</th>
                <th className="py-2 px-3 w-[15%]">Valeurs Réf. (Normes)</th>
                <th className="py-2 px-2 w-[13%]">Statut</th>
                <th className="py-2 px-2 w-[17%]">Observation</th>
                <th className="py-2 px-2 w-[5%] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Parameter Name */}
                  <td className="py-1.5 px-3">
                    <input
                      type="text"
                      value={row.parameter}
                      onChange={e => handleUpdateRow(row.id, 'parameter', e.target.value)}
                      placeholder="Nom du paramètre..."
                      className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-teal-500 font-bold text-slate-800 text-xs py-0.5 px-1 outline-none transition-colors"
                      required
                    />
                  </td>

                  {/* Measured Value */}
                  <td className="py-1.5 px-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={row.measuredValue}
                        onChange={e => handleUpdateRow(row.id, 'measuredValue', e.target.value)}
                        placeholder="Ex: 12.5, Négatif..."
                        className={`w-full text-xs font-semibold py-1 px-2.5 rounded-lg border outline-none transition-all ${
                          row.status === 'HIGH' || row.status === 'POSITIVE'
                            ? 'border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-200'
                            : row.status === 'LOW'
                            ? 'border-sky-300 bg-sky-50/40 text-sky-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-200'
                            : row.status === 'ATTENTION'
                            ? 'border-amber-300 bg-amber-50/40 text-amber-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-200'
                            : 'border-slate-200 bg-white text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-200'
                        }`}
                      />
                    </div>
                  </td>

                  {/* Unit */}
                  <td className="py-1.5 px-2">
                    <input
                      type="text"
                      value={row.unit}
                      onChange={e => handleUpdateRow(row.id, 'unit', e.target.value)}
                      placeholder="-"
                      className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-teal-500 text-slate-500 text-xs py-0.5 px-1 outline-none text-center"
                    />
                  </td>

                  {/* Reference Range */}
                  <td className="py-1.5 px-3">
                    <input
                      type="text"
                      value={row.referenceRange}
                      onChange={e => handleUpdateRow(row.id, 'referenceRange', e.target.value)}
                      placeholder="ex: 12.0 - 16.0"
                      className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-teal-500 text-slate-500 font-mono text-[11px] py-0.5 px-1 outline-none"
                    />
                  </td>

                  {/* Status evaluation */}
                  <td className="py-1.5 px-2">
                    <select
                      value={row.status}
                      onChange={e => handleUpdateRow(row.id, 'status', e.target.value as any)}
                      className={`w-full text-[11px] font-bold py-1 px-1.5 rounded-lg border outline-none cursor-pointer ${
                        row.status === 'NORMAL'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : row.status === 'HIGH'
                          ? 'border-rose-300 bg-rose-50 text-rose-800'
                          : row.status === 'LOW'
                          ? 'border-sky-300 bg-sky-50 text-sky-800'
                          : row.status === 'POSITIVE'
                          ? 'border-amber-300 bg-amber-50 text-amber-900'
                          : row.status === 'NEGATIVE'
                          ? 'border-teal-200 bg-teal-50 text-teal-800'
                          : 'border-orange-200 bg-orange-50 text-orange-800'
                      }`}
                    >
                      <option value="NORMAL">✓ Normal</option>
                      <option value="HIGH">⬆ Élevé</option>
                      <option value="LOW">⬇ Bas</option>
                      <option value="POSITIVE">⚠️ Positif</option>
                      <option value="NEGATIVE">✓ Négatif</option>
                      <option value="ATTENTION">🔍 Surveiller</option>
                    </select>
                  </td>

                  {/* Biological observation */}
                  <td className="py-1.5 px-2">
                    <input
                      type="text"
                      value={row.observation || ''}
                      onChange={e => handleUpdateRow(row.id, 'observation', e.target.value)}
                      placeholder="Obs..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-teal-400 focus:bg-white text-slate-700 text-xs py-1 px-2 rounded-lg outline-none"
                    />
                  </td>

                  {/* Action delete */}
                  <td className="py-1.5 px-2 text-center">
                    <button
                      type="button"
                      disabled={rows.length <= 1}
                      onClick={() => handleDeleteRow(row.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded hover:bg-rose-50 transition-colors disabled:opacity-20 cursor-pointer"
                      title="Supprimer cette ligne"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clinical Conclusion & General Observations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">Conclusion clinique globale *</label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setConclusion('NORMAL')}
              className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all text-center ${
                conclusion === 'NORMAL'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              ✓ Normal
            </button>
            <button
              type="button"
              onClick={() => setConclusion('ANORMAL')}
              className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all text-center ${
                conclusion === 'ANORMAL'
                  ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              ⚠️ Anormal
            </button>
            <button
              type="button"
              onClick={() => setConclusion('A_SURVEILLER')}
              className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all text-center ${
                conclusion === 'A_SURVEILLER'
                  ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              🔍 À surveiller
            </button>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">
            Observations biologiques générales & recommandations du biologiste
          </label>
          <input
            type="text"
            value={generalObservations}
            onChange={e => setGeneralObservations(e.target.value)}
            placeholder="Ex: Échantillon conforme non hémolysé. Résultats concordants avec le tableau clinique."
            className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs outline-none focus:border-teal-500 font-medium text-slate-700"
          />
        </div>
      </div>

      {/* Modal Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Valider & Enregistrer le tableau d'analyse</span>
        </button>
      </div>
    </form>
  );
};

interface LabAnalysisTableViewProps {
  data: LabStructuredData;
  compact?: boolean;
}

export const LabAnalysisTableView: React.FC<LabAnalysisTableViewProps> = ({ data, compact = false }) => {
  if (!data || !data.rows || data.rows.length === 0) {
    return <span className="text-xs text-slate-400 italic">Aucune donnée structurée</span>;
  }

  const getStatusBadge = (status: LabAnalysisRow['status']) => {
    switch (status) {
      case 'NORMAL':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded">Normal</span>;
      case 'HIGH':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-1.5 py-0.5 rounded">⬆ Élevé</span>;
      case 'LOW':
        return <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold px-1.5 py-0.5 rounded">⬇ Bas</span>;
      case 'POSITIVE':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded">⚠️ Positif</span>;
      case 'NEGATIVE':
        return <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold px-1.5 py-0.5 rounded">Négatif</span>;
      case 'ATTENTION':
        return <span className="bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-bold px-1.5 py-0.5 rounded">À surveiller</span>;
      default:
        return <span className="bg-slate-50 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">Normal</span>;
    }
  };

  const filledRows = data.rows.filter(r => r.measuredValue && r.measuredValue.trim() !== '');
  const displayRows = filledRows.length > 0 ? filledRows : data.rows;

  return (
    <div className="space-y-2">
      {data.typeLabel && !compact && (
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>{LAB_ANALYSIS_PRESETS[data.analysisType]?.icon || '🔬'}</span>
            <span>{data.typeLabel}</span>
          </div>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
            data.conclusion === 'NORMAL'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : data.conclusion === 'ANORMAL'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            Conclusion : {data.conclusion === 'NORMAL' ? 'Normal' : data.conclusion === 'ANORMAL' ? 'Anormal' : 'À surveiller'}
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-1.5 px-2.5">Paramètre</th>
              <th className="py-1.5 px-2.5">Valeur Mesurée</th>
              <th className="py-1.5 px-2">Unité</th>
              <th className="py-1.5 px-2.5">Normes (Réf)</th>
              <th className="py-1.5 px-2">Statut</th>
              {!compact && <th className="py-1.5 px-2.5">Observation</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {displayRows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/60">
                <td className="py-1.5 px-2.5 font-bold text-slate-800">{r.parameter}</td>
                <td className="py-1.5 px-2.5 font-extrabold text-slate-900 font-mono">
                  {r.measuredValue || '-'}
                </td>
                <td className="py-1.5 px-2 text-slate-500 font-medium">{r.unit || '-'}</td>
                <td className="py-1.5 px-2.5 text-slate-500 font-mono text-[11px]">{r.referenceRange || '-'}</td>
                <td className="py-1.5 px-2">{getStatusBadge(r.status)}</td>
                {!compact && (
                  <td className="py-1.5 px-2.5 text-slate-600 italic text-[11px]">
                    {r.observation || '-'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.generalObservations && (
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-600">
          <span className="font-bold text-slate-700">Observation générale : </span>
          <span>{data.generalObservations}</span>
        </div>
      )}
    </div>
  );
};
