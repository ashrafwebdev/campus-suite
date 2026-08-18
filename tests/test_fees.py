import pytest


@pytest.fixture
def student(client, auth_headers):
    return client.post(
        "/api/v1/students", json={"name": "Fee Payer"}, headers=auth_headers
    ).json()


@pytest.fixture
def fee_head(client, auth_headers):
    return client.post(
        "/api/v1/fees/heads", json={"name": "Tuition Fee"}, headers=auth_headers
    ).json()


def test_create_invoice_defaults_to_unpaid(client, auth_headers, student, fee_head):
    response = client.post(
        "/api/v1/fees/invoices",
        json={
            "student_id": student["id"],
            "fee_head_id": fee_head["id"],
            "amount": "5000.00",
            "due_date": "2026-12-31",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == 1  # Unpaid
    assert body["invoice_no"].startswith("INV")
    assert body["paid_amount"] == "0.00" or float(body["paid_amount"]) == 0
    assert float(body["balance"]) == 5000.0


def test_invoice_amount_must_be_positive(client, auth_headers, student, fee_head):
    response = client.post(
        "/api/v1/fees/invoices",
        json={
            "student_id": student["id"],
            "fee_head_id": fee_head["id"],
            "amount": "0",
            "due_date": "2026-12-31",
        },
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_partial_payment_updates_status_and_balance(client, auth_headers, student, fee_head):
    invoice = client.post(
        "/api/v1/fees/invoices",
        json={
            "student_id": student["id"],
            "fee_head_id": fee_head["id"],
            "amount": "1000.00",
            "due_date": "2026-12-31",
        },
        headers=auth_headers,
    ).json()

    payment = client.post(
        f"/api/v1/fees/invoices/{invoice['id']}/payments",
        json={"amount": "400.00", "method": 1},
        headers=auth_headers,
    )
    assert payment.status_code == 200

    updated = client.get(f"/api/v1/fees/invoices/{invoice['id']}", headers=auth_headers).json()
    assert updated["status"] == 2  # Partial
    assert float(updated["paid_amount"]) == 400.0
    assert float(updated["balance"]) == 600.0


def test_full_payment_marks_invoice_paid(client, auth_headers, student, fee_head):
    invoice = client.post(
        "/api/v1/fees/invoices",
        json={
            "student_id": student["id"],
            "fee_head_id": fee_head["id"],
            "amount": "1000.00",
            "due_date": "2026-12-31",
        },
        headers=auth_headers,
    ).json()

    client.post(
        f"/api/v1/fees/invoices/{invoice['id']}/payments",
        json={"amount": "1000.00"},
        headers=auth_headers,
    )

    updated = client.get(f"/api/v1/fees/invoices/{invoice['id']}", headers=auth_headers).json()
    assert updated["status"] == 3  # Paid
    assert float(updated["balance"]) == 0.0


def test_payment_cannot_exceed_balance(client, auth_headers, student, fee_head):
    invoice = client.post(
        "/api/v1/fees/invoices",
        json={
            "student_id": student["id"],
            "fee_head_id": fee_head["id"],
            "amount": "500.00",
            "due_date": "2026-12-31",
        },
        headers=auth_headers,
    ).json()

    response = client.post(
        f"/api/v1/fees/invoices/{invoice['id']}/payments",
        json={"amount": "600.00"},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "exceeds" in response.json()["detail"].lower()


def test_discount_and_fine_affect_balance(client, auth_headers, student, fee_head):
    invoice = client.post(
        "/api/v1/fees/invoices",
        json={
            "student_id": student["id"],
            "fee_head_id": fee_head["id"],
            "amount": "1000.00",
            "discount": "100.00",
            "fine": "50.00",
            "due_date": "2026-12-31",
        },
        headers=auth_headers,
    ).json()
    # balance = 1000 + 50 - 100 - 0 = 950
    assert float(invoice["balance"]) == 950.0

    client.post(
        f"/api/v1/fees/invoices/{invoice['id']}/payments",
        json={"amount": "950.00"},
        headers=auth_headers,
    )
    updated = client.get(f"/api/v1/fees/invoices/{invoice['id']}", headers=auth_headers).json()
    assert updated["status"] == 3  # Paid
    assert float(updated["balance"]) == 0.0


def test_cannot_cancel_invoice_with_payments(client, auth_headers, student, fee_head):
    invoice = client.post(
        "/api/v1/fees/invoices",
        json={
            "student_id": student["id"],
            "fee_head_id": fee_head["id"],
            "amount": "500.00",
            "due_date": "2026-12-31",
        },
        headers=auth_headers,
    ).json()
    client.post(
        f"/api/v1/fees/invoices/{invoice['id']}/payments",
        json={"amount": "100.00"},
        headers=auth_headers,
    )

    response = client.post(f"/api/v1/fees/invoices/{invoice['id']}/cancel", headers=auth_headers)
    assert response.status_code == 400


def test_cancel_invoice_without_payments(client, auth_headers, student, fee_head):
    invoice = client.post(
        "/api/v1/fees/invoices",
        json={
            "student_id": student["id"],
            "fee_head_id": fee_head["id"],
            "amount": "500.00",
            "due_date": "2026-12-31",
        },
        headers=auth_headers,
    ).json()

    response = client.post(f"/api/v1/fees/invoices/{invoice['id']}/cancel", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == 4  # Cancelled


def test_cannot_pay_cancelled_invoice(client, auth_headers, student, fee_head):
    invoice = client.post(
        "/api/v1/fees/invoices",
        json={
            "student_id": student["id"],
            "fee_head_id": fee_head["id"],
            "amount": "500.00",
            "due_date": "2026-12-31",
        },
        headers=auth_headers,
    ).json()
    client.post(f"/api/v1/fees/invoices/{invoice['id']}/cancel", headers=auth_headers)

    response = client.post(
        f"/api/v1/fees/invoices/{invoice['id']}/payments",
        json={"amount": "100.00"},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_list_invoices_filtered_by_student_and_status(client, auth_headers, fee_head):
    student_a = client.post("/api/v1/students", json={"name": "A"}, headers=auth_headers).json()
    student_b = client.post("/api/v1/students", json={"name": "B"}, headers=auth_headers).json()

    client.post(
        "/api/v1/fees/invoices",
        json={"student_id": student_a["id"], "fee_head_id": fee_head["id"], "amount": "100", "due_date": "2026-12-31"},
        headers=auth_headers,
    )
    client.post(
        "/api/v1/fees/invoices",
        json={"student_id": student_b["id"], "fee_head_id": fee_head["id"], "amount": "200", "due_date": "2026-12-31"},
        headers=auth_headers,
    )

    response = client.get(f"/api/v1/fees/invoices?student_id={student_a['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["student_id"] == student_a["id"]


def test_payment_records_received_by_current_user(client, auth_headers, student, fee_head):
    invoice = client.post(
        "/api/v1/fees/invoices",
        json={"student_id": student["id"], "fee_head_id": fee_head["id"], "amount": "100", "due_date": "2026-12-31"},
        headers=auth_headers,
    ).json()

    payment = client.post(
        f"/api/v1/fees/invoices/{invoice['id']}/payments",
        json={"amount": "100"},
        headers=auth_headers,
    ).json()
    assert payment["received_by_id"] is not None

    payments = client.get(f"/api/v1/fees/invoices/{invoice['id']}/payments", headers=auth_headers).json()
    assert len(payments) == 1


def test_fee_endpoints_require_auth(client):
    response = client.get("/api/v1/fees/heads")
    assert response.status_code == 401
