from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.database import get_db
from app.crud import exam as crud
from app.crud.exam import ExamError
from app.schemas.exam import (
    ExamCreate,
    ExamRead,
    ExamRuleCreate,
    ExamRuleRead,
    ExamRuleUpdate,
    ExamUpdate,
    GradeScaleCreate,
    GradeScaleRead,
    GradeScaleUpdate,
    MarkCreate,
    MarkRead,
    ResultRead,
)

router = APIRouter()


# -- Exams --------------------------------------------------------------

@router.get("", response_model=list[ExamRead], dependencies=[Depends(require_permission("exam.index"))])
def list_exams(db: Session = Depends(get_db)):
    return crud.list_exams(db)


@router.post("", response_model=ExamRead, dependencies=[Depends(require_permission("exam.store"))])
def create_exam(data: ExamCreate, db: Session = Depends(get_db)):
    return crud.create_exam(db, data)


@router.put("/{exam_id}", response_model=ExamRead, dependencies=[Depends(require_permission("exam.update"))])
def update_exam(exam_id: int, data: ExamUpdate, db: Session = Depends(get_db)):
    obj = crud.get_exam(db, exam_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exam not found")
    return crud.update_exam(db, obj, data)


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("exam.destroy"))])
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    obj = crud.get_exam(db, exam_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exam not found")
    crud.delete_exam(db, obj)


# -- Grade Scales ---------------------------------------------------------

@router.get("/grade-scales", response_model=list[GradeScaleRead], dependencies=[Depends(require_permission("exam.grade"))])
def list_grade_scales(db: Session = Depends(get_db)):
    return crud.list_grade_scales(db)


@router.post("/grade-scales", response_model=GradeScaleRead, dependencies=[Depends(require_permission("exam.grade_store"))])
def create_grade_scale(data: GradeScaleCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_grade_scale(db, data)
    except ExamError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.put("/grade-scales/{grade_scale_id}", response_model=GradeScaleRead, dependencies=[Depends(require_permission("exam.grade_update"))])
def update_grade_scale(grade_scale_id: int, data: GradeScaleUpdate, db: Session = Depends(get_db)):
    obj = crud.get_grade_scale(db, grade_scale_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Grade scale not found")
    return crud.update_grade_scale(db, obj, data)


@router.delete("/grade-scales/{grade_scale_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("exam.grade_destroy"))])
def delete_grade_scale(grade_scale_id: int, db: Session = Depends(get_db)):
    obj = crud.get_grade_scale(db, grade_scale_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Grade scale not found")
    crud.delete_grade_scale(db, obj)


# -- Exam Rules -----------------------------------------------------------

@router.get("/rules", response_model=list[ExamRuleRead], dependencies=[Depends(require_permission("exam.rule"))])
def list_exam_rules(
    exam_id: int | None = Query(default=None),
    class_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return crud.list_exam_rules(db, exam_id, class_id)


@router.post("/rules", response_model=ExamRuleRead, dependencies=[Depends(require_permission("exam.rule_store"))])
def create_exam_rule(data: ExamRuleCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_exam_rule(db, data)
    except ExamError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.put("/rules/{exam_rule_id}", response_model=ExamRuleRead, dependencies=[Depends(require_permission("exam.rule_update"))])
def update_exam_rule(exam_rule_id: int, data: ExamRuleUpdate, db: Session = Depends(get_db)):
    obj = crud.get_exam_rule(db, exam_rule_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exam rule not found")
    try:
        return crud.update_exam_rule(db, obj, data)
    except ExamError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.delete("/rules/{exam_rule_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("exam.rule_destroy"))])
def delete_exam_rule(exam_rule_id: int, db: Session = Depends(get_db)):
    obj = crud.get_exam_rule(db, exam_rule_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exam rule not found")
    crud.delete_exam_rule(db, obj)


# -- Marks --------------------------------------------------------------

@router.get("/marks", response_model=list[MarkRead], dependencies=[Depends(require_permission("exam.mark"))])
def list_marks(
    exam_id: int | None = Query(default=None),
    student_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return crud.list_marks(db, exam_id, student_id)


@router.post("/marks", response_model=MarkRead, dependencies=[Depends(require_permission("exam.mark_store"))])
def record_mark(data: MarkCreate, db: Session = Depends(get_db)):
    try:
        return crud.record_mark(db, data)
    except ExamError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


# -- Results ------------------------------------------------------------

@router.get("/results", response_model=list[ResultRead], dependencies=[Depends(require_permission("exam.result"))])
def list_results(
    exam_id: int | None = Query(default=None),
    student_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return crud.list_results(db, exam_id, student_id)


@router.post("/results/generate", response_model=ResultRead, dependencies=[Depends(require_permission("exam.result_generate"))])
def generate_result(
    exam_id: int = Query(...), student_id: int = Query(...), db: Session = Depends(get_db)
):
    try:
        return crud.generate_result(db, exam_id, student_id)
    except ExamError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.delete("/results/{result_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("exam.result_destroy"))])
def delete_result(result_id: int, db: Session = Depends(get_db)):
    obj = crud.get_result(db, result_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Result not found")
    crud.delete_result(db, obj)
