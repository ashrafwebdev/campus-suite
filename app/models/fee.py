from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

MONEY = Numeric(10, 2)


class FeeHead(TimestampMixin, Base):
    """A fee category, e.g. Tuition Fee, Admission Fee, Exam Fee, Transport Fee."""

    __tablename__ = "fee_heads"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Invoice(TimestampMixin, Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_no: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    fee_head_id: Mapped[int] = mapped_column(ForeignKey("fee_heads.id"))

    amount: Mapped[Decimal] = mapped_column(MONEY)
    discount: Mapped[Decimal] = mapped_column(MONEY, default=0)
    fine: Mapped[Decimal] = mapped_column(MONEY, default=0)

    issued_date: Mapped[date] = mapped_column(Date)
    due_date: Mapped[date] = mapped_column(Date)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 1 = Unpaid, 2 = Partial, 3 = Paid, 4 = Cancelled
    status: Mapped[int] = mapped_column(Integer, default=1)

    student: Mapped["Student"] = relationship()
    fee_head: Mapped["FeeHead"] = relationship()
    payments: Mapped[list["Payment"]] = relationship(back_populates="invoice")


class Payment(TimestampMixin, Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id"))
    amount: Mapped[Decimal] = mapped_column(MONEY)
    payment_date: Mapped[date] = mapped_column(Date)
    # 1 = Cash, 2 = Bank Transfer, 3 = Mobile Banking, 4 = Card, 5 = Cheque
    method: Mapped[int] = mapped_column(Integer, default=1)
    reference_no: Mapped[str | None] = mapped_column(String(100), nullable=True)
    received_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    invoice: Mapped["Invoice"] = relationship(back_populates="payments")
