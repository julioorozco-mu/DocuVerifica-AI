# Documents Integrated Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `/documents` into the integrated document operations screen that combines upload, local queue, real document history, metrics, and existing detail/review navigation.

**Architecture:** Reuse the current `DocumentUploadClient` visual direction as the main screen and connect it to the real `GET /documents` endpoint. Keep backend unchanged, because existing FastAPI endpoints already cover Fase 1. Move reusable formatting/status logic into a small helper file so the component can stay readable while preserving the current local upload UI.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind CSS, shadcn/ui `Button`, lucide-react, existing `api` client.

---

## File Structure

- Modify `apps/web/components/documents/DocumentUploadClient.tsx`
  - Becomes the integrated `/documents` client.
  - Owns authenticated profile loading, document history loading, upload state, local selected-file queue, derived metrics, search/filter state, and refresh-after-upload.
- Create `apps/web/components/documents/document-display.ts`
  - Pure helpers for file size, date, extension, document status label/style, and metrics derivation.
  - Keeps repeated table/status logic out of `DocumentUploadClient`.
- Modify `apps/web/app/documents/page.tsx`
  - Render `DocumentUploadClient` instead of the legacy `DocumentsListClient`.
- Modify `apps/web/app/documents/upload/page.tsx`
  - Redirect to `/documents` so old links continue to work without a divergent screen.
- Leave `apps/web/components/documents/DocumentsListClient.tsx` in place for now.
  - It becomes unused after the route switch.
  - Delete it only in a later cleanup commit after verifying no imports remain.

---

### Task 1: Add Document Display Helpers

**Files:**
- Create: `apps/web/components/documents/document-display.ts`

- [ ] **Step 1: Create the helper module**

Add this file exactly:

```ts
import type { DocumentInfo } from "@/lib/api";

export type DocumentMetricId = "total" | "uploaded" | "ready" | "completed" | "errors";

export interface DocumentMetric {
  id: DocumentMetricId;
  label: string;
  value: number;
  tone: "blue" | "amber" | "emerald" | "red" | "slate";
}

export type DocumentStatusTone = "blue" | "amber" | "emerald" | "red" | "purple" | "slate";

export interface DocumentStatusDisplay {
  label: string;
  tone: DocumentStatusTone;
}

const STATUS_DISPLAY: Record<string, DocumentStatusDisplay> = {
  uploaded: { label: "Subido", tone: "blue" },
  extracting_text: { label: "Extrayendo texto", tone: "amber" },
  ocr_required: { label: "Requiere OCR", tone: "amber" },
  ocr_processing: { label: "Procesando OCR", tone: "purple" },
  processing: { label: "Procesando", tone: "purple" },
  ready_for_review: { label: "Listo para revisión", tone: "emerald" },
  ai_reviewing: { label: "Pre-revisión IA", tone: "purple" },
  ai_review_done: { label: "IA finalizada", tone: "emerald" },
  human_review_done: { label: "Dictamen finalizado", tone: "emerald" },
  error: { label: "Error", tone: "red" },
};

export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "uploaded", label: "Subidos" },
  { value: "ready_for_review", label: "Listos para revisión" },
  { value: "human_review_done", label: "Finalizados" },
  { value: "error", label: "Errores" },
] as const;

export type DocumentStatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]["value"];

export function getFileExtension(filename: string): string {
  const extension = filename.split(".").pop();
  return extension ? extension.toUpperCase() : "DOC";
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

export function formatDocumentDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDocumentStatusDisplay(status: string): DocumentStatusDisplay {
  return STATUS_DISPLAY[status] ?? { label: status.replaceAll("_", " "), tone: "slate" };
}

export function getStatusBadgeClass(tone: DocumentStatusTone): string {
  const classes: Record<DocumentStatusTone, string> = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    red: "border-red-100 bg-red-50 text-red-600",
    purple: "border-violet-100 bg-violet-50 text-violet-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return classes[tone];
}

export function getDocumentMetrics(documents: DocumentInfo[]): DocumentMetric[] {
  const uploaded = documents.filter((document) => document.status === "uploaded").length;
  const ready = documents.filter((document) => document.status === "ready_for_review").length;
  const completed = documents.filter((document) => document.status === "human_review_done").length;
  const errors = documents.filter((document) => document.status === "error").length;

  return [
    { id: "total", label: "Total", value: documents.length, tone: "slate" },
    { id: "uploaded", label: "Subidos", value: uploaded, tone: "blue" },
    { id: "ready", label: "Listos", value: ready, tone: "emerald" },
    { id: "completed", label: "Finalizados", value: completed, tone: "emerald" },
    { id: "errors", label: "Errores", value: errors, tone: "red" },
  ];
}

export function filterDocuments(
  documents: DocumentInfo[],
  searchTerm: string,
  statusFilter: DocumentStatusFilter
): DocumentInfo[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return documents.filter((document) => {
    const matchesSearch = !normalizedSearch || document.filename.toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === "all" || document.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}
```

