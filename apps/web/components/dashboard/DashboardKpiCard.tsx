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
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar
} from "recharts";

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
  const sparkData = data.sparkline.map((v, i) => ({ i, v }));

  const isAlert = data.id === "alertas_criticas";
  const TrendIcon = data.trendPositive ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 min-h-[160px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-semibold text-slate-600">{data.label}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{data.sublabel}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
      </div>

      {/* Valor */}
      <p className={`text-3xl font-bold tracking-tight ${isAlert ? c.text : "text-slate-900"}`}>
        {data.value}
      </p>

      {/* Sparkline */}
      <div className="flex-1 min-h-[40px]">
        <ResponsiveContainer width="100%" height={40}>
          {isAlert ? (
            <BarChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Bar dataKey="v" fill={c.line} radius={[2, 2, 0, 0]} barSize={8} />
            </BarChart>
          ) : (
            <LineChart data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={c.line}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Trend */}
      <div className="flex items-center justify-between">
        {isAlert ? (
          <a href="#" className={`text-[11px] font-semibold ${c.trend} flex items-center gap-1`}>
            {data.trend} <ArrowRight className="w-3 h-3" />
          </a>
        ) : (
          <p className={`text-[11px] font-semibold flex items-center gap-1 ${c.trend}`}>
            <TrendIcon className="w-3 h-3" />
            {data.trend}
          </p>
        )}
      </div>
    </div>
  );
}
