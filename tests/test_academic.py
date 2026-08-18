def test_create_and_list_class(client, auth_headers):
    response = client.post(
        "/api/v1/academic/classes", json={"name": "Class 5", "order": 5}, headers=auth_headers
    )
    assert response.status_code == 200
    class_id = response.json()["id"]

    response = client.get("/api/v1/academic/classes", headers=auth_headers)
    assert response.status_code == 200
    assert any(c["id"] == class_id for c in response.json())


def test_create_section_and_subject(client, auth_headers):
    class_id = client.post(
        "/api/v1/academic/classes", json={"name": "Class 6"}, headers=auth_headers
    ).json()["id"]

    section = client.post(
        "/api/v1/academic/sections",
        json={"name": "A", "capacity": 40, "class_id": class_id},
        headers=auth_headers,
    )
    assert section.status_code == 200
    assert section.json()["class_id"] == class_id

    subject = client.post(
        "/api/v1/academic/subjects",
        json={"name": "Mathematics", "code": "MATH101", "class_id": class_id},
        headers=auth_headers,
    )
    assert subject.status_code == 200
    assert subject.json()["name"] == "Mathematics"


def test_academic_endpoints_require_auth(client):
    response = client.get("/api/v1/academic/classes")
    assert response.status_code == 401
