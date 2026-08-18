from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class AdmissionEnquiry(TimestampMixin, Base):
    """A lead captured from advertisement/website/referral/walk-in, tracked
    through to conversion into an enrolled Student."""

    __tablename__ = "admission_enquiries"

    id: Mapped[int] = mapped_column(primary_key=True)
    enquiry_no: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    phone_no: Mapped[str] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    guardian_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    guardian_phone_no: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    class_id: Mapped[int | None] = mapped_column(ForeignKey("school_classes.id"), nullable=True)

    # 1=Advertisement, 2=Website, 3=Referral, 4=Walk-in, 5=Social Media, 6=Other
    source: Mapped[int] = mapped_column(Integer, default=1)
    # 1=New, 2=Contacted, 3=Follow Up, 4=Admitted, 5=Rejected
    status: Mapped[int] = mapped_column(Integer, default=1)

    follow_up_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"), nullable=True)

    school_class: Mapped["SchoolClass"] = relationship()
    student: Mapped["Student"] = relationship()
