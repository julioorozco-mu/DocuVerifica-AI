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
