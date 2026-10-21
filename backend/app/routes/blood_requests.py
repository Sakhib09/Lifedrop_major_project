from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.database import engine
from app.security import get_current_user
from app.schemas.blood_request import (
    BloodRequestCreate,
    BloodRequestResponse,
)

router = APIRouter(prefix="/blood-requests", tags=["Blood Requests"])


# --------------------------------------------------
# 1. CREATE A BLOOD REQUEST
# --------------------------------------------------

@router.post("/", response_model=BloodRequestResponse, status_code=201)
def create_blood_request(
    request: BloodRequestCreate,
    current_user: dict = Depends(get_current_user),
):
    with engine.begin() as connection:
        result = connection.execute(
            text("""
                INSERT INTO blood_requests (
                    requester_id, blood_group, units_required,
                    hospital_name, city, state, urgency, required_by
                )
                VALUES (
                    :requester_id, :blood_group, :units_required,
                    :hospital_name, :city, :state, :urgency, :required_by
                )
            """),
            {
                "requester_id": current_user["user_id"],
                "blood_group": request.blood_group,
                "units_required": request.units_required,
                "hospital_name": request.hospital_name,
                "city": request.city,
                "state": request.state,
                "urgency": request.urgency,
                "required_by": request.required_by,
            },
        )

        request_id = result.lastrowid

        saved_request = connection.execute(
            text("""
                SELECT request_id, requester_id, blood_group,
                       units_required, hospital_name, city, state,
                       urgency, status, required_by
                FROM blood_requests
                WHERE request_id = :request_id
            """),
            {"request_id": request_id},
        ).mappings().one()

    return dict(saved_request)

# --------------------------------------------------
# VIEW RESPONSES SUBMITTED BY THE LOGGED-IN DONOR
# --------------------------------------------------

@router.get("/my-responses")
def get_my_donor_responses(
    current_user: dict = Depends(get_current_user),
):
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    dr.response_id,
                    dr.request_id,
                    dr.response_status,
                    dr.responded_at,
                    br.blood_group,
                    br.hospital_name,
                    br.city,
                    br.state,
                    br.status AS request_status
                FROM donor_responses dr
                JOIN donor_profiles dp
                    ON dr.donor_id = dp.donor_id
                JOIN blood_requests br
                    ON dr.request_id = br.request_id
                WHERE dp.user_id = :user_id
                ORDER BY dr.responded_at DESC
            """),
            {"user_id": current_user["user_id"]},
        )

        responses = [
            dict(row)
            for row in result.mappings().all()
        ]

    return {
        "total_responses": len(responses),
        "responses": responses,
    }
# --------------------------------------------------
# 2. VIEW BLOOD REQUESTS
# --------------------------------------------------

@router.get("/", response_model=list[BloodRequestResponse])
def get_blood_requests(
    current_user: dict = Depends(get_current_user),
):
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT request_id, requester_id, blood_group,
                       units_required, hospital_name, city, state,
                       urgency, status, required_by
                FROM blood_requests
                ORDER BY
                    CASE urgency
                        WHEN 'emergency' THEN 1
                        WHEN 'urgent' THEN 2
                        ELSE 3
                    END,
                    created_at DESC
            """)
        )

        return [dict(row) for row in result.mappings().all()]


# --------------------------------------------------
# 3. UPDATE BLOOD REQUEST STATUS
# --------------------------------------------------

@router.patch("/{request_id}/status")
def update_blood_request_status(
    request_id: int,
    status: Literal["fulfilled", "cancelled"],
    current_user: dict = Depends(get_current_user),
):
    with engine.begin() as connection:
        result = connection.execute(
            text("""
                UPDATE blood_requests
                SET status = :status
                WHERE request_id = :request_id
                  AND requester_id = :requester_id
                  AND status = 'open'
            """),
            {
                "status": status,
                "request_id": request_id,
                "requester_id": current_user["user_id"],
            },
        )

        if result.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Open request not found for your account.",
            )

    return {
        "message": "Blood request status updated successfully.",
        "request_id": request_id,
        "status": status,
    }


# --------------------------------------------------
# 4. DONOR RESPONDS TO A BLOOD REQUEST
# --------------------------------------------------

