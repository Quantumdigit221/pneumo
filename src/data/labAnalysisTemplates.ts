export interface LabParameterDefinition {
  parameter: string;
  unit: string;
  referenceRange: string;
  defaultValue?: string;
  minNum?: number;
  maxNum?: number;
  isQualitative?: boolean;
}

export interface LabAnalysisTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  parameters: LabParameterDefinition[];
  defaultObservations?: string;
}

export interface LabTableRow {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'NORMAL' | 'HIGH' | 'LOW' | 'POSITIVE' | 'NEGATIVE' | 'ABNORMAL';
}

export interface StructuredLabData {
  isStructured: true;
  version: 2;
  templateId: string;
  templateName: string;
  conclusion: 'NORMAL' | 'ANORMAL' | 'A_SURVEILLER';
  rows: LabTableRow[];
  observations?: string;
  technicianName?: string;
  validatedAt?: string;
}

export const LAB_ANALYSIS_TEMPLATES: LabAnalysisTemplate[] = [
  {
    id: 'nfs',
    name: 'Hémogramme / NFS (Numération Formule Sanguine)',
    category: 'Hématologie',
    description: 'Bilan hématologique complet : lignée rouge, leucocytaire et plaquettaire.',
    defaultObservations: 'Morphologie des hématies normale. Absence de cellules immatures.',
    parameters: [
      { parameter: 'Hémoglobine (Hb)', unit: 'g/dL', referenceRange: '12.0 - 16.0', minNum: 12.0, maxNum: 16.0 },
      { parameter: 'Hématocrite (Ht)', unit: '%', referenceRange: '36.0 - 48.0', minNum: 36.0, maxNum: 48.0 },
      { parameter: 'Hématies (Globules Rouges)', unit: 'M/µL', referenceRange: '4.00 - 5.50', minNum: 4.0, maxNum: 5.5 },
      { parameter: 'VGM (Volume Globulaire Moyen)', unit: 'fL', referenceRange: '80.0 - 100.0', minNum: 80.0, maxNum: 100.0 },
      { parameter: 'TCMH', unit: 'pg', referenceRange: '27.0 - 32.0', minNum: 27.0, maxNum: 32.0 },
      { parameter: 'CCMH', unit: 'g/dL', referenceRange: '32.0 - 36.0', minNum: 32.0, maxNum: 36.0 },
      { parameter: 'Leucocytes (Globules Blancs)', unit: '/mm³', referenceRange: '4 000 - 10 000', minNum: 4000, maxNum: 10000 },
      { parameter: 'Polynucléaires Neutrophiles', unit: '%', referenceRange: '40.0 - 70.0', minNum: 40.0, maxNum: 70.0 },
      { parameter: 'Polynucléaires Éosinophiles', unit: '%', referenceRange: '1.0 - 4.0', minNum: 1.0, maxNum: 4.0 },
      { parameter: 'Polynucléaires Basophiles', unit: '%', referenceRange: '0.0 - 1.0', minNum: 0.0, maxNum: 1.0 },
      { parameter: 'Lymphocytes', unit: '%', referenceRange: '20.0 - 45.0', minNum: 20.0, maxNum: 45.0 },
      { parameter: 'Monocytes', unit: '%', referenceRange: '2.0 - 10.0', minNum: 2.0, maxNum: 10.0 },
      { parameter: 'Plaquettes sanguines', unit: '/mm³', referenceRange: '150 000 - 450 000', minNum: 150000, maxNum: 450000 }
    ]
  },
  {
    id: 'biochimie_renale',
    name: 'Biochimie Sanguine Rénale & Métabolique',
    category: 'Biochimie',
    description: 'Glycémie, Urée, Créatinine, Acide urique, Clairance.',
    defaultObservations: 'Échantillon non hémolysé. Fonction rénale à corréler avec la clinique.',
    parameters: [
      { parameter: 'Glycémie à jeun', unit: 'g/L', referenceRange: '0.70 - 1.10', minNum: 0.70, maxNum: 1.10 },
      { parameter: 'Urée sanguine', unit: 'g/L', referenceRange: '0.15 - 0.45', minNum: 0.15, maxNum: 0.45 },
      { parameter: 'Créatininémie', unit: 'mg/L', referenceRange: '6.0 - 12.0', minNum: 6.0, maxNum: 12.0 },
      { parameter: 'Acide urique', unit: 'mg/L', referenceRange: '30.0 - 70.0', minNum: 30.0, maxNum: 70.0 },
      { parameter: 'Débit de Filtration Glomérulaire (eDFG)', unit: 'mL/min/1.73m²', referenceRange: '> 90', minNum: 90 }
    ]
  },
  {
    id: 'bilan_lipidique',
    name: 'Bilan Lipidique Complet',
    category: 'Biochimie',
    description: 'Cholestérol Total, HDL, LDL, Triglycérides.',
    defaultObservations: 'Sérum limpide. Bilan réalisé après 12 heures de jeûne.',
    parameters: [
      { parameter: 'Cholestérol Total', unit: 'g/L', referenceRange: '< 2.00', maxNum: 2.00 },
      { parameter: 'Triglycérides', unit: 'g/L', referenceRange: '0.40 - 1.50', minNum: 0.40, maxNum: 1.50 },
      { parameter: 'HDL - Cholestérol', unit: 'g/L', referenceRange: '> 0.40', minNum: 0.40 },
      { parameter: 'LDL - Cholestérol calculé', unit: 'g/L', referenceRange: '< 1.30', maxNum: 1.30 },
      { parameter: 'Rapport Cholestérol Total / HDL', unit: 'Ratio', referenceRange: '< 4.5', maxNum: 4.5 }
    ]
  },
  {
    id: 'bilan_hepatique',
    name: 'Bilan Hépatique (Enzymologie & Bilirubines)',
    category: 'Biochimie',
    description: 'Transaminases ASAT/TGO, ALAT/TGP, Bilirubines, Gamma-GT, Phosphatases alcalines.',
    defaultObservations: 'Absence d’hémolyse visible. Intégrité hépato-cellulaire.',
    parameters: [
      { parameter: 'Transaminases ASAT (TGO)', unit: 'UI/L', referenceRange: '< 35', maxNum: 35 },
      { parameter: 'Transaminases ALAT (TGP)', unit: 'UI/L', referenceRange: '< 45', maxNum: 45 },
      { parameter: 'Bilirubine Totale', unit: 'mg/L', referenceRange: '< 12.0', maxNum: 12.0 },
      { parameter: 'Bilirubine Conjuguée (Directe)', unit: 'mg/L', referenceRange: '< 3.0', maxNum: 3.0 },
      { parameter: 'Gamma-GT (GGT)', unit: 'UI/L', referenceRange: '10 - 50', minNum: 10, maxNum: 50 },
      { parameter: 'Phosphatases Alcalines (PAL)', unit: 'UI/L', referenceRange: '40 - 130', minNum: 40, maxNum: 130 }
    ]
  },
  {
    id: 'paludisme_inflammatoire',
    name: 'Paludisme & Bilan Inflammatoire (GE / TDR / CRP / VS)',
    category: 'Infectiologie & Parasitologie',
    description: 'Goutte Épaisse, TDR Palu, CRP, VS, Sérodiagnostic de Widal.',
    defaultObservations: 'Examen parasitaire réalisé au microscope optique à immersion 100x.',
    parameters: [
      { parameter: 'Goutte Épaisse (GE)', unit: 'Densité', referenceRange: 'Négative', defaultValue: 'Négative', isQualitative: true },
      { parameter: 'Frottis Mince Sanguin', unit: 'Parasites', referenceRange: 'Absence d’hématozoaires', defaultValue: 'Absence de Plasmodium', isQualitative: true },
      { parameter: 'TDR Paludisme (Ag Pf/Pan)', unit: 'Test Rapide', referenceRange: 'Négatif', defaultValue: 'Négatif', isQualitative: true },
      { parameter: 'CRP (Protéine C-Réactive)', unit: 'mg/L', referenceRange: '< 6.0', maxNum: 6.0 },
      { parameter: 'Vitesse de Sédimentation (VS 1ère h)', unit: 'mm', referenceRange: '< 15', maxNum: 15 },
      { parameter: 'Sérodiagnostic Widal & Félix (TO)', unit: 'Titre', referenceRange: '< 1/80 (Négatif)', defaultValue: 'Négatif', isQualitative: true },
      { parameter: 'Sérodiagnostic Widal & Félix (TH)', unit: 'Titre', referenceRange: '< 1/80 (Négatif)', defaultValue: 'Négatif', isQualitative: true }
    ]
  },
  {
    id: 'serologie_depistage',
    name: 'Sérologie & Dépistages Rapides (VIH, Hépatites, Syphilis, HCG)',
    category: 'Sérologie & Immunologie',
    description: 'Tests rapides immunologiques et sérologies de dépistage.',
    defaultObservations: 'Tests de 4ème génération validés avec témoins internes conformes.',
    parameters: [
      { parameter: 'Test Rapide VIH 1 & 2', unit: 'Test', referenceRange: 'Négatif (Non réactif)', defaultValue: 'Négatif', isQualitative: true },
      { parameter: 'Antigène HBs (Hépatite B)', unit: 'Test', referenceRange: 'Négatif (Non réactif)', defaultValue: 'Négatif', isQualitative: true },
      { parameter: 'Anticorps Anti-HCV (Hépatite C)', unit: 'Test', referenceRange: 'Négatif (Non réactif)', defaultValue: 'Négatif', isQualitative: true },
      { parameter: 'Sérologie Syphilis (VDRL / TPHA)', unit: 'Test', referenceRange: 'Négatif (Non réactif)', defaultValue: 'Négatif', isQualitative: true },
      { parameter: 'Test Immunologique de Grossesse (HCG)', unit: 'Bêta-HCG', referenceRange: 'Négatif', defaultValue: 'Négatif', isQualitative: true },
      { parameter: 'Chlamydia trachomatis (Ag Rapide)', unit: 'Test', referenceRange: 'Négatif', defaultValue: 'Négatif', isQualitative: true }
    ]
  },
  {
    id: 'ecbu_urines',
    name: 'ECBU & Examen Cytobactériologique des Urines',
    category: 'Bactériologie',
    description: 'Cytologie quantitative des urines, culot, coloration de Gram et culture.',
    defaultObservations: 'Prélèvement au milieu du jet respectant les règles d’asepsie.',
    parameters: [
      { parameter: 'Aspect macroscopique', unit: 'Visuel', referenceRange: 'Limpide / Jaune paille', defaultValue: 'Limpide', isQualitative: true },
      { parameter: 'Leucocyturie (Culot)', unit: '/mL', referenceRange: '< 10 000', maxNum: 10000 },
      { parameter: 'Hématurie (Culot)', unit: '/mL', referenceRange: '< 5 000', maxNum: 5000 },
      { parameter: 'Cellules épithéliales', unit: 'Champ', referenceRange: 'Rares ou absentes', defaultValue: 'Rares', isQualitative: true },
      { parameter: 'Cylindres / Cristaux', unit: 'Champ', referenceRange: 'Absence', defaultValue: 'Absence', isQualitative: true },
      { parameter: 'Coloration de Gram (Examen direct)', unit: 'Microscopie', referenceRange: 'Absence de germe', defaultValue: 'Absence de germe', isQualitative: true },
      { parameter: 'Culture bactériologique', unit: 'UFC/mL', referenceRange: 'Stérile (< 10³ UFC/mL)', defaultValue: 'Culture stérile après 24h', isQualitative: true }
    ]
  },
  {
    id: 'ionogramme',
    name: 'Ionogramme Sanguin (Électrolytes & Minéraux)',
    category: 'Biochimie',
    description: 'Sodium, Potassium, Chlore, Calcium, Bicarbonates.',
    defaultObservations: 'Équilibre hydro-électrolytique et équilibre acido-basique.',
    parameters: [
      { parameter: 'Sodium (Na+)', unit: 'mmol/L', referenceRange: '135.0 - 145.0', minNum: 135.0, maxNum: 145.0 },
      { parameter: 'Potassium (K+)', unit: 'mmol/L', referenceRange: '3.50 - 5.00', minNum: 3.50, maxNum: 5.00 },
      { parameter: 'Chlore (Cl-)', unit: 'mmol/L', referenceRange: '98.0 - 106.0', minNum: 98.0, maxNum: 106.0 },
      { parameter: 'Calcium total', unit: 'mg/L', referenceRange: '85.0 - 105.0', minNum: 85.0, maxNum: 105.0 },
      { parameter: 'Magnésium sérique', unit: 'mg/L', referenceRange: '18.0 - 24.0', minNum: 18.0, maxNum: 24.0 }
    ]
  },
  {
    id: 'hemostase',
    name: 'Bilan d’Hémostase & Coagulation',
    category: 'Hémostase',
    description: 'Taux de Prothrombine, INR, TCA/TCK, Fibrinogène.',
    defaultObservations: 'Plasma citraté correctement prélevé et décanté sans caillot.',
    parameters: [
      { parameter: 'Taux de Prothrombine (TP)', unit: '%', referenceRange: '70.0 - 100.0', minNum: 70.0, maxNum: 100.0 },
      { parameter: 'INR', unit: 'Ratio', referenceRange: '0.90 - 1.20', minNum: 0.90, maxNum: 1.20 },
      { parameter: 'TCA / TCK (Patient)', unit: 'Secondes', referenceRange: '28.0 - 38.0', minNum: 28.0, maxNum: 38.0 },
      { parameter: 'TCA / TCK (Témoin)', unit: 'Secondes', referenceRange: '30.0 - 33.0', defaultValue: '31.0', minNum: 30.0, maxNum: 33.0 },
      { parameter: 'Fibrinogène', unit: 'g/L', referenceRange: '2.00 - 4.00', minNum: 2.00, maxNum: 4.00 }
    ]
  },
  {
    id: 'coprologie',
    name: 'Coprologie Parasitaire (Examen Parasitologique des Selles)',
    category: 'Parasitologie',
    description: 'Examen macroscopique et microscopique direct et après enrichissement.',
    defaultObservations: 'Examen direct à l’état frais et après coloration au Lugol.',
    parameters: [
      { parameter: 'Aspect macroscopique des selles', unit: 'Aspect', referenceRange: 'Moulées / Homogènes', defaultValue: 'Moulées', isQualitative: true },
      { parameter: 'Kystes d’amibes (Entamoeba histolytica / dispar)', unit: 'Champ', referenceRange: 'Absence', defaultValue: 'Absence', isQualitative: true },
      { parameter: 'Kystes de Giardia intestinalis', unit: 'Champ', referenceRange: 'Absence', defaultValue: 'Absence', isQualitative: true },
      { parameter: 'Œufs d’helminthes (Ascaris, Ankylostomes, Trichuris)', unit: 'Champ', referenceRange: 'Absence', defaultValue: 'Absence', isQualitative: true },
      { parameter: 'Présence de glaires ou de sang', unit: 'Visuel', referenceRange: 'Absence', defaultValue: 'Absence', isQualitative: true }
    ]
  },
  {
    id: 'custom',
    name: 'Analyse Personnalisée / Tableau sur-mesure',
    category: 'Biologie Générale',
    description: 'Modèle modulaire permettant de définir et valider des constantes biologiques spécifiques.',
    defaultObservations: 'Résultats validés par le technicien de laboratoire.',
    parameters: [
      { parameter: 'Constante biologique 1', unit: 'mg/dL', referenceRange: 'Norme standard', defaultValue: '' },
      { parameter: 'Constante biologique 2', unit: 'UI/L', referenceRange: 'Norme standard', defaultValue: '' }
    ]
  }
];

