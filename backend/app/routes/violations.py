from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
import uuid
import shutil
from typing import List, Optional

from app.database import get_db
from app.models import Violation, Vehicle, User, PDFChallan, Payment, EmailLog, Reminder, QuizAttempt
from app.schemas import ViolationResponse, PaginatedViolations
from app.auth import require_officer, require_admin, get_current_user
from app.services.ai_service import analyze_violation_image, generate_email_content
from app.services.pdf_service import generate_challan_pdf
from app.services.email_service import send_challan_email
from app.services.scheduler_service import update_violations_penalties

router = APIRouter(prefix="/violations", tags=["violations"])

UPLOAD_DIR = "app/data/uploads"
PDF_DIR = "app/data/challans"

# Ensure data folders exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PDF_DIR, exist_ok=True)

@router.get("", response_model=PaginatedViolations)
def get_violations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    status_filter: Optional[str] = None,
    violation_type: Optional[str] = None,
    vehicle_number: Optional[str] = None
):
    """
    Returns violations.
    - Admins/Officers: View all violations.
    - Vehicle Owners: View only their registered vehicles' violations.
    """
    query = db.query(Violation)
    
    if current_user.role == "VEHICLE_OWNER":
        # Find all vehicles belonging to this owner email
        user_vehicles = db.query(Vehicle.vehicle_number).filter(
            Vehicle.email == current_user.email,
            Vehicle.deleted_at == None
        ).all()
        user_vehicle_numbers = [v[0] for v in user_vehicles]
        # Filter violations to show only these vehicles
        query = query.filter(Violation.vehicle_number.in_(user_vehicle_numbers))
    elif vehicle_number:
        query = query.filter(Violation.vehicle_number.ilike(f"%{vehicle_number}%"))
        
    if status_filter:
        query = query.filter(Violation.status == status_filter)
        
    if violation_type:
        query = query.filter(Violation.violation_type == violation_type)
        
    total = query.count()
    violations = query.order_by(Violation.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "violations": [ViolationResponse.model_validate(v) for v in violations]
    }

