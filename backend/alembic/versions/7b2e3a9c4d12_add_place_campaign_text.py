"""add_place_campaign_text

Revision ID: 7b2e3a9c4d12
Revises: 669f6f52204f
Create Date: 2026-02-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7b2e3a9c4d12"
down_revision: Union[str, None] = "669f6f52204f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("places", schema=None) as batch_op:
        batch_op.add_column(sa.Column("campaign_text", sa.String(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("places", schema=None) as batch_op:
        batch_op.drop_column("campaign_text")
