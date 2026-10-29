"""
FastAPI backend for the DIA risk predictor.
Run from the backend folder:  uvicorn main:app --reload
Interactive docs:             http://127.0.0.1:8000/docs
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from predictor import DIAPredictor

app = FastAPI(title="DIA Risk Predictor API", version="1.0")

# Allow the React dev server (Vite runs on port 5173) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = DIAPredictor()  # loaded once at startup


class PredictRequest(BaseModel):
    smiles: str


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "features": len(predictor.features),
        "threshold": predictor.threshold,
        "versions": predictor.versions,
    }


@app.get("/api/examples")
def examples():
    return predictor.examples


@app.post("/api/predict")
def predict(req: PredictRequest):
    try:
        return predictor.predict(req.smiles)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
