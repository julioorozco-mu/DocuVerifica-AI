import asyncio
from uuid import UUID
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Document, DocumentChunk, ReviewCriterion, AIReviewResult
from app.services.ollama_client import generate_structured_output, OllamaError
from app.schemas import AIReviewOutput
import logging

logger = logging.getLogger(__name__)

def get_document_context(db: Session, document_id: UUID) -> str:
    """Extrae todo el texto de los chunks del documento."""
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index).all()
    context = []
    for chunk in chunks:
        context.append(f"--- Fragmento {chunk.chunk_index} ---")
        context.append(chunk.text)
    return "\n".join(context)

import re

def build_criterion_prompt(criterion_name: str, criterion_description: str, document_context: str) -> str:
    """Construye el prompt de evaluación de un criterio. Reutilizable por revisión y simulación."""
    return f"""
Por favor evalúa el siguiente documento bajo el siguiente criterio:

CRITERIO:
Nombre: {criterion_name}
Descripción/Regla: {criterion_description}

DOCUMENTO:
{document_context}

Instrucciones:
1. Revisa el documento cuidadosamente.
2. Evalúa el cumplimiento de manera flexible y semántica. Si el criterio pide una sección específica, busca frases equivalentes que sirvan al mismo propósito (por ejemplo, "En conclusión" indica la presencia de una conclusión).
3. Determina si el documento cumple (cumple), no cumple (no_cumple), requiere revisión humana por duda o inconsistencia (requiere_revision), o si no se encontró (no_encontrado).
4. Extrae la evidencia exacta del texto para respaldar tu decisión.
5. Identifica la página (usa el número de página o de fragmento).
6. Asigna un nivel de confianza (0.0 a 1.0) que refleje la certeza de tu evaluación.
"""

def evaluate_regex_rule(pattern: str, text: str) -> AIReviewOutput:
    """Evalúa un patrón regex directamente sobre el texto."""
    if not pattern:
        return AIReviewOutput(
            status="error",
            confidence=0.0,
            evidence="Patrón Regex no definido",
            page_number=None,
            explanation="El criterio requiere una evaluación por regla pero no tiene patrón definido.",
            human_action_required=True
        )
    
    try:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            return AIReviewOutput(
                status="cumple",
                confidence=1.0,
                evidence=match.group(0),
                page_number=1, # Se podría buscar la página exacta iterando los chunks
                explanation=f"Se encontró una coincidencia exacta con la regla: {pattern}",
                human_action_required=False
            )
        else:
            return AIReviewOutput(
                status="no_cumple",
                confidence=1.0,
                evidence="",
                page_number=None,
                explanation=f"No se encontró coincidencia en el documento para el patrón: {pattern}",
                human_action_required=False
            )
    except re.error as e:
        return AIReviewOutput(
            status="requiere_revision",
            confidence=0.0,
            evidence="",
            page_number=None,
            explanation=f"Error en la expresión regular: {str(e)}",
            human_action_required=True
        )

async def review_single_criterion(criterion: ReviewCriterion, document_context: str, model_name: str = None) -> AIReviewOutput:
    # Si es solo regla
    if criterion.rule_type == "rule":
        return evaluate_regex_rule(criterion.rule_pattern, document_context)
    
    # Si es regla seguida de IA
    if criterion.rule_type == "rule_then_ai":
        rule_result = evaluate_regex_rule(criterion.rule_pattern, document_context)
        if rule_result.status == "no_cumple":
            return rule_result # Si la regla estricta no se cumple, rechazar inmediatamente
        # Si se cumple la regla estricta, la IA revisa la semántica
    
    # Si es IA pura o pasó la regla de rule_then_ai
    prompt = build_criterion_prompt(criterion.name, criterion.description, document_context)
    return await generate_structured_output(prompt, AIReviewOutput, model_name)

async def simulate_criterion(criterion_name: str, criterion_description: str, rule_type: str, rule_pattern: str, text_fragment: str, model_name: str = None) -> AIReviewOutput:
    """Simula la evaluación de un criterio contra un fragmento de texto sin persistir en BD."""
    if rule_type == "rule":
        return evaluate_regex_rule(rule_pattern, text_fragment)
        
    if rule_type == "rule_then_ai":
        rule_result = evaluate_regex_rule(rule_pattern, text_fragment)
        if rule_result.status == "no_cumple":
            return rule_result

    prompt = build_criterion_prompt(criterion_name, criterion_description, text_fragment)
    return await generate_structured_output(prompt, AIReviewOutput, model_name)

async def async_process_document_ai_review(document_id: UUID, model_name: str = None):
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            logger.error(f"Document {document_id} not found.")
            return

        if document.status == "error":
            logger.warning(f"Document {document_id} is in error status, skipping AI review.")
            return

        document.status = "ai_reviewing"
        db.commit()

        # Eliminar resultados anteriores para evitar duplicados
        db.query(AIReviewResult).filter(AIReviewResult.document_id == document_id).delete()
        db.commit()

        criteria = db.query(ReviewCriterion).filter(
            ReviewCriterion.is_active == True, 
            ReviewCriterion.rule_type.in_(["ai", "rule_then_ai"])
        ).all()
        
        if not criteria:
            logger.info(f"No AI criteria found for document {document_id}.")
            document.status = "ai_review_done"
            db.commit()
            return

        document_context = get_document_context(db, document_id)

        for criterion in criteria:
            try:
                result_output = await review_single_criterion(criterion, document_context, model_name)
                
                ai_result = AIReviewResult(
                    document_id=document_id,
                    criterion_id=criterion.id,
                    status=result_output.status,
                    confidence=result_output.confidence,
                    evidence=result_output.evidence,
                    page_number=result_output.page_number,
                    explanation=result_output.explanation,
                    human_action_required=result_output.human_action_required
                )
                db.add(ai_result)
                db.commit()
            except OllamaError as e:
                logger.error(f"Ollama error on criterion {criterion.id} for doc {document_id}: {e}")
                raise e

        document.status = "ai_review_done"
        
        from app.models import AuditLog
        audit = AuditLog(
            action="ai_review_completed",
            user_id=None,
            details={
                "document_id": str(document.id),
                "filename": document.filename
            }
        )
        db.add(audit)
        
        db.commit()

    except Exception as e:
        logger.error(f"Error in AI review for {document_id}: {e}")
        db.rollback()
        
        # Actualizar estado a error de forma segura en un nuevo bloque try
        try:
            document_error = db.query(Document).filter(Document.id == document_id).first()
            if document_error:
                document_error.status = "error"
                document_error.error_message = str(e)
                db.commit()
        except Exception as rollback_err:
            logger.error(f"Could not update document {document_id} status to error: {rollback_err}")
            
    finally:
        db.close()

def process_document_ai_review(document_id: UUID, model_name: str = None):
    """Punto de entrada síncrono para el worker de RQ."""
    asyncio.run(async_process_document_ai_review(document_id, model_name))
