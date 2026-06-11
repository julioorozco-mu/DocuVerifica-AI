"use client";
/**
 * CriticalAlertsCard — Alertas críticas del sistema.
 * Lista de alertas con nivel de prioridad Alta/Media.
 */
import React from "react";
import { AlertCircle, FileCheck, Cpu, ArrowRight } from "lucide-react";
import { criticalAlerts } from "@/lib/mock-dashboard-data";

const ICON_MAP: Record<string, React.ElementType> = {
  "alert-circle": AlertCircle,
  "file-check":   FileCheck,
  "cpu":          Cpu,
};

// TODO: Reemplazar criticalAlerts por prop al conectar con API real.

export default function CriticalAlertsCard() {
  const alerts = criticalAlerts;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <p className="text-[13px] font-semibold text-slate-800">Alertas críticas</p>
        <button className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">
          Ver todas →
        </button>
      </div>

      {/* Lista */}
      <div className="px-5 pb-5 space-y-3">
        {alerts.map((alert) => {
          const Icon = ICON_MAP[alert.icon] ?? AlertCircle;
          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {/* Icono */}
              <div className={`w-8 h-8 rounded-lg ${alert.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`w-4 h-4 ${alert.iconColor}`} />
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-slate-800 leading-snug">{alert.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{alert.meta}</p>
              </div>

              {/* Badge prioridad */}
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${alert.priorityColor} border-transparent`}>
                {alert.priority}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
