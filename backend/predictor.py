"""
Core prediction logic for the DIA risk predictor.
Loads the exported XGBoost model + metadata once, then turns a SMILES string into:
  - descriptors (with training-set percentiles)
  - probability + verdict
  - SHAP explanation (per-descriptor contributions)
  - nearest training neighbours (structural similarity)
  - applicability-domain check (is this molecule like the training data?)
  - a 2D drawing of the molecule
"""
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import xgboost as xgb
from rdkit import Chem, DataStructs, RDLogger
from rdkit.Chem import AllChem, Descriptors, rdFingerprintGenerator, rdMolDescriptors
from rdkit.Chem.Draw import rdMolDraw2D
from xgboost import XGBClassifier

RDLogger.DisableLog("rdApp.*")  # silence RDKit parse warnings in the console
MODEL_DIR = Path(__file__).parent / "model"

N_NEIGHBOURS = 5      # how many similar training drugs to return
SIM_OK = 0.30         # Tanimoto similarity regarded as "structurally related"


def _clean(value):
    """Convert NaN/inf to None so the result is valid JSON."""
    if value is None:
        return None
    value = float(value)
    return None if (math.isnan(value) or math.isinf(value)) else value


class DIAPredictor:
    def __init__(self):
        # ---- Model (XGBoost native JSON: portable across versions/OS) ----
        self.model = XGBClassifier()
        self.model.load_model(str(MODEL_DIR / "dia_xgb.json"))

        # ---- Metadata exported from the notebook ----
        with open(MODEL_DIR / "dia_meta.json") as f:
            meta = json.load(f)
        self.features = meta["features"]                 # order matters
        self.threshold = round(meta["threshold"], 2)     # 0.48
        self.train_X = pd.DataFrame(meta["train_X"], columns=self.features)
        self.train_smiles = meta["train_smiles"]
        self.train_labels = meta["train_labels"]
        self.examples = meta["examples"]
        self.versions = meta["versions"]

        # ---- Descriptor calculators ----
        self._calc = dict(Descriptors.descList)
        missing = [f for f in self.features if f not in self._calc]
        if missing:
            raise RuntimeError(f"RDKit is missing descriptors: {missing}")

        # ---- Fingerprints of training drugs (nearest neighbours) ----
        self._fpgen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=2048)
        self._train_fps, self._train_idx, self._train_canon = [], [], set()
        for i, smi in enumerate(self.train_smiles):
            m = Chem.MolFromSmiles(smi)
            if m is not None:
                self._train_fps.append(self._fpgen.GetFingerprint(m))
                self._train_idx.append(i)
                self._train_canon.add(Chem.MolToSmiles(m))

        # ---- Descriptor-space applicability domain ----
        # Standardise training descriptors, compute each drug's mean distance to its
        # 5 nearest training neighbours, and use the 95th percentile as the cut-off.
        self._mu = self.train_X.mean()
        self._sd = self.train_X.std().replace(0, 1.0)
        self._median = self.train_X.median()
        self._lo, self._hi = self.train_X.min(), self.train_X.max()
        self._Z = ((self.train_X - self._mu) / self._sd).values
        d = np.sqrt(((self._Z[:, None, :] - self._Z[None, :, :]) ** 2).sum(-1))
        np.fill_diagonal(d, np.inf)
        knn = np.sort(d, axis=1)[:, :N_NEIGHBOURS].mean(axis=1)
        self._dist_cutoff = float(np.percentile(knn, 95))

    # =================== helpers ===================
    def parse(self, smiles: str):
        smiles = (smiles or "").strip()
        if not smiles:
            raise ValueError("Please enter a SMILES string.")
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            raise ValueError("Could not read this SMILES string. Check it for typos.")
        return mol

    def descriptors(self, mol) -> dict:
        out = {}
        for f in self.features:
            try:
                out[f] = float(self._calc[f](mol))
            except Exception:
                out[f] = np.nan  # XGBoost handles missing values natively
        return out

    def percentile(self, name: str, value: float):
        """Where this value sits in the training distribution (0-100)."""
        if value is None or np.isnan(value):
            return None
        col = self.train_X[name].values
        return float((col < value).mean() * 100 + (col == value).mean() * 50)

    @staticmethod
    def draw_svg(mol, width: int = 460, height: int = 340) -> str:
        drawer = rdMolDraw2D.MolDraw2DSVG(width, height)
        drawer.drawOptions().clearBackground = False  # transparent background
        rdMolDraw2D.PrepareAndDrawMolecule(drawer, mol)
        drawer.FinishDrawing()
        return drawer.GetDrawingText()

    @staticmethod
    def molblock_3d(mol):
        """
        3D coordinates for the viewer: add hydrogens, embed with ETKDG,
        then tidy the geometry with the MMFF force field.
        Returns a MOL block, or None if RDKit cannot build a 3D model.
        """
        try:
            mh = Chem.AddHs(mol)
            params = AllChem.ETKDGv3()
            params.randomSeed = 42
            if AllChem.EmbedMolecule(mh, params) != 0:
                params.useRandomCoords = True
                if AllChem.EmbedMolecule(mh, params) != 0:
                    return None
            try:
                AllChem.MMFFOptimizeMolecule(mh, maxIters=500)
            except Exception:
                pass  # keep the unoptimised (still valid) 3D geometry
            return Chem.MolToMolBlock(mh)
        except Exception:
            return None

    # =================== explanation (SHAP) ===================
    def explain(self, x: pd.DataFrame, desc: dict) -> dict:
        """
        Exact TreeSHAP values computed natively by XGBoost (pred_contribs=True).
        Contributions are in log-odds: positive pushes risk up, negative pushes it down.
        base_value + sum(contributions) = model output (log-odds) for this molecule.
        """
        contribs = self.model.get_booster().predict(xgb.DMatrix(x), pred_contribs=True)[0]
        base = float(contribs[-1])
        items = [
            {
                "name": f,
                "value": _clean(desc[f]),
                "contribution": round(float(c), 4),
                "direction": "increases risk" if c > 0 else "decreases risk",
            }
            for f, c in zip(self.features, contribs[:-1])
        ]
        items.sort(key=lambda d: abs(d["contribution"]), reverse=True)
        return {
            "units": "log-odds",
            "base_value": round(base, 4),
            "base_probability": round(1 / (1 + math.exp(-base)), 4),
            "output_value": round(base + float(contribs[:-1].sum()), 4),
            "contributions": items,
        }

    # =================== nearest neighbours ===================
    def neighbours(self, mol):
        fp = self._fpgen.GetFingerprint(mol)
        sims = np.array(DataStructs.BulkTanimotoSimilarity(fp, self._train_fps))
        top = np.argsort(-sims)[:N_NEIGHBOURS]
        out = []
        for j in top:
            i = self._train_idx[j]
            label = int(self.train_labels[i])
            out.append({
                "smiles": self.train_smiles[i],
                "label": label,
                "label_text": "DIA-positive" if label == 1 else "DIA-negative",
                "similarity": round(float(sims[j]), 3),
                "svg": self.draw_svg(Chem.MolFromSmiles(self.train_smiles[i]), 240, 180),
            })
        return out, float(sims.max())

    # =================== applicability domain ===================
    def domain(self, desc: dict, max_sim: float) -> dict:
        v = pd.Series(desc).reindex(self.features).fillna(self._median)
        z = ((v - self._mu) / self._sd).values
        dist = np.sqrt(((self._Z - z) ** 2).sum(axis=1))
        knn = float(np.sort(dist)[:N_NEIGHBOURS].mean())
        out_of_range = [f for f in self.features if not (self._lo[f] <= v[f] <= self._hi[f])]

        desc_ok = knn <= self._dist_cutoff
        struct_ok = max_sim >= SIM_OK
        if desc_ok and struct_ok:
            status = "in_domain"
            message = "Similar to the drugs the model was trained on, so this prediction is more trustworthy."
        elif desc_ok or struct_ok:
            status = "borderline"
            message = "Only partly similar to the training drugs. Treat this prediction with some caution."
        else:
            status = "out_of_domain"
            message = "Unlike the drugs the model was trained on. This prediction may be unreliable."

        return {
            "status": status,
            "message": message,
            "max_similarity": round(max_sim, 3),
            "similarity_cutoff": SIM_OK,
            "descriptor_distance": round(knn, 3),
            "distance_cutoff": round(self._dist_cutoff, 3),
            "out_of_range": out_of_range,
        }

    # =================== main entry point ===================
    def predict(self, smiles: str) -> dict:
        mol = self.parse(smiles)
        desc = self.descriptors(mol)

        x = pd.DataFrame([desc], columns=self.features)
        prob = float(self.model.predict_proba(x)[0, 1])
        positive = prob >= self.threshold

        neighbours, max_sim = self.neighbours(mol)
        canonical = Chem.MolToSmiles(mol)

        return {
            "smiles": smiles.strip(),
            "canonical_smiles": canonical,
            "in_training_set": canonical in self._train_canon,
            "probability": round(prob, 4),
            "threshold": self.threshold,
            "is_positive": bool(positive),
            "prediction": "DIA-positive" if positive else "DIA-negative",
            "properties": {
                "formula": rdMolDescriptors.CalcMolFormula(mol),
                "mol_weight": round(Descriptors.MolWt(mol), 2),
                "heavy_atoms": mol.GetNumHeavyAtoms(),
                "rings": rdMolDescriptors.CalcNumRings(mol),
            },
            "descriptors": [
                {
                    "name": f,
                    "value": _clean(round(v, 4)) if not np.isnan(v) else None,
                    "percentile": _clean(self.percentile(f, v)),
                }
                for f, v in desc.items()
            ],
            "explanation": self.explain(x, desc),
            "neighbours": neighbours,
            "domain": self.domain(desc, max_sim),
            "svg": self.draw_svg(mol),
            "mol3d": self.molblock_3d(mol),
        }
