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
} from "lucide-react";

import AppHeader from "@/components/dashboard/AppHeader";
import AppSidebar from "@/components/dashboard/AppSidebar";
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
import {
  defaultPermissionsByRole,
  mockUsers,
  userPermissions,
  MockUser,
  UserPermission,
  UserRole,
  UserStatus,
} from "@/lib/mock-users-data";
import { cn } from "@/lib/utils";

type PanelMode = "create" | "detail" | "edit";

interface UserFormState {
  fullName: string;
  email: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
  status: UserStatus;
  permissions: UserPermission[];
}

const roleOptions: Array<"Todos los roles" | UserRole> = ["Todos los roles", "Administrador", "Revisor"];
const statusOptions: Array<"Todos los estados" | UserStatus> = ["Todos los estados", "Activo", "Inactivo", "Pendiente"];

const emptyForm: UserFormState = {
  fullName: "",
  email: "",
  role: "Revisor",
  password: "",
  confirmPassword: "",
  status: "Activo",
  permissions: defaultPermissionsByRole.Revisor,
};

const permissionLabels: Record<UserPermission, string> = {
  "Acceso al dashboard": "Acceso al dashboard",
  "Gestion de documentos": "Gestión de documentos",
  "Revision de documentos": "Revisión de documentos",
  "Gestion de criterios": "Gestión de criterios",
  "Acceso a reportes": "Acceso a reportes",
  "Administracion del sistema": "Administración del sistema",
};

function getInitials(name?: string | null): string {
  return (name ?? "US")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "h-6 rounded-[6px] border px-2 text-[12px] font-semibold",
        role === "Administrador"
          ? "border-violet-100 bg-violet-50 text-violet-700"
          : "border-blue-100 bg-blue-50 text-[#2563EB]"
      )}
    >
      {role}
    </Badge>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const styles = {
    Activo: "border-emerald-100 bg-emerald-50 text-emerald-700",
    Inactivo: "border-red-100 bg-red-50 text-red-600",
    Pendiente: "border-amber-100 bg-amber-50 text-amber-700",
  };

  return (
    <Badge variant="secondary" className={cn("h-6 rounded-[6px] border px-2 text-[12px] font-semibold", styles[status])}>
      {status}
    </Badge>
  );
}

function userToForm(user: MockUser): UserFormState {
  return {
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    password: "********",
    confirmPassword: "********",
    status: user.status,
    permissions: user.permissions,
  };
}

function buildUserFromForm(form: UserFormState): MockUser {
  return {
    id: `usr-${Date.now()}`,
    fullName: form.fullName || "Nuevo usuario",
    email: form.email || "usuario@docuverifica.com",
    role: form.role,
    status: form.status,
    lastAccess: "-",
    initials: getInitials(form.fullName || "NU"),
    color: form.role === "Administrador" ? "bg-blue-600" : "bg-sky-500",
    permissions: form.permissions,
  };
}

