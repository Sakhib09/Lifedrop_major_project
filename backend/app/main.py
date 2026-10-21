from pathlib import Path

import joblib
import pandas as pd

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.routes.users import router as users_router
from app.routes.auth import router as auth_router
from app.routes.donors import router as donors_router
from app.routes.blood_requests import router as blood_requests_router
from app.routes.notifications import router as notifications_router


app = FastAPI(
    title="LifeDrop API",
    description=(
        "Blood bank management API with an experimental "
        "SVM-based donor screening classifier."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(donors_router, prefix="/api")
app.include_router(blood_requests_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")


MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "ml"
    / "svm_rbf_model.joblib"
)

model = None

FEATURES = [
    "age",
    "hemoglobin",
    "bmi",
    "systolic_bp",
    "diastolic_bp",
    "days_since_last_donation",
]


class DonorData(BaseModel):
    age: int = Field(ge=0, le=120)
    hemoglobin: float = Field(ge=0, le=30)
    bmi: float = Field(gt=0, le=100)
    systolic_bp: int = Field(gt=0, le=300)
    diastolic_bp: int = Field(gt=0, le=200)
    days_since_last_donation: int = Field(
        ge=0,
        le=36500,
    )


@app.on_event("startup")
def load_model():
    global model

    if not MODEL_PATH.exists():
        raise RuntimeError(
            f"SVM model not found at {MODEL_PATH}. "
            "Run backend/ml/train_model.py first."
        )

    model = joblib.load(MODEL_PATH)


@app.get("/")
def home():
    return {
        "message": "LifeDrop API is running.",
        "status": "success",
        "ml_algorithm": "SVM with RBF kernel",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "ml_algorithm": "SVM with RBF kernel",
    }


@app.post("/predict")
def predict(data: DonorData):
    if model is None:
        return {
            "error": "The SVM model is not loaded."
        }

    features = pd.DataFrame(
        [data.model_dump()],
        columns=FEATURES,
    )

    prediction = int(model.predict(features)[0])
    probabilities = model.predict_proba(features)[0]

    class_probabilities = {
        str(label): round(float(probability), 4)
        for label, probability in zip(
            model.classes_,
            probabilities,
        )
    }

    return {
        "synthetic_prediction": prediction,
        "class_probabilities": class_probabilities,
        "algorithm": "SVM with RBF kernel",
        "notice": (
            "Experimental classifier trained on synthetic data "
            "with artificial labels. This prediction is not "
            "clinically validated and must not determine "
            "real donor eligibility."
        ),
    }