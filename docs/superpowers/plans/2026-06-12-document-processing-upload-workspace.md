# Document Processing Upload Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect document upload processing options to real backend flow, persist priority and selected criteria, and consolidate document review into `/documents/[id]`.

**Architecture:** Backend owns durable processing state through `document_processing_requests`, so AI requested during upload can continue after OCR without relying on the browser. Frontend remains a client workflow surface: it uploads the file, starts extraction/AI requests, displays queue progress, and opens the unified workspace.

**Tech Stack:** FastAPI, Pydantic V2, SQLAlchemy, Supabase/Postgres migrations, RQ/Redis, Next.js App Router, React, TypeScript, Tailwind/shadcn UI.

---

## File Structure

- Create: `supabase/migrations/202606120001_document_processing_priority.sql`
  - Adds `documents.priority`, enum/check constraints, and `document_processing_requests`.
- Modify: `apps/api/app/models.py`
  - Adds `Document.priority` and `DocumentProcessingRequest`.
- Modify: `apps/api/app/schemas.py`
  - Adds priority to document responses and criterion IDs to AI review requests.
- Modify: `apps/api/app/routers/documents.py`
  - Accepts upload priority and creates/updates processing requests when extraction needs OCR.
- Modify: `apps/api/app/routers/ai_router.py`
  - Validates selected criteria, secures result endpoint, and supports pending AI after OCR.
- Modify: `apps/api/app/services/ai_review.py`
  - Accepts selected individual criteria and always includes global criteria.
- Modify: `apps/api/app/services/ocr_service.py`
  - Enqueues pending AI after OCR finishes.
- Create: `apps/api/tests/test_ai_criteria_selection.py`
  - Tests criterion resolution logic.
- Modify: `apps/web/lib/api.ts`
  - Adds priority, selected criteria, upload options, and AI request types.
- Modify: `apps/web/components/documents/DocumentUploadClient.tsx`
  - Connects configuration controls to upload, extraction, OCR, IA, criteria, priority, and queue status.
- Modify: `apps/web/app/(app)/documents/[id]/page.tsx`
  - Becomes the unified workspace with minimap/resaltado/IA/texto/dictamen.
- Delete: `apps/web/app/(app)/documents/[id]/review/page.tsx`
  - Removes duplicate route.

---

### Task 1: Backend Persistence For Priority And Processing Requests

**Files:**
- Create: `supabase/migrations/202606120001_document_processing_priority.sql`
- Modify: `apps/api/app/models.py`
- Modify: `apps/api/app/schemas.py`

- [ ] **Step 1: Add the migration**

Create `supabase/migrations/202606120001_document_processing_priority.sql`:

```sql
do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_priority') then
    create type public.document_priority as enum ('baja', 'media', 'alta');
  end if;
end $$;

alter table public.documents
  add column if not exists priority public.document_priority not null default 'media';

create table if not exists public.document_processing_requests (
  document_id uuid primary key references public.documents(id) on delete cascade,
  requested_ai boolean not null default false,
  model_name varchar(100),
  selected_criterion_ids jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_documents_priority on public.documents(priority);
create index if not exists idx_document_processing_requests_requested_ai
  on public.document_processing_requests(requested_ai);

drop trigger if exists set_document_processing_requests_updated_at on public.document_processing_requests;
create trigger set_document_processing_requests_updated_at
before update on public.document_processing_requests
for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.document_processing_requests to authenticated;

alter table public.document_processing_requests enable row level security;

drop policy if exists processing_requests_owned_or_admin on public.document_processing_requests;
create policy processing_requests_owned_or_admin
  on public.document_processing_requests for all
  to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_processing_requests.document_id
        and (d.user_id = (select auth.uid()) or public.current_profile_role() = 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_processing_requests.document_id
        and (d.user_id = (select auth.uid()) or public.current_profile_role() = 'admin')
    )
  );
```

- [ ] **Step 2: Add SQLAlchemy models**

In `apps/api/app/models.py`, update imports:

```python
from sqlalchemy import Column, String, Integer, BIGINT, ForeignKey, DateTime, Text, func, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
```

Add `priority` to `Document` after `status`:

```python
    priority = Column(
        ENUM("baja", "media", "alta", name="document_priority", create_type=False),
        nullable=False,
        default="media",
    )
```

Add the relationship to `Document`:

```python
    processing_request = relationship("DocumentProcessingRequest", back_populates="document", uselist=False, cascade="all, delete-orphan")
```

