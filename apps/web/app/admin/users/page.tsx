"use client";

import { useState, useEffect } from "react";
import { api, UserProfile, getErrorMessage } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, UserCog } from "lucide-react";
import NavigationLayout from "@/components/NavigationLayout";

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get<UserProfile[]>("/users");
      setUsers(data);
    } catch (err) {
      alert(getErrorMessage(err, "Hubo un problema al conectar con el servidor."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: "admin" | "revisor") => {
    try {
      const updatedUser = await api.put<UserProfile>(`/users/${userId}`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      alert("El rol del usuario se actualizó correctamente.");
    } catch (err) {
      alert(getErrorMessage(err, "No se pudo actualizar el rol."));
    }
  };

  return (
    <NavigationLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="h-8 w-8 text-indigo-400" />
            Gestión de Usuarios
          </h1>
          <p className="text-slate-400 mt-2">
            Administra los roles y permisos del equipo de revisión.
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-slate-200">Lista de Usuarios</CardTitle>
            <CardDescription className="text-slate-400">
              Los perfiles son generados automáticamente tras el primer inicio de sesión.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                <UserCog className="h-12 w-12 mb-3 opacity-20" />
                <p>No se encontraron usuarios.</p>
              </div>
            ) : (
              <div className="rounded-md border border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-900/80">
                    <TableRow className="border-slate-800 hover:bg-slate-800/50">
                      <TableHead className="text-slate-400">Nombre</TableHead>
                      <TableHead className="text-slate-400">Email</TableHead>
                      <TableHead className="text-slate-400">Rol</TableHead>
                      <TableHead className="text-slate-400">Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/30">
                        <TableCell className="font-medium text-slate-200">
                          {user.full_name}
                        </TableCell>
                        <TableCell className="text-slate-400">{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(val) => {
                              if (val === "admin" || val === "revisor") {
                                handleRoleChange(user.id, val);
                              }
                            }}
                          >
                            <SelectTrigger className="w-[150px] bg-slate-900 border-slate-700 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-3 w-3 text-red-400" />
                                  <span>Administrador</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="revisor">
                                <div className="flex items-center gap-2">
                                  <UserCog className="h-3 w-3 text-indigo-400" />
                                  <span>Revisor</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </NavigationLayout>
  );
}