/**
 * Intelligent helper to detect the most relevant template based on test name or category
 */
export function detectTemplateForTest(testName: string, category?: string): LabAnalysisTemplate {
  const t = (testName || '').toLowerCase();
  const c = (category || '').toLowerCase();

  if (t.includes('nfs') || t.includes('hémogramme') || t.includes('hemogramme') || t.includes('hémoglobine') || t.includes('plaquette') || t.includes('leucocyte')) {
    return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'nfs')!;
  }
  if (t.includes('palu') || t.includes('goutte') || t.includes('tdr') || t.includes('widal') || t.includes('crp') || t.includes('vs ') || t.includes('sédimentation')) {
    return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'paludisme_inflammatoire')!;
  }
  if (t.includes('lipid') || t.includes('cholest') || t.includes('triglyc') || t.includes('hdl') || t.includes('ldl')) {
    return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'bilan_lipidique')!;
  }
  if (t.includes('hépati') || t.includes('asat') || t.includes('alat') || t.includes('tgo') || t.includes('tgp') || t.includes('bilirub') || t.includes('transamin')) {
    return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'bilan_hepatique')!;
  }
  if (t.includes('glyc') || t.includes('urée') || t.includes('uree') || t.includes('créat') || t.includes('creat') || t.includes('acide uri') || t.includes('rein') || t.includes('rénal')) {
    return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'biochimie_renale')!;
  }
  if (t.includes('ecbu') || t.includes('urin') || t.includes('culot') || t.includes('leucocytur')) {
    return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'ecbu_urines')!;
  }
  if (t.includes('vih') || t.includes('hiv') || t.includes('hbs') || t.includes('hcv') || t.includes('syphil') || t.includes('vdrl') || t.includes('tpha') || t.includes('grossesse') || t.includes('hcg') || t.includes('chlamyd')) {
    return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'serologie_depistage')!;
  }
  if (t.includes('iono') || t.includes('sodium') || t.includes('potassium') || t.includes('chlore') || t.includes('calcium')) {
    return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'ionogramme')!;
  }
  if (t.includes('tp') || t.includes('inr') || t.includes('tca') || t.includes('tck') || t.includes('hémostase') || t.includes('coagul') || t.includes('fibrinog')) {
    return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'hemostase')!;
  }
  if (t.includes('selle') || t.includes('copro') || t.includes('amibe') || t.includes('parasit')) {
    return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'coprologie')!;
  }

  // Fallback based on category
  if (c.includes('hématol')) return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'nfs')!;
  if (c.includes('biochim')) return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'biochimie_renale')!;
  if (c.includes('sérol') || c.includes('immunol')) return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'serologie_depistage')!;
  if (c.includes('parasito')) return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'paludisme_inflammatoire')!;
  if (c.includes('bactério')) return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'ecbu_urines')!;

  return LAB_ANALYSIS_TEMPLATES.find(tpl => tpl.id === 'custom')!;
}

