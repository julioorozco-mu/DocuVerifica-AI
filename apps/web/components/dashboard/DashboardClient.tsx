"use client";

import React, { useEffect, useState } from "react";
import NavigationLayout from "@/components/NavigationLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, DashboardMetrics } from "@/lib/api";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Cpu,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Download
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function DashboardClient() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const result = await api.get<DashboardMetrics>("/dashboard/metrics");
        setData(result);
      } catch (err) {
        console.error("Error al cargar métricas:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  // Fallbacks
  const total = data?.metrics?.total_documents || 0;
  const pending = data?.metrics?.pending_documents || 0;
  const completed = data?.metrics?.approved_documents || 0;
  const errors = data?.metrics?.error_documents || 0;
  const revision = data?.metrics?.revision_required_documents || 0;
  
  const recentDocs = data?.recent_activity || [];
  const reviewerStats = data?.reviewer_stats || [];
  const timeline = data?.timeline || [];
  const categories = data?.categories || [];

  // Datos para Estado general de la cola IA (simulados basados en métricas globales para la demo visual)
  const aiQueueData = [
    { name: "En cola", value: 6, color: "#3b82f6" },
    { name: "Procesando", value: 12, color: "#8b5cf6" },
    { name: "Revisión humana", value: 18, color: "#f59e0b" },
    { name: "Requiere revisión", value: 10, color: "#ef4444" },
    { name: "Completados hoy", value: 14, color: "#10b981" },
  ];

  return (
    <NavigationLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto w-full pb-10">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dashboard principal
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Primera Fila: Resumen Operativo + Mini Gráficas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          
          {/* Bloque Resumen Operativo (ocupa 4 columnas) */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-4 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">Resumen operativo</CardTitle>
                  <CardDescription className="text-xs text-slate-500">Panorama general del sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800">
                
                <div className="p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium">Documentos totales</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{loading ? "..." : total}</div>
                  <div className="flex items-center text-[10px] text-emerald-500 font-medium mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +18% vs. mes anterior
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium">Completados</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{loading ? "..." : completed}</div>
                  <div className="text-[10px] text-emerald-500 font-medium mt-1">
                    67% del total
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-medium">En procesamiento</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{loading ? "..." : pending}</div>
                  <div className="text-[10px] text-purple-500 font-medium mt-1">
                    25% del total
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-medium">Requieren atención</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{loading ? "..." : (revision + errors)}</div>
                  <div className="text-[10px] text-orange-500 font-medium mt-1">
                    8% del total
                  </div>
                </div>

              </div>
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 border-t border-indigo-100 dark:border-indigo-900/30 flex justify-between items-center px-4">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center">
                   El tiempo promedio de revisión disminuyó 14% esta semana.
                </span>
                <Link href="#" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Ver reportes</Link>
              </div>
            </CardContent>
          </Card>

          {/* Mini Cards con Gráficas (1 columna cada una en XL) */}
          <Card className="col-span-1 lg:col-span-2 xl:col-span-1 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col">
            <CardHeader className="pb-0 pt-4 px-4 flex-none">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">Pendientes</CardTitle>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? "-" : pending}</div>
                </div>
                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Documentos por revisar</div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-[60px] relative mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <Line type="monotone" dataKey="pendientes" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="absolute bottom-3 left-4 text-[10px] font-medium text-emerald-500 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> 14% vs. ayer
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-2 xl:col-span-1 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col">
            <CardHeader className="pb-0 pt-4 px-4 flex-none">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">En cola IA</CardTitle>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">6</div>
                </div>
                <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                  <Cpu className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Procesando</div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-[60px] relative mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <Line type="monotone" dataKey="en_cola_ia" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="absolute bottom-3 left-4 text-[10px] font-medium text-emerald-500 flex items-center">
                <TrendingDown className="w-3 h-3 mr-1" /> 10% vs. ayer
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-2 xl:col-span-1 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col">
            <CardHeader className="pb-0 pt-4 px-4 flex-none">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">Revisados hoy</CardTitle>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">14</div>
                </div>
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Documentos completados</div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-[60px] relative mt-2 px-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <Bar dataKey="revisados" fill="#10b981" radius={[2, 2, 0, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
              <div className="absolute bottom-3 left-4 text-[10px] font-medium text-emerald-500 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> 27% vs. ayer
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-2 xl:col-span-1 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col">
            <CardHeader className="pb-0 pt-4 px-4 flex-none">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">Alertas críticas</CardTitle>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{loading ? "-" : errors}</div>
                </div>
                <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Requieren atención</div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-[60px] relative mt-2 px-2 flex flex-col justify-end pb-3">
               <div className="flex items-end justify-between h-8 gap-1 px-2">
                 {[4,7,3,8,2,9,5].map((val, i) => (
                    <div key={i} className="w-full bg-red-400 rounded-t-sm" style={{height: `${val*10}%`}}></div>
                 ))}
               </div>
               <Link href="#" className="absolute bottom-3 left-4 text-[10px] font-semibold text-blue-600 dark:text-blue-400">Ver alertas →</Link>
            </CardContent>
          </Card>

        </div>

        {/* Segunda Fila: Gráficas de Dona y Barras */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Estado Cola IA */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100">Estado general de la cola IA</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex items-center p-4">
               <div className="flex-1">
                 <ul className="space-y-2 text-xs">
                    {aiQueueData.map((item, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                          <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.value}</span>
                      </li>
                    ))}
                 </ul>
                 <Link href="#" className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-4 inline-block">Ver detalle de la cola →</Link>
               </div>
               <div className="w-[120px] h-[120px] relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aiQueueData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {aiQueueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-slate-800 dark:text-white">60</span>
                    <span className="text-[9px] text-slate-500 uppercase">Total</span>
                 </div>
               </div>
            </CardContent>
          </Card>

          {/* Resumen de Documentos */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100">Resumen de documentos</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center p-4">
               <div className="w-[120px] h-[120px] relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories.length ? categories : [{name: "Vacio", value: 1, color: "#ccc"}]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-slate-800 dark:text-white">{total}</span>
                    <span className="text-[9px] text-slate-500 uppercase">Total</span>
                 </div>
               </div>
               <div className="flex-1 ml-4">
                 <ul className="space-y-2 text-[11px]">
                    {categories.map((item, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                          <span className="text-slate-600 dark:text-slate-400 truncate max-w-[80px]" title={item.name}>{item.name}</span>
                        </div>
                        <div className="text-right flex gap-2">
                           <span className="font-semibold text-slate-800 dark:text-slate-200">{item.value}</span>
                           <span className="text-slate-400 w-8">({Math.round((item.value/Math.max(total, 1))*100)}%)</span>
                        </div>
                      </li>
                    ))}
                 </ul>
                 <Link href="/documents" className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-4 inline-block">Ver todos →</Link>
               </div>
            </CardContent>
          </Card>

          {/* Productividad Revisor */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100">Productividad por revisor <span className="text-slate-400 font-normal">(esta semana)</span></CardTitle>
            </CardHeader>
            <CardContent className="p-4">
               {reviewerStats.length > 0 ? (
                 <div className="space-y-3">
                   {reviewerStats.slice(0, 5).map((stat, i) => {
                     const maxReviews = Math.max(...reviewerStats.map(s => s.reviews), 1);
                     const percentage = (stat.reviews / maxReviews) * 100;
                     return (
                       <div key={i} className="flex items-center gap-3 text-xs">
                         <span className="text-slate-400 w-3">{i+1}</span>
                         <span className="text-slate-700 dark:text-slate-300 w-24 truncate">{stat.name}</span>
                         <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-500 rounded-full" style={{width: `${percentage}%`}}></div>
                         </div>
                         <span className="font-semibold text-slate-800 dark:text-slate-200 w-6 text-right">{stat.reviews}</span>
                       </div>
                     )
                   })}
                 </div>
               ) : (
                 <div className="text-xs text-slate-500 py-4 text-center">No hay datos de revisores</div>
               )}
               <Link href="/admin/users" className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-5 inline-block">Ver ranking completo →</Link>
            </CardContent>
          </Card>
        </div>

        {/* Tercera Fila: Tabla de Documentos */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900">
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">Últimos documentos</CardTitle>
            <Link href="/documents" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">Ver todos los documentos →</Link>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3 font-medium">Folio</th>
                  <th className="px-6 py-3 font-medium">Documento</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Revisor</th>
                  <th className="px-6 py-3 font-medium">Estado IA</th>
                  <th className="px-6 py-3 font-medium">Estado Humano</th>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      Cargando registros...
                    </td>
                  </tr>
                ) : recentDocs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No hay documentos recientes.
                    </td>
                  </tr>
                ) : (
                  recentDocs.map((doc) => (
                    <tr key={doc.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-300">
                        DOC-{doc.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-3">
                        <Link href={`/documents/${doc.id}`} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium">
                          <FileText className="w-4 h-4" />
                          {doc.filename}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                        {doc.document_type || "Otros"}
                      </td>
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                        {doc.reviewer ? (
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                               {doc.reviewer.substring(0,2).toUpperCase()}
                             </div>
                             {doc.reviewer}
                           </div>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-3">
                        {doc.ai_status ? (
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                            doc.ai_status === 'cumple' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                            doc.ai_status === 'no_cumple' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                            doc.ai_status === 'requiere_revision' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' :
                            doc.ai_status === 'no_encontrado' ? 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400' :
                            'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                          }`}>
                            {doc.ai_status.replace("_", " ")}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-3">
                         {doc.human_status ? (
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                            doc.human_status === 'cumple' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                            doc.human_status === 'no_cumple' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                            doc.human_status === 'requiere_revision' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                          }`}>
                            {doc.human_status.replace("_", " ")}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-3 text-slate-500 dark:text-slate-400 text-xs">
                        {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() + ' ' + new Date(doc.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
        
      </div>
    </NavigationLayout>
  );
}
