from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.db import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    designation = Column(String)
    forest_division = Column(String)
    forest_range = Column(String)
    phone = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OTPCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    code_hash = Column(String)
    purpose = Column(String) # "verify" or "login"
    expires_at = Column(DateTime(timezone=True))
    attempts = Column(Integer, default=0)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Clip(Base):
    __tablename__ = "clips"

    id = Column(String, primary_key=True, default=generate_uuid)
    officer_id = Column(Integer, ForeignKey("officers.id"))
    zone_id = Column(String)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    accuracy_m = Column(Float, nullable=True)
    location_source = Column(String) # "browser" | "default" | "none"
    maps_link = Column(String, nullable=True)

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    clip_id = Column(String, ForeignKey("clips.id"))
    officer_id = Column(Integer, ForeignKey("officers.id"))
    kind = Column(String) # "Bird" | "Threat"
    name = Column(String) # species or threat type
    call_type = Column(String, nullable=True)
    confidence = Column(Float)
    is_alert = Column(Boolean, default=False)
    raw_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    to_email = Column(String)
    subject = Column(String)
    status = Column(String) # "sent" | "failed" | "skipped"
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
