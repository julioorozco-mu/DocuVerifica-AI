"use client";
/**
 * DashboardClient — Orquestador del Dashboard Principal.
 *
 * Usa datos mock de lib/mock-dashboard-data.ts.
 * Para conectar con el backend real, reemplazar los imports del mock
 * por llamadas a api.get<T>(...) dentro del useEffect de fetchData().
 *
 * Estructura Bento Grid:
 * ┌────────────────────────────────────┬──────────────────────────────────┐
 * │  DashboardSummaryCard (col-span-5) │  DashboardKpiCard ×4 (1 cada uno)│
 * ├────────────────┬───────────────────┼──────────────┬───────────────────┤
 * │ AiQueueStatus  │  DocumentSummary  │  Reviewer    │  CriticalAlerts   │
 * ├────────────────┴───────────────────┼──────────────┴───────────────────┤
 * │      ExecutiveReports              │     RecentActivity               │
 * ├────────────────────────────────────┴──────────────────────────────────┤
 * │                   LatestDocumentsTable (full-width)                   │
 * └───────────────────────────────────────────────────────────────────────┘
 */
import React, { useEffect, useState } from "react";
import { api, UserProfile } from "@/lib/api";
import { useRouter } from "next/navigation";

// Layout
import AppSidebar from "@/components/dashboard/AppSidebar";
import AppHeader  from "@/components/dashboard/AppHeader";

// Componentes del bento
import DashboardSummaryCard    from "@/components/dashboard/DashboardSummaryCard";
import DashboardKpiCard        from "@/components/dashboard/DashboardKpiCard";
import AiQueueStatusCard       from "@/components/dashboard/AiQueueStatusCard";
import DocumentSummaryCard     from "@/components/dashboard/DocumentSummaryCard";
import ReviewerProductivityCard from "@/components/dashboard/ReviewerProductivityCard";
import CriticalAlertsCard      from "@/components/dashboard/CriticalAlertsCard";
import ExecutiveReportsCard    from "@/components/dashboard/ExecutiveReportsCard";
import RecentActivityCard      from "@/components/dashboard/RecentActivityCard";
import LatestDocumentsTable    from "@/components/dashboard/LatestDocumentsTable";

// Mock data (reemplazar por fetch a API en producción)
import {
  criticalAlerts,
  dashboardSummary,
  documentSummary,
  kpiCards,
  latestDocuments,
  queueStatus,
  recentActivity,
} from "@/lib/mock-dashboard-data";

