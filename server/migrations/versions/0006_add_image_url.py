"""add image_url to recipes

Revision ID: 0006_add_image_url
Revises: 0005_add_tags_and_favorites
Create Date: 2026-07-03 15:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0006_add_image_url'
down_revision: Union[str, Sequence[str], None] = '0005_add_tags_and_favorites'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('recipes', sa.Column('image_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('recipes', 'image_url')