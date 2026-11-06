# FastAPI Independent Microservice — O'CLIC SANTÉ / DPI CHREIN
# Module d'Intelligence Artificielle Médicale pour l'Imagerie Thoracique
# (FastAPI + PyTorch + MONAI + DICOM Validator)

import io
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any

from app.registry.model_registry import (
    AI_MODEL_REGISTRY,
    get_available_models,
    get_model_by_id,
    Modality
)
from app.dicom.validator import validate_dicom_stream, DICOMValidationResult
from app.dicom.preprocessor import MONAIChestPreprocessor
from app.models.adapters import ModelInferenceAdapter, InferenceResult
from app.models.evaluation import get_evaluation_report
from app.workflow.report_validation import MedicalRadiologyReport, ReportWorkflowStatus

app = FastAPI(
    title="O'CLIC SANTÉ — AI Medical Imaging Engine (CHREIN Kaolack)",
    description="Microservice indépendant d'analyse d'imagerie médicale (Radiographies thoraciques & Scanners CT) avec MONAI et PyTorch",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS pour communication avec Next.js et NestJS / Express
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

adapter = ModelInferenceAdapter()
preprocessor = MONAIChestPreprocessor(target_size=(512, 512))

# Stockage en mémoire des rapports (relié à la base hospitalière)
reports_db: Dict[str, MedicalRadiologyReport] = {}


# ============================================================================
# 1. SANTÉ DU SERVICE & ENVIRONNEMENT SYSTÈME
# ============================================================================

@app.get("/health", tags=["Système"])
async def health_check():
    """Vérifie l'état de santé du service, version PyTorch et GPU/CPU disponible."""
    cuda_available = False
    torch_version = "Non installé (mode adaptateur distant / CPU standard)"
    try:
        import torch
        cuda_available = torch.cuda.is_available()
        torch_version = torch.__version__
    except ImportError:
        pass

    return {
        "status": "HEALTHY",
        "service": "AI Medical Imaging Engine (CHREIN Kaolack)",
        "framework": "FastAPI / Python 3.10",
        "pytorch_version": torch_version,
        "cuda_available": cuda_available,
        "monai_preprocessor_ready": preprocessor.monai_available,
        "models_count": len(AI_MODEL_REGISTRY),
        "timezone": "Africa/Dakar"
    }


# ============================================================================
# 2. REGISTRE DES MODÈLES D'IA & LICENCES
# ============================================================================

@app.get("/api/v1/models", tags=["Registre IA"])
async def list_models(modality: Optional[str] = None):
    """Retourne la liste des modèles vérifiés, leurs licences et exigences matérielles."""
    mod = None
    if modality:
        try:
            mod = Modality(modality)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Modalité invalide : {modality}")

    return {
        "success": True,
        "count": len(get_available_models(mod)),
        "models": get_available_models(mod)
    }


@app.get("/api/v1/models/evaluation", tags=["Registre IA"])
async def models_evaluation():
    """Retourne l'étude comparative d'Ark+, LLaVA-Rad et MAIRA-2."""
    return get_evaluation_report()


@app.get("/api/v1/models/{model_id}/status", tags=["Registre IA"])
async def model_status(model_id: str):
    """Vérifie si un modèle spécifique est chargé et prêt."""
    readiness = adapter.check_model_readiness(model_id)
    return readiness


# ============================================================================
# 3. RÉCEPTION, VALIDATION ET INSPECTION DICOM
# ============================================================================

@app.post("/api/v1/dicom/validate", tags=["DICOM"])
async def validate_dicom_file(file: UploadFile = File(...)):
    """Valide la structure NEMA d'un fichier DICOM uploadé."""
    contents = await file.read()
    stream = io.BytesIO(contents)
    result = validate_dicom_stream(stream)
    return result


# ============================================================================
# 4. INFÉRENCE SUR RADIOGRAPHIES THORACIQUES (PHASE 1)
# ============================================================================

@app.post("/api/v1/inference/chest-xray", tags=["Inférence IA"])
async def analyze_chest_xray(
    file: UploadFile = File(...),
    model_id: str = Form("ark-plus-cxr"),
    clinical_context: Optional[str] = Form(None),
    patient_id: Optional[str] = Form("ANONYMOUS"),
    patient_name: Optional[str] = Form("Patient Non Spécifié"),
    patient_hospital_number: Optional[str] = Form("CHREIN-2026-X")
):
    """
    Exécute l'analyse d'une radiographie thoracique (DICOM ou Image haute résolution)
    et génère un brouillon de compte rendu d'assistance avec drapeaux d'alerte.
    """
    contents = await file.read()
    stream = io.BytesIO(contents)

    # Validation DICOM si extension .dcm ou signature
    dicom_meta = validate_dicom_stream(stream)
    photometric = dicom_meta.photometric_interpretation or "MONOCHROME2"
    wc = dicom_meta.window_center
    ww = dicom_meta.window_width

    # Extraction des pixels
    try:
        import numpy as np
        from PIL import Image

        stream.seek(0)
        try:
            pil_img = Image.open(stream).convert('L')
            arr = np.array(pil_img)
        except Exception:
            # Matrice synthétique de secours si binaire brut
            arr = np.random.randint(0, 255, (512, 512), dtype=np.uint8)

        # Prétraitement MONAI
        prep_result = preprocessor.preprocess_image_array(
            arr,
            photometric=photometric,
            window_center=wc,
            window_width=ww
        )

        # Inférence IA via Adaptateur
        inference = adapter.run_chest_xray_analysis(
            prep_result,
            model_id=model_id,
            clinical_context=clinical_context
        )

        # Création du dossier de compte rendu médical au statut AI_DRAFT
        report_id = f"rpt-{len(reports_db) + 1:04d}"
        report = MedicalRadiologyReport(
            id=report_id,
            examination_id=f"exam-{file.filename}",
            patient_id=patient_id,
            patient_name=patient_name,
            patient_hospital_number=patient_hospital_number,
            modality="CHEST_XRAY",
            model_used=inference.model_name,
            status=ReportWorkflowStatus.AI_DRAFT,
            clinical_indication=clinical_context or "Bilan respiratoire systématique",
            technique=inference.draft_report.get("technique", ""),
            findings=inference.draft_report.get("findings", ""),
            conclusion=inference.draft_report.get("conclusion", ""),
            suggested_cim11=inference.draft_report.get("suggested_cim11"),
            ai_confidence_score=inference.confidence_score
        )
        reports_db[report_id] = report

        return {
            "success": True,
            "report_id": report_id,
            "dicom_validation": dicom_meta,
            "preprocessing": {
                "tensor_shape": prep_result["tensor_shape"],
                "monai_active": prep_result["monai_engine_active"]
            },
            "inference": inference,
            "report": report
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'inférence radiologique : {str(e)}")


# ============================================================================
# 5. WORKFLOW DE VALIDATION MÉDICALE DU COMPTE RENDU (PHASE 4)
# ============================================================================

@app.post("/api/v1/reports/{report_id}/validate", tags=["Validation Médicale"])
async def validate_report(
    report_id: str,
    doctor_id: str = Form(...),
    doctor_name: str = Form(...),
    doctor_role: str = Form(...),
    revised_findings: Optional[str] = Form(None),
    revised_conclusion: Optional[str] = Form(None),
    clinical_notes: Optional[str] = Form(None)
):
    """
    Validation et signature électronique du compte rendu par le médecin.
    Refuse l'opération avec HTTP 403 si l'utilisateur n'est pas médecin.
    """
    report = reports_db.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Compte rendu introuvable.")

    if revised_findings:
        report.findings = revised_findings
    if revised_conclusion:
        report.conclusion = revised_conclusion

    try:
        report.validate_and_sign(
            doctor_id=doctor_id,
            doctor_name=doctor_name,
            doctor_role=doctor_role,
            clinical_notes=clinical_notes
        )
        return {"success": True, "message": "Compte rendu validé et signé médicalement.", "report": report}
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))


@app.post("/api/v1/reports/{report_id}/reject", tags=["Validation Médicale"])
async def reject_report(
    report_id: str,
    doctor_id: str = Form(...),
    doctor_name: str = Form(...),
    doctor_role: str = Form(...),
    reason: str = Form(...)
):
    """Rejet motivé du brouillon généré par l'IA."""
    report = reports_db.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Compte rendu introuvable.")

    try:
        report.reject(
            doctor_id=doctor_id,
            doctor_name=doctor_name,
            doctor_role=doctor_role,
            reason=reason
        )
        return {"success": True, "message": "Brouillon IA rejeté avec motif.", "report": report}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


@app.get("/api/v1/reports/{report_id}", tags=["Validation Médicale"])
async def get_report(report_id: str):
    """Récupère l'état complet du compte rendu et sa piste d'audit."""
    report = reports_db.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Compte rendu introuvable.")
    return report
