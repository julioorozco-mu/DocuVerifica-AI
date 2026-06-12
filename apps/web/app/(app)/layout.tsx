"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, UserProfile } from "@/lib/api";
import AppSidebar from "@/components/dashboard/AppSidebar";
import AppHeader from "@/components/dashboard/AppHeader";
import { HeaderProvider, useHeader } from "@/context/HeaderContext";

function AppLayoutContent({ children, profile, loading }: { children: React.ReactNode; profile: UserProfile | null; loading: boolean }) {
  const { title, breadcrumbs } = useHeader();
  
  const userForHeader = profile
    ? {
        name: profile.full_name ?? "Usuario",
        role: profile.role === "admin" ? "Administrador/a" : "Revisor/a",
        initials: (profile.full_name ?? "US").split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase(),
      }
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans text-[#0F172A]">
      <AppSidebar userRole={profile?.role} isLoading={loading} />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={title}
          breadcrumbs={breadcrumbs}
          userProfile={userForHeader}
          isUserLoading={loading}
        />
        {children}
      </div>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <HeaderProvider>
      <ProtectedLayoutInner>
        {children}
      </ProtectedLayoutInner>
    </HeaderProvider>
  );
}

function ProtectedLayoutInner({ children }: { children: React.ReactNode }) {
  const { push } = useRouter();
  const { profile, loadingProfile, setProfile, setLoadingProfile } = useHeader();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = api.getToken();
      if (!token) {
        push("/login");
        return;
      }

      try {
        const profileData = await api.get<UserProfile>("/auth/me");
        setProfile(profileData);
      } catch {
        api.logout();
        push("/login");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [push, setProfile, setLoadingProfile]);

  return (
    <AppLayoutContent profile={profile} loading={loadingProfile}>
      {children}
    </AppLayoutContent>
  );
}
