"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSetHeader } from "@/context/HeaderContext";
import { AIReviewChecklist } from "@/components/documents/AIReviewChecklist";
import dynamic from "next/dynamic";
const PDFViewer = dynamic(() => import("@/components/PDFViewer"), { ssr: false });
import { api, DocumentInfo, DocumentChunk, ExtractionResult, HumanVerdict, getErrorMessage, AIReviewResult } from "@/lib/api";
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
  FileText,
  Sparkles,
  AlertTriangle,
  BookOpen,
  Hash
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WorkspaceProps {
  params: Promise<{ id: string }>;
}

interface FileState {
  docId: string;
  data: Uint8Array | null;
  error: string | null;
}

export default function DocumentWorkspacePage({ params }: WorkspaceProps) {
  useSetHeader("Revisión de Documento", "Documentos / Workspace de Revisión");
  const [docId, setDocId] = useState<string | null>(null);
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [verdictStatus, setVerdictStatus] = useState<string>("requiere_revision");
  const [comments, setComments] = useState<string>("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Estado para extracción de texto (Fase 2)
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [highlightText, setHighlightText] = useState<string>("");
  const [highlightStatus, setHighlightStatus] = useState<string>("default");
  const [allEvidences, setAllEvidences] = useState<AIReviewResult[]>([]);
  const [fileState, setFileState] = useState<FileState | null>(null);
  const isPdfDocument = document?.filename.toLowerCase().endsWith(".pdf") ?? false;
  
  const [selectedModel, setSelectedModel] = useState<string>("qwen3.5:9b");
  const [aiReviewTriggering, setAiReviewTriggering] = useState(false);

  // Desenvolver los params dinámicos
  useEffect(() => {
    params.then((p) => setDocId(p.id));
  }, [params]);

  // Cargar chunks existentes
  const loadChunks = useCallback(async (id: string) => {
    setChunksLoading(true);
    try {
      const data = await api.get<DocumentChunk[]>(`/documents/${id}/chunks`);
      setChunks(data);
    } catch {
      // No hay chunks todavía, lo cual es normal
      setChunks([]);
    } finally {
      setChunksLoading(false);
    }
  }, []);

  // Cargar metadatos y veredicto existente
  useEffect(() => {
    if (!docId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const docData = await api.get<DocumentInfo>(`/documents/${docId}`);
        setDocument(docData);

        // Intentar obtener dictamen previo
        try {
          const verdictData = await api.get<HumanVerdict>(`/documents/${docId}/verdict`);
          setVerdictStatus(verdictData.status);
          setComments(verdictData.comments || "");
        } catch {
          // No hay veredicto previo todavía
        }

        // Cargar chunks si ya existen
        await loadChunks(docId);
      } catch (err) {
        console.error("Error al cargar datos del workspace:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [docId, loadChunks]);

  // Ejecutar extracción de texto
  const handleExtractText = async () => {
    if (!docId) return;
    setExtracting(true);
    setExtractionResult(null);

    try {
      const result = await api.post<ExtractionResult>(`/documents/${docId}/extract-text`, {});
      setExtractionResult(result);

      // Recargar documento para actualizar el estado
      const updatedDoc = await api.get<DocumentInfo>(`/documents/${docId}`);
      setDocument(updatedDoc);

      // Recargar chunks
      await loadChunks(docId);
    } catch (err: unknown) {
      setExtractionResult({
        document_id: docId,
        status: "error",
        total_chunks: 0,
        total_words: 0,
        ocr_required: false,
        message: getErrorMessage(err, "Error durante la extracción de texto.")
      });
    } finally {
      setExtracting(false);
    }
  };

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
      
      // Actualizar el estado del documento localmente
      if (document) {
        setDocument({ ...document, status: "human_review_done" });
      }
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Error al registrar el dictamen."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerAiReview = async () => {
    if (!docId) return;
    setAiReviewTriggering(true);
    try {
      await api.post(`/documents/${docId}/review-ai`, { model_name: selectedModel });
      // Recargar el documento para obtener el nuevo estado ("ai_reviewing")
      const updatedDoc = await api.get<DocumentInfo>(`/documents/${docId}`);
      setDocument(updatedDoc);
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Error al iniciar la revisión IA."), type: "error" });
    } finally {
      setAiReviewTriggering(false);
    }
  };

  useEffect(() => {
    let active = true;
    
    if (docId && document && !isPdfDocument) {
      return () => {
        active = false;
      };
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

    return () => {
      active = false;
    };
  }, [docId, document, isPdfDocument]);

  if (loading || !docId) {
    return (
      <main className="flex-1 overflow-auto p-5 lg:p-6">
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-400 text-sm">Cargando área de trabajo...</p>
        </div>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="flex-1 overflow-auto p-5 lg:p-6">
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg font-semibold">El expediente solicitado no existe.</p>
          <Link href="/documents" className="mt-4 inline-block">
            <Button variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800/50 rounded-xl cursor-pointer">
              Regresar a la bandeja
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  // Determinar si ya se extrajo texto
  const hasChunks = chunks.length > 0;
  const canExtract = ["uploaded", "error", "ocr_required"].includes(document.status);
  const isOcrRequired = document.status === "ocr_required";
  const fileData = fileState?.docId === docId ? fileState.data : null;
  const fileError = fileState?.docId === docId ? fileState.error : null;

  return (
    <main className="flex-1 overflow-auto p-5 lg:p-6">
      <div className="flex flex-col h-[calc(100vh-10rem)] space-y-4">
        
        {/* Cabecera Workspace */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button size="icon" variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800/50 rounded-xl cursor-pointer h-9 w-9">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex items-center gap-3">
              <LayoutDashboard className="w-5 h-5 text-indigo-400 hidden sm:block" />
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white truncate max-w-xs sm:max-w-md md:max-w-lg">
                  {document.filename}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    document.status === "human_review_done" 
                      ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                      : document.status === "error"
                      ? "bg-red-950/40 text-red-400 border border-red-500/20"
                      : document.status === "ocr_required"
                      ? "bg-orange-950/40 text-orange-400 border border-orange-500/20"
                      : document.status === "ready_for_review"
                      ? "bg-indigo-950/40 text-indigo-400 border border-indigo-500/20"
                      : "bg-yellow-950/40 text-yellow-400 border border-yellow-500/20"
                  }`}>
                    {document.status === "human_review_done" ? "Completado" 
                      : document.status === "uploaded" ? "Subido" 
                      : document.status === "ready_for_review" ? "Listo para revisión"
                      : document.status === "ocr_required" ? "Requiere OCR"
                      : document.status === "extracting_text" ? "Extrayendo..."
                      : document.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    ID: {document.id.substring(0,8)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Profesional Workspace (2 Paneles) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] gap-6 min-h-0 overflow-hidden">
          
          {/* Panel Izquierdo: Visor PDF */}
          <div className="flex flex-col h-full min-h-0 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/30 shadow-inner">
            {!isPdfDocument ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 px-6 text-center bg-[#0d121f]">
                <FileText className="w-12 h-12 text-indigo-400 mb-3" />
                <p className="text-sm font-semibold">Vista previa PDF no disponible para DOCX.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Usa la pestaña de texto para extraer y revisar el contenido estructurado del documento.
                </p>
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

          {/* Panel Derecho: Herramientas de Revisión */}
          <div className="flex flex-col h-full min-h-0 overflow-hidden border border-slate-800/80 rounded-xl bg-slate-950/50 backdrop-blur-sm shadow-xl">
            <Tabs defaultValue="text" className="flex flex-col h-full w-full">
              <div className="p-3 border-b border-slate-800/80 bg-slate-900/50">
                <TabsList className="w-full grid grid-cols-3 bg-slate-950/50">
                  <TabsTrigger value="text" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    Texto
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">
                    <BrainCircuit className="w-3.5 h-3.5 mr-1.5" />
                    Pre-revisión
                  </TabsTrigger>
                  <TabsTrigger value="verdict" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">
                    <MessageSquareQuote className="w-3.5 h-3.5 mr-1.5" />
                    Dictamen
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab: Texto Extraído (Fase 2) */}
              <TabsContent value="text" className="flex-1 flex flex-col m-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  
                  {/* Banner de OCR requerido */}
                  {isOcrRequired && (
                    <div className="p-3 bg-orange-950/30 border border-orange-500/20 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-orange-300">Se requiere procesamiento OCR</p>
                        <p className="text-[11px] text-orange-400/70 mt-1">
                          El documento parece ser un PDF escaneado con poco o ningún texto digital. 
                          La funcionalidad de OCR se habilitará en la Fase 3.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Resultado de la extracción */}
                  {extractionResult && (
                    <div className={`p-3 text-xs font-medium rounded-xl text-center border ${
                      extractionResult.status === "error"
                        ? "bg-red-950/30 border-red-500/25 text-red-400"
                        : extractionResult.ocr_required
                        ? "bg-orange-950/30 border-orange-500/25 text-orange-400"
                        : "bg-emerald-950/30 border-emerald-500/25 text-emerald-400"
                    }`}>
                      {extractionResult.message}
                    </div>
                  )}

                  {/* Botón de extracción */}
                  {canExtract && !extracting && (
                    <Button
                      onClick={handleExtractText}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg cursor-pointer h-11 font-semibold flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {hasChunks ? "Re-extraer Texto" : "Extraer Texto del Documento"}
                    </Button>
                  )}

                  {/* Spinner durante extracción */}
                  {extracting && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <div className="relative">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        <Sparkles className="w-4 h-4 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
                      </div>
                      <p className="text-sm text-slate-400 font-medium">Extrayendo texto con Docling...</p>
                      <p className="text-[11px] text-slate-500">Esto puede tardar unos segundos según el tamaño del documento.</p>
                    </div>
                  )}

                  {/* Cargando chunks */}
                  {chunksLoading && !extracting && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                  )}

                  {/* Lista de chunks */}
                  {hasChunks && !extracting && (
                    <>
                      {/* Resumen */}
                      <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-semibold text-indigo-300">
                            {chunks.length} fragmentos extraídos
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {chunks.reduce((acc, c) => acc + c.word_count, 0).toLocaleString()} palabras
                        </span>
                      </div>

                      {/* Chunks */}
                      <div className="space-y-3">
                        {chunks.map((chunk) => (
                          <div 
                            key={chunk.id}
                            onClick={() => {
                              if (chunk.page_start) {
                                setCurrentPage(chunk.page_start);
                              }
                            }}
                            className={`p-4 bg-slate-900/60 border rounded-xl hover:border-indigo-500/50 hover:bg-indigo-950/10 transition-all group cursor-pointer ${
                              currentPage === chunk.page_start 
                                ? "border-indigo-500/80 ring-1 ring-indigo-500/20 bg-indigo-950/5" 
                                : "border-slate-800"
                            }`}
                          >
                            {/* Cabecera del chunk */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Hash className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                <span className="text-[11px] font-bold text-slate-400">
                                  Fragmento {chunk.chunk_index + 1}
                                </span>
                                {chunk.section_heading && (
                                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full truncate max-w-[200px]">
                                    {chunk.section_heading}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {chunk.page_start && (
                                  <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                    {chunk.page_start === chunk.page_end || !chunk.page_end
                                      ? `Pág ${chunk.page_start}`
                                      : `Págs ${chunk.page_start}-${chunk.page_end}`}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500">
                                  {chunk.word_count} pal.
                                </span>
                              </div>
                            </div>

                            {/* Breadcrumbs de headings */}
                            {chunk.headings && chunk.headings.length > 0 && (
                              <div className="flex items-center gap-1 mb-2 flex-wrap">
                                {chunk.headings.map((h, i) => (
                                  <React.Fragment key={i}>
                                    {i > 0 && <span className="text-[9px] text-slate-600">›</span>}
                                    <span className="text-[10px] text-slate-500">{h}</span>
                                  </React.Fragment>
                                ))}
                              </div>
                            )}

                            {/* Texto del chunk (truncado para no saturar la UI) */}
                            <p className="text-xs text-slate-300 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                              {chunk.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Estado vacío */}
                  {!hasChunks && !extracting && !chunksLoading && !canExtract && (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                      <FileText className="w-8 h-8 text-slate-700" />
                      <p className="text-xs text-slate-500">
                        El texto ya fue extraído pero no se encontraron fragmentos.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab: Pre-revisión IA */}
              <TabsContent value="ai" className="flex-1 overflow-y-auto m-0 p-5 space-y-5 custom-scrollbar">
                
                {(!document?.status || ["uploaded", "extracting_text", "ocr_required", "ocr_processing"].includes(document.status)) ? (
                  <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-3">
                    <BrainCircuit className="w-8 h-8 text-slate-500 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-300">Análisis no disponible</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      El documento necesita extraer el texto (Texto extraído) antes de poder ejecutar la Pre-revisión IA.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-4 bg-indigo-950/20 p-4 border border-indigo-500/10 rounded-2xl mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-indigo-300">Análisis Asistido (Ollama)</h4>
                          <p className="text-[11px] text-slate-400 mt-1">Selecciona el modelo a usar para la revisión.</p>
                        </div>
                        <Button 
                          onClick={handleTriggerAiReview}
                          disabled={aiReviewTriggering || document.status === "ai_reviewing"}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 cursor-pointer"
                        >
                          {aiReviewTriggering || document.status === "ai_reviewing" ? (
                            <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Procesando...</>
                          ) : (
                            <><Sparkles className="w-3 h-3 mr-2" /> Ejecutar Revisión</>
                          )}
                        </Button>
                      </div>
                      <div>
                        <Select value={selectedModel} onValueChange={(val) => val && setSelectedModel(val)}>
                          <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-100 rounded-xl h-9 text-xs">
                            <SelectValue placeholder="Selecciona el modelo" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                            <SelectGroup>
                              <SelectLabel className="text-indigo-400 font-semibold px-2 py-1.5 text-xs">Recomendados (Equilibrio rápido/preciso)</SelectLabel>
                              <SelectItem value="qwen3.5:9b" className="focus:bg-slate-800 py-1.5 cursor-pointer">
                                Qwen 3.5 9B (Predeterminado - Recomendado)
                              </SelectItem>
                              <SelectItem value="llama3.1:8b" className="focus:bg-slate-800 py-1.5 cursor-pointer">
                                Llama 3.1 8B
                              </SelectItem>
                              <SelectItem value="phi4" className="focus:bg-slate-800 py-1.5 cursor-pointer">
                                Phi-4
                              </SelectItem>
                            </SelectGroup>
                            
                            <SelectSeparator className="bg-slate-800" />
                            
                            <SelectGroup>
                              <SelectLabel className="text-emerald-400 font-semibold px-2 py-1.5 text-xs">Rápidos (Menor VRAM, mayor velocidad)</SelectLabel>
                              <SelectItem value="qwen2.5:3b" className="focus:bg-slate-800 py-1.5 cursor-pointer">
                                Qwen 2.5 3B
                              </SelectItem>
                              <SelectItem value="llama3.2:1b" className="focus:bg-slate-800 py-1.5 cursor-pointer">
                                Llama 3.2 1B
                              </SelectItem>
                            </SelectGroup>

                            <SelectSeparator className="bg-slate-800" />
                            
                            <SelectGroup>
                              <SelectLabel className="text-orange-400 font-semibold px-2 py-1.5 text-xs">Razonamiento Max (Pensamiento profundo)</SelectLabel>
                              <SelectItem value="deepseek-r1:8b" className="focus:bg-slate-800 py-1.5 cursor-pointer">
                                DeepSeek R1 8B
                              </SelectItem>
                              <SelectItem value="deepseek-r1:1.5b" className="focus:bg-slate-800 py-1.5 cursor-pointer">
                                DeepSeek R1 1.5B
                              </SelectItem>
                            </SelectGroup>

                            <SelectSeparator className="bg-slate-800" />
                            
                            <SelectGroup>
                              <SelectLabel className="text-slate-400 font-semibold px-2 py-1.5 text-xs">Embeddings</SelectLabel>
                              <SelectItem value="nomic-embed-text-v2-moe" className="focus:bg-slate-800 py-1.5 cursor-pointer" disabled>
                                Nomic Embed Text v2 (Solo base de datos)
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

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
                  </>
                )}
              </TabsContent>

              {/* Tab: Dictamen Humano */}
              <TabsContent value="verdict" className="flex-1 flex flex-col m-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
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
                    <Label htmlFor="verdict" className="text-slate-300 text-sm font-semibold">Resolución Administrativa</Label>
                    <Select value={verdictStatus} onValueChange={(value) => setVerdictStatus(value || "requiere_revision")}>
                      <SelectTrigger id="verdict" className="bg-slate-900/60 border-slate-800 text-slate-100 rounded-xl h-11">
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="cumple" className="focus:bg-slate-800 py-2">
                          <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            Aprobado / Cumple Criterios
                          </span>
                        </SelectItem>
                        <SelectItem value="no_cumple" className="focus:bg-slate-800 py-2">
                          <span className="flex items-center gap-2 text-red-400 font-semibold">
                            <XCircle className="w-4 h-4" />
                            Rechazado / No Cumple
                          </span>
                        </SelectItem>
                        <SelectItem value="requiere_revision" className="focus:bg-slate-800 py-2">
                          <span className="flex items-center gap-2 text-yellow-400 font-semibold">
                            <AlertCircle className="w-4 h-4" />
                            Observado / Requiere Corrección
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 flex-1 flex flex-col min-h-[200px]">
                    <Label htmlFor="comments" className="text-slate-300 text-sm font-semibold">Justificación y Observaciones</Label>
                    <textarea
                      id="comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Escribe aquí el fundamento de la resolución, notas para corrección o comentarios internos..."
                      className="flex-1 w-full bg-slate-900/60 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl p-4 text-sm focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Footer de guardado pegado abajo */}
                <div className="p-5 border-t border-slate-800/80 bg-slate-900/50">
                  <Button
                    onClick={handleSaveVerdict}
                    disabled={saving}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg cursor-pointer h-11 font-semibold flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Registrando dictamen...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Guardar Resolución
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
}
