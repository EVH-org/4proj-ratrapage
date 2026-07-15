"""add user roles

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-29 13:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# Identifiants de révision d'Alembic
revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.String(length=50),
            nullable=False,
            server_default="user",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "role")
