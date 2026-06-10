from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from app.database import get_db
from app.auth import get_current_user, require_role
from app.models import Profile, Document, HumanVerdict, AuditLog

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Retorna métricas generales para el dashboard (Bento Grid).
    """
    # Total de documentos subidos
    total_docs = db.query(Document).count()
    
    # Documentos pendientes de revisión humana
    # Estados como: uploaded, extracting_text, ocr_required, ocr_processing, processing, ready_for_review, ai_reviewing, ai_review_done
    pending_docs = db.query(Document).filter(Document.status != "human_review_done", Document.status != "error").count()
    
    # Documentos con error
    error_docs = db.query(Document).filter(Document.status == "error").count()

    # Veredictos
    approved_docs = db.query(HumanVerdict).filter(HumanVerdict.status == "cumple").count()
    rejected_docs = db.query(HumanVerdict).filter(HumanVerdict.status == "no_cumple").count()
    revision_docs = db.query(HumanVerdict).filter(HumanVerdict.status == "requiere_revision").count()

    # Actividad reciente (últimos 5 documentos)
    recent_docs = (
        db.query(Document)
        .order_by(Document.updated_at.desc())
        .limit(5)
        .all()
    )
    
    recent_activity = [
        {
            "id": str(doc.id),
            "filename": doc.filename,
            "status": doc.status,
            "updated_at": doc.updated_at.isoformat() if doc.updated_at else None
        }
        for doc in recent_docs
    ]

    # Productividad por revisor (solo admin)
    reviewer_stats = []
    if current_user.role == "admin":
        stats_query = (
            db.query(
                Profile.full_name,
                func.count(HumanVerdict.id).label("total_reviews")
            )
            .join(HumanVerdict, Profile.id == HumanVerdict.reviewer_id)
            .group_by(Profile.full_name)
            .all()
        )
        reviewer_stats = [{"name": name, "reviews": count} for name, count in stats_query]

    return {
        "metrics": {
            "total_documents": total_docs,
            "pending_documents": pending_docs,
            "error_documents": error_docs,
            "approved_documents": approved_docs,
            "rejected_documents": rejected_docs,
            "revision_required_documents": revision_docs,
        },
        "recent_activity": recent_activity,
        "reviewer_stats": reviewer_stats,
    }


