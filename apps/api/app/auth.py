from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from uuid import UUID
import httpx

from app.config import settings
from app.database import get_db
from app.models import Profile
from app.schemas import TokenData

import bcrypt

# Esquema de seguridad HTTP Bearer (auto_error=False para manejar query params manualmente)
security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


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


def get_legacy_token_data(token_str: str) -> TokenData:
    payload = jwt.decode(token_str, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    user_id_str: str = payload.get("sub")
    email: str = payload.get("email")
    role: str = payload.get("role")

    if user_id_str is None or email is None:
        raise JWTError("Token JWT legacy sin sub/email.")

    return TokenData(user_id=UUID(user_id_str), email=email, role=role)


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
        if settings.SUPABASE_ANON_KEY:
            raise supabase_error
        try:
            token_data = get_legacy_token_data(token_str)
        except (JWTError, ValueError):
            raise credentials_exception

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
