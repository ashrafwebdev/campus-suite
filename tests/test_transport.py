import pytest


@pytest.fixture
def vehicle(client, auth_headers):
    return client.post(
        "/api/v1/transport/vehicles",
        json={"registration_no": "DHA-1234", "vehicle_type": "Bus", "capacity": 2},
        headers=auth_headers,
    ).json()


@pytest.fixture
def route(client, auth_headers, vehicle):
    return client.post(
        "/api/v1/transport/routes",
        json={"name": "North Route", "fare": "500.00", "vehicle_id": vehicle["id"]},
        headers=auth_headers,
    ).json()


@pytest.fixture
def student(client, auth_headers):
    return client.post(
        "/api/v1/students", json={"name": "Commuter"}, headers=auth_headers
    ).json()


def test_create_route_reports_capacity_from_vehicle(client, auth_headers, route, vehicle):
    assert route["capacity"] == vehicle["capacity"]
    assert route["occupied"] == 0


def test_allocate_transport_increases_occupied(client, auth_headers, route, student):
    response = client.post(
        "/api/v1/transport/allocations",
        json={"student_id": student["id"], "route_id": route["id"]},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == 1  # Active

    routes = client.get("/api/v1/transport/routes", headers=auth_headers).json()
    assert routes[0]["occupied"] == 1


def test_cannot_allocate_without_vehicle_on_route(client, auth_headers, student):
    bare_route = client.post(
        "/api/v1/transport/routes", json={"name": "No Vehicle Route"}, headers=auth_headers
    ).json()
    assert bare_route["capacity"] is None

    response = client.post(
        "/api/v1/transport/allocations",
        json={"student_id": student["id"], "route_id": bare_route["id"]},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "vehicle" in response.json()["detail"].lower()


def test_vehicle_capacity_is_enforced(client, auth_headers, route):
    students = [
        client.post("/api/v1/students", json={"name": f"S{i}"}, headers=auth_headers).json()
        for i in range(3)
    ]

    for s in students[:2]:
        response = client.post(
            "/api/v1/transport/allocations",
            json={"student_id": s["id"], "route_id": route["id"]},
            headers=auth_headers,
        )
        assert response.status_code == 200

    overflow = client.post(
        "/api/v1/transport/allocations",
        json={"student_id": students[2]["id"], "route_id": route["id"]},
        headers=auth_headers,
    )
    assert overflow.status_code == 400
    assert "capacity" in overflow.json()["detail"].lower()


def test_student_cannot_have_two_active_allocations(client, auth_headers, route, student):
    other_vehicle = client.post(
        "/api/v1/transport/vehicles",
        json={"registration_no": "DHA-5678", "vehicle_type": "Van", "capacity": 2},
        headers=auth_headers,
    ).json()
    other_route = client.post(
        "/api/v1/transport/routes",
        json={"name": "South Route", "vehicle_id": other_vehicle["id"]},
        headers=auth_headers,
    ).json()

    client.post(
        "/api/v1/transport/allocations",
        json={"student_id": student["id"], "route_id": route["id"]},
        headers=auth_headers,
    )
    duplicate = client.post(
        "/api/v1/transport/allocations",
        json={"student_id": student["id"], "route_id": other_route["id"]},
        headers=auth_headers,
    )
    assert duplicate.status_code == 400
    assert "already" in duplicate.json()["detail"].lower()


def test_stop_must_belong_to_route(client, auth_headers, route, student):
    other_vehicle = client.post(
        "/api/v1/transport/vehicles",
        json={"registration_no": "DHA-9999", "vehicle_type": "Van", "capacity": 2},
        headers=auth_headers,
    ).json()
    other_route = client.post(
        "/api/v1/transport/routes",
        json={"name": "Other Route", "vehicle_id": other_vehicle["id"]},
        headers=auth_headers,
    ).json()
    foreign_stop = client.post(
        "/api/v1/transport/stops",
        json={"route_id": other_route["id"], "name": "Foreign Stop"},
        headers=auth_headers,
    ).json()

    response = client.post(
        "/api/v1/transport/allocations",
        json={"student_id": student["id"], "route_id": route["id"], "stop_id": foreign_stop["id"]},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "stop" in response.json()["detail"].lower()


def test_end_allocation_frees_seat_and_allows_reallocation(client, auth_headers, route, student):
    allocation = client.post(
        "/api/v1/transport/allocations",
        json={"student_id": student["id"], "route_id": route["id"]},
        headers=auth_headers,
    ).json()

    response = client.post(f"/api/v1/transport/allocations/{allocation['id']}/end", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == 2  # Ended
    assert response.json()["end_date"] is not None

    routes = client.get("/api/v1/transport/routes", headers=auth_headers).json()
    assert routes[0]["occupied"] == 0

    new_student = client.post("/api/v1/students", json={"name": "New Rider"}, headers=auth_headers).json()
    reallocate = client.post(
        "/api/v1/transport/allocations",
        json={"student_id": new_student["id"], "route_id": route["id"]},
        headers=auth_headers,
    )
    assert reallocate.status_code == 200


def test_cannot_end_allocation_twice(client, auth_headers, route, student):
    allocation = client.post(
        "/api/v1/transport/allocations",
        json={"student_id": student["id"], "route_id": route["id"]},
        headers=auth_headers,
    ).json()
    client.post(f"/api/v1/transport/allocations/{allocation['id']}/end", headers=auth_headers)

    second = client.post(f"/api/v1/transport/allocations/{allocation['id']}/end", headers=auth_headers)
    assert second.status_code == 400


def test_transport_endpoints_require_auth(client):
    response = client.get("/api/v1/transport/vehicles")
    assert response.status_code == 401
