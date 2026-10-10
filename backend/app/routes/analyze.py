from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import uuid
import os
import subprocess
import json
from app import models, schemas, security, email_service, inference_service
from app.db import get_db, SessionLocal
from app.config import settings

router = APIRouter(prefix="/api", tags=["analyze"])

async def process_alert_email(to_email: str, subject: str, body: str, cc: list[str], event_id: int, db_session: Session):
    try:
        if not settings.SMTP_HOST and settings.DEV_MODE:
            print(f"--- EMAIL SIMULATION ---\nTo: {to_email}\nCC: {cc}\nSubject: {subject}\nBody:\n{body}\n------------------------")
            status = "skipped"
            error_msg = "skipped due to dev mode without SMTP"
        else:
            await email_service.send_email(to_email, subject, body, cc)
            status = "sent"
            error_msg = None
    except Exception as e:
        status = "failed"
        error_msg = str(e)
        
    alert = models.Alert(
        event_id=event_id,
        to_email=to_email,
        subject=subject,
        status=status,
        error=error_msg
    )
    db_session.add(alert)
    db_session.commit()
    db_session.close()

@router.post("/analyze", response_model=schemas.AnalyzeResponse)
async def analyze_audio(
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    lat: float = Form(None),
    lon: float = Form(None),
    accuracy: float = Form(None),
    zone_id: str = Form("Zone_1"),
    db: Session = Depends(get_db),
    officer: models.Officer = Depends(security.get_current_officer)
):
    if not inference_service.model_loaded:
        raise HTTPException(status_code=503, detail={"error": {"code": "model_error", "message": "ML model not loaded"}})
        
    if not audio.content_type.startswith("audio/") and audio.content_type != "video/webm":
        raise HTTPException(status_code=400, detail={"error": {"code": "invalid_file", "message": "Must be audio"}})
        
    audio_bytes = await audio.read()
    if len(audio_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail={"error": {"code": "file_too_large", "message": "Max 10MB"}})
        
    if lat is not None and (lat < -90 or lat > 90):
        raise HTTPException(status_code=422, detail={"error": {"code": "invalid_lat", "message": "Invalid latitude"}})
    if lon is not None and (lon < -180 or lon > 180):
        raise HTTPException(status_code=422, detail={"error": {"code": "invalid_lon", "message": "Invalid longitude"}})

    temp_id = str(uuid.uuid4())
    in_path = f"temp_{temp_id}_in"
    out_path = f"temp_{temp_id}_out.wav"
    
    try:
        with open(in_path, "wb") as f:
            f.write(audio_bytes)
            
        try:
            subprocess.run(
                ["ffmpeg", "-y", "-i", in_path, "-ar", "16000", "-ac", "1", "-t", "30", out_path],
                check=True, timeout=10, stdout=subprocess.PIPE, stderr=subprocess.PIPE
            )
        except FileNotFoundError:
            import shutil
            shutil.copy(in_path, out_path)
            print("WARNING: ffmpeg not found. Assuming input is already a valid audio file.")
        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=400, detail={"error": {"code": "ffmpeg_timeout", "message": "Conversion timeout"}})
        except subprocess.CalledProcessError:
            raise HTTPException(status_code=400, detail={"error": {"code": "ffmpeg_error", "message": "Conversion failed"}})
            
        if lat is not None and lon is not None:
            final_lat, final_lon = lat, lon
            loc_source = "browser"
        elif settings.DEFAULT_LAT is not None and settings.DEFAULT_LON is not None:
            final_lat, final_lon = settings.DEFAULT_LAT, settings.DEFAULT_LON
            loc_source = "default"
        else:
            final_lat, final_lon = None, None
            loc_source = "none"
            
        maps_link = f"https://www.google.com/maps?q={final_lat},{final_lon}" if final_lat is not None else None
        
        clip_id = str(uuid.uuid4())
        clip = models.Clip(
            id=clip_id,
            officer_id=officer.id,
            zone_id=zone_id,
            lat=final_lat,
            lon=final_lon,
            accuracy_m=accuracy,
            location_source=loc_source,
            maps_link=maps_link
        )
        db.add(clip)
        db.commit()
        
        pred = await inference_service.predict_async(out_path, zone_id)
        
        has_alert = False
        detections_res = []
        
        for det in pred.get("detections", []):
            kind = det.get("type")
            if kind == "Threat":
                name = det.get("threat_type")
                conf = det.get("threat_confidence")
                call_type = None
            else:
                name = det.get("species")
                conf = det.get("presence_confidence")
                call_type = det.get("call_type")
                
            is_alert = False
            send_email_now = False
            
            if kind == "Threat" and conf >= settings.ALERT_MIN_CONFIDENCE:
                is_alert = True
                send_email_now = True
            elif kind == "Bird" and call_type == "Distress":
                is_alert = True
                if settings.ALERT_ON_DISTRESS:
                    send_email_now = True

            event = models.Event(
                clip_id=clip_id,
                officer_id=officer.id,
                kind=kind,
                name=name,
                call_type=call_type,
                confidence=conf,
                is_alert=is_alert,
                raw_json=json.dumps(det)
            )
            db.add(event)
            db.commit()
            db.refresh(event)
            
            if is_alert:
                has_alert = True
                
            email_status = "not_applicable"
            if send_email_now:
                cooldown_time = datetime.now(timezone.utc) - timedelta(seconds=settings.ALERT_COOLDOWN_SECONDS)
                recent_alerts = db.query(models.Event).join(models.Clip).filter(
                    models.Event.officer_id == officer.id,
                    models.Event.name == name,
                    models.Clip.zone_id == zone_id,
                    models.Event.created_at >= cooldown_time,
                    models.Event.id != event.id,
                    models.Event.is_alert == True
                ).count()
                
                if recent_alerts > 0:
                    email_status = "skipped"
                    alert = models.Alert(
                        event_id=event.id,
                        to_email=officer.email,
                        subject="Skipped",
                        status="skipped",
                        error="cooldown"
                    )
                    db.add(alert)
                    db.commit()
                else:
                    email_status = "queued"
                    subject = f"THREAT: {name} detected - {officer.forest_division}"
                    loc_text = f"{final_lat}, {final_lon} (Accuracy: {accuracy}m)\n{maps_link}" if final_lat else "Location unavailable"
                    body = (
                        f"Officer: {officer.full_name}, {officer.designation}\n"
                        f"Division: {officer.forest_division}, Range: {officer.forest_range}\n"
                        f"Threat: {name} ({conf*100:.1f}% confidence)\n"
                        f"Zone: {zone_id}\n"
                        f"Location: {loc_text}\n"
                        f"Event ID: {event.id}\n\n"
                        f"Automated detection, please verify on ground."
                    )
                    cc = [c.strip() for c in settings.ALERT_CC.split(",")] if settings.ALERT_CC else []
                    background_tasks.add_task(process_alert_email, officer.email, subject, body, cc, event.id, SessionLocal())
            
            detections_res.append(schemas.DetectionResult(
                event_id=event.id,
                kind=kind,
                name=name,
                call_type=call_type,
                confidence=conf,
                is_alert=is_alert,
                email_status=email_status
            ))
            
        return schemas.AnalyzeResponse(
            clip_id=clip_id,
            ALERT=has_alert,
            status="detected" if detections_res else "no_detection",
            location=schemas.LocationResult(
                lat=final_lat,
                lon=final_lon,
                accuracy_m=accuracy,
                source=loc_source,
                maps_link=maps_link
            ),
            detections=detections_res,
            processed_at=datetime.now(timezone(timedelta(hours=5, minutes=30)))
        )
            
    finally:
        if os.path.exists(in_path):
            os.remove(in_path)
        if os.path.exists(out_path):
            os.remove(out_path)

