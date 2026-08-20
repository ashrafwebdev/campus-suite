from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.demo_data import demo_data_installed, install_demo_data, remove_demo_data
from app.models.user import User
from app.schemas.demo_data import DemoDataStatus

router = APIRouter()


@router.get("/status", response_model=DemoDataStatus, dependencies=[Depends(require_permission("demo_data.manage"))])
def get_status(db: Session = Depends(get_db)):
    return DemoDataStatus(installed=demo_data_installed(db))


@router.post("/install", response_model=DemoDataStatus, dependencies=[Depends(require_permission("demo_data.manage"))])
def install(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        counts = install_demo_data(db, actor_user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    return DemoDataStatus(installed=True, counts=counts)


@router.post("/remove", response_model=DemoDataStatus, dependencies=[Depends(require_permission("demo_data.manage"))])
def remove(db: Session = Depends(get_db)):
    counts = remove_demo_data(db)
    return DemoDataStatus(installed=False, counts=counts)