Add this model before `HumanVerdict`:

```python
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
```

- [ ] **Step 3: Update Pydantic schemas**

In `apps/api/app/schemas.py`, update imports:

```python
from typing import Optional, Dict, Any, List
```

Add `priority` to `DocumentResponse`:

```python
    priority: str = "media"
```

Update `AIReviewRequest`:

```python
class AIReviewRequest(BaseModel):
    model_name: Optional[str] = None
    criterion_ids: List[UUID] = Field(default_factory=list)
```

- [ ] **Step 4: Run backend import check**

Run:

```powershell
cd apps\api
python -c "from app.models import Document, DocumentProcessingRequest; from app.schemas import DocumentResponse, AIReviewRequest; print('ok')"
```

Expected: prints `ok`.

- [ ] **Step 5: Commit**

```powershell
git add supabase/migrations/202606120001_document_processing_priority.sql apps/api/app/models.py apps/api/app/schemas.py
git commit -m "feat: add document processing persistence"
```

---

### Task 2: Backend Upload Priority And AI Criteria Selection

**Files:**
- Modify: `apps/api/app/routers/documents.py`
- Modify: `apps/api/app/routers/ai_router.py`
- Modify: `apps/api/app/services/ai_review.py`
- Create: `apps/api/tests/test_ai_criteria_selection.py`

- [ ] **Step 1: Add a criterion resolver helper**

In `apps/api/app/services/ai_review.py`, add this helper near the top after imports:

```python
from typing import Iterable

def resolve_review_criteria(db, reviewer_id, selected_criterion_ids: Iterable = ()):
    selected_ids = {str(item) for item in (selected_criterion_ids or [])}
    query = db.query(ReviewCriterion).filter(
        ReviewCriterion.is_active == True,
        ReviewCriterion.rule_type.in_(["ai", "rule_then_ai"]),
    )
    criteria = query.filter(
        (ReviewCriterion.reviewer_id == None) |
        (ReviewCriterion.id.in_(selected_ids) & (ReviewCriterion.reviewer_id == reviewer_id))
    ).all()
    return criteria
```

- [ ] **Step 2: Update AI worker signature**

Replace `async_process_document_ai_review` signature:

```python
async def async_process_document_ai_review(document_id: UUID, model_name: str = None, criterion_ids: list[str] | None = None):
```

Replace criteria query inside that function:

```python
        criteria = resolve_review_criteria(db, document.user_id, criterion_ids or [])
```

Replace sync wrapper signature and call:

```python
def process_document_ai_review(document_id: UUID, model_name: str = None, criterion_ids: list[str] | None = None):
    """Punto de entrada síncrono para el worker de RQ."""
    asyncio.run(async_process_document_ai_review(document_id, model_name, criterion_ids))
```

- [ ] **Step 3: Add focused resolver tests**

Create `apps/api/tests/test_ai_criteria_selection.py`:

```python
import uuid
from types import SimpleNamespace

from app.services.ai_review import resolve_review_criteria


class FakeQuery:
    def __init__(self, items):
        self.items = items

    def filter(self, *conditions):
        return self

    def all(self):
        return self.items


class FakeDB:
    def __init__(self, items):
        self.items = items

    def query(self, model):
        return FakeQuery(self.items)


def test_resolver_returns_query_results_without_crashing():
    reviewer_id = uuid.uuid4()
    criterion = SimpleNamespace(id=uuid.uuid4(), reviewer_id=None, is_active=True, rule_type="ai")

    results = resolve_review_criteria(FakeDB([criterion]), reviewer_id, [])

    assert results == [criterion]
```

- [ ] **Step 4: Update upload endpoint for priority**

In `apps/api/app/routers/documents.py`, update imports:

```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
```

Add allowed priorities near `ALLOWED_DOCUMENT_EXTENSIONS`:

```python
ALLOWED_PRIORITIES = {"baja", "media", "alta"}
```

Update upload signature:

```python
async def upload_document(
    file: UploadFile = File(...),
    priority: str = Form("media"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
```

Add priority validation after extension validation:

```python
    normalized_priority = priority.lower().strip()
    if normalized_priority not in ALLOWED_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La prioridad debe ser baja, media o alta."
        )
```

Replace `new_doc = Document(...)` with:

```python
    new_doc = Document(
        id=doc_id,
        filename=file.filename,
        file_path=file_path,
        size_bytes=file_size,
        status="uploaded",
        priority=normalized_priority,
        user_id=current_user.id
    )
```