- [ ] **Step 2: Run focused lint for the helper**

Run:

```powershell
npx eslint components/documents/document-display.ts
```

from `apps/web`.

Expected: exit code `0`.

- [ ] **Step 3: Commit Task 1**

```powershell
git add apps/web/components/documents/document-display.ts
git commit -m "feat: add document display helpers"
```

---

### Task 2: Connect `DocumentUploadClient` to Real Profile and Document History

**Files:**
- Modify: `apps/web/components/documents/DocumentUploadClient.tsx`

- [ ] **Step 1: Update imports**

In `DocumentUploadClient.tsx`, update the imports to include `useMemo`, `Link`, `DocumentInfo`, and the new helpers:

```ts
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, DocumentInfo, getErrorMessage, UserProfile } from "@/lib/api";
import {
  filterDocuments,
  formatDocumentDate,
  formatFileSize,
  getDocumentMetrics,
  getDocumentStatusDisplay,
  getFileExtension,
  getStatusBadgeClass,
  STATUS_FILTER_OPTIONS,
  type DocumentStatusFilter,
} from "@/components/documents/document-display";
```

Keep the existing visual imports from `lucide-react`, and add `Calendar`, `Download`, `RefreshCw`, `Search`, `ShieldAlert`, and `Table2` to that icon import.

- [ ] **Step 2: Replace router usage and document state**

At the top of `DocumentUploadClient`, replace:

```ts
const router = useRouter();
const [profile, setProfile] = useState<UserProfile | null>(null);
const [loadingProfile, setLoadingProfile] = useState(true);
```

with:

```ts
const { push } = useRouter();
const [profile, setProfile] = useState<UserProfile | null>(null);
const [documents, setDocuments] = useState<DocumentInfo[]>([]);
const [loadingInitialData, setLoadingInitialData] = useState(true);
const [loadingDocuments, setLoadingDocuments] = useState(false);
const [documentsError, setDocumentsError] = useState<string | null>(null);
const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState<DocumentStatusFilter>("all");
```

- [ ] **Step 3: Add `loadDocuments` and parallel initial load**

Replace the existing profile-only `useEffect` with:

```ts
const loadDocuments = async () => {
  setLoadingDocuments(true);
  setDocumentsError(null);

  try {
    const data = await api.get<DocumentInfo[]>("/documents");
    setDocuments(data);
  } catch (err: unknown) {
    setDocumentsError(getErrorMessage(err, "No se pudo cargar el historial de documentos."));
  } finally {
    setLoadingDocuments(false);
  }
};

useEffect(() => {
  const fetchInitialData = async () => {
    const token = api.getToken();
    if (!token) {
      push("/login");
      return;
    }

    try {
      const [profileData, documentsData] = await Promise.all([
        api.get<UserProfile>("/auth/me"),
        api.get<DocumentInfo[]>("/documents"),
      ]);
      setProfile(profileData);
      setDocuments(documentsData);
    } catch {
      api.logout();
      push("/login");
    } finally {
      setLoadingInitialData(false);
    }
  };

  fetchInitialData();
}, [push]);
```

- [ ] **Step 4: Add derived metrics and filtered documents**

Below `userForHeader`, add:

