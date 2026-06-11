"use client";
/**
 * AppHeader — Cabecera superior del dashboard.
 * Incluye: título de página, buscador, notificaciones, avatar de usuario.
 */
import React, { useState } from "react";
import { Search, Bell, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const displayName = userProfile?.name ?? "Usuario";
  const displayRole = userProfile?.role ?? "Revisor";
  const initials = userProfile?.initials ?? displayName.substring(0, 2).toUpperCase();

  return (
    <header className="h-14 flex items-center justify-between gap-4 px-6 bg-white border-b border-slate-200 sticky top-0 z-20">
      {/* Título */}
      <h1 className="text-[18px] font-bold text-slate-900 whitespace-nowrap leading-none">
        {title}
      </h1>

      {/* Buscador */}
      <div className="flex-1 max-w-md relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar documentos, folios, revisores..."
          className="w-full h-9 pl-9 pr-4 text-[13px] rounded-xl border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
        />
      </div>

      {/* Acciones derechas */}
      <div className="flex items-center gap-2">
        {/* Toggle tema */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
            title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        {/* Notificaciones */}
        <button className="relative w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />
        </button>

        {/* Separador */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Avatar + nombre */}
        <button className="flex items-center gap-2.5 hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[12px] font-semibold text-slate-800 leading-none">{displayName}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none capitalize">{displayRole}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
