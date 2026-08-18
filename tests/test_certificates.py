import pytest


@pytest.fixture
def active_student(client, auth_headers):
    return client.post(
        "/api/v1/students", json={"name": "Active Student"}, headers=auth_headers
    ).json()


@pytest.fixture
def graduated_student(client, auth_headers):
    student = client.post(
        "/api/v1/students", json={"name": "Graduate"}, headers=auth_headers
    ).json()
    client.put(f"/api/v1/students/{student['id']}", json={"status": 3}, headers=auth_headers)
    return client.get(f"/api/v1/students/{student['id']}", headers=auth_headers).json()


@pytest.fixture
def completion_type(client, auth_headers):
    return client.post(
        "/api/v1/certificates/types",
        json={"name": "Course Completion Certificate", "requires_graduation": True},
        headers=auth_headers,
    ).json()


@pytest.fixture
def character_type(client, auth_headers):
    return client.post(
        "/api/v1/certificates/types",
        json={"name": "Character Certificate", "requires_graduation": False},
        headers=auth_headers,
    ).json()


def test_completion_certificate_requires_graduation(client, auth_headers, completion_type, active_student):
    response = client.post(
        "/api/v1/certificates",
        json={"certificate_type_id": completion_type["id"], "student_id": active_student["id"]},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "graduated" in response.json()["detail"].lower()


def test_completion_certificate_issued_for_graduate(client, auth_headers, completion_type, graduated_student):
    response = client.post(
        "/api/v1/certificates",
        json={"certificate_type_id": completion_type["id"], "student_id": graduated_student["id"]},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == 1  # Issued
    assert body["certificate_no"].startswith("CERT")
    assert body["issued_by_id"] is not None


def test_certificate_without_graduation_requirement_issued_freely(client, auth_headers, character_type, active_student):
    response = client.post(
        "/api/v1/certificates",
        json={"certificate_type_id": character_type["id"], "student_id": active_student["id"]},
        headers=auth_headers,
    )
    assert response.status_code == 200


def test_cannot_double_issue_active_certificate_of_same_type(client, auth_headers, character_type, active_student):
    client.post(
        "/api/v1/certificates",
        json={"certificate_type_id": character_type["id"], "student_id": active_student["id"]},
        headers=auth_headers,
    )
    duplicate = client.post(
        "/api/v1/certificates",
        json={"certificate_type_id": character_type["id"], "student_id": active_student["id"]},
        headers=auth_headers,
    )
    assert duplicate.status_code == 400
    assert "already been issued" in duplicate.json()["detail"].lower()


def test_revoke_then_reissue_is_allowed(client, auth_headers, character_type, active_student):
    certificate = client.post(
        "/api/v1/certificates",
        json={"certificate_type_id": character_type["id"], "student_id": active_student["id"]},
        headers=auth_headers,
    ).json()

    revoked = client.post(
        f"/api/v1/certificates/{certificate['id']}/revoke",
        json={"reason": "Issued in error"},
        headers=auth_headers,
    )
    assert revoked.status_code == 200
    assert revoked.json()["status"] == 2  # Revoked
    assert revoked.json()["revoked_reason"] == "Issued in error"
    assert revoked.json()["revoked_date"] is not None

    reissued = client.post(
        "/api/v1/certificates",
        json={"certificate_type_id": character_type["id"], "student_id": active_student["id"]},
        headers=auth_headers,
    )
    assert reissued.status_code == 200
    assert reissued.json()["id"] != certificate["id"]


def test_cannot_revoke_twice(client, auth_headers, character_type, active_student):
    certificate = client.post(
        "/api/v1/certificates",
        json={"certificate_type_id": character_type["id"], "student_id": active_student["id"]},
        headers=auth_headers,
    ).json()
    client.post(
        f"/api/v1/certificates/{certificate['id']}/revoke",
        json={"reason": "First revoke"},
        headers=auth_headers,
    )
    second = client.post(
        f"/api/v1/certificates/{certificate['id']}/revoke",
        json={"reason": "Second revoke"},
        headers=auth_headers,
    )
    assert second.status_code == 400


def test_inactive_certificate_type_blocks_issuance(client, auth_headers, character_type, active_student):
    client.put(
        f"/api/v1/certificates/types/{character_type['id']}",
        json={"is_active": False},
        headers=auth_headers,
    )
    response = client.post(
        "/api/v1/certificates",
        json={"certificate_type_id": character_type["id"], "student_id": active_student["id"]},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_list_certificates_filtered_by_student(client, auth_headers, character_type, active_student, graduated_student):
    client.post(
        "/api/v1/certificates",
        json={"certificate_type_id": character_type["id"], "student_id": active_student["id"]},
        headers=auth_headers,
    )
    client.post(
        "/api/v1/certificates",
        json={"certificate_type_id": character_type["id"], "student_id": graduated_student["id"]},
        headers=auth_headers,
    )

    response = client.get(f"/api/v1/certificates?student_id={active_student['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["student_id"] == active_student["id"]


def test_certificate_endpoints_require_auth(client):
    response = client.get("/api/v1/certificates")
    assert response.status_code == 401