```ts
const documentMetrics = useMemo(() => getDocumentMetrics(documents), [documents]);
const filteredDocuments = useMemo(
  () => filterDocuments(documents, searchTerm, statusFilter),
  [documents, searchTerm, statusFilter]
);
```

- [ ] **Step 5: Update header loading prop**

Change the `AppHeader` call from:

```tsx
userProfile={loadingProfile ? null : userForHeader}
```

to:

```tsx
userProfile={userForHeader}
isUserLoading={loadingInitialData}
```

- [ ] **Step 6: Run focused lint**

Run:

```powershell
npx eslint components/documents/DocumentUploadClient.tsx components/documents/document-display.ts
```

from `apps/web`.

Expected: fix any errors introduced in this task before continuing.

- [ ] **Step 7: Commit Task 2**

```powershell
git add apps/web/components/documents/DocumentUploadClient.tsx apps/web/components/documents/document-display.ts
git commit -m "feat: load document history on upload screen"
```

---

### Task 3: Make Upload Refresh the Integrated Screen Instead of Redirecting

**Files:**
- Modify: `apps/web/components/documents/DocumentUploadClient.tsx`

- [ ] **Step 1: Replace upload success behavior**

In `handleUpload`, replace:

```ts
await api.uploadFile(file);
setSuccess(true);
setTimeout(() => {
  router.push("/documents");
}, 1500);
```

with:

```ts
await api.uploadFile(file);
setSuccess(true);
setFile(null);
await loadDocuments();
window.setTimeout(() => setSuccess(false), 3000);
```

- [ ] **Step 2: Ensure future-phase options do not imply execution**

Keep the configuration panel visible, but change the labels so the controls are clearly future-phase indicators. Use disabled checkboxes for `ocr`, `extraer`, `ia`, and `notificar`:

```tsx
<label className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B]">
  <input type="checkbox" checked disabled className="size-4 rounded border-[#CBD5E1] text-[#94A3B8]" />
  OCR automático <span className="font-medium text-[#94A3B8]">(Fase 3)</span>
</label>
<label className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B]">
  <input type="checkbox" checked disabled className="size-4 rounded border-[#CBD5E1] text-[#94A3B8]" />
  Extraer texto <span className="font-medium text-[#94A3B8]">(Fase 2)</span>
</label>
<label className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B]">
  <input type="checkbox" checked={false} disabled className="size-4 rounded border-[#CBD5E1] text-[#94A3B8]" />
  Pre-revisión IA <span className="font-medium text-[#94A3B8]">(Fase 5)</span>
</label>
<label className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B]">
  <input type="checkbox" checked={false} disabled className="size-4 rounded border-[#CBD5E1] text-[#94A3B8]" />
  Notificar revisor <span className="font-medium text-[#94A3B8]">(posterior)</span>
</label>
```

Remove the `modos` state if it is no longer used.

- [ ] **Step 3: Update success text**

Change the success text to avoid saying it will redirect:

```tsx
<span className="font-medium">Documento cargado. El historial se actualizó correctamente.</span>
```

- [ ] **Step 4: Run focused lint**

Run:

```powershell
npx eslint components/documents/DocumentUploadClient.tsx
```

from `apps/web`.

Expected: exit code `0`.

- [ ] **Step 5: Commit Task 3**

```powershell
git add apps/web/components/documents/DocumentUploadClient.tsx
git commit -m "feat: refresh documents after upload"
```

---

### Task 4: Add the Real History Table in the New Style

**Files:**
- Modify: `apps/web/components/documents/DocumentUploadClient.tsx`

- [ ] **Step 1: Add table toolbar below `Archivos en cola`**

Directly after the closing `</div>` of the `Archivos en cola` card, add a new card:

