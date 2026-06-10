"use client";

import React, { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFViewerProps {
  fileData: Uint8Array;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  highlightText?: string;
}

export default function PDFViewer({ fileData, currentPage, onPageChange, highlightText }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [internalPageNumber, setInternalPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  const requestedPage = currentPage ?? internalPageNumber;
  const pageNumber = numPages > 0
    ? Math.min(Math.max(requestedPage, 1), numPages)
    : 1;

  const commitPageChange = (newPage: number) => {
    if (currentPage === undefined) {
      setInternalPageNumber(newPage);
    }
    onPageChange?.(newPage);
  };

  // Cargar el documento PDF
  useEffect(() => {
    let active = true;
    let loadingTask: PDFDocumentLoadingTask | null = null;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        loadingTask = pdfjs.getDocument({ data: fileData.slice() });
        const pdfDoc = await loadingTask.promise;
        if (active) {
          setPdf(pdfDoc);
          setNumPages(pdfDoc.numPages);
          setInternalPageNumber(1);
          onPageChange?.(1);
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error("Error al cargar PDF:", err);
        if (active) {
          setError("No se pudo renderizar el archivo PDF en el lienzo local.");
          setLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      active = false;
      loadingTask?.destroy();
      renderTaskRef.current?.cancel();
    };
  }, [fileData, onPageChange]);

  // Renderizar la página actual en el Canvas
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        // Cancelar la tarea de renderizado previa si está activa
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdf.getPage(pageNumber);
        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d");
        if (!context) return;

        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        renderTaskRef.current = null;

        // --- LÓGICA DE RESALTADO DE TEXTO ---
        if (highlightText) {
          try {
            const textContent = await page.getTextContent();
            const searchStr = highlightText.toLowerCase();
            const pdfjs = await import("pdfjs-dist");

            context.fillStyle = "rgba(250, 204, 21, 0.4)"; // bg-yellow-400/40

            // Hacemos una búsqueda simple por fragmentos
            // Nota: En PDFs el texto a veces viene muy fragmentado
            for (const item of textContent.items) {
              if ('str' in item && item.str) {
                if (item.str.toLowerCase().includes(searchStr) || searchStr.includes(item.str.toLowerCase())) {
                  const tx = pdfjs.Util.transform(viewport.transform, item.transform);
                  const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
                  
                  // Dibujar rectángulo resaltador
                  context.fillRect(
                    tx[4], 
                    tx[5] - fontHeight, 
                    item.width * scale, 
                    fontHeight * 1.2
                  );
                }
              }
            }
          } catch (e) {
            console.error("Error highlighting text:", e);
          }
        }

      } catch (err: unknown) {
        const errorName = err instanceof Error ? err.name : "";
        if (errorName !== "RenderingCancelledException") {
          console.error("Error al renderizar página del PDF:", err);
        }
      }
    };

    renderPage();
  }, [pdf, pageNumber, scale, highlightText]);

  const handlePrevPage = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      commitPageChange(newPage);
    }
  };

  const handleNextPage = () => {
    if (pdf && pageNumber < pdf.numPages) {
      const newPage = pageNumber + 1;
      commitPageChange(newPage);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleFitWidth = () => {
    if (!containerRef.current || !pdf) return;
    const containerWidth = containerRef.current.clientWidth;
    
    // Obtener las dimensiones de la primera página para calcular la escala
    pdf.getPage(pageNumber).then((page) => {
      const viewport = page.getViewport({ scale: 1.0 });
      const fitScale = (containerWidth - 32) / viewport.width; // 32px de padding
      setScale(parseFloat(fitScale.toFixed(2)));
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0d121f] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Barra de Herramientas del Visor */}
      <div className="h-12 border-b border-slate-800/80 bg-[#0d121f]/80 backdrop-blur-sm px-4 flex items-center justify-between text-slate-200">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePrevPage}
            disabled={pageNumber <= 1 || loading || !!error}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-semibold px-2 min-w-[70px] text-center select-none text-slate-300">
            {loading ? "Cargando" : `${pageNumber} / ${numPages}`}
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNextPage}
            disabled={pdf ? pageNumber >= pdf.numPages : true}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomOut}
            disabled={loading || !!error}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-semibold px-1 min-w-[45px] text-center select-none text-slate-300">
            {Math.round(scale * 100)}%
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomIn}
            disabled={loading || !!error}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-slate-800 mx-1" />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleFitWidth}
            disabled={loading || !!error}
            title="Ajustar al ancho"
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenedor del Lienzo PDF */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-auto p-4 flex justify-center items-start bg-[#080b11] custom-scrollbar"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 w-full">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Renderizando páginas del PDF...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-64 w-full text-slate-400 px-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-sm font-semibold">{error}</p>
            <p className="text-xs text-slate-600 mt-1">
              Asegúrate de que el documento no esté dañado y la conexión VPN esté activa.
            </p>
          </div>
        )}

        <div className={`shadow-2xl border border-slate-900 rounded bg-white transition-opacity duration-300 ${
          loading || error ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
        }`}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
