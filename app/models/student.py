from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Student(TimestampMixin, Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    admission_no: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[int | None] = mapped_column(Integer, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone_no: Mapped[str | None] = mapped_column(String(20), nullable=True)

    guardian_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    guardian_phone_no: Mapped[str | None] = mapped_column(String(20), nullable=True)
    present_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    permanent_address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 1 = Day Scholar, 2 = Hosteller
    residency_type: Mapped[int] = mapped_column(Integer, default=1)
    hostel_room_no: Mapped[str | None] = mapped_column(String(50), nullable=True)

    class_id: Mapped[int | None] = mapped_column(ForeignKey("school_classes.id"), nullable=True)
    section_id: Mapped[int | None] = mapped_column(ForeignKey("sections.id"), nullable=True)

    # 1 = Active, 2 = Inactive, 3 = Graduated, 4 = Dropped
    status: Mapped[int] = mapped_column(Integer, default=1)

    school_class: Mapped["SchoolClass"] = relationship()
    section: Mapped["Section"] = relationship(back_populates="students")
