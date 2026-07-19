"""add direction to option_trades

Revision ID: 541d011acc68
Revises: 29215b1e161f
Create Date: 2026-07-19 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "541d011acc68"
down_revision: Union[str, Sequence[str], None] = "29215b1e161f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("option_trades") as batch_op:
        batch_op.add_column(
            sa.Column("direction", sa.Text(), nullable=False, server_default="short")
        )
    option_trades = sa.table("option_trades", sa.column("contracts", sa.Float()))
    op.execute(option_trades.update().values(contracts=sa.func.abs(option_trades.c.contracts)))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("option_trades") as batch_op:
        batch_op.drop_column("direction")
