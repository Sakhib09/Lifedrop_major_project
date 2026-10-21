LifeDrop - Blood Bank Management System

LifeDrop is a full-stack web application that helps users find blood donors, manage blood requests, and receive notifications. It also includes an experimental machine learning module and an interactive healthcare location map.

Features
- User registration and login
- Donor search by blood group and city
- Blood request management and donor responses
- Notifications
- Interactive map using OpenStreetMap
- ML-based donor prediction

Tech Stack
- Frontend: React, Vite, CSS
- Backend: Python, FastAPI
- Database: MySQL
- Machine Learning: Scikit-learn, SVM
- Maps: React Leaflet, OpenStreetMap

Project Structure

Major-Project/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── blood_requests.py
│   │   │   ├── donors.py
│   │   │   ├── notifications.py
│   │   │   └── users.py
│   │   ├── schemas/
│   │   │   ├── blood_request.py
│   │   │   ├── donor.py
│   │   │   └── user.py
│   │   ├── main.py
│   │   ├── database.py
│   │   └── security.py
│   ├── ml/
│   │   ├── train_model.py
│   │   ├── test_model.py
│   │   └── svm_rbf_model.joblib
│   ├── requirements.txt
│   └── test_db.py
├── frontend/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/
│   │   │   └── react.svg
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── Auth.jsx
│   │   ├── Auth.css
│   │   ├── DonorMap.jsx
│   │   ├── MLPrediction.jsx
│   │   ├── api.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
├── .gitignore
└── README.md

Getting Started

1. Clone the Repository

git clone https://github.com/Sakhib09/Lifedrop_major_project.git
cd Lifedrop_major_project

2. Configure MySQL

Create the database in MySQL:

CREATE DATABASE blood_bank_db;

Configure the database connection and required environment variables for the backend. Ensure all required tables are initialized before running the application.

3. Run the Backend

Create a virtual environment:

python -m venv venv

Activate it on Windows PowerShell:

.\venv\Scripts\Activate.ps1

Install dependencies:

pip install -r backend/requirements.txt

Start the backend:

uvicorn app.main:app --reload --app-dir backend

Backend: http://127.0.0.1:8000
API Documentation: http://127.0.0.1:8000/docs

4. Run the Frontend

Open a second terminal:

cd frontend
npm install
npm run dev

Open the local URL displayed in the terminal, usually http://localhost:5173.

Machine Learning

LifeDrop uses an SVM model trained on synthetic data for demonstration purposes. Predictions are experimental and must not be used for medical decisions or actual donor eligibility assessment.

Security
- Do not commit passwords, API keys, or secret credentials.
- Use environment variables for sensitive configuration.
- Demo data is not verified real-world donor information.

Future Improvements
- Docker Compose integration
- Automated database initialization
- Additional testing and security improvements
- Cloud deployment

Author

S. Mohammed Sakhib
GitHub: https://github.com/Sakhib09

License

Developed for academic purposes. No open-source license has been specified.