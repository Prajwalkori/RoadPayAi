import hmac
import hashlib
import uuid
from typing import Dict, Any, Optional
import razorpay
from sqlalchemy.orm import Session
from app.models import Settings

def get_settings(db: Session) -> Settings:
    settings = db.query(Settings).filter(Settings.id == 1).first()
    if not settings:
        settings = Settings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

def get_razorpay_client(db: Session) -> Optional[razorpay.Client]:
    settings = get_settings(db)
    if settings.razorpay_key_id and settings.razorpay_secret:
        try:
            return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_secret))
        except Exception as e:
            print(f"Error initializing Razorpay Client: {e}")
    return None

def create_payment_order(violation_id: int, amount_in_rupees: float, db: Session) -> Dict[str, Any]:
    """
    Creates a Razorpay order. If credentials are not configured, uses Simulated Mode.
    """
    amount_in_paise = int(amount_in_rupees * 100)
    client = get_razorpay_client(db)
    
    if client:
        try:
            data = {
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"receipt_violation_{violation_id}",
                "payment_capture": 1
            }
            order = client.order.create(data=data)
            return {
                "mode": "live",
                "order_id": order["id"],
                "amount": amount_in_rupees,
                "key_id": get_settings(db).razorpay_key_id
            }
        except Exception as e:
            print(f"Razorpay Live Order Creation failed: {e}. Falling back to simulation.")

    # Simulated Mode
    mock_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
    return {
        "mode": "simulation",
        "order_id": mock_order_id,
        "amount": amount_in_rupees,
        "key_id": "rzp_test_mockkeyid123"
    }

def verify_payment_signature(payment_id: str, order_id: str, signature: str, db: Session) -> bool:
    """
    Verifies Razorpay payment signature.
    """
    if order_id.startswith("order_mock_") or (signature and signature.startswith("sig_sim_")) or (payment_id and payment_id.startswith("pay_sim_")):
        # Simulated payment verification: Accept mock signatures or simple format checks
        return True

    client = get_razorpay_client(db)
    if client:
        try:
            params_dict = {
                'razorpay_order_id': order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature
            }
            client.utility.verify_payment_signature(params_dict)
            return True
        except Exception as e:
            print(f"Razorpay Signature verification failed: {e}")
            return False
            
    # Fallback to manual signature calculation if client creation failed but settings exist
    settings = get_settings(db)
    if settings.razorpay_secret:
        try:
            msg = f"{order_id}|{payment_id}".encode('utf-8')
            secret = settings.razorpay_secret.encode('utf-8')
            generated_signature = hmac.new(secret, msg, hashlib.sha256).hexdigest()
            return hmac.compare_digest(generated_signature, signature)
        except Exception as e:
            print(f"Manual HMAC signature calculation failed: {e}")
            return False
            
    return False
