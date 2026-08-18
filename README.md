# School Management System

A modular school/college/university management backend, built with **FastAPI** +
**SQLAlchemy** + **Alembic**. Rebuilt from scratch in Python (previous version
was Laravel/PHP).

## Stack

- FastAPI (REST API, OpenAPI docs at `/docs`)
- SQLAlchemy 2.0 (ORM)
- Alembic (migrations)
- JWT auth (`python-jose`) + `bcrypt` password hashing
- SQLite by default, Postgres-ready via `DATABASE_URL`

## Modules so far

- **Auth & RBAC**: users, roles, permissions (`role.permissions` many-to-many;
  a user with role `admin` bypasses permission checks)
- **Academic structure**: classes, sections, subjects
- **Students**: profile, class/section assignment, `residency_type`
  (day scholar / hosteller) and hostel room number
- **Admission Enquiry (CRM)**: leads captured from advertisement / website /
  referral / walk-in / social media, tracked New → Contacted → Follow Up →
  Admitted/Rejected, with a `convert` action that creates the enrolled
  `Student` record from the enquiry's details
- **Hostel management**: hostels, rooms (with capacity), and allocations.
  Allocating a student enforces one active allocation per student and
  capacity per room, and flips the student's `residency_type` to hosteller
  (setting `hostel_room_no`); vacating reverts both.
- **Fees & finance**: fee heads (categories), invoices, and payments.
  Invoice balance is `amount + fine - discount - paid`, always computed
  from the sum of payments (never a stored running total, so it can't drift
  out of sync). Recording a payment rejects amounts over the remaining
  balance and flips invoice status Unpaid → Partial → Paid; an invoice can
  only be cancelled if it has no payments yet. Amounts use `Numeric(10,2)`
  end to end, not float, so balances never drift by a cent.
- **Library**: books (with `total_copies`) and issue/return/lost tracking.
  `available_copies` is always computed live from outstanding issues
  (Issued + Lost both count against it — a lost copy stays unavailable
  permanently, unlike a return), never a stored counter. Issuing checks
  availability and blocks a student from double-borrowing the same book;
  returning after the due date charges a per-day fine automatically.
- **Transport**: vehicles (with seat capacity), routes (fare + an assigned
  vehicle), ordered route stops, and student allocations. A route's
  effective capacity comes from its assigned vehicle, so allocating
  enforces one active allocation per student, seat capacity per route, a
  vehicle actually assigned to the route, and that a chosen stop belongs to
  the route being booked. Ending an allocation frees the seat.
- **Exams & results**: exams, grade scales (percentage bands → letter grade
  + GPA point), exam rules (total/pass marks per exam+class+subject), marks
  (upserted per student+exam+subject), and generated results. Recording a
  mark is validated against the matching exam rule (range-checked against
  `total_marks`); generating a result requires every configured subject to
  have a mark recorded first, and fails the student overall (grade `F`) if
  *any* single subject is below its own pass mark or the student was marked
  absent — even when the combined percentage would otherwise land in a
  passing band. Regenerating a result upserts in place rather than creating
  a duplicate row.
- **Certificates & course completion**: certificate types (e.g. Course
  Completion, Transfer, Character), each optionally flagged
  `requires_graduation`, and issued certificates per student. A type
  flagged `requires_graduation` can only be issued to a student whose
  `status` is Graduated (closing the admission → enrollment → exams →
  course-completion pipeline end to end); issuing also blocks a second
  *active* certificate of the same type for the same student, but revoking
  one frees that type up for reissue.
- **HR & payroll**: employees (optionally linked one-to-one to a login
  `User`), leave requests, and monthly payroll. A leave request can only be
  decided (approved/rejected) once — deciding an already-decided request is
  rejected, not silently overwritten. Payroll generation is deduplicated
  per employee+month+year, computes `net_salary = basic_salary + allowances
  - deductions`, blocks a negative net salary, and only pays employees who
  are still Active; marking paid is a one-way transition (can't un-pay or
  double-pay).

This covers the full pipeline the project set out to build: **advertisement
→ admission enquiry → enrolled student → academics/exams → fees → hostel/
transport/library services → course completion certificate**, plus the HR
side (staff, leave, payroll) running alongside it. Every module above
follows the same pattern — SQLAlchemy model → Pydantic schemas → CRUD →
router, registered in `app/api/v1/router.py` — so extending the system
(a new fee type, a new certificate rule, a whole new module) means adding
to that same stack rather than learning a new one.

## Getting started

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt   # includes test deps

cp .env.example .env                  # adjust as needed

alembic upgrade head                  # create the schema
python -m app.seed                    # seed permissions, admin role, first admin user

uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for interactive API docs.

Default admin login (from `.env.example`, change before deploying):
`admin@example.com` / `changeme123`

## Running tests

```bash
python -m pytest
```

Tests run against an isolated in-memory SQLite database, independent of your
local `school.db`.

## Project layout

```
app/
  core/        settings, database session, security (hashing/JWT)
  models/      SQLAlchemy models
  schemas/     Pydantic request/response models
  crud/        data access functions
  api/v1/      routers, one module per file under endpoints/
  seed.py      baseline permissions + admin role + first admin user
alembic/       migrations
tests/         pytest suite (httpx TestClient, in-memory SQLite)
```

## Adding a new module

1. Add a SQLAlchemy model in `app/models/`, register it in `app/models/__init__.py`.
2. Add Pydantic `Create`/`Update`/`Read` schemas in `app/schemas/`.
3. Add CRUD functions in `app/crud/`.
4. Add a router in `app/api/v1/endpoints/`, gate each route with
   `Depends(require_permission("module.action"))`, and register it in
   `app/api/v1/router.py`.
5. Add the new permission slugs to `PERMISSIONS` in `app/seed.py`.
6. `alembic revision --autogenerate -m "add <module>"` then `alembic upgrade head`.
7. Write tests under `tests/`.
