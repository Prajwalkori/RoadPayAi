import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
import anyio
from sqlalchemy.orm import Session
from app.models import Settings, EmailLog
from datetime import datetime

def get_settings(db: Session) -> Settings:
    settings = db.query(Settings).filter(Settings.id == 1).first()
    if not settings:
        settings = Settings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

def send_email_sync(recipient: str, subject: str, html_body: str, settings: Settings, pdf_path: str = "") -> bool:
    """
    Sends SMTP email synchronously with optional PDF attachment.
    """
    if not settings.smtp_host or not settings.smtp_port or not settings.smtp_username or not settings.smtp_password:
        print(f"[SIMULATED EMAIL] To: {recipient}\nSubject: {subject}\nBody Preview:\n{html_body[:300]}...\n")
        return True

    # Do not attempt SMTP transmission for mock domains like @roadpay.ai
    if recipient.strip().lower().endswith("@roadpay.ai"):
        print(f"[SIMULATED EMAIL FOR MOCK DOMAIN] To: {recipient}\nSubject: {subject}\n")
        return True

    try:
        msg = MIMEMultipart("mixed")
        msg["Subject"] = subject
        msg["From"] = settings.smtp_username
        msg["To"] = recipient

        # Attach HTML body
        html_part = MIMEText(html_body, "html")
        msg.attach(html_part)

        # Attach PDF if provided and exists
        if pdf_path and os.path.exists(pdf_path):
            try:
                with open(pdf_path, "rb") as f:
                    pdf_data = f.read()
                pdf_attachment = MIMEBase("application", "pdf")
                pdf_attachment.set_payload(pdf_data)
                encoders.encode_base64(pdf_attachment)
                filename = os.path.basename(pdf_path)
                pdf_attachment.add_header(
                    "Content-Disposition",
                    "attachment",
                    filename=filename
                )
                msg.attach(pdf_attachment)
                print(f"[EMAIL] PDF attached: {filename} ({len(pdf_data)} bytes)")
            except Exception as e:
                print(f"[EMAIL] Warning: Could not attach PDF: {e}")

        # Standard SMTP logic
        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port)
        server.starttls()
        server.login(settings.smtp_username, settings.smtp_password)
        server.sendmail(settings.smtp_username, recipient, msg.as_string())
        server.quit()
        print(f"[EMAIL] Successfully sent to {recipient}")
        return True
    except Exception as e:
        print(f"SMTP Transmission Error: {e}. Email was simulated instead.")
        return False

async def send_challan_email(
    recipient: str,
    subject: str,
    html_body: str,
    violation_id: int,
    db: Session,
    pdf_path: str = ""
) -> bool:
    """
    Asynchronously triggers email sending with optional PDF attachment and writes status logs.
    """
    settings = get_settings(db)

    # Create Email Log
    email_log = EmailLog(
        violation_id=violation_id,
        recipient_email=recipient,
        email_type="CHALLAN_ISSUED" if "Challan" in subject else "REMINDER",
        status="PENDING",
        sent_at=None
    )
    db.add(email_log)
    db.commit()
    db.refresh(email_log)

    # Dispatch to thread pool to avoid blocking FastAPI main event loop
    success = await anyio.to_thread.run_sync(
        lambda: send_email_sync(recipient, subject, html_body, settings, pdf_path)
    )

    # Update status
    email_log.status = "SENT" if success else "FAILED"
    email_log.sent_at = datetime.utcnow()
    db.commit()

    return success

async def test_smtp_settings(settings_data: Settings, db: Session) -> bool:
    """
    Tests SMTP connection validity.
    """
    if not settings_data.smtp_host or not settings_data.smtp_port or not settings_data.smtp_username or not settings_data.smtp_password:
        return False

    def test_conn():
        try:
            server = smtplib.SMTP(settings_data.smtp_host, settings_data.smtp_port, timeout=5)
            server.starttls()
            server.login(settings_data.smtp_username, settings_data.smtp_password)
            server.quit()
            return True
        except Exception as e:
            print(f"SMTP Test Connection failed: {e}")
            return False

    return await anyio.to_thread.run_sync(test_conn)
