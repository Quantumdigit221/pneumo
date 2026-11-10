# ============================================================================
# Unit Tests for TorchXRayVision Integration Module
# Repository: https://github.com/mlmed/torchxrayvision.git
# ============================================================================

import unittest
from app.models.torchxrayvision_engine import (
    TorchXRayVisionEngine,
    TXRV_PATHOLOGIES,
    TXRV_THRESHOLDS
)

class TestTorchXRayVisionIntegration(unittest.TestCase):

    def setUp(self):
        self.engine = TorchXRayVisionEngine(weights="densenet121-res224-all")
        # Matrice test 16x16
        self.dummy_xray = [[128 for _ in range(16)] for _ in range(16)]

    def test_pathologies_count(self):
        """Vérifie la présence exacte des 18 pathologies TorchXRayVision."""
        self.assertEqual(len(TXRV_PATHOLOGIES), 18)
        self.assertIn("Atelectasis", TXRV_PATHOLOGIES)
        self.assertIn("Consolidation", TXRV_PATHOLOGIES)
        self.assertIn("Pneumothorax", TXRV_PATHOLOGIES)
        self.assertIn("Lung Lesion", TXRV_PATHOLOGIES)

    def test_tb_detection_sensitivity(self):
        """Vérifie que la suspicion de tuberculose déclenche l'alerte critique sur les cavernes."""
        res = self.engine.predict(self.dummy_xray, clinical_context="Suspicion tuberculose avec caverne apicale")
        lung_lesion = next(p for p in res["predictions"] if p["pathology"] == "Lung Lesion")
        self.assertTrue(lung_lesion["is_detected"])
        self.assertEqual(lung_lesion["severity"], "CRITIQUE")

    def test_pneumothorax_urgency(self):
        """Vérifie que la dyspnée aiguë avec pneumothorax déclenche une alerte vitale critique."""
        res = self.engine.predict(self.dummy_xray, clinical_context="Douleur aiguë en coup de poignard et pneumothorax")
        ptx = next(p for p in res["predictions"] if p["pathology"] == "Pneumothorax")
        self.assertTrue(ptx["is_detected"])
        self.assertEqual(ptx["severity"], "CRITIQUE")

    def test_github_source_metadata(self):
        """Vérifie le lien vers le dépôt GitHub officiel mlmed/torchxrayvision."""
        self.assertEqual(self.engine.github_url, "https://github.com/mlmed/torchxrayvision.git")

if __name__ == '__main__':
    unittest.main()
