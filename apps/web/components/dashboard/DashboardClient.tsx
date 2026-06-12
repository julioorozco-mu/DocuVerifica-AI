"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, DashboardMetrics, UserProfile } from "@/lib/api";

import { useSetHeader, useHeader } from "@/context/HeaderContext";
import AiQueueStatusCard from "@/components/dashboard/AiQueueStatusCard";
import CriticalAlertsCard, { CriticalAlertItem } from "@/components/dashboard/CriticalAlertsCard";
import DashboardKpiCard from "@/components/dashboard/DashboardKpiCard";
import DashboardSummaryCard from "@/components/dashboard/DashboardSummaryCard";
import DocumentSummaryCard from "@/components/dashboard/DocumentSummaryCard";
import ExecutiveReportsCard from "@/components/dashboard/ExecutiveReportsCard";
import LatestDocumentsTable from "@/components/dashboard/LatestDocumentsTable";
import RecentActivityCard, { RecentActivityItem } from "@/components/dashboard/RecentActivityCard";
import ReviewerProductivityCard from "@/components/dashboard/ReviewerProductivityCard";

import {
  criticalAlerts,
  dashboardSummary,
  documentSummary,
  kpiCards,
  latestDocuments,
  queueStatus,
  recentActivity,
} from "@/lib/mock-dashboard-data";
import type { AiStatus, HumanStatus, LatestDocument } from "@/lib/mock-dashboard-data";

const DOCUMENT_TYPE_COLORS = ["#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#94a3b8"];

