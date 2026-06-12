# AI Models and Criteria Scope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralizar el catálogo de modelos IA y corregir creación/alcance de criterios.

**Architecture:** Backend define catálogo local en `app/ai_models.py` y lo publica por `GET /ai/models`. Criterios usan `scope` como contrato API y `reviewer_id` como almacenamiento. Frontend consume el catálogo en pantallas de documentos.

**Tech Stack:** FastAPI, Pydantic V2, SQLAlchemy, Next.js App Router, React, TypeScript.

---

### Task 1: Backend AI Models API

**Files:**
- Create: `apps/api/app/ai_models.py`
- Create: `apps/api/app/routers/ai_models_router.py`
- Modify: `apps/api/app/main.py`
- Test: `apps/api/tests/test_ai_models.py`

- [ ] Write failing tests for `GET /ai/models` and default model.
- [ ] Implement model catalog and router.
- [ ] Register router in FastAPI app.
- [ ] Run targeted API tests.
- [ ] Commit backend model API.

### Task 2: Criteria Scope and Audit Fix

**Files:**
- Modify: `apps/api/app/schemas.py`
- Modify: `apps/api/app/routers/criteria_router.py`
- Test: `apps/api/tests/test_criteria_scope.py`

- [ ] Write failing tests for create individual, create global as admin, and reject global as reviewer.
- [ ] Import `AuditLog` in criteria router.
- [ ] Add `scope` to criteria schemas.
- [ ] Resolve `reviewer_id` from `scope` and role in create/update.
- [ ] Run targeted API tests.
- [ ] Commit criteria scope fix.

### Task 3: Frontend Model Selectors and Criteria Scope UI

**Files:**
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/components/documents/DocumentUploadClient.tsx`
- Modify: `apps/web/app/(app)/documents/[id]/page.tsx`
- Modify: `apps/web/app/(app)/criteria/page.tsx`
- Modify: `apps/web/components/criteria/CriteriaEditor.tsx`

- [ ] Add TypeScript model catalog and criteria scope types.
- [ ] Load `/ai/models` in document upload and detail screens.
- [ ] Render grouped selectors with `qwen2.5:3b` default.
- [ ] Add criteria scope selector with admin-only global option.
- [ ] Run targeted ESLint and build.
- [ ] Commit frontend integration.

### Task 4: Final Verification

**Files:**
- No code changes expected.

- [ ] Run API test suite.
- [ ] Run frontend targeted lint.
- [ ] Run frontend build.
- [ ] Run route/reference searches for stale hardcoded model lists in document screens.
- [ ] Report global lint debt separately if still present.