```tsx
<div className="rounded-[16px] border border-[#E5EAF2] bg-white p-6 shadow-sm md:p-8">
  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
    <div>
      <div className="flex items-center gap-2">
        <Table2 className="size-5 text-[#2563EB]" />
        <h2 className="text-[18px] font-bold text-[#0F172A]">Historial de documentos</h2>
      </div>
      <p className="mt-1 text-[13px] font-medium text-[#64748B]">
        Expedientes guardados en el almacenamiento local y registrados en Supabase.
      </p>
    </div>
    <Button
      type="button"
      variant="outline"
      onClick={loadDocuments}
      disabled={loadingDocuments}
      className="h-10 rounded-[8px] border-[#DDE5F0] bg-white px-4 text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
    >
      <RefreshCw className={loadingDocuments ? "size-4 animate-spin" : "size-4"} />
      Actualizar
    </Button>
  </div>

  <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_220px]">
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
      <input
        type="search"
        aria-label="Buscar documentos por nombre"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Buscar por nombre de archivo"
        className="h-10 w-full rounded-[8px] border border-[#DDE5F0] bg-white pl-10 pr-3 text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100"
      />
    </div>
    <select
      aria-label="Filtrar documentos por estado"
      value={statusFilter}
      onChange={(event) => setStatusFilter(event.target.value as DocumentStatusFilter)}
      className="h-10 rounded-[8px] border border-[#DDE5F0] bg-white px-3 text-[13px] font-semibold text-[#334155] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100"
    >
      {STATUS_FILTER_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>

  {documentsError && (
    <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">
      <ShieldAlert className="size-4" />
      {documentsError}
    </div>
  )}

  <div className="mt-5 overflow-x-auto">
    <table className="w-full min-w-[760px] text-left text-[13px]">
      <thead>
        <tr className="border-b border-[#E5EAF2] text-[#64748B]">
          <th className="pb-3 font-bold">Documento</th>
          <th className="pb-3 font-bold">Tipo</th>
          <th className="pb-3 font-bold">Tamaño</th>
          <th className="pb-3 font-bold">Fecha de carga</th>
          <th className="pb-3 font-bold">Estado</th>
          <th className="pb-3 text-right font-bold">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E5EAF2]">
        {loadingInitialData || loadingDocuments ? (
          <tr>
            <td colSpan={6} className="py-8 text-center text-[13px] font-medium text-[#64748B]">
              Cargando historial de documentos...
            </td>
          </tr>
        ) : filteredDocuments.length === 0 ? (
          <tr>
            <td colSpan={6} className="py-8 text-center text-[13px] font-medium text-[#64748B]">
              No hay documentos que coincidan con la búsqueda.
            </td>
          </tr>
        ) : (
          filteredDocuments.map((document) => {
            const status = getDocumentStatusDisplay(document.status);

            return (
              <tr key={document.id} className="group transition-colors hover:bg-[#F8FAFC]">
                <td className="py-3 pr-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileIcon className="size-4 shrink-0 text-red-500" />
                    <span className="block max-w-[280px] truncate font-semibold text-[#0F172A]">
                      {document.filename}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4 font-semibold text-[#64748B]">{getFileExtension(document.filename)}</td>
                <td className="py-3 pr-4 font-medium text-[#64748B]">{formatFileSize(document.size_bytes)}</td>
                <td className="py-3 pr-4 font-medium text-[#64748B]">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-[#94A3B8]" />
                    {formatDocumentDate(document.created_at)}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className={`inline-flex rounded-[6px] border px-2.5 py-1 text-[11px] font-bold ${getStatusBadgeClass(status.tone)}`}>
                    {status.label}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/documents/${document.id}`}>
                      <Button type="button" size="sm" variant="ghost" className="h-8 rounded-[7px] px-2 text-[12px] font-semibold text-[#334155] hover:bg-[#EEF4FF] hover:text-[#2563EB]">
                        Detalle
                      </Button>
                    </Link>
                    <Link href={`/documents/${document.id}/review`}>
                      <Button type="button" size="sm" variant="outline" className="h-8 rounded-[7px] border-[#BFDBFE] px-2 text-[12px] font-semibold text-[#2563EB] hover:bg-[#EFF6FF]">
                        <Eye className="size-3.5" />
                        Revisar
                      </Button>
                    </Link>
                    <a
                      href={api.getFileUrl(document.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-[7px] px-2 text-[12px] font-semibold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                    >
                      <Download className="size-3.5" />
                      Archivo
                    </a>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
</div>
```

- [ ] **Step 2: Verify table actions use existing endpoints**

Confirm no new API endpoint was introduced:

```powershell
rg -n "api\\.(get|post|put|delete)|getFileUrl" apps/web/components/documents/DocumentUploadClient.tsx
```

Expected endpoint usages:

- `api.get<UserProfile>("/auth/me")`
- `api.get<DocumentInfo[]>("/documents")`
- `api.uploadFile(file)`
- `api.getFileUrl(document.id)`

- [ ] **Step 3: Run focused lint**

Run:

```powershell
npx eslint components/documents/DocumentUploadClient.tsx components/documents/document-display.ts
```

from `apps/web`.

Expected: exit code `0`.

- [ ] **Step 4: Commit Task 4**

```powershell
git add apps/web/components/documents/DocumentUploadClient.tsx apps/web/components/documents/document-display.ts
git commit -m "feat: add integrated document history table"
```

---

### Task 5: Replace Mock Summary With Real Metrics and Fase 1 Copy

**Files:**
- Modify: `apps/web/components/documents/DocumentUploadClient.tsx`

- [ ] **Step 1: Replace right-panel summary values**

In the `Resumen` panel, replace the current hardcoded OCR and selected-file-only values with:

```tsx
<div className="grid grid-cols-2 gap-y-2 text-[12px] font-medium">
  <span className="text-[#64748B]">Archivos seleccionados:</span>
  <span className="text-right text-[#0F172A]">{file ? 1 : 0}</span>

  <span className="text-[#64748B]">Documentos registrados:</span>
  <span className="text-right text-[#0F172A]">{documents.length}</span>

  <span className="text-[#64748B]">Listos para revisión:</span>
  <span className="text-right text-[#0F172A]">
    {documents.filter((document) => document.status === "ready_for_review").length}
  </span>

  <span className="text-[#64748B]">Peso seleccionado:</span>
  <span className="text-right text-[#0F172A]">{file ? formatFileSize(file.size) : "0 KB"}</span>
</div>
```

- [ ] **Step 2: Add compact metrics below configuration**

Below the configuration card and above `Flujo del documento`, add:

```tsx
<div className="rounded-[16px] border border-[#E5EAF2] bg-white p-6 shadow-sm md:p-8">
  <h2 className="mb-4 text-[18px] font-bold text-[#0F172A]">Resumen documental</h2>
  <div className="grid grid-cols-2 gap-3">
    {documentMetrics.map((metric) => (
      <div key={metric.id} className="rounded-[10px] border border-[#E5EAF2] bg-[#F8FAFC] p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">{metric.label}</p>
        <p className="mt-1 text-[24px] font-bold leading-none text-[#0F172A]">{metric.value}</p>
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 3: Update misleading upload copy**

Change:

```tsx
<p className="mb-6 text-[14px] text-[#64748B]">PDF, DOCX o imágenes escaneadas</p>
```

to:

```tsx
<p className="mb-6 text-[14px] text-[#64748B]">PDF o DOCX en esta fase</p>
```

Remove the JPG and PNG badges from the accepted formats row so it only shows PDF and DOCX.

- [ ] **Step 4: Run focused lint**

Run:

```powershell
npx eslint components/documents/DocumentUploadClient.tsx
```

from `apps/web`.

Expected: exit code `0`.

- [ ] **Step 5: Commit Task 5**

```powershell
git add apps/web/components/documents/DocumentUploadClient.tsx
git commit -m "feat: show real document summary metrics"
```

---

### Task 6: Route `/documents` to Integrated Screen and Alias `/documents/upload`

**Files:**
- Modify: `apps/web/app/documents/page.tsx`
- Modify: `apps/web/app/documents/upload/page.tsx`

- [ ] **Step 1: Replace `/documents` route component**

Replace the entire contents of `apps/web/app/documents/page.tsx` with:

```tsx
import DocumentUploadClient from "@/components/documents/DocumentUploadClient";

export default function DocumentsPage() {
  return <DocumentUploadClient />;
}
```

- [ ] **Step 2: Redirect `/documents/upload` to `/documents`**

Replace the entire contents of `apps/web/app/documents/upload/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

export default function DocumentUploadPage() {
  redirect("/documents");
}
```

- [ ] **Step 3: Verify no primary route imports the legacy list**

Run:

```powershell
rg -n "DocumentsListClient|DocumentUploadClient" apps/web/app apps/web/components -S
```

Expected:

- `apps/web/app/documents/page.tsx` imports `DocumentUploadClient`.
- No route imports `DocumentsListClient`.
- `DocumentsListClient.tsx` may still exist as an unused legacy component.

- [ ] **Step 4: Run focused lint**

Run:

```powershell
npx eslint app/documents/page.tsx app/documents/upload/page.tsx components/documents/DocumentUploadClient.tsx
```

from `apps/web`.

Expected: exit code `0`.

- [ ] **Step 5: Commit Task 6**

```powershell
git add apps/web/app/documents/page.tsx apps/web/app/documents/upload/page.tsx apps/web/components/documents/DocumentUploadClient.tsx
git commit -m "feat: make documents route the integrated screen"
```

---

### Task 7: Final Verification

**Files:**
- Verify all files changed by this plan.

- [ ] **Step 1: Run focused lint on changed files**

Run from `apps/web`:

```powershell
npx eslint app/documents/page.tsx app/documents/upload/page.tsx components/documents/DocumentUploadClient.tsx components/documents/document-display.ts
```

Expected: exit code `0`.

- [ ] **Step 2: Run production build**

Run from the repo root:

```powershell
npm run build -w apps/web
```

Expected: Next.js build completes with exit code `0`.

- [ ] **Step 3: Run React Doctor diff**

Run from the repo root:

```powershell
npx -y react-doctor@latest apps/web --verbose --diff
```

Expected:

- Command exits successfully.
- Review diagnostics.
- Fix high-confidence issues introduced by this plan in `DocumentUploadClient.tsx` or `document-display.ts`.
- Do not perform broad unrelated cleanup in `app/admin/users/page.tsx`, `DocumentUploadClient` legacy sections outside this plan, or other pre-existing files unless the diagnostic points to code changed by this plan.

- [ ] **Step 4: Manual browser verification**

With the web server running on `http://localhost:3001`, verify:

1. Log in with `admin@revisiondocs.ai / password123`.
2. Open `http://localhost:3001/documents`.
3. Confirm the integrated upload screen appears.
4. Confirm the history table loads real documents from `GET /documents`.
5. Select a valid PDF or DOCX and confirm it appears in `Archivos en cola`.
6. Upload the file.
7. Confirm the success message appears without redirecting away.
8. Confirm the file clears from local queue.
9. Confirm the new document appears in `Historial de documentos`.
10. Confirm `Detalle`, `Revisar`, and `Archivo` actions navigate or open correctly.
11. Open `http://localhost:3001/documents/upload`.
12. Confirm it redirects to `/documents`.

- [ ] **Step 5: Final commit if verification caused fixes**

If Task 7 required fixes, commit them:

```powershell
git add apps/web/app/documents/page.tsx apps/web/app/documents/upload/page.tsx apps/web/components/documents/DocumentUploadClient.tsx apps/web/components/documents/document-display.ts
git commit -m "fix: polish integrated documents screen"
```

If Task 7 required no fixes, do not create an empty commit.

---

## Self-Review

Spec coverage:

- `/documents` as integrated screen: Task 6.
- `/documents/upload` alias/redirect: Task 6.
- Upload remains on `POST /documents/upload`: Task 3.
- Real history from `GET /documents`: Tasks 2 and 4.
- Metrics from real list: Task 5.
- Actions to detail/review/file: Task 4.
- No future-phase behavior activated: Task 3 and Task 5.
- Refresh history after upload: Task 3.
- Verification: Task 7.

Placeholder scan:

- No `TBD`, `TODO`, or open-ended implementation placeholders are used.
- Optional behavior is expressed as a fixed implementation choice: keep legacy component file unused and redirect `/documents/upload` to `/documents`.

Type consistency:

- `DocumentStatusFilter` is defined in `document-display.ts` and used in `DocumentUploadClient.tsx`.
- `DocumentInfo` is imported from the existing API client.
- Existing route paths match the App Router structure.
