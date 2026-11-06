// DICOM Parser & Renderer — Norme NEMA PS3.10 / PS3.5
// Décode les en-têtes DICOM, extrait les métadonnées cliniques et restitue
// les pixels 8/16-bit dans un élément Canvas HTML5 avec fenêtrage radiologique (VOI LUT).

export interface DicomMetadata {
  isValid: boolean;
  errorMessage?: string;
  patientName?: string;
  patientId?: string;
  patientSex?: string;
  patientAge?: string;
  studyDate?: string;
  studyDescription?: string;
  modality?: string;
  bodyPartExamined?: string;
  sopClassUid?: string;
  sopInstanceUid?: string;
  rows?: number;
  columns?: number;
  bitsAllocated?: number;
  bitsStored?: number;
  pixelRepresentation?: number;
  photometricInterpretation?: 'MONOCHROME1' | 'MONOCHROME2' | 'RGB' | string;
  windowCenter?: number;
  windowWidth?: number;
  rescaleIntercept?: number;
  rescaleSlope?: number;
  pixelSpacing?: [number, number];
  isAnonymized: boolean;
}

export interface DicomParseResult {
  metadata: DicomMetadata;
  renderedImageDataUrl?: string;
  rawPixelData?: Uint8Array | Uint16Array;
}

/**
 * Lit une chaîne ASCII dans un DataView
 */
function readAsciiString(view: DataView, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    const byte = view.getUint8(offset + i);
    if (byte === 0) break;
    str += String.fromCharCode(byte);
  }
  return str.trim();
}

/**
 * Valide le préambule DICM à l'offset 128
 */
export function isDicomFile(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 132) return false;
  const view = new DataView(buffer);
  const magic = readAsciiString(view, 128, 4);
  return magic === 'DICM';
}

/**
 * Analyse complète d'un ArrayBuffer DICOM
 */
