from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.hostel import Hostel, HostelAllocation, HostelRoom
from app.models.student import Student
from app.schemas.hostel import (
    HostelAllocationCreate,
    HostelCreate,
    HostelRoomCreate,
    HostelRoomUpdate,
    HostelUpdate,
)

STATUS_ACTIVE = 1
STATUS_VACATED = 2

RESIDENCY_DAY_SCHOLAR = 1
RESIDENCY_HOSTELLER = 2


class HostelError(Exception):
    """Raised for hostel allocation rule violations."""


# -- Hostel ---------------------------------------------------------------

def list_hostels(db: Session) -> list[Hostel]:
    return db.query(Hostel).all()


def get_hostel(db: Session, hostel_id: int) -> Hostel | None:
    return db.query(Hostel).filter(Hostel.id == hostel_id).first()


def create_hostel(db: Session, data: HostelCreate) -> Hostel:
    obj = Hostel(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_hostel(db: Session, obj: Hostel, data: HostelUpdate) -> Hostel:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_hostel(db: Session, obj: Hostel) -> None:
    db.delete(obj)
    db.commit()


# -- Room -------------------------------------------------------------

def _occupied_counts(db: Session, room_ids: list[int]) -> dict[int, int]:
    if not room_ids:
        return {}
    rows = (
        db.query(HostelAllocation.room_id, func.count(HostelAllocation.id))
        .filter(HostelAllocation.room_id.in_(room_ids))
        .filter(HostelAllocation.status == STATUS_ACTIVE)
        .group_by(HostelAllocation.room_id)
        .all()
    )
    return dict(rows)


def list_rooms(db: Session, hostel_id: int | None = None) -> list[tuple[HostelRoom, int]]:
    query = db.query(HostelRoom)
    if hostel_id:
        query = query.filter(HostelRoom.hostel_id == hostel_id)
    rooms = query.all()
    counts = _occupied_counts(db, [r.id for r in rooms])
    return [(room, counts.get(room.id, 0)) for room in rooms]


def get_room(db: Session, room_id: int) -> HostelRoom | None:
    return db.query(HostelRoom).filter(HostelRoom.id == room_id).first()


def room_occupied_count(db: Session, room_id: int) -> int:
    return (
        db.query(func.count(HostelAllocation.id))
        .filter(HostelAllocation.room_id == room_id)
        .filter(HostelAllocation.status == STATUS_ACTIVE)
        .scalar()
        or 0
    )


def create_room(db: Session, data: HostelRoomCreate) -> HostelRoom:
    obj = HostelRoom(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_room(db: Session, obj: HostelRoom, data: HostelRoomUpdate) -> HostelRoom:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_room(db: Session, obj: HostelRoom) -> None:
    db.delete(obj)
    db.commit()


# -- Allocation ---------------------------------------------------------

def list_allocations(
    db: Session,
    student_id: int | None = None,
    room_id: int | None = None,
    status: int | None = None,
) -> list[HostelAllocation]:
    query = db.query(HostelAllocation)
    if student_id:
        query = query.filter(HostelAllocation.student_id == student_id)
    if room_id:
        query = query.filter(HostelAllocation.room_id == room_id)
    if status:
        query = query.filter(HostelAllocation.status == status)
    return query.order_by(HostelAllocation.id.desc()).all()


def get_allocation(db: Session, allocation_id: int) -> HostelAllocation | None:
    return db.query(HostelAllocation).filter(HostelAllocation.id == allocation_id).first()


def allocate(db: Session, data: HostelAllocationCreate) -> HostelAllocation:
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise HostelError("Student not found")

    room = db.query(HostelRoom).filter(HostelRoom.id == data.room_id).first()
    if not room or not room.is_active:
        raise HostelError("Room not found or inactive")

    existing = (
        db.query(HostelAllocation)
        .filter(HostelAllocation.student_id == data.student_id)
        .filter(HostelAllocation.status == STATUS_ACTIVE)
        .first()
    )
    if existing:
        raise HostelError("Student already has an active room allocation")

    if room_occupied_count(db, room.id) >= room.capacity:
        raise HostelError("Room is at full capacity")

    allocation = HostelAllocation(
        student_id=data.student_id,
        room_id=data.room_id,
        bed_no=data.bed_no,
        allocated_date=data.allocated_date or date.today(),
        note=data.note,
        status=STATUS_ACTIVE,
    )
    db.add(allocation)

    student.residency_type = RESIDENCY_HOSTELLER
    student.hostel_room_no = room.room_no

    db.commit()
    db.refresh(allocation)
    return allocation


def vacate(db: Session, allocation: HostelAllocation) -> HostelAllocation:
    if allocation.status == STATUS_VACATED:
        raise HostelError("Allocation is already vacated")

    allocation.status = STATUS_VACATED
    allocation.vacated_date = date.today()

    student = db.query(Student).filter(Student.id == allocation.student_id).first()
    if student:
        student.residency_type = RESIDENCY_DAY_SCHOLAR
        student.hostel_room_no = None

    db.commit()
    db.refresh(allocation)
    return allocation
