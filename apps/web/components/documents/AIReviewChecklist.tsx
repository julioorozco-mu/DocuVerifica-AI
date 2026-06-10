"use client";

import React, { useEffect, useState } from "react";
import { AIReviewResult, api } from "@/lib/api";
import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Props {
  documentId: string;
  onEvidenceClick: (pageNumber: number | null, evidence: string | undefined, status?: string) => void;
  onResultsLoaded?: (results: AIReviewResult[]) => void;
}

export function AIReviewChecklist({ documentId, onEvidenceClick, onResultsLoaded }: Props) {
  const [results, setResults] = useState<AIReviewResult[]>([
    {
      id: "mock1",
      criterion_id: "c1",
      status: "cumple",
      confidence: 0.95,
      evidence: "EL PRESTADOR se obliga a proporcionar a EL CLIENTE los servicios profesionales",
      page_number: 1,
      explanation: "Cumple con el objeto del contrato.",
      human_action_required: false,
      created_at: new Date().toISOString()
    },
    {
      id: "mock2",
      criterion_id: "c2",
      status: "no_cumple",
      confidence: 0.98,
      evidence: "concluirá indefectiblemente el día 31 de diciembre de 2026",
      page_number: 1,
      explanation: "Incumple con la vigencia mínima de 5 años.",
      human_action_required: true,
      created_at: new Date().toISOString()
    },
    {
      id: "mock3",
      criterion_id: "c3",
      status: "requiere_revision",
      confidence: 0.75,
      evidence: "Ambas partes declaran tener la capacidad legal",
      page_number: 1,
      explanation: "Requiere validación manual de la personería jurídica.",
      human_action_required: true,
      created_at: new Date().toISOString()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Para el mock, emitimos de una vez onResultsLoaded
    if (onResultsLoaded) {
      onResultsLoaded(results);
    }
  }, [documentId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "cumple":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "no_cumple":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "requiere_revision":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "no_encontrado":
        return <HelpCircle className="h-5 w-5 text-slate-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "cumple":
        return "Cumple";
      case "no_cumple":
        return "No Cumple";
      case "requiere_revision":
        return "Requiere Revisión";
      case "no_encontrado":
        return "No Encontrado";
      default:
        return status;
    }
  };

  if (loading && results.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-slate-500 animate-pulse">Cargando revisión IA...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && results.length === 0) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-red-600">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-slate-500 text-center text-sm">
          Aún no hay resultados de IA para este documento.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-slate-50 border-b pb-4">
        <CardTitle className="text-lg">Pre-revisión IA</CardTitle>
        <CardDescription>Resultados automáticos detectados por el modelo local Ollama.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {results.map((res) => (
            <div key={res.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(res.status)}
                  <span className="font-medium text-sm text-slate-800">Criterio analizado</span>
                </div>
                <Badge variant={res.status === "cumple" ? "default" : res.status === "no_cumple" ? "destructive" : "outline"}>
                  {getStatusText(res.status)}
                </Badge>
              </div>

              <div className="text-sm text-slate-700 leading-relaxed">
                {res.explanation}
              </div>

              {res.evidence && (
                <div 
                  className="bg-slate-50 hover:bg-slate-100 transition-colors p-3 rounded-md text-sm text-slate-600 cursor-pointer border border-slate-200 shadow-sm"
                  onClick={() => onEvidenceClick(res.page_number || null, res.evidence, res.status)}
                  title="Clic para resaltar evidencia en el documento"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">Evidencia detectada</span>
                    {res.page_number != null && res.page_number > 0 && <Badge variant="secondary" className="text-xs">Pág {res.page_number}</Badge>}
                  </div>
                  <p className="font-mono text-xs line-clamp-3 leading-relaxed text-slate-600 border-l-2 border-slate-300 pl-2">
                    "{res.evidence}"
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Confianza:</span>
                  <Progress value={res.confidence * 100} className="h-1.5 w-24" />
                  <span className="text-xs font-medium text-slate-600">{Math.round(res.confidence * 100)}%</span>
                </div>
                {res.human_action_required && (
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Revisión manual requerida
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