@router.get("/{violation_id}", response_model=ViolationResponse)
def get_violation_detail(
    violation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
        
    # Check permissions
    if current_user.role == "VEHICLE_OWNER":
        vehicle = db.query(Vehicle).filter(
            Vehicle.vehicle_number == violation.vehicle_number,
            Vehicle.email == current_user.email
        ).first()
        if not vehicle:
            raise HTTPException(status_code=403, detail="Access denied to this challan details")
            
    return violation

@router.post("/upload")
async def upload_traffic_evidence(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    officer: User = Depends(require_officer)
):
    """
    Uploads traffic camera image/video, runs Gemini vision parsing,
    checks vehicle owner, registers the E-Challan, builds PDFs, and sends emails.
    """
    # 1. Save uploaded file
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    local_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(local_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Read bytes for API processing
    with open(local_path, "rb") as f:
        image_bytes = f.read()

    # 2. Run Gemini Vision / OCR Analysis
    analysis = await analyze_violation_image(image_bytes, db)
    
    if not analysis.get("detected"):
        return {
            "status": "success",
            "violation_detected": False,
            "message": "No traffic violations detected by AI engine."
        }

    # 3. Resolve vehicle plate and owner
    detected_plate = analysis.get("vehicle_number", "").strip().upper()
    violation_type = analysis.get("violation_type")
    confidence = analysis.get("confidence_score", 0.90)
    explanation = analysis.get("explanation", "Dangerous traffic maneuver detected.")
    
    # Check if number plate in registry
    vehicle = None
    if detected_plate:
        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_number == detected_plate, Vehicle.deleted_at == None).first()

    # Create dynamic Challan ID
    challan_id = f"RP-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:5].upper()}"
    
    # 4. Insert violation
    due_date = datetime.utcnow() + timedelta(days=7)
    violation = Violation(
        challan_id=challan_id,
        vehicle_number=detected_plate or "VEHICLE_NOT_FOUND",
        violation_type=violation_type,
        violation_image_path=local_path,
        confidence_score=confidence,
        timestamp=datetime.utcnow(),
        base_amount=500.0,
        late_penalty=0.0,
        discount_earned=0.0,
        final_amount=500.0,
        due_date=due_date,
        status="PENDING" if vehicle else "UNASSIGNED", # If owner not found, tag as UNASSIGNED for manual admin resolution
        explanation=explanation
    )
    db.add(violation)
    db.commit()
    db.refresh(violation)
    
    # If vehicle mapping is successful, compile E-Challan PDF & dispatch Email immediately
    pdf_path = ""
    email_sent = False
    
    if vehicle:
        # Build PDF
        pdf_details = {
            "challan_id": challan_id,
            "date": violation.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "vehicle_number": detected_plate,
            "due_date": due_date.strftime("%Y-%m-%d"),
            "owner_name": vehicle.owner_name,
            "amount": "500.00",
            "violation_type": violation_type,
            "status": "PENDING",
            "explanation": explanation,
            "violation_image_path": local_path,
            "payment_url": f"http://localhost:3000/dashboard/violations", # Direct lookup
            "learning_link": f"http://localhost:3000/dashboard/learning?violation_id={violation.id}"
        }
        pdf_path = generate_challan_pdf(pdf_details, PDF_DIR)
        
        pdf_record = PDFChallan(
            violation_id=violation.id,
            pdf_path=pdf_path
        )
        db.add(pdf_record)
        db.commit()

        # Build & Dispatch Email
        email_body = await generate_email_content(pdf_details, db)
        email_sent = await send_challan_email(
            recipient=vehicle.email,
            subject=f"RoadPay AI E-Challan Issued for {detected_plate}",
            html_body=email_body,
            violation_id=violation.id,
            db=db,
            pdf_path=pdf_path
        )

    return {
        "status": "success",
        "violation_detected": True,
        "violation": ViolationResponse.model_validate(violation),
        "owner_resolved": vehicle is not None,
        "owner_name": vehicle.owner_name if vehicle else None,
        "owner_email": vehicle.email if vehicle else None,
        "email_sent": email_sent,
        "pdf_path": pdf_path
    }

@router.post("/{violation_id}/assign")
def assign_unassigned_violation(
    violation_id: int,
    vehicle_number: str = Form(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Admin override to assign a 'Vehicle Not Found' violation to a corrected vehicle registration.
    """
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation record not found")
        
    plate = vehicle_number.strip().upper()
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_number == plate, Vehicle.deleted_at == None).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle registration not found in records")

    violation.vehicle_number = plate
    violation.status = "PENDING"
    db.commit()

    # Re-generate PDF and send SMTP alerts
    due_date = violation.due_date
    pdf_details = {
        "challan_id": violation.challan_id,
        "date": violation.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "vehicle_number": plate,
        "due_date": due_date.strftime("%Y-%m-%d"),
        "owner_name": vehicle.owner_name,
        "amount": f"{violation.final_amount:.2f}",
        "violation_type": violation.violation_type,
        "status": "PENDING",
        "explanation": violation.explanation,
        "violation_image_path": violation.violation_image_path,
        "payment_url": f"http://localhost:3000/dashboard/violations",
        "learning_link": f"http://localhost:3000/dashboard/learning?violation_id={violation.id}"
    }
    
    pdf_path = generate_challan_pdf(pdf_details, PDF_DIR)
    
    # Save/Update PDF Record
    pdf_record = db.query(PDFChallan).filter(PDFChallan.violation_id == violation.id).first()
    if pdf_record:
        pdf_record.pdf_path = pdf_path
    else:
        pdf_record = PDFChallan(violation_id=violation.id, pdf_path=pdf_path)
        db.add(pdf_record)
    
    db.commit()

    import asyncio
    async def send_task():
        email_body = await generate_email_content(pdf_details, db)
        await send_challan_email(
            recipient=vehicle.email,
            subject=f"RoadPay AI E-Challan Issued for {plate}",
            html_body=email_body,
            violation_id=violation.id,
            db=db,
            pdf_path=pdf_path
        )
    asyncio.run(send_task())

    return {"status": "success", "message": f"Violation assigned to {plate} successfully."}

@router.post("/simulate-days")
def simulate_time_advance(
    days: int = Form(..., ge=1),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Time-Warp Simulator. Artificially subtracts days from pending violations
    to trigger late fees (3, 7, 15 days) and record emails during testing.
    """
    violations = db.query(Violation).filter(Violation.status != "PAID").all()
    for v in violations:
        v.timestamp = v.timestamp - timedelta(days=days)
        v.due_date = v.due_date - timedelta(days=days)
        
    db.commit()
    
    # Trigger late penalty calculations immediately
    updated = update_violations_penalties(db)
    
    return {
        "status": "success",
        "message": f"Time advanced by {days} days. Checked penalties.",
        "penalties_updated_count": updated
    }

@router.delete("/{violation_id}", status_code=status.HTTP_204_NO_CONTENT)
def officer_delete_violation(
    violation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_officer)
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation record not found")
        
    # Clean up related records to avoid foreign key violations
    db.query(Payment).filter(Payment.violation_id == violation_id).delete()
    db.query(EmailLog).filter(EmailLog.violation_id == violation_id).delete()
    db.query(PDFChallan).filter(PDFChallan.violation_id == violation_id).delete()
    db.query(Reminder).filter(Reminder.violation_id == violation_id).delete()
    
    # Dissociate or delete related QuizAttempt
    quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.violation_id == violation_id).all()
    for qa in quiz_attempts:
        db.delete(qa)
        
    db.delete(violation)
    db.commit()
    return None

@router.post("/{violation_id}/mark-paid")
async def officer_mark_violation_as_paid(
    violation_id: int,
    payment_method: str = Form("MANUAL_OFFICER"),
    db: Session = Depends(get_db),
    officer: User = Depends(require_officer)
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
        
    if violation.status == "PAID":
        raise HTTPException(status_code=400, detail="This violation is already marked as paid.")
        
    # Update violation status
    violation.status = "PAID"
    
    # Create manual payment record
    payment = Payment(
        violation_id=violation.id,
        payment_id=f"pay_manual_{uuid.uuid4().hex[:12]}",
        order_id=f"order_manual_{uuid.uuid4().hex[:12]}",
        amount=violation.final_amount,
        payment_method=payment_method,
        status="SUCCESS",
        timestamp=datetime.utcnow()
    )
    db.add(payment)
    db.commit()
    
    # Send payment confirmation email
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_number == violation.vehicle_number, Vehicle.deleted_at == None).first()
    if vehicle:
        email_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 20px; }}
                .box {{ max-width: 500px; margin: 0 auto; background-color: #1e293b; border-radius: 8px; padding: 20px; border: 1px solid #334155; }}
                h2 {{ color: #10b981; border-bottom: 1px solid #334155; padding-bottom: 10px; }}
                .row {{ display: flex; justify-content: space-between; margin: 10px 0; }}
                .lbl {{ color: #94a3b8; }}
                .val {{ font-weight: bold; }}
                .footer {{ text-align: center; font-size: 11px; color: #64748b; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="box">
                <h2>Payment Recorded (Manual Officer Receipt)</h2>
                <p>Dear {vehicle.owner_name},</p>
                <p>An authorized Traffic Officer has recorded a payment for your E-Challan <strong>{violation.challan_id}</strong>.</p>
                <div class="row">
                    <span class="lbl">Receipt Reference:</span>
                    <span class="val">{payment.payment_id}</span>
                </div>
                <div class="row">
                    <span class="lbl">Vehicle Number:</span>
                    <span class="val">{violation.vehicle_number}</span>
                </div>
                <div class="row">
                    <span class="lbl">Amount Paid:</span>
                    <span class="val">₹{violation.final_amount}</span>
                </div>
                <div class="row">
                    <span class="lbl">Status:</span>
                    <span class="val" style="color: #10b981;">SUCCESS</span>
                </div>
                <p class="footer">Thank you for making Indian roads safer. Drive responsibly.</p>
            </div>
        </body>
        </html>
        """
        await send_challan_email(
            recipient=vehicle.email,
            subject=f"RoadPay E-Challan Paid Receipt: {violation.challan_id}",
            html_body=email_body,
            violation_id=violation.id,
            db=db
        )
        
    return {"status": "success", "message": f"Violation marked as paid by Officer {officer.name}."}

@router.post("/{violation_id}/resend-email")
async def officer_resend_violation_email(
    violation_id: int,
    db: Session = Depends(get_db),
    officer: User = Depends(require_officer)
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
        
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_number == violation.vehicle_number, Vehicle.deleted_at == None).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle owner registration not found for this violation number.")
        
    # Build E-Challan Details
    pdf_details = {
        "challan_id": violation.challan_id,
        "date": violation.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "vehicle_number": violation.vehicle_number,
        "due_date": violation.due_date.strftime("%Y-%m-%d"),
        "owner_name": vehicle.owner_name,
        "amount": f"{violation.final_amount:.2f}",
        "violation_type": violation.violation_type,
        "status": violation.status,
        "explanation": violation.explanation,
        "violation_image_path": violation.violation_image_path or "",
        "payment_url": f"http://localhost:3000/dashboard/violations",
        "learning_link": f"http://localhost:3000/dashboard/learning?violation_id={violation.id}"
    }
    
    # Look up existing PDF path from DB
    existing_pdf = db.query(PDFChallan).filter(PDFChallan.violation_id == violation.id).first()
    existing_pdf_path = existing_pdf.pdf_path if existing_pdf and os.path.exists(existing_pdf.pdf_path) else ""

    # If no PDF exists, generate a fresh one
    if not existing_pdf_path:
        existing_pdf_path = generate_challan_pdf(pdf_details, PDF_DIR)
        pdf_record = PDFChallan(violation_id=violation.id, pdf_path=existing_pdf_path)
        db.add(pdf_record)
        db.commit()

    # Build & Send email with PDF attached
    email_body = await generate_email_content(pdf_details, db)
    email_sent = await send_challan_email(
        recipient=vehicle.email,
        subject=f"RoadPay AI E-Challan Alert (Resent) for {violation.vehicle_number}",
        html_body=email_body,
        violation_id=violation.id,
        db=db,
        pdf_path=existing_pdf_path
    )
    
    return {
        "status": "success",
        "message": f"Challan email resend attempt completed.",
        "email_sent": email_sent,
        "recipient": vehicle.email
    }
