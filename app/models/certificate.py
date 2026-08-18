from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class CertificateType(TimestampMixin, Base):
    """A kind of certificate an institution can issue, e.g. Course Completion,
    Transfer Certificate, Character Certificate."""

    __tablename__ = "certificate_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # If true, issuing this type requires the student's status to be Graduated.
    requires_graduation: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Certificate(TimestampMixin, Base):
    __tablename__ = "certificates"

    id: Mapped[int] = mapped_column(primary_key=True)
    certificate_no: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    certificate_type_id: Mapped[int] = mapped_column(ForeignKey("certificate_types.id"))
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))

    issue_date: Mapped[date] = mapped_column(Date)
    issued_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 1 = Issued, 2 = Revoked
    status: Mapped[int] = mapped_column(Integer, default=1)
    revoked_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    revoked_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    certificate_type: Mapped["CertificateType"] = relationship()
    student: Mapped["Student"] = relationship()
