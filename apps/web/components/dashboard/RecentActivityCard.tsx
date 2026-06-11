"use client";
/**
 * RecentActivityCard — Actividad reciente del sistema.
 * Log de los últimos eventos con icono, actor y tiempo relativo.
 */
import React from "react";
import { CheckCircle2, AlertTriangle, FileText, ArrowRight } from "lucide-react";
import { recentActivity } from "@/lib/mock-dashboard-data";

const ICON_MAP: Record<string, React.ElementType> = {
  check: CheckCircle2,
  alert: AlertTriangle,
  file:  FileText,
};

const TYPE_STYLE: Record<string, { icon: string; bg: string }> = {
  success: { icon: "text-emerald-500", bg: "bg-emerald-50" },
  warning: { icon: "text-amber-500",   bg: "bg-amber-50"   },
  info:    { icon: "text-blue-500",    bg: "bg-blue-50"    },
};

// TODO: Reemplazar recentActivity por prop al conectar con API real.

export default function RecentActivityCard() {
  const activities = recentActivity;

  return (
    <div className="h-[150px] overflow-hidden rounded-[14px] border border-[#E5EAF2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3.5 pb-2">
        <p className="text-[13px] font-semibold text-[#0F172A]">Actividad reciente</p>
      </div>

      {/* Lista */}
      <div className="space-y-1.5 px-5 pb-1">
        {activities.map((ev) => {
          const Icon = ICON_MAP[ev.icon] ?? FileText;
          const style = TYPE_STYLE[ev.type] ?? TYPE_STYLE.info;

          return (
            <div key={ev.id} className="flex items-start gap-3">
              {/* Icono */}
              <div className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[7px] ${style.bg}`}>
                <Icon className={`h-3 w-3 ${style.icon}`} />
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold leading-snug text-[#0F172A]">{ev.message}</p>
                <p className="mt-0.5 text-[9px] text-[#64748B]">
                  {ev.actor} • {ev.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <div className="flex justify-end px-5 pb-3">
        <button className="flex items-center gap-1 text-[10px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
          Ver toda la actividad <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
