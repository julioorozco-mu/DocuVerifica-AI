"use client";

import React, { useState } from "react";
import { api, AISimulationResult, getErrorMessage } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FlaskConical,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Info,
  Star,
} from "lucide-react";

interface AISimulatorProps {
  criterionName: string;
  criterionDescription: string;
  ruleType: string;
  rulePattern: string;
}

export function AISimulator({ criterionName, criterionDescription, ruleType, rulePattern }: AISimulatorProps) {
  const [textFragment, setTextFragment] = useState("");
  const [modelName, setModelName] = useState("qwen2.5:3b");
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<AISimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSimulate =
    criterionName.trim().length > 0 &&
    criterionDescription.trim().length > 0 &&
    textFragment.trim().length > 0;

  const handleSimulate = async () => {
    if (!canSimulate) return;

    setSimulating(true);
    setResult(null);
    setError(null);

    try {
      const data = await api.post<AISimulationResult>("/criteria/simulate", {
        criterion_name: criterionName,
        criterion_description: criterionDescription,
        rule_type: ruleType,
        rule_pattern: rulePattern,
        text_fragment: textFragment,
        model_name: modelName,
      });
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err, "Error al ejecutar la simulación con Ollama."));
    } finally {
      setSimulating(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "cumple":
        return {
          icon: <CheckCircle2 className="w-5 h-5" />,
          label: "Cumple",
          color: "text-emerald-400",
          bg: "bg-emerald-950/30 border-emerald-500/25",
        };
      case "no_cumple":
        return {
          icon: <XCircle className="w-5 h-5" />,
          label: "No Cumple",
          color: "text-red-400",
          bg: "bg-red-950/30 border-red-500/25",
        };
      case "requiere_revision":
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          label: "Requiere Revisión",
          color: "text-yellow-400",
          bg: "bg-yellow-950/30 border-yellow-500/25",
        };
      case "no_encontrado":
        return {
          icon: <HelpCircle className="w-5 h-5" />,
          label: "No Encontrado",
          color: "text-slate-400",
          bg: "bg-slate-900/40 border-slate-700/40",
        };
      default:
        return {
          icon: <HelpCircle className="w-5 h-5" />,
          label: status,
          color: "text-slate-400",
          bg: "bg-slate-900/40 border-slate-700/40",
        };
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 backdrop-blur-sm overflow-hidden">
      {/* Cabecera */}
      <div className="px-5 py-4 border-b border-slate-800/60 bg-gradient-to-r from-indigo-950/30 to-purple-950/20">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold text-purple-200">
            Simulador IA
          </span>
          <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-400 ml-auto">
            Prueba en Vivo
          </Badge>
        </div>
        <p className="text-[10px] text-slate-500 mt-1.5">
          Pega un texto de prueba para ver cómo la IA evaluaría este criterio antes de guardarlo.
        </p>
      </div>

      {/* Contenido */}
      <div className="p-5 flex flex-col gap-4">
        {/* Aviso si falta criterio */}
        {(!criterionName.trim() || !criterionDescription.trim()) && (
          <div className="flex items-start gap-2 p-3 bg-amber-950/20 border border-amber-500/15 rounded-xl">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-400/80">
              Completa el nombre y la regla del criterio para poder usar el simulador.
            </p>
          </div>
        )}

        {/* Texto de prueba */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="sim-text" className="text-slate-300 text-xs font-semibold">
            Fragmento de Texto para Prueba
          </Label>
          <Textarea
            id="sim-text"
            value={textFragment}
            onChange={(e) => setTextFragment(e.target.value)}
            placeholder="Pega aquí un fragmento del tipo de documento que revisarás. La IA lo evaluará usando la regla que definiste arriba..."
            rows={5}
            className="bg-slate-900/60 border-slate-800 text-slate-100 rounded-xl text-sm placeholder:text-slate-600 resize-none"
          />
        </div>

        {/* Selector de modelo + Botón */}
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1.5 flex-1 max-w-[280px]">
            <Label className="text-slate-400 text-[10px]">Modelo</Label>
            <Select value={modelName} onValueChange={(val) => val && setModelName(val)}>
              <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-100 rounded-xl h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                {/* ── Recomendados ── */}
                <SelectGroup>
                  <SelectLabel className="text-emerald-400/80 font-semibold uppercase tracking-wider text-[9px] px-2 pt-2 pb-1">⭐ Recomendados</SelectLabel>
                  <SelectItem value="llama3.1:8b" className="focus:bg-slate-800 cursor-pointer">
                    Llama 3.1 8B
                  </SelectItem>
                </SelectGroup>
                <SelectSeparator />
                {/* ── Rápidos ── */}
                <SelectGroup>
                  <SelectLabel className="text-sky-400/80 font-semibold uppercase tracking-wider text-[9px] px-2 pt-1 pb-1">⚡ Rápidos</SelectLabel>
                  <SelectItem value="qwen2.5:3b" className="focus:bg-slate-800 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                      Qwen 2.5 3B
                      <span className="text-emerald-400/60 text-[9px]">(Predeterminado)</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="llama3.2:1b" className="focus:bg-slate-800 cursor-pointer">
                    Llama 3.2 1B
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSimulate}
            disabled={!canSimulate || simulating}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl h-9 text-xs font-semibold cursor-pointer gap-2 flex-1"
          >
            {simulating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Evaluando...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Probar Criterio
              </>
            )}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-950/30 border border-red-500/25 rounded-xl text-xs text-red-400 text-center font-medium">
            {error}
          </div>
        )}

        {/* Resultado de la simulación */}
        {result && (
          <div className={`p-4 rounded-xl border ${getStatusConfig(result.status).bg}`}>
            {/* Status principal */}
            <div className="flex items-center justify-between mb-3">
              <div className={`flex items-center gap-2 ${getStatusConfig(result.status).color}`}>
                {getStatusConfig(result.status).icon}
                <span className="text-sm font-bold">{getStatusConfig(result.status).label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">Confianza:</span>
                <Progress value={result.confidence * 100} className="h-1.5 w-20" />
                <span className="text-[11px] font-semibold text-slate-300">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Explicación */}
            <div className="text-xs text-slate-300 leading-relaxed mb-3">
              {result.explanation}
            </div>

            {/* Evidencia */}
            {result.evidence && (
              <div className="bg-slate-950/50 border border-slate-800/50 p-3 rounded-lg">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Evidencia Detectada
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-slate-700 pl-2">
                  &ldquo;{result.evidence}&rdquo;
                </p>
              </div>
            )}

            {/* Indicador de revisión humana */}
            {result.human_action_required && (
              <div className="mt-3 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-medium text-amber-400">
                  La IA recomienda revisión manual para este caso.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
