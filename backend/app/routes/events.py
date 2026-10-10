from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app import models, schemas, security, inference_service
from app.db import get_db
import shutil

router = APIRouter(prefix="/api", tags=["events"])

@router.get("/me", response_model=schemas.OfficerProfile)
def get_me(officer: models.Officer = Depends(security.get_current_officer)):
    return officer

@router.get("/events")
def get_events(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    kind: str = None,
    only_alerts: bool = False,
    db: Session = Depends(get_db),
    officer: models.Officer = Depends(security.get_current_officer)
):
    q = db.query(models.Event, models.Clip).join(models.Clip).filter(models.Event.officer_id == officer.id)
    if kind:
        q = q.filter(models.Event.kind == kind)
    if only_alerts:
        q = q.filter(models.Event.is_alert == True)
        
    total = q.count()
    results = q.order_by(desc(models.Event.created_at)).offset(offset).limit(limit).all()
    
    events = []
    for event, clip in results:
        alert = db.query(models.Alert).filter(models.Alert.event_id == event.id).first()
        events.append({
            "id": event.id,
            "clip_id": event.clip_id,
            "kind": event.kind,
            "name": event.name,
            "call_type": event.call_type,
            "confidence": event.confidence,
            "is_alert": event.is_alert,
            "created_at": event.created_at,
            "location": {
                "lat": clip.lat,
                "lon": clip.lon,
                "accuracy_m": clip.accuracy_m,
                "source": clip.location_source,
                "maps_link": clip.maps_link
            },
            "alert_status": alert.status if alert else None
        })
        
    return {"total": total, "events": events}

@router.get("/events/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db), officer: models.Officer = Depends(security.get_current_officer)):
    result = db.query(models.Event, models.Clip).join(models.Clip).filter(models.Event.id == event_id, models.Event.officer_id == officer.id).first()
    if not result:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Event not found"}})
    event, clip = result
    alert = db.query(models.Alert).filter(models.Alert.event_id == event.id).first()
    return {
        "id": event.id,
        "clip_id": event.clip_id,
        "kind": event.kind,
        "name": event.name,
        "call_type": event.call_type,
        "confidence": event.confidence,
        "is_alert": event.is_alert,
        "created_at": event.created_at,
        "raw_json": event.raw_json,
        "location": {
            "lat": clip.lat,
            "lon": clip.lon,
            "accuracy_m": clip.accuracy_m,
            "source": clip.location_source,
            "maps_link": clip.maps_link
        },
        "alert_status": alert.status if alert else None,
        "alert_error": alert.error if alert else None
    }

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), officer: models.Officer = Depends(security.get_current_officer)):
    total_events = db.query(models.Event).filter(models.Event.officer_id == officer.id).count()
    
    from datetime import datetime, timezone, timedelta
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    alerts_today = db.query(models.Event).filter(
        models.Event.officer_id == officer.id,
        models.Event.is_alert == True,
        models.Event.created_at >= today_start
    ).count()
    
    by_kind = {}
    for row in db.query(models.Event.kind, db.func.count(models.Event.id)).filter(models.Event.officer_id == officer.id).group_by(models.Event.kind).all():
        by_kind[row[0]] = row[1]
        
    by_name = {}
    for row in db.query(models.Event.name, db.func.count(models.Event.id)).filter(models.Event.officer_id == officer.id).group_by(models.Event.name).all():
        by_name[row[0]] = row[1]
        
    last_event = db.query(models.Event).filter(models.Event.officer_id == officer.id).order_by(desc(models.Event.created_at)).first()
    
    return {
        "total_events": total_events,
        "alerts_today": alerts_today,
        "by_kind": by_kind,
        "by_name": by_name,
        "last_event_at": last_event.created_at if last_event else None,
        "report": inference_service.get_report()
    }

@router.get("/health")
def health():
    ffmpeg_ok = shutil.which("ffmpeg") is not None
    return {
        "model_loaded": inference_service.model_loaded,
        "model_error": inference_service.model_error,
        "ffmpeg_ok": ffmpeg_ok,
        "smtp_configured": bool(settings.SMTP_HOST),
        "dev_mode": settings.DEV_MODE
    }
