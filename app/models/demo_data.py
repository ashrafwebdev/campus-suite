from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DemoDataRecord(Base):
    """Ledger of every row created by the demo/sample data installer, so it
    can be found and deleted again without touching anything a real user
    entered. One row per created object, keyed by its table and id."""

    __tablename__ = "demo_data_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    table_name: Mapped[str] = mapped_column(String(100))
    record_id: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
