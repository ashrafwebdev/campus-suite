from fastapi import APIRouter

from app.api.v1.endpoints import academic, admissions, auth, certificates, exams, fees, hostel, hr, library, roles, students, transport, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(academic.router, prefix="/academic", tags=["academic"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(admissions.router, prefix="/admissions", tags=["admissions"])
api_router.include_router(hostel.router, prefix="/hostel", tags=["hostel"])
api_router.include_router(fees.router, prefix="/fees", tags=["fees"])
api_router.include_router(library.router, prefix="/library", tags=["library"])
api_router.include_router(transport.router, prefix="/transport", tags=["transport"])
api_router.include_router(exams.router, prefix="/exams", tags=["exams"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["certificates"])
api_router.include_router(hr.router, prefix="/hr", tags=["hr"])
