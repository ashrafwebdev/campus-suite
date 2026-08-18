import uuid
from datetime import date

from sqlalchemy.orm import Session

from app.models.hr import Employee, LeaveRequest, Payroll
from app.models.user import User
from app.schemas.hr import EmployeeCreate, EmployeeUpdate, LeaveRequestCreate, PayrollGenerate

STATUS_ACTIVE = 1
STATUS_RESIGNED = 2

LEAVE_PENDING = 1
LEAVE_APPROVED = 2
LEAVE_REJECTED = 3

PAYROLL_PENDING = 1
PAYROLL_PAID = 2


class HRError(Exception):
    """Raised for HR/payroll rule violations."""


# -- Employee -----------------------------------------------------------

def list_employees(db: Session, status: int | None = None) -> list[Employee]:
    query = db.query(Employee)
    if status:
        query = query.filter(Employee.status == status)
    return query.all()


def get_employee(db: Session, employee_id: int) -> Employee | None:
    return db.query(Employee).filter(Employee.id == employee_id).first()


def create_employee(db: Session, data: EmployeeCreate) -> Employee:
    if data.user_id:
        user = db.query(User).filter(User.id == data.user_id).first()
        if not user:
            raise HRError("User not found")
        if db.query(Employee).filter(Employee.user_id == data.user_id).first():
            raise HRError("This user is already linked to an employee record")

    payload = data.model_dump()
    payload["joining_date"] = payload.get("joining_date") or date.today()

    obj = Employee(employee_no=f"EMP{uuid.uuid4().hex[:8].upper()}", **payload)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_employee(db: Session, obj: Employee, data: EmployeeUpdate) -> Employee:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_employee(db: Session, obj: Employee) -> None:
    db.delete(obj)
    db.commit()


# -- Leave Request --------------------------------------------------------

def list_leave_requests(
    db: Session, employee_id: int | None = None, status: int | None = None
) -> list[LeaveRequest]:
    query = db.query(LeaveRequest)
    if employee_id:
        query = query.filter(LeaveRequest.employee_id == employee_id)
    if status:
        query = query.filter(LeaveRequest.status == status)
    return query.order_by(LeaveRequest.id.desc()).all()


def get_leave_request(db: Session, leave_id: int) -> LeaveRequest | None:
    return db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()


def request_leave(db: Session, data: LeaveRequestCreate) -> LeaveRequest:
    employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not employee or employee.status != STATUS_ACTIVE:
        raise HRError("Employee not found or not active")

    if data.start_date > data.end_date:
        raise HRError("start_date cannot be after end_date")

    leave = LeaveRequest(
        employee_id=data.employee_id,
        leave_type=data.leave_type,
        start_date=data.start_date,
        end_date=data.end_date,
        reason=data.reason,
        status=LEAVE_PENDING,
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave


def _decide_leave(
    db: Session, leave: LeaveRequest, decision: int, decided_by_id: int | None, note: str | None
) -> LeaveRequest:
    if leave.status != LEAVE_PENDING:
        raise HRError("This leave request has already been decided")

    leave.status = decision
    leave.approved_by_id = decided_by_id
    leave.decided_date = date.today()
    leave.decision_note = note
    db.commit()
    db.refresh(leave)
    return leave


def approve_leave(
    db: Session, leave: LeaveRequest, decided_by_id: int | None, note: str | None = None
) -> LeaveRequest:
    return _decide_leave(db, leave, LEAVE_APPROVED, decided_by_id, note)


def reject_leave(
    db: Session, leave: LeaveRequest, decided_by_id: int | None, note: str | None = None
) -> LeaveRequest:
    return _decide_leave(db, leave, LEAVE_REJECTED, decided_by_id, note)


# -- Payroll --------------------------------------------------------------

def list_payrolls(
    db: Session, employee_id: int | None = None, status: int | None = None
) -> list[Payroll]:
    query = db.query(Payroll)
    if employee_id:
        query = query.filter(Payroll.employee_id == employee_id)
    if status:
        query = query.filter(Payroll.status == status)
    return query.order_by(Payroll.id.desc()).all()


def get_payroll(db: Session, payroll_id: int) -> Payroll | None:
    return db.query(Payroll).filter(Payroll.id == payroll_id).first()


def generate_payroll(db: Session, data: PayrollGenerate) -> Payroll:
    if not (1 <= data.month <= 12):
        raise HRError("month must be between 1 and 12")

    employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not employee or employee.status != STATUS_ACTIVE:
        raise HRError("Employee not found or not active")

    existing = (
        db.query(Payroll)
        .filter(Payroll.employee_id == data.employee_id)
        .filter(Payroll.month == data.month)
        .filter(Payroll.year == data.year)
        .first()
    )
    if existing:
        raise HRError("Payroll for this employee/month/year has already been generated")

    net_salary = employee.basic_salary + data.allowances - data.deductions
    if net_salary < 0:
        raise HRError("Deductions cannot exceed basic salary plus allowances")

    payroll = Payroll(
        employee_id=data.employee_id,
        month=data.month,
        year=data.year,
        basic_salary=employee.basic_salary,
        allowances=data.allowances,
        deductions=data.deductions,
        net_salary=net_salary,
        status=PAYROLL_PENDING,
    )
    db.add(payroll)
    db.commit()
    db.refresh(payroll)
    return payroll


def mark_payroll_paid(db: Session, payroll: Payroll) -> Payroll:
    if payroll.status == PAYROLL_PAID:
        raise HRError("Payroll has already been paid")

    payroll.status = PAYROLL_PAID
    payroll.paid_date = date.today()
    db.commit()
    db.refresh(payroll)
    return payroll
