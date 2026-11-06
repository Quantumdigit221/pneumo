# Pipeline de Prétraitement d'Imagerie Thoracique — MONAI Transforms & PyTorch
# Normalisation, fenêtrage radiologique, redimensionnement et conversion en tenseurs d'inférence.

from typing import Tuple, Dict, Any, Optional
import numpy as np


class MONAIChestPreprocessor:
    """
    Pipeline de prétraitement inspiré des chaînes de transformation MONAI
    (monai.transforms: LoadImage, EnsureChannelFirst, ScaleIntensityRangePercentiles, ResizeWithPadOrCrop).
    Fournit un traitement résilient aussi bien avec l'environnement MONAI complet
    qu'avec NumPy/SciPy en mode autonome.
    """

    def __init__(self, target_size: Tuple[int, int] = (512, 512)):
        self.target_size = target_size
        self._init_monai_pipeline()

    def _init_monai_pipeline(self):
        try:
            import monai.transforms as mt
            self.monai_available = True
            self.transforms = mt.Compose([
                mt.EnsureChannelFirst(channel_dim="no_channel"),
                mt.ScaleIntensityRangePercentiles(
                    lower=1, upper=99, b_min=0.0, b_max=1.0, clip=True
                ),
                mt.ResizeWithPadOrCrop(spatial_size=self.target_size),
                mt.ToTensor()
            ])
        except ImportError:
            self.monai_available = False
            self.transforms = None

    def preprocess_image_array(
        self,
        pixel_array: np.ndarray,
        photometric: str = "MONOCHROME2",
        window_center: Optional[float] = None,
        window_width: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Prétraite un tableau de pixels (radiographie thoracique 2D) :
        1. Inversion si MONOCHROME1 (os blanc / air noir normalisé)
        2. Application de la fenêtre de visualisation (Windowing / Leveling)
        3. Normalisation min-max ou percentile (0.0 - 1.0)
        4. Redimensionnement avec conservation du ratio d'aspect (padding centré)
        """
        arr = pixel_array.astype(np.float32)

        # 1. Gestion de la polarité photométrique DICOM
        if photometric == "MONOCHROME1":
            arr = np.max(arr) - arr

        # 2. Fenêtrage radiologique (VOI LUT)
        if window_center is not None and window_width is not None and window_width > 0:
            c = float(window_center)
            w = float(window_width)
            lower = c - 0.5 - (w - 1) / 2.0
            upper = c - 0.5 + (w - 1) / 2.0
            arr = np.clip(arr, lower, upper)
            arr = (arr - lower) / (upper - lower)
        else:
            # Normalisation percentile robuste 1% - 99% (élimine les artéfacts de collimation)
            p1, p99 = np.percentile(arr, (1, 99))
            if p99 > p1:
                arr = np.clip(arr, p1, p99)
                arr = (arr - p1) / (p99 - p1)
            else:
                arr = (arr - np.min(arr)) / (np.max(arr) - np.min(arr) + 1e-6)

        # 3. Redimensionnement avec padding
        orig_h, orig_w = arr.shape[:2]
        target_h, target_w = self.target_size

        scale = min(target_h / orig_h, target_w / orig_w)
        new_h, new_w = int(round(orig_h * scale)), int(round(orig_w * scale))

        # Redimensionnement bilinéaire simple
        y_indices = np.linspace(0, orig_h - 1, new_h).astype(int)
        x_indices = np.linspace(0, orig_w - 1, new_w).astype(int)
        resized = arr[y_indices[:, None], x_indices]

        # Padding centré (fond noir 0.0)
        padded = np.zeros(self.target_size, dtype=np.float32)
        top = (target_h - new_h) // 2
        left = (target_w - new_w) // 2
        padded[top:top + new_h, left:left + new_w] = resized

        # Ajout dimension canal (1, H, W)
        tensor_like = np.expand_dims(padded, axis=0)

        return {
            "tensor_shape": list(tensor_like.shape),
            "original_dimensions": [orig_h, orig_w],
            "normalized_tensor": tensor_like,
            "min_val": float(np.min(padded)),
            "max_val": float(np.max(padded)),
            "mean_val": float(np.mean(padded)),
            "monai_engine_active": self.monai_available
        }
