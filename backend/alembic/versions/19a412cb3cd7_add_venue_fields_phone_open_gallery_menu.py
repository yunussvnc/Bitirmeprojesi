"""add_venue_fields_phone_open_gallery_menu

Revision ID: 19a412cb3cd7
Revises: f1b0817643c0
Create Date: 2026-03-20 11:01:06.105783

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '19a412cb3cd7'
down_revision: Union[str, None] = 'f1b0817643c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('places', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_open', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('phone_number', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('gallery_urls', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('menu_items_json', sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('places', schema=None) as batch_op:
        batch_op.drop_column('menu_items_json')
        batch_op.drop_column('gallery_urls')
        batch_op.drop_column('phone_number')
        batch_op.drop_column('is_open')
