from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="VEHICLE_OWNER")  # ADMIN, TRAFFIC_OFFICER, VEHICLE_OWNER
    status = Column(String, default="ACTIVE")  # ACTIVE, SUSPENDED
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    quiz_attempts = relationship("QuizAttempt", back_populates="user")
    certificates = relationship("Certificate", back_populates="user")

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, unique=True, index=True, nullable=False)  # Uppercase format e.g. MH12AB1234
    owner_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(Text, nullable=True)
    vehicle_type = Column(String, default="MOTORCYCLE")  # MOTORCYCLE, CAR, TRUCK
    registration_date = Column(Date, nullable=True)
    status = Column(String, default="ACTIVE")  # ACTIVE, BLACKLISTED
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete

class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    challan_id = Column(String, unique=True, index=True, nullable=False)  # RP-YYYYMMDD-XXXX
    vehicle_number = Column(String, nullable=False)
    violation_type = Column(String, nullable=False)  # HELMET_VIOLATION, TRIPLE_RIDING, WRONG_DIRECTION
    violation_image_path = Column(String, nullable=True)
    confidence_score = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    base_amount = Column(Float, default=500.0)
    late_penalty = Column(Float, default=0.0)
    discount_earned = Column(Float, default=0.0)
    final_amount = Column(Float, default=500.0)
    due_date = Column(DateTime, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, PAID, OVERDUE
    explanation = Column(Text, nullable=True)  # Gemini generated explanation
    quiz_attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    payments = relationship("Payment", back_populates="violation")
    email_logs = relationship("EmailLog", back_populates="violation")
    pdf_challans = relationship("PDFChallan", back_populates="violation")
    reminders = relationship("Reminder", back_populates="violation")
    quiz_attempt = relationship("QuizAttempt", foreign_keys=[quiz_attempt_id], post_update=True)

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False)
    payment_id = Column(String, unique=True, index=True, nullable=True)  # Razorpay payment id
    order_id = Column(String, unique=True, index=True, nullable=True)  # Razorpay order id
    signature = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=True)  # UPI, CARD, NET_BANKING
    status = Column(String, default="PENDING")  # SUCCESS, FAILED, PENDING
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    violation = relationship("Violation", back_populates="payments")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False)
    score = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    discount_earned = Column(Float, default=0.0)
    answers = Column(JSON, nullable=True)  # Detailed question response logs
    completed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="quiz_attempts")

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False)
    certificate_code = Column(String, unique=True, index=True, nullable=False)  # RPCERT-XXXXXX
    issued_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="certificates")

class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False)
    recipient_email = Column(String, nullable=False)
    email_type = Column(String, nullable=False)  # CHALLAN_ISSUED, REMINDER_1, REMINDER_2, REMINDER_3, PAYMENT_SUCCESS
    status = Column(String, default="PENDING")  # SENT, FAILED, PENDING
    sent_at = Column(DateTime, nullable=True)

    # Relationships
    violation = relationship("Violation", back_populates="email_logs")

class PDFChallan(Base):
    __tablename__ = "pdf_challans"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False)
    pdf_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    violation = relationship("Violation", back_populates="pdf_challans")

class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, default=1)
    gemini_api_key = Column(String, nullable=True)
    smtp_host = Column(String, nullable=True)
    smtp_port = Column(Integer, nullable=True)
    smtp_username = Column(String, nullable=True)
    smtp_password = Column(String, nullable=True)
    razorpay_key_id = Column(String, nullable=True)
    razorpay_secret = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False)
    reminder_type = Column(String, nullable=False)  # REMINDER_1, REMINDER_2, REMINDER_3
    scheduled_at = Column(DateTime, nullable=False)
    sent_at = Column(DateTime, nullable=True)

    # Relationships
    violation = relationship("Violation", back_populates="reminders")
