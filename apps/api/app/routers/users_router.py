from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import httpx

from app.config import settings
from app.database import get_db
from app.auth import require_role
from app.models import Profile, AuditLog
from app.schemas import ProfileResponse, ProfileUpdate, UserCreateRequest

router = APIRouter(prefix="/users", tags=["Usuarios"])

def get_supabase_admin_headers():
    if not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_SERVICE_ROLE_KEY no está configurado."
        )
    return {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }

@router.get("", response_model=List[ProfileResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("admin"))
):
    """Obtiene la lista de todos los usuarios (Solo para administradores)"""
    users = db.query(Profile).order_by(Profile.created_at.desc()).all()
    return users


@router.post("", response_model=ProfileResponse)
def create_user(
    user_data: UserCreateRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("admin"))
):
    """Crea un nuevo usuario en Supabase Auth y en la tabla profiles local"""
    
    # 1. Crear en Supabase Auth
    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.post(
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/admin/users",
                headers=get_supabase_admin_headers(),
                json={
                    "email": user_data.email,
                    "password": user_data.password,
                    "email_confirm": True,
                    "user_metadata": {
                        "full_name": user_data.full_name,
                        "role": user_data.role
                    }
                }
            )
            
            if res.status_code not in (200, 201):
                err = res.json()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error en Supabase: {err.get('message', 'Error desconocido')}"
                )
            
            auth_user = res.json()
            user_id = UUID(auth_user["id"])
            
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"No se pudo conectar con Supabase Auth local: {exc}",
        )

    # 2. Verificar si el perfil ya fue creado por un trigger de Supabase
    new_profile = db.query(Profile).filter(Profile.id == user_id).first()
    if new_profile:
        # Actualizar datos si el trigger no capturó todo correctamente
        new_profile.full_name = user_data.full_name
        new_profile.role = user_data.role
        new_profile.status = user_data.status
    else:
        new_profile = Profile(
            id=user_id,
            email=user_data.email,
            full_name=user_data.full_name,
            role=user_data.role,
            status=user_data.status
        )
        db.add(new_profile)
    
    audit = AuditLog(
        action="user_created",
        user_id=current_user.id,
        details={"created_user_id": str(user_id), "email": user_data.email, "role": user_data.role}
    )
    db.add(audit)
    
    db.commit()
    db.refresh(new_profile)
    
    return new_profile


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
    
    if user.id == current_user.id and user_data.role and user_data.role != "admin":
        admin_count = db.query(Profile).filter(Profile.role == "admin", Profile.status == "Activo").count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes quitar el rol de administrador a tu propio usuario siendo el único administrador."
            )

    if user.id == current_user.id and user_data.status and user_data.status != "Activo":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivar tu propio usuario activo."
        )

    # Actualizar localmente
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.status is not None:
        user.status = user_data.status

    # Actualizar en Supabase Auth si se pasa un password (opcionalmente email, pero lo mantenemos simple por ahora)
    auth_updates = {}
    if user_data.password:
        auth_updates["password"] = user_data.password
    if user_data.full_name or user_data.role:
        auth_updates["user_metadata"] = {
            "full_name": user.full_name,
            "role": user.role
        }

    if auth_updates:
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.put(
                    f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/admin/users/{user_id}",
                    headers=get_supabase_admin_headers(),
                    json=auth_updates
                )
                if res.status_code not in (200, 201):
                    print("Supabase update error:", res.json())
        except httpx.HTTPError:
            pass # Ignoramos errores de red aquí para no romper la BD, en un ambiente real se debe manejar mejor
            
    audit = AuditLog(
        action="user_updated",
        user_id=current_user.id,
        details={"updated_user_id": str(user.id), "new_role": user.role, "new_status": user.status}
    )
    db.add(audit)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("admin"))
):
    """Elimina un usuario por completo"""
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propio usuario."
        )
        
    user = db.query(Profile).filter(Profile.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
        
    # 1. Eliminar en Supabase Auth
    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.delete(
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/admin/users/{user_id}",
                headers=get_supabase_admin_headers()
            )
            # Ignoramos si da 404 (puede que ya no exista en Auth)
            if res.status_code not in (200, 204, 404):
                err = res.json()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error al eliminar en Supabase Auth: {err.get('message', 'Error desconocido')}"
                )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"No se pudo conectar con Supabase Auth local: {exc}",
        )

    # 2. Eliminar localmente
    db.delete(user)
    
    audit = AuditLog(
        action="user_deleted",
        user_id=current_user.id,
        details={"deleted_user_id": str(user_id), "email": user.email}
    )
    db.add(audit)
    
    db.commit()
    
    return None
