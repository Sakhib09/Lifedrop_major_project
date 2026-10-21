from datetime import date

from pydantic import BaseModel, Field
from typing import Literal


BloodGroup = Literal["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]


class DonorProfileCreate(BaseModel):
    blood_group: BloodGroup
    date_of_birth: date | None = None
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)


class DonorProfileResponse(BaseModel):
    donor_id: int
    user_id: int
    blood_group: BloodGroup
    date_of_birth: date | None
    city: str
    state: str
    is_available: bool