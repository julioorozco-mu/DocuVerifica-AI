"use client";
/**
 * DashboardSummaryCard — Tarjeta grande "Resumen operativo".
 * Muestra documentos totales, completados, en procesamiento y que requieren atención.
 */
import React from "react";
import { FileText, CheckCircle2, Clock4, AlertTriangle, TrendingUp, Zap } from "lucide-react";
import { dashboardSummary } from "@/lib/mock-dashboard-data";

// TODO: Para conectar con backend real, recibir `data` como prop o hacer fetch desde DashboardClient.

export default function DashboardSummaryCard() {
  const d = dashboardSummary;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Encabezado */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <p className="text-[13px] font-semibold text-slate-800">Resumen operativo</p>
        <p className="text-[11px] text-slate-500 mt-0.5">Panorama general del sistema</p>
      </div>

      {/* 4 métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {/* Total */}
        <div className="px-5 py-4 border-r border-b sm:border-b-0 border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-[11px] text-slate-500 font-medium leading-tight">Documentos totales</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {d.totalDocumentos.toLocaleString("es-MX")}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {d.tendencia}
          </p>
        </div>

        {/* Completados */}
        <div className="px-5 py-4 border-r border-b sm:border-b-0 border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-[11px] text-slate-500 font-medium leading-tight">Completados</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {d.completados.toLocaleString("es-MX")}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{d.completadosPct}% del total</p>
        </div>

        {/* En procesamiento */}
        <div className="px-5 py-4 border-r border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock4 className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[11px] text-slate-500 font-medium leading-tight">En procesamiento</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {d.enProcesamiento.toLocaleString("es-MX")}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{d.enProcesamientoPct}% del total</p>
        </div>

        {/* Requieren atención */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-[11px] text-slate-500 font-medium leading-tight">Requieren atención</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {d.requierenAtencion.toLocaleString("es-MX")}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{d.requierenAtencionPct}% del total</p>
        </div>
      </div>

      {/* Insight footer */}
      <div className="px-5 py-3 bg-blue-50 border-t border-blue-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <p className="text-[11px] text-blue-700 font-medium">{d.insight}</p>
        </div>
        <button className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap">
          Ver reportes
        </button>
      </div>
    </div>
  );
}
