from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class SchoolClass(TimestampMixin, Base):
    """A grade/standard/year level, e.g. 'Class 5' or 'Grade 10'."""

    __tablename__ = "school_classes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    sections: Mapped[list["Section"]] = relationship(back_populates="school_class")
    subjects: Mapped[list["Subject"]] = relationship(back_populates="school_class")


class Section(TimestampMixin, Base):
    __tablename__ = "sections"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    capacity: Mapped[int] = mapped_column(Integer, default=40)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    class_id: Mapped[int] = mapped_column(ForeignKey("school_classes.id"))
    teacher_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    school_class: Mapped["SchoolClass"] = relationship(back_populates="sections")
    students: Mapped[list["Student"]] = relationship(back_populates="section")


class Subject(TimestampMixin, Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    code: Mapped[str] = mapped_column(String(50))
    # 1=Core, 2=Elective, 3=Selective
    subject_type: Mapped[int] = mapped_column(Integer, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    class_id: Mapped[int] = mapped_column(ForeignKey("school_classes.id"))
    school_class: Mapped["SchoolClass"] = relationship(back_populates="subjects")
