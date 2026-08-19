from pydantic import BaseModel


class DepartmentItem(BaseModel):
    name: str
    blurb: str


class FacilityItem(BaseModel):
    name: str
    blurb: str


class FacultyStrengthItem(BaseModel):
    department: str
    count: int


class AchievementItem(BaseModel):
    year: str
    title: str
    detail: str


class CareerServiceItem(BaseModel):
    title: str
    blurb: str


class SiteContentData(BaseModel):
    institution_name: str
    hero_eyebrow: str
    hero_title: str
    hero_description: str
    established_year: str
    students_count: str
    faculty_count: str
    programs_count: str
    about_description: str
    departments: list[DepartmentItem]
    facilities: list[FacilityItem]
    faculty_strength: list[FacultyStrengthItem]
    achievements: list[AchievementItem]
    placement_rate: str
    recruiting_partners: str
    avg_package: str
    highest_package: str
    career_services: list[CareerServiceItem]
    contact_phone: str
    contact_email: str
    contact_address: str
