from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import jwt
from app.config import settings
import random
import string
from fastapi import HTTPException, Security
from fastapi.security import APIKeyCookie
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
cookie_sec = APIKeyCookie(name="session", auto_error=False)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))

def create_access_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def get_current_officer(session_cookie: str = Security(cookie_sec)):
    if not session_cookie:
        raise HTTPException(status_code=401, detail={"error": {"code": "unauthorized", "message": "Not authenticated"}})
    try:
        payload = jwt.decode(session_cookie, settings.SECRET_KEY, algorithms=["HS256"])
        officer_id: str = payload.get("sub")
        if officer_id is None:
            raise HTTPException(status_code=401, detail={"error": {"code": "unauthorized", "message": "Invalid session"}})
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail={"error": {"code": "unauthorized", "message": "Session expired"}})
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail={"error": {"code": "unauthorized", "message": "Invalid session"}})
    
    db = SessionLocal()
    try:
        officer = db.query(models.Officer).filter(models.Officer.id == int(officer_id)).first()
        if not officer:
            raise HTTPException(status_code=401, detail={"error": {"code": "unauthorized", "message": "User not found"}})
        return officer
    finally:
        db.close()
