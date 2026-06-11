/**
 * StatusPill — Componente atómico reutilizable para mostrar estados de documentos.
 * Usado en: tabla de documentos, alertas, cola IA.
 */
import React from "react";

export type StatusVariant =
  | "cumple"
  | "no_cumple"
  | "en_cola_ia"
  | "requiere_revision"
  | "no_encontrado"
  | "pendiente"
  | "completado"
  | "procesando";

const CONFIG: Record<StatusVariant, { label: string; className: string }> = {
  cumple:              { label: "Cumple",             className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  no_cumple:           { label: "No cumple",          className: "bg-red-100 text-red-700 border-red-200" },
  en_cola_ia:          { label: "En cola IA",         className: "bg-purple-100 text-purple-700 border-purple-200" },
  requiere_revision:   { label: "Requiere revisión",  className: "bg-amber-100 text-amber-700 border-amber-200" },
  no_encontrado:       { label: "No encontrado",      className: "bg-slate-100 text-slate-600 border-slate-200" },
  pendiente:           { label: "Pendiente",          className: "bg-slate-100 text-slate-600 border-slate-200" },
  completado:          { label: "Completado",         className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  procesando:          { label: "Procesando",         className: "bg-blue-100 text-blue-700 border-blue-200" },
};

// Mapear strings del mock al tipo interno
const LABEL_MAP: Record<string, StatusVariant> = {
  "Cumple":             "cumple",
  "No cumple":          "no_cumple",
  "En cola IA":         "en_cola_ia",
  "Requiere revisión":  "requiere_revision",
  "No encontrado":      "no_encontrado",
  "Pendiente":          "pendiente",
  "Completado":         "completado",
  "Procesando":         "procesando",
};

interface StatusPillProps {
  status: string | null | undefined;
}

export default function StatusPill({ status }: StatusPillProps) {
  if (!status) {
    return <span className="text-[12px] text-slate-400">—</span>;
  }

  const variant = LABEL_MAP[status] ?? "pendiente";
  const { label, className } = CONFIG[variant];

  return (
    <span
      className={`inline-flex min-w-[62px] items-center justify-center rounded-[6px] border px-2 py-0.5 text-[10px] font-semibold leading-4 ${className}`}
    >
      {label}
    </span>
  );
}
