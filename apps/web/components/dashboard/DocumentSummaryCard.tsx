"use client";
/**
 * DocumentSummaryCard — Resumen de documentos por categoría.
 * Dona + lista con porcentajes, fiel al mockup.
 */
import React from "react";
import { documentSummary } from "@/lib/mock-dashboard-data";

// TODO: Reemplazar documentSummary por prop al conectar con API real.

export default function DocumentSummaryCard() {
  const d = documentSummary;
  const gradient = d.categories.reduce(
    (acc, cat) => {
      const end = acc.current + (cat.value / d.total) * 100;
      return {
        current: end,
        segments: [...acc.segments, `${cat.color} ${acc.current}% ${end}%`],
      };
    },
    { current: 0, segments: [] as string[] }
  ).segments.join(", ");

  return (
    <div className="h-[216px] overflow-hidden rounded-[14px] border border-[#E5EAF2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-[13px] font-semibold text-[#0F172A]">Resumen de documentos</p>
      </div>

      {/* Contenido */}
      <div className="flex items-center gap-3 px-5 pb-2">
        {/* Dona */}
        <div className="relative h-[116px] w-[116px] flex-shrink-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(${gradient})` }}
          />
          <div className="absolute inset-[22px] rounded-full bg-white" />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[20px] font-bold leading-none text-[#0F172A]">
              {d.total.toLocaleString("es-MX")}
            </span>
            <span className="mt-1 text-[10px] font-medium text-[#64748B]">Total</span>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 space-y-1.5">
          {d.categories.map((cat) => (
            <div key={cat.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="truncate text-[11px] text-[#334155]">{cat.label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] font-semibold text-[#0F172A]">
                  {cat.value.toLocaleString("es-MX")}
                </span>
                <span className="w-8 text-right text-[10px] text-[#64748B]">
                  ({cat.pct}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer link */}
      <div className="px-5 pb-3">
        <button className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
          Ver todos los documentos →
        </button>
      </div>
    </div>
  );
}
