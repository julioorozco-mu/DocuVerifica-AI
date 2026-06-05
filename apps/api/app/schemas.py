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
    email: EmailStr
    password: str


# --- Perfiles de Usuario ---
class ProfileResponse(BaseModel):
    id: UUID
    email: EmailStr
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
