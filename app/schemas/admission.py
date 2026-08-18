from datetime import date

from pydantic import BaseModel, ConfigDict


class AdmissionEnquiryBase(BaseModel):
    name: str
    phone_no: str
    email: str | None = None
    guardian_name: str | None = None
    guardian_phone_no: str | None = None
    address: str | None = None
    class_id: int | None = None
    source: int = 1
    follow_up_date: date | None = None
    note: str | None = None


class AdmissionEnquiryCreate(AdmissionEnquiryBase):
    pass


class AdmissionEnquiryUpdate(BaseModel):
    name: str | None = None
    phone_no: str | None = None
    email: str | None = None
    guardian_name: str | None = None
    guardian_phone_no: str | None = None
    address: str | None = None
    class_id: int | None = None
    source: int | None = None
    status: int | None = None
    follow_up_date: date | None = None
    note: str | None = None


class AdmissionEnquiryRead(AdmissionEnquiryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    enquiry_no: str
    status: int
    student_id: int | None = None
