"use client";

import React from "react";
import { ReviewCriterion } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Globe, User, Zap, BookOpen, Search } from "lucide-react";

interface CriteriaListProps {
  globalCriteria: ReviewCriterion[];
  myCriteria: ReviewCriterion[];
  selectedId: string | null;
  onSelect: (criterion: ReviewCriterion) => void;
  onNewCriterion: () => void;
}

function CriterionCard({
  criterion,
  isSelected,
  onSelect,
}: {
  criterion: ReviewCriterion;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const ruleTypeLabel: Record<string, { label: string; icon: React.ReactNode }> = {
    ai: { label: "IA", icon: <Zap className="w-3 h-3" /> },
    rule: { label: "Regla", icon: <BookOpen className="w-3 h-3" /> },
    semantic: { label: "Semántico", icon: <Search className="w-3 h-3" /> },
    rule_then_ai: { label: "Regla+IA", icon: <Zap className="w-3 h-3" /> },
  };

  const typeInfo = ruleTypeLabel[criterion.rule_type] || ruleTypeLabel.ai;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group ${
        isSelected
          ? "bg-indigo-950/30 border-indigo-500/40 ring-1 ring-indigo-500/20"
          : "bg-slate-900/30 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span
          className={`text-sm font-semibold truncate ${
            isSelected ? "text-indigo-200" : "text-slate-200 group-hover:text-white"
          }`}
        >
          {criterion.name}
        </span>
        {!criterion.is_active && (
          <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-500 flex-shrink-0">
            Inactivo
          </Badge>
        )}
      </div>

      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
        {criterion.description || "Sin descripción"}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-full">
          {typeInfo.icon}
          {typeInfo.label}
        </span>
        {criterion.project_type && (
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">
            {criterion.project_type}
          </span>
        )}
      </div>
    </button>
  );
}

export function CriteriaList({
  globalCriteria,
  myCriteria,
  selectedId,
  onSelect,
}: CriteriaListProps) {
  const totalCount = globalCriteria.length + myCriteria.length;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/50 backdrop-blur-sm">
      {/* Cabecera */}
      <div className="p-4 border-b border-slate-800/60 bg-slate-900/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Biblioteca de Criterios
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {totalCount}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 flex flex-col gap-4">
          {/* Sección: Globales */}
          {globalCriteria.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">
                  Globales
                </span>
                <span className="text-[10px] text-slate-600">({globalCriteria.length})</span>
              </div>
              <div className="flex flex-col gap-2">
                {globalCriteria.map((c) => (
                  <CriterionCard
                    key={c.id}
                    criterion={c}
                    isSelected={selectedId === c.id}
                    onSelect={() => onSelect(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sección: Mis Criterios */}
          {myCriteria.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">
                  Mis Criterios
                </span>
                <span className="text-[10px] text-slate-600">({myCriteria.length})</span>
              </div>
              <div className="flex flex-col gap-2">
                {myCriteria.map((c) => (
                  <CriterionCard
                    key={c.id}
                    criterion={c}
                    isSelected={selectedId === c.id}
                    onSelect={() => onSelect(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Estado vacío */}
          {totalCount === 0 && (
            <div className="text-center py-10">
              <p className="text-xs text-slate-600">
                No hay criterios configurados todavía.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
