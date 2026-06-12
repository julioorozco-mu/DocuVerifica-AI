"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Download,
  Eye,
  Filter,
  KeyRound,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

import { useSetHeader, useHeader } from "@/context/HeaderContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, UserProfile } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PanelMode = "create" | "detail" | "edit";

interface UserFormState {
  fullName: string;
  email: string;
  role: "admin" | "revisor";
  password: "";
  confirmPassword: "";
  status: "Activo" | "Inactivo" | "Pendiente";
}

const roleOptions: Array<"Todos los roles" | "admin" | "revisor"> = ["Todos los roles", "admin", "revisor"];
const statusOptions: Array<"Todos los estados" | "Activo" | "Inactivo" | "Pendiente"> = ["Todos los estados", "Activo", "Inactivo", "Pendiente"];

const emptyForm: UserFormState = {
  fullName: "",
  email: "",
  role: "revisor",
  password: "",
  confirmPassword: "",
  status: "Activo",
};

function getInitials(name?: string | null): string {
  return (name ?? "US")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "h-6 rounded-[6px] border px-2 text-[12px] font-semibold",
        role === "admin"
          ? "border-violet-100 bg-violet-50 text-violet-700"
          : "border-blue-100 bg-blue-50 text-[#2563EB]"
      )}
    >
      {role === "admin" ? "Administrador" : "Revisor"}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Activo: "border-emerald-100 bg-emerald-50 text-emerald-700",
    Inactivo: "border-red-100 bg-red-50 text-red-600",
    Pendiente: "border-amber-100 bg-amber-50 text-amber-700",
  };

  return (
    <Badge variant="secondary" className={cn("h-6 rounded-[6px] border px-2 text-[12px] font-semibold", styles[status] || styles["Pendiente"])}>
      {status}
    </Badge>
  );
}

function userToForm(user: UserProfile): UserFormState {
  return {
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    password: "",
    confirmPassword: "",
    status: (user.status as any) || "Activo",
  };
}

