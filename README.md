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

More modules (library, transport, exams & results,
certificates/course-completion, HR/payroll) are planned to follow the same
pattern: SQLAlchemy model → Pydantic schemas → CRUD → router, registered in
`app/api/v1/router.py`.

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
