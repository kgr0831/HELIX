"""answer_cache: embedding dim 384 + consensus column

Revision ID: e0e2724f99bf
Revises: 3635c7b3e354
Create Date: 2026-06-05 00:12:52.497300

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e0e2724f99bf'
down_revision: Union[str, Sequence[str], None] = '3635c7b3e354'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 임베딩 소스를 로컬 fastembed(384차원)로 변경 — 테이블이 비어 있어 컬럼 타입 변경 안전
    op.execute("ALTER TABLE answer_cache ALTER COLUMN question_embedding TYPE vector(384)")
    # 캐시 재생 시 합의 여부 표시용
    op.add_column("answer_cache", sa.Column("consensus", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("answer_cache", "consensus")
    op.execute("ALTER TABLE answer_cache ALTER COLUMN question_embedding TYPE vector(1536)")
