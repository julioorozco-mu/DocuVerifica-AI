"use client";
/**
 * LatestDocumentsTable — Tabla "Últimos documentos".
 * Columnas: Folio, Documento, Tipo, Revisor, Estado IA, Estado humano, Fecha, Acción.
 */
import React from "react";
import Link from "next/link";
import { FileText, MoreVertical, ArrowRight } from "lucide-react";
import { latestDocuments, type LatestDocument } from "@/lib/mock-dashboard-data";
import StatusPill from "@/components/ui/StatusPill";

// TODO: Reemplazar latestDocuments por prop al conectar con API real.

interface LatestDocumentsTableProps {
  documents?: LatestDocument[];
  showReviewer?: boolean;
}

export default function LatestDocumentsTable({
  documents = latestDocuments,
  showReviewer = true,
}: LatestDocumentsTableProps) {
  const headers = showReviewer
    ? ["Folio", "Documento", "Tipo", "Revisor", "Estado IA", "Estado humano", "Fecha", "Acción"]
    : ["Folio", "Documento", "Tipo", "Estado IA", "Estado humano", "Fecha", "Acción"];

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#E5EAF2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-2.5">
        <p className="text-[14px] font-semibold text-[#0F172A]">Últimos documentos</p>
        <Link
          href="/documents"
          className="flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
        >
          Ver todos los documentos <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          {/* Head */}
          <thead>
            <tr className="border-y border-[#E5EAF2] bg-[#F8FAFC]">
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-5 py-2 text-[10px] font-semibold text-[#334155]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-[#EEF2F7]">
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="group transition-colors hover:bg-[#F8FAFC]"
              >
                {/* Folio */}
                <td className="px-5 py-2">
                  <span className="font-mono text-[11px] font-medium text-[#334155]">{doc.folio}</span>
                </td>

                {/* Documento */}
                <td className="px-5 py-2">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="flex max-w-[230px] items-center gap-2 truncate text-[11px] font-medium text-[#334155] hover:text-[#2563EB] hover:underline"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0 text-[#2563EB]" />
                    <span className="truncate">{doc.filename}</span>
                  </Link>
                </td>

                {/* Tipo */}
                <td className="px-5 py-2">
                  <span className="text-[11px] text-[#334155]">{doc.tipo}</span>
                </td>

                {/* Revisor */}
                {showReviewer && (
                  <td className="px-5 py-2">
                    {doc.revisor ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${doc.revisor.color}`}
                        >
                          <span className="text-[8px] font-bold text-white">{doc.revisor.initials}</span>
                        </div>
                        <span className="whitespace-nowrap text-[11px] text-[#334155]">{doc.revisor.name}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#64748B]">—</span>
                    )}
                  </td>
                )}

                {/* Estado IA */}
                <td className="px-5 py-2">
                  <StatusPill status={doc.aiStatus} />
                </td>

                {/* Estado Humano */}
                <td className="px-5 py-2">
                  <StatusPill status={doc.humanStatus} />
                </td>

                {/* Fecha */}
                <td className="whitespace-nowrap px-5 py-2">
                  <span className="text-[11px] text-[#334155]">
                    {doc.fecha}{" "}
                    <span className="text-[#64748B]">{doc.hora}</span>
                  </span>
                </td>

                {/* Acción */}
                <td className="px-5 py-2">
                  <button className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#334155] opacity-100 transition-colors hover:bg-[#EEF2F7]">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-5 py-8 text-center text-[12px] text-[#64748B]">
                  No hay documentos recientes para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
