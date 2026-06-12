from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import asyncio

# Helper to load .env variables manually since python-dotenv might not be installed
def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip()
                    if val.startswith('"') and val.endswith('"'):
                        val = val[1:-1]
                    elif val.startswith("'") and val.endswith("'"):
                        val = val[1:-1]
                    os.environ[key] = val

load_env()

from app.database import engine, Base, SessionLocal
from app.models import User, Settings
from app.auth import get_password_hash
from app.services.scheduler_service import scheduler_loop

# Import Routers
from app.routes import auth, users, vehicles, violations, payments, learning, settings, analytics, views

# 1. Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RoadPay AI API",
    description="Automated Traffic Violation Detection, E-Challan, and Gamified Learning Portal",
    version="1.0.0"
)

# 2. Configure CORS (allow frontend development server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount uploaded media files and static assets
os.makedirs("app/data/uploads", exist_ok=True)
os.makedirs("app/data/challans", exist_ok=True)
os.makedirs("app/static", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="app/data/uploads"), name="uploads")
app.mount("/challans", StaticFiles(directory="app/data/challans"), name="challans")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# 4. Register Routes
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(vehicles.router, prefix="/api")
app.include_router(violations.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(learning.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(views.router)

# 5. Startup Events
@app.on_event("startup")
async def on_startup():
    db = SessionLocal()
    try:
        # Seed Default Admin Account
        admin_email = "admin@roadpay.ai"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_user = User(
                name="System Administrator",
                email=admin_email,
                password_hash=get_password_hash("admin123"),
                role="ADMIN",
                status="ACTIVE"
            )
            db.add(admin_user)
            db.commit()
            print("Default ADMIN user seeded: admin@roadpay.ai / admin123")
            
        # Seed Default Traffic Officer Account
        officer_email = "officer@roadpay.ai"
        officer_user = db.query(User).filter(User.email == officer_email).first()
        if not officer_user:
            officer_user = User(
                name="Officer Sharma",
                email=officer_email,
                password_hash=get_password_hash("officer123"),
                role="TRAFFIC_OFFICER",
                status="ACTIVE"
            )
            db.add(officer_user)
            db.commit()
            print("Default TRAFFIC_OFFICER user seeded: officer@roadpay.ai / officer123")

        # Initialize settings singleton if missing
        settings = db.query(Settings).filter(Settings.id == 1).first()
        if not settings:
            settings = Settings(id=1)
            db.add(settings)
            db.commit()
            db.refresh(settings)

        # Sync credentials from backend/.env environment variables
        settings.gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GROQ_API_KEY", settings.gemini_api_key)
        settings.smtp_host = os.getenv("SMTP_HOST", settings.smtp_host)
        smtp_port_env = os.getenv("SMTP_PORT")
        if smtp_port_env:
            try:
                settings.smtp_port = int(smtp_port_env)
            except ValueError:
                pass
        settings.smtp_username = os.getenv("SMTP_USERNAME", settings.smtp_username)
        settings.smtp_password = os.getenv("SMTP_PASSWORD", settings.smtp_password)
        settings.razorpay_key_id = os.getenv("RAZORPAY_KEY_ID", settings.razorpay_key_id)
        settings.razorpay_secret = os.getenv("RAZORPAY_SECRET", settings.razorpay_secret)
        db.commit()
        print("System settings synchronized from backend/.env variables.")
            
    finally:
        db.close()

    # Start the background scheduler task for penalties & reminders
    asyncio.create_task(scheduler_loop(SessionLocal))
    print("Background scheduler service started successfully.")

@app.get("/")
def read_root():
    return {"message": "RoadPay AI Backend is running securely."}