function getInitials(name?: string | null): string {
  return (name ?? "US")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function formatDateParts(value?: string | null): { fecha: string; hora: string } {
  if (!value) return { fecha: "—", hora: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { fecha: "—", hora: "" };

  return {
    fecha: date.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }),
    hora: date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

function mapAiStatus(status?: string | null): AiStatus {
  const normalized = status?.toLowerCase();
  if (!normalized) return null;
  if (normalized === "cumple") return "Cumple";
  if (normalized === "no_cumple") return "No cumple";
  if (normalized === "requiere_revision") return "Requiere revisión";
  if (normalized === "no_encontrado") return "No encontrado";
  if (normalized === "en_cola_ia" || normalized === "en cola ia") return "En cola IA";
  return null;
}

function mapHumanStatus(status?: string | null): HumanStatus {
  const normalized = status?.toLowerCase();
  if (!normalized) return null;
  if (normalized === "cumple") return "Cumple";
  if (normalized === "no_cumple") return "No cumple";
  if (normalized === "requiere_revision") return "Requiere revisión";
  if (normalized === "pendiente") return "Pendiente";
  return null;
}

function isAttentionStatus(aiStatus: AiStatus, humanStatus: HumanStatus, rawStatus?: string): boolean {
  return (
    aiStatus === "Requiere revisión" ||
    aiStatus === "No cumple" ||
    humanStatus === "Requiere revisión" ||
    humanStatus === "No cumple" ||
    rawStatus === "error"
  );
}

function adaptLatestDocuments(metrics: DashboardMetrics | null): LatestDocument[] {
  if (!metrics) return latestDocuments;

  return metrics.recent_activity.map((item) => {
    const dateParts = formatDateParts(item.updated_at ?? item.created_at);
    const reviewerName = item.reviewer ?? "Sin asignar";

    return {
      id: item.id,
      folio: item.folio ?? `DOC-${item.id.slice(0, 8).toUpperCase()}`,
      filename: item.filename,
      tipo: item.document_type ?? "Otros",
      revisor: item.reviewer
        ? {
            name: reviewerName,
            initials: item.reviewer_initials ?? getInitials(reviewerName),
            color: "bg-blue-500",
          }
        : null,
      aiStatus: mapAiStatus(item.ai_status),
      humanStatus: mapHumanStatus(item.human_status),
      fecha: dateParts.fecha,
      hora: dateParts.hora,
    };
  });
}

function adaptSummary(metrics: DashboardMetrics | null) {
  if (!metrics) return dashboardSummary;

  const completed =
    metrics.metrics.approved_documents +
    metrics.metrics.rejected_documents +
    metrics.metrics.revision_required_documents;
  const processing = metrics.recent_activity.filter((item) => mapAiStatus(item.ai_status) === "En cola IA").length;
  const attention =
    metrics.metrics.error_documents +
    metrics.metrics.rejected_documents +
    metrics.metrics.revision_required_documents;
  const pct = (value: number) =>
    metrics.metrics.total_documents > 0 ? Math.round((value / metrics.metrics.total_documents) * 100) : 0;

  return {
    totalDocumentos: metrics.metrics.total_documents,
    completados: completed,
    completadosPct: pct(completed),
    enProcesamiento: processing,
    enProcesamientoPct: pct(processing),
    requierenAtencion: attention,
    requierenAtencionPct: pct(attention),
    tendencia: "Datos reales",
    insight: "Métricas calculadas desde los documentos registrados.",
  };
}

function adaptKpis(metrics: DashboardMetrics | null) {
  if (!metrics) return kpiCards;

  const reviewedToday = metrics.timeline.at(-1)?.revisados ?? 0;
  const queued = metrics.recent_activity.filter((item) => mapAiStatus(item.ai_status) === "En cola IA").length;
  const attention =
    metrics.metrics.error_documents +
    metrics.metrics.rejected_documents +
    metrics.metrics.revision_required_documents;

  return kpiCards.map((card) => {
    if (card.id === "pendientes") return { ...card, value: metrics.metrics.pending_documents, trend: "Datos reales" };
    if (card.id === "en_cola_ia") return { ...card, value: queued, trend: "En proceso" };
    if (card.id === "revisados_hoy") return { ...card, value: reviewedToday, trend: "Hoy" };
    if (card.id === "alertas_criticas") return { ...card, value: attention, trend: "Ver alertas →" };
    return card;
  });
}

function adaptQueueStatus(metrics: DashboardMetrics | null) {
  if (!metrics) return queueStatus;

  const queued = metrics.recent_activity.filter((item) => mapAiStatus(item.ai_status) === "En cola IA").length;
  const humanPending = metrics.metrics.pending_documents;
  const attention =
    metrics.metrics.error_documents +
    metrics.metrics.rejected_documents +
    metrics.metrics.revision_required_documents;
  const completedToday = metrics.timeline.at(-1)?.revisados ?? 0;

  const items = queueStatus.items.map((item) => {
    if (item.label === "En cola") return { ...item, value: queued };
    if (item.label === "Procesando") return { ...item, value: queued };
    if (item.label === "Revisión humana") return { ...item, value: humanPending };
    if (item.label === "Requiere revisión") return { ...item, value: attention };
    if (item.label === "Completados hoy") return { ...item, value: completedToday };
    return item;
  });

  return {
    total: items.reduce((sum, item) => sum + item.value, 0),
    items,
  };
}

function adaptDocumentSummary(metrics: DashboardMetrics | null) {
  if (!metrics) return documentSummary;

  const total = metrics.categories.reduce((sum, category) => sum + category.value, 0);

  return {
    total,
    categories: metrics.categories.map((category, index) => ({
      label: category.name,
      value: category.value,
      pct: total > 0 ? Math.round((category.value / total) * 100) : 0,
      color: category.color || DOCUMENT_TYPE_COLORS[index % DOCUMENT_TYPE_COLORS.length],
    })),
  };
}

function adaptCriticalAlerts(metrics: DashboardMetrics | null): CriticalAlertItem[] {
  if (!metrics) return criticalAlerts;

  return metrics.recent_activity
    .filter((item) => isAttentionStatus(mapAiStatus(item.ai_status), mapHumanStatus(item.human_status), item.status))
    .slice(0, 3)
    .map((item) => {
      const highPriority = item.status === "error" || item.ai_status === "no_cumple" || item.human_status === "no_cumple";
      const queued = mapAiStatus(item.ai_status) === "En cola IA";

      return {
        id: item.id,
        title: queued ? `${item.filename} en cola IA` : `${item.filename} requiere revisión`,
        meta: `${item.reviewer ?? "Sistema"} • ${formatDateParts(item.updated_at).fecha}`,
        priority: highPriority ? "Alta" : "Media",
        priorityColor: highPriority ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
        icon: queued ? "cpu" : "alert-circle",
        iconBg: queued ? "bg-purple-100" : "bg-red-100",
        iconColor: queued ? "text-purple-500" : "text-red-500",
      };
    });
}

function adaptRecentActivity(metrics: DashboardMetrics | null): RecentActivityItem[] {
  if (!metrics) {
    return recentActivity.map((item) => ({
      id: item.id,
      message: item.message,
      actor: item.actor,
      time: item.time,
      type: item.type as RecentActivityItem["type"],
      icon: item.icon as RecentActivityItem["icon"],
    }));
  }

  return metrics.recent_activity.slice(0, 3).map((item) => {
    const aiStatus = mapAiStatus(item.ai_status);
    const humanStatus = mapHumanStatus(item.human_status);
    const needsAttention = isAttentionStatus(aiStatus, humanStatus, item.status);
    const completed = humanStatus === "Cumple" || aiStatus === "Cumple";

    return {
      id: item.id,
      message: `${item.filename} actualizado`,
      actor: item.reviewer ?? "Sistema",
      time: formatDateParts(item.updated_at).fecha,
      type: completed ? "success" : needsAttention ? "warning" : "info",
      icon: completed ? "check" : needsAttention ? "alert" : "file",
    };
  });
}

function adaptReviewerStats(metrics: DashboardMetrics | null) {
  if (!metrics) return undefined;

  const maxReviews = Math.max(...metrics.reviewer_stats.map((reviewer) => reviewer.reviews), 1);

  return metrics.reviewer_stats
    .slice()
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 5)
    .map((reviewer, index) => ({
      rank: index + 1,
      name: reviewer.name,
      reviews: reviewer.reviews,
      max: maxReviews,
    }));
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="grid grid-cols-1 gap-3 2xl:grid-cols-12">
        <div className="h-[168px] rounded-[12px] border border-[#E5EAF2] bg-white p-5 2xl:col-span-5">
          <div className="h-5 w-44 rounded bg-[#E5EAF2] animate-pulse" />
          <div className="mt-8 h-10 w-28 rounded bg-[#EEF2F7] animate-pulse" />
          <div className="mt-5 h-3 w-full max-w-[320px] rounded bg-[#EEF2F7] animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3 2xl:col-span-7 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[168px] rounded-[12px] border border-[#E5EAF2] bg-white p-4">
              <div className="size-9 rounded-[10px] bg-[#EEF2F7] animate-pulse" />
              <div className="mt-8 h-8 w-16 rounded bg-[#E5EAF2] animate-pulse" />
              <div className="mt-4 h-3 w-24 rounded bg-[#EEF2F7] animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[252px] rounded-[12px] border border-[#E5EAF2] bg-white p-5">
            <div className="h-5 w-36 rounded bg-[#E5EAF2] animate-pulse" />
            <div className="mt-8 space-y-3">
              <div className="h-4 w-full rounded bg-[#EEF2F7] animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-[#EEF2F7] animate-pulse" />
              <div className="h-4 w-3/5 rounded bg-[#EEF2F7] animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <div className="h-[260px] rounded-[12px] border border-[#E5EAF2] bg-white p-5">
        <div className="h-5 w-48 rounded bg-[#E5EAF2] animate-pulse" />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-4 w-full rounded bg-[#EEF2F7] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const { push } = useRouter();
  const { profile } = useHeader();
  useSetHeader("Dashboard principal");

  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = api.getToken();
      if (!token) {
        push("/login");
        return;
      }

      try {
        const metricsRequest = api.get<DashboardMetrics>("/dashboard/metrics").catch((error) => {
          console.error("No se pudieron cargar métricas reales del dashboard.", error);
          return null;
        });
        const metrics = await metricsRequest;
        setDashboardMetrics(metrics);
      } catch {
        // Error silenciado, se mantiene loadingSkeleton o vacio si falla
      } finally {
        setLoadingDashboard(false);
      }
    };

    fetchDashboard();
  }, [push]);

  const isReviewer = profile?.role === "revisor";

  const dashboardData = useMemo(
    () => ({
      summary: adaptSummary(dashboardMetrics),
      kpis: adaptKpis(dashboardMetrics),
      queue: adaptQueueStatus(dashboardMetrics),
      documents: adaptDocumentSummary(dashboardMetrics),
      alerts: adaptCriticalAlerts(dashboardMetrics),
      activity: adaptRecentActivity(dashboardMetrics),
      latest: adaptLatestDocuments(dashboardMetrics),
      reviewerStats: adaptReviewerStats(dashboardMetrics),
    }),
    [dashboardMetrics]
  );

  return (
    <main className="flex-1 overflow-auto px-5 py-1 lg:px-6">
      {loadingDashboard ? (
            <DashboardLoadingSkeleton />
          ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 2xl:grid-cols-12">
              <div className="2xl:col-span-5">
                <DashboardSummaryCard data={dashboardData.summary} />
              </div>

              <div className="grid grid-cols-2 gap-3 2xl:col-span-7 2xl:grid-cols-4">
                {dashboardData.kpis.map((kpi) => (
                  <DashboardKpiCard key={kpi.id} data={kpi} />
                ))}
              </div>
            </div>

            <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${isReviewer ? "2xl:grid-cols-3" : "2xl:grid-cols-4"}`}>
              <AiQueueStatusCard data={dashboardData.queue} />
              <DocumentSummaryCard data={dashboardData.documents} />
              {!isReviewer && <ReviewerProductivityCard reviewers={dashboardData.reviewerStats} />}
              <CriticalAlertsCard alerts={dashboardData.alerts} />
            </div>

            <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
              <ExecutiveReportsCard />
              <RecentActivityCard activities={dashboardData.activity} />
            </div>

            <LatestDocumentsTable
              documents={dashboardData.latest}
              showReviewer={!isReviewer}
            />
          </div>
          )}
        </main>
  );
}
