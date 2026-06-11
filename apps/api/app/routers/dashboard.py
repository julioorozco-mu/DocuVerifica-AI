from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.database import get_db
from app.auth import get_current_user, require_role
from app.models import Profile, Document, HumanVerdict, AuditLog, AIReviewResult
from app.schemas import DashboardMetricsResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Retorna métricas generales para el dashboard (Bento Grid).
    """
    # Base queries depending on role
    query_docs = db.query(Document)
    query_verdicts = db.query(HumanVerdict)
    
    if current_user.role != "admin":
        query_docs = query_docs.filter(Document.user_id == current_user.id)
        query_verdicts = query_verdicts.join(Document, HumanVerdict.document_id == Document.id).filter(Document.user_id == current_user.id)

    # Total de documentos subidos
    total_docs = query_docs.count()
    
    # Documentos pendientes de revisión humana
    pending_docs = query_docs.filter(Document.status != "human_review_done", Document.status != "error").count()
    
    # Documentos con error
    error_docs = query_docs.filter(Document.status == "error").count()

    # Veredictos
    approved_docs = query_verdicts.filter(HumanVerdict.status == "cumple").count()
    rejected_docs = query_verdicts.filter(HumanVerdict.status == "no_cumple").count()
    revision_docs = query_verdicts.filter(HumanVerdict.status == "requiere_revision").count()

    # Actividad reciente (últimos 5 documentos)
    recent_docs = (
        query_docs
        .order_by(Document.updated_at.desc())
        .limit(6)
        .all()
    )
    
    recent_activity = []
    for doc in recent_docs:
        # Mock document_type for UI logic
        doc_type = "Otros"
        if "contrato" in doc.filename.lower(): doc_type = "Contratos"
        elif "solicitud" in doc.filename.lower(): doc_type = "Solicitudes"
        elif "estudio" in doc.filename.lower() or "acta" in doc.filename.lower(): doc_type = "Estudios"
            
        reviewer_name = current_user.full_name if current_user.role != "admin" else None
        human_status = None
        if doc.verdict:
            human_status = doc.verdict.status
            if doc.verdict.reviewer:
                reviewer_name = doc.verdict.reviewer.full_name
                
        # Get worst AI status if exists
        ai_status = None
        if doc.ai_results:
            statuses = [r.status for r in doc.ai_results]
            if "no_cumple" in statuses: ai_status = "no_cumple"
            elif "requiere_revision" in statuses: ai_status = "requiere_revision"
            elif "no_encontrado" in statuses: ai_status = "no_encontrado"
            else: ai_status = "cumple"
            
        if doc.status in ["uploaded", "extracting_text", "ocr_required", "ocr_processing", "processing"]:
            ai_status = "En cola IA"

        recent_activity.append({
            "id": str(doc.id),
            "filename": doc.filename,
            "status": doc.status,
            "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
            "reviewer": reviewer_name,
            "ai_status": ai_status,
            "human_status": human_status,
            "document_type": doc_type
        })

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

    # Datos simulados para Timeline (7 días)
    timeline = []
    today = datetime.now()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        # Random mock data that trends upwards or is relatively stable
        import random
        base_pend = random.randint(10, 30)
        base_cola = random.randint(2, 10)
        base_rev = random.randint(5, 20)
        
        timeline.append({
            "date": day.strftime("%d/%m"),
            "pendientes": base_pend,
            "en_cola_ia": base_cola,
            "revisados": base_rev
        })
        
    # Datos para donut de Categorías (segun requerimiento del usuario)
    categories = [
        {"name": "Tecnología", "value": max(10, total_docs // 3), "color": "#3b82f6"},
        {"name": "Inteligencia Artificial", "value": max(5, total_docs // 4), "color": "#8b5cf6"},
        {"name": "Ciberseguridad", "value": max(8, total_docs // 5), "color": "#10b981"},
        {"name": "Legal y Cumplimiento", "value": max(12, total_docs - (total_docs // 3 + total_docs // 4 + total_docs // 5)), "color": "#f59e0b"}
    ]

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
        "timeline": timeline,
        "categories": categories
    }
