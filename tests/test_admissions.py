def test_create_enquiry_defaults_to_new_status(client, auth_headers):
    response = client.post(
        "/api/v1/admissions",
        json={"name": "John Doe", "phone_no": "01700000000", "source": 1},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == 1  # New
    assert body["enquiry_no"].startswith("ENQ")


def test_filter_enquiries_by_status(client, auth_headers):
    client.post(
        "/api/v1/admissions",
        json={"name": "Lead A", "phone_no": "01700000001"},
        headers=auth_headers,
    )
    enquiry = client.post(
        "/api/v1/admissions",
        json={"name": "Lead B", "phone_no": "01700000002"},
        headers=auth_headers,
    ).json()

    client.put(
        f"/api/v1/admissions/{enquiry['id']}", json={"status": 2}, headers=auth_headers
    )

    response = client.get("/api/v1/admissions?status=2", headers=auth_headers)
    assert response.status_code == 200
    names = [e["name"] for e in response.json()]
    assert names == ["Lead B"]


def test_convert_enquiry_creates_linked_student(client, auth_headers):
    enquiry = client.post(
        "/api/v1/admissions",
        json={
            "name": "Jane Doe",
            "phone_no": "01700000003",
            "guardian_name": "Guardian Doe",
            "address": "123 Street",
        },
        headers=auth_headers,
    ).json()

    response = client.post(f"/api/v1/admissions/{enquiry['id']}/convert", headers=auth_headers)
    assert response.status_code == 200
    student = response.json()
    assert student["name"] == "Jane Doe"
    assert student["guardian_name"] == "Guardian Doe"
    assert student["permanent_address"] == "123 Street"

    updated_enquiry = client.get(f"/api/v1/admissions/{enquiry['id']}", headers=auth_headers).json()
    assert updated_enquiry["status"] == 4  # Admitted
    assert updated_enquiry["student_id"] == student["id"]


def test_cannot_convert_enquiry_twice(client, auth_headers):
    enquiry = client.post(
        "/api/v1/admissions",
        json={"name": "Jane Doe", "phone_no": "01700000003"},
        headers=auth_headers,
    ).json()

    client.post(f"/api/v1/admissions/{enquiry['id']}/convert", headers=auth_headers)
    second = client.post(f"/api/v1/admissions/{enquiry['id']}/convert", headers=auth_headers)
    assert second.status_code == 400
