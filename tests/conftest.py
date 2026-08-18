import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.models.role import Permission, Role
from app.models.user import User
from app.seed import PERMISSIONS

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_user(db_session):
    permissions = [Permission(slug=slug, name=name, group=group) for slug, name, group in PERMISSIONS]
    db_session.add_all(permissions)
    db_session.commit()

    role = Role(name="admin", deletable=False)
    role.permissions = permissions
    db_session.add(role)
    db_session.commit()

    user = User(
        name="Administrator",
        email="admin@example.com",
        hashed_password=hash_password("changeme123"),
        role_id=role.id,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(client, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@example.com", "password": "changeme123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
