from datetime import date

from pydantic import BaseModel, ConfigDict


class CertificateTypeBase(BaseModel):
    name: str
    description: str | None = None
    requires_graduation: bool = False


class CertificateTypeCreate(CertificateTypeBase):
    pass


class CertificateTypeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    requires_graduation: bool | None = None
    is_active: bool | None = None


class CertificateTypeRead(CertificateTypeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool


class CertificateIssueCreate(BaseModel):
    certificate_type_id: int
    student_id: int
    issue_date: date | None = None
    remarks: str | None = None


class CertificateRevoke(BaseModel):
    reason: str


class CertificateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    certificate_no: str
    certificate_type_id: int
    student_id: int
    issue_date: date
    issued_by_id: int | None = None
    remarks: str | None = None
    status: int
    revoked_reason: str | None = None
    revoked_date: date | None = None
