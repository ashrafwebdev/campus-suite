from sqlalchemy.orm import Session

from app.models.academic import SchoolClass, Section, Subject
from app.schemas.academic import (
    SchoolClassCreate,
    SchoolClassUpdate,
    SectionCreate,
    SectionUpdate,
    SubjectCreate,
    SubjectUpdate,
)


# -- School Class -----------------------------------------------------------

def list_classes(db: Session) -> list[SchoolClass]:
    return db.query(SchoolClass).order_by(SchoolClass.order).all()


def get_class(db: Session, class_id: int) -> SchoolClass | None:
    return db.query(SchoolClass).filter(SchoolClass.id == class_id).first()


def create_class(db: Session, data: SchoolClassCreate) -> SchoolClass:
    obj = SchoolClass(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_class(db: Session, obj: SchoolClass, data: SchoolClassUpdate) -> SchoolClass:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_class(db: Session, obj: SchoolClass) -> None:
    db.delete(obj)
    db.commit()


# -- Section ------------------------------------------------------------

def list_sections(db: Session, class_id: int | None = None) -> list[Section]:
    query = db.query(Section)
    if class_id:
        query = query.filter(Section.class_id == class_id)
    return query.all()


def get_section(db: Session, section_id: int) -> Section | None:
    return db.query(Section).filter(Section.id == section_id).first()


def create_section(db: Session, data: SectionCreate) -> Section:
    obj = Section(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_section(db: Session, obj: Section, data: SectionUpdate) -> Section:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_section(db: Session, obj: Section) -> None:
    db.delete(obj)
    db.commit()


# -- Subject ------------------------------------------------------------

def list_subjects(db: Session, class_id: int | None = None) -> list[Subject]:
    query = db.query(Subject)
    if class_id:
        query = query.filter(Subject.class_id == class_id)
    return query.all()


def get_subject(db: Session, subject_id: int) -> Subject | None:
    return db.query(Subject).filter(Subject.id == subject_id).first()


def create_subject(db: Session, data: SubjectCreate) -> Subject:
    obj = Subject(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_subject(db: Session, obj: Subject, data: SubjectUpdate) -> Subject:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_subject(db: Session, obj: Subject) -> None:
    db.delete(obj)
    db.commit()
