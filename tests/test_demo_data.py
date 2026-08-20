def test_status_starts_not_installed(client, auth_headers):
    response = client.get("/api/v1/demo-data/status", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == {"installed": False, "counts": {}}


def test_install_creates_data_across_modules(client, auth_headers):
    response = client.post("/api/v1/demo-data/install", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["installed"] is True
    counts = body["counts"]
    for table in ["students", "school_classes", "invoices", "hostel_allocations", "employees", "books", "results"]:
        assert counts.get(table, 0) > 0, f"expected {table} to have demo rows"

    assert client.get("/api/v1/students", headers=auth_headers).json()
    assert client.get("/api/v1/academic/classes", headers=auth_headers).json()
    assert client.get("/api/v1/hr/employees", headers=auth_headers).json()

    status = client.get("/api/v1/demo-data/status", headers=auth_headers).json()
    assert status["installed"] is True


def test_install_twice_conflicts(client, auth_headers):
    client.post("/api/v1/demo-data/install", headers=auth_headers)
    response = client.post("/api/v1/demo-data/install", headers=auth_headers)
    assert response.status_code == 409


def test_remove_deletes_everything_it_installed(client, auth_headers):
    client.post("/api/v1/demo-data/install", headers=auth_headers)

    response = client.post("/api/v1/demo-data/remove", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["installed"] is False

    assert client.get("/api/v1/students", headers=auth_headers).json() == []
    assert client.get("/api/v1/academic/classes", headers=auth_headers).json() == []
    assert client.get("/api/v1/hr/employees", headers=auth_headers).json() == []
    assert client.get("/api/v1/library/books", headers=auth_headers).json() == []

    status = client.get("/api/v1/demo-data/status", headers=auth_headers).json()
    assert status["installed"] is False


def test_remove_does_not_touch_real_data(client, auth_headers):
    real_class = client.post("/api/v1/academic/classes", json={"name": "Real Class"}, headers=auth_headers).json()
    real_student = client.post(
        "/api/v1/students", json={"name": "Real Student", "class_id": real_class["id"]}, headers=auth_headers
    ).json()

    client.post("/api/v1/demo-data/install", headers=auth_headers)
    client.post("/api/v1/demo-data/remove", headers=auth_headers)

    classes = client.get("/api/v1/academic/classes", headers=auth_headers).json()
    students = client.get("/api/v1/students", headers=auth_headers).json()
    assert [c["id"] for c in classes] == [real_class["id"]]
    assert [s["id"] for s in students] == [real_student["id"]]


def test_demo_data_endpoints_require_auth(client):
    assert client.get("/api/v1/demo-data/status").status_code == 401
    assert client.post("/api/v1/demo-data/install").status_code == 401
    assert client.post("/api/v1/demo-data/remove").status_code == 401


def test_install_crash_partway_leaves_ledger_consistent(client, auth_headers, monkeypatch):
    """Regression test for a production bug: a dropped connection partway
    through install left real rows committed (classes, students) but the
    status endpoint still said "not installed", because the ledger wasn't
    committed as often as the data it was tracking. Simulate a crash late
    in the install (HR section) and check the ledger and the DB agree on
    what actually exists, both before and after cleanup."""
    import app.demo_data as demo_data_module

    real_generate_payroll = demo_data_module.hr.generate_payroll

    def boom(*args, **kwargs):
        raise RuntimeError("simulated worker kill mid-install")

    monkeypatch.setattr(demo_data_module.hr, "generate_payroll", boom)

    response = client.post("/api/v1/demo-data/install", headers=auth_headers)
    assert response.status_code == 500

    # Status must reflect that something is actually installed -- not the
    # stale "not installed" the bug used to report.
    status = client.get("/api/v1/demo-data/status", headers=auth_headers).json()
    assert status["installed"] is True

    # Rows created before the crash point (classes, students, employees --
    # all created well before generate_payroll runs) really exist in the DB.
    assert client.get("/api/v1/academic/classes", headers=auth_headers).json()
    assert client.get("/api/v1/students", headers=auth_headers).json()
    assert client.get("/api/v1/hr/employees", headers=auth_headers).json()

    # A second install attempt correctly refuses rather than duplicating data.
    conflict = client.post("/api/v1/demo-data/install", headers=auth_headers)
    assert conflict.status_code == 409

    # Restore the real function and clean up -- remove must delete every
    # row the partial install actually created, leaving nothing orphaned.
    monkeypatch.setattr(demo_data_module.hr, "generate_payroll", real_generate_payroll)
    remove_response = client.post("/api/v1/demo-data/remove", headers=auth_headers)
    assert remove_response.status_code == 200

    assert client.get("/api/v1/academic/classes", headers=auth_headers).json() == []
    assert client.get("/api/v1/students", headers=auth_headers).json() == []
    assert client.get("/api/v1/hr/employees", headers=auth_headers).json() == []
    final_status = client.get("/api/v1/demo-data/status", headers=auth_headers).json()
    assert final_status["installed"] is False