Replace `audit_detail` with:

```python
    audit_detail = {
        "filename": file.filename,
        "size_bytes": file_size,
        "uploader_email": current_user.email,
        "priority": normalized_priority,
    }
```

- [ ] **Step 5: Update AI router**

In `apps/api/app/routers/ai_router.py`, update imports:

```python
from app.models import Document, AIReviewResult, DocumentProcessingRequest, ReviewCriterion
```

Add validator helper above `trigger_ai_review`:

```python
def validate_individual_criteria(db: Session, current_user: Profile, criterion_ids: list[UUID]) -> list[str]:
    if not criterion_ids:
        return []

    criteria = db.query(ReviewCriterion).filter(
        ReviewCriterion.id.in_(criterion_ids),
        ReviewCriterion.is_active == True,
        ReviewCriterion.reviewer_id == current_user.id,
    ).all()
    found_ids = {criterion.id for criterion in criteria}
    missing_ids = [str(criterion_id) for criterion_id in criterion_ids if criterion_id not in found_ids]
    if missing_ids:
        raise HTTPException(status_code=403, detail="Uno o más criterios seleccionados no pertenecen al usuario actual.")
    return [str(criterion.id) for criterion in criteria]
```

Inside `trigger_ai_review`, after processing-state guard:

```python
    selected_criterion_ids = validate_individual_criteria(db, current_user, request.criterion_ids)

    processing_request = db.query(DocumentProcessingRequest).filter(
        DocumentProcessingRequest.document_id == document_id
    ).first()
    if not processing_request:
        processing_request = DocumentProcessingRequest(document_id=document_id, created_by=current_user.id)
        db.add(processing_request)

    processing_request.requested_ai = True
    processing_request.model_name = request.model_name
    processing_request.selected_criterion_ids = selected_criterion_ids
```

Before changing status to `ai_reviewing`, add:

```python
    if document.status in ["uploaded", "extracting_text"]:
        db.commit()
        raise HTTPException(status_code=409, detail="Primero se requiere extracción de texto.")

    if document.status in ["ocr_required", "ocr_processing"]:
        db.commit()
        return {"message": "AI review pending OCR", "job_id": None, "status": document.status}
```

Update enqueue call:

```python
    job = ai_queue.enqueue(process_document_ai_review, document_id, request.model_name, selected_criterion_ids)
```

Secure result endpoint:

```python
def get_ai_review_results(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
```

- [ ] **Step 6: Run backend checks**

Run:

```powershell
cd apps\api
python -m pytest tests/test_ai_criteria_selection.py -q
python -c "from app.routers.documents import upload_document; from app.routers.ai_router import trigger_ai_review; print('ok')"
```

Expected: pytest passes and import check prints `ok`.

- [ ] **Step 7: Commit**

```powershell
git add apps/api/app/routers/documents.py apps/api/app/routers/ai_router.py apps/api/app/services/ai_review.py apps/api/tests/test_ai_criteria_selection.py
git commit -m "feat: support selected criteria and upload priority"
```

---

### Task 3: OCR Continuation For Pending AI

**Files:**
- Modify: `apps/api/app/services/ocr_service.py`

- [ ] **Step 1: Import processing request and AI worker**

In `apps/api/app/services/ocr_service.py`, update imports:

```python
from app.models import Document, DocumentProcessingRequest
from app.queue_service import get_queue
from app.services.ai_review import process_document_ai_review
```

- [ ] **Step 2: Add enqueue helper**

Add after logger:

```python
def enqueue_pending_ai_review(db: Session, document: Document) -> None:
    request = db.query(DocumentProcessingRequest).filter(
        DocumentProcessingRequest.document_id == document.id,
        DocumentProcessingRequest.requested_ai == True,
    ).first()
    if not request:
        return

    queue = get_queue("ai_review_queue")
    queue.enqueue(
        process_document_ai_review,
        document.id,
        request.model_name,
        request.selected_criterion_ids or [],
    )
    document.status = "ai_reviewing"
```

- [ ] **Step 3: Call helper after OCR chunks are saved**

Replace:

```python
        document.status = "ready_for_review"
```

with:

```python
        document.status = "ready_for_review"
        enqueue_pending_ai_review(db, document)
```

In the branch where no chunks are extracted after OCR, replace:

```python
            document.status = "ready_for_review"
            db.commit()
            return
```

with:

