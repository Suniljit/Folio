"""initial holdings table

Revision ID: 0551937a982a
Revises:
Create Date: 2026-05-02 17:16:41.274780

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0551937a982a"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "holdings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("company_name", sa.Text(), nullable=False, server_default=""),
        sa.Column("ticker", sa.Text(), nullable=False),
        sa.Column("shares_owned", sa.Float(), nullable=False, server_default="0"),
        sa.Column("avg_price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("fees", sa.Float(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_table("holdings")
