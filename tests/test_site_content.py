def _valid_payload(**overrides):
    payload = {
        "institution_name": "Test Institute",
        "hero_eyebrow": "Welcome",
        "hero_title": "A great place to learn",
        "hero_description": "Description",
        "established_year": "2000",
        "students_count": "1,000+",
        "faculty_count": "50+",
        "programs_count": "10",
        "about_description": "About text",
        "departments": [{"name": "Science", "blurb": "Physics and chemistry."}],
        "facilities": [{"name": "Library", "blurb": "Books."}],
        "faculty_strength": [{"department": "Science", "count": 12}],
        "achievements": [{"year": "2024", "title": "Award", "detail": "Detail"}],
        "placement_rate": "90%",
        "recruiting_partners": "20+",
        "avg_package": "$50k",
        "highest_package": "$100k",
        "career_services": [{"title": "Placement Cell", "blurb": "Runs drives."}],
        "contact_phone": "123-456",
        "contact_email": "info@test.example",
        "contact_address": "1 Test St",
    }
    payload.update(overrides)
    return payload


def test_get_site_content_is_public_and_returns_default(client):
    response = client.get("/api/v1/site-content")
    assert response.status_code == 200
    body = response.json()
    assert body["institution_name"] == "Greenwood International School & College"
    assert len(body["departments"]) == 8


def test_update_site_content_requires_auth(client):
    response = client.put("/api/v1/site-content", json=_valid_payload())
    assert response.status_code == 401


def test_admin_can_update_site_content(client, auth_headers):
    response = client.put("/api/v1/site-content", json=_valid_payload(institution_name="New Name"), headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["institution_name"] == "New Name"

    fetched = client.get("/api/v1/site-content")
    assert fetched.json()["institution_name"] == "New Name"


def test_update_rejects_missing_fields(client, auth_headers):
    payload = _valid_payload()
    del payload["institution_name"]
    response = client.put("/api/v1/site-content", json=payload, headers=auth_headers)
    assert response.status_code == 422
