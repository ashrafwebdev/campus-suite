from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.crud import certificate as crud
from app.crud.certificate import CertificateError
from app.models.user import User
from app.schemas.certificate import (
    CertificateIssueCreate,
    CertificateRead,
    CertificateRevoke,
    CertificateTypeCreate,
    CertificateTypeRead,
    CertificateTypeUpdate,
)

router = APIRouter()


# -- Certificate Types --------------------------------------------------

@router.get("/types", response_model=list[CertificateTypeRead], dependencies=[Depends(require_permission("certificate.type"))])
def list_certificate_types(db: Session = Depends(get_db)):
    return crud.list_certificate_types(db)


@router.post("/types", response_model=CertificateTypeRead, dependencies=[Depends(require_permission("certificate.type_store"))])
def create_certificate_type(data: CertificateTypeCreate, db: Session = Depends(get_db)):
    return crud.create_certificate_type(db, data)


@router.put("/types/{certificate_type_id}", response_model=CertificateTypeRead, dependencies=[Depends(require_permission("certificate.type_update"))])
def update_certificate_type(certificate_type_id: int, data: CertificateTypeUpdate, db: Session = Depends(get_db)):
    obj = crud.get_certificate_type(db, certificate_type_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Certificate type not found")
    return crud.update_certificate_type(db, obj, data)


@router.delete("/types/{certificate_type_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("certificate.type_destroy"))])
def delete_certificate_type(certificate_type_id: int, db: Session = Depends(get_db)):
    obj = crud.get_certificate_type(db, certificate_type_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Certificate type not found")
    crud.delete_certificate_type(db, obj)


# -- Certificates -----------------------------------------------------

@router.get("", response_model=list[CertificateRead], dependencies=[Depends(require_permission("certificate.index"))])
def list_certificates(
    student_id: int | None = Query(default=None),
    certificate_type_id: int | None = Query(default=None),
    status_: int | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    return crud.list_certificates(db, student_id, certificate_type_id, status_)


@router.post("", response_model=CertificateRead, dependencies=[Depends(require_permission("certificate.store"))])
def issue_certificate(
    data: CertificateIssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return crud.issue_certificate(db, data, issued_by_id=current_user.id)
    except CertificateError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.get("/{certificate_id}", response_model=CertificateRead, dependencies=[Depends(require_permission("certificate.index"))])
def get_certificate(certificate_id: int, db: Session = Depends(get_db)):
    obj = crud.get_certificate(db, certificate_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Certificate not found")
    return obj


@router.post("/{certificate_id}/revoke", response_model=CertificateRead, dependencies=[Depends(require_permission("certificate.revoke"))])
def revoke_certificate(certificate_id: int, data: CertificateRevoke, db: Session = Depends(get_db)):
    obj = crud.get_certificate(db, certificate_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Certificate not found")
    try:
        return crud.revoke_certificate(db, obj, data.reason)
    except CertificateError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))
