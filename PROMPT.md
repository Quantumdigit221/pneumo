# 🏥 O'cllic Santé V2 - DICOM + Open-Weights Healthcare

## 📋 Contexte du Projet

**O'cllic Santé V2** est une plateforme de **diagnostic radiologique assisté par IA open-weights**, conçue pour:
- Charger et analyser des fichiers DICOM (CT, MR, XR, US, PT)
- Intégrer des modèles de segmentation et classification open-weights
- Workflow clinique sécurisé avec validation humaine
- Export structuré (HL7, FHIR, PDF, annotations DICOM)
- Conformité HIPAA/GDPR avec stockage local

**Stack:** TypeScript, Node.js, Express, DICOM parsing, inference locale

---

## 🎯 Objectifs du MVP

### Phase 1: Ingestion DICOM
- Parser fichiers `.dcm` locaux
- Extraire métadonnées (patient, étude, série, modalité)
- Normaliser et indexer les données
- Support pour dossiers multiples et structures hiérarchiques

### Phase 2: API Backend + Workflow
- API REST pour charger, explorer et analyser les études
- Endpoints cliniques (findings, rapports, export)
- Audit trail et traçabilité
- Gestion des patients et études

### Phase 3: IA Open-Weights
- Wrapper pour modèles ONNX / TorchScript / MONAI
- Segmentation (organes, lésions)
- Classification (pneumonie, nodules, fractures)
- Inference locale avec GPU optionnel

### Phase 4: Export & Interopérabilité
- Génération rapports HL7 v2
- Export FHIR Imaging Study
- Annotations DICOM (RT Struct, SR)
- PDF pour archivage

---

## 🏗️ Architecture

```
O-cllic-sante-V2/
├── src/
│   ├── app.ts                          # Point d'entrée
│   ├── config/
│   │   └── env.ts                      # Variables d'environnement
│   ├── server/
│   │   ├── server.ts                   # Express setup
│   │   ├── routes.ts                   # Routes API
│   │   └── middleware.ts               # Auth, logging, CORS
│   ├── dicom/
│   │   ├── types.ts                    # Types DICOM (Patient, Study, Series, File)
│   │   ├── loader.ts                   # Chargement fichiers .dcm
│   │   ├── metadata.ts                 # Extraction métadonnées
│   │   ├── normalize.ts                # Normalisation études/séries
│   │   └── dicomweb.ts                 # Support DICOMweb (futur)
│   ├── ai/
│   │   ├── model.types.ts              # Interfaces Model, InferenceResult
│   │   ├── openweights.ts              # Wrapper modèles open-weights
│   │   ├── segmentation.ts             # Modèles de segmentation
│   │   ├── classification.ts           # Modèles de classification
│   │   └── inference.ts                # Pipeline inference
│   ├── clinical/
│   │   ├── findings.ts                 # Interprétation findings
│   │   ├── report.ts                   # Génération rapports
│   │   ├── validation.ts               # Validation humaine workflow
│   │   └── workflow.ts                 # Orchestration analyse
│   ├── exports/
│   │   ├── hl7.ts                      # Export HL7 v2
│   │   ├── fhir.ts                     # Export FHIR Imaging Study
│   │   ├── pdf.ts                      # Génération PDF
│   │   └── dicom-annotations.ts        # Annotations DICOM (RT Struct, SR)
│   ├── storage/
│   │   ├── database.ts                 # ORM / DB (SQLite ou PostgreSQL)
│   │   └── audit.ts                    # Audit logs
│   ├── utils/
│   │   ├── logger.ts                   # Logging structuré
│   │   ├── file.ts                     # Utilitaires fichiers
│   │   ├── validation.ts               # Schémas Zod
│   │   └── error.ts                    # Error handling
│   └── index.ts                        # Bootstrap
├── test/
│   ├── dicom.test.ts                   # Tests loader/metadata
│   ├── ai.test.ts                      # Tests inference
│   └── api.test.ts                     # Tests endpoints
├── docs/
│   ├── API.md                          # Spec API
│   ├── DICOM.md                        # Guide DICOM parsing
│   ├── AI_MODELS.md                    # Intégration modèles
│   └── WORKFLOW.md                     # Workflow clinique
├── .env.example
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## 📦 Dependencies (package.json)

### Core
```json
{
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.9.0",
    "dotenv": "^16.4.5",
    "zod": "^3.24.0",
    "winston": "^3.14.0"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "tsx": "^4.19.0",
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.0",
    "vitest": "^2.1.8",
    "prettier": "^3.4.2",
    "eslint": "^9.16.0"
  }
}
```

### DICOM Parsing
```json
{
  "dependencies": {
    "dicom-parser": "^1.8.21",
    "dcmjs": "^0.31.0"
  }
}
```

### AI / ML (optional, to integrate later)
```json
{
  "dependencies": {
    "onnxruntime-node": "^1.19.0",
    "sharp": "^0.34.0"
  }
}
```

### Export / Reporting
```json
{
  "dependencies": {
    "pdfkit": "^0.15.0",
    "hl7": "^0.1.9"
  }
}
```

---

## 🔑 Fichiers de Démarrage

### 1. **env.ts** - Configuration
```typescript
// src/config/env.ts
import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000"),
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
  
  // DICOM
  dicomStoragePath: process.env.DICOM_STORAGE_PATH || "./data/dicom",
  
  // AI
  aiModelsPath: process.env.AI_MODELS_PATH || "./models",
  enableGpu: process.env.ENABLE_GPU === "true",
  
  // Database
  databaseUrl: process.env.DATABASE_URL || "sqlite://./data/oclinic.db",
  
  // Security
  apiKey: process.env.API_KEY,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-prod",
};
```

### 2. **dicom/types.ts** - Types
```typescript
// src/dicom/types.ts
export type Modality = "CT" | "MR" | "XR" | "US" | "PT" | "NM" | "OT";

