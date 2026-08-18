from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.database import get_db
from app.crud import library as crud
from app.crud.library import LibraryError
from app.schemas.library import (
    BookCreate,
    BookIssueCreate,
    BookIssueRead,
    BookRead,
    BookUpdate,
)

router = APIRouter()


# -- Books ------------------------------------------------------------------

@router.get("/books", response_model=list[BookRead], dependencies=[Depends(require_permission("library.book"))])
def list_books(category: str | None = Query(default=None), db: Session = Depends(get_db)):
    books_with_counts = crud.list_books(db, category)
    result = []
    for book, available in books_with_counts:
        item = BookRead.model_validate(book)
        item.available_copies = available
        result.append(item)
    return result


@router.post("/books", response_model=BookRead, dependencies=[Depends(require_permission("library.book_store"))])
def create_book(data: BookCreate, db: Session = Depends(get_db)):
    book = crud.create_book(db, data)
    item = BookRead.model_validate(book)
    item.available_copies = crud.book_available_copies(db, book)
    return item


@router.put("/books/{book_id}", response_model=BookRead, dependencies=[Depends(require_permission("library.book_update"))])
def update_book(book_id: int, data: BookUpdate, db: Session = Depends(get_db)):
    obj = crud.get_book(db, book_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Book not found")
    book = crud.update_book(db, obj, data)
    item = BookRead.model_validate(book)
    item.available_copies = crud.book_available_copies(db, book)
    return item


@router.delete("/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("library.book_destroy"))])
def delete_book(book_id: int, db: Session = Depends(get_db)):
    obj = crud.get_book(db, book_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Book not found")
    crud.delete_book(db, obj)


# -- Issues -------------------------------------------------------------

@router.get("/issues", response_model=list[BookIssueRead], dependencies=[Depends(require_permission("library.issue"))])
def list_issues(
    student_id: int | None = Query(default=None),
    book_id: int | None = Query(default=None),
    status_: int | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    return crud.list_issues(db, student_id, book_id, status_)


@router.post("/issues", response_model=BookIssueRead, dependencies=[Depends(require_permission("library.issue_store"))])
def issue_book(data: BookIssueCreate, db: Session = Depends(get_db)):
    try:
        return crud.issue_book(db, data)
    except LibraryError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.post("/issues/{issue_id}/return", response_model=BookIssueRead, dependencies=[Depends(require_permission("library.issue_return"))])
def return_book(issue_id: int, db: Session = Depends(get_db)):
    obj = crud.get_issue(db, issue_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Issue not found")
    try:
        return crud.return_book(db, obj)
    except LibraryError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.post("/issues/{issue_id}/lost", response_model=BookIssueRead, dependencies=[Depends(require_permission("library.issue_lost"))])
def mark_lost(issue_id: int, db: Session = Depends(get_db)):
    obj = crud.get_issue(db, issue_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Issue not found")
    try:
        return crud.mark_lost(db, obj)
    except LibraryError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))
