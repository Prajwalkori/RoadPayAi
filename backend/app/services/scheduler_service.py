from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import Violation, Vehicle, Settings
from app.services.ai_service import generate_email_content
from app.services.email_service import send_challan_email
import asyncio

def update_violations_penalties(db: Session) -> int:
    """
    Checks all PENDING violations and applies late penalties based on time elapsed:
    - 3 Days (72 hours) elapsed: Fine becomes ₹600 (late_penalty = 100)
    - 7 Days (168 hours) elapsed: Fine becomes ₹800 (late_penalty = 300)
    - 15 Days (360 hours) elapsed: Fine becomes ₹1000 (late_penalty = 500)
    Returns the count of updated records.
    """
    now = datetime.utcnow()
    pending_violations = db.query(Violation).filter(Violation.status != "PAID").all()
    updated_count = 0

    for violation in pending_violations:
        elapsed_days = (now - violation.timestamp).days
        new_penalty = 0.0
        new_status = "PENDING"
        
        if elapsed_days >= 15:
            new_penalty = 500.0
            new_status = "OVERDUE"
        elif elapsed_days >= 7:
            new_penalty = 300.0
            new_status = "OVERDUE"
        elif elapsed_days >= 3:
            new_penalty = 100.0
            new_status = "PENDING"

        # Check if changes are required
        if violation.late_penalty != new_penalty or violation.status != new_status:
            violation.late_penalty = new_penalty
            violation.status = new_status
            violation.final_amount = violation.base_amount + violation.late_penalty - violation.discount_earned
            updated_count += 1
            db.commit()

    return updated_count

async def send_scheduled_reminders(db: Session):
    """
    Sends automated reminder emails to owners with pending violations based on time milestones.
    """
    now = datetime.utcnow()
    pending = db.query(Violation).filter(Violation.status != "PAID").all()

    for v in pending:
        # Resolve owner email
        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_number == v.vehicle_number).first()
        if not vehicle or not vehicle.email:
            continue
            
        elapsed_days = (now - v.timestamp).days
        email_sent = False
        
        # Define milestones for Reminder 1 (2 days remaining, i.e. 5 days elapsed from issue),
        # Reminder 2 (after late fee added, i.e. 4 days elapsed), and Reminder 3 (final warning, i.e. 8 days elapsed)
        # We can track sent status in the database to prevent duplicate emails.
        from app.models import EmailLog
        
        # Check Reminder 1 (Day 2 after issue, before penalties)
        if 2 <= elapsed_days < 3:
            exists = db.query(EmailLog).filter(
                EmailLog.violation_id == v.id,
                EmailLog.email_type == "REMINDER_1",
                EmailLog.status == "SENT"
            ).first()
            if not exists:
                body = await generate_email_content({
                    "owner_name": vehicle.owner_name,
                    "vehicle_number": v.vehicle_number,
                    "violation_type": v.violation_type,
                    "amount": str(v.final_amount),
                    "due_date": v.due_date.strftime("%Y-%m-%d"),
                    "payment_link": f"http://localhost:3000/dashboard/violations",
                    "learning_link": f"http://localhost:3000/dashboard/learning?violation_id={v.id}",
                    "explanation": f"This is a courtesy reminder. Your fine of ₹{v.final_amount} is due on {v.due_date.strftime('%Y-%m-%d')}. Avoid late fees by resolving this soon or completing the safety education quiz."
                }, db)
                email_sent = await send_challan_email(vehicle.email, f"RoadPay Reminder: Challan Due Soon for {v.vehicle_number}", body, v.id, db)
                if email_sent:
                    log_email_sent(v.id, vehicle.email, "REMINDER_1", db)

        # Check Reminder 2 (Day 4 after issue, after first late fee applied)
        elif 4 <= elapsed_days < 7:
            exists = db.query(EmailLog).filter(
                EmailLog.violation_id == v.id,
                EmailLog.email_type == "REMINDER_2",
                EmailLog.status == "SENT"
            ).first()
            if not exists:
                body = await generate_email_content({
                    "owner_name": vehicle.owner_name,
                    "vehicle_number": v.vehicle_number,
                    "violation_type": v.violation_type,
                    "amount": str(v.final_amount),
                    "due_date": v.due_date.strftime("%Y-%m-%d"),
                    "payment_link": f"http://localhost:3000/dashboard/violations",
                    "learning_link": f"http://localhost:3000/dashboard/learning?violation_id={v.id}",
                    "explanation": f"Late penalty applied. A late fee of ₹100 has been added. Current outstanding: ₹{v.final_amount}. Resolve this challan today."
                }, db)
                email_sent = await send_challan_email(vehicle.email, f"RoadPay Alert: Late Fee Applied for {v.vehicle_number}", body, v.id, db)
                if email_sent:
                    log_email_sent(v.id, vehicle.email, "REMINDER_2", db)

        # Check Reminder 3 (Day 8+ after issue, final warning before court referral)
        elif elapsed_days >= 8:
            exists = db.query(EmailLog).filter(
                EmailLog.violation_id == v.id,
                EmailLog.email_type == "REMINDER_3",
                EmailLog.status == "SENT"
            ).first()
            if not exists:
                body = await generate_email_content({
                    "owner_name": vehicle.owner_name,
                    "vehicle_number": v.vehicle_number,
                    "violation_type": v.violation_type,
                    "amount": str(v.final_amount),
                    "due_date": v.due_date.strftime("%Y-%m-%d"),
                    "payment_link": f"http://localhost:3000/dashboard/violations",
                    "learning_link": f"http://localhost:3000/dashboard/learning?violation_id={v.id}",
                    "explanation": f"FINAL WARNING. Outstanding amount: ₹{v.final_amount} (includes ₹300+ late fee). Failure to pay or complete the course within 7 days may result in court proceedings."
                }, db)
                email_sent = await send_challan_email(vehicle.email, f"RoadPay FINAL WARNING: Court Referral Pending for {v.vehicle_number}", body, v.id, db)
                if email_sent:
                    log_email_sent(v.id, vehicle.email, "REMINDER_3", db)

def log_email_sent(violation_id: int, email: str, email_type: str, db: Session):
    from app.models import EmailLog
    log = EmailLog(
        violation_id=violation_id,
        recipient_email=email,
        email_type=email_type,
        status="SENT",
        sent_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()

async def scheduler_loop(db_session_factory):
    """
    Infinite loop for the scheduler running every 60 seconds.
    """
    while True:
        try:
            db = db_session_factory()
            try:
                update_violations_penalties(db)
                await send_scheduled_reminders(db)
            finally:
                db.close()
        except Exception as e:
            print(f"Scheduler loop error: {e}")
        await asyncio.sleep(60)
