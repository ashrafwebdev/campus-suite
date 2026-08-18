from sqlalchemy.orm import Session

from app.models.role import Permission, Role
from app.schemas.role import RoleCreate, RoleUpdate


def list_roles(db: Session) -> list[Role]:
    return db.query(Role).all()


def get_role(db: Session, role_id: int) -> Role | None:
    return db.query(Role).filter(Role.id == role_id).first()


def create_role(db: Session, data: RoleCreate) -> Role:
    role = Role(name=data.name)
    if data.permission_ids:
        role.permissions = db.query(Permission).filter(Permission.id.in_(data.permission_ids)).all()
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def update_role(db: Session, role: Role, data: RoleUpdate) -> Role:
    if data.name is not None:
        role.name = data.name
    if data.permission_ids is not None:
        role.permissions = db.query(Permission).filter(Permission.id.in_(data.permission_ids)).all()
    db.commit()
    db.refresh(role)
    return role


def delete_role(db: Session, role: Role) -> None:
    db.delete(role)
    db.commit()


def list_permissions(db: Session) -> list[Permission]:
    return db.query(Permission).all()
