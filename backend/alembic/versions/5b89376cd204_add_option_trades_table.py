"""add option trades table

Revision ID: 5b89376cd204
Revises: 0551937a982a
Create Date: 2026-07-14 20:30:09.499763

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "5b89376cd204"
down_revision: Union[str, Sequence[str], None] = "0551937a982a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "option_trades",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("origin", sa.Text(), nullable=False, server_default=""),
        sa.Column("open_date", sa.Text(), nullable=False, server_default=""),
        sa.Column("ticker", sa.Text(), nullable=False),
        sa.Column("strategy", sa.Text(), nullable=False, server_default=""),
        sa.Column("expiration_date", sa.Text(), nullable=False, server_default=""),
        sa.Column("buying_power", sa.Float(), nullable=False, server_default="0"),
        sa.Column("buy_price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("fees", sa.Float(), nullable=False, server_default="0"),
        sa.Column("rolls_credit", sa.Float(), nullable=False, server_default="0"),
        sa.Column("last_trade_date", sa.Text(), nullable=False, server_default=""),
        sa.Column("strike", sa.Float(), nullable=False, server_default="0"),
        sa.Column("entry_price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("qty", sa.Float(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("option_trades")
