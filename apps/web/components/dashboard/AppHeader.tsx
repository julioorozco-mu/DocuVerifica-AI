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
}

export default function AppHeader({
  title = "Dashboard principal",
  userProfile,
}: AppHeaderProps) {
  const [query, setQuery] = useState("");

  const displayName = userProfile?.name ?? "Usuario";
  const displayRole = userProfile?.role ?? "Revisor";
  const initials = userProfile?.initials ?? displayName.substring(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-5 border-b border-[#E5EAF2] bg-white px-6">
      {/* Título */}
      <h1 className="whitespace-nowrap text-[24px] font-bold leading-none tracking-[-0.01em] text-[#0F172A]">
        {title}
      </h1>

      {/* Buscador */}
      <div className="relative hidden w-full max-w-[500px] md:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#334155]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar documentos, folios, revisores..."
          className="h-12 w-full rounded-[10px] border border-[#DDE5F0] bg-white pl-12 pr-4 text-[14px] text-[#334155] shadow-[0_4px_16px_rgba(15,23,42,0.03)] placeholder:text-[#64748B] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
      </div>

      {/* Acciones derechas */}
      <div className="flex items-center gap-4">
        {/* Notificaciones */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-[10px] text-[#334155] transition-colors hover:bg-[#F5F8FC]">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            3
          </span>
        </button>

        {/* Avatar + nombre */}
        <button className="flex h-12 items-center gap-3 rounded-[10px] border border-[#E5EAF2] bg-white px-3 transition-colors hover:bg-[#F8FAFC]">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#EEF4FF]">
            <span className="text-[14px] font-bold text-[#2563EB]">{initials}</span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[13px] font-semibold leading-none text-[#0F172A]">{displayName}</p>
            <p className="mt-1 text-[11px] capitalize leading-none text-[#64748B]">{displayRole}</p>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-[#334155] sm:block" />
        </button>
      </div>
    </header>
  );
}
