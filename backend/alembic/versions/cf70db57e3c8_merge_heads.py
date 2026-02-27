"""merge_heads

Revision ID: cf70db57e3c8
Revises: 7b2e3a9c4d12, a7c550777628
Create Date: 2026-02-27 20:50:43.941244

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cf70db57e3c8'
down_revision: Union[str, None] = ('7b2e3a9c4d12', 'a7c550777628')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
