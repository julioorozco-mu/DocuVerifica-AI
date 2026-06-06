from fastapi import APIRouter, Depends, HTTPException, status
import httpx
from sqlalchemy.orm import Session
from uuid import UUID

from app.config import settings
from app.database import get_db
from app.models import Profile
from app.schemas import LoginRequest, Token, ProfileResponse
from app.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    if not settings.SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Auth no está configurado. Define SUPABASE_ANON_KEY.",
        )

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/token?grant_type=password",
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "email": login_data.email,
                    "password": login_data.password,
                },
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"No se pudo conectar con Supabase Auth local: {exc}",
        ) from exc

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos."
        )

    session_data = response.json()
    user_data = session_data.get("user") or {}
    user_id = user_data.get("id")
    user_email = user_data.get("email") or str(login_data.email)
    metadata = user_data.get("user_metadata") or {}

    if user_id:
        user_uuid = UUID(user_id)
        user = db.query(Profile).filter(Profile.id == user_uuid).first()
        if user is None:
            user = Profile(
                id=user_uuid,
                email=user_email,
                full_name=metadata.get("full_name") or user_email.split("@")[0],
                role=metadata.get("role") if metadata.get("role") in {"admin", "revisor"} else "revisor",
            )
            db.add(user)
            db.commit()

    return {"access_token": session_data["access_token"], "token_type": "bearer"}

@router.get("/me", response_model=ProfileResponse)
def get_me(current_user: Profile = Depends(get_current_user)):
    return current_user
