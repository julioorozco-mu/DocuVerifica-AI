from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.auth import get_current_user, require_role
from app.models import Profile, Document, HumanVerdict, AuditLog, AIReviewResult
from app.schemas import DashboardMetricsResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

DOCUMENT_TYPE_COLORS = ["#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#94a3b8"]
QUEUE_STATUSES = {"uploaded", "extracting_text", "ocr_required", "ocr_processing", "processing", "ai_reviewing"}


def infer_document_type(filename: str) -> str:
    lower = filename.lower()
    if "contrato" in lower:
        return "Contratos"
    if "constancia" in lower or "estudio" in lower or "acta" in lower:
        return "Estudios"
    if "solicitud" in lower:
        return "Solicitudes"
    if "dictamen" in lower:
        return "Dictámenes"
    if "comprobante" in lower:
        return "Comprobantes"
    return "Otros"


def initials_for_name(name: str | None) -> str | None:
    if not name:
        return None
    return "".join(part[0] for part in name.split() if part).upper()[:2]


def folio_for_document(doc: Document) -> str:
    year = doc.created_at.year if doc.created_at else datetime.now(timezone.utc).year
    return f"DOC-{year}-{str(doc.id)[:8].upper()}"


def get_ai_status_for_document(doc: Document) -> str | None:
    if doc.status in QUEUE_STATUSES:
        return "en_cola_ia"

    if not doc.ai_results:
        return None

    statuses = [result.status for result in doc.ai_results]
    if "no_cumple" in statuses:
        return "no_cumple"
    if "requiere_revision" in statuses:
        return "requiere_revision"
    if "no_encontrado" in statuses:
        return "no_encontrado"
    return "cumple"

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

    scoped_docs = query_docs.all()

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

    # Actividad reciente (últimos documentos)
    recent_docs = (
        query_docs
        .order_by(Document.updated_at.desc())
        .limit(6)
        .all()
    )
    
    recent_activity = []
    for doc in recent_docs:
        doc_type = infer_document_type(doc.filename)

        reviewer_name = doc.uploader.full_name if doc.uploader else None
        human_status = None
        if doc.verdict:
            human_status = doc.verdict.status
            if doc.verdict.reviewer:
                reviewer_name = doc.verdict.reviewer.full_name

        ai_status = get_ai_status_for_document(doc)

        recent_activity.append({
            "id": str(doc.id),
            "folio": folio_for_document(doc),
            "filename": doc.filename,
            "status": doc.status,
            "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "reviewer": reviewer_name,
            "reviewer_initials": initials_for_name(reviewer_name),
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

    # Timeline real de los últimos 7 días.
    timeline = []
    today = datetime.now(timezone.utc).date()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        docs_for_day = [doc for doc in scoped_docs if doc.updated_at and doc.updated_at.date() == day]

        timeline.append({
            "date": day.strftime("%d/%m"),
            "pendientes": sum(1 for doc in docs_for_day if doc.status != "human_review_done" and doc.status != "error"),
            "en_cola_ia": sum(1 for doc in docs_for_day if doc.status in QUEUE_STATUSES),
            "revisados": sum(1 for doc in docs_for_day if doc.status == "human_review_done"),
        })

    # Categorías reales inferidas del nombre del archivo.
    category_counts: Dict[str, int] = {}
    for doc in scoped_docs:
        doc_type = infer_document_type(doc.filename)
        category_counts[doc_type] = category_counts.get(doc_type, 0) + 1

    categories = [
        {"name": name, "value": value, "color": DOCUMENT_TYPE_COLORS[index % len(DOCUMENT_TYPE_COLORS)]}
        for index, (name, value) in enumerate(category_counts.items())
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
