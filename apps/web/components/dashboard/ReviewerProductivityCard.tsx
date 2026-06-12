"use client";
/**
 * ReviewerProductivityCard — Productividad por revisor (esta semana).
 * Barras de progreso horizontales con avatars iniciales.
 */
import React from "react";
import { reviewerProductivity } from "@/lib/mock-dashboard-data";

// TODO: Reemplazar reviewerProductivity por prop al conectar con API real.

export interface ReviewerProductivityItem {
  rank: number;
  name: string;
  reviews: number;
  max: number;
}

interface ReviewerProductivityCardProps {
  reviewers?: ReviewerProductivityItem[];
}

export default function ReviewerProductivityCard({
  reviewers = reviewerProductivity,
}: ReviewerProductivityCardProps) {

  return (
    <div className="h-[216px] overflow-hidden rounded-[14px] border border-[#E5EAF2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-[13px] font-semibold text-[#0F172A]">
          Productividad por revisor{" "}
          <span className="text-[10px] font-normal text-[#334155]">(esta semana)</span>
        </p>
      </div>

      {/* Lista */}
      <div className="space-y-1.5 px-5 pb-2">
        {reviewers.map((r) => {
          const pct = Math.round((r.reviews / r.max) * 100);
          return (
            <div key={r.rank} className="flex items-center gap-3">
              {/* Rank */}
              <span className="w-3 flex-shrink-0 text-[11px] font-medium text-[#334155]">{r.rank}</span>

              {/* Nombre + barra */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="truncate text-[11px] font-medium text-[#0F172A]">{r.name}</span>
                  <span className="ml-2 text-[11px] font-semibold text-[#0F172A]">{r.reviews}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#EEF2F7]">
                  <div
                    className="h-full rounded-full bg-[#4F83F7] transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <div className="px-5 pb-3">
        <button className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
          Ver ranking completo →
        </button>
      </div>
    </div>
  );
}
