from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import require_role
from app.models import Profile, AuditLog

router = APIRouter(prefix="/audit-logs", tags=["Auditoría"])

@router.get("")
def get_audit_logs(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("admin"))
):
    """
    Retorna los registros de auditoría (solo para administradores).
    """
    logs = (
        db.query(AuditLog, Profile.full_name, Profile.email)
        .outerjoin(Profile, AuditLog.user_id == Profile.id)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    result = []
    for log, name, email in logs:
        result.append({
            "id": str(log.id),
            "action": log.action,
            "details": log.details,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "user": {
                "name": name or "Sistema",
                "email": email or "N/A"
            }
        })
        
    total = db.query(AuditLog).count()
        
    return {
        "data": result,
        "total": total,
        "limit": limit,
        "offset": offset
    }
