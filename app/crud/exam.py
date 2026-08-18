from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.academic import SchoolClass, Subject
from app.models.exam import Exam, ExamRule, GradeScale, Mark, Result
from app.models.student import Student
from app.schemas.exam import (
    ExamCreate,
    ExamRuleCreate,
    ExamRuleUpdate,
    ExamUpdate,
    GradeScaleCreate,
    GradeScaleUpdate,
    MarkCreate,
)


class ExamError(Exception):
    """Raised for exam/mark/result rule violations."""


# -- Exam -------------------------------------------------------------------

def list_exams(db: Session) -> list[Exam]:
    return db.query(Exam).all()


def get_exam(db: Session, exam_id: int) -> Exam | None:
    return db.query(Exam).filter(Exam.id == exam_id).first()


def create_exam(db: Session, data: ExamCreate) -> Exam:
    obj = Exam(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_exam(db: Session, obj: Exam, data: ExamUpdate) -> Exam:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_exam(db: Session, obj: Exam) -> None:
    db.delete(obj)
    db.commit()


# -- Grade Scale --------------------------------------------------------

def list_grade_scales(db: Session) -> list[GradeScale]:
    return db.query(GradeScale).order_by(GradeScale.min_percent.desc()).all()


def get_grade_scale(db: Session, grade_scale_id: int) -> GradeScale | None:
    return db.query(GradeScale).filter(GradeScale.id == grade_scale_id).first()


def create_grade_scale(db: Session, data: GradeScaleCreate) -> GradeScale:
    if data.min_percent > data.max_percent:
        raise ExamError("min_percent cannot be greater than max_percent")
    obj = GradeScale(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_grade_scale(db: Session, obj: GradeScale, data: GradeScaleUpdate) -> GradeScale:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_grade_scale(db: Session, obj: GradeScale) -> None:
    db.delete(obj)
    db.commit()


def find_grade_for_percentage(db: Session, percentage: Decimal) -> GradeScale | None:
    return (
        db.query(GradeScale)
        .filter(GradeScale.is_active == True)  # noqa: E712
        .filter(GradeScale.min_percent <= percentage)
        .filter(GradeScale.max_percent >= percentage)
        .first()
    )


# -- Exam Rule ------------------------------------------------------------

def list_exam_rules(
    db: Session, exam_id: int | None = None, class_id: int | None = None
) -> list[ExamRule]:
    query = db.query(ExamRule)
    if exam_id:
        query = query.filter(ExamRule.exam_id == exam_id)
    if class_id:
        query = query.filter(ExamRule.class_id == class_id)
    return query.all()


def get_exam_rule(db: Session, exam_rule_id: int) -> ExamRule | None:
    return db.query(ExamRule).filter(ExamRule.id == exam_rule_id).first()


def find_exam_rule(db: Session, exam_id: int, class_id: int, subject_id: int) -> ExamRule | None:
    return (
        db.query(ExamRule)
        .filter(ExamRule.exam_id == exam_id)
        .filter(ExamRule.class_id == class_id)
        .filter(ExamRule.subject_id == subject_id)
        .first()
    )


def create_exam_rule(db: Session, data: ExamRuleCreate) -> ExamRule:
    if not db.query(Exam).filter(Exam.id == data.exam_id).first():
        raise ExamError("Exam not found")

    subject = db.query(Subject).filter(Subject.id == data.subject_id).first()
    if not subject:
        raise ExamError("Subject not found")
    if subject.class_id != data.class_id:
        raise ExamError("Subject does not belong to this class")

    if not db.query(SchoolClass).filter(SchoolClass.id == data.class_id).first():
        raise ExamError("Class not found")

    if data.pass_marks > data.total_marks:
        raise ExamError("pass_marks cannot be greater than total_marks")
    if data.total_marks <= 0:
        raise ExamError("total_marks must be greater than zero")

    if find_exam_rule(db, data.exam_id, data.class_id, data.subject_id):
        raise ExamError("A rule for this exam/class/subject already exists")

    obj = ExamRule(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_exam_rule(db: Session, obj: ExamRule, data: ExamRuleUpdate) -> ExamRule:
    update_data = data.model_dump(exclude_unset=True)
    total_marks = update_data.get("total_marks", obj.total_marks)
    pass_marks = update_data.get("pass_marks", obj.pass_marks)
    if pass_marks > total_marks:
        raise ExamError("pass_marks cannot be greater than total_marks")

    for field, value in update_data.items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_exam_rule(db: Session, obj: ExamRule) -> None:
    db.delete(obj)
    db.commit()


# -- Mark -----------------------------------------------------------------

def list_marks(
    db: Session, exam_id: int | None = None, student_id: int | None = None
) -> list[Mark]:
    query = db.query(Mark)
    if exam_id:
        query = query.filter(Mark.exam_id == exam_id)
    if student_id:
        query = query.filter(Mark.student_id == student_id)
    return query.all()


def record_mark(db: Session, data: MarkCreate) -> Mark:
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise ExamError("Student not found")
    if not student.class_id:
        raise ExamError("Student is not assigned to a class")

    rule = find_exam_rule(db, data.exam_id, student.class_id, data.subject_id)
    if not rule:
        raise ExamError("No exam rule configured for this exam/class/subject")

    marks_obtained = Decimal("0") if data.is_absent else data.marks_obtained
    if not data.is_absent and (marks_obtained < 0 or marks_obtained > rule.total_marks):
        raise ExamError(f"marks_obtained must be between 0 and {rule.total_marks}")

    existing = (
        db.query(Mark)
        .filter(Mark.exam_id == data.exam_id)
        .filter(Mark.student_id == data.student_id)
        .filter(Mark.subject_id == data.subject_id)
        .first()
    )
    if existing:
        existing.marks_obtained = marks_obtained
        existing.is_absent = data.is_absent
        db.commit()
        db.refresh(existing)
        return existing

    mark = Mark(
        exam_id=data.exam_id,
        student_id=data.student_id,
        subject_id=data.subject_id,
        marks_obtained=marks_obtained,
        is_absent=data.is_absent,
    )
    db.add(mark)
    db.commit()
    db.refresh(mark)
    return mark


# -- Result -----------------------------------------------------------

def list_results(
    db: Session, exam_id: int | None = None, student_id: int | None = None
) -> list[Result]:
    query = db.query(Result)
    if exam_id:
        query = query.filter(Result.exam_id == exam_id)
    if student_id:
        query = query.filter(Result.student_id == student_id)
    return query.all()


def get_result(db: Session, result_id: int) -> Result | None:
    return db.query(Result).filter(Result.id == result_id).first()


def generate_result(db: Session, exam_id: int, student_id: int) -> Result:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise ExamError("Student not found")
    if not student.class_id:
        raise ExamError("Student is not assigned to a class")

    rules = list_exam_rules(db, exam_id=exam_id, class_id=student.class_id)
    if not rules:
        raise ExamError("No exam rules configured for this student's class")

    total_obtained = Decimal("0")
    total_max = Decimal("0")
    is_pass = True

    for rule in rules:
        mark = (
            db.query(Mark)
            .filter(Mark.exam_id == exam_id)
            .filter(Mark.student_id == student_id)
            .filter(Mark.subject_id == rule.subject_id)
            .first()
        )
        if not mark:
            raise ExamError(f"Marks not recorded for subject_id={rule.subject_id}")

        total_max += rule.total_marks
        if mark.is_absent:
            is_pass = False
            continue

        total_obtained += mark.marks_obtained
        if mark.marks_obtained < rule.pass_marks:
            is_pass = False

    percentage = (total_obtained / total_max * 100) if total_max else Decimal("0")
    percentage = percentage.quantize(Decimal("0.01"))

    if is_pass:
        scale = find_grade_for_percentage(db, percentage)
        grade = scale.name if scale else None
        grade_point = scale.grade_point if scale else None
    else:
        grade = "F"
        grade_point = Decimal("0.00")

    existing = (
        db.query(Result)
        .filter(Result.exam_id == exam_id)
        .filter(Result.student_id == student_id)
        .first()
    )
    if existing:
        existing.total_obtained = total_obtained
        existing.total_max = total_max
        existing.percentage = percentage
        existing.grade = grade
        existing.grade_point = grade_point
        existing.is_pass = is_pass
        db.commit()
        db.refresh(existing)
        return existing

    result = Result(
        exam_id=exam_id,
        student_id=student_id,
        total_obtained=total_obtained,
        total_max=total_max,
        percentage=percentage,
        grade=grade,
        grade_point=grade_point,
        is_pass=is_pass,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def delete_result(db: Session, obj: Result) -> None:
    db.delete(obj)
    db.commit()
