from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.database import get_db
from app.crud import site_content as crud
from app.schemas.site_content import SiteContentData

router = APIRouter()


@router.get("", response_model=SiteContentData)
def get_site_content(db: Session = Depends(get_db)):
    """Public — powers the unauthenticated / page, no login required."""
    return crud.get_site_content(db).data


@router.put("", response_model=SiteContentData, dependencies=[Depends(require_permission("site_content.update"))])
def update_site_content(data: SiteContentData, db: Session = Depends(get_db)):
    return crud.update_site_content(db, data).data
