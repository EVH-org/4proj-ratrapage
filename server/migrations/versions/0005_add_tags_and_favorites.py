"""add tags and favorites

Revision ID: 0005_add_tags_and_favorites
Revises: 1201debb1295
Create Date: 2026-06-30 14:19:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '0005_add_tags_and_favorites'
down_revision: Union[str, Sequence[str], None] = '1201debb1295'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'tags',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('label', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('label')
    )

    op.create_table(
        'recipe_tags',
        sa.Column('recipe_id', sa.UUID(), nullable=False),
        sa.Column('tag_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['recipe_id'], ['recipes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('recipe_id', 'tag_id'),
        sa.UniqueConstraint('recipe_id', 'tag_id', name='uq_recipe_tags_recipe_tag')
    )

    op.create_table(
        'recipe_favorites',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('recipe_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['recipe_id'], ['recipes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'recipe_id'),
        sa.UniqueConstraint('user_id', 'recipe_id', name='uq_recipe_favorites_user_recipe')
    )


def downgrade() -> None:
    op.drop_table('recipe_favorites')
    op.drop_table('recipe_tags')
    op.drop_table('tags')
