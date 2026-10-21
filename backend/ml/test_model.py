from pathlib import Path

import joblib
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "svm_rbf_model.joblib"

FEATURES = [
    "age",
    "hemoglobin",
    "bmi",
    "systolic_bp",
    "diastolic_bp",
    "days_since_last_donation",
]


def test_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "SVM model not found. Run train_model.py first."
        )

    model = joblib.load(MODEL_PATH)

    sample = pd.DataFrame([{
        "age": 25,
        "hemoglobin": 14.2,
        "bmi": 22.5,
        "systolic_bp": 120,
        "diastolic_bp": 80,
        "days_since_last_donation": 150,
    }], columns=FEATURES)

    prediction = int(model.predict(sample)[0])
    probabilities = model.predict_proba(sample)[0]

    print("\n========== SVM TEST ==========")
    print("Algorithm: SVM with RBF kernel")
    print("\nInput:")
    print(sample.to_string(index=False))

    print("\nSynthetic prediction:", prediction)

    print("\nClass probabilities:")
    for label, probability in zip(
        model.classes_, probabilities
    ):
        print(f"Class {label}: {probability:.4f}")

    print(
        "\nNOTICE: Demonstration using synthetic data only. "
        "This is not a medical eligibility decision."
    )


if __name__ == "__main__":
    test_model()