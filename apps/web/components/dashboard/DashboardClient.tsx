"use client";

import React, { useEffect, useState } from "react";
import NavigationLayout from "@/components/NavigationLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, DocumentInfo } from "@/lib/api";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  History,
  ArrowRight,
  Cpu,
  Layers
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardClient() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await api.get<DocumentInfo[]>("/documents");
        setDocuments(data);
      } catch (err) {
        console.error("Error al cargar documentos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  // Métricas dinámicas
  const total = documents.length;
  const pending = documents.filter(d => d.status !== "human_review_done" && d.status !== "error").length;
  const completed = documents.filter(d => d.status === "human_review_done").length;
  const errors = documents.filter(d => d.status === "error").length;

  return (
    <NavigationLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Layers className="w-8 h-8 text-indigo-500" />
              Panel de Control
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-lg">
              Bienvenido al sistema de pre-revisión documental. Monitorea el estado de la cola y gestiona los dictámenes pendientes.
            </p>
          </div>
          <Link href="/documents/upload">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center gap-2 h-11 px-6">
              <Upload className="w-4 h-4" />
              Nuevo Expediente
            </Button>
          </Link>
        </div>

        {/* Estructura Bento Grid Premium */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-3 gap-5">
          
          {/* Card 1: Métricas de Documentos (Ocupa 2/3 en Desktop) */}
          <div className="md:col-span-4 lg:col-span-2 grid grid-cols-2 gap-5">
            
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border-slate-800/80 backdrop-blur-xl shadow-xl hover:border-slate-700/80 transition-all duration-300 group overflow-hidden relative">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Recibidos</CardTitle>
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent className="z-10 relative">
                <div className="text-4xl font-bold text-white tracking-tight">{loading ? "..." : total}</div>
                <p className="text-xs text-slate-500 mt-2 font-medium">Documentos procesados localmente</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border-slate-800/80 backdrop-blur-xl shadow-xl hover:border-yellow-900/30 transition-all duration-300 group overflow-hidden relative">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-all"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pendientes</CardTitle>
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
              </CardHeader>
              <CardContent className="z-10 relative">
                <div className="text-4xl font-bold text-white tracking-tight">{loading ? "..." : pending}</div>
                <p className="text-xs text-slate-500 mt-2 font-medium">Requieren dictamen del revisor</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border-slate-800/80 backdrop-blur-xl shadow-xl hover:border-emerald-900/30 transition-all duration-300 group overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dictaminados</CardTitle>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent className="z-10 relative">
                <div className="text-4xl font-bold text-white tracking-tight">{loading ? "..." : completed}</div>
                <p className="text-xs text-slate-500 mt-2 font-medium">Resoluciones guardadas con éxito</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border-slate-800/80 backdrop-blur-xl shadow-xl hover:border-red-900/30 transition-all duration-300 group overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Errores Carga</CardTitle>
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
              </CardHeader>
              <CardContent className="z-10 relative">
                <div className="text-4xl font-bold text-white tracking-tight">{loading ? "..." : errors}</div>
                <p className="text-xs text-slate-500 mt-2 font-medium">Archivos corruptos o ilegibles</p>
              </CardContent>
            </Card>
          </div>

          {/* Card 2: Estado del Sistema e IA (Ocupa 1/3 en Desktop) */}
          <Card className="md:col-span-4 lg:col-span-1 bg-gradient-to-b from-indigo-950/40 via-slate-900/80 to-slate-950/90 border-indigo-500/20 backdrop-blur-xl shadow-2xl flex flex-col justify-between overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <CardTitle className="text-lg text-white font-bold tracking-wide">Motor de Inferencia</CardTitle>
              </div>
              <CardDescription className="text-slate-400 text-sm leading-relaxed">
                El motor local <span className="text-indigo-300 font-medium">Ollama</span> está en línea y monitoreando la cola de extracción documental de forma segura.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-5 relative z-10">
              <div className="p-4 bg-black/40 border border-slate-800/80 rounded-2xl flex flex-col gap-3 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Estado GPU Local</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-bold tracking-wide border border-emerald-500/20">READY</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Modelo Asignado</span>
                    <span className="text-indigo-300 font-medium">Multi-modelo (Selector Dinámico)</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Procesos Activos</span>
                    <span className="text-slate-300">0 en cola</span>
                  </div>
                </div>
              </div>

              <Link href="/documents/upload" className="block w-full">
                <Button className="w-full bg-white text-indigo-950 hover:bg-slate-200 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] cursor-pointer flex items-center justify-center gap-2 h-12 font-bold transition-all duration-300">
                  Comenzar Pre-Revisión
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card 3: Bandeja Reciente Bento */}
          <Card className="md:col-span-4 lg:col-span-3 bg-slate-900/60 border-slate-800/80 backdrop-blur-xl shadow-xl mt-2">
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800/80 rounded-xl">
                  <History className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white font-bold tracking-wide">Últimos Expedientes Procesados</CardTitle>
                  <CardDescription className="text-slate-400 mt-1">
                    Historial reciente de la cola local. Haz clic en un documento para abrir el workspace de revisión.
                  </CardDescription>
                </div>
              </div>
              <Link href="/documents">
                <Button variant="ghost" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl cursor-pointer">
                  Ir a la Bandeja
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 text-slate-500">
                  <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Cargando registros del sistema...</span>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-slate-700" />
                  No hay documentos procesados aún en el almacenamiento local.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {documents.slice(0, 5).map((doc) => (
                    <Link href={`/documents/${doc.id}`} key={doc.id} className="block group">
                      <div className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors duration-200">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700/50 group-hover:border-indigo-500/30 transition-colors">
                            <FileText className="w-5 h-5 text-indigo-400/80" />
                          </div>
                          <div>
                            <span className="block font-semibold text-slate-200 truncate max-w-xs md:max-w-md group-hover:text-indigo-300 transition-colors">{doc.filename}</span>
                            <span className="block text-xs text-slate-500 mt-0.5 font-medium">ID: {doc.id.substring(0,8)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                            doc.status === "human_review_done" 
                              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                              : doc.status === "error"
                              ? "bg-red-950/40 text-red-400 border border-red-500/20"
                              : "bg-yellow-950/40 text-yellow-400 border border-yellow-500/20"
                          }`}>
                            {doc.status === "human_review_done" ? "Completado" : doc.status === "uploaded" ? "Subido" : doc.status.replace("_", " ")}
                          </span>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all">
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </NavigationLayout>
  );
}