/**
 * Parses a raw result string (which may be JSON or plain text) into a StructuredLabData object
 */
export function parseLabResult(resultRaw?: string): StructuredLabData | null {
  if (!resultRaw) return null;
  const trimmed = resultRaw.trim();

  // Try JSON parsing
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && Array.isArray(parsed.rows)) {
        return parsed as StructuredLabData;
      }
    } catch {
      // not JSON
    }
  }

  // Legacy string format fallback parsing
  // ex: [Conclusion: NORMAL] Hémoglobine: 12.8 g/dL | Leucocytes: 7 200 /mm³ ...
  const conclusionMatch = trimmed.match(/\[Conclusion:\s*([A-Z_]+)\]/i);
  const conclusion = (conclusionMatch ? conclusionMatch[1].toUpperCase() : 'NORMAL') as 'NORMAL' | 'ANORMAL' | 'A_SURVEILLER';
  const cleanBody = trimmed.replace(/\[Conclusion:\s*[A-Z_]+\]/i, '').trim();

  if (!cleanBody) return null;

  // Split on pipe | or newline
  const parts = cleanBody.split(/\||\n/).map(p => p.trim()).filter(Boolean);
  const rows: LabTableRow[] = [];

  parts.forEach(part => {
    // try to split "Param: Value"
    const colonIdx = part.indexOf(':');
    if (colonIdx > 0) {
      const param = part.substring(0, colonIdx).trim();
      const val = part.substring(colonIdx + 1).trim();
      rows.push({
        parameter: param,
        value: val,
        unit: '',
        referenceRange: 'Standard',
        status: conclusion === 'ANORMAL' ? 'ABNORMAL' : 'NORMAL'
      });
    } else {
      rows.push({
        parameter: 'Observation / Mesure',
        value: part,
        unit: '',
        referenceRange: 'Standard',
        status: conclusion === 'ANORMAL' ? 'ABNORMAL' : 'NORMAL'
      });
    }
  });

  return {
    isStructured: true,
    version: 2,
    templateId: 'legacy',
    templateName: 'Examen Biologique',
    conclusion: conclusion === 'ANORMAL' || conclusion === 'A_SURVEILLER' ? conclusion : 'NORMAL',
    rows: rows.length > 0 ? rows : [{
      parameter: 'Résultats',
      value: cleanBody,
      unit: '',
      referenceRange: 'Normal',
      status: 'NORMAL'
    }],
    observations: ''
  };
}

