from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.database import engine
from app.security import get_current_user
from app.schemas.donor import (
    DonorProfileCreate,
    DonorProfileResponse,
)

router = APIRouter(prefix="/donors", tags=["Donors"])


BloodGroup = Literal[
    "A+", "A-",
    "B+", "B-",
    "AB+", "AB-",
    "O+", "O-",
]


# DEMO ACCOUNTS: user IDs 6 through 105
DEMO_USER_ID_MIN = 6
DEMO_USER_ID_MAX = 105


class AvailabilityUpdate(BaseModel):
    is_available: bool


@router.post(
    "/profile",
    response_model=DonorProfileResponse,
    status_code=201,
)
def create_donor_profile(
    profile: DonorProfileCreate,
    current_user: dict = Depends(get_current_user),
):
    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    INSERT INTO donor_profiles (
                        user_id,
                        blood_group,
                        date_of_birth,
                        city,
                        state
                    )
                    VALUES (
                        :user_id,
                        :blood_group,
                        :date_of_birth,
                        :city,
                        :state
                    )
                """),
                {
                    "user_id": current_user["user_id"],
                    "blood_group": profile.blood_group,
                    "date_of_birth": profile.date_of_birth,
                    "city": profile.city,
                    "state": profile.state,
                },
            )

            donor_id = result.lastrowid

            saved_profile = connection.execute(
                text("""
                    SELECT
                        donor_id,
                        user_id,
                        blood_group,
                        date_of_birth,
                        city,
                        state,
                        is_available
                    FROM donor_profiles
                    WHERE donor_id = :donor_id
                """),
                {"donor_id": donor_id},
            ).mappings().one()

        return dict(saved_profile)

    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="A donor profile already exists for this account.",
        )


@router.get(
    "/profile",
    response_model=DonorProfileResponse,
)
def get_donor_profile(
    current_user: dict = Depends(get_current_user),
):
    with engine.connect() as connection:
        profile = connection.execute(
            text("""
                SELECT
                    donor_id,
                    user_id,
                    blood_group,
                    date_of_birth,
                    city,
                    state,
                    is_available
                FROM donor_profiles
                WHERE user_id = :user_id
            """),
            {"user_id": current_user["user_id"]},
        ).mappings().first()

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Donor profile not found. Create your profile first.",
        )

    return dict(profile)


@router.patch("/availability")
def update_availability(
    data: AvailabilityUpdate,
    current_user: dict = Depends(get_current_user),
):
    with engine.begin() as connection:
        result = connection.execute(
            text("""
                UPDATE donor_profiles
                SET is_available = :is_available
                WHERE user_id = :user_id
            """),
            {
                "is_available": data.is_available,
                "user_id": current_user["user_id"],
            },
        )

        if result.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Donor profile not found.",
            )

    return {
        "message": "Availability updated successfully.",
        "is_available": data.is_available,
    }


@router.get("/search")
def search_donors(
    blood_group: BloodGroup | None = None,
    city: str | None = None,
    state: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    can_view_contact = True

    query = """
        SELECT
            dp.donor_id,
            dp.user_id,
            u.full_name,

            CASE
                WHEN :can_view_contact = 1
                THEN u.phone
                ELSE NULL
            END AS phone,

            CASE
                WHEN u.user_id BETWEEN :demo_min AND :demo_max
                THEN TRUE
                ELSE FALSE
            END AS is_demo,

            dp.blood_group,
            dp.city,
            dp.state,
            dp.is_available

        FROM donor_profiles dp
        JOIN users u ON u.user_id = dp.user_id

        WHERE dp.is_available = TRUE
    """

    params = {
        "can_view_contact": int(can_view_contact),
        "demo_min": DEMO_USER_ID_MIN,
        "demo_max": DEMO_USER_ID_MAX,
    }

    if blood_group:
        query += " AND dp.blood_group = :blood_group"
        params["blood_group"] = blood_group

    if city and city.strip():
        query += " AND LOWER(dp.city) = LOWER(:city)"
        params["city"] = city.strip()

    if state and state.strip():
        query += " AND LOWER(dp.state) = LOWER(:state)"
        params["state"] = state.strip()

    query += """
        ORDER BY dp.city, dp.state, dp.blood_group
    """

    with engine.connect() as connection:
        result = connection.execute(
            text(query),
            params,
        )

        donors = [
            dict(row)
            for row in result.mappings().all()
        ]

    return {
        "count": len(donors),
        "donors": donors,
    }


@router.get("/match-request/{request_id}")
def match_donors_to_request(
    request_id: int,
    current_user: dict = Depends(get_current_user),
):
    with engine.connect() as connection:
        request = connection.execute(
            text("""
                SELECT
                    request_id,
                    blood_group,
                    city,
                    state,
                    urgency
                FROM blood_requests
                WHERE request_id = :request_id
                  AND status = 'open'
            """),
            {"request_id": request_id},
        ).mappings().first()

        if request is None:
            raise HTTPException(
                status_code=404,
                detail="Open blood request not found.",
            )

        can_view_contact = True

        donors = connection.execute(
            text("""
                SELECT
                    dp.donor_id,
                    dp.user_id,
                    u.full_name,

                    CASE
                        WHEN :can_view_contact = 1
                        THEN u.phone
                        ELSE NULL
                    END AS phone,

                    CASE
                        WHEN u.user_id BETWEEN :demo_min AND :demo_max
                        THEN TRUE
                        ELSE FALSE
                    END AS is_demo,

                    dp.blood_group,
                    dp.city,
                    dp.state,
                    dp.is_available

                FROM donor_profiles dp
                JOIN users u ON u.user_id = dp.user_id

                WHERE dp.is_available = TRUE
                  AND dp.blood_group = :blood_group
                  AND LOWER(dp.city) = LOWER(:city)
                  AND (
                      :state IS NULL
                      OR LOWER(dp.state) = LOWER(:state)
                  )

                ORDER BY dp.donor_id
            """),
            {
                "can_view_contact": int(can_view_contact),
                "demo_min": DEMO_USER_ID_MIN,
                "demo_max": DEMO_USER_ID_MAX,
                "blood_group": request["blood_group"],
                "city": request["city"],
                "state": request["state"],
            },
        ).mappings().all()

    return {
        "request": dict(request),
        "matching_donor_count": len(donors),
        "donors": [
            dict(donor)
            for donor in donors
        ],
        "notice": (
            "Matching results are preliminary and do not "
            "establish medical eligibility."
        ),
    }