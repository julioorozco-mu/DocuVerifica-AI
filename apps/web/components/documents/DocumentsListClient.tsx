"use client";

import React, { useEffect, useState } from "react";
import { useSetHeader } from "@/context/HeaderContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { api, DocumentInfo } from "@/lib/api";
import { FileText, Clock, CheckCircle, Upload, Eye, Calendar, HardDrive } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DocumentsListClient() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  useSetHeader("Documentos", "Documentos / Bandeja de Entrada");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await api.get<DocumentInfo[]>("/documents");
        setDocuments(data);
      } catch (err) {
        console.error("Error al cargar documentos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const total = documents.length;
  const pending = documents.filter(d => d.status !== "human_review_done" && d.status !== "error").length;
  const completed = documents.filter(d => d.status === "human_review_done").length;

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const d = new Date(dateString);
    return d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <main className="flex-1 overflow-auto p-5 lg:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Bandeja de Documentos</h1>
            <p className="text-slate-400 text-sm mt-1">
              Administra y revisa los expedientes cargados en el servidor local.
            </p>
          </div>
          <Link href="/documents/upload">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg hover:shadow-indigo-500/10 cursor-pointer gap-2">
              <Upload className="w-4 h-4" />
              Subir Expediente
            </Button>
          </Link>
        </div>

        {/* Bento de Métricas Arriba */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Expedientes</p>
                <h3 className="text-2xl font-bold text-white mt-0.5">{loading ? "..." : total}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pendientes de Firma</p>
                <h3 className="text-2xl font-bold text-white mt-0.5">{loading ? "..." : pending}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Dictámenes Finalizados</p>
                <h3 className="text-2xl font-bold text-white mt-0.5">{loading ? "..." : completed}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla Profesional Abajo */}
        <Card className="bg-slate-900/30 border-slate-800/80 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/50 border-b border-slate-800/60">
                <TableRow className="hover:bg-slate-900/10 border-b border-slate-800/60">
                  <TableHead className="text-slate-400 font-semibold">Nombre del Expediente</TableHead>
                  <TableHead className="text-slate-400 font-semibold">Tamaño</TableHead>
                  <TableHead className="text-slate-400 font-semibold">Fecha de Carga</TableHead>
                  <TableHead className="text-slate-400 font-semibold">Estado</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      Cargando documentos...
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      No se han encontrado expedientes. Utiliza el botón superior para subir uno.
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-all duration-200">
                      <TableCell className="font-medium text-slate-200">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-indigo-400/80" />
                          <span className="truncate max-w-xs md:max-w-md block">{doc.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        <div className="flex items-center gap-1.5 text-xs">
                          <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                          {formatSize(doc.size_bytes)}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {formatDate(doc.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium inline-block ${
                          doc.status === "human_review_done" 
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                            : doc.status === "error"
                            ? "bg-red-950/40 text-red-400 border border-red-500/20"
                            : "bg-yellow-950/40 text-yellow-400 border border-yellow-500/20"
                        }`}>
                          {doc.status === "human_review_done" 
                            ? "Completado" 
                            : doc.status === "uploaded" 
                            ? "Subido" 
                            : doc.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/documents/${doc.id}`}>
                            <Button size="sm" variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-950/20 hover:text-indigo-300 gap-1.5 rounded-xl cursor-pointer">
                              <Eye className="w-3.5 h-3.5" />
                              Revisar
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </main>
  );
}
