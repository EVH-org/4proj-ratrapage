"""create recipes

Revision ID: 1201debb1295
Revises: 0003
Create Date: 2026-06-30 08:30:37.655652

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1201debb1295'
down_revision: Union[str, Sequence[str], None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('recipes',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('scope_type', sa.String(length=50), nullable=False),
    sa.Column('owner_user_id', sa.UUID(), nullable=True),
    sa.Column('cookbook_id', sa.UUID(), nullable=True),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.String(length=1000), nullable=True),
    sa.Column('prep_time_minutes', sa.Integer(), nullable=True),
    sa.Column('cook_time_minutes', sa.Integer(), nullable=True),
    sa.Column('servings', sa.Integer(), nullable=True),
    sa.Column('source_url', sa.String(length=500), nullable=True),
    sa.Column('image_object_key', sa.String(length=500), nullable=True),
    sa.Column('created_by_user_id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['cookbook_id'], ['cookbooks.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['owner_user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('recipe_ingredients',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('recipe_id', sa.UUID(), nullable=False),
    sa.Column('line_order', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('quantity', sa.Float(), nullable=True),
    sa.Column('unit', sa.String(length=50), nullable=True),
    sa.Column('note', sa.String(length=255), nullable=True),
    sa.ForeignKeyConstraint(['recipe_id'], ['recipes.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('recipe_id', 'line_order', name='uq_recipe_ingredients_order')
    )
    op.create_table('recipe_steps',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('recipe_id', sa.UUID(), nullable=False),
    sa.Column('step_order', sa.Integer(), nullable=False),
    sa.Column('instruction', sa.String(length=1000), nullable=False),
    sa.ForeignKeyConstraint(['recipe_id'], ['recipes.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('recipe_id', 'step_order', name='uq_recipe_steps_order')
    )


def downgrade() -> None:
    op.drop_table('recipe_steps')
    op.drop_table('recipe_ingredients')
    op.drop_table('recipes')
    # ### end Alembic commands ###
