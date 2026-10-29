# DIA Screen

**Screening drug candidates for drug-induced autoimmunity (DIA) risk from molecular structure.**

DIA Screen takes a molecule as a SMILES string, computes its RDKit molecular descriptors, and scores its risk of causing drug-induced autoimmunity with a tuned XGBoost model. Every prediction comes with an explanation (SHAP), the most similar known drugs, and a reliability check, so users can see *why* the model decided what it did and how far to trust it.

Built as the case-study project for **TE7483 Applications and Use Cases of Machine Learning**, Symbiosis Institute of Technology, Pune.

---

## The problem

Drug-induced autoimmunity is a rare side effect in which a drug triggers the immune system to attack the body's own tissue (drug-induced lupus is the best-known form). It often surfaces only after a drug reaches patients, when it is expensive and harmful to discover. A model that flags risky structures early can help medicinal chemists and safety-screening teams prioritise candidates for closer testing.

## Dataset

Drug-induced autoimmunity dataset from the **UCI Machine Learning Repository**.

| | Drugs | DIA-positive | DIA-negative |
|---|---|---|---|
| Training set | 477 | 118 | 359 |
| Test set (held out) | 120 | 30 | 90 |

Each drug has a SMILES string, a binary label and **196 RDKit molecular descriptors**. There are no missing values, no duplicate structures and no structures shared between train and test. An adversarial-validation check (a classifier trying to tell train from test, ROC-AUC 0.55) confirmed both sets come from the same distribution.

## Method

1. **Feature cleaning:** removed 17 constant descriptors (196 → 179).
2. **Feature selection:** ranked descriptors by Random Forest importance and kept the **top 20**, chosen by a cross-validated sweep over 10–50 features (selection was repeated inside each fold to avoid leakage).
3. **Models compared:** majority-class baseline, Logistic Regression, Random Forest and XGBoost, each with class weighting for the 3:1 imbalance.
4. **Tuning:** randomized / grid search with 5-fold × 3-repeat stratified CV, optimising F1. Final evaluation used a separate 5-fold × 5-repeat CV with a different seed.
5. **Threshold selection:** the decision threshold was chosen to maximise F1 on out-of-fold training predictions (**0.48** for XGBoost). The test set was used only once, for the final results.

## Results (held-out test set)

| Model | Threshold | Accuracy | Precision | Recall | F1 | ROC-AUC | PR-AUC | MCC |
|---|---|---|---|---|---|---|---|---|
| Logistic Regression | 0.55 | 0.633 | 0.354 | 0.567 | 0.436 | 0.696 | 0.424 | 0.196 |
| Random Forest | 0.41 | 0.808 | 0.630 | 0.567 | 0.597 | 0.873 | 0.689 | 0.472 |
| **XGBoost (final)** | **0.48** | **0.833** | **0.750** | 0.500 | **0.600** | **0.882** | **0.727** | **0.516** |

The final XGBoost model catches **15 of 30** DIA-positive test drugs with **5 false alarms out of 90** DIA-negative drugs.

## The app

**Landing page:** the problem, how a check works, test results and limitations. The hero shows all 597 drugs as wells on a screening plate.

**Predict page:** paste a SMILES string or pick an example to get:

- **Risk score and verdict** against the 0.48 threshold
- **Interactive 3D model** of the molecule (RDKit ETKDG + MMFF geometry, rendered with 3Dmol.js), plus a 2D structure view
- **SHAP explanation:** how much each of the 20 descriptors pushed the score up or down, using XGBoost's exact TreeSHAP
- **Five most similar training drugs** (Tanimoto similarity on Morgan fingerprints) with their known outcomes
- **Applicability-domain check:** whether the molecule resembles the training data, combining structural similarity with descriptor-space distance
- **Descriptor table** showing where the molecule sits among the training drugs

### Architecture

```
React (Vite + Tailwind)  →  FastAPI  →  RDKit descriptors  →  XGBoost  →  SHAP, neighbours, domain check
```

### Deployment check

The app recomputes descriptors from SMILES with a newer RDKit than the one used to build the dataset. Running all 477 training drugs through the app's pipeline gave **100% verdict agreement** with the original descriptors (mean probability difference 0.008), so the deployed model behaves the same as the one evaluated in the notebook.

The model is saved in **XGBoost's native JSON format** rather than pickle, so it loads reliably across XGBoost versions and operating systems.

---

## Project structure

```
dia-predictor/
├── backend/
│   ├── main.py              # FastAPI routes
│   ├── predictor.py         # descriptors, prediction, SHAP, neighbours, domain, 3D
│   ├── pick_examples.py     # utility: re-checks the test set through the app pipeline
│   ├── requirements.txt
│   └── model/
│       ├── dia_xgb.json     # trained XGBoost model
│       └── dia_meta.json    # features, threshold, training data for neighbours/domain
├── frontend/
│   └── src/
│       ├── pages/           # Landing, Predict
│       ├── components/      # plate, header, prediction cards, 3D viewer
│       └── data/            # descriptor descriptions, example drugs
└── notebook/
    └── AUCML.ipynb          # data analysis, training, tuning, evaluation
```

## Running it locally

**Requirements:** Python 3.13 and Node.js 20 or newer.

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`, with interactive docs at `http://127.0.0.1:8000/docs`.

### 2. Frontend (in a second terminal)

```powershell
cd frontend
npm install
npm run dev
```

Open the link Vite prints (usually `http://localhost:5173`). The dev server forwards `/api` requests to the backend.

### API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Status, feature count, threshold, library versions |
| GET | `/api/examples` | Example test-set drugs with known labels |
| POST | `/api/predict` | Body `{"smiles": "..."}`. Returns score, verdict, descriptors, SHAP, neighbours, domain check, 2D and 3D structures |

Key library versions: RDKit 2026.09.1, XGBoost 3.4.1, scikit-learn 1.6.1.

---

## Limitations

- **Small dataset:** 597 drugs, only 148 of them DIA-positive.
- **Moderate recall:** at the 0.48 threshold the model catches about half of risky drugs. A low score means "no risk signal found", not "safe". For example, venlafaxine (DIA-positive) is missed.
- **2D descriptors only:** mirror-image forms of a molecule (stereoisomers) get identical predictions, even though they can differ in toxicity.
- **Explanations describe the model, not biology:** SHAP shows which descriptors drove a prediction, not what causes autoimmunity.

## Future scope

- Choose the threshold for recall (for example with F2 or a minimum-recall target), since missing a risky drug costs more than a false alarm
- Add stereo-aware and 3D descriptors, or learned molecular representations such as graph neural networks
- Train on larger toxicity datasets and calibrate the scores into true probabilities
- Batch screening of many molecules at once

---

**Disclaimer:** research prototype for educational use. Not a substitute for clinical or regulatory safety testing.
