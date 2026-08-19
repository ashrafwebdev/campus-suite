from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.crud import attendance as crud
from app.models.user import User
from app.schemas.attendance import AttendanceBulkMark, AttendanceRead, RosterEntry

router = APIRouter()


@router.get("/roster", response_model=list[RosterEntry], dependencies=[Depends(require_permission("attendance.index"))])
def get_roster(class_id: int = Query(...), date: date = Query(...), db: Session = Depends(get_db)):
    return crud.get_roster(db, class_id, date)


@router.post("/mark", response_model=list[AttendanceRead], dependencies=[Depends(require_permission("attendance.mark"))])
def mark_attendance(
    data: AttendanceBulkMark,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.bulk_mark(db, data, marked_by_id=current_user.id)


@router.get("", response_model=list[AttendanceRead], dependencies=[Depends(require_permission("attendance.index"))])
def list_attendance(
    student_id: int | None = Query(default=None),
    class_id: int | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return crud.list_attendance(db, student_id, class_id, date_from, date_to)
