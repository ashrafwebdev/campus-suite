from datetime import date
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.library import Book, BookIssue
from app.models.student import Student
from app.schemas.library import BookCreate, BookIssueCreate, BookUpdate

STATUS_ISSUED = 1
STATUS_RETURNED = 2
STATUS_LOST = 3

# Statuses that keep a copy unavailable for re-issue: still out (Issued) or
# gone for good (Lost).
UNAVAILABLE_STATUSES = (STATUS_ISSUED, STATUS_LOST)

FINE_PER_DAY = Decimal("5.00")


class LibraryError(Exception):
    """Raised for library rule violations."""


# -- Book -----------------------------------------------------------------

def _unavailable_counts(db: Session, book_ids: list[int]) -> dict[int, int]:
    if not book_ids:
        return {}
    rows = (
        db.query(BookIssue.book_id, func.count(BookIssue.id))
        .filter(BookIssue.book_id.in_(book_ids))
        .filter(BookIssue.status.in_(UNAVAILABLE_STATUSES))
        .group_by(BookIssue.book_id)
        .all()
    )
    return dict(rows)


def list_books(db: Session, category: str | None = None) -> list[tuple[Book, int]]:
    query = db.query(Book)
    if category:
        query = query.filter(Book.category == category)
    books = query.all()
    unavailable = _unavailable_counts(db, [b.id for b in books])
    return [(book, book.total_copies - unavailable.get(book.id, 0)) for book in books]


def get_book(db: Session, book_id: int) -> Book | None:
    return db.query(Book).filter(Book.id == book_id).first()


def book_available_copies(db: Session, book: Book) -> int:
    unavailable = (
        db.query(func.count(BookIssue.id))
        .filter(BookIssue.book_id == book.id)
        .filter(BookIssue.status.in_(UNAVAILABLE_STATUSES))
        .scalar()
        or 0
    )
    return book.total_copies - unavailable


def create_book(db: Session, data: BookCreate) -> Book:
    obj = Book(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_book(db: Session, obj: Book, data: BookUpdate) -> Book:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_book(db: Session, obj: Book) -> None:
    db.delete(obj)
    db.commit()


# -- Issue --------------------------------------------------------------

def list_issues(
    db: Session,
    student_id: int | None = None,
    book_id: int | None = None,
    status: int | None = None,
) -> list[BookIssue]:
    query = db.query(BookIssue)
    if student_id:
        query = query.filter(BookIssue.student_id == student_id)
    if book_id:
        query = query.filter(BookIssue.book_id == book_id)
    if status:
        query = query.filter(BookIssue.status == status)
    return query.order_by(BookIssue.id.desc()).all()


def get_issue(db: Session, issue_id: int) -> BookIssue | None:
    return db.query(BookIssue).filter(BookIssue.id == issue_id).first()


def issue_book(db: Session, data: BookIssueCreate) -> BookIssue:
    book = db.query(Book).filter(Book.id == data.book_id).first()
    if not book or not book.is_active:
        raise LibraryError("Book not found or inactive")

    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise LibraryError("Student not found")

    if book_available_copies(db, book) < 1:
        raise LibraryError("No copies of this book are available")

    duplicate = (
        db.query(BookIssue)
        .filter(BookIssue.book_id == data.book_id)
        .filter(BookIssue.student_id == data.student_id)
        .filter(BookIssue.status == STATUS_ISSUED)
        .first()
    )
    if duplicate:
        raise LibraryError("Student already has this book on loan")

    issue = BookIssue(
        book_id=data.book_id,
        student_id=data.student_id,
        issue_date=data.issue_date or date.today(),
        due_date=data.due_date,
        note=data.note,
        status=STATUS_ISSUED,
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


def return_book(db: Session, issue: BookIssue) -> BookIssue:
    if issue.status != STATUS_ISSUED:
        raise LibraryError("This issue is not currently outstanding")

    issue.return_date = date.today()
    overdue_days = max(0, (issue.return_date - issue.due_date).days)
    issue.fine_amount = FINE_PER_DAY * overdue_days
    issue.status = STATUS_RETURNED

    db.commit()
    db.refresh(issue)
    return issue


def mark_lost(db: Session, issue: BookIssue) -> BookIssue:
    if issue.status != STATUS_ISSUED:
        raise LibraryError("This issue is not currently outstanding")

    issue.status = STATUS_LOST
    db.commit()
    db.refresh(issue)
    return issue
