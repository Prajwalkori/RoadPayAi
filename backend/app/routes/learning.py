from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from typing import List

from app.database import get_db
from app.models import Violation, QuizAttempt, Certificate, Vehicle, User
from app.schemas import QuizSubmit, QuizAttemptResponse, CertificateResponse
from app.auth import get_current_user
from app.services.ai_service import generate_quiz_questions

router = APIRouter(prefix="/learning", tags=["learning"])

@router.get("/module")
async def get_quiz_module(
    violation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the customized quiz questions for a violation using Gemini.
    """
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    # Check permission
    if current_user.role == "VEHICLE_OWNER":
        vehicle = db.query(Vehicle).filter(
            Vehicle.vehicle_number == violation.vehicle_number,
            Vehicle.email == current_user.email
        ).first()
        if not vehicle:
            raise HTTPException(status_code=403, detail="Access denied to this violation's quiz.")

    # Check if violation already paid
    if violation.status == "PAID":
        raise HTTPException(status_code=400, detail="This challan has already been paid. Quiz cannot be taken.")

    questions = await generate_quiz_questions(violation.violation_type, db)
    return {
        "violation_id": violation_id,
        "violation_type": violation.violation_type,
        "questions": questions
    }

@router.post("/submit", response_model=dict)
async def submit_quiz_answers(
    payload: QuizSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits answers for evaluation, calculates discount rewards, updates challan, and issues certificate.
    """
    violation = db.query(Violation).filter(Violation.id == payload.violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
        
    if violation.status == "PAID":
        raise HTTPException(status_code=400, detail="This challan has already been paid.")

    # 1. Fetch exact questions to compare index
    questions = await generate_quiz_questions(violation.violation_type, db)
    if len(payload.answers) != len(questions):
        raise HTTPException(status_code=400, detail="Mismatch between submitted answers and quiz question count.")

    correct_count = 0
    detailed_answers = []
    
    for idx, q in enumerate(questions):
        user_select = payload.answers[idx]
        correct_select = q.get("correct_index", q.get("correctSelect", 0))
        
        is_correct = (user_select == correct_select)
        if is_correct:
            correct_count += 1
            
        detailed_answers.append({
            "question_id": q.get("id", idx),
            "scenario": q.get("scenario"),
            "question": q.get("question"),
            "options": q.get("options"),
            "selected_index": user_select,
            "correct_index": correct_select,
            "is_correct": is_correct,
            "explanation": q.get("explanation")
        })

    # Calculate score percentage
    score = (correct_count / len(questions)) * 100.0
    passed = score >= 80.0
    
    # 2. Determine Discount Earned
    discount_rate = 0.0
    if score >= 90.0:
        discount_rate = 0.20  # 20%
    elif score >= 80.0:
        discount_rate = 0.10  # 10%

    # Calculate discount amount based on base fine
    discount_amount = violation.base_amount * discount_rate
    
    # Update violation discount (if better than previous)
    if discount_amount > violation.discount_earned:
        violation.discount_earned = discount_amount
        violation.final_amount = violation.base_amount + violation.late_penalty - violation.discount_earned
        
    # 3. Save Attempt
    attempt = QuizAttempt(
        user_id=current_user.id,
        violation_id=violation.id,
        score=score,
        passed=passed,
        discount_earned=discount_amount,
        answers=detailed_answers,
        completed_at=datetime.utcnow()
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    # Link attempt to violation
    violation.quiz_attempt_id = attempt.id
    db.commit()

    # 4. Generate Safety Certificate if passed
    certificate = None
    if passed:
        # Check if already issued for this violation
        existing_cert = db.query(Certificate).filter(
            Certificate.user_id == current_user.id,
            Certificate.violation_id == violation.id
        ).first()
        
        if not existing_cert:
            cert_code = f"RPCERT-{uuid.uuid4().hex[:8].upper()}"
            certificate = Certificate(
                user_id=current_user.id,
                violation_id=violation.id,
                certificate_code=cert_code,
                issued_at=datetime.utcnow()
            )
            db.add(certificate)
            db.commit()
            db.refresh(certificate)
        else:
            certificate = existing_cert

    return {
        "status": "success",
        "score": score,
        "correct_count": correct_count,
        "total_count": len(questions),
        "passed": passed,
        "discount_earned": discount_amount,
        "original_amount": violation.base_amount + violation.late_penalty,
        "final_amount": violation.final_amount,
        "certificate_code": certificate.certificate_code if certificate else None,
        "detailed_results": detailed_answers
    }

@router.get("/certificates", response_model=List[CertificateResponse])
def get_user_certificates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Certificate).filter(Certificate.user_id == current_user.id).all()
