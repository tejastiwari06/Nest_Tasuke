from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from app import models, schemas, security, email_service
from app.db import get_db
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
async def register(req: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.Officer).filter(models.Officer.email == req.email).first()
    if existing and existing.is_verified:
        raise HTTPException(status_code=409, detail={"error": {"code": "conflict", "message": "Email already registered"}})
    
    if not existing:
        officer = models.Officer(
            email=req.email,
            full_name=req.full_name,
            designation=req.designation,
            forest_division=req.forest_division,
            forest_range=req.forest_range,
            phone=req.phone
        )
        db.add(officer)
        db.commit()
    
    recent_otps = db.query(models.OTPCode).filter(
        models.OTPCode.email == req.email,
        models.OTPCode.created_at >= datetime.now(timezone.utc) - timedelta(hours=1)
    ).count()
    if recent_otps >= 5:
        raise HTTPException(status_code=429, detail={"error": {"code": "rate_limit", "message": "Too many code requests"}})

    code = security.generate_otp()
    code_hash = security.get_password_hash(code)
    
    otp = models.OTPCode(
        email=req.email,
        code_hash=code_hash,
        purpose="verify",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
    )
    db.add(otp)
    db.commit()
    
    try:
        await email_service.send_email(
            req.email,
            "Verification Code",
            f"Your verification code is {code}. It expires in 10 minutes."
        )
    except Exception as e:
        print(f"Email failed: {e}")
        pass
    
    res = {"message": "Verification code sent"}
    if settings.DEV_MODE and not settings.SMTP_HOST:
        res["dev_otp"] = code
    return res


@router.post("/verify-email")
def verify_email(req: schemas.VerifyRequest, response: Response, db: Session = Depends(get_db)):
    otp = db.query(models.OTPCode).filter(
        models.OTPCode.email == req.email,
        models.OTPCode.purpose == "verify",
        models.OTPCode.used == False,
        models.OTPCode.expires_at > datetime.now(timezone.utc)
    ).order_by(models.OTPCode.created_at.desc()).first()
    
    if not otp:
        raise HTTPException(status_code=400, detail={"error": {"code": "invalid_code", "message": "Code invalid or expired"}})
    
    if otp.attempts >= 5:
        raise HTTPException(status_code=400, detail={"error": {"code": "invalid_code", "message": "Too many attempts"}})
    
    if not security.verify_password(req.code, otp.code_hash):
        otp.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail={"error": {"code": "invalid_code", "message": "Incorrect code"}})
    
    otp.used = True
    officer = db.query(models.Officer).filter(models.Officer.email == req.email).first()
    officer.is_verified = True
    db.commit()
    
    access_token = security.create_access_token(data={"sub": str(officer.id)}, expires_delta=timedelta(hours=12))
    response.set_cookie(key="session", value=access_token, httponly=True, samesite="lax", max_age=12*3600)
    
    return {"message": "Email verified and logged in"}

@router.post("/login")
async def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    officer = db.query(models.Officer).filter(models.Officer.email == req.email, models.Officer.is_verified == True).first()
    
    res = {"message": "If the email exists, a code has been sent."}
    
    if officer:
        recent_otps = db.query(models.OTPCode).filter(
            models.OTPCode.email == req.email,
            models.OTPCode.created_at >= datetime.now(timezone.utc) - timedelta(hours=1)
        ).count()
        if recent_otps < 5:
            code = security.generate_otp()
            code_hash = security.get_password_hash(code)
            otp = models.OTPCode(
                email=req.email,
                code_hash=code_hash,
                purpose="login",
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
            )
            db.add(otp)
            db.commit()
            
            try:
                await email_service.send_email(
                    req.email,
                    "Login Code",
                    f"Your login code is {code}. It expires in 10 minutes."
                )
            except Exception as e:
                pass
            
            if settings.DEV_MODE and not settings.SMTP_HOST:
                res["dev_otp"] = code

    return res

@router.post("/login/verify")
def login_verify(req: schemas.VerifyRequest, response: Response, db: Session = Depends(get_db)):
    otp = db.query(models.OTPCode).filter(
        models.OTPCode.email == req.email,
        models.OTPCode.purpose == "login",
        models.OTPCode.used == False,
        models.OTPCode.expires_at > datetime.now(timezone.utc)
    ).order_by(models.OTPCode.created_at.desc()).first()
    
    if not otp:
        raise HTTPException(status_code=400, detail={"error": {"code": "invalid_code", "message": "Code invalid or expired"}})
    
    if otp.attempts >= 5:
        raise HTTPException(status_code=400, detail={"error": {"code": "invalid_code", "message": "Too many attempts"}})
    
    if not security.verify_password(req.code, otp.code_hash):
        otp.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail={"error": {"code": "invalid_code", "message": "Incorrect code"}})
    
    otp.used = True
    officer = db.query(models.Officer).filter(models.Officer.email == req.email).first()
    db.commit()
    
    access_token = security.create_access_token(data={"sub": str(officer.id)}, expires_delta=timedelta(hours=12))
    response.set_cookie(key="session", value=access_token, httponly=True, samesite="lax", max_age=12*3600)
    
    return {"message": "Logged in"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("session")
    return {"message": "Logged out"}
