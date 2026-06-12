from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, QuizAttempt, Certificate
from app.schemas import UserResponse, UserCreate, UserUpdate
from app.auth import require_admin, get_password_hash, get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.post("", response_model=UserResponse)
def admin_create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        status="ACTIVE"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}", response_model=UserResponse)
def admin_update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if user_id == admin.id and user_update.role and user_update.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot revoke your own admin role"
        )

    for field, value in user_update.dict(exclude_unset=True).items():
        if field == "password":
            user.password_hash = get_password_hash(value)
        else:
            setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete yourself"
        )
        
    # Delete related certificates and quiz attempts to avoid foreign key errors
    db.query(Certificate).filter(Certificate.user_id == user_id).delete()
    db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).delete()
    
    db.delete(user)
    db.commit()
    return None

@router.post("/{user_id}/status", response_model=UserResponse)
def admin_toggle_user_status(
    user_id: int,
    status_in: str, # ACTIVE or SUSPENDED
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    if status_in not in ["ACTIVE", "SUSPENDED"]:
        raise HTTPException(status_code=400, detail="Invalid status value")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot suspend yourself")
        
    user.status = status_in
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/reset-password", response_model=UserResponse)
def admin_reset_user_password(
    user_id: int,
    new_password: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.password_hash = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return user