export default function DashboardClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ─── Verificación de sesión ───────────────────────────────────────────────
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

  // ─── Para futura integración con API ──────────────────────────────────────
  // const fetchDashboardData = async () => {
  //   const metrics = await api.get<DashboardMetrics>("/dashboard/metrics");
  //   // → actualizar estado con datos reales
  // };

  const userForHeader = profile
    ? {
        name: profile.full_name ?? "Usuario",
        role: profile.role === "admin" ? "Administrador/a" : "Revisor/a",
        initials: (profile.full_name ?? "US").split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase(),
      }
    : null;
  const isReviewer = profile?.role === "revisor";
  const reviewerName = profile?.full_name?.trim().toLocaleLowerCase("es-MX") ?? "";
  const reviewerInitials = userForHeader?.initials ?? "";
  const reviewerDocuments = isReviewer
    ? latestDocuments.filter((document) => {
        const documentReviewerName = document.revisor?.name.trim().toLocaleLowerCase("es-MX");
        const documentReviewerInitials = document.revisor?.initials;

        return documentReviewerName === reviewerName || documentReviewerInitials === reviewerInitials;
      })
    : latestDocuments;
  const visibleLatestDocuments = reviewerDocuments;

  const reviewerTotal = reviewerDocuments.length;
  const reviewerCompleted = reviewerDocuments.filter((document) => document.humanStatus === "Cumple").length;
  const reviewerQueued = reviewerDocuments.filter((document) => document.aiStatus === "En cola IA").length;
  const reviewerNeedsAttention = reviewerDocuments.filter(
    (document) =>
      document.aiStatus === "Requiere revisión" ||
      document.humanStatus === "Requiere revisión" ||
      document.aiStatus === "No cumple" ||
      document.humanStatus === "No cumple"
  ).length;
  const reviewerPending = reviewerDocuments.filter((document) => !document.humanStatus).length;
  const reviewerPct = (value: number) => (reviewerTotal > 0 ? Math.round((value / reviewerTotal) * 100) : 0);

  const visibleSummary = isReviewer
    ? {
        totalDocumentos: reviewerTotal,
        completados: reviewerCompleted,
        completadosPct: reviewerPct(reviewerCompleted),
        enProcesamiento: reviewerQueued,
        enProcesamientoPct: reviewerPct(reviewerQueued),
        requierenAtencion: reviewerNeedsAttention,
        requierenAtencionPct: reviewerPct(reviewerNeedsAttention),
        tendencia: "Vista personal",
        insight: "Resumen calculado con tus documentos asignados.",
      }
    : dashboardSummary;

  const visibleKpiCards = isReviewer
    ? kpiCards.map((card) => {
        if (card.id === "pendientes") {
          return { ...card, value: reviewerPending, trend: "Tus pendientes" };
        }
        if (card.id === "en_cola_ia") {
          return { ...card, value: reviewerQueued, trend: "Tus documentos" };
        }
        if (card.id === "revisados_hoy") {
          return { ...card, value: reviewerCompleted, trend: "Tus completados" };
        }
        if (card.id === "alertas_criticas") {
          return { ...card, value: reviewerNeedsAttention, trend: "Ver alertas →" };
        }
        return card;
      })
    : kpiCards;

  const visibleQueueStatus = isReviewer
    ? {
        total: reviewerQueued + reviewerPending + reviewerNeedsAttention + reviewerCompleted,
        items: queueStatus.items.map((item) => {
          if (item.label === "En cola") return { ...item, value: reviewerQueued };
          if (item.label === "Procesando") return { ...item, value: reviewerQueued };
          if (item.label === "Revisión humana") return { ...item, value: reviewerPending };
          if (item.label === "Requiere revisión") return { ...item, value: reviewerNeedsAttention };
          if (item.label === "Completados hoy") return { ...item, value: reviewerCompleted };
          return item;
        }),
      }
    : queueStatus;

  const documentTypeColors = ["#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#94a3b8"];
  const reviewerTypeCounts = reviewerDocuments.reduce<Record<string, number>>((acc, document) => {
    acc[document.tipo] = (acc[document.tipo] ?? 0) + 1;
    return acc;
  }, {});
  const visibleDocumentSummary = isReviewer
    ? {
        total: reviewerTotal,
        categories: Object.entries(reviewerTypeCounts).map(([label, value], index) => ({
          label,
          value,
          pct: reviewerPct(value),
          color: documentTypeColors[index % documentTypeColors.length],
        })),
      }
    : documentSummary;

  const visibleCriticalAlerts = isReviewer
    ? reviewerDocuments
        .filter(
          (document) =>
            document.aiStatus === "Requiere revisión" ||
            document.humanStatus === "Requiere revisión" ||
            document.aiStatus === "No cumple" ||
            document.humanStatus === "No cumple" ||
            document.aiStatus === "En cola IA"
        )
        .slice(0, 3)
        .map((document) => ({
          id: document.id,
          title:
            document.aiStatus === "En cola IA"
              ? `${document.filename} en cola IA`
              : `${document.filename} requiere revisión`,
          meta: `${document.revisor?.name ?? "Revisor"} • ${document.fecha} ${document.hora}`,
          priority: document.aiStatus === "No cumple" || document.humanStatus === "No cumple" ? "Alta" : "Media",
          priorityColor:
            document.aiStatus === "No cumple" || document.humanStatus === "No cumple"
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700",
          icon: document.aiStatus === "En cola IA" ? "cpu" : "alert-circle",
          iconBg: document.aiStatus === "En cola IA" ? "bg-purple-100" : "bg-red-100",
          iconColor: document.aiStatus === "En cola IA" ? "text-purple-500" : "text-red-500",
        }))
    : criticalAlerts;

  const visibleRecentActivity = isReviewer
    ? reviewerDocuments.slice(0, 3).map((document) => ({
        id: document.id,
        message: `${document.filename} actualizado`,
        actor: document.revisor?.name ?? "Revisor",
        time: `${document.fecha} ${document.hora}`,
        type:
          document.humanStatus === "Cumple"
            ? "success"
            : document.aiStatus === "Requiere revisión" || document.humanStatus === "Requiere revisión"
              ? "warning"
              : "info",
        icon:
          document.humanStatus === "Cumple"
            ? "check"
            : document.aiStatus === "Requiere revisión" || document.humanStatus === "Requiere revisión"
              ? "alert"
              : "file",
      }))
    : recentActivity;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans text-[#0F172A]">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <AppSidebar userRole={profile?.role} />

      {/* ── Área principal ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <AppHeader
          title="Dashboard principal"
          userProfile={loadingProfile ? null : userForHeader}
        />

        {/* Bento Grid */}
        <main className="flex-1 overflow-auto px-5 py-1 lg:px-6">
          <div className="space-y-3">

          {/* ── FILA 1: Resumen operativo + 4 KPI cards ─────────────────── */}
          <div className="grid grid-cols-1 gap-3 2xl:grid-cols-12">
            {/* Resumen operativo — ocupa 5/9 columnas en XL */}
            <div className="2xl:col-span-5">
              <DashboardSummaryCard data={visibleSummary} />
            </div>

            {/* 4 mini KPI cards — 1/9 cada una en XL, 2 cols en MD */}
            <div className="grid grid-cols-2 gap-3 2xl:col-span-7 2xl:grid-cols-4">
              {visibleKpiCards.map((kpi) => (
                <DashboardKpiCard key={kpi.id} data={kpi} />
              ))}
            </div>
          </div>

          {/* ── FILA 2: Cola IA + Resumen docs + Productividad + Alertas ── */}
          <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${isReviewer ? "2xl:grid-cols-3" : "2xl:grid-cols-4"}`}>
            <AiQueueStatusCard data={visibleQueueStatus} />
            <DocumentSummaryCard data={visibleDocumentSummary} />
            {!isReviewer && <ReviewerProductivityCard />}
            <CriticalAlertsCard alerts={visibleCriticalAlerts} />
          </div>

          {/* ── FILA 3: Reportes ejecutivos + Actividad reciente ─────────── */}
          <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
            {/* Reportes ocupa 50% de la fila */}
            <div>
              <ExecutiveReportsCard />
            </div>
            {/* Actividad reciente ocupa el 50% restante */}
            <div>
              <RecentActivityCard activities={visibleRecentActivity} />
            </div>
          </div>

          {/* ── FILA 4: Tabla de últimos documentos ──────────────────────── */}
          <LatestDocumentsTable
            documents={visibleLatestDocuments}
            showReviewer={!isReviewer}
          />

          </div>
        </main>
      </div>
    </div>
  );
}
