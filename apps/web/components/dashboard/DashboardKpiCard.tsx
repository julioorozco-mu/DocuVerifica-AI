"use client";
/**
 * DashboardKpiCard — Mini tarjeta de KPI con sparkline.
 * Reutilizable para: Pendientes, En cola IA, Revisados hoy, Alertas críticas.
 */
import React from "react";
import {
  FileText, Cpu, CheckCircle2, AlertTriangle,
  TrendingUp, TrendingDown, ArrowRight
} from "lucide-react";

export interface KpiCardData {
  id: string;
  label: string;
  sublabel: string;
  value: number;
  trend: string;
  trendPositive: boolean;
  color: "blue" | "purple" | "green" | "red";
  icon: "file" | "cpu" | "check" | "alert";
  sparkline: number[];
}

const ICON_MAP = {
  file:  FileText,
  cpu:   Cpu,
  check: CheckCircle2,
  alert: AlertTriangle,
};

const COLOR_MAP: Record<string, { icon: string; bg: string; text: string; line: string; trend: string }> = {
  blue:   { icon: "text-blue-500",   bg: "bg-blue-50",   text: "text-blue-600",   line: "#3b82f6", trend: "text-blue-600"   },
  purple: { icon: "text-purple-500", bg: "bg-purple-50", text: "text-purple-600", line: "#a855f7", trend: "text-emerald-600"},
  green:  { icon: "text-emerald-500",bg: "bg-emerald-50",text: "text-emerald-600",line: "#10b981", trend: "text-emerald-600"},
  red:    { icon: "text-red-500",    bg: "bg-red-50",    text: "text-red-600",    line: "#ef4444", trend: "text-red-600"    },
};

interface Props {
  data: KpiCardData;
}

export default function DashboardKpiCard({ data }: Props) {
  const Icon = ICON_MAP[data.icon];
  const c = COLOR_MAP[data.color];
  const isAlert = data.id === "alertas_criticas";
  const isBarChart = isAlert || data.id === "revisados_hoy";
  const TrendIcon = data.trendPositive ? TrendingUp : TrendingDown;
  const min = Math.min(...data.sparkline);
  const max = Math.max(...data.sparkline);
  const range = Math.max(max - min, 1);
  const points = data.sparkline
    .map((value, index) => {
      const x = (index / Math.max(data.sparkline.length - 1, 1)) * 112;
      const y = 22 - ((value - min) / range) * 18;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex min-h-[128px] flex-col rounded-[14px] border border-[#E5EAF2] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="whitespace-nowrap text-[12px] font-medium text-[#334155]">{data.label}</p>
        </div>
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] ${c.bg}`}>
          <Icon className={`h-[18px] w-[18px] ${c.icon}`} />
        </div>
      </div>

      {/* Valor */}
      <p className={`mt-1 text-[25px] font-bold leading-none tracking-[-0.02em] ${isAlert ? c.text : "text-[#2563EB]"}`}>
        {data.value}
      </p>
      <p className="mt-1.5 text-[9px] text-[#64748B]">{data.sublabel}</p>

      {/* Sparkline */}
      <div className="mt-1.5 h-[24px]">
        {isBarChart ? (
          <div className="flex h-full items-end gap-1">
            {data.sparkline.concat(data.sparkline).map((value, index) => (
              <span
                key={`${value}-${index}`}
                className="w-1 rounded-t-[2px]"
                style={{
                  height: `${6 + ((value - min) / range) * 18}px`,
                  backgroundColor: c.line,
                }}
              />
            ))}
          </div>
        ) : (
          <svg viewBox="0 0 112 24" className="h-full w-full" aria-hidden="true">
            <polyline
              points={points}
              fill="none"
              stroke={c.line}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        )}
      </div>

      {/* Trend */}
      <div className="mt-auto flex items-center justify-between pt-1.5">
        {isAlert ? (
          <a href="#" className={`text-[10px] font-semibold ${c.trend} flex items-center gap-1`}>
            {data.trend} <ArrowRight className="h-3 w-3" />
          </a>
        ) : (
          <p className={`flex items-center gap-1 text-[10px] font-semibold ${c.trend}`}>
            <TrendIcon className="h-3 w-3" />
            {data.trend}
          </p>
        )}
      </div>
    </div>
  );
}
