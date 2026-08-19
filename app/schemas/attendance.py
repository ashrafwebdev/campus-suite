from datetime import date

from pydantic import BaseModel, ConfigDict


class AttendanceEntry(BaseModel):
    student_id: int
    status: int
    note: str | None = None


class AttendanceBulkMark(BaseModel):
    class_id: int
    date: date
    entries: list[AttendanceEntry]


class AttendanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    class_id: int
    date: date
    status: int
    note: str | None = None
    marked_by_id: int | None = None


class RosterEntry(BaseModel):
    student_id: int
    student_name: str
    admission_no: str
    status: int | None = None
    note: str | None = None
