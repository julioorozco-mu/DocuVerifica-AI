from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any

# --- Autenticación y Tokens ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    email: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str


# --- Perfiles de Usuario ---
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = Field(default=None, pattern="^(admin|revisor)$")

class ProfileResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Documentos ---
class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    size_bytes: int
    status: str
    user_id: Optional[UUID] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentFileDataResponse(BaseModel):
    filename: str
    media_type: str
    size_bytes: int
    data_base64: str


# --- Dictamen Humano ---
class HumanVerdictCreate(BaseModel):
    status: str = Field(..., pattern="^(cumple|no_cumple|requiere_revision|no_encontrado)$")
    comments: Optional[str] = None

class HumanVerdictResponse(BaseModel):
    id: UUID
    document_id: UUID
    reviewer_id: Optional[UUID] = None
    status: str
    comments: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Auditoría ---
class AuditLogResponse(BaseModel):
    id: UUID
    action: str
    user_id: Optional[UUID] = None
    details: Dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Chunks de Documento ---
class DocumentChunkResponse(BaseModel):
    id: UUID
    document_id: UUID
    chunk_index: int
    text: str
    section_heading: Optional[str] = None
    headings: list[str] = []
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    word_count: int = 0
    metadata: Dict[str, Any] = Field(default={}, validation_alias="chunk_metadata")
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class ExtractionResultResponse(BaseModel):
    document_id: UUID
    status: str
    total_chunks: int = 0
    total_words: int = 0
    ocr_required: bool = False
    markdown_preview: Optional[str] = None
    message: str = ""


# --- Criterios de Revisión ---
class ReviewCriterionBase(BaseModel):
    name: str
    description: Optional[str] = None
    rule_type: str = Field(default="ai", pattern="^(rule|semantic|ai|rule_then_ai)$")
    rule_pattern: Optional[str] = None
    is_active: bool = True
    project_type: Optional[str] = None

class ReviewCriterionCreate(ReviewCriterionBase):
    pass

class ReviewCriterionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rule_type: Optional[str] = Field(default=None, pattern="^(rule|semantic|ai|rule_then_ai)$")
    rule_pattern: Optional[str] = None
    is_active: Optional[bool] = None
    project_type: Optional[str] = None

class ReviewCriterionResponse(ReviewCriterionBase):
    id: UUID
    reviewer_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Simulación IA ---
class AISimulationRequest(BaseModel):
    """Permite probar un criterio contra un fragmento de texto sin guardarlo en BD."""
    criterion_name: str
    criterion_description: str
    rule_type: str = Field(default="ai")
    rule_pattern: Optional[str] = None
    text_fragment: str
    model_name: Optional[str] = None


# --- Resultados de IA ---
class AIReviewResultResponse(BaseModel):
    id: UUID
    document_id: UUID
    criterion_id: UUID
    status: str
    confidence: float
    evidence: Optional[str] = None
    page_number: Optional[int] = None
    explanation: Optional[str] = None
    human_action_required: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class AIReviewRequest(BaseModel):
    model_name: Optional[str] = None


# --- Ollama Structured Output ---
class AIReviewOutput(BaseModel):
    criterion_id: str
    status: str = Field(..., pattern="^(cumple|no_cumple|no_encontrado|requiere_revision)$")
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence: str
    page_number: Optional[int] = None
    explanation: str
    human_action_required: bool
