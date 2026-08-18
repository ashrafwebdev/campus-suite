import uuid

from sqlalchemy.orm import Session

from app.models.admission import AdmissionEnquiry
from app.schemas.admission import AdmissionEnquiryCreate, AdmissionEnquiryUpdate

STATUS_ADMITTED = 4


def list_enquiries(db: Session, status: int | None = None) -> list[AdmissionEnquiry]:
    query = db.query(AdmissionEnquiry)
    if status:
        query = query.filter(AdmissionEnquiry.status == status)
    return query.order_by(AdmissionEnquiry.id.desc()).all()


def get_enquiry(db: Session, enquiry_id: int) -> AdmissionEnquiry | None:
    return db.query(AdmissionEnquiry).filter(AdmissionEnquiry.id == enquiry_id).first()


def create_enquiry(db: Session, data: AdmissionEnquiryCreate) -> AdmissionEnquiry:
    obj = AdmissionEnquiry(enquiry_no=f"ENQ{uuid.uuid4().hex[:8].upper()}", **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_enquiry(db: Session, obj: AdmissionEnquiry, data: AdmissionEnquiryUpdate) -> AdmissionEnquiry:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_enquiry(db: Session, obj: AdmissionEnquiry) -> None:
    db.delete(obj)
    db.commit()


def mark_admitted(db: Session, obj: AdmissionEnquiry) -> AdmissionEnquiry:
    obj.status = STATUS_ADMITTED
    db.commit()
    db.refresh(obj)
    return obj