```python
            document.status = "ready_for_review"
            enqueue_pending_ai_review(db, document)
            db.commit()
            return
```

- [ ] **Step 4: Run import check**

Run:

```powershell
cd apps\api
python -c "from app.services.ocr_service import enqueue_pending_ai_review; print('ok')"
```

Expected: prints `ok`.

- [ ] **Step 5: Commit**

```powershell
git add apps/api/app/services/ocr_service.py
git commit -m "feat: continue pending ai after ocr"
```

---

### Task 4: Frontend API Types And Upload Processing UI

**Files:**
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/components/documents/DocumentUploadClient.tsx`
- Modify: `apps/web/components/documents/document-display.ts`

- [ ] **Step 1: Update API types**

In `apps/web/lib/api.ts`, add:

```ts
export type DocumentPriority = "baja" | "media" | "alta";

export interface ProcessingRequest {
  model_name?: string;
  criterion_ids?: string[];
}
```

Replace `DocumentInfo` with:

```ts
export interface DocumentInfo {
  id: string;
  filename: string;
  size_bytes: number;
  status: string;
  priority: DocumentPriority;
  user_id?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
```

Replace `uploadFile` signature and body:

```ts
  async uploadFile(file: File, priority: DocumentPriority = "media"): Promise<DocumentInfo> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("priority", priority);
```

- [ ] **Step 2: Add priority display helper**

In `apps/web/components/documents/document-display.ts`, add:

```ts
export function getPriorityDisplay(priority?: string) {
  switch (priority) {
    case "alta":
      return { label: "Alta", className: "border-red-200 bg-red-50 text-red-700" };
    case "baja":
      return { label: "Baja", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
    case "media":
    default:
      return { label: "Media", className: "border-orange-200 bg-orange-50 text-orange-700" };
  }
}
```

- [ ] **Step 3: Add upload state for processing options**

In `DocumentUploadClient.tsx`, add imports:

```ts
import { api, DocumentInfo, getErrorMessage, ReviewCriterion, UserProfile, type DocumentPriority } from "@/lib/api";
```

Add state near existing upload state:

```ts
  const [criteria, setCriteria] = useState<ReviewCriterion[]>([]);
  const [extractText, setExtractText] = useState(true);
  const [autoOcr, setAutoOcr] = useState(true);
  const [runAiReview, setRunAiReview] = useState(false);
  const [selectedModel, setSelectedModel] = useState("qwen3.5:9b");
  const [selectedCriterionIds, setSelectedCriterionIds] = useState<string[]>([]);
  const [queueStatus, setQueueStatus] = useState<string>("Listo para subir");
```

Change priority state:

```ts
  const [priority, setPriority] = useState<DocumentPriority>("media");
```

- [ ] **Step 4: Load criteria with documents**

Inside `fetchInitialData`, replace the single documents call with:

```ts
        const [documentsData, criteriaData] = await Promise.all([
          api.get<DocumentInfo[]>("/documents"),
          api.get<ReviewCriterion[]>("/criteria"),
        ]);
        setDocuments(documentsData);
        setCriteria(criteriaData);
```

Add derived lists:

```ts
  const activeGlobalCriteria = useMemo(
    () => criteria.filter((criterion) => criterion.is_active && !criterion.reviewer_id),
    [criteria]
  );
  const activeIndividualCriteria = useMemo(
    () => criteria.filter((criterion) => criterion.is_active && criterion.reviewer_id === profile?.id),
    [criteria, profile?.id]
  );
```

- [ ] **Step 5: Replace upload handler with sequenced processing**

Replace `handleUpload` with:

```ts
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      setQueueStatus("Subiendo archivo");
      const uploadedDocument = await api.uploadFile(file, priority);

      if (extractText || runAiReview) {
        setQueueStatus("Extrayendo texto");
        const extractionResult = await api.post<{ status: string; ocr_required: boolean; message: string }>(
          `/documents/${uploadedDocument.id}/extract-text`,
          {}
        );

        if (runAiReview) {
          setQueueStatus(extractionResult.ocr_required ? "IA pendiente de OCR" : "Encolando pre-revisión IA");
          await api.post(`/documents/${uploadedDocument.id}/review-ai`, {
            model_name: selectedModel,
            criterion_ids: selectedCriterionIds,
          });
        }
      }

      setQueueStatus("Completado");
      setSuccess(true);
      setFile(null);
      await loadDocuments();
      window.setTimeout(() => {
        setSuccess(false);
        setQueueStatus("Listo para subir");
      }, 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al procesar el documento."));
      setQueueStatus("Error");
    } finally {
      setUploading(false);
    }
  };
```

- [ ] **Step 6: Wire processing controls**

Update checkbox behavior:

```tsx
<input
  type="checkbox"
  checked={extractText}
  onChange={(event) => {
    const checked = event.target.checked;
    setExtractText(checked);
    if (!checked) {
      setAutoOcr(false);
      setRunAiReview(false);
    }
  }}
  className="size-4 rounded border-[#CBD5E1]"
/>
```

```tsx
<input
  type="checkbox"
  checked={autoOcr}
  disabled={!extractText}
  onChange={(event) => setAutoOcr(event.target.checked)}
  className="size-4 rounded border-[#CBD5E1]"
/>
```

```tsx
<input
  type="checkbox"
  checked={runAiReview}
  onChange={(event) => {
    const checked = event.target.checked;
    setRunAiReview(checked);
    if (checked) {
      setExtractText(true);
      setAutoOcr(true);
    }
  }}
  className="size-4 rounded border-[#CBD5E1]"
/>
```

Add model select when `runAiReview` is true:

```tsx
{runAiReview && (
  <select
    value={selectedModel}
    onChange={(event) => setSelectedModel(event.target.value)}
    className="h-9 rounded-[8px] border border-[#DDE5F0] bg-white px-3 text-[12px] font-semibold text-[#334155]"
  >
    <option value="qwen3.5:9b">Qwen 3.5 9B</option>
    <option value="llama3.1:8b">Llama 3.1 8B</option>
    <option value="phi4">Phi-4</option>
    <option value="deepseek-r1:8b">DeepSeek R1 8B</option>
  </select>
)}
```

- [ ] **Step 7: Replace criteria placeholder**

Replace `FUTURE_CRITERIA` rendering with:

```tsx
<div className="space-y-3">
  <div>
    <p className="mb-2 text-[12px] font-bold text-[#0F172A]">Globales siempre aplicados</p>
    <div className="flex flex-wrap gap-2">
      {activeGlobalCriteria.length === 0 ? (
        <span className="text-[11px] font-medium text-[#94A3B8]">No hay criterios globales activos.</span>
      ) : (
        activeGlobalCriteria.map((criterion) => (
          <span key={criterion.id} className="rounded bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            {criterion.name}
          </span>
        ))
      )}
    </div>
  </div>
  <div>
    <p className="mb-2 text-[12px] font-bold text-[#0F172A]">Plantillas individuales</p>
    <div className="space-y-2">
      {activeIndividualCriteria.length === 0 ? (
        <span className="text-[11px] font-medium text-[#94A3B8]">No tienes plantillas individuales activas.</span>
      ) : (
        activeIndividualCriteria.map((criterion) => (
          <label key={criterion.id} className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B]">
            <input
              type="checkbox"
              checked={selectedCriterionIds.includes(criterion.id)}
              onChange={(event) => {
                setSelectedCriterionIds((current) =>
                  event.target.checked
                    ? [...current, criterion.id]
                    : current.filter((id) => id !== criterion.id)
                );
              }}
              className="size-4 rounded border-[#CBD5E1]"
            />
            {criterion.name}
          </label>
        ))
      )}
    </div>
  </div>
