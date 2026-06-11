"use client";
/**
 * ExecutiveReportsCard — Reportes ejecutivos.
 * 3 bloques de reporte + botón de exportar.
 */
import React from "react";
import { BarChart2, Users, Clock, Download } from "lucide-react";
import { executiveReports } from "@/lib/mock-dashboard-data";

const ICON_MAP: Record<string, React.ElementType> = {
  "bar-chart": BarChart2,
  "users":     Users,
  "clock":     Clock,
  "download":  Download,
};

// TODO: Reemplazar executiveReports por prop al conectar con API real.

export default function ExecutiveReportsCard() {
  const reports = executiveReports;

  return (
    <div className="h-[150px] overflow-hidden rounded-[14px] border border-[#E5EAF2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="px-5 pt-3.5 pb-2">
        <p className="text-[13px] font-semibold text-[#0F172A]">Reportes ejecutivos</p>
      </div>

      {/* Grid de reportes */}
      <div className="grid grid-cols-2 gap-3 px-5 pb-1.5 sm:grid-cols-4">
        {reports.map((report) => {
          const Icon = ICON_MAP[report.icon] ?? BarChart2;
          const isDownload = report.icon === "download";
          return (
            <button
              key={report.id}
              className={`flex h-[64px] flex-col items-start justify-center gap-1.5 rounded-[8px] border px-3.5 text-left transition-colors
                ${isDownload
                  ? "border-[#D8E6FF] bg-[#F5F9FF] text-[#2563EB] hover:bg-[#EEF4FF]"
                  : "border-transparent bg-[#F8FAFC] text-[#334155] hover:bg-[#F1F5F9]"
                }`}
            >
              <div className={`flex h-6 w-6 items-center justify-center rounded-[6px] border
                ${isDownload ? "border-[#BFD3FA] bg-white" : "border-[#CFE0FA] bg-white"}`}
              >
                <Icon className={`h-3.5 w-3.5 ${isDownload ? "text-[#7C3AED]" : "text-[#2563EB]"}`} />
              </div>
              <div>
                <p className={`whitespace-nowrap text-[11px] font-semibold leading-none ${isDownload ? "text-[#0F172A]" : "text-[#0F172A]"}`}>
                  {report.label}
                </p>
                <p className="mt-1 whitespace-nowrap text-[10px] leading-none text-[#64748B]">{report.sublabel}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer link */}
      <div className="px-5 pb-3">
        <button className="text-[10px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
          Ver todos los reportes →
        </button>
      </div>
    </div>
  );
}
