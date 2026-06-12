from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.models import Document, AIReviewResult, DocumentProcessingRequest, ReviewCriterion
from app.schemas import AIReviewResultResponse, AIReviewRequest
from app.services.ai_review import process_document_ai_review
from app.queue_service import get_queue

router = APIRouter(prefix="/documents", tags=["AI Review"])

ai_queue = get_queue("ai_review_queue")

from app.auth import get_current_user
from app.models import Profile, AuditLog


def validate_individual_criteria(db: Session, current_user: Profile, criterion_ids: list[UUID]) -> list[str]:
    if not criterion_ids:
        return []

    criteria = db.query(ReviewCriterion).filter(
        ReviewCriterion.id.in_(criterion_ids),
        ReviewCriterion.is_active == True,
        ReviewCriterion.reviewer_id == current_user.id,
    ).all()
    found_ids = {criterion.id for criterion in criteria}
    missing_ids = [str(criterion_id) for criterion_id in criterion_ids if criterion_id not in found_ids]
    if missing_ids:
        raise HTTPException(status_code=403, detail="Uno o más criterios seleccionados no pertenecen al usuario actual.")
    return [str(criterion.id) for criterion in criteria]


@router.post("/{document_id}/review-ai")
def trigger_ai_review(
    document_id: UUID, 
    request: AIReviewRequest, 
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document.status in ["ai_reviewing", "processing"]:
        raise HTTPException(status_code=400, detail="Document is already being processed or reviewed")

    selected_criterion_ids = validate_individual_criteria(db, current_user, request.criterion_ids)

    processing_request = db.query(DocumentProcessingRequest).filter(
        DocumentProcessingRequest.document_id == document_id
    ).first()
    if not processing_request:
        processing_request = DocumentProcessingRequest(document_id=document_id, created_by=current_user.id)
        db.add(processing_request)

    processing_request.requested_ai = True
    processing_request.model_name = request.model_name
    processing_request.selected_criterion_ids = selected_criterion_ids

    if document.status in ["uploaded", "extracting_text"]:
        db.commit()
        raise HTTPException(status_code=409, detail="Primero se requiere extracción de texto.")

    if document.status in ["ocr_required", "ocr_processing"]:
        db.commit()
        return {"message": "AI review pending OCR", "job_id": None, "status": document.status}

    # Cambiar estado inicial
    document.status = "ai_reviewing"
    
    # Registrar auditoría
    audit = AuditLog(
        action="ai_review_started",
        user_id=current_user.id,
        details={
            "document_id": str(document.id),
            "filename": document.filename,
            "model_name": request.model_name,
            "criterion_ids": selected_criterion_ids,
        }
    )
    db.add(audit)
    db.commit()

    # Encolar en RQ (Redis)
    job = ai_queue.enqueue(process_document_ai_review, document_id, request.model_name, selected_criterion_ids)

    return {"message": "AI review job queued", "job_id": job.id, "status": document.status}

@router.get("/{document_id}/ai-review-results", response_model=List[AIReviewResultResponse])
def get_ai_review_results(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    # Optional: verify document exists
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    results = db.query(AIReviewResult).filter(AIReviewResult.document_id == document_id).all()
    return results
