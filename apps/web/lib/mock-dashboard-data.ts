/**
 * Mock data para el Dashboard Principal — DocuVerifica AI
 * Para conectar con backend real: reemplazar cada constante por una llamada a api.get(...)
 * desde DashboardClient usando useEffect + useState.
 */

// ─── Resumen Operativo ────────────────────────────────────────────────────────
export const dashboardSummary = {
  totalDocumentos: 1248,
  completados: 842,
  completadosPct: 67,
  enProcesamiento: 312,
  enProcesamientoPct: 25,
  requierenAtencion: 94,
  requierenAtencionPct: 8,
  tendencia: "+18% vs. mes anterior",
  insight: "El tiempo promedio de revisión disminuyó 14% esta semana.",
};

// ─── KPI Cards (mini tarjetas de métricas) ────────────────────────────────────
export const kpiCards = [
  {
    id: "pendientes",
    label: "Pendientes",
    sublabel: "Documentos por revisar",
    value: 24,
    trend: "+14% vs. ayer",
    trendPositive: false,
    color: "blue" as const,
    icon: "file" as const,
    sparkline: [18, 22, 19, 25, 21, 27, 24],
  },
  {
    id: "en_cola_ia",
    label: "En cola IA",
    sublabel: "Procesando",
    value: 6,
    trend: "-10% vs. ayer",
    trendPositive: true,
    color: "purple" as const,
    icon: "cpu" as const,
    sparkline: [10, 8, 12, 7, 9, 5, 6],
  },
  {
    id: "revisados_hoy",
    label: "Revisados hoy",
    sublabel: "Documentos completados",
    value: 14,
    trend: "+27% vs. ayer",
    trendPositive: true,
    color: "green" as const,
    icon: "check" as const,
    sparkline: [8, 11, 9, 13, 10, 12, 14],
  },
  {
    id: "alertas_criticas",
    label: "Alertas críticas",
    sublabel: "Requieren atención",
    value: 3,
    trend: "Ver alertas →",
    trendPositive: false,
    color: "red" as const,
    icon: "alert" as const,
    sparkline: [1, 3, 2, 5, 3, 4, 3],
  },
];

// ─── Estado Cola IA ────────────────────────────────────────────────────────────
export const queueStatus = {
  total: 60,
  items: [
    { label: "En cola",           value: 6,  color: "#3b82f6", bgColor: "bg-blue-100",   textColor: "text-blue-600",   icon: "clock" },
    { label: "Procesando",        value: 12, color: "#a855f7", bgColor: "bg-purple-100", textColor: "text-purple-600", icon: "cpu" },
    { label: "Revisión humana",   value: 18, color: "#f59e0b", bgColor: "bg-amber-100",  textColor: "text-amber-600",  icon: "user" },
    { label: "Requiere revisión", value: 10, color: "#ef4444", bgColor: "bg-red-100",    textColor: "text-red-600",    icon: "alert" },
    { label: "Completados hoy",   value: 14, color: "#10b981", bgColor: "bg-emerald-100",textColor: "text-emerald-600",icon: "check" },
  ],
};

// ─── Resumen de Documentos (por categoría) ────────────────────────────────────
export const documentSummary = {
  total: 1248,
  categories: [
    { label: "Contratos",  value: 432, pct: 35, color: "#3b82f6" },
    { label: "Estudios",   value: 312, pct: 25, color: "#a855f7" },
    { label: "Solicitudes",value: 218, pct: 17, color: "#f59e0b" },
    { label: "Dictámenes", value: 156, pct: 13, color: "#ef4444" },
    { label: "Otros",      value: 130, pct: 10, color: "#94a3b8" },
  ],
};

// ─── Productividad por Revisor ────────────────────────────────────────────────
export const reviewerProductivity = [
  { rank: 1, name: "Ana López",    initials: "AL", color: "bg-blue-500",   reviews: 48, max: 48 },
  { rank: 2, name: "Carlos Ruiz",  initials: "CR", color: "bg-indigo-500", reviews: 36, max: 48 },
  { rank: 3, name: "Elena Gómez",  initials: "EG", color: "bg-violet-500", reviews: 28, max: 48 },
  { rank: 4, name: "Marco Díaz",   initials: "MD", color: "bg-sky-500",    reviews: 22, max: 48 },
  { rank: 5, name: "Sofía Torres", initials: "ST", color: "bg-cyan-500",   reviews: 18, max: 48 },
];

