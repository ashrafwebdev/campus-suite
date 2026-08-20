"""add demo data records

Revision ID: f1a2b3c4d5e6
Revises: 32416f04e7f9
Create Date: 2026-08-20 09:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = '32416f04e7f9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('demo_data_records',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('table_name', sa.String(length=100), nullable=False),
    sa.Column('record_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('demo_data_records')
