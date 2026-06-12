from fastapi import APIRouter

from app.ai_models import get_ai_models_payload

router = APIRouter(prefix="/ai", tags=["IA local"])


@router.get("/models")
def list_ai_models():
    return get_ai_models_payload()
