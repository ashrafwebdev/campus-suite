from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.database import get_db
from app.crud import user as crud
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter()


@router.get("", response_model=list[UserRead], dependencies=[Depends(require_permission("user.index"))])
def list_users(db: Session = Depends(get_db)):
    return crud.list_users(db)


@router.post("", response_model=UserRead, dependencies=[Depends(require_permission("user.store"))])
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, data.email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
    return crud.create_user(db, data)


@router.get("/{user_id}", response_model=UserRead, dependencies=[Depends(require_permission("user.show"))])
def get_user(user_id: int, db: Session = Depends(get_db)):
    obj = crud.get_user(db, user_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return obj


@router.put("/{user_id}", response_model=UserRead, dependencies=[Depends(require_permission("user.update"))])
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    obj = crud.get_user(db, user_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return crud.update_user(db, obj, data)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("user.destroy"))])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    obj = crud.get_user(db, user_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    crud.delete_user(db, obj)
