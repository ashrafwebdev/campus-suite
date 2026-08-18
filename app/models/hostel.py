from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Hostel(TimestampMixin, Base):
    __tablename__ = "hostels"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    warden_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    rooms: Mapped[list["HostelRoom"]] = relationship(back_populates="hostel")


class HostelRoom(TimestampMixin, Base):
    __tablename__ = "hostel_rooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    hostel_id: Mapped[int] = mapped_column(ForeignKey("hostels.id"))
    room_no: Mapped[str] = mapped_column(String(50))
    capacity: Mapped[int] = mapped_column(Integer, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    hostel: Mapped["Hostel"] = relationship(back_populates="rooms")
    allocations: Mapped[list["HostelAllocation"]] = relationship(back_populates="room")


class HostelAllocation(TimestampMixin, Base):
    """Tracks which student occupies which room, over time."""

    __tablename__ = "hostel_allocations"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    room_id: Mapped[int] = mapped_column(ForeignKey("hostel_rooms.id"))
    bed_no: Mapped[str | None] = mapped_column(String(20), nullable=True)
    allocated_date: Mapped[date] = mapped_column(Date)
    vacated_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    # 1 = Active, 2 = Vacated
    status: Mapped[int] = mapped_column(Integer, default=1)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    student: Mapped["Student"] = relationship()
    room: Mapped["HostelRoom"] = relationship(back_populates="allocations")
