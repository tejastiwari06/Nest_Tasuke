from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    designation: str
    forest_division: str
    forest_range: str
    phone: Optional[str] = None

class VerifyRequest(BaseModel):
    email: EmailStr
    code: str

class LoginRequest(BaseModel):
    email: EmailStr

class OfficerProfile(BaseModel):
    id: int
    email: str
    full_name: str
    designation: str
    forest_division: str
    forest_range: str
    phone: Optional[str] = None
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ErrorResponse(BaseModel):
    code: str
    message: str

class ErrorModel(BaseModel):
    error: ErrorResponse

class DetectionResult(BaseModel):
    event_id: int
    kind: str
    name: str
    call_type: Optional[str] = None
    confidence: float
    is_alert: bool
    email_status: str

class LocationResult(BaseModel):
    lat: Optional[float] = None
    lon: Optional[float] = None
    accuracy_m: Optional[float] = None
    source: str
    maps_link: Optional[str] = None

class AnalyzeResponse(BaseModel):
    clip_id: str
    ALERT: bool
    status: str
    location: LocationResult
    detections: List[DetectionResult]
    processed_at: datetime
