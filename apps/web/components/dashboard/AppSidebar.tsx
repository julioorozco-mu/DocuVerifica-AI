"use client";
/**
 * AppSidebar — Barra lateral izquierda institucional.
 * Fiel al mockup: logo, navegación, tarjeta IA local activa.
 */
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Search, ListChecks,
  BarChart2, Users, Settings, ShieldCheck, Cpu, ChevronRight
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",          label: "Dashboard",   icon: LayoutDashboard },
  { href: "/documents",          label: "Documentos",  icon: FileText        },
  { href: "/documents/review",   label: "Revisión",    icon: Search          },
  { href: "/criteria",           label: "Criterios",   icon: ListChecks      },
  { href: "/reports",            label: "Reportes",    icon: BarChart2       },
  { href: "/admin/users",        label: "Usuarios",    icon: Users           },
  { href: "/settings",           label: "Configuración", icon: Settings      },
];

interface AppSidebarProps {
  userRole?: string;
}

export default function AppSidebar({ userRole }: AppSidebarProps) {
  const pathname = usePathname();

  // Filtrar según rol si hace falta
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.href === "/admin/users" && userRole !== "admin") return false;
    if (item.href === "/settings" && userRole !== "admin") return false;
    return true;
  });

  return (
    <aside className="hidden md:flex flex-col w-[220px] min-h-screen bg-white border-r border-slate-200 flex-shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-slate-200">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <span className="text-[14px] font-bold text-slate-900 leading-tight">
          DocuVerifica AI
        </span>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all
                ${isActive
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`}
              />
              <span>{label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Tarjeta IA Local Activa */}
      <div className="m-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[12px] font-semibold text-slate-700">IA local activa</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Modelo: <span className="font-medium text-slate-600">DV-AI v2.4.1</span>
        </p>
        <button className="mt-2 text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
          Ver detalles <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-400">© 2025 DocuVerifica AI</p>
        <p className="text-[10px] text-slate-400">Todos los derechos reservados</p>
      </div>
    </aside>
  );
}
