from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.database import get_db
from app.crud import admission as crud
from app.crud.student import create_student
from app.schemas.admission import AdmissionEnquiryCreate, AdmissionEnquiryRead, AdmissionEnquiryUpdate
from app.schemas.student import StudentCreate, StudentRead

router = APIRouter()


@router.get("", response_model=list[AdmissionEnquiryRead], dependencies=[Depends(require_permission("admission.enquiry"))])
def list_enquiries(status: int | None = Query(default=None), db: Session = Depends(get_db)):
    return crud.list_enquiries(db, status)


@router.post("", response_model=AdmissionEnquiryRead, dependencies=[Depends(require_permission("admission.enquiry_store"))])
def create_enquiry(data: AdmissionEnquiryCreate, db: Session = Depends(get_db)):
    return crud.create_enquiry(db, data)


@router.get("/{enquiry_id}", response_model=AdmissionEnquiryRead, dependencies=[Depends(require_permission("admission.enquiry"))])
def get_enquiry(enquiry_id: int, db: Session = Depends(get_db)):
    obj = crud.get_enquiry(db, enquiry_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Enquiry not found")
    return obj


@router.put("/{enquiry_id}", response_model=AdmissionEnquiryRead, dependencies=[Depends(require_permission("admission.enquiry_update"))])
def update_enquiry(enquiry_id: int, data: AdmissionEnquiryUpdate, db: Session = Depends(get_db)):
    obj = crud.get_enquiry(db, enquiry_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Enquiry not found")
    return crud.update_enquiry(db, obj, data)


@router.delete("/{enquiry_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("admission.enquiry_destroy"))])
def delete_enquiry(enquiry_id: int, db: Session = Depends(get_db)):
    obj = crud.get_enquiry(db, enquiry_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Enquiry not found")
    crud.delete_enquiry(db, obj)


@router.post("/{enquiry_id}/convert", response_model=StudentRead, dependencies=[Depends(require_permission("admission.enquiry_convert"))])
def convert_to_student(enquiry_id: int, db: Session = Depends(get_db)):
    enquiry = crud.get_enquiry(db, enquiry_id)
    if not enquiry:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Enquiry not found")
    if enquiry.student_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Enquiry already converted")

    student = create_student(
        db,
        StudentCreate(
            name=enquiry.name,
            email=enquiry.email,
            phone_no=enquiry.phone_no,
            guardian_name=enquiry.guardian_name,
            guardian_phone_no=enquiry.guardian_phone_no,
            permanent_address=enquiry.address,
            class_id=enquiry.class_id,
        ),
    )

    enquiry.student_id = student.id
    crud.mark_admitted(db, enquiry)

    return student