export interface DicomPatient {
  patientId: string;
  patientName?: string;
  sex?: "M" | "F" | "O";
  birthDate?: string;
}

export interface DicomStudy {
  studyInstanceUid: string;
  studyDate?: string;
  studyDescription?: string;
  studyTime?: string;
  modalities: Modality[];
}

export interface DicomSeries {
  seriesInstanceUid: string;
  seriesNumber?: number;
  seriesDescription?: string;
  modality: Modality;
  bodyPartExamined?: string;
  numberOfInstances?: number;
}

export interface DicomFile {
  sopInstanceUid: string;
  path: string;
  fileName: string;
  patient: DicomPatient;
  study: DicomStudy;
  series: DicomSeries;
  metadata: Record<string, any>;
}

export interface DicomStudyNormalized {
  patientId: string;
  studyInstanceUid: string;
  studies: DicomStudy[];
  series: DicomSeries[];
  files: DicomFile[];
}
```

### 3. **dicom/loader.ts** - Chargement
```typescript
// src/dicom/loader.ts
import fs from "node:fs/promises";
import path from "node:path";
import dicomParser from "dicom-parser";
import type { DicomFile, DicomPatient, DicomStudy, DicomSeries } from "./types.js";
import { logger } from "../utils/logger.js";

export async function loadDicomFile(filePath: string): Promise<DicomFile | null> {
  try {
    const buffer = await fs.readFile(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const dataSet = dicomParser.parseDicom(new Uint8Array(arrayBuffer));

    const patientId = dataSet.string("x00100020") || "UNKNOWN";
    const patientName = dataSet.string("x00100010") || "UNKNOWN";
    const sex = dataSet.string("x00100040") as any;
    const birthDate = dataSet.string("x00100030");

    const studyInstanceUid = dataSet.string("x0020000d") || "";
    const studyDate = dataSet.string("x00080020");
    const studyDescription = dataSet.string("x00081030");
    const studyTime = dataSet.string("x00080030");

    const seriesInstanceUid = dataSet.string("x0020000e") || "";
    const seriesNumber = dataSet.intString("x00200011");
    const seriesDescription = dataSet.string("x0008103e");
    const modality = dataSet.string("x00080060") || "OT";
    const bodyPartExamined = dataSet.string("x00180015");

    const sopInstanceUid = dataSet.string("x00080018") || path.basename(filePath);

    return {
      sopInstanceUid,
      path: filePath,
      fileName: path.basename(filePath),
      patient: { patientId, patientName, sex, birthDate },
      study: {
        studyInstanceUid,
        studyDate,
        studyDescription,
        studyTime,
        modalities: [modality as any],
      },
      series: {
        seriesInstanceUid,
        seriesNumber,
        seriesDescription,
        modality: modality as any,
        bodyPartExamined,
      },
      metadata: { dataSet },
    };
  } catch (error) {
    logger.error(`Failed to load DICOM file: ${filePath}`, error);
    return null;
  }
}

export async function loadDicomFolder(rootDir: string): Promise<DicomFile[]> {
  const files: DicomFile[] = [];
  
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.toLowerCase().endsWith(".dcm")) {
        const file = await loadDicomFile(fullPath);
        if (file) files.push(file);
      }
    }
  }
  
  await walk(rootDir);
  return files;
}
```

### 4. **ai/model.types.ts** - Types IA
```typescript
// src/ai/model.types.ts
export interface Finding {
  label: string;
  confidence: number;
  location?: string;
  description?: string;
}

