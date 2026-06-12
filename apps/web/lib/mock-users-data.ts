export type UserRole = "Administrador" | "Revisor";
export type UserStatus = "Activo" | "Inactivo" | "Pendiente";

export type UserPermission =
  | "Acceso al dashboard"
  | "Gestion de documentos"
  | "Revision de documentos"
  | "Gestion de criterios"
  | "Acceso a reportes"
  | "Administracion del sistema";

export interface MockUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastAccess: string;
  initials: string;
  color: string;
  isCurrentUser?: boolean;
  permissions: UserPermission[];
}

export const userPermissions: UserPermission[] = [
  "Acceso al dashboard",
  "Gestion de documentos",
  "Revision de documentos",
  "Gestion de criterios",
  "Acceso a reportes",
  "Administracion del sistema",
];

export const defaultPermissionsByRole: Record<UserRole, UserPermission[]> = {
  Administrador: userPermissions,
  Revisor: [
    "Acceso al dashboard",
    "Gestion de documentos",
    "Revision de documentos",
  ],
};

export const mockUsers: MockUser[] = [
  {
    id: "usr-ana-garcia",
    fullName: "Ana García",
    email: "ana.garcia@docuverifica.com",
    role: "Administrador",
    status: "Activo",
    lastAccess: "16/05/2025 09:42",
    initials: "AG",
    color: "bg-blue-600",
    isCurrentUser: true,
    permissions: defaultPermissionsByRole.Administrador,
  },
  {
    id: "usr-carlos-ruiz",
    fullName: "Carlos Ruiz",
    email: "carlos.ruiz@docuverifica.com",
    role: "Revisor",
    status: "Activo",
    lastAccess: "16/05/2025 09:30",
    initials: "CR",
    color: "bg-violet-600",
    permissions: defaultPermissionsByRole.Revisor,
  },
  {
    id: "usr-elena-gomez",
    fullName: "Elena Gómez",
    email: "elena.gomez@docuverifica.com",
    role: "Revisor",
    status: "Activo",
    lastAccess: "16/05/2025 09:15",
    initials: "EG",
    color: "bg-purple-600",
    permissions: defaultPermissionsByRole.Revisor,
  },
  {
    id: "usr-marco-diaz",
    fullName: "Marco Díaz",
    email: "marco.diaz@docuverifica.com",
    role: "Revisor",
    status: "Activo",
    lastAccess: "16/05/2025 08:58",
    initials: "MD",
    color: "bg-cyan-500",
    permissions: defaultPermissionsByRole.Revisor,
  },
  {
    id: "usr-sofia-torres",
    fullName: "Sofía Torres",
    email: "sofia.torres@docuverifica.com",
    role: "Revisor",
    status: "Activo",
    lastAccess: "16/05/2025 08:41",
    initials: "ST",
    color: "bg-sky-500",
    permissions: defaultPermissionsByRole.Revisor,
  },
  {
    id: "usr-jose-vargas",
    fullName: "José Vargas",
    email: "jose.vargas@docuverifica.com",
    role: "Revisor",
    status: "Activo",
    lastAccess: "15/05/2025 17:22",
    initials: "JV",
    color: "bg-emerald-500",
    permissions: defaultPermissionsByRole.Revisor,
  },
  {
    id: "usr-laura-perez",
    fullName: "Laura Pérez",
    email: "laura.perez@docuverifica.com",
    role: "Revisor",
    status: "Inactivo",
    lastAccess: "-",
    initials: "LP",
    color: "bg-blue-700",
    permissions: defaultPermissionsByRole.Revisor,
  },
  {
    id: "usr-fernando-martinez",
    fullName: "Fernando Martínez",
    email: "fernando.martinez@docuverifica.com",
    role: "Revisor",
    status: "Inactivo",
    lastAccess: "-",
    initials: "FM",
    color: "bg-orange-500",
    permissions: defaultPermissionsByRole.Revisor,
  },
  {
    id: "usr-andrea-castillo",
    fullName: "Andrea Castillo",
    email: "andrea.castillo@docuverifica.com",
    role: "Revisor",
    status: "Pendiente",
    lastAccess: "10/05/2025 14:10",
    initials: "AC",
    color: "bg-violet-600",
    permissions: defaultPermissionsByRole.Revisor,
  },
  {
    id: "usr-ricardo-gutierrez",
    fullName: "Ricardo Gutiérrez",
    email: "ricardo.gutierrez@docuverifica.com",
    role: "Revisor",
    status: "Inactivo",
    lastAccess: "10/05/2025 14:10",
    initials: "RC",
    color: "bg-teal-500",
    permissions: defaultPermissionsByRole.Revisor,
  },
];
