from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.crud import hr as crud
from app.crud.hr import HRError
from app.models.user import User
from app.schemas.hr import (
    EmployeeCreate,
    EmployeeRead,
    EmployeeUpdate,
    LeaveDecision,
    LeaveRequestCreate,
    LeaveRequestRead,
    PayrollGenerate,
    PayrollRead,
)

router = APIRouter()


# -- Employees ----------------------------------------------------------

@router.get("/employees", response_model=list[EmployeeRead], dependencies=[Depends(require_permission("hr.employee"))])
def list_employees(status_: int | None = Query(default=None, alias="status"), db: Session = Depends(get_db)):
    return crud.list_employees(db, status_)


@router.post("/employees", response_model=EmployeeRead, dependencies=[Depends(require_permission("hr.employee_store"))])
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_employee(db, data)
    except HRError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.put("/employees/{employee_id}", response_model=EmployeeRead, dependencies=[Depends(require_permission("hr.employee_update"))])
def update_employee(employee_id: int, data: EmployeeUpdate, db: Session = Depends(get_db)):
    obj = crud.get_employee(db, employee_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found")
    return crud.update_employee(db, obj, data)


@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("hr.employee_destroy"))])
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    obj = crud.get_employee(db, employee_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found")
    crud.delete_employee(db, obj)


# -- Leave Requests -------------------------------------------------------

@router.get("/leaves", response_model=list[LeaveRequestRead], dependencies=[Depends(require_permission("hr.leave"))])
def list_leave_requests(
    employee_id: int | None = Query(default=None),
    status_: int | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    return crud.list_leave_requests(db, employee_id, status_)


@router.post("/leaves", response_model=LeaveRequestRead, dependencies=[Depends(require_permission("hr.leave_store"))])
def request_leave(data: LeaveRequestCreate, db: Session = Depends(get_db)):
    try:
        return crud.request_leave(db, data)
    except HRError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.post("/leaves/{leave_id}/approve", response_model=LeaveRequestRead, dependencies=[Depends(require_permission("hr.leave_decide"))])
def approve_leave(
    leave_id: int,
    data: LeaveDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = crud.get_leave_request(db, leave_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave request not found")
    try:
        return crud.approve_leave(db, obj, current_user.id, data.note)
    except HRError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.post("/leaves/{leave_id}/reject", response_model=LeaveRequestRead, dependencies=[Depends(require_permission("hr.leave_decide"))])
def reject_leave(
    leave_id: int,
    data: LeaveDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = crud.get_leave_request(db, leave_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave request not found")
    try:
        return crud.reject_leave(db, obj, current_user.id, data.note)
    except HRError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


# -- Payroll ------------------------------------------------------------

@router.get("/payroll", response_model=list[PayrollRead], dependencies=[Depends(require_permission("hr.payroll"))])
def list_payrolls(
    employee_id: int | None = Query(default=None),
    status_: int | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    return crud.list_payrolls(db, employee_id, status_)


@router.post("/payroll", response_model=PayrollRead, dependencies=[Depends(require_permission("hr.payroll_generate"))])
def generate_payroll(data: PayrollGenerate, db: Session = Depends(get_db)):
    try:
        return crud.generate_payroll(db, data)
    except HRError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.post("/payroll/{payroll_id}/pay", response_model=PayrollRead, dependencies=[Depends(require_permission("hr.payroll_pay"))])
def pay_payroll(payroll_id: int, db: Session = Depends(get_db)):
    obj = crud.get_payroll(db, payroll_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payroll not found")
    try:
        return crud.mark_payroll_paid(db, obj)
    except HRError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))