export function parseDicomBuffer(buffer: ArrayBuffer): DicomParseResult {
  if (!isDicomFile(buffer)) {
    return {
      metadata: {
        isValid: false,
        errorMessage: "Ce fichier ne contient pas la signature 'DICM' standard à l'offset 128 (NEMA PS3.10).",
        isAnonymized: true
      }
    };
  }

  const view = new DataView(buffer);
  let offset = 132;
  const len = buffer.byteLength;

  const metadata: DicomMetadata = {
    isValid: true,
    modality: 'DX',
    bodyPartExamined: 'CHEST',
    photometricInterpretation: 'MONOCHROME2',
    bitsAllocated: 16,
    bitsStored: 12,
    windowCenter: 2048,
    windowWidth: 4096,
    isAnonymized: true
  };

  let pixelDataOffset = -1;
  let pixelDataLength = 0;

  // Parcours des balises DICOM (Explicit & Implicit VR Little Endian)
  try {
    while (offset < len - 8) {
      const group = view.getUint16(offset, true);
      const element = view.getUint16(offset + 2, true);
      offset += 4;

      // Balise PixelData (7FE0, 0010)
      if (group === 0x7fe0 && element === 0x0010) {
        // VR explicit ou implicit ?
        const possibleVR = readAsciiString(view, offset, 2);
        if (['OB', 'OW', 'OF', 'OD'].includes(possibleVR)) {
          offset += 2;
          const reserved = view.getUint16(offset, true);
          offset += 2;
          pixelDataLength = view.getUint32(offset, true);
          offset += 4;
        } else {
          pixelDataLength = view.getUint32(offset, true);
          offset += 4;
        }
        pixelDataOffset = offset;
        break;
      }

      // Lecture VR
      let vr = '';
      if (offset + 2 <= len) {
        vr = readAsciiString(view, offset, 2);
      }

      const explicitVRs = ['AE', 'AS', 'AT', 'CS', 'DA', 'DS', 'DT', 'FL', 'FD', 'IS', 'LO', 'LT', 'OB', 'OD', 'OF', 'OL', 'OW', 'PN', 'SH', 'SL', 'SQ', 'SS', 'ST', 'TM', 'UC', 'UI', 'UL', 'UN', 'UR', 'US', 'UT'];
      const isExplicit = explicitVRs.includes(vr);

      let elementLength = 0;
      if (isExplicit) {
        offset += 2;
        if (['OB', 'OW', 'OF', 'OD', 'SQ', 'UN', 'UC', 'UR', 'UT'].includes(vr)) {
          offset += 2; // Reserved
          if (offset + 4 <= len) {
            elementLength = view.getUint32(offset, true);
            offset += 4;
          }
        } else {
          if (offset + 2 <= len) {
            elementLength = view.getUint16(offset, true);
            offset += 2;
          }
        }
      } else {
        // Implicit VR Little Endian
        if (offset + 4 <= len) {
          elementLength = view.getUint32(offset, true);
          offset += 4;
        }
      }

      if (elementLength === 0xffffffff || elementLength < 0 || offset + elementLength > len) {
        // Longueur indéfinie ou fin de buffer
        break;
      }

      // Extraction des métadonnées clés
      const valStr = readAsciiString(view, offset, Math.min(elementLength, 64));

      // (0008, 0016) SOP Class UID
      if (group === 0x0008 && element === 0x0016) metadata.sopClassUid = valStr;
      // (0008, 0018) SOP Instance UID
      if (group === 0x0008 && element === 0x0018) metadata.sopInstanceUid = valStr;
      // (0008, 0020) Study Date
      if (group === 0x0008 && element === 0x0020) metadata.studyDate = valStr;
      // (0008, 0060) Modality
      if (group === 0x0008 && element === 0x0060) metadata.modality = valStr;
      // (0008, 1030) Study Description
      if (group === 0x0008 && element === 0x1030) metadata.studyDescription = valStr;
      // (0010, 0010) Patient Name
      if (group === 0x0010 && element === 0x0010) {
        metadata.patientName = valStr.replace(/\^/g, ' ');
        metadata.isAnonymized = valStr.toLowerCase().includes('anonym') || valStr === '' || valStr.startsWith('CHREIN');
      }
      // (0010, 0020) Patient ID
      if (group === 0x0010 && element === 0x0020) metadata.patientId = valStr;
      // (0010, 0040) Patient Sex
      if (group === 0x0010 && element === 0x0040) metadata.patientSex = valStr;
      // (0018, 0015) Body Part Examined
      if (group === 0x0018 && element === 0x0015) metadata.bodyPartExamined = valStr;
      // (0028, 0004) Photometric Interpretation
      if (group === 0x0028 && element === 0x0004) metadata.photometricInterpretation = valStr as any;
      // (0028, 0010) Rows
      if (group === 0x0028 && element === 0x0010) metadata.rows = view.getUint16(offset, true);
      // (0028, 0011) Columns
      if (group === 0x0028 && element === 0x0011) metadata.columns = view.getUint16(offset, true);
      // (0028, 0100) Bits Allocated
      if (group === 0x0028 && element === 0x0100) metadata.bitsAllocated = view.getUint16(offset, true);
      // (0028, 0101) Bits Stored
      if (group === 0x0028 && element === 0x0101) metadata.bitsStored = view.getUint16(offset, true);
      // (0028, 0103) Pixel Representation
      if (group === 0x0028 && element === 0x0103) metadata.pixelRepresentation = view.getUint16(offset, true);
      // (0028, 1050) Window Center
      if (group === 0x0028 && element === 0x1050) metadata.windowCenter = parseFloat(valStr);
      // (0028, 1051) Window Width
      if (group === 0x0028 && element === 0x1051) metadata.windowWidth = parseFloat(valStr);
      // (0028, 1052) Rescale Intercept
      if (group === 0x0028 && element === 0x1052) metadata.rescaleIntercept = parseFloat(valStr);
      // (0028, 1053) Rescale Slope
      if (group === 0x0028 && element === 0x1053) metadata.rescaleSlope = parseFloat(valStr);

      offset += elementLength;
    }
  } catch (err) {
    console.warn('Fin anticipée ou erreur lecture balises DICOM:', err);
  }

  // Si des pixels DICOM sont présents, les décoder sur Canvas
  let renderedImageDataUrl: string | undefined;
  const rows = metadata.rows || 512;
  const cols = metadata.columns || 512;

  if (pixelDataOffset > 0 && typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = cols;
      canvas.height = rows;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const imgData = ctx.createImageData(cols, rows);
        const data = imgData.data;

        const is16Bit = (metadata.bitsAllocated || 16) > 8;
        const isMonochrome1 = metadata.photometricInterpretation === 'MONOCHROME1';

        // Fenêtrage VOI LUT
        const wc = metadata.windowCenter || (is16Bit ? 2048 : 128);
        const ww = metadata.windowWidth || (is16Bit ? 4096 : 256);
        const lower = wc - 0.5 - (ww - 1) / 2.0;
        const upper = wc - 0.5 + (ww - 1) / 2.0;

        const pixelCount = rows * cols;

        if (is16Bit) {
          const u16 = new Uint16Array(buffer, pixelDataOffset, Math.min(pixelCount, Math.floor((len - pixelDataOffset) / 2)));
          for (let i = 0; i < u16.length; i++) {
            let val = u16[i];
            // Normalisation Window/Level
            let intensity = ((val - lower) / (upper - lower)) * 255;
            intensity = Math.max(0, Math.min(255, intensity));
            if (isMonochrome1) intensity = 255 - intensity;

            const idx = i * 4;
            data[idx] = intensity;     // R
            data[idx + 1] = intensity; // G
            data[idx + 2] = intensity; // B
            data[idx + 3] = 255;       // Alpha
          }
        } else {
          const u8 = new Uint8Array(buffer, pixelDataOffset, Math.min(pixelCount, len - pixelDataOffset));
          for (let i = 0; i < u8.length; i++) {
            let val = u8[i];
            let intensity = ((val - lower) / (upper - lower)) * 255;
            intensity = Math.max(0, Math.min(255, intensity));
            if (isMonochrome1) intensity = 255 - intensity;

            const idx = i * 4;
            data[idx] = intensity;
            data[idx + 1] = intensity;
            data[idx + 2] = intensity;
            data[idx + 3] = 255;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        renderedImageDataUrl = canvas.toDataURL('image/png');
      }
    } catch (e) {
      console.warn('Erreur rendu pixels DICOM sur Canvas:', e);
    }
  }

  return {
    metadata,
    renderedImageDataUrl
  };
}

