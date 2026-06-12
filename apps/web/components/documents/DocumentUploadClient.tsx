"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  CloudUpload,
  Cpu,
  Download,
  Eye,
  File as FileIcon,
  HardDrive,
  Info,
  Loader2,
  RefreshCw,
  ScanText,
  Search,
  ShieldAlert,
  Table2,
  Trash2,
  X,
} from "lucide-react";

import AppHeader from "@/components/dashboard/AppHeader";
import AppSidebar from "@/components/dashboard/AppSidebar";
import {
  filterDocuments,
  formatDocumentDate,
  formatFileSize,
  getDocumentMetrics,
  getDocumentStatusDisplay,
  getFileExtension,
  getStatusBadgeClass,
  STATUS_FILTER_OPTIONS,
  type DocumentStatusFilter,
} from "@/components/documents/document-display";
import { Button } from "@/components/ui/button";
import { api, DocumentInfo, getErrorMessage, UserProfile } from "@/lib/api";

const PRIORITIES = ["Baja", "Media", "Alta"] as const;
const FUTURE_CRITERIA = [
  "Nombre completo",
  "Fecha vigente",
  "Firma del responsable",
  "Folio institucional",
  "Anexos obligatorios",
];

function getInitials(name?: string | null): string {
  return (name ?? "US")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export default function DocumentUploadClient() {
  const { push } = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatusFilter>("all");

  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("Media");

  const loadDocuments = async () => {
    setLoadingDocuments(true);
    setDocumentsError(null);

    try {
      const data = await api.get<DocumentInfo[]>("/documents");
      setDocuments(data);
    } catch (err: unknown) {
      setDocumentsError(getErrorMessage(err, "No se pudo cargar el historial de documentos."));
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = api.getToken();
      if (!token) {
        push("/login");
        return;
      }

      try {
        const [profileData, documentsData] = await Promise.all([
          api.get<UserProfile>("/auth/me"),
          api.get<DocumentInfo[]>("/documents"),
        ]);
        setProfile(profileData);
        setDocuments(documentsData);
      } catch {
        api.logout();
        push("/login");
      } finally {
        setLoadingInitialData(false);
      }
    };

    fetchInitialData();
  }, [push]);

  const userForHeader = profile
    ? {
        name: profile.full_name ?? "Usuario",
        role: profile.role === "admin" ? "Administrador/a" : "Revisor/a",
        initials: getInitials(profile.full_name),
      }
    : null;

  const documentMetrics = useMemo(() => getDocumentMetrics(documents), [documents]);
  const filteredDocuments = useMemo(
    () => filterDocuments(documents, searchTerm, statusFilter),
    [documents, searchTerm, statusFilter]
  );
  const readyDocuments = useMemo(
    () => documents.filter((document) => document.status === "ready_for_review").length,
    [documents]
  );

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setIsDragActive(true);
    } else if (event.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (selectedFile: File) => {
    setError(null);
    setSuccess(false);
    const filename = selectedFile.name.toLowerCase();
    if (!filename.endsWith(".pdf") && !filename.endsWith(".docx")) {
      setError("Solo se permiten archivos en formato PDF o DOCX.");
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      processFile(event.dataTransfer.files[0]);
    }
  };

  const selectUploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (event.target.files && event.target.files[0]) {
      processFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.uploadFile(file);
      setSuccess(true);
      setFile(null);
      await loadDocuments();
      window.setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al subir el archivo al almacenamiento local."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans text-[#0F172A]">
      <AppSidebar userRole={profile?.role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title="Documentos"
          breadcrumbs="Documentos / Carga e historial"
          userProfile={userForHeader}
          isUserLoading={loadingInitialData}
        />

        <main className="flex-1 overflow-auto p-5 lg:p-8">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="flex flex-col gap-6 xl:col-span-8">
              <div className="rounded-[16px] border border-[#E5EAF2] bg-white p-6 shadow-sm md:p-8">
                <h2 className="mb-1 text-[18px] font-bold text-[#0F172A]">Subir documentos</h2>
                <p className="mb-6 text-[14px] text-[#64748B]">
                  Carga un archivo para registrarlo en el almacenamiento local.
                </p>

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed px-6 py-14 text-center transition-all duration-300 ${
                    isDragActive
                      ? "border-[#2563EB] bg-[#EFF6FF]"
                      : "border-[#93C5FD] bg-[#F8FAFC] hover:border-[#60A5FA] hover:bg-[#EFF6FF]"
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={selectUploadFile}
                    disabled={uploading}
                  />

                  <div className="mb-4 flex size-14 items-center justify-center text-[#2563EB]">
                    <CloudUpload className="size-10 stroke-[1.5]" />
                  </div>

                  <h3 className="mb-2 text-[18px] font-bold text-[#0F172A]">Arrastra y suelta tu archivo aquí</h3>
                  <p className="mb-6 text-[14px] text-[#64748B]">PDF o DOCX en esta fase</p>

                  <label
                    htmlFor="file-upload"
                    className="mb-4 cursor-pointer rounded-[8px] border border-[#BFDBFE] bg-white px-6 py-2.5 text-[14px] font-semibold text-[#2563EB] transition-colors hover:bg-[#EFF6FF]"
                  >
                    Seleccionar archivo
                  </label>

                  <p className="mb-6 text-[13px] text-[#64748B]">Tamaño máximo recomendado por archivo: 25 MB</p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-[4px] border border-red-200 bg-white px-2 py-0.5 text-[12px] font-bold text-[#0F172A]">
                      <FileIcon className="size-3 text-red-500" /> PDF
                    </div>
                    <div className="flex items-center gap-1.5 rounded-[4px] border border-blue-200 bg-white px-2 py-0.5 text-[12px] font-bold text-[#0F172A]">
                      <FileIcon className="size-3 text-blue-500" /> DOCX
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 divide-y divide-[#E5EAF2] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <div className="flex items-start gap-3 sm:px-4">
                    <div className="mt-1 flex shrink-0 text-blue-500">
                      <ScanText className="size-6 stroke-[1.5]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#0F172A]">Extracción de texto</p>
                      <p className="text-[12px] text-[#64748B]">disponible desde la Fase 2</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-4 sm:px-4 sm:pt-0">
                    <div className="mt-1 flex shrink-0 text-green-500">
                      <HardDrive className="size-6 stroke-[1.5]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#0F172A]">Los archivos se almacenan localmente</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-4 sm:px-4 sm:pt-0">
                    <div className="mt-1 flex shrink-0 text-purple-500">
                      <Cpu className="size-6 stroke-[1.5]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#0F172A]">Pre-revisión IA</p>
                      <p className="text-[12px] text-[#64748B]">se activará en Fase 5</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-6 flex items-center gap-3 rounded-[12px] border border-red-200 bg-red-50 p-4 text-[14px] text-red-600">
                    <AlertTriangle className="size-5 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}
                {success && (
                  <div className="mt-6 flex items-center gap-3 rounded-[12px] border border-emerald-200 bg-emerald-50 p-4 text-[14px] text-emerald-600">
                    <CheckCircle className="size-5 shrink-0" />
                    <span className="font-medium">Documento cargado. El historial se actualizó correctamente.</span>
                  </div>
                )}
              </div>

              <div className="rounded-[16px] border border-[#E5EAF2] bg-white p-6 shadow-sm md:p-8">
                <h2 className="mb-4 text-[18px] font-bold text-[#0F172A]">Archivos en cola</h2>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b-2 border-[#E5EAF2] text-[#64748B]">
                        <th className="pb-2 font-bold">Archivo</th>
                        <th className="pb-2 font-bold">Tipo</th>
                        <th className="pb-2 font-bold">Tamaño</th>
                        <th className="pb-2 font-bold">Estado</th>
                        <th className="pb-2 text-center font-bold">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EAF2]">
                      {file ? (
                        <tr className="group transition-colors hover:bg-[#F8FAFC]">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <FileIcon className="size-4 text-red-500" />
                              <span className="font-semibold text-[#0F172A]">{file.name}</span>
                            </div>
                          </td>
                          <td className="py-3 font-medium uppercase text-[#64748B]">{getFileExtension(file.name)}</td>
                          <td className="py-3 font-medium text-[#64748B]">{formatFileSize(file.size)}</td>
                          <td className="py-3">
                            <span className="inline-flex items-center rounded-sm bg-green-100 px-2.5 py-0.5 text-[11px] font-bold text-green-700">
                              Listo para subir
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-center gap-1 text-[#94A3B8]">
                              <button
                                type="button"
                                className="rounded p-1 hover:bg-[#E2E8F0] hover:text-red-600"
                                aria-label="Quitar archivo de la cola"
                                onClick={() => setFile(null)}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[13px] text-[#64748B]">
                            No hay archivos en cola.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5EAF2] pt-4">
                  <div className="flex items-center gap-2 text-[12px] text-[#64748B]">
                    <Info className="size-4 text-[#2563EB]" />
                    La revisión estará disponible cuando el documento tenga procesamiento habilitado.
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#0F172A]">
                    <span className="size-1.5 rounded-full bg-green-500" />
                    {file ? "1" : "0"} documentos listos para subir
                  </div>
                </div>
              </div>

              <div className="rounded-[16px] border border-[#E5EAF2] bg-white p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Table2 className="size-5 text-[#2563EB]" />
                      <h2 className="text-[18px] font-bold text-[#0F172A]">Historial de documentos</h2>
                    </div>
                    <p className="mt-1 text-[13px] font-medium text-[#64748B]">
                      Expedientes guardados en el almacenamiento local y registrados en Supabase.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loadDocuments}
                    disabled={loadingDocuments}
                    className="h-10 rounded-[8px] border-[#DDE5F0] bg-white px-4 text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    <RefreshCw className={loadingDocuments ? "size-4 animate-spin" : "size-4"} />
                    Actualizar
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_220px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                    <input
                      type="search"
                      aria-label="Buscar documentos por nombre"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Buscar por nombre de archivo"
                      className="h-10 w-full rounded-[8px] border border-[#DDE5F0] bg-white pl-10 pr-3 text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <select
                    aria-label="Filtrar documentos por estado"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as DocumentStatusFilter)}
                    className="h-10 rounded-[8px] border border-[#DDE5F0] bg-white px-3 text-[13px] font-semibold text-[#334155] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {documentsError && (
                  <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">
                    <ShieldAlert className="size-4" />
                    {documentsError}
                  </div>
                )}

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[#E5EAF2] text-[#64748B]">
                        <th className="pb-3 font-bold">Documento</th>
                        <th className="pb-3 font-bold">Tipo</th>
                        <th className="pb-3 font-bold">Tamaño</th>
                        <th className="pb-3 font-bold">Fecha de carga</th>
                        <th className="pb-3 font-bold">Estado</th>
                        <th className="pb-3 text-right font-bold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EAF2]">
                      {loadingInitialData || loadingDocuments ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[13px] font-medium text-[#64748B]">
                            Cargando historial de documentos...
                          </td>
                        </tr>
                      ) : filteredDocuments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[13px] font-medium text-[#64748B]">
                            No hay documentos que coincidan con la búsqueda.
                          </td>
                        </tr>
                      ) : (
                        filteredDocuments.map((document) => {
                          const status = getDocumentStatusDisplay(document.status);

                          return (
                            <tr key={document.id} className="group transition-colors hover:bg-[#F8FAFC]">
                              <td className="py-3 pr-4">
                                <div className="flex min-w-0 items-center gap-2">
                                  <FileIcon className="size-4 shrink-0 text-red-500" />
                                  <span className="block max-w-[280px] truncate font-semibold text-[#0F172A]">
                                    {document.filename}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 pr-4 font-semibold text-[#64748B]">
                                {getFileExtension(document.filename)}
                              </td>
                              <td className="py-3 pr-4 font-medium text-[#64748B]">
                                {formatFileSize(document.size_bytes)}
                              </td>
                              <td className="py-3 pr-4 font-medium text-[#64748B]">
                                <span className="inline-flex items-center gap-1.5">
                                  <Calendar className="size-3.5 text-[#94A3B8]" />
                                  {formatDocumentDate(document.created_at)}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <span
                                  className={`inline-flex rounded-[6px] border px-2.5 py-1 text-[11px] font-bold ${getStatusBadgeClass(status.tone)}`}
                                >
                                  {status.label}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center justify-end gap-2">
                                  <Link href={`/documents/${document.id}`}>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 rounded-[7px] px-2 text-[12px] font-semibold text-[#334155] hover:bg-[#EEF4FF] hover:text-[#2563EB]"
                                    >
                                      Detalle
                                    </Button>
                                  </Link>
                                  <Link href={`/documents/${document.id}/review`}>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-8 rounded-[7px] border-[#BFDBFE] px-2 text-[12px] font-semibold text-[#2563EB] hover:bg-[#EFF6FF]"
                                    >
                                      <Eye className="size-3.5" />
                                      Revisar
                                    </Button>
                                  </Link>
                                  <a
                                    href={api.getFileUrl(document.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-8 items-center gap-1 rounded-[7px] px-2 text-[12px] font-semibold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                                  >
                                    <Download className="size-3.5" />
                                    Archivo
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 xl:col-span-4">
              <div className="rounded-[16px] border border-[#E5EAF2] bg-white p-6 shadow-sm md:p-8">
                <h2 className="mb-6 text-[18px] font-bold text-[#0F172A]">Configuración de carga</h2>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[13px] font-bold text-[#0F172A]">Prioridad local</p>
                    <div className="flex gap-2">
                      {PRIORITIES.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setPriority(item)}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-[8px] border py-1.5 text-[12px] font-bold transition-all ${
                            priority === item
                              ? item === "Media"
                                ? "border-orange-200 bg-orange-50 text-[#0F172A]"
                                : item === "Alta"
                                  ? "border-red-200 bg-red-50 text-[#0F172A]"
                                  : "border-green-200 bg-green-50 text-[#0F172A]"
                              : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              item === "Baja" ? "bg-green-500" : item === "Media" ? "bg-orange-500" : "bg-red-500"
                            }`}
                          />
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-[13px] font-bold text-[#0F172A]">Modo de procesamiento</p>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B]">
                          <input
                            type="checkbox"
                            checked
                            disabled
                            readOnly
                            className="size-4 rounded border-[#CBD5E1] text-[#94A3B8]"
                          />
                          Extraer texto <span className="font-medium text-[#94A3B8]">(Fase 2)</span>
                        </label>
                        <label className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B]">
                          <input
                            type="checkbox"
                            checked
                            disabled
                            readOnly
                            className="size-4 rounded border-[#CBD5E1] text-[#94A3B8]"
                          />
                          OCR automático <span className="font-medium text-[#94A3B8]">(Fase 3)</span>
                        </label>
                        <label className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B]">
                          <input
                            type="checkbox"
                            checked={false}
                            disabled
                            readOnly
                            className="size-4 rounded border-[#CBD5E1] text-[#94A3B8]"
                          />
                          Pre-revisión IA <span className="font-medium text-[#94A3B8]">(Fase 5)</span>
                        </label>
                        <label className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B]">
                          <input
                            type="checkbox"
                            checked={false}
                            disabled
                            readOnly
                            className="size-4 rounded border-[#CBD5E1] text-[#94A3B8]"
                          />
                          Notificar revisor <span className="font-medium text-[#94A3B8]">(posterior)</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[13px] font-bold text-[#0F172A]">Criterios a aplicar</p>
                      <div className="relative flex h-full flex-col gap-2 rounded-[8px] border border-[#E2E8F0] p-3 opacity-70">
                        {FUTURE_CRITERIA.map((criterion) => (
                          <span
                            key={criterion}
                            className="inline-flex w-max items-center gap-1 rounded bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-bold text-[#2563EB]"
                          >
                            {criterion} <X className="size-3" />
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <div className="mb-3 flex items-center justify-between text-[12px] font-bold text-[#0F172A]">
                      Resumen <Info className="size-3.5 text-[#2563EB]" />
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-[12px] font-medium">
                      <span className="text-[#64748B]">Archivos seleccionados:</span>
                      <span className="text-right text-[#0F172A]">{file ? 1 : 0}</span>

                      <span className="text-[#64748B]">Documentos registrados:</span>
                      <span className="text-right text-[#0F172A]">{documents.length}</span>

                      <span className="text-[#64748B]">Listos para revisión:</span>
                      <span className="text-right text-[#0F172A]">{readyDocuments}</span>

                      <span className="text-[#64748B]">Peso seleccionado:</span>
                      <span className="text-right text-[#0F172A]">{file ? formatFileSize(file.size) : "0 KB"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <button
                        type="button"
                        disabled
                        className="flex shrink-0 cursor-not-allowed items-center gap-1.5 whitespace-nowrap text-[13px] font-bold text-[#94A3B8]"
                      >
                        <FileIcon className="size-4" /> Guardar borrador (posterior)
                      </button>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-[8px] border-[#2563EB] px-5 text-[13px] font-bold text-[#2563EB] hover:bg-[#EFF6FF]"
                          onClick={() => setFile(null)}
                          disabled={!file || uploading}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          className="h-10 rounded-[8px] bg-[#2563EB] px-5 text-[13px] font-bold text-white hover:bg-[#1D4ED8]"
                          disabled={!file || uploading}
                          onClick={handleUpload}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" /> Cargando...
                            </>
                          ) : (
                            <>
                              <CloudUpload className="mr-2 size-4" /> Cargar documento
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-right text-[12px] font-medium text-[#64748B]">
                      En esta fase la carga solo registra el documento y sus metadatos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[16px] border border-[#E5EAF2] bg-white p-6 shadow-sm md:p-8">
                <h2 className="mb-4 text-[18px] font-bold text-[#0F172A]">Resumen documental</h2>
                <div className="grid grid-cols-2 gap-3">
                  {documentMetrics.map((metric) => (
                    <div key={metric.id} className="rounded-[10px] border border-[#E5EAF2] bg-[#F8FAFC] p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">{metric.label}</p>
                      <p className="mt-1 text-[24px] font-bold leading-none text-[#0F172A]">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[16px] border border-[#E5EAF2] bg-white p-6 shadow-sm md:p-8">
                <h2 className="mb-6 text-[18px] font-bold text-[#0F172A]">Flujo del documento</h2>

                <div className="relative space-y-6">
                  <div className="absolute bottom-[24px] left-[13px] top-[24px] w-[2px] bg-[#E2E8F0]" />

                  {[
                    { title: "Carga", desc: "Registro local del archivo y metadatos", active: true },
                    { title: "Extracción de texto", desc: "Fase 2 con Docling", active: false },
                    { title: "OCR", desc: "Fase 3 para PDFs escaneados", active: false },
                    { title: "Dictamen humano", desc: "Revisión final del revisor", active: false },
                  ].map((step, index) => (
                    <div key={step.title} className="relative flex gap-4">
                      <div
                        className={`z-10 flex size-[28px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold ring-4 ring-white ${
                          step.active
                            ? "bg-[#2563EB] text-white"
                            : "border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="pt-0.5">
                        <h3 className="text-[13px] font-bold leading-none text-[#0F172A]">{step.title}</h3>
                        <p className="mt-1 text-[12px] font-medium text-[#64748B]">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-2 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-[12px] font-medium text-[#64748B]">
                  <Info className="size-4 shrink-0 text-[#2563EB]" />
                  <span>Después de la carga, el documento queda disponible en el historial para detalle y revisión.</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
