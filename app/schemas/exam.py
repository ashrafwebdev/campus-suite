from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ExamBase(BaseModel):
    name: str


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class ExamRead(ExamBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool


class GradeScaleBase(BaseModel):
    name: str
    min_percent: Decimal
    max_percent: Decimal
    grade_point: Decimal


class GradeScaleCreate(GradeScaleBase):
    pass


class GradeScaleUpdate(BaseModel):
    name: str | None = None
    min_percent: Decimal | None = None
    max_percent: Decimal | None = None
    grade_point: Decimal | None = None
    is_active: bool | None = None


class GradeScaleRead(GradeScaleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool


class ExamRuleBase(BaseModel):
    exam_id: int
    class_id: int
    subject_id: int
    total_marks: Decimal
    pass_marks: Decimal


class ExamRuleCreate(ExamRuleBase):
    pass


class ExamRuleUpdate(BaseModel):
    total_marks: Decimal | None = None
    pass_marks: Decimal | None = None


class ExamRuleRead(ExamRuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class MarkCreate(BaseModel):
    exam_id: int
    student_id: int
    subject_id: int
    marks_obtained: Decimal = Decimal("0")
    is_absent: bool = False


class MarkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    exam_id: int
    student_id: int
    subject_id: int
    marks_obtained: Decimal
    is_absent: bool


class ResultRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    exam_id: int
    student_id: int
    total_obtained: Decimal
    total_max: Decimal
    percentage: Decimal
    grade: str | None = None
    grade_point: Decimal | None = None
    is_pass: bool
