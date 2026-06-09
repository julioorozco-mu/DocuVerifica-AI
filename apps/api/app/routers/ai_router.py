from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
import redis
from rq import Queue

from app.database import get_db
from app.models import Document, AIReviewResult
from app.schemas import AIReviewResultResponse, AIReviewRequest
from app.services.ai_review import process_document_ai_review
from app.config import settings

router = APIRouter(prefix="/documents", tags=["AI Review"])

redis_conn = redis.from_url(settings.REDIS_URL)
ai_queue = Queue('ai_review_queue', connection=redis_conn)

@router.post("/{document_id}/review-ai")
def trigger_ai_review(document_id: UUID, request: AIReviewRequest, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document.status in ["ai_reviewing", "processing"]:
        raise HTTPException(status_code=400, detail="Document is already being processed or reviewed")

    # Cambiar estado inicial
    document.status = "ai_reviewing"
    db.commit()

    # Encolar en RQ (Redis)
    job = ai_queue.enqueue(process_document_ai_review, document_id, request.model_name)

    return {"message": "AI review job queued", "job_id": job.id, "status": document.status}

@router.get("/{document_id}/ai-review-results", response_model=List[AIReviewResultResponse])
def get_ai_review_results(document_id: UUID, db: Session = Depends(get_db)):
    # Optional: verify document exists
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    results = db.query(AIReviewResult).filter(AIReviewResult.document_id == document_id).all()
    return results
