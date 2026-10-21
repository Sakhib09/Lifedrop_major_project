from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from pwdlib import PasswordHash

from app.database import engine
from app.schemas.user import UserRegister, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

password_hash = PasswordHash.recommended()


@router.post("/register", response_model=UserResponse, status_code=201)
def register_user(user: UserRegister):
    hashed_password = password_hash.hash(user.password)

    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    INSERT INTO users
                    (full_name, email, password_hash, phone)
                    VALUES
                    (:full_name, :email, :password_hash, :phone)
                """),
                {
                    "full_name": user.full_name,
                    "email": str(user.email),
                    "password_hash": hashed_password,
                    "phone": user.phone
                }
            )

            user_id = result.lastrowid

            new_user = connection.execute(
                text("""
                    SELECT user_id, full_name, email, role
                    FROM users
                    WHERE user_id = :user_id
                """),
                {"user_id": user_id}
            ).mappings().one()

        return dict(new_user)

    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="This email is already registered."
        )