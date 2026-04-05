"""add_pending_users

Revision ID: faff45b5894d
Revises: c9f113d270ec
Create Date: 2026-03-10 17:12:52.008403

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'faff45b5894d'
down_revision: Union[str, None] = 'c9f113d270ec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'pending_users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=True),
        sa.Column('first_name', sa.String(), nullable=True),
        sa.Column('last_name', sa.String(), nullable=True),
        sa.Column('birth_date', sa.Date(), nullable=True),
        sa.Column('verification_code', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pending_users_email'), 'pending_users', ['email'], unique=True)
    op.create_index(op.f('ix_pending_users_id'), 'pending_users', ['id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_pending_users_id'), table_name='pending_users')
    op.drop_index(op.f('ix_pending_users_email'), table_name='pending_users')
    op.drop_table('pending_users')
