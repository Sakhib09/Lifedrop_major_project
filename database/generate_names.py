import secrets
import random

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
    "Thomas","Fernandes","D'Souza","Acharya","Poojary","Pai","Kamath",
    "Chowdhury","Kapoor","Malhotra","Chavan","Yadav","Jain","Bose",
    "Saxena","Iyer","Subramanian","Mukherjee","Banerjee","Das","Gill"
]

# Create 100 unique full names
all_names = [f"{first} {last}" for first in first_names for last in last_names]
random.SystemRandom().shuffle(all_names)
selected_names = all_names[:100]

# Generate 100 unique, random-looking 10-digit numbers
numbers = set()
while len(numbers) < 100:
    numbers.add("9" + "".join(secrets.choice("0123456789") for _ in range(9)))

for user_id, (name, phone) in enumerate(zip(selected_names, numbers), start=6):
    print(f"{user_id}|{name}|{phone}")
