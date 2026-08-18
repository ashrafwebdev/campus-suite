from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

MONEY = Numeric(10, 2)


class Vehicle(TimestampMixin, Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True)
    registration_no: Mapped[str] = mapped_column(String(50), unique=True)
    vehicle_type: Mapped[str] = mapped_column(String(50))
    capacity: Mapped[int] = mapped_column(Integer, default=1)
    driver_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    driver_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    routes: Mapped[list["Route"]] = relationship(back_populates="vehicle")


class Route(TimestampMixin, Base):
    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    fare: Mapped[Decimal] = mapped_column(MONEY, default=0)
    vehicle_id: Mapped[int | None] = mapped_column(ForeignKey("vehicles.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    vehicle: Mapped["Vehicle"] = relationship(back_populates="routes")
    stops: Mapped[list["RouteStop"]] = relationship(back_populates="route")


class RouteStop(TimestampMixin, Base):
    __tablename__ = "route_stops"

    id: Mapped[int] = mapped_column(primary_key=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("routes.id"))
    name: Mapped[str] = mapped_column(String(150))
    sequence: Mapped[int] = mapped_column(Integer, default=0)

    route: Mapped["Route"] = relationship(back_populates="stops")


class TransportAllocation(TimestampMixin, Base):
    """Tracks which student rides which route, over time."""

    __tablename__ = "transport_allocations"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    route_id: Mapped[int] = mapped_column(ForeignKey("routes.id"))
    stop_id: Mapped[int | None] = mapped_column(ForeignKey("route_stops.id"), nullable=True)

    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    # 1 = Active, 2 = Ended
    status: Mapped[int] = mapped_column(Integer, default=1)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    student: Mapped["Student"] = relationship()
    route: Mapped["Route"] = relationship()
    stop: Mapped["RouteStop"] = relationship()
