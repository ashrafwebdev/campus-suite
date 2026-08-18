import uuid
from datetime import date

from sqlalchemy.orm import Session

from app.models.certificate import Certificate, CertificateType
from app.models.student import Student
from app.schemas.certificate import (
    CertificateIssueCreate,
    CertificateTypeCreate,
    CertificateTypeUpdate,
)

STATUS_ISSUED = 1
STATUS_REVOKED = 2

STUDENT_STATUS_GRADUATED = 3


class CertificateError(Exception):
    """Raised for certificate rule violations."""


# -- Certificate Type -------------------------------------------------------

def list_certificate_types(db: Session) -> list[CertificateType]:
    return db.query(CertificateType).all()


def get_certificate_type(db: Session, certificate_type_id: int) -> CertificateType | None:
    return db.query(CertificateType).filter(CertificateType.id == certificate_type_id).first()


def create_certificate_type(db: Session, data: CertificateTypeCreate) -> CertificateType:
    obj = CertificateType(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_certificate_type(
    db: Session, obj: CertificateType, data: CertificateTypeUpdate
) -> CertificateType:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_certificate_type(db: Session, obj: CertificateType) -> None:
    db.delete(obj)
    db.commit()


# -- Certificate --------------------------------------------------------

def list_certificates(
    db: Session,
    student_id: int | None = None,
    certificate_type_id: int | None = None,
    status: int | None = None,
) -> list[Certificate]:
    query = db.query(Certificate)
    if student_id:
        query = query.filter(Certificate.student_id == student_id)
    if certificate_type_id:
        query = query.filter(Certificate.certificate_type_id == certificate_type_id)
    if status:
        query = query.filter(Certificate.status == status)
    return query.order_by(Certificate.id.desc()).all()


def get_certificate(db: Session, certificate_id: int) -> Certificate | None:
    return db.query(Certificate).filter(Certificate.id == certificate_id).first()


def issue_certificate(
    db: Session, data: CertificateIssueCreate, issued_by_id: int | None = None
) -> Certificate:
    cert_type = (
        db.query(CertificateType).filter(CertificateType.id == data.certificate_type_id).first()
    )
    if not cert_type or not cert_type.is_active:
        raise CertificateError("Certificate type not found or inactive")

    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise CertificateError("Student not found")

    if cert_type.requires_graduation and student.status != STUDENT_STATUS_GRADUATED:
        raise CertificateError(
            f"'{cert_type.name}' can only be issued to a graduated student"
        )

    existing = (
        db.query(Certificate)
        .filter(Certificate.student_id == data.student_id)
        .filter(Certificate.certificate_type_id == data.certificate_type_id)
        .filter(Certificate.status == STATUS_ISSUED)
        .first()
    )
    if existing:
        raise CertificateError(
            f"An active '{cert_type.name}' certificate has already been issued to this student"
        )

    certificate = Certificate(
        certificate_no=f"CERT{uuid.uuid4().hex[:8].upper()}",
        certificate_type_id=data.certificate_type_id,
        student_id=data.student_id,
        issue_date=data.issue_date or date.today(),
        issued_by_id=issued_by_id,
        remarks=data.remarks,
        status=STATUS_ISSUED,
    )
    db.add(certificate)
    db.commit()
    db.refresh(certificate)
    return certificate


def revoke_certificate(db: Session, certificate: Certificate, reason: str) -> Certificate:
    if certificate.status == STATUS_REVOKED:
        raise CertificateError("Certificate is already revoked")

    certificate.status = STATUS_REVOKED
    certificate.revoked_reason = reason
    certificate.revoked_date = date.today()
    db.commit()
    db.refresh(certificate)
    return certificate