export interface InferenceResult {
  modelName: string;
  modelVersion: string;
  taskType: "classification" | "segmentation" | "detection";
  findings: Finding[];
  processingTime: number;
  metadata?: Record<string, any>;
}

export interface AiModel {
  name: string;
  version: string;
  taskType: "classification" | "segmentation" | "detection";
  modality: string[];
  run(image: Buffer): Promise<InferenceResult>;
}
```

### 5. **clinical/workflow.ts** - Workflow
```typescript
// src/clinical/workflow.ts
import type { DicomFile } from "../dicom/types.js";
import type { AiModel } from "../ai/model.types.js";
import type { InferenceResult, Finding } from "../ai/model.types.js";

export interface AnalysisResult {
  patientId: string;
  studyInstanceUid: string;
  seriesInstanceUid: string;
  sopInstanceUid: string;
  analysisTimestamp: Date;
  aiFindings: Finding[];
  status: "pending_review" | "reviewed" | "approved" | "rejected";
  radiologistComment?: string;
}

export async function analyzeStudy(
  file: DicomFile,
  models: AiModel[]
): Promise<AnalysisResult> {
  const allFindings: Finding[] = [];
  const startTime = Date.now();

  for (const model of models) {
    if (!model.modality.includes(file.series.modality)) continue;

    // Convertir image DICOM en Buffer
    const imageBuffer = Buffer.from([]);

    const result: InferenceResult = await model.run(imageBuffer);
    allFindings.push(...result.findings);
  }

  return {
    patientId: file.patient.patientId,
    studyInstanceUid: file.study.studyInstanceUid,
    seriesInstanceUid: file.series.seriesInstanceUid,
    sopInstanceUid: file.sopInstanceUid,
    analysisTimestamp: new Date(),
    aiFindings: allFindings,
    status: "pending_review",
  };
}
```

### 6. **server/routes.ts** - API
```typescript
// src/server/routes.ts
import express from "express";
import { loadDicomFolder } from "../dicom/loader.js";
import { analyzeStudy } from "../clinical/workflow.js";
import { logger } from "../utils/logger.js";

