from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class BookBase(BaseModel):
    title: str
    isbn: str | None = None
    author: str | None = None
    publisher: str | None = None
    category: str | None = None
    total_copies: int = 1


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: str | None = None
    isbn: str | None = None
    author: str | None = None
    publisher: str | None = None
    category: str | None = None
    total_copies: int | None = None
    is_active: bool | None = None


class BookRead(BookBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    available_copies: int = 0


class BookIssueCreate(BaseModel):
    book_id: int
    student_id: int
    issue_date: date | None = None
    due_date: date
    note: str | None = None


class BookIssueRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    book_id: int
    student_id: int
    issue_date: date
    due_date: date
    return_date: date | None = None
    status: int
    fine_amount: Decimal
    note: str | None = None
