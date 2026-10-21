import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Create MySQL connection URL
connection_url = URL.create(
    drivername="mysql+pymysql",
    username=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST", "localhost"),
    port=int(os.getenv("DB_PORT", "3306")),
    database=os.getenv("DB_NAME"),
)

# Create database engine
engine = create_engine(
    connection_url,
    pool_pre_ping=True
)

# Test the connection
def test_database_connection():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT DATABASE()"))
        return result.scalar()