from sqlalchemy.orm import Session

from app.models.site_content import SiteContent
from app.schemas.site_content import SiteContentData

SINGLETON_ID = 1

DEFAULT_SITE_CONTENT: dict = {
    "institution_name": "Greenwood International School & College",
    "hero_eyebrow": "Welcome to Greenwood",
    "hero_title": "Shaping curious minds, from first grade through graduation",
    "hero_description": (
        "A single campus spanning school and college education — eight departments, modern facilities, "
        "and a dedicated career guidance cell, all committed to helping every student go further."
    ),
    "established_year": "1998",
    "students_count": "6,200+",
    "faculty_count": "340+",
    "programs_count": "42",
    "about_description": (
        "Greenwood brings school and college education onto one campus, so students move from their first "
        "classroom to their first career step without ever changing address. Our mission is simple: strong "
        "academics, well-rounded facilities, and guidance that follows every student past graduation."
    ),
    "departments": [
        {"name": "Computer Science & IT", "blurb": "Software engineering, AI/ML, data science, and networking, with dedicated computing labs."},
        {"name": "Engineering & Technology", "blurb": "Mechanical, electrical, and civil engineering foundations with hands-on workshop training."},
        {"name": "Business & Commerce", "blurb": "Accounting, finance, and business administration, paired with a student-run enterprise lab."},
        {"name": "Science", "blurb": "Physics, chemistry, and biology with fully equipped research and demonstration laboratories."},
        {"name": "Arts & Humanities", "blurb": "Literature, history, and social sciences, with an active debate and publishing society."},
        {"name": "Mathematics & Statistics", "blurb": "Pure and applied mathematics, statistics, and a peer-tutoring center for every grade."},
        {"name": "Fine Arts & Design", "blurb": "Visual arts, music, and design studios, culminating in an annual public exhibition."},
        {"name": "Physical Education & Sports", "blurb": "Structured athletics, team sports, and fitness programs across all age groups."},
    ],
    "facilities": [
        {"name": "Central Library", "blurb": "Over 40,000 volumes, digital journal access, and quiet study halls open through the evening."},
        {"name": "Science & Computer Labs", "blurb": "Dedicated physics, chemistry, biology, and computing labs with modern instrumentation."},
        {"name": "Sports Complex", "blurb": "Indoor and outdoor courts, an athletics track, and a fully equipped fitness center."},
        {"name": "Hostel", "blurb": "Separate boys' and girls' residences with wardens on-site, mess halls, and study rooms."},
        {"name": "Transport", "blurb": "A fleet of monitored buses covering every major route, with live pickup and drop timings."},
        {"name": "Auditorium", "blurb": "A 900-seat auditorium hosting assemblies, cultural events, and guest lectures."},
        {"name": "Health Center", "blurb": "An on-campus nurse, first-aid facilities, and a tie-up with the nearby general hospital."},
        {"name": "Wi-Fi Campus", "blurb": "High-speed internet across every classroom, lab, and common area."},
    ],
    "faculty_strength": [
        {"department": "Computer Science & IT", "count": 48},
        {"department": "Engineering & Technology", "count": 62},
        {"department": "Business & Commerce", "count": 40},
        {"department": "Science", "count": 55},
        {"department": "Arts & Humanities", "count": 44},
        {"department": "Mathematics & Statistics", "count": 30},
        {"department": "Fine Arts & Design", "count": 21},
        {"department": "Physical Education & Sports", "count": 18},
    ],
    "achievements": [
        {"year": "2025", "title": "State-Level Science Fair — 1st Place", "detail": "Robotics team recognized for an autonomous water-quality monitoring project."},
        {"year": "2024", "title": "National Debate Championship — Finalist", "detail": "The debate society reached the national final for the second year running."},
        {"year": "2024", "title": "NAAC A+ Accreditation", "detail": "Awarded the highest institutional accreditation grade for academic quality."},
        {"year": "2023", "title": "Inter-College Sports Meet — Overall Champions", "detail": "Won the overall trophy across athletics, football, and basketball."},
        {"year": "2022", "title": "100% Board Result — Senior Secondary", "detail": "Every senior-secondary candidate cleared the board examinations."},
        {"year": "2021", "title": "Best Campus Sustainability Initiative", "detail": "Recognized regionally for a solar power and rainwater harvesting program."},
    ],
    "placement_rate": "92%",
    "recruiting_partners": "85+",
    "avg_package": "₹6.2L",
    "highest_package": "₹18L",
    "career_services": [
        {"title": "Placement Cell", "blurb": "A dedicated team runs campus recruitment drives with recurring industry partners each year."},
        {"title": "Career Counseling", "blurb": "One-on-one guidance on stream selection, higher studies, and career planning from grade 9 onward."},
        {"title": "Internship Program", "blurb": "Structured internships with partner organizations during the final two years of every program."},
        {"title": "Alumni Network", "blurb": "An active alumni association offering mentorship, referrals, and an annual networking meet."},
    ],
    "contact_phone": "+1 (555) 010-2030",
    "contact_email": "admissions@greenwood.example",
    "contact_address": "45 College Road, Greenwood",
}


def get_site_content(db: Session) -> SiteContent:
    obj = db.query(SiteContent).filter(SiteContent.id == SINGLETON_ID).first()
    if not obj:
        obj = SiteContent(id=SINGLETON_ID, data=DEFAULT_SITE_CONTENT)
        db.add(obj)
        db.commit()
        db.refresh(obj)
    return obj


def update_site_content(db: Session, data: SiteContentData) -> SiteContent:
    obj = get_site_content(db)
    obj.data = data.model_dump()
    db.commit()
    db.refresh(obj)
    return obj
