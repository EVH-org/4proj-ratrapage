"""Add visibility column to recipes table

Revision ID: 0007
Revises: 0006_add_image_url
Create Date: 2026-07-07 16:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0007"
down_revision: Union[str, None] = "0006_add_image_url"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "recipes",
        sa.Column("visibility", sa.String(50), nullable=False, server_default="public"),
    )


def downgrade() -> None:
    op.drop_column("recipes", "visibility")