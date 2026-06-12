import uuid
from sqlalchemy import Column, String, Integer, BIGINT, ForeignKey, DateTime, Text, func, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy.orm import relationship
from app.database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    role = Column(ENUM("admin", "revisor", name="user_role", create_type=False), nullable=False, default="revisor")
    status = Column(ENUM("Activo", "Inactivo", "Pendiente", name="user_status", create_type=False), nullable=False, default="Activo")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    documents = relationship("Document", back_populates="uploader")
    verdicts = relationship("HumanVerdict", back_populates="reviewer")
    audit_logs = relationship("AuditLog", back_populates="user")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    size_bytes = Column(BIGINT, nullable=False)
    status = Column(
        ENUM(
            "uploaded",
            "extracting_text",
            "ocr_required",
            "ocr_processing",
            "processing",
            "ready_for_review",
            "ai_reviewing",
            "ai_review_done",
            "human_review_done",
            "error",
            name="document_status",
            create_type=False,
        ),
        nullable=False, 
        default="uploaded"
    )
    priority = Column(
        ENUM("baja", "media", "alta", name="document_priority", create_type=False),
        nullable=False,
        default="media",
    )
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    uploader = relationship("Profile", back_populates="documents")
    verdict = relationship("HumanVerdict", back_populates="document", uselist=False)
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan", order_by="DocumentChunk.chunk_index")
    ai_results = relationship("AIReviewResult", back_populates="document", cascade="all, delete-orphan")
    processing_request = relationship("DocumentProcessingRequest", back_populates="document", uselist=False, cascade="all, delete-orphan")


class DocumentProcessingRequest(Base):
    __tablename__ = "document_processing_requests"

    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    requested_ai = Column(Boolean, nullable=False, default=False)
    model_name = Column(String(100), nullable=True)
    selected_criterion_ids = Column(JSONB, nullable=False, default=list)
    created_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    document = relationship("Document", back_populates="processing_request")
    creator = relationship("Profile")


class HumanVerdict(Base):
    __tablename__ = "human_verdicts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), unique=True, nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    status = Column(
        ENUM(
            "cumple",
            "no_cumple",
            "no_encontrado",
            "requiere_revision",
            name="human_verdict_status",
            create_type=False,
        ),
        nullable=False,
    )
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    document = relationship("Document", back_populates="verdict")
    reviewer = relationship("Profile", back_populates="verdicts")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action = Column(String(100), nullable=False)  # document_uploaded, human_verdict_saved, etc.
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    details = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("Profile", back_populates="audit_logs")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    section_heading = Column(Text, nullable=True)
    headings = Column(JSONB, nullable=False, default=list)
    page_start = Column(Integer, nullable=True)
    page_end = Column(Integer, nullable=True)
    word_count = Column(Integer, nullable=False, default=0)
    chunk_metadata = Column("metadata", JSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="chunks")


class ReviewCriterion(Base):
    __tablename__ = "review_criteria"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    rule_type = Column(
        ENUM("rule", "semantic", "ai", "rule_then_ai", name="criterion_rule_type", create_type=False),
        nullable=False,
        default="ai"
    )
    rule_pattern = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    # Propiedad del criterio: null = global, UUID = personal del revisor
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=True)
    # Tipo de proyecto para agrupar criterios (Ej. "Microcredencial", "Diplomado")
    project_type = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    reviewer = relationship("Profile")

    @property
    def scope(self) -> str:
        return "global" if self.reviewer_id is None else "individual"


class AIReviewResult(Base):
    __tablename__ = "ai_review_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    criterion_id = Column(UUID(as_uuid=True), ForeignKey("review_criteria.id", ondelete="CASCADE"), nullable=False)
    status = Column(
        ENUM("cumple", "no_cumple", "no_encontrado", "requiere_revision", name="ai_review_status", create_type=False),
        nullable=False,
    )
    confidence = Column(Float, nullable=False, default=0.0)
    evidence = Column(Text, nullable=True)
    page_number = Column(Integer, nullable=True)
    explanation = Column(Text, nullable=True)
    human_action_required = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="ai_results")
    criterion = relationship("ReviewCriterion")
