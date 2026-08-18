from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.database import get_db
from app.crud import student as crud
from app.schemas.student import StudentCreate, StudentRead, StudentUpdate

router = APIRouter()


@router.get("", response_model=list[StudentRead], dependencies=[Depends(require_permission("student.index"))])
def list_students(
    class_id: int | None = Query(default=None),
    section_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return crud.list_students(db, class_id, section_id)


@router.post("", response_model=StudentRead, dependencies=[Depends(require_permission("student.store"))])
def create_student(data: StudentCreate, db: Session = Depends(get_db)):
    return crud.create_student(db, data)


@router.get("/{student_id}", response_model=StudentRead, dependencies=[Depends(require_permission("student.show"))])
def get_student(student_id: int, db: Session = Depends(get_db)):
    obj = crud.get_student(db, student_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    return obj


@router.put("/{student_id}", response_model=StudentRead, dependencies=[Depends(require_permission("student.update"))])
def update_student(student_id: int, data: StudentUpdate, db: Session = Depends(get_db)):
    obj = crud.get_student(db, student_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    return crud.update_student(db, obj, data)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("student.destroy"))])
def delete_student(student_id: int, db: Session = Depends(get_db)):
    obj = crud.get_student(db, student_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    crud.delete_student(db, obj)
