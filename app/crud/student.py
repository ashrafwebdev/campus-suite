import uuid

from sqlalchemy.orm import Session

from app.models.student import Student
from app.schemas.student import StudentCreate, StudentUpdate


def list_students(db: Session, class_id: int | None = None, section_id: int | None = None) -> list[Student]:
    query = db.query(Student)
    if class_id:
        query = query.filter(Student.class_id == class_id)
    if section_id:
        query = query.filter(Student.section_id == section_id)
    return query.order_by(Student.id.desc()).all()


def get_student(db: Session, student_id: int) -> Student | None:
    return db.query(Student).filter(Student.id == student_id).first()


def create_student(db: Session, data: StudentCreate) -> Student:
    obj = Student(admission_no=f"ADM{uuid.uuid4().hex[:8].upper()}", **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_student(db: Session, obj: Student, data: StudentUpdate) -> Student:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_student(db: Session, obj: Student) -> None:
    db.delete(obj)
    db.commit()
