"use client";
/**
 * AppSidebar — Barra lateral izquierda institucional.
 * Fiel al mockup: logo, navegación, tarjeta IA local activa.
 */
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, ListChecks,
  BarChart2, Users, Settings, ShieldCheck, ChevronRight
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",          label: "Dashboard",   icon: LayoutDashboard },
  { href: "/documents",          label: "Documentos",  icon: FileText        },
  { href: "/criteria",           label: "Criterios",   icon: ListChecks      },
  { href: "/reports",            label: "Reportes",    icon: BarChart2       },
  { href: "/admin/users",        label: "Usuarios",    icon: Users           },
  { href: "/settings",           label: "Configuración", icon: Settings      },
];

interface AppSidebarProps {
  userRole?: string;
  isLoading?: boolean;
}

export default function AppSidebar({ userRole, isLoading = false }: AppSidebarProps) {
  const pathname = usePathname();

  // Filtrar según rol si hace falta
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.href === "/admin/users" && userRole !== "admin") return false;
    if (item.href === "/settings" && userRole !== "admin") return false;
    return true;
  });

  return (
    <aside className="sticky top-0 hidden h-screen w-[232px] flex-shrink-0 flex-col overflow-hidden border-r border-[#E5EAF2] bg-white md:flex">
      {/* Logo */}
      <div className="flex h-[72px] items-center gap-3 px-6">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[13px] bg-[#2563EB] shadow-[0_8px_18px_rgba(37,99,235,0.14)]">
          <ShieldCheck className="h-[18px] w-[18px] text-white" />
        </div>
        <span className="whitespace-nowrap text-[17px] font-bold leading-tight tracking-[-0.01em] text-[#0F172A]">
          DocuVerifica AI
        </span>
      </div>

      {/* Navegación principal */}
      <nav className="space-y-3 px-3.5 py-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex h-[46px] w-full items-center gap-3.5 rounded-[9px] px-5">
              <div className="h-[18px] w-[18px] flex-shrink-0 rounded-md bg-[#F1F5F9] animate-pulse" />
              <div className="h-4 w-24 rounded-md bg-[#F1F5F9] animate-pulse" />
            </div>
          ))
        ) : (
          visibleItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex h-[46px] items-center gap-3.5 rounded-[9px] px-5 text-[14px] font-medium transition-colors
                  ${isActive
                    ? "bg-[#EEF4FF] text-[#0B56F0] font-semibold"
                    : "text-[#334155] hover:bg-[#F5F8FC] hover:text-[#0F172A]"
                  }`}
              >
                {isActive && (
                  <span className="absolute left-[-14px] top-2 h-8 w-1 rounded-r-full bg-[#2563EB]" />
                )}
                <Icon
                  className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? "text-[#2563EB]" : "text-[#475569]"}`}
                />
                <span>{label}</span>
              </Link>
            );
          })
        )}
      </nav>

      {/* Tarjeta IA Local Activa */}
      <div className="mx-5 mt-auto mb-16 rounded-[12px] border border-[#D8E0EC] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EEF4FF]">
            <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
          </div>
          <span className="text-[14px] font-semibold text-[#0F172A]">IA local activa</span>
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
        </div>
        <p className="pl-11 text-[12px] text-[#64748B]">
          Modelo: <span className="font-medium text-[#334155]">DV-AI v2.4.1</span>
        </p>
        <button type="button" className="mt-2.5 flex items-center gap-1 pl-11 text-[12px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
          Ver detalles <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Footer */}
      <div className="px-7 pb-6">
        <p className="text-[11px] text-[#64748B]">© 2025 DocuVerifica AI</p>
        <p className="mt-1 text-[11px] text-[#64748B]">Todos los derechos reservados</p>
      </div>
    </aside>
  );
}
