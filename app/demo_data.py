"""One-click sample data for trying the app out, and a matching cleanup.

Everything created here is tracked in `demo_data_records` (table name + row
id) as it's created, so `remove_demo_data` can find and delete exactly those
rows -- and nothing a real user entered -- regardless of what names or
values were used.
"""

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.crud import academic, admission, attendance, certificate, exam, fee, hostel, hr, library, student, transport
from app.models.academic import SchoolClass, Section, Subject
from app.models.admission import AdmissionEnquiry
from app.models.attendance import Attendance
from app.models.certificate import Certificate, CertificateType
from app.models.demo_data import DemoDataRecord
from app.models.exam import Exam, ExamRule, GradeScale, Mark, Result
from app.models.fee import FeeHead, Invoice, Payment
from app.models.hostel import Hostel, HostelAllocation, HostelRoom
from app.models.hr import Employee, LeaveRequest, Payroll
from app.models.library import Book, BookIssue
from app.models.student import Student
from app.models.transport import Route, RouteStop, TransportAllocation, Vehicle
from app.schemas.admission import AdmissionEnquiryCreate
from app.schemas.attendance import AttendanceBulkMark, AttendanceEntry
from app.schemas.certificate import CertificateIssueCreate, CertificateTypeCreate
from app.schemas.exam import ExamCreate, ExamRuleCreate, GradeScaleCreate, MarkCreate
from app.schemas.fee import FeeHeadCreate, InvoiceCreate, PaymentCreate
from app.schemas.hostel import HostelAllocationCreate, HostelCreate, HostelRoomCreate
from app.schemas.hr import EmployeeCreate, LeaveRequestCreate, PayrollGenerate
from app.schemas.library import BookCreate, BookIssueCreate
from app.schemas.academic import SchoolClassCreate, SectionCreate, SubjectCreate
from app.schemas.student import StudentCreate
from app.schemas.transport import RouteCreate, RouteStopCreate, TransportAllocationCreate, VehicleCreate

# Deleted in this order so every FK points at a row already removed, or one
# about to survive (nothing here references a table later in the list).
_DELETE_ORDER: list[tuple[str, type]] = [
    ("payrolls", Payroll),
    ("leave_requests", LeaveRequest),
    ("employees", Employee),
    ("certificates", Certificate),
    ("certificate_types", CertificateType),
    ("book_issues", BookIssue),
    ("books", Book),
    ("transport_allocations", TransportAllocation),
    ("route_stops", RouteStop),
    ("routes", Route),
    ("vehicles", Vehicle),
    ("hostel_allocations", HostelAllocation),
    ("hostel_rooms", HostelRoom),
    ("hostels", Hostel),
    ("payments", Payment),
    ("invoices", Invoice),
    ("fee_heads", FeeHead),
    ("results", Result),
    ("marks", Mark),
    ("exam_rules", ExamRule),
    ("grade_scales", GradeScale),
    ("exams", Exam),
    ("attendance", Attendance),
    ("admission_enquiries", AdmissionEnquiry),
    ("students", Student),
    ("subjects", Subject),
    ("sections", Section),
    ("school_classes", SchoolClass),
]


def demo_data_installed(db: Session) -> bool:
    return db.query(DemoDataRecord).first() is not None


# How many tracked rows to batch before committing the ledger. Installing
# touches ~150-200 rows across every module, each already a network round
# trip to the database on its own -- committing the ledger after every
# single one would roughly double that. Batching keeps the ledger honest
# (a crash mid-install never leaves more than one batch untracked) without
# doubling the request's total round-trip count.
_LEDGER_COMMIT_BATCH = 20


