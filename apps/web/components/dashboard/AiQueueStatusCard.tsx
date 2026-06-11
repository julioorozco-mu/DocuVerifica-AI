"use client";
/**
 * AiQueueStatusCard — Estado general de la cola IA.
 * Dona de Recharts + lista de categorías con iconos.
 */
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
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

export default function AiQueueStatusCard() {
  const q = queueStatus;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-[13px] font-semibold text-slate-800">Estado general de la cola IA</p>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex items-center gap-4 px-5 pb-5">
        {/* Lista */}
        <div className="flex-1 space-y-2.5">
          {q.items.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? Clock;
            return (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${item.textColor}`} />
                  <span className="text-[12px] text-slate-600">{item.label}</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-800">{item.value}</span>
              </div>
            );
          })}
        </div>

        {/* Dona */}
        <div className="relative w-[110px] h-[110px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={q.items}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {q.items.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-900">{q.total}</span>
            <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wide">Total en cola</span>
          </div>
        </div>
      </div>

      {/* Footer link */}
      <div className="border-t border-slate-100 px-5 py-2.5">
        <button className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          Ver detalle de la cola →
        </button>
      </div>
    </div>
  );
}
