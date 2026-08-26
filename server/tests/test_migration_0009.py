import importlib.util
from pathlib import Path

import bcrypt
import pytest
import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations

MIGRATION_PATH = (
    Path(__file__).resolve().parents[1]
    / "migrations"
    / "versions"
    / "0009_hash_plaintext_passwords.py"
)


def _load_migration():
    spec = importlib.util.spec_from_file_location("migration_0009", MIGRATION_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def connection():
    engine = sa.create_engine("sqlite://")
    with engine.connect() as conn:
        conn.execute(
            sa.text(
                "CREATE TABLE users ("
                "  id TEXT PRIMARY KEY,"
                "  email TEXT,"
                "  password_hash TEXT"
                ")"
            )
        )
        conn.commit()
        yield conn


def _insert(connection, user_id, password_hash):
    connection.execute(
        sa.text(
            "INSERT INTO users (id, email, password_hash) "
            "VALUES (:id, :email, :hash)"
        ),
        {"id": user_id, "email": f"{user_id}@cuisine.fr", "hash": password_hash},
    )
    connection.commit()


def _read(connection, user_id):
    return connection.execute(
        sa.text("SELECT password_hash FROM users WHERE id = :id"), {"id": user_id}
    ).scalar()


def _run_upgrade(connection):
    module = _load_migration()
    with Operations.context(MigrationContext.configure(connection)):
        module.upgrade()
    connection.commit()


def test_un_mot_de_passe_en_clair_devient_un_hash_verifiable(connection):
    _insert(connection, "clair", "chefpassword")

    _run_upgrade(connection)

    stored = _read(connection, "clair")
    assert stored.startswith("$2b$12$")
    assert bcrypt.checkpw(b"chefpassword", stored.encode())


def test_un_hash_existant_n_est_pas_rehache(connection):
    deja_hache = bcrypt.hashpw(b"secret", bcrypt.gensalt(rounds=4)).decode()
    _insert(connection, "hache", deja_hache)

    _run_upgrade(connection)

    assert _read(connection, "hache") == deja_hache


def test_la_migration_est_idempotente(connection):
    _insert(connection, "clair", "chefpassword")

    _run_upgrade(connection)
    premier_passage = _read(connection, "clair")
    _run_upgrade(connection)

    assert _read(connection, "clair") == premier_passage
    assert bcrypt.checkpw(b"chefpassword", premier_passage.encode())


def test_un_mot_de_passe_null_est_ignore(connection):
    _insert(connection, "vide", None)

    _run_upgrade(connection)

    assert _read(connection, "vide") is None


def test_un_mot_de_passe_trop_long_est_neutralise(connection):
    _insert(connection, "long", "é" * 40)

    _run_upgrade(connection)

    assert _read(connection, "long") is None
