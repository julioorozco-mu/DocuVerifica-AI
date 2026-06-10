from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.auth import require_role
from app.models import Profile, AuditLog
from app.schemas import ProfileResponse, ProfileUpdate

router = APIRouter(prefix="/users", tags=["Usuarios"])

@router.get("", response_model=List[ProfileResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("admin"))
):
    """Obtiene la lista de todos los usuarios (Solo para administradores)"""
    users = db.query(Profile).order_by(Profile.created_at.desc()).all()
    return users


@router.put("/{user_id}", response_model=ProfileResponse)
def update_user(
    user_id: UUID,
    user_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("admin"))
):
    """Actualiza la información de un usuario (Solo para administradores)"""
    user = db.query(Profile).filter(Profile.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Prevenir que el único administrador se cambie su propio rol
    if user.id == current_user.id and user_data.role and user_data.role != "admin":
        # Verificamos si hay otros admins
        admin_count = db.query(Profile).filter(Profile.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes quitar el rol de administrador a tu propio usuario siendo el único administrador."
            )

    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    
    if user_data.role is not None:
        user.role = user_data.role

    # Registrar auditoría
    audit = AuditLog(
        action="user_updated",
        user_id=current_user.id,
        details={"updated_user_id": str(user.id), "new_role": user.role}
    )
    db.add(audit)

    db.commit()
    db.refresh(user)
    return user
