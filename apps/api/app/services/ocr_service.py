import logging
import subprocess
import os
from uuid import UUID
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Document
from app.services.extraction import extract_text_from_document

logger = logging.getLogger(__name__)

def process_document_ocr(document_id: UUID):
    db: Session = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            logger.error(f"Document {document_id} not found for OCR.")
            return

        if document.status != "ocr_required":
            logger.info(f"Document {document_id} is not in ocr_required status. Current: {document.status}")
            return

        document.status = "ocr_processing"
        db.commit()

        # Rutas de archivo
        input_pdf = document.file_path
        output_pdf = input_pdf.replace(".pdf", "_ocr.pdf")

        # Ejecutar ocrmypdf
        logger.info(f"Starting OCR for document {document_id}: {input_pdf}")
        
        # ocrmypdf options:
        # --force-ocr: rasterize all vector content and apply OCR
        # -l spa: spanish language
        # --optimize 1: safe optimization
        
        # En Windows puede que requiera Tesseract instalado y en PATH
        # Como estamos en local, asumimos que Tesseract está disponible o fallará
        
        command = [
            "ocrmypdf",
            "--force-ocr",
            "-l", "spa",
            "--optimize", "1",
            input_pdf,
            output_pdf
        ]
        
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        if result.returncode != 0:
            logger.error(f"OCR failed for document {document_id}: {result.stderr}")
            document.status = "error"
            document.error_message = f"Error en OCR: {result.stderr}"
            db.commit()
            return

        logger.info(f"OCR completed for document {document_id}. Output saved to {output_pdf}")

        # Opcional: Reemplazar el archivo original con el archivo OCR
        try:
            os.replace(output_pdf, input_pdf)
        except OSError as e:
            logger.error(f"Could not replace original file with OCR version: {e}")
            # Continuamos aunque no se haya reemplazado, pero idealmente usamos el OCR.
            # En este caso usaremos el OCR_pdf para extraer
            input_pdf = output_pdf

        # Volver a extraer el texto ahora que tiene OCR
        extraction_result = extract_text_from_document(input_pdf)
        
        if not extraction_result.chunks:
            # Si a pesar del OCR no hay texto, lo marcamos como listo pero con error advertencia?
            logger.warning(f"No text extracted from document {document_id} even after OCR.")
            document.status = "ready_for_review"
            db.commit()
            return
            
        # Guardar chunks en BD
        from app.models import DocumentChunk
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
        for chunk_data in extraction_result.chunks:
            db_chunk = DocumentChunk(
                document_id=document_id,
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
        
        # Marcar como listo para revisión
        document.status = "ready_for_review"
        
        from app.models import AuditLog
        audit = AuditLog(
            action="ocr_processed",
            user_id=None,
            details={
                "document_id": str(document.id),
                "filename": document.filename
            }
        )
        db.add(audit)
        
        db.commit()

        logger.info(f"Document {document_id} processed successfully via OCR.")

    except Exception as e:
        logger.error(f"Error processing OCR for document {document_id}: {e}")
        db.rollback()
        
        try:
            doc_err = db.query(Document).filter(Document.id == document_id).first()
            if doc_err:
                doc_err.status = "error"
                doc_err.error_message = f"Excepción en OCR: {str(e)}"
                db.commit()
        except:
            pass
    finally:
        db.close()
