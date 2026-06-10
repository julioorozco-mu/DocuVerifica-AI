"use client";

import React, { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { Loader2 } from "lucide-react";

interface ThumbnailBadge {
  status: string;
  count: number;
}

interface PDFThumbnailProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  isActive: boolean;
  badges: ThumbnailBadge[];
  onClick: (pageNumber: number) => void;
}

export default function PDFThumbnail({ pdf, pageNumber, isActive, badges, onClick }: PDFThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const renderTaskRef = useRef<RenderTask | null>(null);

  // Intersection Observer para lazy loading del renderizado
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { rootMargin: "100px" } // Empezar a renderizar 100px antes de ser visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || isRendered || !pdf || !canvasRef.current) return;

    let active = true;

    const renderThumbnail = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (!active) return;

        const viewport = page.getViewport({ scale: 0.2 }); // Escala pequeña para thumbnail
        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d");
        
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        
        await renderTask.promise;
        
        if (active) {
          setIsRendered(true);
        }
      } catch (error: any) {
        if (error?.name !== "RenderingCancelledException") {
          console.error(`Error renderizando thumbnail página ${pageNumber}:`, error);
        }
      }
    };

    renderThumbnail();

    return () => {
      active = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [isVisible, isRendered, pdf, pageNumber]);

  return (
    <div className="flex flex-col items-center mb-6">
      <span className="text-[10px] font-medium text-slate-400 mb-1">
        Página {pageNumber}
      </span>
      
      <div 
        ref={containerRef}
        onClick={() => onClick(pageNumber)}
        className={`relative cursor-pointer transition-all duration-200 group rounded-sm bg-white overflow-visible
          ${isActive 
            ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 shadow-indigo-500/20" 
            : "ring-1 ring-slate-700/50 hover:ring-slate-500 shadow-sm"
          }`}
        style={{ width: "80px", minHeight: "100px" }}
      >
        {!isRendered && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 text-slate-500">
            {isVisible ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          </div>
        )}
        
        <canvas 
          ref={canvasRef} 
          className={`w-full h-auto transition-opacity duration-300 ${isRendered ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Badges Container Overlap */}
        {badges.length > 0 && (
          <div className="absolute -bottom-2 -left-2 -right-2 flex justify-center items-center gap-1 z-10">
            {badges.map((b, idx) => {
              let bgColor = "bg-yellow-500";
              if (b.status === "cumple") bgColor = "bg-emerald-500";
              else if (b.status === "no_cumple") bgColor = "bg-red-500";

              return (
                <div 
                  key={idx}
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-md ${bgColor}`}
                  title={`${b.count} criterio(s) ${b.status}`}
                >
                  {b.count}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
