from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.crud import fee as crud
from app.crud.fee import FeeError
from app.models.user import User
from app.schemas.fee import (
    FeeHeadCreate,
    FeeHeadRead,
    FeeHeadUpdate,
    InvoiceCreate,
    InvoiceRead,
    PaymentCreate,
    PaymentRead,
)

router = APIRouter()


def _to_invoice_read(db: Session, invoice) -> InvoiceRead:
    paid = crud.invoice_paid_amount(db, invoice.id)
    balance = crud.invoice_balance(invoice, paid)
    item = InvoiceRead.model_validate(invoice)
    item.paid_amount = paid
    item.balance = balance
    return item


# -- Fee Heads --------------------------------------------------------------

@router.get("/heads", response_model=list[FeeHeadRead], dependencies=[Depends(require_permission("fee.head"))])
def list_fee_heads(db: Session = Depends(get_db)):
    return crud.list_fee_heads(db)


@router.post("/heads", response_model=FeeHeadRead, dependencies=[Depends(require_permission("fee.head_store"))])
def create_fee_head(data: FeeHeadCreate, db: Session = Depends(get_db)):
    return crud.create_fee_head(db, data)


@router.put("/heads/{fee_head_id}", response_model=FeeHeadRead, dependencies=[Depends(require_permission("fee.head_update"))])
def update_fee_head(fee_head_id: int, data: FeeHeadUpdate, db: Session = Depends(get_db)):
    obj = crud.get_fee_head(db, fee_head_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Fee head not found")
    return crud.update_fee_head(db, obj, data)


@router.delete("/heads/{fee_head_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("fee.head_destroy"))])
def delete_fee_head(fee_head_id: int, db: Session = Depends(get_db)):
    obj = crud.get_fee_head(db, fee_head_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Fee head not found")
    crud.delete_fee_head(db, obj)


# -- Invoices -------------------------------------------------------------

@router.get("/invoices", response_model=list[InvoiceRead], dependencies=[Depends(require_permission("fee.invoice"))])
def list_invoices(
    student_id: int | None = Query(default=None),
    status_: int | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    invoices = crud.list_invoices(db, student_id, status_)
    return [_to_invoice_read(db, inv) for inv in invoices]


@router.post("/invoices", response_model=InvoiceRead, dependencies=[Depends(require_permission("fee.invoice_store"))])
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db)):
    try:
        invoice = crud.create_invoice(db, data)
    except FeeError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))
    return _to_invoice_read(db, invoice)


@router.get("/invoices/{invoice_id}", response_model=InvoiceRead, dependencies=[Depends(require_permission("fee.invoice"))])
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    obj = crud.get_invoice(db, invoice_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")
    return _to_invoice_read(db, obj)


@router.post("/invoices/{invoice_id}/cancel", response_model=InvoiceRead, dependencies=[Depends(require_permission("fee.invoice_cancel"))])
def cancel_invoice(invoice_id: int, db: Session = Depends(get_db)):
    obj = crud.get_invoice(db, invoice_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")
    try:
        crud.cancel_invoice(db, obj)
    except FeeError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))
    return _to_invoice_read(db, obj)


# -- Payments ---------------------------------------------------------

@router.get("/invoices/{invoice_id}/payments", response_model=list[PaymentRead], dependencies=[Depends(require_permission("fee.payment"))])
def list_payments(invoice_id: int, db: Session = Depends(get_db)):
    if not crud.get_invoice(db, invoice_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")
    return crud.list_payments(db, invoice_id)


@router.post("/invoices/{invoice_id}/payments", response_model=PaymentRead, dependencies=[Depends(require_permission("fee.payment_store"))])
def record_payment(
    invoice_id: int,
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = crud.get_invoice(db, invoice_id)
    if not invoice:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")
    try:
        return crud.record_payment(db, invoice, data, received_by_id=current_user.id)
    except FeeError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))
