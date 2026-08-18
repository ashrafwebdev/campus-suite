from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.database import get_db
from app.crud import academic as crud
from app.schemas.academic import (
    SchoolClassCreate,
    SchoolClassRead,
    SchoolClassUpdate,
    SectionCreate,
    SectionRead,
    SectionUpdate,
    SubjectCreate,
    SubjectRead,
    SubjectUpdate,
)

router = APIRouter()


# -- Classes --------------------------------------------------------------

@router.get("/classes", response_model=list[SchoolClassRead], dependencies=[Depends(require_permission("academic.class"))])
def list_classes(db: Session = Depends(get_db)):
    return crud.list_classes(db)


@router.post("/classes", response_model=SchoolClassRead, dependencies=[Depends(require_permission("academic.class_store"))])
def create_class(data: SchoolClassCreate, db: Session = Depends(get_db)):
    return crud.create_class(db, data)


@router.put("/classes/{class_id}", response_model=SchoolClassRead, dependencies=[Depends(require_permission("academic.class_update"))])
def update_class(class_id: int, data: SchoolClassUpdate, db: Session = Depends(get_db)):
    obj = crud.get_class(db, class_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Class not found")
    return crud.update_class(db, obj, data)


@router.delete("/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("academic.class_destroy"))])
def delete_class(class_id: int, db: Session = Depends(get_db)):
    obj = crud.get_class(db, class_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Class not found")
    crud.delete_class(db, obj)


# -- Sections ---------------------------------------------------------

@router.get("/sections", response_model=list[SectionRead], dependencies=[Depends(require_permission("academic.section"))])
def list_sections(class_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    return crud.list_sections(db, class_id)


@router.post("/sections", response_model=SectionRead, dependencies=[Depends(require_permission("academic.section_store"))])
def create_section(data: SectionCreate, db: Session = Depends(get_db)):
    return crud.create_section(db, data)


@router.put("/sections/{section_id}", response_model=SectionRead, dependencies=[Depends(require_permission("academic.section_update"))])
def update_section(section_id: int, data: SectionUpdate, db: Session = Depends(get_db)):
    obj = crud.get_section(db, section_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Section not found")
    return crud.update_section(db, obj, data)


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("academic.section_destroy"))])
def delete_section(section_id: int, db: Session = Depends(get_db)):
    obj = crud.get_section(db, section_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Section not found")
    crud.delete_section(db, obj)


# -- Subjects ---------------------------------------------------------

@router.get("/subjects", response_model=list[SubjectRead], dependencies=[Depends(require_permission("academic.subject"))])
def list_subjects(class_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    return crud.list_subjects(db, class_id)


@router.post("/subjects", response_model=SubjectRead, dependencies=[Depends(require_permission("academic.subject_store"))])
def create_subject(data: SubjectCreate, db: Session = Depends(get_db)):
    return crud.create_subject(db, data)


@router.put("/subjects/{subject_id}", response_model=SubjectRead, dependencies=[Depends(require_permission("academic.subject_update"))])
def update_subject(subject_id: int, data: SubjectUpdate, db: Session = Depends(get_db)):
    obj = crud.get_subject(db, subject_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Subject not found")
    return crud.update_subject(db, obj, data)


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("academic.subject_destroy"))])
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    obj = crud.get_subject(db, subject_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Subject not found")
    crud.delete_subject(db, obj)
