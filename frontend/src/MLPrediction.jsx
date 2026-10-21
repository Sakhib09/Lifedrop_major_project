    import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, ArrowRight, RotateCcw, ShieldAlert } from "lucide-react";

const initialValues = {
  age: "25",
  hemoglobin: "14.2",
  bmi: "22.5",
  systolic_bp: "120",
  diastolic_bp: "80",
  days_since_last_donation: "150",
};

const fields = [
  { name: "age", label: "Age", unit: "years", min: 18, max: 100, step: 1 },
  { name: "hemoglobin", label: "Hemoglobin", unit: "g/dL", min: 1, max: 30, step: 0.1 },
  { name: "bmi", label: "Body mass index", unit: "kg/m²", min: 1, max: 100, step: 0.1 },
  { name: "systolic_bp", label: "Systolic blood pressure", unit: "mmHg", min: 1, max: 300, step: 1 },
  { name: "diastolic_bp", label: "Diastolic blood pressure", unit: "mmHg", min: 1, max: 200, step: 1 },
  { name: "days_since_last_donation", label: "Days since previous donation", unit: "days", min: 0, max: 3650, step: 1 },
];

export default function MLPrediction() {
  const [values, setValues] = useState(initialValues);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setValues((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
    setResult(null);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    const payload = {};

    for (const field of fields) {
      const value = Number(values[field.name]);

      if (
        values[field.name].trim() === "" ||
        !Number.isFinite(value) ||
        value < field.min ||
        value > field.max
      ) {
        setError(
          `${field.label} must be between ${field.min} and ${field.max}.`
        );
        return;
      }

      payload[field.name] = value;
    }

    setLoading(true);

    try {
  const response = await fetch("http://127.0.0.1:8000/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Prediction failed: HTTP ${response.status}`
    );
  }

  const data = await response.json();
  setResult(data);
} catch (err) {
  setError(
    err.message ||
      "Unable to reach the prediction API. Check that the backend is running."
  );
} finally {
  setLoading(false);
}
  }

  function resetForm() {
    setValues(initialValues);
    setResult(null);
    setError("");
  }

  const predictedClass = result?.synthetic_prediction;
  const probability =
    result?.class_probabilities?.[String(predictedClass)];

  return (
    <section className="ml-screening">
      <div className="ml-heading">
        <div className="ml-eyebrow">
          <Activity size={15} />
          EXPERIMENTAL MACHINE LEARNING
        </div>

        <h2>
          Donor screening
          <br />
          <em>demonstration.</em>
        </h2>

        <p>
          Explore how an SVM classifier processes donor-related measurements
          and produces a model prediction using synthetic training data.
        </p>
      </div>

      <div className="ml-layout">
        <form className="ml-form" onSubmit={handleSubmit}>
          <div className="ml-form-top">
            <span>01 / INPUT PARAMETERS</span>
            <button type="button" className="ml-reset" onClick={resetForm}>
              <RotateCcw size={14} />
              Reset
            </button>
          </div>

          <div className="ml-fields">
            {fields.map((field, index) => (
              <motion.label
                key={field.name}
                className="ml-field"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="ml-field-label">{field.label}</span>

                <span className="ml-input-wrap">
                  <input
                    type="number"
                    name={field.name}
                    value={values[field.name]}
                    onChange={updateField}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    required
                  />
                  <span>{field.unit}</span>
                </span>
              </motion.label>
            ))}
          </div>

          {error && (
            <div className="ml-error" role="alert">
              {error}
            </div>
          )}

          <button className="ml-submit" type="submit" disabled={loading}>
            {loading
              ? "Running prediction..."
              : "Run experimental prediction"}
            <ArrowRight size={17} />
          </button>

          <p className="ml-form-note">
            Demo only. This tool does not establish medical eligibility.
          </p>
        </form>

        <aside className="ml-result">
          <div className="ml-result-top">
            <span>02 / MODEL OUTPUT</span>
            <span className="ml-status-dot" />
          </div>

          {!result ? (
            <div className="ml-empty">
              <div className="ml-symbol">
                <Activity size={27} strokeWidth={1.3} />
              </div>
              <h3>Awaiting input.</h3>
              <p>
                Submit the parameters to see the SVM model's experimental
                output.
              </p>
            </div>
          ) : (
            <motion.div
              className="ml-output"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="ml-output-label">PREDICTED CLASS</span>

              <div className="ml-prediction">
                {predictedClass}
                <span>Class label</span>
              </div>

              <div className="ml-probabilities">
                <div className="ml-probability-heading">
                  <span>Class 0</span>
                  <strong>
                    {(
                      Number(result.class_probabilities?.["0"] ?? 0) * 100
                    ).toFixed(2)}
                    %
                  </strong>
                </div>
                <div className="ml-track">
                  <div
                    className="ml-track-fill"
                    style={{
                      width: `${
                        Number(result.class_probabilities?.["0"] ?? 0) * 100
                      }%`,
                    }}
                  />
                </div>

                <div className="ml-probability-heading">
                  <span>Class 1</span>
                  <strong>
                    {(
                      Number(result.class_probabilities?.["1"] ?? 0) * 100
                    ).toFixed(2)}
                    %
                  </strong>
                </div>
                <div className="ml-track">
                  <div
                    className="ml-track-fill ml-track-secondary"
                    style={{
                      width: `${
                        Number(result.class_probabilities?.["1"] ?? 0) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <p className="ml-algorithm">
                Algorithm: {result.algorithm || "SVM with RBF kernel"}
              </p>
            </motion.div>
          )}

          <div className="ml-warning">
            <ShieldAlert size={19} />
            <p>
              <strong>Research prototype</strong>
              <br />
              {result?.notice ||
                "Synthetic data only. Outputs are not clinically validated and must not determine real donor eligibility."}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
} 