export const router = express.Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Load DICOM studies
router.post("/studies/load", async (req, res) => {
  try {
    const { folder } = req.body;
    if (!folder) {
      return res.status(400).json({ error: "folder path required" });
    }

    logger.info(`Loading DICOM files from: ${folder}`);
    const files = await loadDicomFolder(folder);

    res.json({
      success: true,
      filesLoaded: files.length,
      studies: files.map((f) => ({
        patientId: f.patient.patientId,
        patientName: f.patient.patientName,
        studyInstanceUid: f.study.studyInstanceUid,
        seriesInstanceUid: f.series.seriesInstanceUid,
        modality: f.series.modality,
      })),
    });
  } catch (error) {
    logger.error("Failed to load DICOM files", error);
    res.status(500).json({ error: String(error) });
  }
});

// Analyze study
router.post("/studies/:studyUid/analyze", async (req, res) => {
  try {
    const { studyUid } = req.params;
    // Placeholder: récupérer étude de la DB
    res.json({
      success: true,
      studyUid,
      analysis: {
        findings: [],
        status: "pending_review",
      },
    });
  } catch (error) {
    logger.error("Failed to analyze study", error);
    res.status(500).json({ error: String(error) });
  }
});
```

### 7. **server/server.ts** - Express
```typescript
// src/server/server.ts
import express from "express";
import cors from "cors";
import { router } from "./routes.js";
import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Logging middleware
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  app.use("/api", router);

  return app;
}

export async function startServer() {
  const app = createServer();
  const port = config.port;

  app.listen(port, () => {
    logger.info(`🏥 O'cllic Santé V2 running on port ${port}`);
  });
}
```

### 8. **index.ts** - Bootstrap
```typescript
// src/index.ts
import { startServer } from "./server/server.js";
import { logger } from "./utils/logger.js";

async function main() {
  try {
    await startServer();
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

main();
```

### 9. **utils/logger.ts** - Logging
```typescript
// src/utils/logger.ts
import winston from "winston";
import { config } from "../config/env.js";

export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});
```

---

## 🚀 Étapes d'Implémentation

### Étape 1: Setup Projet
1. Initialiser `package.json` avec dépendances
2. Configurer TypeScript (`tsconfig.json`)
3. Créer structure dossiers
4. Variables d'environnement (`.env.example`)

### Étape 2: DICOM Ingestion
1. Implémenter `dicom/loader.ts`
2. Parser métadonnées avec `dicom-parser`
3. Types DICOM (`dicom/types.ts`)
4. Tests chargement fichiers

### Étape 3: Backend API
1. Express server (`server/server.ts`)
2. Routes DICOM (`server/routes.ts`)
3. Endpoints `/studies/load`, `/studies/:id`
4. Logging structuré

### Étape 4: Workflow Clinique
1. Types findings (`ai/model.types.ts`)
2. Orchestration analyse (`clinical/workflow.ts`)
3. Endpoints d'analyse `/studies/:id/analyze`
4. Validation humaine workflow

### Étape 5: IA Open-Weights
1. Wrapper modèles (`ai/openweights.ts`)
2. Segmentation (`ai/segmentation.ts`)
3. Classification (`ai/classification.ts`)
4. Pipeline inference (`ai/inference.ts`)

### Étape 6: Export & Rapports
1. Export HL7 v2 (`exports/hl7.ts`)
2. Export FHIR (`exports/fhir.ts`)
3. Génération PDF (`exports/pdf.ts`)
4. Annotations DICOM (`exports/dicom-annotations.ts`)

### Étape 7: Sécurité & Audit
1. Auth (JWT, API Key)
2. Audit logs (`storage/audit.ts`)
3. RBAC (radiologist, admin, viewer)
4. Encryption données sensibles

---

## 📖 Documentation

### API.md
```markdown
# O'cllic Santé API

## POST /api/studies/load
Charger fichiers DICOM d'un dossier local
Body: { folder: "/path/to/dicom" }
Response: { filesLoaded, studies }

## POST /api/studies/:studyUid/analyze
Analyser une étude avec modèles IA
Response: { findings, status, analysisId }

## GET /api/studies/:studyUid
Récupérer étude et métadonnées
Response: { patient, study, series, files }

## POST /api/studies/:studyUid/validate
Valider et approuver rapports (radiologiste)
Body: { status, comment }

