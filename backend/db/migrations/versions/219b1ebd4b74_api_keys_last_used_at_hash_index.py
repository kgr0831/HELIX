"""api_keys: last_used_at + hash index

Revision ID: 219b1ebd4b74
Revises: 5cc52ecc2629
Create Date: 2026-06-05 01:41:09.548973

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '219b1ebd4b74'
down_revision: Union[str, Sequence[str], None] = '5cc52ecc2629'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("api_keys", sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_api_keys_encrypted_key"), "api_keys", ["encrypted_key"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_api_keys_encrypted_key"), table_name="api_keys")
    op.drop_column("api_keys", "last_used_at")
