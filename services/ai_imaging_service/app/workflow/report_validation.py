# Workflow de Compte Rendu et Validation Médicale (Phase 4 & 5)
# Règle d'or : Aucun compte rendu généré par l'IA ne peut être publié ou exporté
# comme un diagnostic officiel sans validation et signature par un praticien habilité.

from enum import Enum
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ReportWorkflowStatus(str, Enum):
    AI_DRAFT = "AI_DRAFT"                          # Étape 1 & 2 : Brouillon généré par le modèle IA
    UNDER_REVIEW = "UNDER_REVIEW"                  # Étape 3 : Examen par le médecin radiologue
    VALIDATED_BY_DOCTOR = "VALIDATED_BY_DOCTOR"    # Étape 4 : Corrigé, validé et signé par le médecin
    REJECTED_BY_DOCTOR = "REJECTED_BY_DOCTOR"      # Étape 4 : Rejeté par le médecin (motif obligatoire)
    AMENDED = "AMENDED"                            # Étape 5 : Révisé ultérieurement avec traçabilité


class AuditTrailEntry(BaseModel):
    timestamp: str
    action: str
    user_id: str
    user_name: str
    user_role: str
    comments: Optional[str] = None
    snapshot_version: int = 1


class MedicalRadiologyReport(BaseModel):
    id: str
    examination_id: str
    patient_id: str
    patient_name: str
    patient_hospital_number: str
    modality: str = "CHEST_XRAY"
    model_used: str
    status: ReportWorkflowStatus = ReportWorkflowStatus.AI_DRAFT
    version: int = 1

    # Contenu clinique
    clinical_indication: str
    technique: str
    findings: str
    conclusion: str
    suggested_cim11: Optional[str] = None
    ai_confidence_score: float

    # Médecin signataire
    is_signed: bool = False
    signed_by_doctor_id: Optional[str] = None
    signed_by_doctor_name: Optional[str] = None
    signed_at: Optional[str] = None
    rejection_reason: Optional[str] = None

    # Piste d'audit immuable
    audit_trail: List[AuditTrailEntry] = Field(default_factory=list)

    def validate_and_sign(self, doctor_id: str, doctor_name: str, doctor_role: str, clinical_notes: Optional[str] = None):
        """Valide et signe le compte rendu par un médecin clinicien habilité."""
        if doctor_role not in ["CLINICIAN", "DOCTOR", "STRUCTURE_ADMIN", "SUPER_ADMIN"]:
            raise PermissionError("Erreur 403 : Seul un médecin diplômé ou administrateur médical peut valider un compte rendu d'imagerie.")

        now = datetime.utcnow().isoformat() + "Z"
        self.status = ReportWorkflowStatus.VALIDATED_BY_DOCTOR
        self.is_signed = True
        self.signed_by_doctor_id = doctor_id
        self.signed_by_doctor_name = doctor_name
        self.signed_at = now

        self.audit_trail.append(AuditTrailEntry(
            timestamp=now,
            action="VALIDATION_AND_SIGNATURE",
            user_id=doctor_id,
            user_name=doctor_name,
            user_role=doctor_role,
            comments=clinical_notes or "Validation médicale conforme et signature électronique enregistrée.",
            snapshot_version=self.version
        ))

    def reject(self, doctor_id: str, doctor_name: str, doctor_role: str, reason: str):
        """Rejette le compte rendu IA avec motif explicite obligatoire."""
        if not reason or not reason.strip():
            raise ValueError("Le motif de rejet d'une analyse IA est obligatoire pour la traçabilité réglementaire.")

        now = datetime.utcnow().isoformat() + "Z"
        self.status = ReportWorkflowStatus.REJECTED_BY_DOCTOR
        self.is_signed = False
        self.rejection_reason = reason

        self.audit_trail.append(AuditTrailEntry(
            timestamp=now,
            action="REJECTION_BY_CLINICIAN",
            user_id=doctor_id,
            user_name=doctor_name,
            user_role=doctor_role,
            comments=f"Rejet de l'analyse IA. Motif : {reason}",
            snapshot_version=self.version
        ))