</div>
```

- [ ] **Step 8: Run frontend checks**

Run:

```powershell
cd apps\web
npm run lint
npm run build
```

Expected: both commands exit with code 0.

- [ ] **Step 9: Commit**

```powershell
git add apps/web/lib/api.ts apps/web/components/documents/DocumentUploadClient.tsx apps/web/components/documents/document-display.ts
git commit -m "feat: connect document upload processing options"
```

---

### Task 5: Unified Workspace And Route Removal

**Files:**
- Modify: `apps/web/app/(app)/documents/[id]/page.tsx`
- Delete: `apps/web/app/(app)/documents/[id]/review/page.tsx`
- Modify: `apps/web/components/documents/DocumentUploadClient.tsx`
- Modify: `apps/web/components/documents/DocumentsListClient.tsx`

- [ ] **Step 1: Merge review workspace state into `/documents/[id]`**

In `apps/web/app/(app)/documents/[id]/page.tsx`, add state from current review page:

```ts
  const [highlightText, setHighlightText] = useState<string>("");
  const [highlightStatus, setHighlightStatus] = useState<string>("default");
  const [allEvidences, setAllEvidences] = useState<AIReviewResult[]>([]);
```

Update imports:

```ts
import { api, DocumentInfo, DocumentChunk, ExtractionResult, HumanVerdict, getErrorMessage, AIReviewResult } from "@/lib/api";
```

- [ ] **Step 2: Pass highlight props to `PDFViewer`**

Replace the `PDFViewer` call in `/documents/[id]` with:

```tsx
<PDFViewer
  fileData={fileData}
  currentPage={currentPage}
  onPageChange={setCurrentPage}
  highlightText={highlightText}
  highlightStatus={highlightStatus}
  allEvidences={allEvidences}
  onClearHighlight={() => {
    setHighlightText("");
    setHighlightStatus("default");
  }}
