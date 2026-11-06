# Tests Unitaires et Fonctionnels — Microservice d'IA Imagerie Médicale
# Vérifie le registre, les licences, le validateur DICOM et le workflow de validation médicale

import io
import unittest
import numpy as np

from app.registry.model_registry import (
    AI_MODEL_REGISTRY,
    get_model_by_id,
    get_available_models,
    Modality,
    ModelLicense,
    ModelValidationStatus
)
from app.dicom.validator import validate_dicom_stream
from app.dicom.preprocessor import MONAIChestPreprocessor
from app.models.adapters import ModelInferenceAdapter
from app.workflow.report_validation import MedicalRadiologyReport, ReportWorkflowStatus


class TestAIImagingService(unittest.TestCase):

    def test_model_registry_integrity(self):
        """Vérifie que tous les modèles déclarés possèdent des métadonnées et licences valides."""
        models = get_available_models()
        self.assertGreaterEqual(len(models), 4)

        # Vérification Ark+
        ark = get_model_by_id("ark-plus-cxr")
        self.assertIsNotNone(ark)
        self.assertEqual(ark.license, ModelLicense.APACHE_2_0)
        self.assertTrue(ark.commercial_allowed)
        self.assertEqual(ark.status, ModelValidationStatus.ACTIVE_VERIFIED)

        # Vérification LLaVA-Rad (Licence de recherche ouverte)
        llava = get_model_by_id("llava-rad-7b")
        self.assertIsNotNone(llava)
        self.assertFalse(llava.commercial_allowed)
        self.assertEqual(llava.status, ModelValidationStatus.PENDING_GPU_DEPLOY)

        # Vérification MAIRA-2 (Licence Microsoft Research)
        maira = get_model_by_id("maira-2-cxr")
        self.assertIsNotNone(maira)
        self.assertEqual(maira.license, ModelLicense.MS_RESEARCH)
        self.assertFalse(maira.commercial_allowed)

    def test_untested_model_refusal(self):
        """Vérifie qu'un modèle non testé ou nécessitant un GPU externe non configuré n'est pas activé frauduleusement."""
        adapter = ModelInferenceAdapter()
        # LLaVA-Rad 7B requiert un GPU externe non configuré par défaut
        readiness = adapter.check_model_readiness("llava-rad-7b")
        self.assertFalse(readiness["ready"])
        self.assertIn("GPU externe", readiness["reason"])

    def test_dicom_validation_magic_bytes(self):
        """Vérifie la détection conforme de la signature binaire NEMA PS3.10 (DICM à l'offset 128)."""
        # Flux binaire invalide (sans signature)
        invalid_stream = io.BytesIO(b"RANDOM_NON_DICOM_DATA_HEADER" * 10)
        result_invalid = validate_dicom_stream(invalid_stream)
        self.assertFalse(result_invalid.is_valid)

        # Flux binaire DICOM synthétique valide (128 octets de préambule + 'DICM')
        valid_stream = io.BytesIO(b"\x00" * 128 + b"DICM" + b"\x00" * 200)
        result_valid = validate_dicom_stream(valid_stream)
        self.assertTrue(result_valid.is_valid)
        self.assertEqual(result_valid.body_part, "CHEST")

    def test_monai_preprocessor_resizing(self):
        """Vérifie le redimensionnement et la normalisation en (1, 512, 512)."""
        preprocessor = MONAIChestPreprocessor(target_size=(512, 512))
        dummy_xray = np.random.randint(50, 200, (800, 600), dtype=np.uint8)

        res = preprocessor.preprocess_image_array(dummy_xray)
        self.assertEqual(res["tensor_shape"], [1, 512, 512])
        self.assertGreaterEqual(res["max_val"], 0.0)
        self.assertLessEqual(res["max_val"], 1.0)

    def test_clinical_report_workflow_rbac(self):
        """Vérifie que la validation médicale refuse les rôles non habilités (403) et requiert un praticien."""
        report = MedicalRadiologyReport(
            id="rpt-001",
            examination_id="exam-xray-01",
            patient_id="p1",
            patient_name="Mamadou Diop",
            patient_hospital_number="CHREIN-PNEUMO-2026-014",
            model_used="Ark+ Chest X-Ray Foundation",
            clinical_indication="Suspicion pneumopathie",
            technique="Face debout",
            findings="Foyer alvéolaire base droite",
            conclusion="Pneumopathie basale droite",
            ai_confidence_score=0.91
        )
        self.assertEqual(report.status, ReportWorkflowStatus.AI_DRAFT)
        self.assertFalse(report.is_signed)

        # 1. Tentative de validation par une secrétaire -> PermissionError (403)
        with self.assertRaises(PermissionError):
            report.validate_and_sign(
                doctor_id="sec-1",
                doctor_name="Awa Diallo",
                doctor_role="SECRETARY"
            )

        # 2. Validation par un médecin clinicien -> Succès
        report.validate_and_sign(
            doctor_id="doc-1",
            doctor_name="Dr. Cheikh Ndao",
            doctor_role="CLINICIAN",
            clinical_notes="Foyer franc confirmé à l'auscultation."
        )
        self.assertEqual(report.status, ReportWorkflowStatus.VALIDATED_BY_DOCTOR)
        self.assertTrue(report.is_signed)
        self.assertEqual(len(report.audit_trail), 1)

    def test_rejection_requires_reason(self):
        """Vérifie qu'un compte rendu IA ne peut pas être rejeté sans motif explicite."""
        report = MedicalRadiologyReport(
            id="rpt-002",
            examination_id="exam-xray-02",
            patient_id="p2",
            patient_name="Ibrahima Cissé",
            patient_hospital_number="CHREIN-PNEUMO-2026-008",
            model_used="Ark+ Chest X-Ray Foundation",
            clinical_indication="Bilan BPCO",
            technique="Face debout",
            findings="Opacité apicale",
            conclusion="Suspicion atélectasie",
            ai_confidence_score=0.85
        )

        # Rejet sans motif -> ValueError
        with self.assertRaises(ValueError):
            report.reject(
                doctor_id="doc-1",
                doctor_name="Dr. Cheikh Ndao",
                doctor_role="CLINICIAN",
                reason=""
            )

        # Rejet avec motif explicite -> Succès
        report.reject(
            doctor_id="doc-1",
            doctor_name="Dr. Cheikh Ndao",
            doctor_role="CLINICIAN",
            reason="Fausse opacité liée à un artéfact de superposition scapulaire."
        )
        self.assertEqual(report.status, ReportWorkflowStatus.REJECTED_BY_DOCTOR)
        self.assertEqual(report.rejection_reason, "Fausse opacité liée à un artéfact de superposition scapulaire.")


if __name__ == "__main__":
    unittest.main()
