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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <p className="text-[13px] font-semibold text-slate-800">Actividad reciente</p>
      </div>

      {/* Lista */}
      <div className="px-5 pb-5 space-y-3">
        {activities.map((ev) => {
          const Icon = ICON_MAP[ev.icon] ?? FileText;
          const style = TYPE_STYLE[ev.type] ?? TYPE_STYLE.info;

          return (
            <div key={ev.id} className="flex items-start gap-3">
              {/* Icono */}
              <div className={`w-7 h-7 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`w-3.5 h-3.5 ${style.icon}`} />
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-slate-700 leading-snug font-medium">{ev.message}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {ev.actor} • {ev.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <div className="border-t border-slate-100 px-5 py-2.5 flex justify-end">
        <button className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          Ver toda la actividad <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
