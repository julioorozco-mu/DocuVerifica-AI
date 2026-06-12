"use client";
/**
 * CriticalAlertsCard — Alertas críticas del sistema.
 * Lista de alertas con nivel de prioridad Alta/Media.
 */
import React from "react";
import { AlertCircle, FileCheck, Cpu } from "lucide-react";
import { criticalAlerts } from "@/lib/mock-dashboard-data";

const ICON_MAP: Record<string, React.ElementType> = {
  "alert-circle": AlertCircle,
  "file-check":   FileCheck,
  "cpu":          Cpu,
};

// TODO: Reemplazar criticalAlerts por prop al conectar con API real.

export interface CriticalAlertItem {
  id: string;
  title: string;
  meta: string;
  priority: string;
  priorityColor: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

interface CriticalAlertsCardProps {
  alerts?: CriticalAlertItem[];
}

export default function CriticalAlertsCard({ alerts = criticalAlerts }: CriticalAlertsCardProps) {

  return (
    <div className="h-[216px] overflow-hidden rounded-[14px] border border-[#E5EAF2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <p className="text-[13px] font-semibold text-[#0F172A]">Alertas críticas</p>
        <button className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
          Ver todas →
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-1.5 px-5 pb-3">
        {alerts.map((alert) => {
          const Icon = ICON_MAP[alert.icon] ?? AlertCircle;
          return (
            <div
              key={alert.id}
              className="flex min-h-[45px] cursor-pointer items-center gap-2.5 rounded-[9px] border border-transparent bg-red-50/70 px-2.5 py-1.5 transition-colors hover:bg-red-50"
            >
              {/* Icono */}
              <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px] ${alert.iconBg}`}>
                <Icon className={`h-3.5 w-3.5 ${alert.iconColor}`} />
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <p className="line-clamp-2 text-[11px] font-semibold leading-[1.15] text-[#0F172A]">{alert.title}</p>
                <p className="mt-0.5 text-[10px] leading-none text-[#64748B]">{alert.meta}</p>
              </div>

              {/* Badge prioridad */}
              <span className={`whitespace-nowrap rounded-[7px] border border-transparent px-2.5 py-1 text-[10px] font-semibold ${alert.priorityColor}`}>
                {alert.priority}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
