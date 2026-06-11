"use client";
/**
 * DashboardSummaryCard — Tarjeta grande "Resumen operativo".
 * Muestra documentos totales, completados, en procesamiento y que requieren atención.
 */
import React from "react";
import { FileText, CheckCircle2, Clock4, AlertTriangle, TrendingUp, Zap } from "lucide-react";
import { dashboardSummary } from "@/lib/mock-dashboard-data";

// TODO: Para conectar con backend real, recibir `data` como prop o hacer fetch desde DashboardClient.

interface DashboardSummaryCardProps {
  data?: typeof dashboardSummary;
}

export default function DashboardSummaryCard({ data = dashboardSummary }: DashboardSummaryCardProps) {
  const d = data;

  return (
    <div className="min-h-[128px] overflow-hidden rounded-[14px] border border-[#E5EAF2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      {/* Encabezado */}
      <div className="px-5 pt-3 pb-2.5">
        <p className="text-[14px] font-semibold text-[#0F172A]">Resumen operativo</p>
        <p className="mt-1 text-[11px] text-[#334155]">Panorama general del sistema</p>
      </div>

      {/* 4 métricas */}
      <div className="grid grid-cols-2 px-5 sm:grid-cols-4">
        {/* Total */}
        <div className="border-r border-b border-[#E5EAF2] py-2 pr-3 sm:border-b-0">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#EEF4FF]">
              <FileText className="h-3.5 w-3.5 text-[#2563EB]" />
            </div>
            <span className="text-[10px] font-medium leading-tight text-[#64748B]">Documentos totales</span>
          </div>
          <p className="text-[22px] font-bold leading-none tracking-[-0.01em] text-[#0F172A]">
            {d.totalDocumentos.toLocaleString("es-MX")}
          </p>
          <p className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
            <TrendingUp className="h-3 w-3" />
            {d.tendencia}
          </p>
        </div>

        {/* Completados */}
        <div className="border-r border-b border-[#E5EAF2] px-3 py-2 sm:border-b-0">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-emerald-50">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-medium leading-tight text-[#64748B]">Completados</span>
          </div>
          <p className="text-[22px] font-bold leading-none tracking-[-0.01em] text-[#0F172A]">
            {d.completados.toLocaleString("es-MX")}
          </p>
          <p className="mt-1.5 text-[9px] text-[#64748B]">{d.completadosPct}% del total</p>
        </div>

        {/* En procesamiento */}
        <div className="border-r border-[#E5EAF2] px-3 py-2">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-violet-50">
              <Clock4 className="h-3.5 w-3.5 text-violet-600" />
            </div>
            <span className="text-[10px] font-medium leading-tight text-[#64748B]">En procesamiento</span>
          </div>
          <p className="text-[22px] font-bold leading-none tracking-[-0.01em] text-[#0F172A]">
            {d.enProcesamiento.toLocaleString("es-MX")}
          </p>
          <p className="mt-1.5 text-[9px] text-[#2563EB]">{d.enProcesamientoPct}% del total</p>
        </div>

        {/* Requieren atención */}
        <div className="py-2 pl-3">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-orange-50">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <span className="text-[10px] font-medium leading-tight text-[#64748B]">Requieren atención</span>
          </div>
          <p className="text-[22px] font-bold leading-none tracking-[-0.01em] text-[#0F172A]">
            {d.requierenAtencion.toLocaleString("es-MX")}
          </p>
          <p className="mt-1.5 text-[9px] text-red-600">{d.requierenAtencionPct}% del total</p>
        </div>
      </div>

      {/* Insight footer */}
      <div className="mx-4 mt-2 mb-2 flex items-center justify-between gap-4 rounded-[9px] border border-[#D7E3F8] bg-[#F2F7FF] px-4 py-1.5">
        <div className="flex items-center gap-3">
          <Zap className="h-4 w-4 flex-shrink-0 text-[#2563EB]" />
          <p className="text-[10px] font-medium text-[#2563EB]">{d.insight}</p>
        </div>
        <button className="whitespace-nowrap rounded-[7px] border border-[#BFD3FA] bg-white px-4 py-1.5 text-[10px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
          Ver reportes
        </button>
      </div>
    </div>
  );
}