@router.post("/{request_id}/responses", status_code=201)
def respond_to_blood_request(
    request_id: int,
    current_user: dict = Depends(get_current_user),
):
    with engine.begin() as connection:
        blood_request = connection.execute(
            text("""
                SELECT request_id, requester_id, blood_group, city, state, status
                FROM blood_requests
                WHERE request_id = :request_id
            """),
            {"request_id": request_id},
        ).mappings().first()

        if not blood_request:
            raise HTTPException(
                status_code=404,
                detail="Blood request not found.",
            )

        if blood_request["status"] != "open":
            raise HTTPException(
                status_code=400,
                detail="This blood request is not open.",
            )

        donor = connection.execute(
            text("""
                SELECT donor_id, blood_group, city, state, is_available
                FROM donor_profiles
                WHERE user_id = :user_id
            """),
            {"user_id": current_user["user_id"]},
        ).mappings().first()

        if not donor:
            raise HTTPException(
                status_code=403,
                detail="Create a donor profile before responding.",
            )

        if not donor["is_available"]:
            raise HTTPException(
                status_code=400,
                detail="You must be available to respond to a request.",
            )

        if donor["blood_group"] != blood_request["blood_group"]:
            raise HTTPException(
                status_code=400,
                detail="Your blood group does not match this request.",
            )

        if donor["city"].strip().lower() != blood_request["city"].strip().lower():
            raise HTTPException(
                status_code=400,
                detail="Your city does not match this request.",
            )

        if blood_request["state"] and (
            not donor["state"]
            or donor["state"].strip().lower()
            != blood_request["state"].strip().lower()
        ):
            raise HTTPException(
                status_code=400,
                detail="Your state does not match this request.",
            )

        try:
            connection.execute(
                text("""
                    INSERT INTO donor_responses (request_id, donor_id)
                    VALUES (:request_id, :donor_id)
                """),
                {
                    "request_id": request_id,
                    "donor_id": donor["donor_id"],
                },
            )
        except IntegrityError:
            raise HTTPException(
                status_code=409,
                detail="You have already responded to this request.",
            )

        # Notify the requester that a donor has responded.
        connection.execute(
            text("""
                INSERT INTO notifications (user_id, message)
                VALUES (:user_id, :message)
            """),
            {
                "user_id": blood_request["requester_id"],
                "message": (
                    f"A donor has responded to your blood request "
                    f"#{request_id}."
                ),
            },
        )

    return {
        "message": "Your interest has been recorded.",
        "request_id": request_id,
        "response_status": "interested",
        "notice": (
            "This is a preliminary software match, "
            "not medical clearance."
        ),
    }


# --------------------------------------------------
# 5. REQUESTER VIEWS DONOR RESPONSES
# --------------------------------------------------

@router.get("/{request_id}/responses")
def get_blood_request_responses(
    request_id: int,
    current_user: dict = Depends(get_current_user),
):
    with engine.connect() as connection:
        blood_request = connection.execute(
            text("""
                SELECT request_id, requester_id
                FROM blood_requests
                WHERE request_id = :request_id
            """),
            {"request_id": request_id},
        ).mappings().first()

        if not blood_request:
            raise HTTPException(
                status_code=404,
                detail="Blood request not found.",
            )

        if blood_request["requester_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to view these responses.",
            )

        responses = connection.execute(
            text("""
                SELECT
                    dr.response_id,
                    dr.request_id,
                    dr.response_status,
                    dr.responded_at,
                    dp.donor_id,
                    u.full_name,
                    dp.blood_group,
                    dp.city,
                    dp.state
                FROM donor_responses dr
                JOIN donor_profiles dp
                    ON dr.donor_id = dp.donor_id
                JOIN users u
                    ON dp.user_id = u.user_id
                WHERE dr.request_id = :request_id
                ORDER BY dr.responded_at DESC
            """),
            {"request_id": request_id},
        ).mappings().all()

    return {
        "request_id": request_id,
        "total_responses": len(responses),
        "responses": [dict(response) for response in responses],
    }


# --------------------------------------------------
# 6. ACCEPT OR DECLINE A DONOR RESPONSE
#    AND NOTIFY THE DONOR
# --------------------------------------------------

@router.patch("/{request_id}/responses/{response_id}")
def update_donor_response(
    request_id: int,
    response_id: int,
    status: Literal["accepted", "declined"],
    current_user: dict = Depends(get_current_user),
):
    with engine.begin() as connection:
        blood_request = connection.execute(
            text("""
                SELECT request_id, requester_id, status
                FROM blood_requests
                WHERE request_id = :request_id
            """),
            {"request_id": request_id},
        ).mappings().first()

        if not blood_request:
            raise HTTPException(
                status_code=404,
                detail="Blood request not found.",
            )

        if blood_request["requester_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to update these responses.",
            )

        if blood_request["status"] != "open":
            raise HTTPException(
                status_code=400,
                detail="Only open blood requests can be updated.",
            )

        donor_response = connection.execute(
            text("""
                SELECT response_id, donor_id, response_status
                FROM donor_responses
                WHERE response_id = :response_id
                  AND request_id = :request_id
            """),
            {
                "response_id": response_id,
                "request_id": request_id,
            },
        ).mappings().first()

        if not donor_response:
            raise HTTPException(
                status_code=404,
                detail="Donor response not found for this request.",
            )

        # Update the donor response
        connection.execute(
            text("""
                UPDATE donor_responses
                SET response_status = :status
                WHERE response_id = :response_id
            """),
            {
                "status": status,
                "response_id": response_id,
            },
        )

        # Find the user associated with this donor
        donor_user = connection.execute(
            text("""
                SELECT user_id
                FROM donor_profiles
                WHERE donor_id = :donor_id
            """),
            {"donor_id": donor_response["donor_id"]},
        ).mappings().first()

        # Save the notification in the same transaction
        if donor_user:
            message = (
                f"Your response to blood request #{request_id} "
                f"has been {status}."
            )

            connection.execute(
                text("""
                    INSERT INTO notifications (user_id, message)
                    VALUES (:user_id, :message)
                """),
                {
                    "user_id": donor_user["user_id"],
                    "message": message,
                },
            )

    return {
        "message": f"Donor response {status} successfully.",
        "request_id": request_id,
        "response_id": response_id,
        "response_status": status,
        "notification_created": True,
    }