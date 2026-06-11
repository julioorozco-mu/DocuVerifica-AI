"use client";
/**
 * LatestDocumentsTable — Tabla "Últimos documentos".
 * Columnas: Folio, Documento, Tipo, Revisor, Estado IA, Estado humano, Fecha, Acción.
 */
import React from "react";
import Link from "next/link";
import { FileText, MoreVertical, ArrowRight } from "lucide-react";
import { latestDocuments } from "@/lib/mock-dashboard-data";
import StatusPill from "@/components/ui/StatusPill";

// TODO: Reemplazar latestDocuments por prop al conectar con API real.

export default function LatestDocumentsTable() {
  const docs = latestDocuments;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <p className="text-[14px] font-semibold text-slate-800">Últimos documentos</p>
        <Link
          href="/documents"
          className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Ver todos los documentos <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          {/* Head */}
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Folio", "Documento", "Tipo", "Revisor", "Estado IA", "Estado humano", "Fecha", "Acción"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-50">
            {docs.map((doc) => (
              <tr
                key={doc.id}
                className="hover:bg-slate-50 transition-colors group"
              >
                {/* Folio */}
                <td className="px-4 py-3">
                  <span className="text-[12px] font-mono font-medium text-slate-500">{doc.folio}</span>
                </td>

                {/* Documento */}
                <td className="px-4 py-3">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="flex items-center gap-2 text-[12px] font-medium text-blue-600 hover:text-blue-700 hover:underline max-w-[200px] truncate"
                  >
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="truncate">{doc.filename}</span>
                  </Link>
                </td>

                {/* Tipo */}
                <td className="px-4 py-3">
                  <span className="text-[12px] text-slate-600">{doc.tipo}</span>
                </td>

                {/* Revisor */}
                <td className="px-4 py-3">
                  {doc.revisor ? (
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full ${doc.revisor.color} flex items-center justify-center flex-shrink-0`}
                      >
                        <span className="text-[9px] font-bold text-white">{doc.revisor.initials}</span>
                      </div>
                      <span className="text-[12px] text-slate-700 whitespace-nowrap">{doc.revisor.name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[12px]">—</span>
                  )}
                </td>

                {/* Estado IA */}
                <td className="px-4 py-3">
                  <StatusPill status={doc.aiStatus} />
                </td>

                {/* Estado Humano */}
                <td className="px-4 py-3">
                  <StatusPill status={doc.humanStatus} />
                </td>

                {/* Fecha */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-[12px] text-slate-500">
                    {doc.fecha}{" "}
                    <span className="text-slate-400">{doc.hora}</span>
                  </span>
                </td>

                {/* Acción */}
                <td className="px-4 py-3">
                  <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
