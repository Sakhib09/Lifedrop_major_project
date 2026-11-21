import random
import secrets
import mysql.connector

first_names = [
    "Aarav", "Vivaan", "Aditya", "Arjun", "Reyansh", "Atharv",
    "Ishaan", "Kabir", "Rohan", "Rahul", "Kiran", "Nikhil",
    "Ananya", "Diya", "Aadhya", "Saanvi", "Anika", "Meera",
    "Priya", "Kavya", "Sneha", "Isha", "Pooja", "Nandini",
    "Farhan", "Zoya", "Ayaan", "Sana", "Imran", "Ayesha",
    "Dev", "Manav", "Ira", "Riya", "Varun", "Tanvi",
    "Akash", "Neha", "Sahil", "Maya", "Vishal", "Shreya"
]

last_names = [
    "Sharma", "Shetty", "Rao", "Reddy", "Nair", "Patel",
    "Shah", "Bhat", "Hegde", "Gowda", "Kulkarni", "Menon",
    "Verma", "Singh", "Khan", "Ahmed", "Syed", "Shaikh",
    "Poojary", "Acharya", "Naik", "Desai", "Joshi", "Das",
    "Kumar", "Mishra", "Pillai", "Thomas", "Fernandes", "D'Souza"
]

conn = mysql.connector.connect(
    host="127.0.0.1",
    port=3307,
    user="lifedrop",
    password="lifedrop_demo_password",
    database="blood_bank_db"
)
