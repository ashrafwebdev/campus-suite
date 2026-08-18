from datetime import date

from pydantic import BaseModel, ConfigDict


class StudentBase(BaseModel):
    name: str
    dob: date | None = None
    gender: int | None = None
    email: str | None = None
    phone_no: str | None = None
    guardian_name: str | None = None
    guardian_phone_no: str | None = None
    present_address: str | None = None
    permanent_address: str | None = None
    residency_type: int = 1
    hostel_room_no: str | None = None
    class_id: int | None = None
    section_id: int | None = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: str | None = None
    dob: date | None = None
    gender: int | None = None
    email: str | None = None
    phone_no: str | None = None
    guardian_name: str | None = None
    guardian_phone_no: str | None = None
    present_address: str | None = None
    permanent_address: str | None = None
    residency_type: int | None = None
    hostel_room_no: str | None = None
    class_id: int | None = None
    section_id: int | None = None
    status: int | None = None


class StudentRead(StudentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    admission_no: str
    status: int
