import os
import uuid
import shutil
import logging
import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.config import settings
from app.models import Document, DocumentChunk, Profile, AuditLog, HumanVerdict
from app.schemas import (
    DocumentResponse,
    DocumentFileDataResponse,
    HumanVerdictCreate,
    HumanVerdictResponse,
    DocumentChunkResponse,
    ExtractionResultResponse,
)
from app.auth import get_current_user, require_role
from app.services.extraction import extract_text_from_document

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Documentos"])

ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_PRIORITIES = {"baja", "media", "alta"}


def _safe_filename(filename: str) -> str:
    return "".join([c if c.isalnum() or c in (".", "_", "-") else "_" for c in filename])


def _document_media_type(filename: str) -> str:
    extension = os.path.splitext(filename.lower())[1]
    if extension == ".pdf":
        return "application/pdf"
    if extension == ".docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return "application/octet-stream"


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    priority: str = Form("media"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    extension = os.path.splitext(file.filename.lower())[1]
    if extension not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se admiten documentos en formato PDF o DOCX."
        )

    normalized_priority = priority.lower().strip()
    if normalized_priority not in ALLOWED_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La prioridad debe ser baja, media o alta."
        )

    # Crear identificador único y nombres de archivo
    doc_id = uuid.uuid4()
    safe_filename = _safe_filename(file.filename)
    unique_filename = f"{doc_id}_{safe_filename}"
    file_path = os.path.join(settings.STORAGE_DIR, unique_filename)

    try:
        # Guardar archivo físicamente en disco local
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_size = os.path.getsize(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al escribir el archivo físicamente en el disco local: {str(e)}"
        )

    # Registrar metadatos en la base de datos
    new_doc = Document(
        id=doc_id,
        filename=file.filename,
        file_path=file_path,
        size_bytes=file_size,
        status="uploaded",
        priority=normalized_priority,
        user_id=current_user.id
    )
    
    db.add(new_doc)
    
    # Registrar log de auditoría
    audit_detail = {
        "filename": file.filename,
        "size_bytes": file_size,
        "uploader_email": current_user.email,
        "priority": normalized_priority,
    }
    audit = AuditLog(
        action="document_uploaded",
        user_id=current_user.id,
        details=audit_detail
    )
    db.add(audit)
    
    db.commit()
    db.refresh(new_doc)
    
    return new_doc


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    # Listar todos los documentos ordenados por fecha de creación desc
    documents = db.query(Document).order_by(Document.created_at.desc()).all()
    return documents


@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado."
        )
    return doc


@router.get("/{doc_id}/file")
def get_document_file(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado."
        )
        
    if not os.path.exists(doc.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El archivo físico del documento no se encuentra en el almacenamiento local."
        )
    
    # Registrar auditoría de descarga de archivo para visualización
    audit = AuditLog(
        action="document_downloaded",
        user_id=current_user.id,
        details={"filename": doc.filename, "document_id": str(doc.id)}
    )
    db.add(audit)
    db.commit()

    return FileResponse(
        path=doc.file_path,
        media_type=_document_media_type(doc.filename),
        filename=doc.filename
    )


@router.get("/{doc_id}/file-data", response_model=DocumentFileDataResponse)
def get_document_file_data(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado."
        )

    if not os.path.exists(doc.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El archivo físico del documento no se encuentra en el almacenamiento local."
        )

    with open(doc.file_path, "rb") as file:
        data_base64 = base64.b64encode(file.read()).decode("ascii")

    audit = AuditLog(
        action="document_downloaded",
        user_id=current_user.id,
        details={"filename": doc.filename, "document_id": str(doc.id), "delivery": "base64_viewer"}
    )
    db.add(audit)
    db.commit()

    return DocumentFileDataResponse(
        filename=doc.filename,
        media_type=_document_media_type(doc.filename),
        size_bytes=doc.size_bytes,
        data_base64=data_base64
    )


@router.post("/{doc_id}/verdict", response_model=HumanVerdictResponse)
def save_document_verdict(
    doc_id: uuid.UUID,
    verdict_data: HumanVerdictCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado."
        )
    
    # Validar si ya existe un veredicto
    verdict = db.query(HumanVerdict).filter(HumanVerdict.document_id == doc_id).first()
    if verdict:
        # Actualizar veredicto existente
        verdict.status = verdict_data.status
        verdict.comments = verdict_data.comments
        verdict.reviewer_id = current_user.id
    else:
        # Crear nuevo veredicto
        verdict = HumanVerdict(
            document_id=doc_id,
            reviewer_id=current_user.id,
            status=verdict_data.status,
            comments=verdict_data.comments
        )
        db.add(verdict)
    
    # Cambiar estado del documento a human_review_done
    doc.status = "human_review_done"
    
    # Registrar auditoría
    audit = AuditLog(
        action="human_verdict_saved",
        user_id=current_user.id,
        details={
            "document_id": str(doc.id),
            "filename": doc.filename,
            "status": verdict_data.status
        }
    )
    db.add(audit)
    
    db.commit()
    db.refresh(verdict)
    
    return verdict


