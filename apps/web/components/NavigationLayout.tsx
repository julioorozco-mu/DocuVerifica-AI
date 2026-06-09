"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { api, UserProfile } from "@/lib/api";
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  ShieldCheck, 
  LogOut, 
  User, 
  Loader2,
  Menu,
  X,
  ListChecks
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationLayoutProps {
  children: React.ReactNode;
}

export default function NavigationLayout({ children }: NavigationLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = api.getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const userData = await api.get<UserProfile>("/auth/me");
        setProfile(userData);
      } catch (err) {
        console.error("Error al obtener perfil:", err);
        api.logout();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    api.logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#0b0f19]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Validando credenciales de seguridad...</p>
      </div>
    );
  }

  const menuItems = [
    { name: "Panel Control", href: "/dashboard", icon: LayoutDashboard },
    { name: "Bandeja de Documentos", href: "/documents", icon: FileText },
    { name: "Cargar Documento", href: "/documents/upload", icon: Upload },
    { name: "Criterios IA", href: "/criteria", icon: ListChecks },
  ];

  return (
    <div className="flex-1 flex min-h-screen bg-[#080b11]">
      {/* Sidebar para pantallas grandes */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0d121f] border-r border-slate-800/80 z-20">
        {/* Cabecera Sidebar */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60 bg-[#0d121f]/50">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600/10 border border-indigo-500/25 p-2 rounded-xl text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm tracking-wide text-white">REVISIÓN DOCS AI</span>
          </div>
        </div>

        {/* Enlaces de Navegación */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-gradient-to-r from-indigo-900/40 to-indigo-950/20 border border-indigo-500/20 text-indigo-300 shadow-md shadow-indigo-950/20" 
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Perfil del Usuario en la base de la Sidebar */}
        <div className="p-4 border-t border-slate-800/60 bg-[#0d121f]/40">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700/50 text-slate-300">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile?.full_name}</p>
              <p className="text-xs text-indigo-400/90 font-medium capitalize">{profile?.role}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Menú móvil */}
      <div className="md:hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`fixed inset-y-0 left-0 w-64 bg-[#0d121f] border-r border-slate-800 z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-[#0d121f]/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-sm tracking-wide text-white">REVISIÓN DOCS AI</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="px-4 py-6 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-indigo-950/40 border border-indigo-500/20 text-indigo-300" 
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 inset-x-0 p-4 border-t border-slate-800/60 bg-[#0d121f]/40">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="bg-slate-800 p-2.5 rounded-xl text-slate-300">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{profile?.full_name}</p>
                <p className="text-xs text-indigo-400 font-medium capitalize">{profile?.role}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Cerrar Sesión
            </Button>
          </div>
        </aside>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Cabecera Móvil */}
        <header className="md:hidden h-16 flex items-center justify-between px-6 bg-[#0d121f] border-b border-slate-800/80 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm tracking-wide text-white">REVISIÓN DOCS AI</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Layout Workspace / Pantalla */}
        <main className="flex-1 flex flex-col p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
