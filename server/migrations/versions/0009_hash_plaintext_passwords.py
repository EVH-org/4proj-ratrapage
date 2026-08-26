"""Hash existing plaintext passwords

Revision ID: 0009
Revises: 0008
Create Date: 2026-08-25 10:00:00.000000

"""
from typing import Sequence, Union

import bcrypt
import sqlalchemy as sa
from alembic import op


revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


BCRYPT_ROUNDS = 12
BCRYPT_PREFIXES = ("$2a$", "$2b$", "$2x$", "$2y$")
MAX_PASSWORD_BYTES = 72


def upgrade() -> None:
    connection = op.get_bind()
    rows = connection.execute(sa.text("SELECT id, password_hash FROM users")).fetchall()

    for user_id, stored in rows:
        if not stored or stored.startswith(BCRYPT_PREFIXES):
            continue

        password_bytes = stored.encode("utf-8")
        if len(password_bytes) > MAX_PASSWORD_BYTES:
            connection.execute(
                sa.text("UPDATE users SET password_hash = NULL WHERE id = :id"),
                {"id": user_id},
            )
            continue

        hashed = bcrypt.hashpw(
            password_bytes, bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
        ).decode("utf-8")
        connection.execute(
            sa.text("UPDATE users SET password_hash = :hash WHERE id = :id"),
            {"hash": hashed, "id": user_id},
        )


def downgrade() -> None:
    pass
