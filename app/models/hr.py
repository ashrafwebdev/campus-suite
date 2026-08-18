from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

MONEY = Numeric(10, 2)


class Employee(TimestampMixin, Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_no: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    designation: Mapped[str] = mapped_column(String(100))
    phone_no: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    joining_date: Mapped[date] = mapped_column(Date)
    basic_salary: Mapped[Decimal] = mapped_column(MONEY, default=0)
    # 1 = Active, 2 = Resigned/Terminated
    status: Mapped[int] = mapped_column(Integer, default=1)

    user: Mapped["User"] = relationship()


class LeaveRequest(TimestampMixin, Base):
    __tablename__ = "leave_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    # 1=Casual, 2=Sick, 3=Earned, 4=Maternity, 5=Unpaid
    leave_type: Mapped[int] = mapped_column(Integer, default=1)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    # 1 = Pending, 2 = Approved, 3 = Rejected
    status: Mapped[int] = mapped_column(Integer, default=1)
    approved_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    decided_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    decision_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship()


class Payroll(TimestampMixin, Base):
    __tablename__ = "payrolls"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    month: Mapped[int] = mapped_column(Integer)
    year: Mapped[int] = mapped_column(Integer)
    basic_salary: Mapped[Decimal] = mapped_column(MONEY)
    allowances: Mapped[Decimal] = mapped_column(MONEY, default=0)
    deductions: Mapped[Decimal] = mapped_column(MONEY, default=0)
    net_salary: Mapped[Decimal] = mapped_column(MONEY)
    # 1 = Pending, 2 = Paid
    status: Mapped[int] = mapped_column(Integer, default=1)
    paid_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    employee: Mapped["Employee"] = relationship()