## GET /api/reports/:analysisId/hl7
Export rapport HL7 v2

## GET /api/reports/:analysisId/pdf
Export rapport PDF
```

### DICOM.md
```markdown
# DICOM Parsing Guide

## Format DICOM
- Standard ISO/IEC 12993
- Structure: Patient -> Study -> Series -> Instance
- Tags: (GGGG,EEEE) où GGGG=group, EEEE=element

## Métadonnées Essentielles
- Patient ID (0010,0020)
- Study UID (0020,000D)
- Series UID (0020,000E)
- SOP Class UID (0008,0016)
- Modality (0008,0060)

## Parsing avec dicom-parser
```

### AI_MODELS.md
```markdown
# Intégration Modèles Open-Weights

## Modèles Supportés
- Segmentation: nnU-Net, MONAI
- Classification: DenseNet, ResNet
- Detection: YOLOv8-med, RetinaNet

## Format Model
- ONNX (.onnx)
- TorchScript (.pt)
- SavedModel TensorFlow (.pb)

## Inference Pipeline
1. Prétraitement (normalisation, resize)
2. Inference GPU/CPU
3. Post-processing (seuillage, NMS)
4. Extraction findings
```

### WORKFLOW.md
```markdown
# Workflow Clinique

## Étapes
1. **Ingestion**: Charger DICOM
2. **IA Analysis**: Inference modèles
3. **Findings**: Extraction résultats
4. **Human Review**: Radiologiste valide
5. **Approval**: Signature rapport
6. **Export**: HL7, PDF, annotations DICOM

## Validation Humaine
- Radiologiste revoit findings IA
- Peut accepter, modifier, ou rejeter
- Ajoute commentaires cliniques
- Signe rapport (électronique)
```

---

## 📝 .env.example

```env
# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# DICOM Storage
DICOM_STORAGE_PATH=./data/dicom

# AI Models
AI_MODELS_PATH=./models
ENABLE_GPU=false

# Database
DATABASE_URL=sqlite://./data/oclinic.db

# Security
API_KEY=your-api-key-here
JWT_SECRET=your-jwt-secret-change-in-prod

# IQ View Integration (optional)
IQ_VIEW_URL=http://localhost:8080
```

---

## 🧪 Tests

```bash
# Unit tests
npm test

# Tests DICOM loader
npm test -- dicom.test.ts

# Tests API
npm test -- api.test.ts

# Tests IA inference
npm test -- ai.test.ts
```

---

## ✅ Checklist MVP

- [ ] Setup projet TypeScript + Express
- [ ] DICOM loader et metadata extraction
- [ ] API routes de base
- [ ] Types DICOM et clinical
- [ ] Workflow analyse
- [ ] Logging structuré
- [ ] Tests unitaires
- [ ] Documentation API
- [ ] Modèle IA placeholder
- [ ] Export HL7/PDF basique

---

## 🔒 Sécurité & Conformité

- ✅ Stockage DICOM local (pas de cloud sans consent)
- ✅ Audit trail de toutes les actions
- ✅ RBAC (roles radiologiste/admin/viewer)
- ✅ Authentification JWT + API Key
- ✅ Logging anonymisé de patient IDs
- ✅ Encryption données sensibles en transit
- ✅ Pas de données PHI en logs publics

---

## 🎯 Prochaines Phases (Post-MVP)

- DICOMweb server
- Intégration EHR (HL7, FHIR)
- Modèles IA complexes (segmentation 3D)
- UI web radiologiste
- Mobile viewer
- Cloud-hybrid (avec consent)
- Multi-site / Multi-hospital

---

## 📞 Support

Pour questions:
- Spec DICOM: https://dicom.nema.org
- nnU-Net: https://github.com/MIC-DKFZ/nnUNet
- MONAI: https://monai.io
- HL7: https://www.hl7.org

---

**Version:** 1.0 MVP  
**Last Updated:** 2024  
**Status:** Ready to implement
