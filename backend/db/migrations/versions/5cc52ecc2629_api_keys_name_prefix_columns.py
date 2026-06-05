"""api_keys: name + prefix columns

Revision ID: 5cc52ecc2629
Revises: e0e2724f99bf
Create Date: 2026-06-05 00:20:33.601213

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5cc52ecc2629'
down_revision: Union[str, Sequence[str], None] = 'e0e2724f99bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("api_keys", sa.Column("name", sa.String(length=100), nullable=False, server_default="기본 키"))
    op.add_column("api_keys", sa.Column("prefix", sa.String(length=64), nullable=False, server_default=""))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("api_keys", "prefix")
    op.drop_column("api_keys", "name")
