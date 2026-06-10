"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import NavigationLayout from "@/components/NavigationLayout";
import { AIReviewChecklist } from "@/components/documents/AIReviewChecklist";
import dynamic from "next/dynamic";
const PDFViewer = dynamic(() => import("@/components/PDFViewer"), { ssr: false });
import { api, DocumentInfo, DocumentChunk, HumanVerdict, getErrorMessage, AIReviewResult } from "@/lib/api";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Save, 
  ChevronLeft,
  Loader2,
  BrainCircuit,
  MessageSquareQuote,
  LayoutDashboard,
  FileText
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface WorkspaceProps {
  params: Promise<{ id: string }>;
}

interface FileState {
  docId: string;
  data: Uint8Array | null;
  error: string | null;
}

export default function DocumentReviewPage({ params }: WorkspaceProps) {
  const unwrappedParams = use(params);
  const docId = unwrappedParams.id;
  
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [verdictStatus, setVerdictStatus] = useState<string>("requiere_revision");
  const [comments, setComments] = useState<string>("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [highlightText, setHighlightText] = useState<string>("");
  const [highlightStatus, setHighlightStatus] = useState<string>("default");
  const [allEvidences, setAllEvidences] = useState<AIReviewResult[]>([]);
  const [fileState, setFileState] = useState<FileState | null>(null);
  const isPdfDocument = document?.filename.toLowerCase().endsWith(".pdf") ?? false;

  useEffect(() => {
    if (!docId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const docData = await api.get<DocumentInfo>(`/documents/${docId}`);
        setDocument(docData);

        try {
          const verdictData = await api.get<HumanVerdict>(`/documents/${docId}/verdict`);
          setVerdictStatus(verdictData.status);
          setComments(verdictData.comments || "");
        } catch {
          // Sin dictamen previo
        }
      } catch (err) {
        console.error("Error al cargar datos del workspace:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [docId]);

  const handleSaveVerdict = async () => {
    if (!docId) return;
    setSaving(true);
    setMessage(null);

    try {
      await api.post(`/documents/${docId}/verdict`, {
        status: verdictStatus,
        comments: comments
      });
      setMessage({ text: "Dictamen guardado correctamente.", type: "success" });
      
      if (document) {
        setDocument({ ...document, status: "human_review_done" });
      }
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Error al registrar el dictamen."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let active = true;
    
    if (docId && document && !isPdfDocument) {
      return () => { active = false; };
    }

    if (docId && isPdfDocument) {
      api.getFileBytes(docId)
        .then((data) => {
          if (active) {
            setFileState({ docId, data, error: null });
          }
        })
        .catch((err: unknown) => {
          console.error("Error al descargar el PDF:", err);
          if (active) {
            setFileState({
              docId,
              data: null,
              error: getErrorMessage(err, "No se pudo descargar el PDF desde la API local."),
            });
          }
        });
    }

    return () => { active = false; };
  }, [docId, document, isPdfDocument]);

  if (loading || !docId) {
    return (
      <NavigationLayout>
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-400 text-sm">Cargando área de trabajo de revisión...</p>
        </div>
      </NavigationLayout>
    );
  }

  if (!document) {
    return (
      <NavigationLayout>
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg font-semibold">El expediente solicitado no existe.</p>
          <Link href="/documents" className="mt-4 inline-block">
            <Button variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800/50 rounded-xl cursor-pointer">
              Regresar a la bandeja
            </Button>
          </Link>
        </div>
      </NavigationLayout>
    );
  }

  const fileData = fileState?.docId === docId ? fileState.data : null;
  const fileError = fileState?.docId === docId ? fileState.error : null;

  return (
    <NavigationLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4">
        
        {/* Cabecera Workspace */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link href={`/documents/${docId}`}>
              <Button size="icon" variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800/50 rounded-xl cursor-pointer h-9 w-9">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex items-center gap-3">
              <LayoutDashboard className="w-5 h-5 text-indigo-400 hidden sm:block" />
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white truncate max-w-xs sm:max-w-md md:max-w-lg">
                  Revisión: {document.filename}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    document.status === "human_review_done" 
                      ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                      : document.status === "error"
                      ? "bg-red-950/40 text-red-400 border border-red-500/20"
                      : "bg-indigo-950/40 text-indigo-400 border border-indigo-500/20"
                  }`}>
                    {document.status === "human_review_done" ? "Completado" : document.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    ID: {document.id.substring(0,8)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout de 3 Columnas */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
          
          {/* Columna 1: Visor PDF (40% - col-span-5) */}
          <div className="lg:col-span-5 flex flex-col h-full min-h-0 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/30 shadow-inner">
            {!isPdfDocument ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 px-6 text-center bg-[#0d121f]">
                <FileText className="w-12 h-12 text-indigo-400 mb-3" />
                <p className="text-sm font-semibold">Vista previa PDF no disponible para DOCX.</p>
              </div>
            ) : fileData ? (
              <PDFViewer 
                fileData={fileData} 
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                highlightText={highlightText}
                highlightStatus={highlightStatus}
                allEvidences={allEvidences}
                onClearHighlight={() => {
                  setHighlightText("");
                  setHighlightStatus("default");
                }}
              />
            ) : fileError ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 px-6 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                <p className="text-sm font-semibold">No se pudo descargar el PDF.</p>
                <p className="text-xs text-slate-600 mt-1">{fileError}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-sm font-medium">Descargando documento seguro...</p>
              </div>
            )}
          </div>

          {/* Columna 2: Resultados IA/Checklist (33% - col-span-4) */}
          <div className="lg:col-span-4 flex flex-col h-full min-h-0 overflow-hidden border border-slate-800/80 rounded-xl bg-slate-950/50 backdrop-blur-sm shadow-xl">
             <div className="p-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-200">Pre-revisión IA</h2>
             </div>
             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <AIReviewChecklist 
                  documentId={docId}
                  onResultsLoaded={setAllEvidences}
                  onEvidenceClick={(pageNumber, text, status) => {
                    if (pageNumber && isPdfDocument) {
                      setCurrentPage(pageNumber);
                    }
                    if (text && text.trim().length > 5 && isPdfDocument) {
                       setHighlightText(text.trim());
                       setHighlightStatus(status || "default");
                    } else {
                       setHighlightText("");
                       setHighlightStatus("default");
                    }
                  }} 
                />
             </div>
          </div>

          {/* Columna 3: Dictamen Humano (25% - col-span-3) */}
          <div className="lg:col-span-3 flex flex-col h-full min-h-0 overflow-hidden border border-slate-800/80 rounded-xl bg-slate-950/50 backdrop-blur-sm shadow-xl">
             <div className="p-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-2">
                <MessageSquareQuote className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-200">Dictamen</h2>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                  {message && (
                    <div className={`p-3 text-xs font-medium rounded-xl text-center border ${
                      message.type === "success" 
                        ? "bg-emerald-950/30 border-emerald-500/25 text-emerald-400" 
                        : "bg-red-950/30 border-red-500/25 text-red-400"
                    }`}>
                      {message.text}
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="verdict" className="text-slate-300 text-sm font-semibold">Resolución</Label>
                    <Select value={verdictStatus} onValueChange={(value) => setVerdictStatus(value || "requiere_revision")}>
                      <SelectTrigger id="verdict" className="bg-slate-900/60 border-slate-800 text-slate-100 rounded-xl h-11">
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="cumple" className="focus:bg-slate-800 py-2 cursor-pointer">
                          <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            Aprobado
                          </span>
                        </SelectItem>
                        <SelectItem value="no_cumple" className="focus:bg-slate-800 py-2 cursor-pointer">
                          <span className="flex items-center gap-2 text-red-400 font-semibold">
                            <XCircle className="w-4 h-4" />
                            Rechazado
                          </span>
                        </SelectItem>
                        <SelectItem value="requiere_revision" className="focus:bg-slate-800 py-2 cursor-pointer">
                          <span className="flex items-center gap-2 text-yellow-400 font-semibold">
                            <AlertCircle className="w-4 h-4" />
                            Observado
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 flex-1 flex flex-col min-h-[200px]">
                    <Label htmlFor="comments" className="text-slate-300 text-sm font-semibold">Justificación</Label>
                    <textarea
                      id="comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Escribe aquí el fundamento..."
                      className="flex-1 w-full bg-slate-900/60 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl p-4 text-sm focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
                  <Button
                    onClick={handleSaveVerdict}
                    disabled={saving}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg cursor-pointer h-11 font-semibold flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Guardar
                      </>
                    )}
                  </Button>
                </div>
          </div>

        </div>
      </div>
    </NavigationLayout>
  );
}