/>
```

- [ ] **Step 3: Pass evidence callbacks to `AIReviewChecklist`**

Replace the `AIReviewChecklist` call with:

```tsx
<AIReviewChecklist
  documentId={docId}
  onResultsLoaded={setAllEvidences}
  onEvidenceClick={(pageNumber, text, status) => {
    if (pageNumber && isPdfDocument) {
      setCurrentPage(pageNumber);
    }
    if (text && text.trim().length > 5 && isPdfDocument) {
      setHighlightText(text.trim());
      setHighlightStatus(status || "default");
    } else {
      setHighlightText("");
      setHighlightStatus("default");
    }
  }}
/>
```

- [ ] **Step 4: Remove link to `/review` from workspace header**

Delete the button linking to:

```tsx
<Link href={`/documents/${docId}/review`}>
```

The header should keep only back navigation and document metadata.

- [ ] **Step 5: Update document list links**

In `DocumentUploadClient.tsx` and `DocumentsListClient.tsx`, replace every:

```tsx
href={`/documents/${document.id}/review`}
```

with:

```tsx
href={`/documents/${document.id}`}
```

Rename button copy from `Revisar` only if there is duplicate adjacent `Detalle`; otherwise keep a single action:

```tsx
Revisar
```

- [ ] **Step 6: Delete duplicate route**

Delete:

```text
apps/web/app/(app)/documents/[id]/review/page.tsx
```

- [ ] **Step 7: Run route search**

Run:

```powershell
rg -n "/review|\\[id\\]\\\\review|documents/\\$\\{document.id\\}/review" apps\web
```

Expected: no references to document review route remain. References to unrelated "review" words are acceptable.

- [ ] **Step 8: Run frontend checks**

Run:

```powershell
cd apps\web
npm run lint
npm run build
```

Expected: both commands exit with code 0.

- [ ] **Step 9: Commit**

```powershell
git add apps/web/app/(app)/documents/[id]/page.tsx apps/web/components/documents/DocumentUploadClient.tsx apps/web/components/documents/DocumentsListClient.tsx
git rm apps/web/app/(app)/documents/[id]/review/page.tsx
git commit -m "feat: unify document review workspace"
```

---

### Task 6: End-To-End Verification

**Files:**
- Verify only unless a defect is found.

- [ ] **Step 1: Run backend checks**

Run:

```powershell
cd apps\api
python -m pytest tests -q
python -c "from app.main import app; print('ok')"
```

Expected: tests pass and import check prints `ok`.

- [ ] **Step 2: Run frontend checks**

Run:

```powershell
cd apps\web
npm run lint
npm run build
```

Expected: both commands pass.

- [ ] **Step 3: Start services for manual browser verification**

Run API:

```powershell
cd apps\api
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Run frontend:

```powershell
cd apps\web
npm run dev
```

Run worker:

```powershell
cd apps\api
python worker.py
```

- [ ] **Step 4: Manual verification**

Open `http://localhost:3001/documents`.

Verify:

- login works with the existing test credentials;
- priority is selectable and visible after upload;
- global criteria render as always applied;
- individual criteria can be selected independently;
- selecting IA turns on extraction/OCR;
- upload with only carga leaves document uploaded;
- upload with extraction calls extraction and refreshes status;
- upload with extraction + IA enqueues AI or leaves it pending OCR;
- historial opens `/documents/[id]`;
- `/documents/[id]` shows PDF minimap, evidence highlight, AI checklist and dictamen.

- [ ] **Step 5: Final status**

Run:

```powershell
git status --short
```

Expected: clean working tree after all commits, or only intentionally uncommitted runtime artifacts ignored by `.gitignore`.
