"use client";
/**
 * AiQueueStatusCard — Estado general de la cola IA.
 * Dona CSS + lista de categorías con iconos.
 */
import React from "react";
import { Clock, Cpu, User, AlertCircle, CheckCircle2, Settings } from "lucide-react";
import { queueStatus } from "@/lib/mock-dashboard-data";

const ICON_MAP: Record<string, React.ElementType> = {
  clock:  Clock,
  cpu:    Cpu,
  user:   User,
  alert:  AlertCircle,
  check:  CheckCircle2,
};

// TODO: Reemplazar queueStatus por prop recibida desde DashboardClient al conectar con API.

interface AiQueueStatusCardProps {
  data?: typeof queueStatus;
}

export default function AiQueueStatusCard({ data = queueStatus }: AiQueueStatusCardProps) {
  const q = data;
  const totalForChart = Math.max(q.total, 1);
  const gradient = q.items.reduce(
    (acc, item) => {
      const end = acc.current + (item.value / totalForChart) * 100;
      return {
        current: end,
        segments: [...acc.segments, `${item.color} ${acc.current}% ${end}%`],
      };
    },
    { current: 0, segments: [] as string[] }
  ).segments.join(", ") || "#E5EAF2 0% 100%";

  return (
    <div className="h-[216px] overflow-hidden rounded-[14px] border border-[#E5EAF2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div>
          <p className="text-[13px] font-semibold text-[#0F172A]">Estado general de la cola IA</p>
        </div>
        <button className="text-[#64748B] transition-colors hover:text-[#0F172A]">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex items-center gap-3 px-5 pb-2">
        {/* Lista */}
        <div className="flex-1 space-y-1.5">
          {q.items.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? Clock;
            return (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full ${item.bgColor}`}>
                    <Icon className={`h-3 w-3 ${item.textColor}`} />
                  </span>
                  <span className="text-[11px] text-[#334155]">{item.label}</span>
                </div>
                <span className="text-[11px] font-semibold text-[#0F172A]">{item.value}</span>
              </div>
            );
          })}
        </div>

        {/* Dona */}
        <div className="relative h-[116px] w-[116px] flex-shrink-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(${gradient})` }}
          />
          <div className="absolute inset-[22px] rounded-full bg-white" />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] font-bold leading-none text-[#0F172A]">{q.total}</span>
            <span className="mt-1 text-[10px] font-medium text-[#64748B]">Total en cola</span>
          </div>
        </div>
      </div>

      {/* Footer link */}
      <div className="px-5 pb-3">
        <button className="flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
          Ver detalle de la cola →
        </button>
      </div>
    </div>
  );
}
