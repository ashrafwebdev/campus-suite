import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.fee import FeeHead, Invoice, Payment
from app.schemas.fee import FeeHeadCreate, FeeHeadUpdate, InvoiceCreate, PaymentCreate

STATUS_UNPAID = 1
STATUS_PARTIAL = 2
STATUS_PAID = 3
STATUS_CANCELLED = 4


class FeeError(Exception):
    """Raised for fee/invoice/payment rule violations."""


# -- Fee Head ---------------------------------------------------------------

def list_fee_heads(db: Session) -> list[FeeHead]:
    return db.query(FeeHead).all()


def get_fee_head(db: Session, fee_head_id: int) -> FeeHead | None:
    return db.query(FeeHead).filter(FeeHead.id == fee_head_id).first()


def create_fee_head(db: Session, data: FeeHeadCreate) -> FeeHead:
    obj = FeeHead(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_fee_head(db: Session, obj: FeeHead, data: FeeHeadUpdate) -> FeeHead:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_fee_head(db: Session, obj: FeeHead) -> None:
    db.delete(obj)
    db.commit()


# -- Invoice ------------------------------------------------------------

def invoice_paid_amount(db: Session, invoice_id: int) -> Decimal:
    total = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.invoice_id == invoice_id)
        .scalar()
    )
    return Decimal(total)


def invoice_balance(invoice: Invoice, paid_amount: Decimal) -> Decimal:
    return invoice.amount + invoice.fine - invoice.discount - paid_amount


def list_invoices(
    db: Session, student_id: int | None = None, status: int | None = None
) -> list[Invoice]:
    query = db.query(Invoice)
    if student_id:
        query = query.filter(Invoice.student_id == student_id)
    if status:
        query = query.filter(Invoice.status == status)
    return query.order_by(Invoice.id.desc()).all()


def get_invoice(db: Session, invoice_id: int) -> Invoice | None:
    return db.query(Invoice).filter(Invoice.id == invoice_id).first()


def create_invoice(db: Session, data: InvoiceCreate) -> Invoice:
    if data.amount <= 0:
        raise FeeError("Invoice amount must be greater than zero")

    obj = Invoice(
        invoice_no=f"INV{uuid.uuid4().hex[:8].upper()}",
        student_id=data.student_id,
        fee_head_id=data.fee_head_id,
        amount=data.amount,
        discount=data.discount,
        fine=data.fine,
        issued_date=data.issued_date or date.today(),
        due_date=data.due_date,
        note=data.note,
        status=STATUS_UNPAID,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def cancel_invoice(db: Session, invoice: Invoice) -> Invoice:
    if invoice.status == STATUS_CANCELLED:
        raise FeeError("Invoice is already cancelled")
    if invoice_paid_amount(db, invoice.id) > 0:
        raise FeeError("Cannot cancel an invoice that already has payments")

    invoice.status = STATUS_CANCELLED
    db.commit()
    db.refresh(invoice)
    return invoice


# -- Payment --------------------------------------------------------------

def list_payments(db: Session, invoice_id: int) -> list[Payment]:
    return (
        db.query(Payment)
        .filter(Payment.invoice_id == invoice_id)
        .order_by(Payment.id.desc())
        .all()
    )


def record_payment(
    db: Session, invoice: Invoice, data: PaymentCreate, received_by_id: int | None = None
) -> Payment:
    if invoice.status == STATUS_CANCELLED:
        raise FeeError("Cannot record a payment against a cancelled invoice")
    if data.amount <= 0:
        raise FeeError("Payment amount must be greater than zero")

    paid_so_far = invoice_paid_amount(db, invoice.id)
    balance = invoice_balance(invoice, paid_so_far)
    if data.amount > balance:
        raise FeeError(f"Payment exceeds due balance ({balance})")

    payment = Payment(
        invoice_id=invoice.id,
        amount=data.amount,
        payment_date=data.payment_date or date.today(),
        method=data.method,
        reference_no=data.reference_no,
        received_by_id=received_by_id,
        note=data.note,
    )
    db.add(payment)

    total_due = invoice.amount + invoice.fine - invoice.discount
    new_paid_total = paid_so_far + data.amount
    invoice.status = STATUS_PAID if new_paid_total >= total_due else STATUS_PARTIAL

    db.commit()
    db.refresh(payment)
    return payment
