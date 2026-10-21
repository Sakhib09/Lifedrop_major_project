from datetime import date
from sqlalchemy import text
from pwdlib import PasswordHash
from app.database import engine

password_hash = PasswordHash.recommended()
demo_password = "LifeDropDemo@2026"

blood_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
cities = ["Bengaluru", "Mangaluru", "Mysuru", "Udupi"]

created_users = 0
created_profiles = 0

with engine.begin() as conn:
    for i in range(1, 101):
        email = f"demo.donor{i:03d}@lifedrop.test"

        # Check whether the demo account already exists
        existing = conn.execute(
            text("SELECT user_id FROM users WHERE email = :email"),
            {"email": email}
        ).mappings().first()

        if existing:
            user_id = existing["user_id"]
        else:
            result = conn.execute(
                text("""
                    INSERT INTO users
                        (full_name, email, password_hash, role)
                    VALUES
                        (:name, :email, :password, 'donor')
                """),
                {
                    "name": f"Demo Donor {i:03d}",
                    "email": email,
                    "password": password_hash.hash(demo_password)
                }
            )
            user_id = result.lastrowid
            created_users += 1

        # Avoid duplicate donor profiles
        profile = conn.execute(
            text("""
                SELECT donor_id
                FROM donor_profiles
                WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        ).first()

        if not profile:
            blood_group = blood_groups[(i - 1) % len(blood_groups)]
            city = cities[(i - 1) % len(cities)]

            birth_year = 1985 + (i % 20)
            birth_month = 1 + (i % 12)
            birth_day = 10

            conn.execute(
                text("""
                    INSERT INTO donor_profiles
                        (user_id, blood_group, date_of_birth,
                         city, state, is_available)
                    VALUES
                        (:user_id, :blood_group, :dob,
                         :city, 'Karnataka', 1)
                """),
                {
                    "user_id": user_id,
                    "blood_group": blood_group,
                    "dob": date(birth_year, birth_month, birth_day),
                    "city": city
                }
            )
            created_profiles += 1

print("\n100 synthetic donor accounts processed.")
print(f"New demo users created: {created_users}")
print(f"New donor profiles created: {created_profiles}")
print(f"Demo login password: {demo_password}")
print("These records are artificial and are for local testing only.")