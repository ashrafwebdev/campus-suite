from sqlalchemy import JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class SiteContent(TimestampMixin, Base):
    """Singleton row (id=1) holding the editable public campus page content."""

    __tablename__ = "site_content"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    data: Mapped[dict] = mapped_column(JSON)
