import pytest


@pytest.fixture
def class_with_students(client, auth_headers):
    class_id = client.post("/api/v1/academic/classes", json={"name": "Class 8"}, headers=auth_headers).json()["id"]
    s1 = client.post("/api/v1/students", json={"name": "Alice", "class_id": class_id}, headers=auth_headers).json()
    s2 = client.post("/api/v1/students", json={"name": "Bob", "class_id": class_id}, headers=auth_headers).json()
    return {"class_id": class_id, "students": [s1, s2]}


def test_roster_starts_unmarked(client, auth_headers, class_with_students):
    class_id = class_with_students["class_id"]
    response = client.get(f"/api/v1/attendance/roster?class_id={class_id}&date=2026-08-19", headers=auth_headers)
    assert response.status_code == 200
    roster = response.json()
    assert len(roster) == 2
    assert all(r["status"] is None for r in roster)


def test_bulk_mark_then_roster_reflects_it(client, auth_headers, class_with_students):
    class_id = class_with_students["class_id"]
    s1, s2 = class_with_students["students"]

    response = client.post(
        "/api/v1/attendance/mark",
        json={
            "class_id": class_id,
            "date": "2026-08-19",
            "entries": [
                {"student_id": s1["id"], "status": 1},
                {"student_id": s2["id"], "status": 2, "note": "Sick"},
            ],
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert len(response.json()) == 2

    roster = client.get(f"/api/v1/attendance/roster?class_id={class_id}&date=2026-08-19", headers=auth_headers).json()
    by_id = {r["student_id"]: r for r in roster}
    assert by_id[s1["id"]]["status"] == 1
    assert by_id[s2["id"]]["status"] == 2
    assert by_id[s2["id"]]["note"] == "Sick"


def test_remarking_same_day_updates_not_duplicates(client, auth_headers, class_with_students):
    class_id = class_with_students["class_id"]
    s1 = class_with_students["students"][0]

    client.post(
        "/api/v1/attendance/mark",
        json={"class_id": class_id, "date": "2026-08-19", "entries": [{"student_id": s1["id"], "status": 2}]},
        headers=auth_headers,
    )
    client.post(
        "/api/v1/attendance/mark",
        json={"class_id": class_id, "date": "2026-08-19", "entries": [{"student_id": s1["id"], "status": 1}]},
        headers=auth_headers,
    )

    history = client.get(f"/api/v1/attendance?student_id={s1['id']}", headers=auth_headers).json()
    assert len(history) == 1
    assert history[0]["status"] == 1


def test_list_attendance_filters_by_date_range(client, auth_headers, class_with_students):
    class_id = class_with_students["class_id"]
    s1 = class_with_students["students"][0]

    for d in ["2026-08-17", "2026-08-18", "2026-08-19"]:
        client.post(
            "/api/v1/attendance/mark",
            json={"class_id": class_id, "date": d, "entries": [{"student_id": s1["id"], "status": 1}]},
            headers=auth_headers,
        )

    response = client.get(
        f"/api/v1/attendance?student_id={s1['id']}&date_from=2026-08-18&date_to=2026-08-19", headers=auth_headers
    )
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_attendance_endpoints_require_auth(client):
    response = client.get("/api/v1/attendance/roster?class_id=1&date=2026-08-19")
    assert response.status_code == 401