export default function UsersPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [users, setUsers] = useState<MockUser[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<(typeof roleOptions)[number]>("Todos los roles");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("Todos los estados");
  const [panelMode, setPanelMode] = useState<PanelMode>("create");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = api.getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const data = await api.get<UserProfile>("/auth/me");
        setProfile(data);
        setUsers((current) =>
          current.map((user) => ({
            ...user,
            isCurrentUser: user.email === data.email || user.isCurrentUser,
          }))
        );
      } catch {
        api.logout();
        router.push("/login");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [router]);

  const userForHeader = profile
    ? {
        name: profile.full_name ?? "Usuario",
        role: profile.role === "admin" ? "Administrador" : "Revisor",
        initials: getInitials(profile.full_name),
      }
    : null;

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.fullName.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.role.toLowerCase().includes(normalizedSearch);
      const matchesRole = roleFilter === "Todos los roles" || user.role === roleFilter;
      const matchesStatus = statusFilter === "Todos los estados" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, searchTerm, statusFilter, users]);

  const selectedUser = selectedUserId ? users.find((user) => user.id === selectedUserId) ?? null : null;
  const isReadOnly = panelMode === "detail";

  const resetCreateMode = () => {
    setPanelMode("create");
    setSelectedUserId(null);
    setForm(emptyForm);
  };

  const openDetail = (user: MockUser) => {
    setPanelMode("detail");
    setSelectedUserId(user.id);
    setForm(userToForm(user));
  };

  const openEdit = (user: MockUser) => {
    setPanelMode("edit");
    setSelectedUserId(user.id);
    setForm(userToForm(user));
  };

  const updateRole = (role: UserRole) => {
    setForm((current) => ({
      ...current,
      role,
      permissions: role === "Administrador" ? defaultPermissionsByRole.Administrador : defaultPermissionsByRole.Revisor,
    }));
  };

  const togglePermission = (permission: UserPermission) => {
    setForm((current) => {
      const enabled = current.permissions.includes(permission);
      return {
        ...current,
        permissions: enabled
          ? current.permissions.filter((item) => item !== permission)
          : [...current.permissions, permission],
      };
    });
  };

  const submitForm = () => {
    if (panelMode === "edit" && selectedUserId) {
      setUsers((current) =>
        current.map((user) =>
          user.id === selectedUserId
            ? {
                ...user,
                fullName: form.fullName,
                email: form.email,
                role: form.role,
                status: form.status,
                initials: getInitials(form.fullName),
                permissions: form.permissions,
              }
            : user
        )
      );
      return;
    }

    const newUser = buildUserFromForm(form);
    setUsers((current) => [newUser, ...current]);
    setPanelMode("edit");
    setSelectedUserId(newUser.id);
  };

  const setUserStatus = (user: MockUser, status: UserStatus) => {
    setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, status } : item)));
    if (selectedUserId === user.id) {
      setForm((current) => ({ ...current, status }));
    }
  };

  const deleteUser = (user: MockUser) => {
    const confirmed = window.confirm(`Eliminar usuario: ${user.fullName}`);
    if (!confirmed) return;
    setUsers((current) => current.filter((item) => item.id !== user.id));
    if (selectedUserId === user.id) resetCreateMode();
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
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans text-[#0F172A]">
      <AppSidebar userRole={profile?.role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title="Usuarios"
          breadcrumbs="Usuarios / Gestión de usuarios"
          userProfile={loadingProfile ? null : userForHeader}
        />

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
                    variant="outline"
                    className="h-10 rounded-[8px] border-[#DDE5F0] bg-white px-4 text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    <Download data-icon="inline-start" />
                    Exportar
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
                          {role}
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
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="group bg-white text-[13px] transition-colors hover:bg-[#F8FAFC]">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white", user.color)}>
                                {user.initials}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-[#0F172A]">{user.fullName}</span>
                                  {user.isCurrentUser && (
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
                            <StatusBadge status={user.status} />
                          </td>
                          <td className="px-3 py-3 font-medium text-[#334155]">{user.lastAccess}</td>
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
                                    <DropdownMenuItem onClick={() => setUserStatus(user, "Activo")}>
                                      <UserCheck />
                                      Activar usuario
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setUserStatus(user, "Inactivo")}>
                                      <UserX />
                                      Desactivar usuario
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <KeyRound />
                                      Restablecer contraseña
                                    </DropdownMenuItem>
                                  </DropdownMenuGroup>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem variant="destructive" onClick={() => deleteUser(user)}>
                                    <Trash2 />
                                    Eliminar usuario
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 border-t border-[#EEF2F7] pt-4 md:flex-row md:items-center md:justify-between">
                <p className="text-[13px] font-medium text-[#334155]">
                  Mostrando 1 a {filteredUsers.length} de {users.length + 14} usuarios
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Button size="icon-sm" variant="outline" className="rounded-[8px] border-[#DDE5F0] text-[#64748B]">
                      <X className="rotate-45" />
                    </Button>
                    {[1, 2, 3].map((page) => (
                      <Button
                        key={page}
                        size="icon-sm"
                        variant={page === 1 ? "default" : "outline"}
                        className={cn(
                          "rounded-[8px]",
                          page === 1
                            ? "bg-white text-[#2563EB] ring-1 ring-[#2563EB] hover:bg-[#EEF4FF]"
                            : "border-[#DDE5F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
                        )}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button size="icon-sm" variant="outline" className="rounded-[8px] border-[#DDE5F0] text-[#64748B]">
                      <Plus className="rotate-45" />
                    </Button>
                  </div>
                  <Select value="10 por pagina">
                    <SelectTrigger className="h-9 w-[140px] rounded-[8px] border-[#DDE5F0] bg-white px-3 text-[13px] text-[#0F172A]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#E5EAF2] bg-white">
                      <SelectGroup>
                        <SelectItem value="10 por pagina">10 por pagina</SelectItem>
                        <SelectItem value="20 por pagina">20 por pagina</SelectItem>
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
                    {selectedUser.initials}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[#0F172A]">Nombre completo</span>
                  <Input
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
                    value={form.email}
                    readOnly={isReadOnly}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="usuario@docuverifica.com"
                    className="h-10 rounded-[8px] border-[#DDE5F0] bg-white text-[13px] read-only:bg-[#F8FAFC]"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[#0F172A]">Rol</span>
                  <Select value={form.role} onValueChange={(value) => updateRole(value as UserRole)} disabled={isReadOnly}>
                    <SelectTrigger className="h-10 w-full rounded-[8px] border-[#DDE5F0] bg-white px-3 text-[13px] text-[#0F172A] disabled:bg-[#F8FAFC]">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent className="border-[#E5EAF2] bg-white">
                      <SelectGroup>
                        <SelectItem value="Administrador">Administrador</SelectItem>
                        <SelectItem value="Revisor">Revisor</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <span className="text-[12px] font-medium text-[#334155]">
                    Roles disponibles: <span className="font-semibold text-[#2563EB]">Administrador, Revisor</span>
                  </span>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[#0F172A]">Contraseña</span>
                  <Input
                    type="password"
                    value={form.password}
                    readOnly={isReadOnly}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="********"
                    className="h-10 rounded-[8px] border-[#DDE5F0] bg-white text-[13px] read-only:bg-[#F8FAFC]"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[#0F172A]">Confirmar contraseña</span>
                  <Input
                    type="password"
                    value={form.confirmPassword}
                    readOnly={isReadOnly}
                    onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    placeholder="********"
                    className="h-10 rounded-[8px] border-[#DDE5F0] bg-white text-[13px] read-only:bg-[#F8FAFC]"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[#0F172A]">Estado</span>
                  <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as UserStatus }))} disabled={isReadOnly}>
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

                <div className="pt-1">
                  <p className="mb-3 text-[12px] font-bold text-[#0F172A]">Permisos principales</p>
                  <div className="flex flex-col gap-2.5">
                    {userPermissions.map((permission) => {
                      const checked = form.permissions.includes(permission);
                      return (
                        <label key={permission} className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[#334155]">
                          <span
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-[4px] border transition-colors",
                              checked ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-[#CBD5E1] bg-white"
                            )}
                          >
                            {checked && <Check className="h-3 w-3" />}
                          </span>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            disabled={isReadOnly}
                            onChange={() => togglePermission(permission)}
                          />
                          {permissionLabels[permission]}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-[#EEF2F7] pt-5">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={resetCreateMode}
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
                      className="h-10 flex-1 rounded-[8px] bg-[#2563EB] text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)] hover:bg-[#1D4ED8]"
                    >
                      {panelMode === "edit" ? "Guardar cambios" : "Crear usuario"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-[12px] border border-[#DDE5F0] bg-[#F8FAFC] p-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-[#2563EB]" />
                  <p className="text-[12px] font-medium leading-5 text-[#64748B]">
                    Los permisos se asignan según el rol y podrán conectarse al backend de usuarios cuando el módulo esté listo.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
