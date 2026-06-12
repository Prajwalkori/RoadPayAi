from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Dict, Any

from app.database import get_db
from app.models import Violation, Payment, Vehicle, QuizAttempt, User
from app.schemas import AdminAnalytics
from app.auth import require_admin, require_officer, get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/admin", response_model=dict)
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Returns administrative metrics and graph analytics.
    """
    # 1. Direct aggregates
    total_violations = db.query(Violation).count()
    pending_payments = db.query(Violation).filter(Violation.status == "PENDING").count()
    overdue_payments = db.query(Violation).filter(Violation.status == "OVERDUE").count()
    
    revenue_collected = db.query(func.sum(Payment.amount)).filter(Payment.status == "SUCCESS").scalar() or 0.0
    money_saved = db.query(func.sum(Violation.discount_earned)).scalar() or 0.0

    # 2. Most common violations
    common_violations = {}
    v_types = db.query(Violation.violation_type, func.count(Violation.id)).group_by(Violation.violation_type).all()
    for v_type, count in v_types:
        common_violations[v_type] = count

    # 3. Monthly Revenue Trend (Mocking dates or grouping)
    # We group by date of successful payments in the last 7 days
    revenue_trend = []
    now = datetime.utcnow()
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_str = day.strftime("%b %d")
        
        # Calculate revenue for that day
        day_revenue = db.query(func.sum(Payment.amount)).filter(
            Payment.status == "SUCCESS",
            func.date(Payment.timestamp) == day.date()
        ).scalar() or 0.0
        
        revenue_trend.append({"name": day_str, "revenue": day_revenue})

    # 4. Violation Type Trends
    violation_trends = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_str = day.strftime("%b %d")
        
        helmet_c = db.query(Violation).filter(Violation.violation_type == "HELMET_VIOLATION", func.date(Violation.timestamp) == day.date()).count()
        triple_c = db.query(Violation).filter(Violation.violation_type == "TRIPLE_RIDING", func.date(Violation.timestamp) == day.date()).count()
        wrong_c = db.query(Violation).filter(Violation.violation_type == "WRONG_DIRECTION", func.date(Violation.timestamp) == day.date()).count()
        
        violation_trends.append({
            "name": day_str,
            "Helmet": helmet_c,
            "Triple Riding": triple_c,
            "Wrong Direction": wrong_c
        })

    # 5. Vehicle Registry Stats
    total_vehicles = db.query(Vehicle).filter(Vehicle.deleted_at == None).count()
    car_count = db.query(Vehicle).filter(Vehicle.vehicle_type == "CAR", Vehicle.deleted_at == None).count()
    moto_count = db.query(Vehicle).filter(Vehicle.vehicle_type == "MOTORCYCLE", Vehicle.deleted_at == None).count()

    # 6. Learning Stats
    total_quizzes = db.query(QuizAttempt).count()
    passed_quizzes = db.query(QuizAttempt).filter(QuizAttempt.passed == True).count()
    pass_rate = (passed_quizzes / total_quizzes * 100.0) if total_quizzes > 0 else 0.0

    return {
        "total_violations": total_violations,
        "revenue_collected": revenue_collected,
        "pending_payments": pending_payments,
        "overdue_payments": overdue_payments,
        "common_violations": common_violations,
        "revenue_trend": revenue_trend,
        "violation_trends": violation_trends,
        "registry_stats": {
            "total": total_vehicles,
            "cars": car_count,
            "motorcycles": moto_count
        },
        "learning_stats": {
            "total_attempts": total_quizzes,
            "passed": passed_quizzes,
            "pass_rate": round(pass_rate, 2)
        },
        "money_saved": money_saved
    }

@router.get("/owner", response_model=dict)
def get_owner_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns owner specific aggregates (Pending counts, paid counts, XP, Certificates).
    """
    # 1. Resolve registered vehicle numbers
    user_vehicles = db.query(Vehicle.vehicle_number).filter(
        Vehicle.email == current_user.email,
        Vehicle.deleted_at == None
    ).all()
    v_numbers = [v[0] for v in user_vehicles]

    pending_challans = db.query(Violation).filter(Violation.vehicle_number.in_(v_numbers), Violation.status != "PAID").all()
    paid_challans = db.query(Violation).filter(Violation.vehicle_number.in_(v_numbers), Violation.status == "PAID").all()

    total_pending_amount = sum(c.final_amount for c in pending_challans)
    total_paid_amount = sum(c.final_amount for c in paid_challans)

    # Calculate XP points based on Quiz attempts
    # Let's say: 100 XP per passed quiz, 20 XP per failed quiz
    quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).all()
    xp = 0
    passed_count = 0
    for attempt in quiz_attempts:
        if attempt.passed:
            xp += 100
            passed_count += 1
        else:
            xp += 20

    # User Level based on XP (every 300 XP is a level)
    level = 1 + (xp // 300)
    next_level_xp = 300 - (xp % 300)
    progress_percentage = round(((xp % 300) / 300) * 100, 2)

    # Certificates count
    from app.models import Certificate
    certificates = db.query(Certificate).filter(Certificate.user_id == current_user.id).count()

    return {
        "pending_count": len(pending_challans),
        "paid_count": len(paid_challans),
        "total_pending_amount": total_pending_amount,
        "total_paid_amount": total_paid_amount,
        "vehicles_count": len(v_numbers),
        "gamification": {
            "xp": xp,
            "level": level,
            "next_level_xp": next_level_xp,
            "progress_percentage": progress_percentage,
            "badges": get_owner_badges(passed_count, xp)
        },
        "certificates_count": certificates
    }

def get_owner_badges(passed_count: int, xp: int) -> List[Dict[str, str]]:
    badges = []
    if xp > 0:
        badges.append({"name": "First Lesson", "description": "Earned by attempting your first safety module.", "icon": "🎓"})
    if passed_count >= 1:
        badges.append({"name": "Safety Champion", "description": "Passed at least one road safety quiz.", "icon": "🏆"})
    if passed_count >= 3:
        badges.append({"name": "Road Guardian", "description": "Passed 3 or more safety modules.", "icon": "🛡️"})
    if xp >= 500:
        badges.append({"name": "Safe Rider", "description": "Reached over 500 safety XP.", "icon": "🏍️"})
    return badges
