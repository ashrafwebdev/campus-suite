from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.student import Student
from app.models.transport import Route, RouteStop, TransportAllocation, Vehicle
from app.schemas.transport import (
    RouteCreate,
    RouteStopCreate,
    RouteStopUpdate,
    RouteUpdate,
    TransportAllocationCreate,
    VehicleCreate,
    VehicleUpdate,
)

STATUS_ACTIVE = 1
STATUS_ENDED = 2


class TransportError(Exception):
    """Raised for transport allocation rule violations."""


# -- Vehicle ----------------------------------------------------------------

def list_vehicles(db: Session) -> list[Vehicle]:
    return db.query(Vehicle).all()


def get_vehicle(db: Session, vehicle_id: int) -> Vehicle | None:
    return db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()


def create_vehicle(db: Session, data: VehicleCreate) -> Vehicle:
    obj = Vehicle(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_vehicle(db: Session, obj: Vehicle, data: VehicleUpdate) -> Vehicle:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_vehicle(db: Session, obj: Vehicle) -> None:
    db.delete(obj)
    db.commit()


# -- Route --------------------------------------------------------------

def _occupied_counts(db: Session, route_ids: list[int]) -> dict[int, int]:
    if not route_ids:
        return {}
    rows = (
        db.query(TransportAllocation.route_id, func.count(TransportAllocation.id))
        .filter(TransportAllocation.route_id.in_(route_ids))
        .filter(TransportAllocation.status == STATUS_ACTIVE)
        .group_by(TransportAllocation.route_id)
        .all()
    )
    return dict(rows)


def list_routes(db: Session) -> list[tuple[Route, int]]:
    routes = db.query(Route).all()
    counts = _occupied_counts(db, [r.id for r in routes])
    return [(route, counts.get(route.id, 0)) for route in routes]


def get_route(db: Session, route_id: int) -> Route | None:
    return db.query(Route).filter(Route.id == route_id).first()


def route_occupied_count(db: Session, route_id: int) -> int:
    return (
        db.query(func.count(TransportAllocation.id))
        .filter(TransportAllocation.route_id == route_id)
        .filter(TransportAllocation.status == STATUS_ACTIVE)
        .scalar()
        or 0
    )


def create_route(db: Session, data: RouteCreate) -> Route:
    obj = Route(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_route(db: Session, obj: Route, data: RouteUpdate) -> Route:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_route(db: Session, obj: Route) -> None:
    db.delete(obj)
    db.commit()


# -- Route Stop ---------------------------------------------------------

def list_stops(db: Session, route_id: int | None = None) -> list[RouteStop]:
    query = db.query(RouteStop)
    if route_id:
        query = query.filter(RouteStop.route_id == route_id)
    return query.order_by(RouteStop.sequence).all()


def get_stop(db: Session, stop_id: int) -> RouteStop | None:
    return db.query(RouteStop).filter(RouteStop.id == stop_id).first()


def create_stop(db: Session, data: RouteStopCreate) -> RouteStop:
    obj = RouteStop(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_stop(db: Session, obj: RouteStop, data: RouteStopUpdate) -> RouteStop:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_stop(db: Session, obj: RouteStop) -> None:
    db.delete(obj)
    db.commit()


# -- Allocation ---------------------------------------------------------

def list_allocations(
    db: Session,
    student_id: int | None = None,
    route_id: int | None = None,
    status: int | None = None,
) -> list[TransportAllocation]:
    query = db.query(TransportAllocation)
    if student_id:
        query = query.filter(TransportAllocation.student_id == student_id)
    if route_id:
        query = query.filter(TransportAllocation.route_id == route_id)
    if status:
        query = query.filter(TransportAllocation.status == status)
    return query.order_by(TransportAllocation.id.desc()).all()


def get_allocation(db: Session, allocation_id: int) -> TransportAllocation | None:
    return db.query(TransportAllocation).filter(TransportAllocation.id == allocation_id).first()


def allocate(db: Session, data: TransportAllocationCreate) -> TransportAllocation:
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise TransportError("Student not found")

    route = db.query(Route).filter(Route.id == data.route_id).first()
    if not route or not route.is_active:
        raise TransportError("Route not found or inactive")

    if not route.vehicle_id:
        raise TransportError("Route has no vehicle assigned")

    vehicle = db.query(Vehicle).filter(Vehicle.id == route.vehicle_id).first()
    if not vehicle or not vehicle.is_active:
        raise TransportError("Assigned vehicle is not available")

    if data.stop_id:
        stop = db.query(RouteStop).filter(RouteStop.id == data.stop_id).first()
        if not stop or stop.route_id != route.id:
            raise TransportError("Stop does not belong to this route")

    existing = (
        db.query(TransportAllocation)
        .filter(TransportAllocation.student_id == data.student_id)
        .filter(TransportAllocation.status == STATUS_ACTIVE)
        .first()
    )
    if existing:
        raise TransportError("Student already has an active transport allocation")

    if route_occupied_count(db, route.id) >= vehicle.capacity:
        raise TransportError("Vehicle is at full seating capacity")

    allocation = TransportAllocation(
        student_id=data.student_id,
        route_id=data.route_id,
        stop_id=data.stop_id,
        start_date=data.start_date or date.today(),
        note=data.note,
        status=STATUS_ACTIVE,
    )
    db.add(allocation)
    db.commit()
    db.refresh(allocation)
    return allocation


def end_allocation(db: Session, allocation: TransportAllocation) -> TransportAllocation:
    if allocation.status == STATUS_ENDED:
        raise TransportError("Allocation has already ended")

    allocation.status = STATUS_ENDED
    allocation.end_date = date.today()
    db.commit()
    db.refresh(allocation)
    return allocation
