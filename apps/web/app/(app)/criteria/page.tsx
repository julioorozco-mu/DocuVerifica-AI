"use client";

import React, { useEffect, useState } from "react";
import { useHeader, useSetHeader } from "@/context/HeaderContext";
import { CriteriaList } from "@/components/criteria/CriteriaList";
import { CriteriaEditor } from "@/components/criteria/CriteriaEditor";
import { AISimulator } from "@/components/criteria/AISimulator";
import { api, ReviewCriterion, getErrorMessage, type CriterionScope } from "@/lib/api";
import { ListChecks, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function CriteriaPage() {
  const [criteria, setCriteria] = useState<ReviewCriterion[]>([]);
  useSetHeader("Criterios de Revisión", "Criterios / Gestión");
  const { profile } = useHeader();
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Campos del formulario
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formRuleType, setFormRuleType] = useState<string>("ai");
  const [formRulePattern, setFormRulePattern] = useState("");
  const [formProjectType, setFormProjectType] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formScope, setFormScope] = useState<CriterionScope>("individual");
  const [saving, setSaving] = useState(false);
  const canManageGlobalCriteria = profile?.role === "admin";

  const loadCriteria = async () => {
    try {
      const data = await api.get<ReviewCriterion[]>("/criteria");
      setCriteria(data);
    } catch (err) {
      console.error("Error al cargar criterios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchCriteria = async () => {
      try {
        const data = await api.get<ReviewCriterion[]>("/criteria");
        if (active) {
          setCriteria(data);
        }
      } catch (err) {
        console.error("Error al cargar criterios:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCriteria();
    return () => {
      active = false;
    };
  }, []);

  // Seleccionar un criterio existente para editar
  const handleSelect = (criterion: ReviewCriterion) => {
    setIsCreating(false);
    setSelectedId(criterion.id);
    setFormName(criterion.name);
    setFormDescription(criterion.description || "");
    setFormRuleType(criterion.rule_type);
    setFormRulePattern(criterion.rule_pattern || "");
    setFormProjectType(criterion.project_type || "");
    setFormIsActive(criterion.is_active);
    setFormScope(criterion.scope || (criterion.reviewer_id ? "individual" : "global"));
    setMessage(null);
  };

  // Preparar formulario para crear nuevo
  const handleNewCriterion = () => {
    setSelectedId(null);
    setIsCreating(true);
    setFormName("");
    setFormDescription("");
    setFormRuleType("ai");
    setFormRulePattern("");
    setFormProjectType("");
    setFormIsActive(true);
    setFormScope("individual");
    setMessage(null);
  };

  // Guardar (crear o actualizar)
  const handleSave = async () => {
    if (!formName.trim() || !formDescription.trim()) {
      setMessage({ text: "El nombre y la descripción/regla son obligatorios.", type: "error" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      name: formName.trim(),
      description: formDescription.trim(),
      rule_type: formRuleType,
      rule_pattern: formRulePattern.trim() || null,
      project_type: formProjectType.trim() || null,
      is_active: formIsActive,
      scope: formScope,
    };

    try {
      if (isCreating) {
        const created = await api.post<ReviewCriterion>("/criteria", payload);
        setSelectedId(created.id);
        setIsCreating(false);
        setMessage({ text: "Criterio creado exitosamente.", type: "success" });
      } else if (selectedId) {
        await api.put<ReviewCriterion>(`/criteria/${selectedId}`, payload);
        setMessage({ text: "Criterio actualizado exitosamente.", type: "success" });
      }
      await loadCriteria();
    } catch (err) {
      setMessage({ text: getErrorMessage(err, "Error al guardar el criterio."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Eliminar criterio
  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await api.delete(`/criteria/${selectedId}`);
      setSelectedId(null);
      setIsCreating(false);
      setFormName("");
      setFormDescription("");
      setFormScope("individual");
      setMessage({ text: "Criterio eliminado.", type: "success" });
      await loadCriteria();
    } catch (err) {
      setMessage({ text: getErrorMessage(err, "Error al eliminar el criterio."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Criterios agrupados
  const globalCriteria = criteria.filter((c) => !c.reviewer_id);
  const myCriteria = criteria.filter((c) => !!c.reviewer_id);

  if (loading) {
    return (
        <main className="flex-1 overflow-auto p-5 lg:p-6">
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-400 text-sm">Cargando criterios de revisión...</p>
        </div>
        </main>
    );
  }

  const showEditor = isCreating || selectedId !== null;

  return (
      <main className="flex-1 overflow-auto p-5 lg:p-6">
      <div className="flex flex-col h-[calc(100vh-10rem)] gap-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/10 border border-indigo-500/25 p-2.5 rounded-xl text-indigo-400">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Criterios de Revisión
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Configura las reglas que la IA evaluará en cada documento.
              </p>
            </div>
          </div>
          <Button
            onClick={handleNewCriterion}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 rounded-xl cursor-pointer gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Criterio
          </Button>
        </div>

        {/* Layout de 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          
          {/* Columna Izquierda: Lista */}
          <div className="sticky top-6">
            <CriteriaList
              globalCriteria={globalCriteria}
              myCriteria={myCriteria}
              selectedId={selectedId}
              onSelect={handleSelect}
              onNewCriterion={handleNewCriterion}
            />
          </div>

          {/* Columna Derecha: Editor + Simulador */}
          <div className="flex flex-col gap-6">
            {showEditor ? (
              <>
                <CriteriaEditor
                  isCreating={isCreating}
                  formName={formName}
                  formDescription={formDescription}
                  formRuleType={formRuleType}
                  formRulePattern={formRulePattern}
                  formProjectType={formProjectType}
                  formIsActive={formIsActive}
                  formScope={formScope}
                  canManageGlobalCriteria={canManageGlobalCriteria}
                  saving={saving}
                  message={message}
                  onNameChange={setFormName}
                  onDescriptionChange={setFormDescription}
                  onRuleTypeChange={setFormRuleType}
                  onRulePatternChange={setFormRulePattern}
                  onProjectTypeChange={setFormProjectType}
                  onIsActiveChange={setFormIsActive}
                  onScopeChange={setFormScope}
                  onSave={handleSave}
                  onDelete={selectedId ? handleDelete : undefined}
                />
                
                <Separator className="bg-slate-800/60" />

                <AISimulator
                  criterionName={formName}
                  criterionDescription={formDescription}
                  ruleType={formRuleType}
                  rulePattern={formRulePattern}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-10 max-w-md">
                  <ListChecks className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-sm font-bold text-slate-300 mb-2">
                    Selecciona o crea un criterio
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Elige un criterio de la lista para editarlo, o presiona &quot;Nuevo Criterio&quot; para definir una nueva regla que la IA evaluará automáticamente.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </main>
  );
}