/**
 * Automatically evaluates whether a measured numerical or qualitative value is Normal, High, Low, etc.
 */
export function evaluateRowStatus(
  val: string,
  refRange: string,
  minNum?: number,
  maxNum?: number,
  isQualitative?: boolean
): LabTableRow['status'] {
  const v = (val || '').trim();
  if (!v) return 'NORMAL';

  const vLower = v.toLowerCase();

  // Qualitative checks
  if (isQualitative || isNaN(Number(v.replace(',', '.').replace(/\s/g, '')))) {
    if (
      vLower.includes('positif') ||
      vLower.includes('réactif') ||
      vLower.includes('reactif') ||
      vLower.includes('présence') ||
      vLower.includes('presence') ||
      vLower.includes('anormal') ||
      vLower.includes('patholog')
    ) {
      return 'POSITIVE';
    }
    if (
      vLower.includes('négatif') ||
      vLower.includes('negatif') ||
      vLower.includes('non réactif') ||
      vLower.includes('absence') ||
      vLower.includes('stérile') ||
      vLower.includes('normal')
    ) {
      return 'NEGATIVE';
    }
  }

  // Numeric checks
  const parsedNum = parseFloat(v.replace(',', '.').replace(/\s/g, ''));
  if (!isNaN(parsedNum)) {
    // If explicit minNum / maxNum
    if (minNum !== undefined && parsedNum < minNum) return 'LOW';
    if (maxNum !== undefined && parsedNum > maxNum) return 'HIGH';

    // Parse from refRange string e.g. "12.0 - 16.0" or "< 35" or "> 90"
    if (refRange.includes('-')) {
      const parts = refRange.split('-').map(p => parseFloat(p.replace(',', '.').replace(/[^\d.]/g, '')));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        if (parsedNum < parts[0]) return 'LOW';
        if (parsedNum > parts[1]) return 'HIGH';
        return 'NORMAL';
      }
    } else if (refRange.startsWith('<')) {
      const max = parseFloat(refRange.replace('<', '').replace(',', '.').replace(/[^\d.]/g, ''));
      if (!isNaN(max) && parsedNum > max) return 'HIGH';
      return 'NORMAL';
    } else if (refRange.startsWith('>')) {
      const min = parseFloat(refRange.replace('>', '').replace(',', '.').replace(/[^\d.]/g, ''));
      if (!isNaN(min) && parsedNum < min) return 'LOW';
      return 'NORMAL';
    }
  }

  return 'NORMAL';
}
