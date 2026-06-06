from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from uuid import UUID
import httpx

from app.config import settings
from app.database import get_db
from app.models import Profile
from app.schemas import TokenData

# Esquema de seguridad HTTP Bearer (auto_error=False para manejar query params manualmente)
security = HTTPBearer(auto_error=False)
def get_supabase_user(token_str: str) -> dict:
    if not settings.SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Auth no está configurado. Define SUPABASE_ANON_KEY.",
        )

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token_str}",
                    "apikey": settings.SUPABASE_ANON_KEY,
                },
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"No se pudo validar el token con Supabase Auth: {exc}",
        ) from exc

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de autenticación no válidas o expiradas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return response.json()



def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Profile:
    token_str = None
    if credentials:
        token_str = credentials.credentials
    elif token:
        token_str = token

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales de autenticación no válidas o expiradas.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token_str:
        raise credentials_exception

    try:
        supabase_user = get_supabase_user(token_str)
        token_data = TokenData(
            user_id=UUID(supabase_user["id"]),
            email=supabase_user.get("email"),
            role=None,
        )
    except HTTPException as supabase_error:
        raise supabase_error

    user = db.query(Profile).filter(Profile.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
        
    return user

def require_role(allowed_roles: list[str]):
    def role_checker(current_user: Profile = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos suficientes para realizar esta acción."
            )
        return current_user
    return role_checker
