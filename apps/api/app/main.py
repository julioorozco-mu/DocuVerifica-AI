from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.database import Base, engine
from app.routers import auth, documents, ai_router, criteria_router
from app.auth import get_current_user
from app.models import Profile
from app.schemas import ProfileResponse

# Inicializar las tablas de SQLAlchemy en la base de datos al arrancar (resiliencia de desarrollo)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Advertencia al crear tablas de SQLAlchemy: {e}. Asumiendo que ya existen por el script de inicialización de la base de datos.")

app = FastAPI(
    title="Revisión Documental AI API",
    description="Backend del Asistente Local de Pre-revisión Documental - Fase 1 (MVP)",
    version="1.0.0"
)

# Configurar Orígenes permitidos para CORS (Frontend en Next.js)
origins = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar Routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(ai_router.router)
app.include_router(criteria_router.router)

@app.get("/status", tags=["Estado"])
def get_status():
    return {
        "status": "online",
        "api_name": "Revisión Documental AI API",
        "version": "1.0.0",
        "phase": 1
    }


@app.get("/me", response_model=ProfileResponse, tags=["Autenticación"])
def get_me_alias(current_user: Profile = Depends(get_current_user)):
    return current_user

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
