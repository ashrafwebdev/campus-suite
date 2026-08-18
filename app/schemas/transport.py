from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class VehicleBase(BaseModel):
    registration_no: str
    vehicle_type: str
    capacity: int = 1
    driver_name: str | None = None
    driver_phone: str | None = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    vehicle_type: str | None = None
    capacity: int | None = None
    driver_name: str | None = None
    driver_phone: str | None = None
    is_active: bool | None = None


class VehicleRead(VehicleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool


class RouteBase(BaseModel):
    name: str
    fare: Decimal = Decimal("0")
    vehicle_id: int | None = None


class RouteCreate(RouteBase):
    pass


class RouteUpdate(BaseModel):
    name: str | None = None
    fare: Decimal | None = None
    vehicle_id: int | None = None
    is_active: bool | None = None


class RouteRead(RouteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    capacity: int | None = None
    occupied: int = 0


class RouteStopBase(BaseModel):
    route_id: int
    name: str
    sequence: int = 0


class RouteStopCreate(RouteStopBase):
    pass


class RouteStopUpdate(BaseModel):
    name: str | None = None
    sequence: int | None = None


class RouteStopRead(RouteStopBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class TransportAllocationCreate(BaseModel):
    student_id: int
    route_id: int
    stop_id: int | None = None
    start_date: date | None = None
    note: str | None = None


class TransportAllocationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    route_id: int
    stop_id: int | None = None
    start_date: date
    end_date: date | None = None
    status: int
    note: str | None = None
