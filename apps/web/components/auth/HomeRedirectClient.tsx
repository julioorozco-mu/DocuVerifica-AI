"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function HomeRedirectClient() {
  const router = useRouter();

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#0b0f19]">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
      <p className="text-slate-400 text-sm font-medium">Redireccionando al portal...</p>
    </div>
  );
}
