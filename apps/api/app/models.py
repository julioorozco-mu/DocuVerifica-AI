import uuid
from sqlalchemy import Column, String, Integer, BIGINT, ForeignKey, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy.orm import relationship
from app.database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    role = Column(ENUM("admin", "revisor", name="user_role", create_type=False), nullable=False, default="revisor")
    hashed_password = Column(String(255), nullable=True)
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
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    uploader = relationship("Profile", back_populates="documents")
    verdict = relationship("HumanVerdict", back_populates="document", uselist=False)
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan", order_by="DocumentChunk.chunk_index")


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
