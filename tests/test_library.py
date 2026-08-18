from datetime import date, timedelta

import pytest


@pytest.fixture
def student(client, auth_headers):
    return client.post(
        "/api/v1/students", json={"name": "Reader"}, headers=auth_headers
    ).json()


@pytest.fixture
def book(client, auth_headers):
    return client.post(
        "/api/v1/library/books",
        json={"title": "Clean Code", "author": "Robert C. Martin", "total_copies": 2},
        headers=auth_headers,
    ).json()


def test_create_book_reports_all_copies_available(client, auth_headers, book):
    assert book["available_copies"] == 2
    assert book["total_copies"] == 2


def test_issue_book_reduces_available_copies(client, auth_headers, book, student):
    response = client.post(
        "/api/v1/library/issues",
        json={"book_id": book["id"], "student_id": student["id"], "due_date": "2026-12-31"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == 1  # Issued

    books = client.get("/api/v1/library/books", headers=auth_headers).json()
    assert books[0]["available_copies"] == 1


def test_cannot_issue_beyond_total_copies(client, auth_headers, book):
    students = [
        client.post("/api/v1/students", json={"name": f"S{i}"}, headers=auth_headers).json()
        for i in range(3)
    ]

    for s in students[:2]:
        response = client.post(
            "/api/v1/library/issues",
            json={"book_id": book["id"], "student_id": s["id"], "due_date": "2026-12-31"},
            headers=auth_headers,
        )
        assert response.status_code == 200

    overflow = client.post(
        "/api/v1/library/issues",
        json={"book_id": book["id"], "student_id": students[2]["id"], "due_date": "2026-12-31"},
        headers=auth_headers,
    )
    assert overflow.status_code == 400
    assert "available" in overflow.json()["detail"].lower()


def test_same_student_cannot_double_borrow_same_book(client, auth_headers, book, student):
    client.post(
        "/api/v1/library/issues",
        json={"book_id": book["id"], "student_id": student["id"], "due_date": "2026-12-31"},
        headers=auth_headers,
    )
    duplicate = client.post(
        "/api/v1/library/issues",
        json={"book_id": book["id"], "student_id": student["id"], "due_date": "2026-12-31"},
        headers=auth_headers,
    )
    assert duplicate.status_code == 400
    assert "already" in duplicate.json()["detail"].lower()


def test_return_on_time_has_no_fine(client, auth_headers, book, student):
    issue = client.post(
        "/api/v1/library/issues",
        json={"book_id": book["id"], "student_id": student["id"], "due_date": "2099-12-31"},
        headers=auth_headers,
    ).json()

    response = client.post(f"/api/v1/library/issues/{issue['id']}/return", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == 2  # Returned
    assert float(body["fine_amount"]) == 0.0
    assert body["return_date"] is not None


def test_return_overdue_book_charges_fine(client, auth_headers, book, student):
    overdue_due_date = (date.today() - timedelta(days=3)).isoformat()
    issue = client.post(
        "/api/v1/library/issues",
        json={"book_id": book["id"], "student_id": student["id"], "due_date": overdue_due_date},
        headers=auth_headers,
    ).json()

    response = client.post(f"/api/v1/library/issues/{issue['id']}/return", headers=auth_headers)
    assert response.status_code == 200
    # 3 days overdue * 5.00/day = 15.00
    assert float(response.json()["fine_amount"]) == 15.0


def test_returning_book_frees_the_copy_for_reissue(client, auth_headers, book, student):
    issue = client.post(
        "/api/v1/library/issues",
        json={"book_id": book["id"], "student_id": student["id"], "due_date": "2026-12-31"},
        headers=auth_headers,
    ).json()
    client.post(f"/api/v1/library/issues/{issue['id']}/return", headers=auth_headers)

    # same student can now borrow the same book again
    reissue = client.post(
        "/api/v1/library/issues",
        json={"book_id": book["id"], "student_id": student["id"], "due_date": "2026-12-31"},
        headers=auth_headers,
    )
    assert reissue.status_code == 200


def test_cannot_return_already_returned_issue(client, auth_headers, book, student):
    issue = client.post(
        "/api/v1/library/issues",
        json={"book_id": book["id"], "student_id": student["id"], "due_date": "2026-12-31"},
        headers=auth_headers,
    ).json()
    client.post(f"/api/v1/library/issues/{issue['id']}/return", headers=auth_headers)

    second = client.post(f"/api/v1/library/issues/{issue['id']}/return", headers=auth_headers)
    assert second.status_code == 400


def test_lost_book_stays_unavailable(client, auth_headers, book, student):
    issue = client.post(
        "/api/v1/library/issues",
        json={"book_id": book["id"], "student_id": student["id"], "due_date": "2026-12-31"},
        headers=auth_headers,
    ).json()

    response = client.post(f"/api/v1/library/issues/{issue['id']}/lost", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == 3  # Lost

    books = client.get("/api/v1/library/books", headers=auth_headers).json()
    # total_copies=2, one lost -> only 1 available, permanently (unlike a return)
    assert books[0]["available_copies"] == 1


def test_cannot_mark_returned_book_as_lost(client, auth_headers, book, student):
    issue = client.post(
        "/api/v1/library/issues",
        json={"book_id": book["id"], "student_id": student["id"], "due_date": "2026-12-31"},
        headers=auth_headers,
    ).json()
    client.post(f"/api/v1/library/issues/{issue['id']}/return", headers=auth_headers)

    response = client.post(f"/api/v1/library/issues/{issue['id']}/lost", headers=auth_headers)
    assert response.status_code == 400


def test_library_endpoints_require_auth(client):
    response = client.get("/api/v1/library/books")
    assert response.status_code == 401