def install_demo_data(db: Session, actor_user_id: int | None) -> dict[str, int]:
    if demo_data_installed(db):
        raise ValueError("Demo data is already installed")

    counts: dict[str, int] = {}
    untracked_since_commit = 0

    def bump(table: str, n: int = 1) -> None:
        counts[table] = counts.get(table, 0) + n

    def _track(db: Session, obj) -> None:
        nonlocal untracked_since_commit
        db.add(DemoDataRecord(table_name=obj.__tablename__, record_id=obj.id))
        untracked_since_commit += 1
        if untracked_since_commit >= _LEDGER_COMMIT_BATCH:
            db.commit()
            untracked_since_commit = 0

    def _flush() -> None:
        # Called at the end of each section below, in addition to the
        # every-20 batches inside long loops -- so a crash right after a
        # whole section (e.g. all employees created, about to start
        # payroll) can never leave that section's rows outside the ledger.
        nonlocal untracked_since_commit
        if untracked_since_commit:
            db.commit()
            untracked_since_commit = 0

    today = date.today()

    # -- Academic: 3 classes x 2 sections, 3 subjects per class -----------
    classes = []
    for i, name in enumerate(["Class 6", "Class 7", "Class 8"]):
        c = academic.create_class(db, SchoolClassCreate(name=name, order=i))
        _track(db, c)
        bump("school_classes")
        classes.append(c)
        for subj_name, code in [("Mathematics", "MATH"), ("Science", "SCI"), ("English", "ENG")]:
            s = academic.create_subject(db, SubjectCreate(name=subj_name, code=f"{code}{i}", class_id=c.id))
            _track(db, s)
            bump("subjects")

    sections_by_class: dict[int, list[Section]] = {}
    for c in classes:
        sections_by_class[c.id] = []
        for sec_name in ["A", "B"]:
            sec = academic.create_section(db, SectionCreate(name=sec_name, capacity=40, class_id=c.id))
            _track(db, sec)
            bump("sections")
            sections_by_class[c.id].append(sec)
    _flush()

    # -- Students: 2 per section, mixed day-scholar / hosteller -----------
    first_names = [
        "Aarav", "Vivaan", "Aditya", "Ishaan", "Kabir", "Riya", "Ananya", "Diya",
        "Myra", "Sara", "Arjun", "Kian", "Zoya", "Neha", "Rohan", "Tara", "Yash", "Meera",
    ]
    students: list[Student] = []
    name_i = 0
    for c in classes:
        for sec in sections_by_class[c.id]:
            for _ in range(2):
                name = f"{first_names[name_i % len(first_names)]} Sharma"
                name_i += 1
                st = student.create_student(
                    db,
                    StudentCreate(
                        name=name,
                        phone_no=f"98765{10000 + name_i:05d}",
                        email=f"{name.split()[0].lower()}.demo{name_i}@example.com",
                        guardian_name=f"Guardian of {name.split()[0]}",
                        guardian_phone_no=f"91234{10000 + name_i:05d}",
                        permanent_address="123 Demo Lane, Sample City",
                        residency_type=1,
                        class_id=c.id,
                        section_id=sec.id,
                    ),
                )
                _track(db, st)
                bump("students")
                students.append(st)
    _flush()

    # -- Admission enquiries -----------------------------------------------
    for i, (name, src, status) in enumerate([
        ("Kavya Iyer", 1, 1),
        ("Dev Patel", 2, 2),
        ("Anika Rao", 3, 3),
        ("Sameer Khan", 1, 1),
        ("Priya Nair", 4, 5),
    ]):
        enq = admission.create_enquiry(
            db,
            AdmissionEnquiryCreate(
                name=name,
                phone_no=f"90000{i:05d}",
                email=f"{name.split()[0].lower()}.enquiry@example.com",
                guardian_name=f"Parent of {name.split()[0]}",
                class_id=classes[i % len(classes)].id,
                source=src,
                note="Interested for the upcoming academic year.",
            ),
        )
        enq.status = status
        _track(db, enq)
        bump("admission_enquiries")
    _flush()

    # -- Attendance: last 3 weekdays, per class -----------------------------
    day = today
    marked_days = 0
    while marked_days < 3:
        day -= timedelta(days=1)
        if day.weekday() >= 5:
            continue
        marked_days += 1
        for c in classes:
            class_students = [s for s in students if s.class_id == c.id]
            entries = []
            for idx, s in enumerate(class_students):
                status_code = 2 if (idx == 0 and marked_days == 1) else (3 if (idx == 1 and marked_days == 2) else 1)
                entries.append(AttendanceEntry(student_id=s.id, status=status_code))
            rows = attendance.bulk_mark(
                db, AttendanceBulkMark(class_id=c.id, date=day, entries=entries), marked_by_id=actor_user_id
            )
            for row in rows:
                _track(db, row)
            bump("attendance", len(rows))
    _flush()

    # -- Exam: mid-term, one rule per (class, subject), marks + results ----
    ex = exam.create_exam(db, ExamCreate(name="Mid-Term Examination"))
    _track(db, ex)
    bump("exams")

    for gname, lo, hi, gp in [
        ("A+", "90", "100", "10"),
        ("A", "80", "89.99", "9"),
        ("B", "70", "79.99", "8"),
        ("C", "60", "69.99", "7"),
        ("D", "35", "59.99", "6"),
        ("F", "0", "34.99", "0"),
    ]:
        gs = exam.create_grade_scale(
            db, GradeScaleCreate(name=gname, min_percent=Decimal(lo), max_percent=Decimal(hi), grade_point=Decimal(gp))
        )
        _track(db, gs)
        bump("grade_scales")
    _flush()

    subjects_by_class: dict[int, list[Subject]] = {c.id: academic.list_subjects(db, c.id) for c in classes}
    for c in classes:
        for subj in subjects_by_class[c.id]:
            rule = exam.create_exam_rule(
                db, ExamRuleCreate(exam_id=ex.id, class_id=c.id, subject_id=subj.id, total_marks=Decimal("100"), pass_marks=Decimal("35"))
            )
            _track(db, rule)
            bump("exam_rules")
    _flush()

    for i, s in enumerate(students):
        for subj in subjects_by_class.get(s.class_id, []):
            marks_value = Decimal(str(40 + (i * 7 + subj.id * 3) % 55))
            mark = exam.record_mark(
                db, MarkCreate(exam_id=ex.id, student_id=s.id, subject_id=subj.id, marks_obtained=marks_value)
            )
            _track(db, mark)
            bump("marks")
        result = exam.generate_result(db, ex.id, s.id)
        _track(db, result)
        bump("results")
    _flush()

    # -- Fees: tuition fee head, one invoice per student, some paid --------
    tuition = fee.create_fee_head(db, FeeHeadCreate(name="Tuition Fee", description="Term tuition fee"))
    _track(db, tuition)
    bump("fee_heads")
    library_fee = fee.create_fee_head(db, FeeHeadCreate(name="Library Fee", description="Annual library fee"))
    _track(db, library_fee)
    bump("fee_heads")

    for i, s in enumerate(students):
        inv = fee.create_invoice(
            db,
            InvoiceCreate(
                student_id=s.id,
                fee_head_id=tuition.id,
                amount=Decimal("5000.00"),
                due_date=today + timedelta(days=20),
            ),
        )
        _track(db, inv)
        bump("invoices")
        if i % 2 == 0:
            pay = fee.record_payment(
                db, inv, PaymentCreate(amount=Decimal("5000.00"), method=1), received_by_id=actor_user_id
            )
            _track(db, pay)
            bump("payments")
        elif i % 3 == 0:
            pay = fee.record_payment(
                db, inv, PaymentCreate(amount=Decimal("2000.00"), method=2), received_by_id=actor_user_id
            )
            _track(db, pay)
            bump("payments")
    _flush()

    # -- Hostel: one hostel, 4 rooms, allocate a third of students ---------
    hostel_obj = hostel.create_hostel(db, HostelCreate(name="Campus Hostel", address="North Campus, Block C"))
    _track(db, hostel_obj)
    bump("hostels")
    rooms = []
    for room_no in ["G-101", "G-102", "F1-201", "F1-202"]:
        room = hostel.create_room(db, HostelRoomCreate(hostel_id=hostel_obj.id, room_no=room_no, capacity=2))
        _track(db, room)
        bump("hostel_rooms")
        rooms.append(room)

    hostel_students = students[::3]
    for i, s in enumerate(hostel_students):
        alloc = hostel.allocate(db, HostelAllocationCreate(student_id=s.id, room_id=rooms[i % len(rooms)].id))
        _track(db, alloc)
        bump("hostel_allocations")
    _flush()

    # -- Transport: one vehicle + route, allocate a few day scholars -------
    vehicle = transport.create_vehicle(
        db, VehicleCreate(registration_no="DEMO-BUS-01", vehicle_type="Bus", capacity=30, driver_name="Ramesh Kumar", driver_phone="9000011111")
    )
    _track(db, vehicle)
    bump("vehicles")
    route = transport.create_route(db, RouteCreate(name="Route 1 - City Center", fare=Decimal("800"), vehicle_id=vehicle.id))
    _track(db, route)
    bump("routes")
    stops = []
    for seq, stop_name in enumerate(["Main Market", "City Park", "Railway Station"]):
        stop = transport.create_stop(db, RouteStopCreate(route_id=route.id, name=stop_name, sequence=seq))
        _track(db, stop)
        bump("route_stops")
        stops.append(stop)

    day_scholars = [s for s in students if s not in hostel_students][:5]
    for i, s in enumerate(day_scholars):
        alloc = transport.allocate(
            db, TransportAllocationCreate(student_id=s.id, route_id=route.id, stop_id=stops[i % len(stops)].id)
        )
        _track(db, alloc)
        bump("transport_allocations")
    _flush()

    # -- Library: a handful of books, a couple of issues -------------------
    book_titles = [
        ("The Alchemist", "Paulo Coelho", "978-0062315007"),
        ("A Brief History of Time", "Stephen Hawking", "978-0553380163"),
        ("Wings of Fire", "A.P.J. Abdul Kalam", "978-8173711466"),
        ("To Kill a Mockingbird", "Harper Lee", "978-0446310789"),
        ("Introduction to Algorithms", "Cormen et al.", "978-0262033848"),
    ]
    books = []
    for title, author, isbn in book_titles:
        book = library.create_book(db, BookCreate(title=title, author=author, isbn=isbn, publisher="Demo Press", category="General", total_copies=3))
        _track(db, book)
        bump("books")
        books.append(book)

    for i, s in enumerate(students[:4]):
        issue = library.issue_book(
            db, BookIssueCreate(book_id=books[i % len(books)].id, student_id=s.id, due_date=today + timedelta(days=14))
        )
        _track(db, issue)
        bump("book_issues")
    _flush()

    # -- Certificates: bonafide certificate issued to a few students -------
    cert_type = certificate.create_certificate_type(db, CertificateTypeCreate(name="Bonafide Certificate", description="Confirms current enrollment"))
    _track(db, cert_type)
    bump("certificate_types")
    for s in students[:3]:
        cert = certificate.issue_certificate(
            db, CertificateIssueCreate(certificate_type_id=cert_type.id, student_id=s.id, remarks="Issued for demo purposes."), issued_by_id=actor_user_id
        )
        _track(db, cert)
        bump("certificates")
    _flush()

    # -- HR: a handful of staff, one leave request, payroll for this month -
    employees = []
    for name, designation, salary in [
        ("Anita Verma", "Mathematics Teacher", "35000"),
        ("Suresh Rao", "Science Teacher", "34000"),
        ("Kavitha Menon", "Librarian", "22000"),
        ("Ramesh Kumar", "Hostel Warden", "25000"),
        ("Deepa Joshi", "Accountant", "30000"),
    ]:
        emp = hr.create_employee(
            db, EmployeeCreate(name=name, designation=designation, phone_no="9000022222", email=f"{name.split()[0].lower()}.staff@example.com", basic_salary=Decimal(salary))
        )
        _track(db, emp)
        bump("employees")
        employees.append(emp)
    _flush()

    leave = hr.request_leave(
        db, LeaveRequestCreate(employee_id=employees[0].id, leave_type=2, start_date=today + timedelta(days=2), end_date=today + timedelta(days=3), reason="Fever, needs rest.")
    )
    _track(db, leave)
    bump("leave_requests")
    _flush()

    for i, emp in enumerate(employees):
        payroll = hr.generate_payroll(
            db, PayrollGenerate(employee_id=emp.id, month=today.month, year=today.year, allowances=Decimal("2000"), deductions=Decimal("500"))
        )
        _track(db, payroll)
        bump("payrolls")
        if i == 0:
            hr.mark_payroll_paid(db, payroll)

    db.commit()
    return counts


def remove_demo_data(db: Session) -> dict[str, int]:
    counts: dict[str, int] = {}
    for table_name, model in _DELETE_ORDER:
        ids = [
            r.record_id
            for r in db.query(DemoDataRecord).filter(DemoDataRecord.table_name == table_name).all()
        ]
        if not ids:
            continue
        deleted = db.query(model).filter(model.id.in_(ids)).delete(synchronize_session=False)
        counts[table_name] = deleted

    db.query(DemoDataRecord).delete(synchronize_session=False)
    db.commit()
    return counts
