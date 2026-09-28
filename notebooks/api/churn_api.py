"""API de predicción de bajas (FastAPI).

Requisitos: haber ejecutado notebooks/churn_telco.py, que guarda modelos/churn_logistica.joblib.
Arranque:   uvicorn api.churn_api:app --reload        (desde la carpeta notebooks)
Prueba:     http://127.0.0.1:8000/docs
"""
from typing import Literal
import pathlib
import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

MODELO = joblib.load(pathlib.Path(__file__).resolve().parent.parent / "modelos" / "churn_logistica.joblib")
UMBRAL = 0.25          # elegido con el análisis de coste-beneficio del proyecto
VERSION = "churn-logistica-1.0"

SiNo = Literal["Yes", "No"]
Servicio = Literal["Yes", "No", "No internet service"]

class Cliente(BaseModel):
    gender: Literal["Female", "Male"]
    SeniorCitizen: Literal[0, 1]
    Partner: SiNo
    Dependents: SiNo
    tenure: int = Field(ge=0, le=100, description="Meses como cliente")
    PhoneService: SiNo
    MultipleLines: Literal["Yes", "No", "No phone service"]
    InternetService: Literal["DSL", "Fiber optic", "No"]
    OnlineSecurity: Servicio
    OnlineBackup: Servicio
    DeviceProtection: Servicio
    TechSupport: Servicio
    StreamingTV: Servicio
    StreamingMovies: Servicio
    Contract: Literal["Month-to-month", "One year", "Two year"]
    PaperlessBilling: SiNo
    PaymentMethod: Literal["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"]
    MonthlyCharges: float = Field(gt=0)
    TotalCharges: float = Field(ge=0)

class Prediccion(BaseModel):
    probabilidad_baja: float
    contactar: bool
    umbral: float
    version_modelo: str

app = FastAPI(title="MLE·AI · Predicción de bajas", version=VERSION)

@app.get("/salud")
def salud():
    return {"estado": "ok", "version_modelo": VERSION}

@app.post("/prediccion", response_model=Prediccion)
def prediccion(cliente: Cliente):
    p = float(MODELO.predict_proba(pd.DataFrame([cliente.model_dump()]))[0, 1])
    return Prediccion(probabilidad_baja=round(p, 4), contactar=p >= UMBRAL, umbral=UMBRAL, version_modelo=VERSION)
