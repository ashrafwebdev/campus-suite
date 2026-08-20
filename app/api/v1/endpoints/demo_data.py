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
    except Exception as exc:
        # The ledger is committed in batches as install proceeds (see
        # app/demo_data.py), so even a failure partway through leaves an
        # accurate, if partial, `demo_data_installed()` state -- point the
        # caller at "Remove sample data" to clean that up before retrying,
        # rather than surfacing a bare 500.
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Demo data install failed partway through ({exc}). Some sample data may already be "
            "installed -- use Remove sample data to clean up, then try again.",
        ) from exc
    return DemoDataStatus(installed=True, counts=counts)


@router.post("/remove", response_model=DemoDataStatus, dependencies=[Depends(require_permission("demo_data.manage"))])
def remove(db: Session = Depends(get_db)):
    counts = remove_demo_data(db)
    return DemoDataStatus(installed=False, counts=counts)
