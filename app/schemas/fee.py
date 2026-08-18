from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class FeeHeadBase(BaseModel):
    name: str
    description: str | None = None


class FeeHeadCreate(FeeHeadBase):
    pass


class FeeHeadUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None


class FeeHeadRead(FeeHeadBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool


class InvoiceCreate(BaseModel):
    student_id: int
    fee_head_id: int
    amount: Decimal
    discount: Decimal = Decimal("0")
    fine: Decimal = Decimal("0")
    issued_date: date | None = None
    due_date: date
    note: str | None = None


class InvoiceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_no: str
    student_id: int
    fee_head_id: int
    amount: Decimal
    discount: Decimal
    fine: Decimal
    issued_date: date
    due_date: date
    note: str | None = None
    status: int
    paid_amount: Decimal = Decimal("0")
    balance: Decimal = Decimal("0")


class PaymentCreate(BaseModel):
    amount: Decimal
    payment_date: date | None = None
    method: int = 1
    reference_no: str | None = None
    note: str | None = None


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_id: int
    amount: Decimal
    payment_date: date
    method: int
    reference_no: str | None = None
    received_by_id: int | None = None
    note: str | None = None
