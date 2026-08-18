from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class EmployeeBase(BaseModel):
    name: str
    designation: str
    phone_no: str | None = None
    email: str | None = None
    joining_date: date | None = None
    basic_salary: Decimal = Decimal("0")
    user_id: int | None = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: str | None = None
    designation: str | None = None
    phone_no: str | None = None
    email: str | None = None
    basic_salary: Decimal | None = None
    status: int | None = None


class EmployeeRead(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_no: str
    joining_date: date
    status: int


class LeaveRequestCreate(BaseModel):
    employee_id: int
    leave_type: int = 1
    start_date: date
    end_date: date
    reason: str | None = None


class LeaveDecision(BaseModel):
    note: str | None = None


class LeaveRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    leave_type: int
    start_date: date
    end_date: date
    reason: str | None = None
    status: int
    approved_by_id: int | None = None
    decided_date: date | None = None
    decision_note: str | None = None


class PayrollGenerate(BaseModel):
    employee_id: int
    month: int
    year: int
    allowances: Decimal = Decimal("0")
    deductions: Decimal = Decimal("0")


class PayrollRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    month: int
    year: int
    basic_salary: Decimal
    allowances: Decimal
    deductions: Decimal
    net_salary: Decimal
    status: int
    paid_date: date | None = None
