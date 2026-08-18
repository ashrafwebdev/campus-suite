from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.database import get_db
from app.crud import hostel as crud
from app.crud.hostel import HostelError
from app.schemas.hostel import (
    HostelAllocationCreate,
    HostelAllocationRead,
    HostelCreate,
    HostelRead,
    HostelRoomCreate,
    HostelRoomRead,
    HostelRoomUpdate,
    HostelUpdate,
)

router = APIRouter()


# -- Hostels --------------------------------------------------------------

@router.get("", response_model=list[HostelRead], dependencies=[Depends(require_permission("hostel.index"))])
def list_hostels(db: Session = Depends(get_db)):
    return crud.list_hostels(db)


@router.post("", response_model=HostelRead, dependencies=[Depends(require_permission("hostel.store"))])
def create_hostel(data: HostelCreate, db: Session = Depends(get_db)):
    return crud.create_hostel(db, data)


@router.put("/{hostel_id}", response_model=HostelRead, dependencies=[Depends(require_permission("hostel.update"))])
def update_hostel(hostel_id: int, data: HostelUpdate, db: Session = Depends(get_db)):
    obj = crud.get_hostel(db, hostel_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Hostel not found")
    return crud.update_hostel(db, obj, data)


@router.delete("/{hostel_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("hostel.destroy"))])
def delete_hostel(hostel_id: int, db: Session = Depends(get_db)):
    obj = crud.get_hostel(db, hostel_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Hostel not found")
    crud.delete_hostel(db, obj)


# -- Rooms --------------------------------------------------------------

@router.get("/rooms", response_model=list[HostelRoomRead], dependencies=[Depends(require_permission("hostel.room"))])
def list_rooms(hostel_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    rooms_with_counts = crud.list_rooms(db, hostel_id)
    result = []
    for room, occupied in rooms_with_counts:
        item = HostelRoomRead.model_validate(room)
        item.occupied = occupied
        result.append(item)
    return result


@router.post("/rooms", response_model=HostelRoomRead, dependencies=[Depends(require_permission("hostel.room_store"))])
def create_room(data: HostelRoomCreate, db: Session = Depends(get_db)):
    if not crud.get_hostel(db, data.hostel_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Hostel not found")
    return crud.create_room(db, data)


@router.put("/rooms/{room_id}", response_model=HostelRoomRead, dependencies=[Depends(require_permission("hostel.room_update"))])
def update_room(room_id: int, data: HostelRoomUpdate, db: Session = Depends(get_db)):
    obj = crud.get_room(db, room_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    return crud.update_room(db, obj, data)


@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("hostel.room_destroy"))])
def delete_room(room_id: int, db: Session = Depends(get_db)):
    obj = crud.get_room(db, room_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    crud.delete_room(db, obj)


# -- Allocations ----------------------------------------------------------

@router.get("/allocations", response_model=list[HostelAllocationRead], dependencies=[Depends(require_permission("hostel.allocation"))])
def list_allocations(
    student_id: int | None = Query(default=None),
    room_id: int | None = Query(default=None),
    status_: int | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    return crud.list_allocations(db, student_id, room_id, status_)


@router.post("/allocations", response_model=HostelAllocationRead, dependencies=[Depends(require_permission("hostel.allocation_store"))])
def allocate_room(data: HostelAllocationCreate, db: Session = Depends(get_db)):
    try:
        return crud.allocate(db, data)
    except HostelError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.post("/allocations/{allocation_id}/vacate", response_model=HostelAllocationRead, dependencies=[Depends(require_permission("hostel.allocation_vacate"))])
def vacate_room(allocation_id: int, db: Session = Depends(get_db)):
    obj = crud.get_allocation(db, allocation_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Allocation not found")
    try:
        return crud.vacate(db, obj)
    except HostelError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))
