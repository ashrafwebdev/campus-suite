import pytest


@pytest.fixture
def hostel_and_room(client, auth_headers):
    hostel = client.post(
        "/api/v1/hostel", json={"name": "Boys Hostel A"}, headers=auth_headers
    ).json()
    room = client.post(
        "/api/v1/hostel/rooms",
        json={"hostel_id": hostel["id"], "room_no": "101", "capacity": 2},
        headers=auth_headers,
    ).json()
    return hostel, room


@pytest.fixture
def student(client, auth_headers):
    return client.post(
        "/api/v1/students", json={"name": "Alice", "residency_type": 1}, headers=auth_headers
    ).json()


def test_create_hostel_and_room(client, auth_headers, hostel_and_room):
    hostel, room = hostel_and_room
    assert room["hostel_id"] == hostel["id"]
    assert room["occupied"] == 0
    assert room["capacity"] == 2


def test_allocate_marks_student_as_hosteller(client, auth_headers, hostel_and_room, student):
    _, room = hostel_and_room

    response = client.post(
        "/api/v1/hostel/allocations",
        json={"student_id": student["id"], "room_id": room["id"], "bed_no": "A"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    allocation = response.json()
    assert allocation["status"] == 1  # Active

    updated_student = client.get(f"/api/v1/students/{student['id']}", headers=auth_headers).json()
    assert updated_student["residency_type"] == 2  # Hosteller
    assert updated_student["hostel_room_no"] == "101"

    rooms = client.get(f"/api/v1/hostel/rooms?hostel_id={room['hostel_id']}", headers=auth_headers).json()
    assert rooms[0]["occupied"] == 1


def test_room_capacity_is_enforced(client, auth_headers, hostel_and_room):
    _, room = hostel_and_room

    students = [
        client.post("/api/v1/students", json={"name": f"Student {i}"}, headers=auth_headers).json()
        for i in range(3)
    ]

    for s in students[:2]:
        response = client.post(
            "/api/v1/hostel/allocations",
            json={"student_id": s["id"], "room_id": room["id"]},
            headers=auth_headers,
        )
        assert response.status_code == 200

    overflow = client.post(
        "/api/v1/hostel/allocations",
        json={"student_id": students[2]["id"], "room_id": room["id"]},
        headers=auth_headers,
    )
    assert overflow.status_code == 400
    assert "capacity" in overflow.json()["detail"].lower()


def test_student_cannot_have_two_active_allocations(client, auth_headers, hostel_and_room, student):
    hostel, room = hostel_and_room
    other_room = client.post(
        "/api/v1/hostel/rooms",
        json={"hostel_id": hostel["id"], "room_no": "102", "capacity": 2},
        headers=auth_headers,
    ).json()

    client.post(
        "/api/v1/hostel/allocations",
        json={"student_id": student["id"], "room_id": room["id"]},
        headers=auth_headers,
    )

    duplicate = client.post(
        "/api/v1/hostel/allocations",
        json={"student_id": student["id"], "room_id": other_room["id"]},
        headers=auth_headers,
    )
    assert duplicate.status_code == 400
    assert "already" in duplicate.json()["detail"].lower()


def test_vacate_frees_the_room_and_reverts_residency(client, auth_headers, hostel_and_room, student):
    _, room = hostel_and_room

    allocation = client.post(
        "/api/v1/hostel/allocations",
        json={"student_id": student["id"], "room_id": room["id"]},
        headers=auth_headers,
    ).json()

    response = client.post(f"/api/v1/hostel/allocations/{allocation['id']}/vacate", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == 2  # Vacated
    assert response.json()["vacated_date"] is not None

    updated_student = client.get(f"/api/v1/students/{student['id']}", headers=auth_headers).json()
    assert updated_student["residency_type"] == 1  # Day Scholar
    assert updated_student["hostel_room_no"] is None

    rooms = client.get(f"/api/v1/hostel/rooms?hostel_id={room['hostel_id']}", headers=auth_headers).json()
    assert rooms[0]["occupied"] == 0

    # room is free again, a new student can move in
    new_student = client.post(
        "/api/v1/students", json={"name": "Bob"}, headers=auth_headers
    ).json()
    reallocate = client.post(
        "/api/v1/hostel/allocations",
        json={"student_id": new_student["id"], "room_id": room["id"]},
        headers=auth_headers,
    )
    assert reallocate.status_code == 200


def test_cannot_vacate_twice(client, auth_headers, hostel_and_room, student):
    _, room = hostel_and_room
    allocation = client.post(
        "/api/v1/hostel/allocations",
        json={"student_id": student["id"], "room_id": room["id"]},
        headers=auth_headers,
    ).json()

    client.post(f"/api/v1/hostel/allocations/{allocation['id']}/vacate", headers=auth_headers)
    second = client.post(f"/api/v1/hostel/allocations/{allocation['id']}/vacate", headers=auth_headers)
    assert second.status_code == 400


def test_hostel_endpoints_require_auth(client):
    response = client.get("/api/v1/hostel")
    assert response.status_code == 401