// ─── Alertas Críticas ─────────────────────────────────────────────────────────
export const criticalAlerts = [
  {
    id: "a1",
    title: "Solicitud_045.pdf requiere revisión",
    meta: "Elena Gómez • Hace 40 min",
    priority: "Alta",
    priorityColor: "bg-red-100 text-red-700",
    icon: "alert-circle",
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
  },
  {
    id: "a2",
    title: "Dictamen_humano_guardado",
    meta: "Marco Díaz • Hace 3 h",
    priority: "Media",
    priorityColor: "bg-amber-100 text-amber-700",
    icon: "file-check",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-500",
  },
  {
    id: "a3",
    title: "Constancia_estudios_118.pdf en cola IA",
    meta: "Sistema IA • Hace 25 min",
    priority: "Media",
    priorityColor: "bg-amber-100 text-amber-700",
    icon: "cpu",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-500",
  },
];

// ─── Reportes Ejecutivos ──────────────────────────────────────────────────────
export const executiveReports = [
  { id: "r1", label: "Resumen semanal",  sublabel: "KPI principales",  icon: "bar-chart",   href: "#" },
  { id: "r2", label: "Productividad",    sublabel: "Por revisor",       icon: "users",        href: "#" },
  { id: "r3", label: "Tiempos de ciclo", sublabel: "Análisis",         icon: "clock",        href: "#" },
  { id: "r4", label: "Exportar datos",   sublabel: "CSV / Excel",       icon: "download",     href: "#" },
];

// ─── Actividad Reciente ───────────────────────────────────────────────────────
export const recentActivity = [
  {
    id: "ev1",
    message: "Constancia_estudios_118.pdf pasó a Revisión humana",
    actor: "Carlos Ruiz",
    time: "Hace 10 min",
    type: "success",
    icon: "check",
  },
  {
    id: "ev2",
    message: "Solicitud_045.pdf requiere revisión",
    actor: "Elena Gómez",
    time: "Hace 40 min",
    type: "warning",
    icon: "alert",
  },
  {
    id: "ev3",
    message: "Dictamen_medico_092.pdf completado",
    actor: "Marco Díaz",
    time: "Hace 1 h",
    type: "success",
    icon: "check",
  },
];

// ─── Últimos Documentos (tabla) ───────────────────────────────────────────────
export type AiStatus = "Cumple" | "No cumple" | "En cola IA" | "Requiere revisión" | "No encontrado" | null;
export type HumanStatus = "Cumple" | "No cumple" | "Requiere revisión" | "Pendiente" | null;

export interface LatestDocument {
  id: string;
  folio: string;
  filename: string;
  tipo: string;
  revisor: { name: string; initials: string; color: string } | null;
  aiStatus: AiStatus;
  humanStatus: HumanStatus;
  fecha: string;
  hora: string;
}

export const latestDocuments: LatestDocument[] = [
  {
    id: "1",
    folio: "DOC-2025-0248",
    filename: "Acta_nacimiento_024.pdf",
    tipo: "Actas",
    revisor: { name: "Ana López",    initials: "AL", color: "bg-blue-500"   },
    aiStatus: "Cumple",
    humanStatus: "Cumple",
    fecha: "16/05/2025",
    hora: "09:42",
  },
  {
    id: "2",
    folio: "DOC-2025-0247",
    filename: "Constancia_estudios_118.pdf",
    tipo: "Estudios",
    revisor: { name: "Carlos Ruiz",  initials: "CR", color: "bg-indigo-500" },
    aiStatus: "En cola IA",
    humanStatus: null,
    fecha: "16/05/2025",
    hora: "09:30",
  },
  {
    id: "3",
    folio: "DOC-2025-0246",
    filename: "Solicitud_045.pdf",
    tipo: "Solicitudes",
    revisor: { name: "Elena Gómez",  initials: "EG", color: "bg-violet-500" },
    aiStatus: "Requiere revisión",
    humanStatus: "Requiere revisión",
    fecha: "16/05/2025",
    hora: "09:15",
  },
  {
    id: "4",
    folio: "DOC-2025-0245",
    filename: "Dictamen_medico_092.pdf",
    tipo: "Dictámenes",
    revisor: { name: "Marco Díaz",   initials: "MD", color: "bg-sky-500"    },
    aiStatus: "No cumple",
    humanStatus: "No cumple",
    fecha: "16/05/2025",
    hora: "08:58",
  },
  {
    id: "5",
    folio: "DOC-2025-0244",
    filename: "Comprobante_domicilio_078.pdf",
    tipo: "Comprobantes",
    revisor: { name: "Sofía Torres", initials: "ST", color: "bg-cyan-500"   },
    aiStatus: "No encontrado",
    humanStatus: "Cumple",
    fecha: "16/05/2025",
    hora: "08:41",
  },
];
