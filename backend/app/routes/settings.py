from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
import httpx
import razorpay
import uuid
import os

from app.database import get_db
from app.models import Settings, User, Vehicle, Violation, Payment, QuizAttempt, Certificate, PDFChallan
from app.schemas import SettingsBase, SettingsResponse
from app.auth import require_admin, get_password_hash
from app.services.email_service import test_smtp_settings
from app.services.pdf_service import generate_challan_pdf

router = APIRouter(prefix="/settings", tags=["settings"])

def get_or_create_settings(db: Session) -> Settings:
    settings = db.query(Settings).filter(Settings.id == 1).first()
    if not settings:
        settings = Settings(
            id=1,
            gemini_api_key="",
            smtp_host="",
            smtp_port=587,
            smtp_username="",
            smtp_password="",
            razorpay_key_id="",
            razorpay_secret=""
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.get("", response_model=dict)
def get_settings(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    s = get_or_create_settings(db)
    # Return masked settings for safety
    return {
        "gemini_api_key": f"***{s.gemini_api_key[-4:]}" if s.gemini_api_key else "",
        "smtp_host": s.smtp_host or "",
        "smtp_port": s.smtp_port or 587,
        "smtp_username": s.smtp_username or "",
        "smtp_password": f"***" if s.smtp_password else "",
        "razorpay_key_id": f"***{s.razorpay_key_id[-4:]}" if s.razorpay_key_id else "",
        "razorpay_secret": f"***" if s.razorpay_secret else "",
        "updated_at": s.updated_at
    }

@router.post("/save", response_model=dict)
def save_settings(
    payload: SettingsBase,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    s = get_or_create_settings(db)
    
    # Update fields only if they aren't masked (i.e. user input new values)
    if payload.gemini_api_key and not payload.gemini_api_key.startswith("***"):
        s.gemini_api_key = payload.gemini_api_key
    if payload.smtp_host is not None:
        s.smtp_host = payload.smtp_host
    if payload.smtp_port is not None:
        s.smtp_port = payload.smtp_port
    if payload.smtp_username is not None:
        s.smtp_username = payload.smtp_username
    if payload.smtp_password and not payload.smtp_password.startswith("***"):
        s.smtp_password = payload.smtp_password
    if payload.razorpay_key_id is not None:
        s.razorpay_key_id = payload.razorpay_key_id
    if payload.razorpay_secret and not payload.razorpay_secret.startswith("***"):
        s.razorpay_secret = payload.razorpay_secret
        
    s.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Settings updated successfully"}

@router.post("/test-smtp")
async def test_smtp(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    s = get_or_create_settings(db)
    success = await test_smtp_settings(s, db)
    if not success:
        raise HTTPException(status_code=400, detail="SMTP connection test failed. Verify credentials.")
    return {"status": "success", "message": "SMTP connection test passed."}

@router.post("/test-gemini")
async def test_gemini(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    url = os.getenv("LOCAL_LLM_URL", "http://127.0.0.1:11434")
    if url.endswith("/v1"):
        url = url[:-3]
    elif url.endswith("/v1/"):
        url = url[:-4]
    model = os.getenv("LOCAL_LLM_MODEL", "smallthinker:latest")
    try:
        with httpx.Client(timeout=30.0, trust_env=False) as client:
            response = client.post(
                f"{url}/api/chat",
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": "Ping"}],
                    "stream": False
                },
                headers={"Content-Type": "application/json"}
            )
            if response.status_code == 200:
                return {"status": "success", "message": f"Local LLM connection test passed successfully using model {model}."}
            else:
                raise HTTPException(status_code=400, detail=f"Local LLM status {response.status_code}. Verify model '{model}' is pulled.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Local LLM test failed: {str(e)}. Ensure Ollama is running and '{model}' is pulled.")

@router.post("/test-razorpay")
def test_razorpay(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    s = get_or_create_settings(db)
    if not s.razorpay_key_id or not s.razorpay_secret:
         raise HTTPException(status_code=400, detail="Razorpay credentials not configured.")
    try:
        client = razorpay.Client(auth=(s.razorpay_key_id, s.razorpay_secret))
        # Call a basic endpoint
        orders = client.order.all()
        return {"status": "success", "message": "Razorpay connection test passed successfully."}
    except Exception as e:
         raise HTTPException(status_code=400, detail=f"Razorpay connection failed: {str(e)}")

@router.post("/seed-mock-data")
def seed_mock_data(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Seeds a full realistic database state for demos:
    - Creates a vehicle owner user (if not exists)
    - Adds multiple registered vehicles
    - Adds mock violations with pending, overdue, and paid states
    - Inserts mock payment transactions and quiz modules
    """
    # 1. Ensure vehicle owner user exists
    owner_email = "owner@roadpay.ai"
    owner = db.query(User).filter(User.email == owner_email).first()
    if not owner:
        owner = User(
            name="Rohan Sharma",
            email=owner_email,
            password_hash=get_password_hash("owner123"),
            role="VEHICLE_OWNER",
            status="ACTIVE"
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)

    # 2. Add sample vehicles
    vehicles_data = [
        {"vehicle_number": "MH12AB1234", "owner_name": "Rohan Sharma", "email": "owner@roadpay.ai", "phone": "9876543210", "address": "Flat 402, Skyline Towers, Pune", "vehicle_type": "MOTORCYCLE", "status": "ACTIVE"},
        {"vehicle_number": "DL3CA9988", "owner_name": "Aarav Singh", "email": "aarav@gmail.com", "phone": "9988776655", "address": "H.No 12, Sector 15, Dwarka, Delhi", "vehicle_type": "CAR", "status": "ACTIVE"},
        {"vehicle_number": "KA03MM4567", "owner_name": "Priya Nair", "email": "priya.nair@hotmail.com", "phone": "8877665544", "address": "45/A, 10th Main, Indiranagar, Bengaluru", "vehicle_type": "MOTORCYCLE", "status": "ACTIVE"},
        {"vehicle_number": "HR26EE1122", "owner_name": "Rohan Sharma", "email": "owner@roadpay.ai", "phone": "9876543210", "address": "Flat 402, Skyline Towers, Pune", "vehicle_type": "MOTORCYCLE", "status": "ACTIVE"}
    ]

    vehicles = []
    for v_info in vehicles_data:
        v = db.query(Vehicle).filter(Vehicle.vehicle_number == v_info["vehicle_number"]).first()
        if not v:
            v = Vehicle(
                vehicle_number=v_info["vehicle_number"],
                owner_name=v_info["owner_name"],
                email=v_info["email"],
                phone=v_info["phone"],
                address=v_info["address"],
                vehicle_type=v_info["vehicle_type"],
                registration_date=date.today() - timedelta(days=365),
                status=v_info["status"],
                created_by=admin.id
            )
            db.add(v)
            db.commit()
            db.refresh(v)
        vehicles.append(v)

    # Clear existing violations for fresh start if desired, or skip
    # For a clean demo let's add violations that are distinct
    
    # 3. Add Violations
    violations_data = [
        {
            "challan_id": "RP-20260601-H1",
            "vehicle_number": "MH12AB1234",
            "violation_type": "HELMET_VIOLATION",
            "timestamp": datetime.utcnow() - timedelta(days=4), # Over 3 days ago, triggers penalty
            "base_amount": 500.0,
            "late_penalty": 100.0,
            "due_date": datetime.utcnow() + timedelta(days=3),
            "status": "PENDING",
            "explanation": "Rider detected driving a Honda Activa MH12AB1234 without wearing a protective helmet. Helmets shield the skull from traumatic head impact in low-side and high-side collisions."
        },
        {
            "challan_id": "RP-20260605-T1",
            "vehicle_number": "KA03MM4567",
            "violation_type": "TRIPLE_RIDING",
            "timestamp": datetime.utcnow() - timedelta(days=8), # Over 7 days ago, triggers penalty
            "base_amount": 500.0,
            "late_penalty": 300.0,
            "due_date": datetime.utcnow() - timedelta(days=1),
            "status": "OVERDUE",
            "explanation": "Motorcycle KA03MM4567 carrying 3 passengers on a standard seat. Carrying three people overloads steering suspension, shifts balance, and increases stopping distance."
        },
        {
            "challan_id": "RP-20260608-W1",
            "vehicle_number": "MH12AB1234",
            "violation_type": "WRONG_DIRECTION",
            "timestamp": datetime.utcnow() - timedelta(days=1),
            "base_amount": 500.0,
            "late_penalty": 0.0,
            "due_date": datetime.utcnow() + timedelta(days=6),
            "status": "PAID",
            "explanation": "Vehicle detected driving against the designated direction of flow on the speedway. Driving wrong-way risks head-on impacts which sum kinetic velocities on impact."
        },
        {
            "challan_id": "RP-20260609-H2",
            "vehicle_number": "HR26EE1122",
            "violation_type": "HELMET_VIOLATION",
            "timestamp": datetime.utcnow() - timedelta(hours=5),
            "base_amount": 500.0,
            "late_penalty": 0.0,
            "due_date": datetime.utcnow() + timedelta(days=7),
            "status": "PENDING",
            "explanation": "Rider carrying child passenger, both without protective helmets. Children are vulnerable to sudden stops, and helmets protect brain shears."
        }
    ]

    PDF_DIR = "app/data/challans"
    os.makedirs(PDF_DIR, exist_ok=True)

    for v_info in violations_data:
        v = db.query(Violation).filter(Violation.challan_id == v_info["challan_id"]).first()
        if not v:
            v = Violation(
                challan_id=v_info["challan_id"],
                vehicle_number=v_info["vehicle_number"],
                violation_type=v_info["violation_type"],
                timestamp=v_info["timestamp"],
                base_amount=v_info["base_amount"],
                late_penalty=v_info["late_penalty"],
                final_amount=v_info["base_amount"] + v_info["late_penalty"],
                due_date=v_info["due_date"],
                status=v_info["status"],
                explanation=v_info["explanation"]
            )
            db.add(v)
            db.commit()
            db.refresh(v)

            # If paid, add a successful payment record
            if v_info["status"] == "PAID":
                p = Payment(
                    violation_id=v.id,
                    payment_id=f"pay_mock_{uuid.uuid4().hex[:12]}",
                    order_id=f"order_mock_{uuid.uuid4().hex[:12]}",
                    signature=uuid.uuid4().hex,
                    amount=v.final_amount,
                    payment_method="UPI",
                    status="SUCCESS",
                    timestamp=datetime.utcnow()
                )
                db.add(p)
                db.commit()

        # Check if PDFChallan record exists for this violation, generate if missing
        pdf_record = db.query(PDFChallan).filter(PDFChallan.violation_id == v.id).first()
        if not pdf_record or not os.path.exists(pdf_record.pdf_path):
            vehicle = db.query(Vehicle).filter(Vehicle.vehicle_number == v.vehicle_number).first()
            owner_name = vehicle.owner_name if vehicle else "Citizen Owner"
            
            pdf_details = {
                "challan_id": v.challan_id,
                "date": v.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "vehicle_number": v.vehicle_number,
                "due_date": v.due_date.strftime("%Y-%m-%d"),
                "owner_name": owner_name,
                "amount": f"{v.final_amount:.2f}",
                "violation_type": v.violation_type,
                "status": v.status,
                "explanation": v.explanation,
                "violation_image_path": "",
                "payment_url": "http://localhost:3000/dashboard/violations",
                "learning_link": f"http://localhost:3000/dashboard/learning?violation_id={v.id}"
            }
            try:
                pdf_path = generate_challan_pdf(pdf_details, PDF_DIR)
                if not pdf_record:
                    pdf_record = PDFChallan(violation_id=v.id, pdf_path=pdf_path)
                    db.add(pdf_record)
                else:
                    pdf_record.pdf_path = pdf_path
                db.commit()
            except Exception as e:
                print(f"Error seeding mock PDF for {v.challan_id}: {e}")

    return {"status": "success", "message": "Mock registry and violations database seeded successfully."}
