from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_user
from app.models import Profile, ReviewCriterion, AuditLog
from app.schemas import (
    ReviewCriterionCreate,
    ReviewCriterionUpdate,
    ReviewCriterionResponse,
    AISimulationRequest,
    AIReviewOutput,
)
from app.services.ai_review import simulate_criterion

router = APIRouter(prefix="/criteria", tags=["Criterios de Revisión"])


def resolve_reviewer_id_for_scope(scope: str, current_user: Profile):
    if scope == "global":
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Solo un administrador puede crear criterios globales.")
        return None
    return current_user.id


def ensure_can_manage_criterion(criterion: ReviewCriterion, current_user: Profile) -> None:
    if criterion.reviewer_id is None and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo un administrador puede modificar criterios globales.")
    if criterion.reviewer_id and criterion.reviewer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No tienes permiso para editar este criterio.")


@router.get("", response_model=List[ReviewCriterionResponse])
def list_criteria(
    project_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """
    Lista criterios visibles para el usuario actual:
    - Globales (reviewer_id IS NULL)
    - Propios del revisor (reviewer_id = current_user.id)
    """
    query = db.query(ReviewCriterion).filter(
        or_(
            ReviewCriterion.reviewer_id == None,       # Globales
            ReviewCriterion.reviewer_id == current_user.id,  # Propios
        )
    )

    if project_type:
        query = query.filter(
            or_(
                ReviewCriterion.project_type == project_type,
                ReviewCriterion.project_type == None,  # Incluir criterios sin tipo
            )
        )

    return query.order_by(ReviewCriterion.created_at.desc()).all()


@router.post("", response_model=ReviewCriterionResponse, status_code=201)
def create_criterion(
    body: ReviewCriterionCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """
    Crea un nuevo criterio.
    - scope='global' crea una plantilla global solo para admin.
    - scope='individual' crea una plantilla personal del usuario actual.
    """
    reviewer_id = resolve_reviewer_id_for_scope(body.scope, current_user)

    criterion = ReviewCriterion(
        name=body.name,
        description=body.description,
        rule_type=body.rule_type,
        rule_pattern=body.rule_pattern,
        is_active=body.is_active,
        project_type=body.project_type,
        reviewer_id=reviewer_id,
    )
    db.add(criterion)
    
    audit = AuditLog(
        action="criteria_updated",
        user_id=current_user.id,
        details={"criterion_name": body.name, "action": "created"}
    )
    db.add(audit)

    db.commit()
    db.refresh(criterion)
    return criterion


@router.put("/{criterion_id}", response_model=ReviewCriterionResponse)
def update_criterion(
    criterion_id: UUID,
    body: ReviewCriterionUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    criterion = db.query(ReviewCriterion).filter(ReviewCriterion.id == criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterio no encontrado.")

    ensure_can_manage_criterion(criterion, current_user)

    update_data = body.model_dump(exclude_unset=True)
    if "scope" in update_data:
        criterion.reviewer_id = resolve_reviewer_id_for_scope(update_data.pop("scope"), current_user)

    for field, value in update_data.items():
        setattr(criterion, field, value)

    audit = AuditLog(
        action="criteria_updated",
        user_id=current_user.id,
        details={"criterion_name": criterion.name, "criterion_id": str(criterion.id), "action": "updated"}
    )
    db.add(audit)

    db.commit()
    db.refresh(criterion)
    return criterion


@router.delete("/{criterion_id}", status_code=204)
def delete_criterion(
    criterion_id: UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    criterion = db.query(ReviewCriterion).filter(ReviewCriterion.id == criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterio no encontrado.")

    ensure_can_manage_criterion(criterion, current_user)

    db.delete(criterion)
    db.commit()
    return None


@router.post("/simulate", response_model=AIReviewOutput)
async def simulate_criterion_endpoint(
    body: AISimulationRequest,
    current_user: Profile = Depends(get_current_user),
):
    """
    Simula la evaluación de un criterio contra un fragmento de texto,
    llamando directamente a Ollama sin guardar nada en la base de datos.
    Útil para que el revisor pruebe la redacción de su criterio antes de guardarlo.
    """
    try:
        result = await simulate_criterion(
            criterion_name=body.criterion_name,
            criterion_description=body.criterion_description,
            rule_type=body.rule_type,
            rule_pattern=body.rule_pattern or "",
            text_fragment=body.text_fragment,
            model_name=body.model_name,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al simular con Ollama: {str(e)}")