@router.get("/{doc_id}/verdict", response_model=HumanVerdictResponse)
def get_document_verdict(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    verdict = db.query(HumanVerdict).filter(HumanVerdict.document_id == doc_id).first()
    if not verdict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictamen no encontrado para este documento."
        )
    return verdict


@router.post("/{doc_id}/extract-text", response_model=ExtractionResultResponse)
def extract_document_text(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """Extrae texto de un documento PDF/DOCX usando Docling y lo fragmenta en chunks."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado."
        )

    # Solo permitir extracción si el documento está en un estado válido
    allowed_states = ["uploaded", "error", "ocr_required"]
    if doc.status not in allowed_states:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El documento está en estado '{doc.status}'. Solo se puede extraer texto de documentos en estado: {', '.join(allowed_states)}."
        )

    # Verificar que el archivo físico exista
    if not os.path.exists(doc.file_path):
        doc.status = "error"
        doc.error_message = "El archivo físico no se encuentra en el almacenamiento local."
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El archivo físico del documento no existe en disco."
        )

    # Transición de estado: extracting_text
    doc.status = "extracting_text"
    doc.error_message = None
    db.commit()

    logger.info(f"Iniciando extracción de texto para documento {doc_id} ({doc.filename})")

    try:
        # Ejecutar extracción con Docling
        result = extract_text_from_document(doc.file_path)

        if result.error:
            doc.status = "error"
            doc.error_message = result.error
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=result.error
            )

        # Borrar chunks previos si existían (re-extracción)
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).delete()

        # Insertar nuevos chunks
        for chunk_data in result.chunks:
            db_chunk = DocumentChunk(
                document_id=doc_id,
                chunk_index=chunk_data.chunk_index,
                text=chunk_data.text,
                section_heading=chunk_data.section_heading,
                headings=chunk_data.headings,
                page_start=chunk_data.page_start,
                page_end=chunk_data.page_end,
                word_count=chunk_data.word_count,
                chunk_metadata=chunk_data.metadata
            )
            db.add(db_chunk)

        # Determinar estado final
        if result.ocr_required:
            doc.status = "ocr_required"
            doc.error_message = (
                f"El documento contiene solo {result.total_words} palabras. "
                "Probablemente es un PDF escaneado que requiere OCR."
            )
            message = "Documento marcado para procesamiento OCR en background."
            
            # Encolar tarea de OCR
            from app.queue_service import get_queue
            from app.services.ocr_service import process_document_ocr
            q = get_queue()
            q.enqueue(process_document_ocr, doc.id)
            
        else:
            doc.status = "ready_for_review"
            doc.error_message = None
            message = f"Extracción completada: {len(result.chunks)} fragmentos, {result.total_words} palabras."

        # Registrar auditoría
        audit = AuditLog(
            action="text_extracted",
            user_id=current_user.id,
            details={
                "document_id": str(doc.id),
                "filename": doc.filename,
                "total_chunks": len(result.chunks),
                "total_words": result.total_words,
                "ocr_required": result.ocr_required
            }
        )
        db.add(audit)
        db.commit()

        logger.info(f"Extracción exitosa para {doc.filename}: {len(result.chunks)} chunks")

        return ExtractionResultResponse(
            document_id=doc_id,
            status=doc.status,
            total_chunks=len(result.chunks),
            total_words=result.total_words,
            ocr_required=result.ocr_required,
            markdown_preview=result.markdown_full[:1000] if result.markdown_full else None,
            message=message
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado durante extracción de {doc.filename}: {e}", exc_info=True)
        doc.status = "error"
        doc.error_message = f"Error inesperado: {str(e)}"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado durante la extracción: {str(e)}"
        )


@router.get("/{doc_id}/chunks", response_model=List[DocumentChunkResponse])
def get_document_chunks(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """Retorna los chunks de texto extraídos de un documento, ordenados por índice."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado."
        )

    chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == doc_id)
        .order_by(DocumentChunk.chunk_index)
        .all()
    )

    return chunks
