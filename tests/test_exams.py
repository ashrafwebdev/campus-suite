import pytest


@pytest.fixture
def school_class(client, auth_headers):
    return client.post(
        "/api/v1/academic/classes", json={"name": "Class 8"}, headers=auth_headers
    ).json()


@pytest.fixture
def subjects(client, auth_headers, school_class):
    math = client.post(
        "/api/v1/academic/subjects",
        json={"name": "Math", "code": "MATH", "class_id": school_class["id"]},
        headers=auth_headers,
    ).json()
    english = client.post(
        "/api/v1/academic/subjects",
        json={"name": "English", "code": "ENG", "class_id": school_class["id"]},
        headers=auth_headers,
    ).json()
    return math, english


@pytest.fixture
def exam(client, auth_headers):
    return client.post("/api/v1/exams", json={"name": "Mid Term"}, headers=auth_headers).json()


@pytest.fixture
def exam_rules(client, auth_headers, exam, school_class, subjects):
    math, english = subjects
    rule_math = client.post(
        "/api/v1/exams/rules",
        json={
            "exam_id": exam["id"],
            "class_id": school_class["id"],
            "subject_id": math["id"],
            "total_marks": "100",
            "pass_marks": "33",
        },
        headers=auth_headers,
    ).json()
    rule_english = client.post(
        "/api/v1/exams/rules",
        json={
            "exam_id": exam["id"],
            "class_id": school_class["id"],
            "subject_id": english["id"],
            "total_marks": "100",
            "pass_marks": "33",
        },
        headers=auth_headers,
    ).json()
    return rule_math, rule_english


@pytest.fixture
def grade_scales(client, auth_headers):
    bands = [
        ("A+", "80", "100", "5.00"),
        ("A", "70", "79.99", "4.00"),
        ("B", "60", "69.99", "3.50"),
        ("C", "50", "59.99", "3.00"),
        ("D", "33", "49.99", "2.00"),
    ]
    created = []
    for name, lo, hi, point in bands:
        created.append(
            client.post(
                "/api/v1/exams/grade-scales",
                json={"name": name, "min_percent": lo, "max_percent": hi, "grade_point": point},
                headers=auth_headers,
            ).json()
        )
    return created


@pytest.fixture
def student_in_class(client, auth_headers, school_class):
    return client.post(
        "/api/v1/students",
        json={"name": "Exam Student", "class_id": school_class["id"]},
        headers=auth_headers,
    ).json()


