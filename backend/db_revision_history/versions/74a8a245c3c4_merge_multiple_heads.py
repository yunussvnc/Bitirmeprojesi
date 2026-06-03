"""merge_multiple_heads

Revision ID: 74a8a245c3c4
Revises: a1225b6cd73a, 19a412cb3cd7
Create Date: 2026-05-22 14:50:32.539123

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '74a8a245c3c4'
down_revision: Union[str, None] = ('a1225b6cd73a', '19a412cb3cd7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This is a merge migration that combines two branches:
    # - a1225b6cd73a (sync_pg_schema)
    # - 19a412cb3cd7 (add_venue_fields_phone_open_gallery_menu)
    # Both parent migrations have been updated to check for existing columns
    # before adding them, so no additional operations are needed here.
    pass


def downgrade() -> None:
    # No downgrade needed for merge migrations
    pass
