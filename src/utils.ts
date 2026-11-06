import { PrescriptionItem } from './types';

/**
 * Utilitaires pour le formatage des montants et nombres dans l'application.
 * 
 * Garantit que les montants financiers sont affichés avec un espace standard (' ', ASCII 32)
 * et empêche l'apparition indésirable de slashes ou de caractères spéciaux (comme "48 /000 FCFA"
 * causé par les espaces insécables étroits \u202F dans jsPDF ou certains moteurs de rendu).
 */

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0';
  
  if (typeof value === 'string') {
    if (value.toLowerCase().includes('nan') || value.toLowerCase().includes('undefined') || value.toLowerCase().includes('null')) {
      return '0';
    }
    const cleaned = value.replace(/(\d+)\s*\/\s*(\d+)/g, '$1 $2').replace(/[\u202F\u00A0]/g, ' ').trim();
    const num = Number(cleaned.replace(/\s+/g, '').replace(',', '.'));
    if (!isNaN(num)) {
      const rounded = Math.round(num);
      const safeNum = Object.is(rounded, -0) ? 0 : rounded;
      const parts = safeNum.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return parts.join('.');
    }
    return cleaned;
  }

  const num = Number(value);
  if (isNaN(num)) return '0';

  const rounded = Math.round(num);
  const safeNum = Object.is(rounded, -0) ? 0 : rounded;
  const parts = safeNum.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}

export function formatFCFA(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0 FCFA';
  return `${formatNumber(value)} FCFA`;
}

export function cleanAmount(str: string): string {
  if (!str) return '';
  return str
    .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 $2')
    .replace(/[\u202F\u00A0]/g, ' ');
}

/**
 * Calcule le montant effectivement encaissé en caisse pour un ticket (ticket modérateur / part patient).
 * Si le ticket bénéficie d'une prise en charge IPM / Assurance (tiers payant),
 * seul le reste à charge réglé par le patient au guichet est comptabilisé comme recette directe.
 */
export function getTicketPaidAmount(ticket: { amount?: number | string | null; insuranceId?: string | null; paymentMethod?: string; insuranceCoverage?: number | string | null }): number {
  if (!ticket) return 0;
  const gross = Number(ticket.amount || 0);
  if (isNaN(gross) || gross <= 0) return 0;
  
  if (ticket.insuranceId || ticket.paymentMethod === 'TIERS_PAYANT') {
    const coverageRate = Number(ticket.insuranceCoverage || 80);
    const patientShare = Math.round(gross * (1 - coverageRate / 100));
    return Math.max(0, patientShare);
  }
  return gross;
}

/**
 * Calcule la part couverte par le tiers payant (créance IPM / Assurance).
 */
export function getTicketInsuranceAmount(ticket: { amount?: number | string | null; insuranceId?: string | null; paymentMethod?: string; insuranceCoverage?: number | string | null }): number {
  if (!ticket) return 0;
  const gross = Number(ticket.amount || 0);
  if (isNaN(gross) || gross <= 0) return 0;

  if (ticket.insuranceId || ticket.paymentMethod === 'TIERS_PAYANT') {
    const coverageRate = Number(ticket.insuranceCoverage || 80);
    const covered = Math.round(gross * coverageRate / 100);
    return Math.max(0, covered);
  }
  return 0;
}

/**
 * Parse en toute sécurité l'ordonnance d'une consultation, qu'elle soit stockée sous forme :
 * - De tableau PrescriptionItem[]
 * - De chaîne JSON sérialisée
 * - De texte brut médical (ex : "Paracétamol", "Paracétamol 1g, Amoxicilline")
 *
 * Évite les SyntaxError et n'émet aucun console.error bloquant.
 */
export function parsePrescription(
  prescription?: string,
  prescriptionItems?: PrescriptionItem[]
): PrescriptionItem[] {
  if (Array.isArray(prescriptionItems) && prescriptionItems.length > 0) {
    return prescriptionItems;
  }

  if (!prescription || typeof prescription !== 'string') {
    return [];
  }

  const trimmed = prescription.trim();
  if (!trimmed) return [];

  // Si la chaîne commence par '[' ou '{', tenter le parsing JSON
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
      if (parsed && typeof parsed === 'object') {
        return [parsed as PrescriptionItem];
      }
    } catch {
      // Ignorer l'erreur non-fatale et basculer sur le parsing texte
    }
  }

  // Découpage du texte brut par saut de ligne, point-virgule ou virgule
  const delimiter = trimmed.includes('\n') ? '\n' : (trimmed.includes(';') ? ';' : ',');
  const parts = trimmed.split(delimiter).map(s => s.trim()).filter(Boolean);

  if (parts.length > 0) {
    return parts.map((part, idx) => ({
      id: `presc-${idx}`,
      medicineId: `med-custom-${idx}`,
      medicineName: part,
      dosage: '',
      duration: '',
      quantity: 1,
      instructions: part
    }));
  }

  return [];
}

