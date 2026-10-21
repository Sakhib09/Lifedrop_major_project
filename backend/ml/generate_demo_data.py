import numpy as np
import pandas as pd
from pathlib import Path

# Reproducible synthetic data
np.random.seed(42)

# Generate 1000 artificial donor records
n = 1000

data = pd.DataFrame({
    "age": np.random.randint(18, 61, n),
    "hemoglobin": np.round(np.random.normal(13.5, 1.5, n), 1),
    "bmi": np.round(np.random.normal(23, 3.5, n), 1),
    "systolic_bp": np.random.randint(90, 161, n),
    "diastolic_bp": np.random.randint(60, 101, n),
    "days_since_last_donation": np.random.randint(0, 366, n)
})

# Artificial demonstration labels only.
# These rules are invented for software testing,
# NOT real donor eligibility criteria.
data["screening_outcome"] = (
    (data["age"] >= 18)
    & (data["age"] <= 60)
    & (data["hemoglobin"] >= 12.5)
    & (data["bmi"] >= 18.5)
    & (data["systolic_bp"] >= 100)
    & (data["systolic_bp"] <= 140)
    & (data["diastolic_bp"] >= 60)
    & (data["diastolic_bp"] <= 90)
    & (data["days_since_last_donation"] >= 90)
).astype(int)

# Save the dataset inside backend/ml/
output_path = Path(__file__).parent / "synthetic_donor_data.csv"
data.to_csv(output_path, index=False)

print("Synthetic dataset created successfully!")
print(f"Total records: {len(data)}")
print("\nFirst 5 records:")
print(data.head())
print("\nLabel distribution:")
print(data["screening_outcome"].value_counts().sort_index())
print(f"\nSaved to: {output_path}")
print("\nNOTICE: Synthetic data and artificial labels only.")