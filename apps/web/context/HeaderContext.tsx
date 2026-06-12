"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { UserProfile } from "@/lib/api";
import { usePathname } from "next/navigation";

interface HeaderContextType {
  title: string;
  breadcrumbs?: string;
  profile: UserProfile | null;
  loadingProfile: boolean;
  setTitle: (title: string) => void;
  setBreadcrumbs: (breadcrumbs?: string) => void;
  setHeaderData: (title: string, breadcrumbs?: string) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoadingProfile: (loading: boolean) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  
  let defaultTitle = "Revisión Documental AI";
  let defaultBreadcrumbs: string | undefined = undefined;

  if (pathname.includes("/admin/users")) {
    defaultTitle = "Usuarios";
    defaultBreadcrumbs = "Usuarios / Gestión de usuarios";
  } else if (pathname.includes("/criteria")) {
    defaultTitle = "Criterios de Revisión";
    defaultBreadcrumbs = "Criterios / Gestión";
  } else if (pathname.includes("/documents/") && !pathname.endsWith("/documents")) {
    defaultTitle = "Revisión de Documento";
    defaultBreadcrumbs = "Documentos / Workspace de Revisión";
  } else if (pathname.includes("/documents")) {
    defaultTitle = "Documentos";
    defaultBreadcrumbs = "Documentos / Carga e historial";
  } else if (pathname.includes("/dashboard")) {
    defaultTitle = "Dashboard principal";
    defaultBreadcrumbs = undefined;
  } else if (pathname.includes("/reports")) {
    defaultTitle = "Reportes";
    defaultBreadcrumbs = "Reportes / Métricas";
  } else if (pathname.includes("/settings")) {
    defaultTitle = "Configuración";
    defaultBreadcrumbs = "Configuración / General";
  }

  const [title, setTitle] = useState(defaultTitle);
  const [breadcrumbs, setBreadcrumbs] = useState<string | undefined>(defaultBreadcrumbs);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  const setHeaderData = (newTitle: string, newBreadcrumbs?: string) => {
    setTitle(newTitle);
    setBreadcrumbs(newBreadcrumbs);
  };

  return (
    <HeaderContext.Provider value={{ title, breadcrumbs, profile, loadingProfile, setTitle, setBreadcrumbs, setHeaderData, setProfile, setLoadingProfile }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error("useHeader must be used within a HeaderProvider");
  }
  return context;
}

export function useSetHeader(title: string, breadcrumbs?: string) {
  const { setHeaderData } = useHeader();
  
  useEffect(() => {
    setHeaderData(title, breadcrumbs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, breadcrumbs]);
}
