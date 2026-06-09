"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Trash2, Loader2, Pencil, PlusCircle } from "lucide-react";

interface CriteriaEditorProps {
  isCreating: boolean;
  formName: string;
  formDescription: string;
  formRuleType: string;
  formProjectType: string;
  formIsActive: boolean;
  saving: boolean;
  message: { text: string; type: "success" | "error" } | null;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onRuleTypeChange: (v: string) => void;
  onProjectTypeChange: (v: string) => void;
  onIsActiveChange: (v: boolean) => void;
  onSave: () => void;
  onDelete?: () => void;
}

export function CriteriaEditor({
  isCreating,
  formName,
  formDescription,
  formRuleType,
  formProjectType,
  formIsActive,
  saving,
  message,
  onNameChange,
  onDescriptionChange,
  onRuleTypeChange,
  onProjectTypeChange,
  onIsActiveChange,
  onSave,
  onDelete,
}: CriteriaEditorProps) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 backdrop-blur-sm overflow-hidden">
      {/* Cabecera */}
      <div className="px-5 py-4 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCreating ? (
            <PlusCircle className="w-4 h-4 text-indigo-400" />
          ) : (
            <Pencil className="w-4 h-4 text-indigo-400" />
          )}
          <span className="text-sm font-bold text-slate-200">
            {isCreating ? "Nuevo Criterio" : "Editar Criterio"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="active-toggle" className="text-[11px] text-slate-500">
            {formIsActive ? "Activo" : "Inactivo"}
          </Label>
          <Switch
            id="active-toggle"
            checked={formIsActive}
            onCheckedChange={onIsActiveChange}
          />
        </div>
      </div>

      {/* Formulario */}
      <div className="p-5 flex flex-col gap-5">
        {/* Mensaje de feedback */}
        {message && (
          <div
            className={`p-3 text-xs font-medium rounded-xl text-center border ${
              message.type === "success"
                ? "bg-emerald-950/30 border-emerald-500/25 text-emerald-400"
                : "bg-red-950/30 border-red-500/25 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Nombre */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="criterion-name" className="text-slate-300 text-xs font-semibold">
            Nombre del Criterio
          </Label>
          <Input
            id="criterion-name"
            value={formName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ej: Estructura del Microcurso"
            className="bg-slate-900/60 border-slate-800 text-slate-100 rounded-xl h-10 text-sm placeholder:text-slate-600"
          />
        </div>

        {/* Descripción / Regla */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="criterion-desc" className="text-slate-300 text-xs font-semibold">
            Descripción / Regla para la IA
          </Label>
          <p className="text-[10px] text-slate-600 leading-relaxed -mt-1">
            Redacta de manera clara y específica lo que la IA debe buscar. Mientras más precisa la regla, mejor será el resultado.
          </p>
          <Textarea
            id="criterion-desc"
            value={formDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Ej: El documento debe incluir las secciones de Introducción, Desarrollo y Conclusión claramente diferenciadas..."
            rows={5}
            className="bg-slate-900/60 border-slate-800 text-slate-100 rounded-xl text-sm placeholder:text-slate-600 resize-none"
          />
        </div>

        {/* Fila: Tipo de Regla + Tipo de Proyecto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rule-type" className="text-slate-300 text-xs font-semibold">
              Tipo de Evaluación
            </Label>
            <Select value={formRuleType} onValueChange={(val) => val && onRuleTypeChange(val)}>
              <SelectTrigger id="rule-type" className="bg-slate-900/60 border-slate-800 text-slate-100 rounded-xl h-10 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                <SelectItem value="ai" className="focus:bg-slate-800 cursor-pointer">
                  IA — Evaluación con Modelo Local
                </SelectItem>
                <SelectItem value="rule" className="focus:bg-slate-800 cursor-pointer">
                  Regla — Validación Determinística
                </SelectItem>
                <SelectItem value="semantic" className="focus:bg-slate-800 cursor-pointer">
                  Semántico — Búsqueda por Similitud
                </SelectItem>
                <SelectItem value="rule_then_ai" className="focus:bg-slate-800 cursor-pointer">
                  Regla + IA — Híbrido
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="project-type" className="text-slate-300 text-xs font-semibold">
              Tipo de Proyecto
              <span className="text-slate-600 font-normal ml-1">(Opcional)</span>
            </Label>
            <Input
              id="project-type"
              value={formProjectType}
              onChange={(e) => onProjectTypeChange(e.target.value)}
              placeholder="Ej: Microcredencial, Diplomado"
              className="bg-slate-900/60 border-slate-800 text-slate-100 rounded-xl h-10 text-xs placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={onSave}
            disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 text-sm font-semibold cursor-pointer gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isCreating ? "Crear Criterio" : "Guardar Cambios"}
              </>
            )}
          </Button>

          {onDelete && (
            <Button
              onClick={onDelete}
              disabled={saving}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-xl h-10 cursor-pointer gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
