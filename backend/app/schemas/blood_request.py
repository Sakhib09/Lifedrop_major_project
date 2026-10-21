from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

BloodGroup = Literal["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
Urgency = Literal["normal", "urgent", "emergency"]


class BloodRequestCreate(BaseModel):
    blood_group: BloodGroup
    units_required: int = Field(gt=0, le=100)
    hospital_name: str | None = Field(default=None, max_length=150)
    city: str = Field(min_length=2, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    urgency: Urgency = "normal"
    required_by: date | None = None


class BloodRequestResponse(BaseModel):
    request_id: int
    requester_id: int
    blood_group: BloodGroup
    units_required: int
    hospital_name: str | None
    city: str
    state: str | None
    urgency: Urgency
    status: Literal["open", "fulfilled", "cancelled"]
    required_by: date | None