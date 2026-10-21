import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.database import engine

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

router = APIRouter(prefix="/auth", tags=["Authentication"])

password_hash = PasswordHash.recommended()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 30


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class UserRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="donor")


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


# --------------------------------------------------
# REGISTER A NEW USER
# --------------------------------------------------

@router.post("/register", status_code=201)
def register_user(user: UserRegister):

    full_name = user.full_name.strip()
    phone = user.phone.strip()
    email = str(user.email).lower()

    if not full_name:
        raise HTTPException(
            status_code=400,
            detail="Full name cannot be empty."
        )

    if not phone:
        raise HTTPException(
            status_code=400,
            detail="Phone number cannot be empty."
        )

    role = user.role.strip().lower()

    if role not in ("donor", "requester"):
        raise HTTPException(
            status_code=400,
            detail="Role must be donor or requester."
        )

    hashed_password = password_hash.hash(user.password)

    try:
        with engine.begin() as connection:

            existing_user = connection.execute(
                text("""
                    SELECT user_id
                    FROM users
                    WHERE email = :email
                """),
                {"email": email}
            ).first()

            if existing_user:
                raise HTTPException(
                    status_code=409,
                    detail="An account with this email already exists."
                )

            result = connection.execute(
                text("""
                    INSERT INTO users (
                        full_name,
                        email,
                        password_hash,
                        phone,
                        role
                    )
                    VALUES (
                        :full_name,
                        :email,
                        :password_hash,
                        :phone,
                        :role
                    )
                """),
                {
                    "full_name": full_name,
                    "email": email,
                    "password_hash": hashed_password,
                    "phone": phone,
                    "role": role
                }
            )

            user_id = result.lastrowid

    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    return {
        "message": "Account created successfully. Please sign in.",
        "user": {
            "user_id": user_id,
            "full_name": full_name,
            "email": email,
            "role": role
        }
    }


# --------------------------------------------------
# LOGIN AN EXISTING USER
# --------------------------------------------------

@router.post("/login")
def login_user(user: UserLogin):

    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    user_id,
                    full_name,
                    email,
                    password_hash,
                    role
                FROM users
                WHERE email = :email
            """),
            {"email": str(user.email).lower()}
        )

        account = result.mappings().first()

    if account is None or not password_hash.verify(
        user.password,
        account["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Authentication is not configured."
        )

    now = datetime.now(timezone.utc)

    token_payload = {
        "sub": str(account["user_id"]),
        "role": account["role"],
        "iat": now,
        "exp": now + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    }

    token = jwt.encode(
        token_payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "expires_in": TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "user_id": account["user_id"],
            "full_name": account["full_name"],
            "email": account["email"],
            "role": account["role"]
        }
    }