@router.post("/test-alert")
async def test_alert(
    background_tasks: BackgroundTasks,
    lat: float = Form(None),
    lon: float = Form(None),
    accuracy: float = Form(None),
    zone_id: str = Form("Zone_1"),
    db: Session = Depends(get_db),
    officer: models.Officer = Depends(security.get_current_officer)
):
    clip = models.Clip(
        officer_id=officer.id,
        zone_id=zone_id,
        lat=lat,
        lon=lon,
        accuracy_m=accuracy,
        location_source="browser" if lat else "none",
        maps_link=f"https://www.google.com/maps?q={lat},{lon}" if lat else None
    )
    db.add(clip)
    db.commit()
    
    event = models.Event(
        clip_id=clip.id,
        officer_id=officer.id,
        kind="Threat",
        name="test_alert",
        confidence=1.0,
        is_alert=True,
        raw_json="{}"
    )
    db.add(event)
    db.commit()
    
    subject = f"THREAT: test_alert detected - {officer.forest_division}"
    loc_text = f"{lat}, {lon} (Accuracy: {accuracy}m)\n{clip.maps_link}" if lat else "Location unavailable"
    body = (
        f"Officer: {officer.full_name}, {officer.designation}\n"
        f"Division: {officer.forest_division}, Range: {officer.forest_range}\n"
        f"Threat: test_alert (100.0% confidence)\n"
        f"Zone: {zone_id}\n"
        f"Location: {loc_text}\n"
        f"Event ID: {event.id}\n\n"
        f"Automated detection, please verify on ground."
    )
    cc = [c.strip() for c in settings.ALERT_CC.split(",")] if settings.ALERT_CC else []
    background_tasks.add_task(process_alert_email, officer.email, subject, body, cc, event.id, SessionLocal())
    
    return {"message": "Test alert queued"}
