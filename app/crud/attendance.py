from datetime import date

from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.student import Student
from app.schemas.attendance import AttendanceBulkMark, RosterEntry

STATUS_PRESENT = 1
STATUS_ABSENT = 2
STATUS_LATE = 3
STATUS_EXCUSED = 4


def get_roster(db: Session, class_id: int, on_date: date) -> list[RosterEntry]:
    students = (
        db.query(Student)
        .filter(Student.class_id == class_id, Student.status == 1)
        .order_by(Student.name)
        .all()
    )
    marks = {
        a.student_id: a
        for a in db.query(Attendance).filter(Attendance.class_id == class_id, Attendance.date == on_date).all()
    }
    return [
        RosterEntry(
            student_id=s.id,
            student_name=s.name,
            admission_no=s.admission_no,
            status=marks[s.id].status if s.id in marks else None,
            note=marks[s.id].note if s.id in marks else None,
        )
        for s in students
    ]


def bulk_mark(db: Session, data: AttendanceBulkMark, marked_by_id: int | None) -> list[Attendance]:
    existing = {
        a.student_id: a
        for a in db.query(Attendance).filter(Attendance.class_id == data.class_id, Attendance.date == data.date).all()
    }
    results = []
    for entry in data.entries:
        record = existing.get(entry.student_id)
        if record:
            record.status = entry.status
            record.note = entry.note
            record.marked_by_id = marked_by_id
        else:
            record = Attendance(
                student_id=entry.student_id,
                class_id=data.class_id,
                date=data.date,
                status=entry.status,
                note=entry.note,
                marked_by_id=marked_by_id,
            )
            db.add(record)
        results.append(record)
    db.commit()
    for record in results:
        db.refresh(record)
    return results


def list_attendance(
    db: Session,
    student_id: int | None = None,
    class_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[Attendance]:
    query = db.query(Attendance)
    if student_id:
        query = query.filter(Attendance.student_id == student_id)
    if class_id:
        query = query.filter(Attendance.class_id == class_id)
    if date_from:
        query = query.filter(Attendance.date >= date_from)
    if date_to:
        query = query.filter(Attendance.date <= date_to)
    return query.order_by(Attendance.date.desc()).all()
