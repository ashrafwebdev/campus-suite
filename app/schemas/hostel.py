from datetime import date

from pydantic import BaseModel, ConfigDict


class HostelBase(BaseModel):
    name: str
    address: str | None = None
    warden_id: int | None = None


class HostelCreate(HostelBase):
    pass


class HostelUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    warden_id: int | None = None
    is_active: bool | None = None


class HostelRead(HostelBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool


class HostelRoomBase(BaseModel):
    hostel_id: int
    room_no: str
    capacity: int = 1


class HostelRoomCreate(HostelRoomBase):
    pass


class HostelRoomUpdate(BaseModel):
    room_no: str | None = None
    capacity: int | None = None
    is_active: bool | None = None


class HostelRoomRead(HostelRoomBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    occupied: int = 0


class HostelAllocationCreate(BaseModel):
    student_id: int
    room_id: int
    bed_no: str | None = None
    allocated_date: date | None = None
    note: str | None = None


class HostelAllocationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    room_id: int
    bed_no: str | None = None
    allocated_date: date
    vacated_date: date | None = None
    status: int
    note: str | None = None
