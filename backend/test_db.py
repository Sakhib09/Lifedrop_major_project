from app.database import test_database_connection

try:
    database_name = test_database_connection()
    print("MySQL connection successful!")
    print("Connected database:", database_name)

except Exception as error:
    print("MySQL connection failed.")
    print("Error type:", type(error).__name__)
    print("Error:", error)