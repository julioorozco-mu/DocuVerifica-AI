"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { api, UserProfile } from "@/lib/api";
import { useTheme } from "next-themes";
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
  ListChecks,
  Users,
  Sun,
  Moon
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
  const { theme, setTheme } = useTheme();

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
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0b0f19]">
        <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Validando credenciales de seguridad...</p>
      </div>
    );
  }

  const isReviewMode = /^\/documents\/[^/]+$/.test(pathname);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Documentos", href: "/documents", icon: FileText },
    { name: "Cargar Documento", href: "/documents/upload", icon: Upload },
    { name: "Criterios", href: "/criteria", icon: ListChecks },
  ];

  if (profile?.role === "admin") {
    menuItems.push({ name: "Usuarios", href: "/admin/users", icon: Users });
  }

  return (
    <div className="flex-1 flex min-h-screen bg-slate-50 dark:bg-[#080b11]">
      {/* Sidebar para pantallas grandes */}
      <aside className={`hidden md:flex flex-col bg-white dark:bg-[#0d121f] border-r border-slate-200 dark:border-slate-800/80 z-20 transition-all duration-300 ${isReviewMode ? 'w-16' : 'w-64'}`}>
        {/* Cabecera Sidebar */}
        <div className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#0d121f]/50 px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="bg-indigo-100 dark:bg-indigo-600/10 border border-indigo-200 dark:border-indigo-500/25 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!isReviewMode && <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-white whitespace-nowrap">REVISIÓN DOCS AI</span>}
          </div>
        </div>

        {/* Enlaces de Navegación */}
        <nav className={`flex-1 py-6 space-y-2 overflow-hidden ${isReviewMode ? 'px-2' : 'px-4'}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isReviewMode ? item.name : undefined}
                className={`flex items-center gap-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isReviewMode ? 'justify-center px-0' : 'px-4'} ${
                  isActive 
                    ? "bg-indigo-50/80 dark:bg-gradient-to-r dark:from-indigo-900/40 dark:to-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 shadow-sm dark:shadow-md shadow-indigo-100 dark:shadow-indigo-950/20" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
                {!isReviewMode && <span className="whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Perfil del Usuario en la base de la Sidebar */}
        <div className={`p-4 border-t border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#0d121f]/40 overflow-hidden`}>
          {!isReviewMode ? (
            <>
              <div className="flex items-center gap-3 px-2 py-2 mb-2">
                <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-300 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{profile?.full_name}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400/90 font-medium capitalize">{profile?.role}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  title="Cerrar Sesión"
                  className="flex-1 justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Salir
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="px-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </div>
            </>
          ) : (
             <Button
                onClick={handleLogout}
                variant="ghost"
                title="Cerrar Sesión"
                className="w-full justify-center text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl cursor-pointer p-0 h-10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
          )}
        </div>
      </aside>

      {/* Menú móvil */}
      <div className="md:hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#0d121f] border-r border-slate-200 dark:border-slate-800 z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d121f]/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-white">REVISIÓN DOCS AI</span>
            </div>
            <button type="button" onClick={() => setSidebarOpen(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
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
                      ? "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 inset-x-0 p-4 border-t border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#0d121f]/40">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl text-slate-500 dark:text-slate-300">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{profile?.full_name}</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium capitalize">{profile?.role}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="px-2 text-slate-500 dark:text-slate-400"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl cursor-pointer"
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
        <header className="md:hidden h-16 flex items-center justify-between px-6 bg-white dark:bg-[#0d121f] border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-white">REVISIÓN DOCS AI</span>
          </div>
          <button type="button" onClick={() => setSidebarOpen(true)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
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