/**
 * Générateur de fichier DICOM médical synthétique de test conforme NEMA PS3.10
 * Utile pour permettre à l'utilisateur de tester immédiatement l'upload DICOM
 */
export function generateSyntheticTestDicom(caseType: 'TB' | 'PNEUMONIA' | 'PNEUMOTHORAX'): Blob {
  const width = 256;
  const height = 256;
  const pixelBytes = width * height * 2; // 16-bit
  const totalSize = 132 + 512 + pixelBytes;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // 1. Préambule 128 octets de zéros
  for (let i = 0; i < 128; i++) {
    view.setUint8(i, 0);
  }

  // 2. Signature 'DICM'
  view.setUint8(128, 0x44); // D
  view.setUint8(129, 0x49); // I
  view.setUint8(130, 0x43); // C
  view.setUint8(131, 0x4d); // M

  let offset = 132;

  // Helper pour écrire une balise Explicit VR
  const writeElementStr = (group: number, elem: number, vr: string, value: string) => {
    view.setUint16(offset, group, true);
    view.setUint16(offset + 2, elem, true);
    offset += 4;
    view.setUint8(offset, vr.charCodeAt(0));
    view.setUint8(offset + 1, vr.charCodeAt(1));
    offset += 2;
    const valLen = value.length + (value.length % 2); // padding pair
    view.setUint16(offset, valLen, true);
    offset += 2;
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
    if (value.length % 2 !== 0) {
      view.setUint8(offset + value.length, 32); // space pad
    }
    offset += valLen;
  };

  const writeElementU16 = (group: number, elem: number, vr: string, val: number) => {
    view.setUint16(offset, group, true);
    view.setUint16(offset + 2, elem, true);
    offset += 4;
    view.setUint8(offset, vr.charCodeAt(0));
    view.setUint8(offset + 1, vr.charCodeAt(1));
    offset += 2;
    view.setUint16(offset, 2, true);
    offset += 2;
    view.setUint16(offset, val, true);
    offset += 2;
  };

  // Balises métadonnées
  writeElementStr(0x0008, 0x0016, 'UI', '1.2.840.10008.5.1.4.1.1.1.1'); // DX Storage
  writeElementStr(0x0008, 0x0060, 'CS', 'DX'); // Modality DX
  writeElementStr(0x0008, 0x0020, 'DA', '20261027');
  writeElementStr(0x0010, 0x0010, 'PN', caseType === 'TB' ? 'DIOP^MAMADOU' : caseType === 'PNEUMONIA' ? 'NDIAYE^AISSATOU' : 'CISSE^IBRAHIMA');
  writeElementStr(0x0010, 0x0020, 'LO', caseType === 'TB' ? 'CHREIN-2026-014' : caseType === 'PNEUMONIA' ? 'CHREIN-2026-027' : 'CHREIN-2026-008');
  writeElementStr(0x0010, 0x0040, 'CS', caseType === 'PNEUMONIA' ? 'F' : 'M');
  writeElementStr(0x0018, 0x0015, 'CS', 'CHEST');
  writeElementStr(0x0028, 0x0004, 'CS', 'MONOCHROME2');
  writeElementU16(0x0028, 0x0010, 'US', height);
  writeElementU16(0x0028, 0x0011, 'US', width);
  writeElementU16(0x0028, 0x0100, 'US', 16);
  writeElementU16(0x0028, 0x0101, 'US', 12);
  writeElementU16(0x0028, 0x0103, 'US', 0); // unsigned
  writeElementStr(0x0028, 0x1050, 'DS', '2048');
  writeElementStr(0x0028, 0x1051, 'DS', '4096');

  // Balise PixelData (7FE0, 0010)
  view.setUint16(offset, 0x7fe0, true);
  view.setUint16(offset + 2, 0x0010, true);
  offset += 4;
  view.setUint8(offset, 0x4f); // O
  view.setUint8(offset + 1, 0x57); // W
  offset += 2;
  view.setUint16(offset, 0, true); // reserved
  offset += 2;
  view.setUint32(offset, pixelBytes, true);
  offset += 4;

  // Remplissage pixels synthétiques avec forme pulmonaire
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let val = 1200; // fond sombre
      // Forme pulmonaire
      const dx1 = x - 80;
      const dy1 = y - 128;
      const dx2 = x - 176;
      const dy2 = y - 128;
      if ((dx1 * dx1) / 1600 + (dy1 * dy1) / 3600 < 1.0) val = 600; // poumon droit (sombre à l'air)
      if ((dx2 * dx2) / 1600 + (dy2 * dy2) / 3600 < 1.0) val = 600; // poumon gauche

      // Lésion selon le type
      if (caseType === 'TB' && x > 70 && x < 100 && y > 60 && y < 90) {
        val = 2800; // caverne hyperdense avec bord
      } else if (caseType === 'PNEUMONIA' && x > 65 && x < 110 && y > 140 && y < 190) {
        val = 2400; // foyer de condensation
      } else if (caseType === 'PNEUMOTHORAX' && x > 160 && x < 210 && y > 60 && y < 120) {
        val = 200; // hyperclarté avasculaire
      }

      view.setUint16(offset, val, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'application/dicom' });
}
