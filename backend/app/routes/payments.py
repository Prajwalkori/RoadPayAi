from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import Violation, Payment, Vehicle, User
from app.schemas import PaymentResponse, PaymentVerify
from app.auth import get_current_user
from app.services.payment_service import create_payment_order, verify_payment_signature
from app.services.email_service import send_challan_email

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/create-order")
def create_order(
    violation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
        
    if violation.status == "PAID":
        raise HTTPException(status_code=400, detail="This challan has already been paid.")
        
    # Check permission
    if current_user.role == "VEHICLE_OWNER":
        vehicle = db.query(Vehicle).filter(
            Vehicle.vehicle_number == violation.vehicle_number,
            Vehicle.email == current_user.email
        ).first()
        if not vehicle:
            raise HTTPException(status_code=403, detail="Permission denied to pay this challan.")

    order_details = create_payment_order(violation.id, violation.final_amount, db)
    
    # Store initial pending payment record
    payment = Payment(
        violation_id=violation.id,
        order_id=order_details["order_id"],
        amount=violation.final_amount,
        status="PENDING"
    )
    db.add(payment)
    db.commit()
    
    return order_details

@router.post("/verify")
async def verify_payment(
    payload: PaymentVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retrieve pending payment
    payment = db.query(Payment).filter(Payment.order_id == payload.razorpay_order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment order not found")
        
    # Validate Signature
    is_valid = verify_payment_signature(
        payment_id=payload.razorpay_payment_id,
        order_id=payload.razorpay_order_id,
        signature=payload.razorpay_signature,
        db=db
    )
    
    if not is_valid:
        payment.status = "FAILED"
        db.commit()
        raise HTTPException(status_code=400, detail="Payment signature verification failed.")
        
    # Update payment record
    payment.payment_id = payload.razorpay_payment_id
    payment.signature = payload.razorpay_signature
    payment.payment_method = "UPI/CARD" # Custom method mapping
    payment.status = "SUCCESS"
    payment.timestamp = datetime.utcnow()
    
    # Update violation status
    violation = db.query(Violation).filter(Violation.id == payload.violation_id).first()
    if violation:
        violation.status = "PAID"
        db.commit()
        
        # Send Payment Confirmation Email
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
                    <h2>Payment Success Receipt</h2>
                    <p>Dear {vehicle.owner_name},</p>
                    <p>Your payment for Challan <strong>{violation.challan_id}</strong> has been received successfully.</p>
                    <div class="row">
                        <span class="lbl">Receipt Reference:</span>
                        <span class="val">{payload.razorpay_payment_id}</span>
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
                subject=f"RoadPay Payment Confirmation: {violation.challan_id}",
                html_body=email_body,
                violation_id=violation.id,
                db=db
            )
            
    db.commit()
    return {"status": "success", "message": "Payment verified and recorded."}
