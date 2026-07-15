"""rename qty to contracts, add option_type

Revision ID: 29215b1e161f
Revises: 5b89376cd204
Create Date: 2026-07-14 21:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "29215b1e161f"
down_revision: Union[str, Sequence[str], None] = "5b89376cd204"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("option_trades") as batch_op:
        batch_op.alter_column("qty", new_column_name="contracts")
        batch_op.add_column(
            sa.Column("option_type", sa.Text(), nullable=False, server_default="")
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("option_trades") as batch_op:
        batch_op.drop_column("option_type")
        batch_op.alter_column("contracts", new_column_name="qty")