def test_exam_rule_requires_subject_belongs_to_class(client, auth_headers, exam, subjects):
    other_class = client.post(
        "/api/v1/academic/classes", json={"name": "Class 9"}, headers=auth_headers
    ).json()
    math, _ = subjects

    response = client.post(
        "/api/v1/exams/rules",
        json={
            "exam_id": exam["id"],
            "class_id": other_class["id"],
            "subject_id": math["id"],
            "total_marks": "100",
            "pass_marks": "33",
        },
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "class" in response.json()["detail"].lower()


def test_exam_rule_rejects_pass_marks_over_total(client, auth_headers, exam, school_class, subjects):
    math, _ = subjects
    response = client.post(
        "/api/v1/exams/rules",
        json={
            "exam_id": exam["id"],
            "class_id": school_class["id"],
            "subject_id": math["id"],
            "total_marks": "100",
            "pass_marks": "150",
        },
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_duplicate_exam_rule_rejected(client, auth_headers, exam_rules):
    rule_math, _ = exam_rules
    response = client.post(
        "/api/v1/exams/rules",
        json={
            "exam_id": rule_math["exam_id"],
            "class_id": rule_math["class_id"],
            "subject_id": rule_math["subject_id"],
            "total_marks": "100",
            "pass_marks": "33",
        },
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()


def test_record_mark_without_exam_rule_fails(client, auth_headers, exam, student_in_class, subjects):
    math, _ = subjects
    response = client.post(
        "/api/v1/exams/marks",
        json={"exam_id": exam["id"], "student_id": student_in_class["id"], "subject_id": math["id"], "marks_obtained": "80"},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "no exam rule" in response.json()["detail"].lower()


def test_record_mark_rejects_out_of_range(client, auth_headers, exam_rules, exam, student_in_class, subjects):
    math, _ = subjects
    response = client.post(
        "/api/v1/exams/marks",
        json={"exam_id": exam["id"], "student_id": student_in_class["id"], "subject_id": math["id"], "marks_obtained": "150"},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_record_mark_upserts(client, auth_headers, exam_rules, exam, student_in_class, subjects):
    math, _ = subjects
    first = client.post(
        "/api/v1/exams/marks",
        json={"exam_id": exam["id"], "student_id": student_in_class["id"], "subject_id": math["id"], "marks_obtained": "70"},
        headers=auth_headers,
    ).json()
    second = client.post(
        "/api/v1/exams/marks",
        json={"exam_id": exam["id"], "student_id": student_in_class["id"], "subject_id": math["id"], "marks_obtained": "85"},
        headers=auth_headers,
    ).json()
    assert first["id"] == second["id"]
    assert float(second["marks_obtained"]) == 85.0


def test_generate_result_requires_all_subjects_marked(client, auth_headers, exam_rules, exam, student_in_class, subjects):
    math, _ = subjects
    client.post(
        "/api/v1/exams/marks",
        json={"exam_id": exam["id"], "student_id": student_in_class["id"], "subject_id": math["id"], "marks_obtained": "70"},
        headers=auth_headers,
    )
    # english mark not recorded
    response = client.post(
        f"/api/v1/exams/results/generate?exam_id={exam['id']}&student_id={student_in_class['id']}",
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "not recorded" in response.json()["detail"].lower()


def test_generate_result_pass_computes_grade(
    client, auth_headers, exam_rules, grade_scales, exam, student_in_class, subjects
):
    math, english = subjects
    client.post(
        "/api/v1/exams/marks",
        json={"exam_id": exam["id"], "student_id": student_in_class["id"], "subject_id": math["id"], "marks_obtained": "90"},
        headers=auth_headers,
    )
    client.post(
        "/api/v1/exams/marks",
        json={"exam_id": exam["id"], "student_id": student_in_class["id"], "subject_id": english["id"], "marks_obtained": "70"},
        headers=auth_headers,
    )

    response = client.post(
        f"/api/v1/exams/results/generate?exam_id={exam['id']}&student_id={student_in_class['id']}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["is_pass"] is True
    assert float(body["total_obtained"]) == 160.0
    assert float(body["total_max"]) == 200.0
    assert float(body["percentage"]) == 80.0
    assert body["grade"] == "A+"
    assert float(body["grade_point"]) == 5.0


def test_generate_result_fail_one_subject_below_pass_marks(
    client, auth_headers, exam_rules, grade_scales, exam, student_in_class, subjects
):
    math, english = subjects
    client.post(
        "/api/v1/exams/marks",
        json={"exam_id": exam["id"], "student_id": student_in_class["id"], "subject_id": math["id"], "marks_obtained": "90"},
        headers=auth_headers,
    )
    # below pass_marks of 33
    client.post(
        "/api/v1/exams/marks",
        json={"exam_id": exam["id"], "student_id": student_in_class["id"], "subject_id": english["id"], "marks_obtained": "20"},
        headers=auth_headers,
    )

    response = client.post(
        f"/api/v1/exams/results/generate?exam_id={exam['id']}&student_id={student_in_class['id']}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    # even though overall percentage (110/200=55%) would land in a passing band,
    # failing one subject's pass_marks must force an overall fail with grade F
    assert body["is_pass"] is False
    assert body["grade"] == "F"
    assert float(body["grade_point"]) == 0.0


def test_generate_result_absent_counts_as_fail(
    client, auth_headers, exam_rules, grade_scales, exam, student_in_class, subjects
):
    math, english = subjects
    client.post(
        "/api/v1/exams/marks",
        json={"exam_id": exam["id"], "student_id": student_in_class["id"], "subject_id": math["id"], "marks_obtained": "90"},
        headers=auth_headers,
    )
    client.post(
        "/api/v1/exams/marks",
        json={"exam_id": exam["id"], "student_id": student_in_class["id"], "subject_id": english["id"], "is_absent": True},
        headers=auth_headers,
    )

    response = client.post(
        f"/api/v1/exams/results/generate?exam_id={exam['id']}&student_id={student_in_class['id']}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["is_pass"] is False
    assert response.json()["grade"] == "F"


def test_generate_result_is_idempotent_upsert(
    client, auth_headers, exam_rules, grade_scales, exam, student_in_class, subjects
):
    math, english = subjects
    client.post(
        "/api/v1/exams/marks",
        json={"exam_id": exam["id"], "student_id": student_in_class["id"], "subject_id": math["id"], "marks_obtained": "90"},
        headers=auth_headers,
    )
    client.post(
        "/api/v1/exams/marks",
        json={"exam_id": exam["id"], "student_id": student_in_class["id"], "subject_id": english["id"], "marks_obtained": "70"},
        headers=auth_headers,
    )

    first = client.post(
        f"/api/v1/exams/results/generate?exam_id={exam['id']}&student_id={student_in_class['id']}",
        headers=auth_headers,
    ).json()

    # bump a mark and regenerate
    client.post(
        "/api/v1/exams/marks",
        json={"exam_id": exam["id"], "student_id": student_in_class["id"], "subject_id": english["id"], "marks_obtained": "50"},
        headers=auth_headers,
    )
    second = client.post(
        f"/api/v1/exams/results/generate?exam_id={exam['id']}&student_id={student_in_class['id']}",
        headers=auth_headers,
    ).json()

    assert first["id"] == second["id"]
    assert float(second["total_obtained"]) == 140.0

    results = client.get(f"/api/v1/exams/results?exam_id={exam['id']}", headers=auth_headers).json()
    assert len(results) == 1


def test_exam_endpoints_require_auth(client):
    response = client.get("/api/v1/exams")
    assert response.status_code == 401
