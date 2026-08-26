import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.security import create_access_token, hash_password

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    from fastapi.testclient import TestClient

    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def user_headers():
    def _make(email, password="secret"):
        import uuid
        token = create_access_token(str(uuid.uuid4()))
        return {"Authorization": f"Bearer {token}"}

    return _make


def create_test_user(db_session, email, display_name="Test", password="password"):
    import uuid
    from app.models.user import User
    from app.models.user_preference import UserPreference

    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email=email,
        password_hash=hash_password(password),
        display_name=display_name,
    )
    db_session.add(user)
    pref = UserPreference(user_id=user_id)
    db_session.add(pref)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token(str(user.id))
    return user, {"Authorization": f"Bearer {token}"}


def create_test_recipe(db_session, owner_user_id, title, visibility="public", **kwargs):
    import uuid
    from app.models.recipe import Recipe

    recipe_id = uuid.uuid4()
    recipe = Recipe(
        id=recipe_id,
        scope_type="personal",
        visibility=visibility,
        owner_user_id=owner_user_id,
        created_by_user_id=owner_user_id,
        title=title,
        description=kwargs.get("description"),
        prep_time_minutes=kwargs.get("prep_time_minutes"),
        cook_time_minutes=kwargs.get("cook_time_minutes"),
        servings=kwargs.get("servings"),
    )
    db_session.add(recipe)
    db_session.commit()
    db_session.refresh(recipe)
    return recipe