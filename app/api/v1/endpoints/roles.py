from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.database import get_db
from app.crud import role as crud
from app.schemas.role import PermissionRead, RoleCreate, RoleRead, RoleUpdate

router = APIRouter()


@router.get("", response_model=list[RoleRead], dependencies=[Depends(require_permission("role.index"))])
def list_roles(db: Session = Depends(get_db)):
    return crud.list_roles(db)


@router.post("", response_model=RoleRead, dependencies=[Depends(require_permission("role.store"))])
def create_role(data: RoleCreate, db: Session = Depends(get_db)):
    return crud.create_role(db, data)


@router.put("/{role_id}", response_model=RoleRead, dependencies=[Depends(require_permission("role.update"))])
def update_role(role_id: int, data: RoleUpdate, db: Session = Depends(get_db)):
    obj = crud.get_role(db, role_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    return crud.update_role(db, obj, data)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("role.destroy"))])
def delete_role(role_id: int, db: Session = Depends(get_db)):
    obj = crud.get_role(db, role_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    if not obj.deletable:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This role can not be deleted")
    crud.delete_role(db, obj)


@router.get("/permissions", response_model=list[PermissionRead], dependencies=[Depends(require_permission("role.index"))])
def list_permissions(db: Session = Depends(get_db)):
    return crud.list_permissions(db)
