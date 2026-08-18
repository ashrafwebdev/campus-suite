def test_create_student_day_scholar_and_hosteller(client, auth_headers):
    day_scholar = client.post(
        "/api/v1/students",
        json={"name": "Alice", "residency_type": 1},
        headers=auth_headers,
    )
    assert day_scholar.status_code == 200
    assert day_scholar.json()["residency_type"] == 1

    hosteller = client.post(
        "/api/v1/students",
        json={"name": "Bob", "residency_type": 2, "hostel_room_no": "H-12"},
        headers=auth_headers,
    )
    assert hosteller.status_code == 200
    assert hosteller.json()["residency_type"] == 2
    assert hosteller.json()["hostel_room_no"] == "H-12"

    listed = client.get("/api/v1/students", headers=auth_headers)
    assert len(listed.json()) == 2


def test_update_and_delete_student(client, auth_headers):
    student = client.post(
        "/api/v1/students", json={"name": "Carol"}, headers=auth_headers
    ).json()

    updated = client.put(
        f"/api/v1/students/{student['id']}", json={"status": 3}, headers=auth_headers
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == 3

    deleted = client.delete(f"/api/v1/students/{student['id']}", headers=auth_headers)
    assert deleted.status_code == 204

    missing = client.get(f"/api/v1/students/{student['id']}", headers=auth_headers)
    assert missing.status_code == 404
