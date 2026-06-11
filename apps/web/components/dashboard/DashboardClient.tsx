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
import { kpiCards } from "@/lib/mock-dashboard-data";

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

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
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
        <main className="flex-1 p-5 space-y-4 overflow-auto">

          {/* ── FILA 1: Resumen operativo + 4 KPI cards ─────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-9 gap-4">
            {/* Resumen operativo — ocupa 5/9 columnas en XL */}
            <div className="xl:col-span-5">
              <DashboardSummaryCard />
            </div>

            {/* 4 mini KPI cards — 1/9 cada una en XL, 2 cols en MD */}
            <div className="xl:col-span-4 grid grid-cols-2 xl:grid-cols-4 gap-4">
              {kpiCards.map((kpi) => (
                <DashboardKpiCard key={kpi.id} data={kpi} />
              ))}
            </div>
          </div>

          {/* ── FILA 2: Cola IA + Resumen docs + Productividad + Alertas ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <AiQueueStatusCard />
            <DocumentSummaryCard />
            <ReviewerProductivityCard />
            <CriticalAlertsCard />
          </div>

          {/* ── FILA 3: Reportes ejecutivos + Actividad reciente ─────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Reportes ocupa 2/3 columnas */}
            <div className="xl:col-span-2">
              <ExecutiveReportsCard />
            </div>
            {/* Actividad reciente ocupa 1/3 */}
            <div className="xl:col-span-1">
              <RecentActivityCard />
            </div>
          </div>

          {/* ── FILA 4: Tabla de últimos documentos ──────────────────────── */}
          <LatestDocumentsTable />

        </main>
      </div>
    </div>
  );
}
