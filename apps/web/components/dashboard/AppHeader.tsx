"use client";
/**
 * AppHeader — Cabecera superior del dashboard.
 * Incluye: título de página, buscador, notificaciones, avatar de usuario.
 */
import React, { useState } from "react";
import { Search, Bell, ChevronDown } from "lucide-react";

interface AppHeaderProps {
  title?: string;
  userProfile?: {
    name: string;
    role: string;
    initials: string;
  } | null;
  isUserLoading?: boolean;
  breadcrumbs?: string | React.ReactNode;
}

export default function AppHeader({
  title = "Dashboard principal",
  userProfile,
  isUserLoading = false,
  breadcrumbs,
}: AppHeaderProps) {
  const [query, setQuery] = useState("");

  const isProfilePending = isUserLoading || !userProfile;
  const displayName = userProfile?.name ?? "";
  const displayRole = userProfile?.role ?? "";
  const initials = userProfile?.initials ?? "";

  return (
    <header className="sticky top-0 z-20 flex min-h-[80px] py-4 items-center justify-between gap-5 border-b border-[#E5EAF2] bg-white px-6">
      {/* Título y Breadcrumbs */}
      <div>
        <h1 className="whitespace-nowrap text-[22px] md:text-[24px] font-bold leading-none tracking-[-0.01em] text-[#0F172A]">
          {title}
        </h1>
        {breadcrumbs && (
          <div className="mt-1.5 text-[13px] font-medium text-[#64748B]">
            {breadcrumbs}
          </div>
        )}
      </div>

      {/* Buscador */}
      <div className="relative hidden w-full max-w-[500px] md:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#334155]" />
        <input
          type="text"
          aria-label="Buscar documentos, folios o revisores"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar documentos, folios, revisores..."
          className="h-12 w-full rounded-[10px] border border-[#DDE5F0] bg-white pl-12 pr-4 text-[14px] text-[#334155] shadow-[0_4px_16px_rgba(15,23,42,0.03)] placeholder:text-[#64748B] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
      </div>

      {/* Acciones derechas */}
      <div className="flex items-center gap-4">
        {/* Notificaciones */}
        <button
          type="button"
          aria-label="Ver notificaciones"
          className="relative flex size-10 items-center justify-center rounded-[10px] text-[#334155] transition-colors hover:bg-[#F5F8FC]"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            3
          </span>
        </button>

        {/* Avatar + nombre */}
        <button
          type="button"
          aria-label={isProfilePending ? "Cargando perfil de usuario" : `Perfil de ${displayName}`}
          className="flex h-12 items-center gap-3 rounded-[10px] border border-[#E5EAF2] bg-white px-3 transition-colors hover:bg-[#F8FAFC]"
          aria-busy={isProfilePending}
        >
          <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#EEF4FF]">
            {isProfilePending ? (
              <span className="h-4 w-5 rounded bg-[#CFE0FF] animate-pulse" />
            ) : (
              <span className="text-[14px] font-bold text-[#2563EB]">{initials}</span>
            )}
          </div>
          <div className="hidden sm:block text-left">
            {isProfilePending ? (
              <>
                <span className="block h-3.5 w-20 rounded bg-[#E5EAF2] animate-pulse" />
                <span className="mt-1.5 block h-2.5 w-14 rounded bg-[#EEF2F7] animate-pulse" />
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold leading-none text-[#0F172A]">{displayName}</p>
                <p className="mt-1 text-[11px] capitalize leading-none text-[#64748B]">{displayRole}</p>
              </>
            )}
          </div>
          <ChevronDown className="hidden size-4 text-[#334155] sm:block" />
        </button>
      </div>
    </header>
  );
}
