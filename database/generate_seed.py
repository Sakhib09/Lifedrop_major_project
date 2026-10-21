import secrets
import random
from pathlib import Path

first_names = [
    "Aarav","Vivaan","Aditya","Arjun","Rohan","Rahul","Kiran","Nikhil",
    "Akash","Vikram","Ananya","Priya","Sneha","Kavya","Aishwarya","Meera",
    "Pooja","Divya","Neha","Ishita","Farhan","Ayaan","Zoya","Sana",
    "Imran","Ayesha","Dev","Riya","Sahil","Tanvi","Vishal","Shreya",
    "Manav","Ira","Varun","Maya","Ibrahim","Fatima","Rehan","Nisha",
    "Krishna","Sanjay","Deepak","Anjali","Harsha","Pallavi","Sameer","Sonia"
]
last_names = [
    "Sharma","Patel","Shetty","Rao","Kumar","Reddy","Nair","Shah",
    "Joshi","Gowda","Bhat","Hegde","Verma","Singh","Kulkarni","Desai",
    "Mishra","Menon","Khan","Ahmed","Syed","Shaikh","Naik","Pillai",
    "Thomas","Fernandes","Acharya","Poojary","Pai","Kamath","Kapoor",
    "Yadav","Jain","Bose","Iyer","Das","Gill","Rathore","Chauhan"
]

cities = ["Bengaluru", "Mangaluru", "Mysuru", "Udupi", "Moodbidri"]
groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
rng = random.SystemRandom()

names = list({f"{f} {l}" for f in first_names for l in last_names})
rng.shuffle(names)
names = names[:100]

phones = set()
while len(phones) < 100:
    phones.add("9" + "".join(secrets.choice("0123456789") for _ in range(9)))
phones = list(phones)

lines = [
    "-- LifeDrop synthetic demo data. Names and phone numbers are fictional.",
    "INSERT IGNORE INTO users (user_id, full_name, email, password_hash, phone, role) VALUES"
]
user_rows = [
    "(1, 'LifeDrop Demo Requester', 'demo.requester@example.com', 'DEMO_ACCOUNT_NOT_FOR_LOGIN', '9000000001', 'user')"
]
for i, (name, phone) in enumerate(zip(names, phones), start=6):
    user_id = i
    email = f"demo.donor.{user_id}@example.com"
    name_sql = name.replace("'", "''")
    user_rows.append(
        f"({user_id}, '{name_sql}', '{email}', 'DEMO_ACCOUNT_NOT_FOR_LOGIN', '{phone}', 'user')"
    )
lines.append(",\n".join(user_rows) + ";")
lines += [
    "",
    "INSERT IGNORE INTO donor_profiles (user_id, blood_group, date_of_birth, city, state, is_available) VALUES"
]
profile_rows = []
for idx, user_id in enumerate(range(6, 106)):
    city = cities[idx // 8 % 5]
    blood = groups[idx % 8]
    age = 20 + idx % 25
    profile_rows.append(
        f"({user_id}, '{blood}', DATE_SUB(CURDATE(), INTERVAL {age} YEAR), '{city}', 'Karnataka', TRUE)"
    )
lines.append(",\n".join(profile_rows) + ";")
lines += [
    "",
    "INSERT IGNORE INTO blood_requests (request_id, requester_id, blood_group, units_required, hospital_name, city, state, urgency, status, required_by) VALUES",
    "(1, 1, 'O+', 2, 'Demo City Hospital', 'Mangaluru', 'Karnataka', 'urgent', 'open', DATE_ADD(CURDATE(), INTERVAL 2 DAY)),",
    "(2, 1, 'A+', 1, 'Demo Central Hospital', 'Bengaluru', 'Karnataka', 'normal', 'open', DATE_ADD(CURDATE(), INTERVAL 5 DAY)),",
    "(3, 1, 'B+', 2, 'Demo Community Hospital', 'Mysuru', 'Karnataka', 'emergency', 'open', DATE_ADD(CURDATE(), INTERVAL 1 DAY)),",
    "(4, 1, 'AB+', 1, 'Demo Coastal Hospital', 'Udupi', 'Karnataka', 'normal', 'open', DATE_ADD(CURDATE(), INTERVAL 4 DAY)),",
    "(5, 1, 'O-', 1, 'Demo North Hospital', 'Moodbidri', 'Karnataka', 'urgent', 'open', DATE_ADD(CURDATE(), INTERVAL 2 DAY));"
]
Path("database/demo_seed.sql").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("Updated database/demo_seed.sql with 100 unique synthetic donor names and phone numbers.")
print("Cities: Bengaluru, Mangaluru, Mysuru, Udupi, Moodbidri")
print("Blood groups: all 8 represented in every city.")
