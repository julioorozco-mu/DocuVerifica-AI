"use client";
/**
 * DocumentSummaryCard — Resumen de documentos por categoría.
 * Dona + lista con porcentajes, fiel al mockup.
 */
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { documentSummary } from "@/lib/mock-dashboard-data";

// TODO: Reemplazar documentSummary por prop al conectar con API real.

export default function DocumentSummaryCard() {
  const d = documentSummary;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <p className="text-[13px] font-semibold text-slate-800">Resumen de documentos</p>
      </div>

      {/* Contenido */}
      <div className="flex items-center gap-4 px-5 pb-5">
        {/* Dona */}
        <div className="relative w-[120px] h-[120px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={d.categories}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={56}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {d.categories.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-900">
              {d.total.toLocaleString("es-MX")}
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wide font-medium">Total</span>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 space-y-2">
          {d.categories.map((cat) => (
            <div key={cat.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-[12px] text-slate-600 truncate">{cat.label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[12px] font-semibold text-slate-800">
                  {cat.value.toLocaleString("es-MX")}
                </span>
                <span className="text-[11px] text-slate-400 w-9 text-right">
                  ({cat.pct}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer link */}
      <div className="border-t border-slate-100 px-5 py-2.5">
        <button className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">
          Ver todos los documentos →
        </button>
      </div>
    </div>
  );
}
