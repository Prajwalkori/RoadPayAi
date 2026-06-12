from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime, date

# --- AUTH & USER SCHEMAS ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "VEHICLE_OWNER"
    status: str = "ACTIVE"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str
    name: str
    id: int

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- VEHICLE SCHEMAS ---
class VehicleBase(BaseModel):
    vehicle_number: str
    owner_name: str
    email: EmailStr
    phone: str
    address: Optional[str] = None
    vehicle_type: str = "MOTORCYCLE"
    registration_date: Optional[date] = None
    status: str = "ACTIVE"

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    owner_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    vehicle_type: Optional[str] = None
    registration_date: Optional[date] = None
    status: Optional[str] = None

class VehicleResponse(VehicleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- VIOLATION SCHEMAS ---
class ViolationBase(BaseModel):
    vehicle_number: str
    violation_type: str
    violation_image_path: Optional[str] = None
    confidence_score: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    base_amount: float = 500.0
    late_penalty: float = 0.0
    discount_earned: float = 0.0
    final_amount: float = 500.0
    due_date: datetime
    status: str = "PENDING"
    explanation: Optional[str] = None
    quiz_attempt_id: Optional[int] = None

class ViolationCreate(ViolationBase):
    challan_id: str

class ViolationResponse(ViolationBase):
    id: int
    challan_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- PAYMENT SCHEMAS ---
class PaymentCreate(BaseModel):
    violation_id: int
    amount: float
    payment_method: Optional[str] = "UPI"

class PaymentResponse(BaseModel):
    id: int
    violation_id: int
    payment_id: Optional[str] = None
    order_id: Optional[str] = None
    amount: float
    payment_method: Optional[str] = None
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True

class PaymentVerify(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    violation_id: int

# --- QUIZ & LEARNING SCHEMAS ---
class QuizQuestion(BaseModel):
    id: int
    scenario: str
    question: str
    options: List[str]
    correct_index: int
    explanation: str

class QuizModule(BaseModel):
    violation_type: str
    questions: List[QuizQuestion]

class QuizSubmit(BaseModel):
    violation_id: int
    answers: List[int]  # List of selected indices matching question indices

class QuizAttemptResponse(BaseModel):
    id: int
    user_id: int
    violation_id: int
    score: float
    passed: bool
    discount_earned: float
    answers: Any
    completed_at: datetime

    class Config:
        from_attributes = True

class CertificateResponse(BaseModel):
    id: int
    user_id: int
    violation_id: int
    certificate_code: str
    issued_at: datetime

    class Config:
        from_attributes = True

# --- SETTINGS SCHEMAS ---
class SettingsBase(BaseModel):
    gemini_api_key: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    razorpay_key_id: Optional[str] = None
    razorpay_secret: Optional[str] = None

class SettingsResponse(SettingsBase):
    updated_at: datetime

    class Config:
        from_attributes = True

# --- ANALYTICS SCHEMAS ---
class AdminAnalytics(BaseModel):
    total_violations: int
    revenue_collected: float
    pending_payments: int
    overdue_payments: int
    common_violations: dict
    revenue_trend: List[dict]
    violation_trends: List[dict]
    registry_stats: dict
    quiz_stats: dict
    money_saved: float


# --- PAGINATED SCHEMAS ---
class PaginatedViolations(BaseModel):
    total: int
    page: int
    limit: int
    violations: List[ViolationResponse]

    class Config:
        from_attributes = True

class PaginatedVehicles(BaseModel):
    total: int
    page: int
    limit: int
    vehicles: List[VehicleResponse]

    class Config:
        from_attributes = True

