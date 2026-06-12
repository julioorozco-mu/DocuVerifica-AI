"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage, UserProfile } from "@/lib/api";
import AppSidebar from "@/components/dashboard/AppSidebar";
import AppHeader from "@/components/dashboard/AppHeader";
import { 
  CloudUpload, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  File as FileIcon, 
  Image as ImageIcon,
  ScanText,
  HardDrive,
  Cpu,
  Trash2,
  Eye,
  MoreVertical,
  X,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocumentUploadClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Configuracion local mocks
  const [prioridad, setPrioridad] = useState("Media");
  const [modos, setModos] = useState({
    ocr: true,
    extraer: true,
    ia: true,
    notificar: false
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = api.getToken();
      if (!token) { router.push("/login"); return; }
      try {
        const data = await api.get<UserProfile>("/auth/me");
        setProfile(data);
      } catch {
        api.logout();
        router.push("/login");
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [router]);

  const userForHeader = profile
    ? {
        name: profile.full_name ?? "Usuario",
        role: profile.role === "admin" ? "Administradora" : "Revisora",
        initials: (profile.full_name ?? "US").split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase(),
      }
    : null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (selectedFile: File) => {
    setError(null);
    const filename = selectedFile.name.toLowerCase();
    if (!filename.endsWith(".pdf") && !filename.endsWith(".docx")) {
      setError("Solo se permiten archivos en formato PDF o DOCX.");
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      await api.uploadFile(file);
      setSuccess(true);
      setTimeout(() => {
        router.push("/documents");
      }, 1500);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al subir el archivo al almacenamiento local."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans text-[#0F172A]">
      <AppSidebar userRole={profile?.role} />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader 
          title="Carga de documentos" 
          breadcrumbs="Documentos / Cargar"
          userProfile={loadingProfile ? null : userForHeader} 
        />

        <main className="flex-1 overflow-auto p-5 lg:p-8">
          <div className="mx-auto max-w-7xl grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Columna Izquierda (Principal) */}
            <div className="xl:col-span-8 flex flex-col gap-6">
              
              {/* Card Subir Documentos */}
              <div className="rounded-[16px] bg-white p-6 md:p-8 border border-[#E5EAF2] shadow-sm">
                <h2 className="text-[18px] font-bold text-[#0F172A] mb-1">Subir documentos</h2>
                <p className="text-[14px] text-[#64748B] mb-6">Carga uno o varios archivos para iniciar la pre-revisión</p>

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed py-14 px-6 text-center transition-all duration-300 ${
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
                    onChange={handleChange}
                    disabled={uploading}
                  />
                  
                  <div className="mb-4 flex h-14 w-14 items-center justify-center text-[#2563EB]">
                    <CloudUpload className="h-10 w-10 stroke-[1.5]" />
                  </div>

                  <h3 className="mb-2 text-[18px] font-bold text-[#0F172A]">Arrastra y suelta tus archivos aquí</h3>
                  <p className="mb-6 text-[14px] text-[#64748B]">PDF, DOCX o imágenes escaneadas</p>

                  <label 
                    htmlFor="file-upload" 
                    className="mb-4 cursor-pointer rounded-[8px] border border-[#BFDBFE] bg-white px-6 py-2.5 text-[14px] font-semibold text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                  >
                    Seleccionar archivos
                  </label>

                  <p className="mb-6 text-[13px] text-[#64748B]">Tamaño máximo por archivo: 25 MB</p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-[4px] border border-red-200 bg-white px-2 py-0.5 text-[12px] font-bold text-[#0F172A]"><FileIcon className="h-3 w-3 text-red-500" /> PDF</div>
                    <div className="flex items-center gap-1.5 rounded-[4px] border border-blue-200 bg-white px-2 py-0.5 text-[12px] font-bold text-[#0F172A]"><FileIcon className="h-3 w-3 text-blue-500" /> DOCX</div>
                    <div className="flex items-center gap-1.5 rounded-[4px] border border-green-200 bg-white px-2 py-0.5 text-[12px] font-bold text-[#0F172A]"><ImageIcon className="h-3 w-3 text-green-500" /> JPG</div>
                    <div className="flex items-center gap-1.5 rounded-[4px] border border-orange-200 bg-white px-2 py-0.5 text-[12px] font-bold text-[#0F172A]"><ImageIcon className="h-3 w-3 text-orange-500" /> PNG</div>
                  </div>
                </div>

                {/* Info Blocks */}
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E5EAF2]">
                  <div className="flex items-start gap-3 sm:px-4">
                    <div className="flex shrink-0 text-blue-500 mt-1">
                      <ScanText className="h-6 w-6 stroke-[1.5]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#0F172A]">OCR automático</p>
                      <p className="text-[12px] text-[#64748B]">si el documento no tiene texto</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-4 sm:pt-0 sm:px-4">
                    <div className="flex shrink-0 text-green-500 mt-1">
                      <HardDrive className="h-6 w-6 stroke-[1.5]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#0F172A]">Los archivos se<br/>almacenan localmente</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-4 sm:pt-0 sm:px-4">
                    <div className="flex shrink-0 text-purple-500 mt-1">
                      <Cpu className="h-6 w-6 stroke-[1.5]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#0F172A]">Pre-revisión</p>
                      <p className="text-[12px] text-[#64748B]">asistida por IA local</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-6 flex items-center gap-3 rounded-[12px] border border-red-200 bg-red-50 p-4 text-[14px] text-red-600">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}
                {success && (
                  <div className="mt-6 flex items-center gap-3 rounded-[12px] border border-emerald-200 bg-emerald-50 p-4 text-[14px] text-emerald-600">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <span className="font-medium">¡Expediente cargado con éxito! Redireccionando...</span>
                  </div>
                )}
              </div>

              {/* Archivos en cola */}
              <div className="rounded-[16px] bg-white p-6 md:p-8 border border-[#E5EAF2] shadow-sm">
                <h2 className="text-[18px] font-bold text-[#0F172A] mb-4">Archivos en cola</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b-2 border-[#E5EAF2] text-[#64748B]">
                        <th className="pb-2 font-bold">Archivo</th>
                        <th className="pb-2 font-bold">Tipo</th>
                        <th className="pb-2 font-bold">Tamaño</th>
                        <th className="pb-2 font-bold">Estado</th>
                        <th className="pb-2 font-bold text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EAF2]">
                      {file ? (
                        <tr className="group hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <FileIcon className="h-4 w-4 text-red-500" />
                              <span className="font-semibold text-[#0F172A]">{file.name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-[#64748B] font-medium uppercase">{file.name.split('.').pop()}</td>
                          <td className="py-3 text-[#64748B] font-medium">{(file.size / (1024 * 1024)).toFixed(1)} MB</td>
                          <td className="py-3">
                            <span className="inline-flex items-center rounded-sm bg-green-100 px-2.5 py-0.5 text-[11px] font-bold text-green-700">
                              Listo para procesar
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-center gap-1 text-[#94A3B8]">
                              <button className="rounded p-1 hover:bg-[#E2E8F0] hover:text-[#0F172A]"><Eye className="h-4 w-4" /></button>
                              <button className="rounded p-1 hover:bg-[#E2E8F0] hover:text-red-600" onClick={() => setFile(null)}><Trash2 className="h-4 w-4" /></button>
                              <button className="rounded p-1 hover:bg-[#E2E8F0] hover:text-[#0F172A]"><MoreVertical className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#64748B] text-[13px]">
                            No hay archivos en cola.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5EAF2] pt-4">
                  <div className="flex items-center gap-2 text-[12px] text-[#64748B]">
                    <Info className="h-4 w-4 text-[#2563EB]" />
                    La revisión estará disponible cuando finalice el procesamiento.
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#0F172A]">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    {file ? "1" : "0"} documentos listos para revisión
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha (Paneles) */}
            <div className="xl:col-span-4 flex flex-col gap-6">
              
              {/* Configuración de carga */}
              <div className="rounded-[16px] bg-white p-6 md:p-8 border border-[#E5EAF2] shadow-sm">
                <h2 className="text-[18px] font-bold text-[#0F172A] mb-6">Configuración de carga</h2>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#0F172A]">Prioridad</label>
                    <div className="flex gap-2">
                      {["Baja", "Media", "Alta"].map((p) => (
                        <button
                          key={p}
                          onClick={() => setPrioridad(p)}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-[8px] py-1.5 text-[12px] font-bold transition-all border ${
                            prioridad === p
                              ? p === "Media" ? "border-orange-200 bg-orange-50 text-[#0F172A]" : p === "Alta" ? "border-red-200 bg-red-50 text-[#0F172A]" : "border-green-200 bg-green-50 text-[#0F172A]"
                              : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            p === "Baja" ? "bg-green-500" : p === "Media" ? "bg-orange-500" : "bg-red-500"
                          }`} />
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[13px] font-bold text-[#0F172A]">Modo de procesamiento</label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[12px] font-semibold text-[#0F172A] cursor-pointer">
                          <input type="checkbox" checked={modos.ocr} onChange={(e) => setModos({...modos, ocr: e.target.checked})} className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]" /> Aplicar OCR automático
                        </label>
                        <label className="flex items-center gap-2 text-[12px] font-semibold text-[#0F172A] cursor-pointer">
                          <input type="checkbox" checked={modos.extraer} onChange={(e) => setModos({...modos, extraer: e.target.checked})} className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]" /> Extraer texto al cargar
                        </label>
                        <label className="flex items-center gap-2 text-[12px] font-semibold text-[#0F172A] cursor-pointer">
                          <input type="checkbox" checked={modos.ia} onChange={(e) => setModos({...modos, ia: e.target.checked})} className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]" /> Ejecutar pre-revisión IA
                        </label>
                        <label className="flex items-center gap-2 text-[12px] font-medium text-[#64748B] cursor-pointer">
                          <input type="checkbox" checked={modos.notificar} onChange={(e) => setModos({...modos, notificar: e.target.checked})} className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]" /> Notificar al revisor asignado
                        </label>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[13px] font-bold text-[#0F172A]">Criterios a aplicar</label>
                      <div className="flex flex-col gap-2 rounded-[8px] border border-[#E2E8F0] p-3 relative h-full">
                        {["Nombre completo", "Fecha vigente", "Firma del responsable", "Folio institucional", "Anexos obligatorios"].map((c) => (
                          <span key={c} className="inline-flex w-max items-center gap-1 rounded bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-bold text-[#2563EB]">
                            {c} <X className="h-3 w-3 cursor-pointer hover:text-blue-800" />
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[8px] bg-[#F8FAFC] p-4 border border-[#E2E8F0]">
                    <div className="mb-3 flex items-center justify-between text-[12px] font-bold text-[#0F172A]">
                      Resumen <Info className="h-3.5 w-3.5 text-[#2563EB]" />
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-[12px] font-medium">
                      <span className="text-[#64748B]">Archivos seleccionados:</span>
                      <span className="text-[#0F172A] text-right">{file ? 1 : 0}</span>
                      
                      <span className="text-[#64748B]">Requieren OCR:</span>
                      <span className="text-[#0F172A] text-right">0</span>
                      
                      <span className="text-[#64748B]">Listos para revisión:</span>
                      <span className="text-[#0F172A] text-right">{file ? 1 : 0}</span>
                      
                      <span className="text-[#64748B]">Peso total:</span>
                      <span className="text-[#0F172A] text-right">{file ? (file.size / (1024 * 1024)).toFixed(1) + " MB" : "0 MB"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <button className="flex shrink-0 whitespace-nowrap items-center gap-1.5 text-[13px] font-bold text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                        <FileIcon className="h-4 w-4" /> Guardar como borrador
                      </button>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" className="h-10 px-5 rounded-[8px] border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] text-[13px] font-bold">
                          Cancelar
                        </Button>
                        <Button 
                          className="h-10 px-5 rounded-[8px] bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-[13px] font-bold"
                          disabled={!file || uploading}
                          onClick={handleUpload}
                        >
                          {uploading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...</>
                          ) : (
                            <><CloudUpload className="mr-2 h-4 w-4" /> Cargar y procesar</>
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-right text-[12px] font-medium text-[#64748B]">
                      Después del procesamiento podrás ir a revisión.
                    </p>
                  </div>
                </div>
              </div>

              {/* Flujo del documento */}
              <div className="rounded-[16px] bg-white p-6 md:p-8 border border-[#E5EAF2] shadow-sm">
                <h2 className="text-[18px] font-bold text-[#0F172A] mb-6">Flujo del documento</h2>
                
                <div className="relative space-y-6">
                  {/* Linea conectora */}
                  <div className="absolute left-[13px] top-[24px] bottom-[24px] w-[2px] bg-[#E2E8F0]"></div>
                  
                  {[
                    { title: "Carga", desc: "Sube tus documentos y configura el proceso", active: true },
                    { title: "Extracción de texto", desc: "OCR automático y extracción de información", active: false },
                    { title: "Pre-revisión IA", desc: "Validación inicial, criterios y detección de inconsistencias", active: false },
                    { title: "Dictamen humano", desc: "Revisión y dictamen final del revisor asignado", active: false }
                  ].map((step, i) => (
                    <div key={i} className="relative flex gap-4">
                      <div className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold z-10 ${
                        step.active ? "bg-[#2563EB] text-white ring-4 ring-white" : "bg-[#F8FAFC] text-[#64748B] ring-4 ring-white border border-[#E2E8F0]"
                      }`}>
                        {i + 1}
                      </div>
                      <div className="pt-0.5">
                        <h3 className={`text-[13px] font-bold leading-none ${step.active ? "text-[#0F172A]" : "text-[#0F172A]"}`}>
                          {step.title}
                        </h3>
                        <p className="mt-1 text-[12px] font-medium text-[#64748B]">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-2 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-[12px] font-medium text-[#64748B]">
                  <Info className="h-4 w-4 shrink-0 text-[#2563EB]" />
                  <span>Después del procesamiento, la siguiente acción disponible será: <span className="font-bold text-[#2563EB] cursor-pointer hover:underline">Ir a revisión.</span></span>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
