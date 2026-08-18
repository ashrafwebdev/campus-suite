from pydantic import BaseModel, ConfigDict


class SchoolClassBase(BaseModel):
    name: str
    order: int = 0


class SchoolClassCreate(SchoolClassBase):
    pass


class SchoolClassUpdate(BaseModel):
    name: str | None = None
    order: int | None = None
    is_active: bool | None = None


class SchoolClassRead(SchoolClassBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool


class SectionBase(BaseModel):
    name: str
    capacity: int = 40
    class_id: int
    teacher_id: int | None = None


class SectionCreate(SectionBase):
    pass


class SectionUpdate(BaseModel):
    name: str | None = None
    capacity: int | None = None
    teacher_id: int | None = None
    is_active: bool | None = None


class SectionRead(SectionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool


class SubjectBase(BaseModel):
    name: str
    code: str
    subject_type: int = 1
    class_id: int


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    subject_type: int | None = None
    is_active: bool | None = None


class SubjectRead(SubjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
