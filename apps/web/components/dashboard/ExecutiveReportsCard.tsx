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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <p className="text-[13px] font-semibold text-slate-800">Reportes ejecutivos</p>
      </div>

      {/* Grid de reportes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pb-5">
        {reports.map((report) => {
          const Icon = ICON_MAP[report.icon] ?? BarChart2;
          const isDownload = report.icon === "download";
          return (
            <button
              key={report.id}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all text-center
                ${isDownload
                  ? "border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                ${isDownload ? "bg-blue-100" : "bg-white border border-slate-200"}`}
              >
                <Icon className={`w-5 h-5 ${isDownload ? "text-blue-500" : "text-slate-500"}`} />
              </div>
              <div>
                <p className={`text-[12px] font-semibold ${isDownload ? "text-blue-700" : "text-slate-700"}`}>
                  {report.label}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{report.sublabel}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer link */}
      <div className="border-t border-slate-100 px-5 py-2.5">
        <button className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">
          Ver todos los reportes →
        </button>
      </div>
    </div>
  );
}
