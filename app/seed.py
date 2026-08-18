"""Seed baseline roles, permissions and the first admin user.

Run with: python -m app.seed
"""
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.role import Permission, Role
from app.models.user import User

PERMISSIONS = [
    ("user.index", "User View", "User"),
    ("user.store", "User Create", "User"),
    ("user.show", "User View", "User"),
    ("user.update", "User Edit", "User"),
    ("user.destroy", "User Delete", "User"),
    ("role.index", "Role View", "Role"),
    ("role.store", "Role Create", "Role"),
    ("role.update", "Role Edit", "Role"),
    ("role.destroy", "Role Delete", "Role"),
    ("academic.class", "Class View", "Academic"),
    ("academic.class_store", "Class Create", "Academic"),
    ("academic.class_update", "Class Edit", "Academic"),
    ("academic.class_destroy", "Class Delete", "Academic"),
    ("academic.section", "Section View", "Academic"),
    ("academic.section_store", "Section Create", "Academic"),
    ("academic.section_update", "Section Edit", "Academic"),
    ("academic.section_destroy", "Section Delete", "Academic"),
    ("academic.subject", "Subject View", "Academic"),
    ("academic.subject_store", "Subject Create", "Academic"),
    ("academic.subject_update", "Subject Edit", "Academic"),
    ("academic.subject_destroy", "Subject Delete", "Academic"),
    ("student.index", "Student View", "Academic"),
    ("student.store", "Student Create", "Academic"),
    ("student.show", "Student View", "Academic"),
    ("student.update", "Student Edit", "Academic"),
    ("student.destroy", "Student Delete", "Academic"),
    ("admission.enquiry", "Admission Enquiry View", "Admission"),
    ("admission.enquiry_store", "Admission Enquiry Create", "Admission"),
    ("admission.enquiry_update", "Admission Enquiry Edit", "Admission"),
    ("admission.enquiry_destroy", "Admission Enquiry Delete", "Admission"),
    ("admission.enquiry_convert", "Admission Enquiry Convert To Student", "Admission"),
    ("hostel.index", "Hostel View", "Hostel"),
    ("hostel.store", "Hostel Create", "Hostel"),
    ("hostel.update", "Hostel Edit", "Hostel"),
    ("hostel.destroy", "Hostel Delete", "Hostel"),
    ("hostel.room", "Hostel Room View", "Hostel"),
    ("hostel.room_store", "Hostel Room Create", "Hostel"),
    ("hostel.room_update", "Hostel Room Edit", "Hostel"),
    ("hostel.room_destroy", "Hostel Room Delete", "Hostel"),
    ("hostel.allocation", "Hostel Allocation View", "Hostel"),
    ("hostel.allocation_store", "Hostel Allocation Create", "Hostel"),
    ("hostel.allocation_vacate", "Hostel Allocation Vacate", "Hostel"),
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = {p.slug: p for p in db.query(Permission).all()}
        for slug, name, group in PERMISSIONS:
            if slug not in existing:
                existing[slug] = Permission(slug=slug, name=name, group=group)
                db.add(existing[slug])
        db.commit()

        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin", deletable=False)
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
        admin_role.permissions = list(existing.values())
        db.commit()

        admin_user = db.query(User).filter(User.email == settings.first_admin_email).first()
        if not admin_user:
            admin_user = User(
                name="Administrator",
                email=settings.first_admin_email,
                hashed_password=hash_password(settings.first_admin_password),
                role_id=admin_role.id,
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            print(f"Created first admin user: {settings.first_admin_email}")
        else:
            print("Admin user already exists, skipped.")

        print(f"Seeded {len(existing)} permissions and role '{admin_role.name}'.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
