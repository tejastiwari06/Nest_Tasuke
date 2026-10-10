import aiosmtplib
from email.message import EmailMessage
from app.config import settings

async def send_email(to_email: str, subject: str, body: str, cc_emails: list[str] = None):
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        if settings.DEV_MODE:
            print(f"--- EMAIL SIMULATION ---\nTo: {to_email}\nCC: {cc_emails}\nSubject: {subject}\nBody:\n{body}\n------------------------")
            return
        raise Exception("SMTP is not configured")

    message = EmailMessage()
    message["From"] = settings.FROM_EMAIL
    message["To"] = to_email
    if cc_emails:
        message["Cc"] = ", ".join(cc_emails)
    message["Subject"] = subject
    message.set_content(body)
    
    # HTML version (same content)
    html_body = body.replace("\n", "<br>")
    message.add_alternative(html_body, subtype='html')

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=settings.SMTP_PORT == 587,
            use_tls=settings.SMTP_PORT == 465,
        )
    except Exception as e:
        raise Exception(f"Failed to send email: {str(e)}")
