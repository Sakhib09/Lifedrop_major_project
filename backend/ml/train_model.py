from pathlib import Path

import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "synthetic_donor_data.csv"
MODEL_PATH = BASE_DIR / "svm_rbf_model.joblib"

FEATURES = [
    "age",
    "hemoglobin",
    "bmi",
    "systolic_bp",
    "diastolic_bp",
    "days_since_last_donation",
]

TARGET = "screening_outcome"


def train_model():
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_PATH}"
        )

    data = pd.read_csv(DATA_PATH)

    required_columns = FEATURES + [TARGET]
    missing = set(required_columns) - set(data.columns)

    if missing:
        raise ValueError(
            f"Dataset is missing columns: {sorted(missing)}"
        )

    if data[required_columns].isnull().any().any():
        raise ValueError(
            "Dataset contains missing values. Clean it before training."
        )

    X = data[FEATURES]
    y = data[TARGET].astype(int)

    if y.nunique() != 2:
        raise ValueError(
            "The dataset must contain both target classes: 0 and 1."
        )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    # StandardScaler normalizes the feature scales.
    # SVC uses an RBF kernel to learn nonlinear decision boundaries.
    model = Pipeline([
        ("scaler", StandardScaler()),
        (
            "svm",
            SVC(
                kernel="rbf",
                C=1.0,
                gamma="scale",
                probability=True,
                class_weight="balanced",
                random_state=42,
            ),
        ),
    ])

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    print("\n========== SVM MODEL EVALUATION ==========")
    print("Algorithm: Support Vector Machine")
    print("Kernel: RBF")
    print("Training records:", len(X_train))
    print("Testing records:", len(X_test))

    print(
        "Accuracy:",
        round(accuracy_score(y_test, predictions), 4),
    )

    print(
        "Precision:",
        round(
            precision_score(
                y_test, predictions, zero_division=0
            ),
            4,
        ),
    )

    print(
        "Recall:",
        round(
            recall_score(
                y_test, predictions, zero_division=0
            ),
            4,
        ),
    )

    print(
        "F1-score:",
        round(
            f1_score(
                y_test, predictions, zero_division=0
            ),
            4,
        ),
    )

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, predictions))

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0,
        )
    )

    joblib.dump(model, MODEL_PATH)

    print("\nSVM model saved successfully.")
    print("Model path:", MODEL_PATH)

    print(
        "\nIMPORTANT: This model uses synthetic data and "
        "artificial labels. Results do not establish "
        "real-world medical eligibility or model validity."
    )


if __name__ == "__main__":
    train_model()