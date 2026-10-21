import os
from pathlib import Path

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text

from app.database import engine

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    if not JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Authentication is not configured."
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        user_id = int(payload["sub"])

    except (jwt.InvalidTokenError, KeyError, ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token."
        )

    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT user_id, full_name, email, role
                FROM users
                WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        )
        user = result.mappings().first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User account not found."
        )

    return dict(user)