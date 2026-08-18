import pytest


@pytest.fixture
def employee(client, auth_headers):
    return client.post(
        "/api/v1/hr/employees",
        json={
            "name": "Jane Teacher",
            "designation": "Teacher",
            "joining_date": "2020-01-01",
            "basic_salary": "50000.00",
        },
        headers=auth_headers,
    ).json()


def test_create_employee_generates_employee_no(client, auth_headers, employee):
    assert employee["employee_no"].startswith("EMP")
    assert employee["status"] == 1  # Active


def test_employee_linked_to_existing_user_rejects_double_link(client, auth_headers):
    me = client.get("/api/v1/auth/me", headers=auth_headers).json()

    first = client.post(
        "/api/v1/hr/employees",
        json={"name": "Admin Person", "designation": "Administrator", "user_id": me["id"], "basic_salary": "0"},
        headers=auth_headers,
    )
    assert first.status_code == 200

    duplicate = client.post(
        "/api/v1/hr/employees",
        json={"name": "Someone Else", "designation": "Clerk", "user_id": me["id"], "basic_salary": "0"},
        headers=auth_headers,
    )
    assert duplicate.status_code == 400
    assert "already linked" in duplicate.json()["detail"].lower()


def test_request_leave_validates_date_order(client, auth_headers, employee):
    response = client.post(
        "/api/v1/hr/leaves",
        json={
            "employee_id": employee["id"],
            "leave_type": 1,
            "start_date": "2026-06-10",
            "end_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_request_leave_defaults_to_pending(client, auth_headers, employee):
    response = client.post(
        "/api/v1/hr/leaves",
        json={"employee_id": employee["id"], "start_date": "2026-06-01", "end_date": "2026-06-03"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == 1  # Pending


def test_approve_leave(client, auth_headers, employee):
    leave = client.post(
        "/api/v1/hr/leaves",
        json={"employee_id": employee["id"], "start_date": "2026-06-01", "end_date": "2026-06-03"},
        headers=auth_headers,
    ).json()

    response = client.post(
        f"/api/v1/hr/leaves/{leave['id']}/approve", json={"note": "Approved, enjoy"}, headers=auth_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == 2  # Approved
    assert body["approved_by_id"] is not None
    assert body["decision_note"] == "Approved, enjoy"
    assert body["decided_date"] is not None


def test_reject_leave(client, auth_headers, employee):
    leave = client.post(
        "/api/v1/hr/leaves",
        json={"employee_id": employee["id"], "start_date": "2026-06-01", "end_date": "2026-06-03"},
        headers=auth_headers,
    ).json()

    response = client.post(
        f"/api/v1/hr/leaves/{leave['id']}/reject", json={"note": "Understaffed"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == 3  # Rejected


def test_cannot_decide_leave_twice(client, auth_headers, employee):
    leave = client.post(
        "/api/v1/hr/leaves",
        json={"employee_id": employee["id"], "start_date": "2026-06-01", "end_date": "2026-06-03"},
        headers=auth_headers,
    ).json()
    client.post(f"/api/v1/hr/leaves/{leave['id']}/approve", json={}, headers=auth_headers)

    second = client.post(f"/api/v1/hr/leaves/{leave['id']}/reject", json={}, headers=auth_headers)
    assert second.status_code == 400
    assert "already been decided" in second.json()["detail"].lower()


def test_generate_payroll_computes_net_salary(client, auth_headers, employee):
    response = client.post(
        "/api/v1/hr/payroll",
        json={"employee_id": employee["id"], "month": 6, "year": 2026, "allowances": "5000.00", "deductions": "1000.00"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    # 50000 + 5000 - 1000 = 54000
    assert float(body["net_salary"]) == 54000.0
    assert body["status"] == 1  # Pending


def test_cannot_generate_duplicate_payroll_for_same_month(client, auth_headers, employee):
    client.post(
        "/api/v1/hr/payroll",
        json={"employee_id": employee["id"], "month": 6, "year": 2026},
        headers=auth_headers,
    )
    duplicate = client.post(
        "/api/v1/hr/payroll",
        json={"employee_id": employee["id"], "month": 6, "year": 2026},
        headers=auth_headers,
    )
    assert duplicate.status_code == 400
    assert "already been generated" in duplicate.json()["detail"].lower()


def test_payroll_rejects_deductions_exceeding_pay(client, auth_headers, employee):
    response = client.post(
        "/api/v1/hr/payroll",
        json={"employee_id": employee["id"], "month": 7, "year": 2026, "deductions": "999999.00"},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_payroll_rejects_invalid_month(client, auth_headers, employee):
    response = client.post(
        "/api/v1/hr/payroll",
        json={"employee_id": employee["id"], "month": 13, "year": 2026},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_mark_payroll_paid(client, auth_headers, employee):
    payroll = client.post(
        "/api/v1/hr/payroll",
        json={"employee_id": employee["id"], "month": 8, "year": 2026},
        headers=auth_headers,
    ).json()

    response = client.post(f"/api/v1/hr/payroll/{payroll['id']}/pay", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == 2  # Paid
    assert response.json()["paid_date"] is not None

    second = client.post(f"/api/v1/hr/payroll/{payroll['id']}/pay", headers=auth_headers)
    assert second.status_code == 400


def test_cannot_generate_payroll_for_inactive_employee(client, auth_headers, employee):
    client.put(f"/api/v1/hr/employees/{employee['id']}", json={"status": 2}, headers=auth_headers)

    response = client.post(
        "/api/v1/hr/payroll",
        json={"employee_id": employee["id"], "month": 9, "year": 2026},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_hr_endpoints_require_auth(client):
    response = client.get("/api/v1/hr/employees")
    assert response.status_code == 401
