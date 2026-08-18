from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

MONEY = Numeric(10, 2)
PERCENT = Numeric(5, 2)


class Exam(TimestampMixin, Base):
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class GradeScale(TimestampMixin, Base):
    """A grading band: a percentage range maps to a letter grade and GPA point."""

    __tablename__ = "grade_scales"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(20))
    min_percent: Mapped[Decimal] = mapped_column(PERCENT)
    max_percent: Mapped[Decimal] = mapped_column(PERCENT)
    grade_point: Mapped[Decimal] = mapped_column(Numeric(3, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class ExamRule(TimestampMixin, Base):
    """Defines total/pass marks for one subject of one class, in one exam."""

    __tablename__ = "exam_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id"))
    class_id: Mapped[int] = mapped_column(ForeignKey("school_classes.id"))
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    total_marks: Mapped[Decimal] = mapped_column(MONEY)
    pass_marks: Mapped[Decimal] = mapped_column(MONEY)

    exam: Mapped["Exam"] = relationship()
    school_class: Mapped["SchoolClass"] = relationship()
    subject: Mapped["Subject"] = relationship()


class Mark(TimestampMixin, Base):
    __tablename__ = "marks"

    id: Mapped[int] = mapped_column(primary_key=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id"))
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    marks_obtained: Mapped[Decimal] = mapped_column(MONEY, default=0)
    is_absent: Mapped[bool] = mapped_column(Boolean, default=False)

    exam: Mapped["Exam"] = relationship()
    student: Mapped["Student"] = relationship()
    subject: Mapped["Subject"] = relationship()


class Result(TimestampMixin, Base):
    """Generated summary for one student's performance in one exam."""

    __tablename__ = "results"

    id: Mapped[int] = mapped_column(primary_key=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id"))
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    total_obtained: Mapped[Decimal] = mapped_column(MONEY)
    total_max: Mapped[Decimal] = mapped_column(MONEY)
    percentage: Mapped[Decimal] = mapped_column(PERCENT)
    grade: Mapped[str | None] = mapped_column(String(20), nullable=True)
    grade_point: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), nullable=True)
    is_pass: Mapped[bool] = mapped_column(Boolean, default=False)

    exam: Mapped["Exam"] = relationship()
    student: Mapped["Student"] = relationship()
