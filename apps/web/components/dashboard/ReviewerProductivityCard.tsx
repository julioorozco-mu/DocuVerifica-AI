"use client";
/**
 * ReviewerProductivityCard — Productividad por revisor (esta semana).
 * Barras de progreso horizontales con avatars iniciales.
 */
import React from "react";
import { reviewerProductivity } from "@/lib/mock-dashboard-data";

// TODO: Reemplazar reviewerProductivity por prop al conectar con API real.

export default function ReviewerProductivityCard() {
  const reviewers = reviewerProductivity;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <p className="text-[13px] font-semibold text-slate-800">
          Productividad por revisor{" "}
          <span className="text-slate-400 font-normal">(esta semana)</span>
        </p>
      </div>

      {/* Lista */}
      <div className="px-5 pb-5 space-y-3">
        {reviewers.map((r) => {
          const pct = Math.round((r.reviews / r.max) * 100);
          return (
            <div key={r.rank} className="flex items-center gap-3">
              {/* Rank */}
              <span className="text-[11px] text-slate-400 w-3 flex-shrink-0 font-medium">{r.rank}</span>

              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full ${r.color} flex items-center justify-center flex-shrink-0`}
              >
                <span className="text-[10px] font-bold text-white">{r.initials}</span>
              </div>

              {/* Nombre + barra */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-slate-700 truncate">{r.name}</span>
                  <span className="text-[12px] font-semibold text-slate-800 ml-2">{r.reviews}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <div className="border-t border-slate-100 px-5 py-2.5">
        <button className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">
          Ver ranking completo →
        </button>
      </div>
    </div>
  );
}
