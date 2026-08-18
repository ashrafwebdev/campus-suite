from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.database import get_db
from app.crud import transport as crud
from app.crud.transport import TransportError
from app.schemas.transport import (
    RouteCreate,
    RouteRead,
    RouteStopCreate,
    RouteStopRead,
    RouteStopUpdate,
    RouteUpdate,
    TransportAllocationCreate,
    TransportAllocationRead,
    VehicleCreate,
    VehicleRead,
    VehicleUpdate,
)

router = APIRouter()


# -- Vehicles -----------------------------------------------------------

@router.get("/vehicles", response_model=list[VehicleRead], dependencies=[Depends(require_permission("transport.vehicle"))])
def list_vehicles(db: Session = Depends(get_db)):
    return crud.list_vehicles(db)


@router.post("/vehicles", response_model=VehicleRead, dependencies=[Depends(require_permission("transport.vehicle_store"))])
def create_vehicle(data: VehicleCreate, db: Session = Depends(get_db)):
    return crud.create_vehicle(db, data)


@router.put("/vehicles/{vehicle_id}", response_model=VehicleRead, dependencies=[Depends(require_permission("transport.vehicle_update"))])
def update_vehicle(vehicle_id: int, data: VehicleUpdate, db: Session = Depends(get_db)):
    obj = crud.get_vehicle(db, vehicle_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found")
    return crud.update_vehicle(db, obj, data)


@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("transport.vehicle_destroy"))])
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    obj = crud.get_vehicle(db, vehicle_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found")
    crud.delete_vehicle(db, obj)


# -- Routes -------------------------------------------------------------

@router.get("/routes", response_model=list[RouteRead], dependencies=[Depends(require_permission("transport.route"))])
def list_routes(db: Session = Depends(get_db)):
    routes_with_counts = crud.list_routes(db)
    result = []
    for route, occupied in routes_with_counts:
        item = RouteRead.model_validate(route)
        item.occupied = occupied
        item.capacity = route.vehicle.capacity if route.vehicle else None
        result.append(item)
    return result


@router.post("/routes", response_model=RouteRead, dependencies=[Depends(require_permission("transport.route_store"))])
def create_route(data: RouteCreate, db: Session = Depends(get_db)):
    if data.vehicle_id and not crud.get_vehicle(db, data.vehicle_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Vehicle not found")
    route = crud.create_route(db, data)
    item = RouteRead.model_validate(route)
    item.capacity = route.vehicle.capacity if route.vehicle else None
    return item


@router.put("/routes/{route_id}", response_model=RouteRead, dependencies=[Depends(require_permission("transport.route_update"))])
def update_route(route_id: int, data: RouteUpdate, db: Session = Depends(get_db)):
    obj = crud.get_route(db, route_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Route not found")
    route = crud.update_route(db, obj, data)
    item = RouteRead.model_validate(route)
    item.occupied = crud.route_occupied_count(db, route.id)
    item.capacity = route.vehicle.capacity if route.vehicle else None
    return item


@router.delete("/routes/{route_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("transport.route_destroy"))])
def delete_route(route_id: int, db: Session = Depends(get_db)):
    obj = crud.get_route(db, route_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Route not found")
    crud.delete_route(db, obj)


# -- Route Stops ----------------------------------------------------------

@router.get("/stops", response_model=list[RouteStopRead], dependencies=[Depends(require_permission("transport.route"))])
def list_stops(route_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    return crud.list_stops(db, route_id)


@router.post("/stops", response_model=RouteStopRead, dependencies=[Depends(require_permission("transport.route_update"))])
def create_stop(data: RouteStopCreate, db: Session = Depends(get_db)):
    if not crud.get_route(db, data.route_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Route not found")
    return crud.create_stop(db, data)


@router.put("/stops/{stop_id}", response_model=RouteStopRead, dependencies=[Depends(require_permission("transport.route_update"))])
def update_stop(stop_id: int, data: RouteStopUpdate, db: Session = Depends(get_db)):
    obj = crud.get_stop(db, stop_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Stop not found")
    return crud.update_stop(db, obj, data)


@router.delete("/stops/{stop_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("transport.route_update"))])
def delete_stop(stop_id: int, db: Session = Depends(get_db)):
    obj = crud.get_stop(db, stop_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Stop not found")
    crud.delete_stop(db, obj)


# -- Allocations ----------------------------------------------------------

@router.get("/allocations", response_model=list[TransportAllocationRead], dependencies=[Depends(require_permission("transport.allocation"))])
def list_allocations(
    student_id: int | None = Query(default=None),
    route_id: int | None = Query(default=None),
    status_: int | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    return crud.list_allocations(db, student_id, route_id, status_)


@router.post("/allocations", response_model=TransportAllocationRead, dependencies=[Depends(require_permission("transport.allocation_store"))])
def allocate_transport(data: TransportAllocationCreate, db: Session = Depends(get_db)):
    try:
        return crud.allocate(db, data)
    except TransportError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.post("/allocations/{allocation_id}/end", response_model=TransportAllocationRead, dependencies=[Depends(require_permission("transport.allocation_end"))])
def end_allocation(allocation_id: int, db: Session = Depends(get_db)):
    obj = crud.get_allocation(db, allocation_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Allocation not found")
    try:
        return crud.end_allocation(db, obj)
    except TransportError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))