export default function UsersPage() {
  const { profile } = useHeader();
  useSetHeader("Usuarios", "Usuarios / Gestión de usuarios");

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<(typeof roleOptions)[number]>("Todos los roles");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("Todos los estados");
  
  const [panelMode, setPanelMode] = useState<PanelMode>("create");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.full_name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.role.toLowerCase().includes(normalizedSearch);
      const matchesRole = roleFilter === "Todos los roles" || user.role === roleFilter;
      const userStatus = user.status || "Activo";
      const matchesStatus = statusFilter === "Todos los estados" || userStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, searchTerm, statusFilter, users]);

  // Pagination logic
  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  
  // Reset page if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, pageSize]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalUsers);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const selectedUser = selectedUserId ? users.find((user) => user.id === selectedUserId) ?? null : null;
  const isReadOnly = panelMode === "detail";

  const resetCreateMode = () => {
    setPanelMode("create");
    setSelectedUserId(null);
    setForm(emptyForm);
  };

  const openDetail = (user: UserProfile) => {
    setPanelMode("detail");
    setSelectedUserId(user.id);
    setForm(userToForm(user));
  };

  const openEdit = (user: UserProfile) => {
    setPanelMode("edit");
    setSelectedUserId(user.id);
    setForm(userToForm(user));
  };

  const submitForm = async () => {
    if (panelMode === "create" && form.password !== form.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (panelMode === "create" && form.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setIsSaving(true);
      const payload: any = {
        full_name: form.fullName,
        email: form.email,
        role: form.role,
        status: form.status,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (panelMode === "edit" && selectedUserId) {
        await api.updateUser(selectedUserId, payload);
        toast.success("Usuario actualizado correctamente");
      } else {
        await api.createUser(payload);
        toast.success("Usuario creado correctamente");
      }
      
      await fetchUsers();
      resetCreateMode();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el usuario");
    } finally {
      setIsSaving(false);
    }
  };

  const setUserStatus = async (user: UserProfile, status: string) => {
    try {
      await api.updateUser(user.id, { status });
      toast.success("Estado actualizado");
      await fetchUsers();
      if (selectedUserId === user.id) {
        setForm((current) => ({ ...current, status: status as any }));
      }
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar estado");
    }
  };

  const deleteUser = async (user: UserProfile) => {
    const confirmed = window.confirm(`¿Estás seguro de eliminar permanentemente al usuario: ${user.full_name}?`);
    if (!confirmed) return;
    
    try {
      await api.deleteUser(user.id);
      toast.success("Usuario eliminado correctamente");
      await fetchUsers();
      if (selectedUserId === user.id) resetCreateMode();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar usuario");
    }
  };

  const panelTitle =
    panelMode === "edit" ? "Editar usuario" : panelMode === "detail" ? "Detalle de usuario" : "Nuevo usuario";
  const panelDescription =
    panelMode === "edit"
      ? "Actualiza la información del usuario seleccionado."
      : panelMode === "detail"
        ? "Consulta rol, estado y permisos principales."
        : "Completa la información para crear un nuevo usuario.";

  return (
        <main className="flex-1 overflow-auto p-5 lg:p-6">
          <div className="grid min-h-full grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_370px]">
            <section className="rounded-[18px] border border-[#E5EAF2] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h2 className="text-[19px] font-bold leading-tight text-[#0F172A]">Gestión de usuarios</h2>
                  <p className="mt-1 text-[13px] font-medium text-[#334155]">
                    Administra los usuarios del sistema, roles y permisos.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={fetchUsers}
                    variant="outline"
                    className="h-10 rounded-[8px] border-[#DDE5F0] bg-white px-4 text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    Actualizar
                  </Button>
                  <Button
                    onClick={resetCreateMode}
                    className="h-10 rounded-[8px] bg-[#2563EB] px-4 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)] hover:bg-[#1D4ED8]"
                  >
                    <Plus data-icon="inline-start" />
                    Nuevo usuario
                  </Button>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(260px,1fr)_200px_200px_112px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                  <Input
                    type="search"
                    name="user-search"
                    autoComplete="off"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar usuarios por nombre, correo o rol..."
                    className="h-[46px] rounded-[8px] border-[#DDE5F0] bg-white pl-11 text-[13px] text-[#0F172A] placeholder:text-[#64748B] focus-visible:border-[#2563EB] focus-visible:ring-blue-100"
                  />
                </div>

                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
                  <SelectTrigger className="h-[46px] w-full rounded-[8px] border-[#DDE5F0] bg-white px-3 text-[13px] text-[#0F172A]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#E5EAF2] bg-white">
                    <SelectGroup>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role === "admin" ? "Administrador" : role === "revisor" ? "Revisor" : role}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                  <SelectTrigger className="h-[46px] w-full rounded-[8px] border-[#DDE5F0] bg-white px-3 text-[13px] text-[#0F172A]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#E5EAF2] bg-white">
                    <SelectGroup>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  className="h-[46px] rounded-[8px] border-[#DDE5F0] bg-white text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                >
                  <Filter data-icon="inline-start" />
                  Filtros
                </Button>
              </div>

              <div className="mt-5 overflow-hidden rounded-[8px] border border-[#EEF2F7]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] border-collapse text-left">
                    <thead>
                      <tr className="bg-[#F8FAFC] text-[12px] font-semibold text-[#334155]">
                        <th className="px-3 py-3">Usuario</th>
                        <th className="px-3 py-3">Correo electrónico</th>
                        <th className="px-3 py-3">Rol</th>
                        <th className="px-3 py-3">Estado</th>
                        <th className="px-3 py-3">Último acceso</th>
                        <th className="px-3 py-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EAF2]">
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-[13px] text-[#64748B]">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Cargando usuarios...
                            </div>
                          </td>
                        </tr>
                      ) : paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-[13px] text-[#64748B]">
                            No se encontraron usuarios.
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((user) => {
                          const isCurrentUser = profile?.id === user.id;
                          return (
                            <tr key={user.id} className="group bg-white text-[13px] transition-colors hover:bg-[#F8FAFC]">
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
                                    user.role === "admin" ? "bg-blue-600" : "bg-sky-500"
                                  )}>
                                    {getInitials(user.full_name)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-[#0F172A]">{user.full_name}</span>
                                      {isCurrentUser && (
                                        <Badge className="h-5 rounded-[5px] bg-[#EEF4FF] px-1.5 text-[11px] font-semibold text-[#2563EB]">
                                          Tú
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 font-medium text-[#334155]">{user.email}</td>
                              <td className="px-3 py-3">
                                <RoleBadge role={user.role} />
                              </td>
                              <td className="px-3 py-3">
                                <StatusBadge status={user.status || "Activo"} />
                              </td>
                              <td className="px-3 py-3 font-medium text-[#334155]">-</td>
                              <td className="px-3 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    size="icon-sm"
                                    variant="outline"
                                    aria-label="Ver detalle"
                                    className="rounded-[8px] border-[#DDE5F0] bg-white text-[#1E3A8A] hover:bg-[#EEF4FF]"
                                    onClick={() => openDetail(user)}
                                  >
                                    <Eye />
                                  </Button>
                                  <Button
                                    size="icon-sm"
                                    variant="outline"
                                    aria-label="Editar"
                                    className="rounded-[8px] border-[#DDE5F0] bg-white text-[#1E3A8A] hover:bg-[#EEF4FF]"
                                    onClick={() => openEdit(user)}
                                  >
                                    <Pencil />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      render={
                                        <Button
                                          size="icon-sm"
                                          variant="outline"
                                          aria-label="Mas opciones"
                                          className="rounded-[8px] border-[#DDE5F0] bg-white text-[#1E3A8A] hover:bg-[#EEF4FF]"
                                        />
                                      }
                                    >
                                      <MoreVertical />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 border-[#E5EAF2] bg-white">
                                      <DropdownMenuGroup>
                                        <DropdownMenuItem onClick={(e) => { setUserStatus(user, "Activo"); }} disabled={user.status === "Activo"}>
                                          <UserCheck />
                                          Activar usuario
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { setUserStatus(user, "Inactivo"); }} disabled={user.status === "Inactivo" || isCurrentUser}>
                                          <UserX />
                                          Desactivar usuario
                                        </DropdownMenuItem>
                                      </DropdownMenuGroup>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem variant="destructive" onClick={(e) => { deleteUser(user); }} disabled={isCurrentUser}>
                                        <Trash2 />
                                        Eliminar usuario
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 border-t border-[#EEF2F7] pt-4 md:flex-row md:items-center md:justify-between">
                <p className="text-[13px] font-medium text-[#334155]">
                  Mostrando {totalUsers === 0 ? 0 : startIndex + 1} a {endIndex} de {totalUsers} usuarios
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Button 
                      size="icon-sm" 
                      variant="outline" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || isLoading}
                      className="rounded-[8px] border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50 w-8 h-8 p-0 flex items-center justify-center"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          size="icon-sm"
                          variant={page === currentPage ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                          disabled={isLoading}
                          className={cn(
                            "rounded-[8px] font-semibold text-[13px] w-8 h-8 p-0 flex items-center justify-center transition-all",
                            page === currentPage
                              ? "border-[1.5px] border-[#3B82F6] bg-white text-[#3B82F6] shadow-[0_2px_10px_-3px_rgba(59,130,246,0.2)]"
                              : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                          )}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button 
                      size="icon-sm" 
                      variant="outline" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || isLoading}
                      className="rounded-[8px] border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50 w-8 h-8 p-0 flex items-center justify-center"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))} disabled={isLoading}>
                    <SelectTrigger className="h-9 w-[130px] rounded-[8px] border-[#E2E8F0] bg-white px-3 text-[13px] text-[#0F172A] font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#E5EAF2] bg-white">
                      <SelectGroup>
                        <SelectItem value="10">10 por página</SelectItem>
                        <SelectItem value="20">20 por página</SelectItem>
                        <SelectItem value="50">50 por página</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <aside className="rounded-[18px] border border-[#E5EAF2] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] 2xl:sticky 2xl:top-24 2xl:h-fit">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[19px] font-bold leading-tight text-[#0F172A]">{panelTitle}</h2>
                  <p className="mt-1 text-[13px] font-medium leading-5 text-[#334155]">{panelDescription}</p>
                </div>
                {panelMode !== "create" && selectedUser && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#EEF4FF] text-[13px] font-bold text-[#2563EB]">
                    {getInitials(selectedUser.full_name)}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[#0F172A]">Nombre completo</span>
                  <Input
                    name="new-user-fullname"
                    autoComplete="off"
                    value={form.fullName}
                    readOnly={isReadOnly}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    placeholder="Ej. Ana García López"
                    className="h-10 rounded-[8px] border-[#DDE5F0] bg-white text-[13px] read-only:bg-[#F8FAFC]"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[#0F172A]">Correo electrónico</span>
                  <Input
                    name="new-user-email"
                    autoComplete="off"
                    value={form.email}
                    readOnly={isReadOnly || panelMode === "edit"} // No permitimos cambiar email en modo edit por ahora para simplificar
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="usuario@docuverifica.com"
                    className="h-10 rounded-[8px] border-[#DDE5F0] bg-white text-[13px] read-only:bg-[#F8FAFC]"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[#0F172A]">Rol</span>
                  <Select value={form.role} onValueChange={(value) => setForm((current) => ({...current, role: value as any}))} disabled={isReadOnly}>
                    <SelectTrigger className="h-10 w-full rounded-[8px] border-[#DDE5F0] bg-white px-3 text-[13px] text-[#0F172A] disabled:bg-[#F8FAFC]">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent className="border-[#E5EAF2] bg-white">
                      <SelectGroup>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="revisor">Revisor</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[#0F172A]">{panelMode === "edit" ? "Nueva Contraseña (opcional)" : "Contraseña"}</span>
                  <Input
                    type="password"
                    name="new-user-password"
                    autoComplete="new-password"
                    value={form.password}
                    readOnly={isReadOnly}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value as any }))}
                    placeholder="********"
                    className="h-10 rounded-[8px] border-[#DDE5F0] bg-white text-[13px] read-only:bg-[#F8FAFC]"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[#0F172A]">Confirmar contraseña</span>
                  <Input
                    type="password"
                    name="new-user-password-confirm"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    readOnly={isReadOnly}
                    onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value as any }))}
                    placeholder="********"
                    className="h-10 rounded-[8px] border-[#DDE5F0] bg-white text-[13px] read-only:bg-[#F8FAFC]"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[#0F172A]">Estado</span>
                  <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as any }))} disabled={isReadOnly}>
                    <SelectTrigger className="h-10 w-full rounded-[8px] border-[#DDE5F0] bg-white px-3 text-[13px] text-[#0F172A] disabled:bg-[#F8FAFC]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#E5EAF2] bg-white">
                      <SelectGroup>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </label>

              </div>

              <div className="mt-6 border-t border-[#EEF2F7] pt-5">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={resetCreateMode}
                    disabled={isSaving}
                    className="h-10 flex-1 rounded-[8px] border-[#DDE5F0] bg-white text-[13px] font-semibold text-[#2563EB] hover:bg-[#EEF4FF]"
                  >
                    Cancelar
                  </Button>
                  {panelMode === "detail" ? (
                    <Button
                      onClick={() => selectedUser && openEdit(selectedUser)}
                      className="h-10 flex-1 rounded-[8px] bg-[#2563EB] text-[13px] font-semibold text-white hover:bg-[#1D4ED8]"
                    >
                      Editar usuario
                    </Button>
                  ) : (
                    <Button
                      onClick={submitForm}
                      disabled={isSaving}
                      className="h-10 flex-1 rounded-[8px] bg-[#2563EB] text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)] hover:bg-[#1D4ED8]"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {panelMode === "edit" ? "Guardar cambios" : "Crear usuario"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-[12px] border border-[#DDE5F0] bg-[#F8FAFC] p-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-[#2563EB]" />
                  <p className="text-[12px] font-medium leading-5 text-[#64748B]">
                    Los permisos ahora se gestionan automáticamente en el backend según el rol asigado.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </main>
  );
}
