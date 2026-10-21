import os
import random
import re
from sqlalchemy import text
from app.database import engine

first_names = [
    "Aarav", "Ayaan", "Rohan", "Aditya", "Rahul",
    "Arjun", "Imran", "Karan", "Vikram", "Ishaan",
    "Ananya", "Priya", "Zoya", "Sana", "Diya",
    "Aisha", "Neha", "Meera", "Kavya", "Sneha",
    "Varun", "Nikhil", "Manav", "Rehan", "Dev",
    "Pooja", "Riya", "Fatima", "Ira", "Tara"
]

last_names = [
    "Sharma", "Shetty", "Khan", "Rao", "Nair",
    "Verma", "Gowda", "Patel", "Reddy", "Joshi",
    "Ahmed", "Hegde", "Bhat", "Kulkarni", "Menon",
    "Naik", "Poojary", "Fernandes", "D'Souza", "Pai"
]

def slug(value):
    value = value.lower().replace("'", "")
    return re.sub(r"[^a-z0-9]+", ".", value).strip(".")

with engine.begin() as connection:
    donors = connection.execute(text("""
        SELECT user_id
        FROM users
        WHERE email LIKE 'demo.donor%@lifedrop.com'
          AND full_name LIKE 'Demo Donor%'
        ORDER BY user_id
    """)).fetchall()

    if len(donors) != 100:
        raise RuntimeError(
            f"Expected 100 demo donors, but found {len(donors)}. No changes made."
        )

    used_names = set()
    used_emails = {
        row[0].lower()
        for row in connection.execute(text("SELECT email FROM users")).fetchall()
    }

    updates = []

    for row in donors:
        user_id = row[0]

        while True:
            first = random.choice(first_names)
            last = random.choice(last_names)
            full_name = f"{first} {last}"

            if full_name.lower() not in used_names:
                email = f"{slug(first)}.{slug(last)}{user_id}@example.com"

                if email.lower() not in used_emails:
                    used_names.add(full_name.lower())
                    used_emails.add(email.lower())
                    break

        # Synthetic, non-contactable placeholder number.
        # Do not use these as real donor contact details.
        phone = f"TEST{user_id:07d}"

        updates.append({
            "user_id": user_id,
            "full_name": full_name,
            "email": email,
            "phone": phone,
        })

    connection.execute(
        text("""
            UPDATE users
            SET full_name = :full_name,
                email = :email,
                phone = :phone
            WHERE user_id = :user_id
        """),
        updates,
    )

print("Successfully updated 100 fictional donor accounts.")
print("Names and matching example.com emails have been assigned.")
print("Phone fields contain TEST placeholders, not real phone numbers.")