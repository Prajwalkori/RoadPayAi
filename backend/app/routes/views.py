import os
from fastapi import APIRouter, Request, Depends, status, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from jose import jwt

from app.database import get_db
from app.models import User, Settings, Violation, Vehicle
from app.auth import SECRET_KEY, ALGORITHM

router = APIRouter()

# Setup templates directory relative to this file
templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
templates = Jinja2Templates(directory=templates_dir)

def get_current_user_from_cookie(request: Request, db: Session) -> User:
    token = request.cookies.get("access_token")
    if not token:
        return None
    
    # Strip Bearer prefix if present
    if token.startswith("Bearer "):
        token = token.split(" ")[1]
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return db.query(User).filter(User.email == email).first()
    except Exception:
        return None

@router.get("/", response_class=HTMLResponse)
def read_landing(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    return templates.TemplateResponse(request=request, name="landing.html", context={"user": user})

@router.get("/login", response_class=HTMLResponse)
def read_login(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if user:
        return RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse(request=request, name="login.html")

@router.get("/register", response_class=HTMLResponse)
def read_register(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if user:
        return RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse(request=request, name="register.html")

@router.get("/dashboard", response_class=HTMLResponse)
def read_dashboard(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)
    
    # Load dashboard metrics based on user role
    return templates.TemplateResponse(request=request, name="overview.html", context={"user": user})

@router.get("/dashboard/violations", response_class=HTMLResponse)
def read_violations_view(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse(request=request, name="violations.html", context={"user": user})

@router.get("/dashboard/learning", response_class=HTMLResponse)
def read_learning_view(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user or user.role != "VEHICLE_OWNER":
        return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse(request=request, name="learning.html", context={"user": user})

@router.get("/dashboard/registry", response_class=HTMLResponse)
def read_registry_view(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user or user.role not in ["ADMIN", "TRAFFIC_OFFICER"]:
        return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse(request=request, name="registry.html", context={"user": user})

@router.get("/dashboard/users", response_class=HTMLResponse)
def read_users_view(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user or user.role != "ADMIN":
        return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse(request=request, name="users.html", context={"user": user})

@router.get("/dashboard/settings", response_class=HTMLResponse)
def read_settings_view(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user or user.role != "ADMIN":
        return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)
    
    # Load settings database singleton config
    settings = db.query(Settings).filter(Settings.id == 1).first()
    return templates.TemplateResponse(request=request, name="settings.html", context={"user": user, "settings": settings})

@router.get("/logout")
def logout_view():
    response = RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)
    response.delete_cookie("access_token")
    return response
