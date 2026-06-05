"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import NavigationLayout from "@/components/NavigationLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, getErrorMessage } from "@/lib/api";
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function DocumentUploadClient() {
  const router = useRouter();
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (selectedFile: File) => {
    setError(null);
    const filename = selectedFile.name.toLowerCase();
    if (!filename.endsWith(".pdf") && !filename.endsWith(".docx")) {
      setError("Solo se permiten archivos en formato PDF o DOCX.");
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      await api.uploadFile(file);
      setSuccess(true);
      setTimeout(() => {
        router.push("/documents");
      }, 1500);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al subir el archivo al almacenamiento local."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <NavigationLayout>
      <div className="space-y-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Link href="/documents">
            <Button size="icon" variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800/50 rounded-xl cursor-pointer h-10 w-10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Cargar Documento</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Sube un nuevo expediente PDF o DOCX al servidor local de pre-revisión.
            </p>
          </div>
        </div>

        <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base text-white">Subir Expediente PDF/DOCX</CardTitle>
            <CardDescription className="text-slate-400">
              Los archivos se almacenarán de forma segura en local.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Zona de Drop */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-300 ${
                isDragActive 
                  ? "border-indigo-500 bg-indigo-950/20 shadow-inner" 
                  : "border-slate-800 bg-slate-950/40 hover:bg-slate-950/60 hover:border-slate-700/60"
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleChange}
                disabled={uploading}
              />

              <div className="mx-auto bg-slate-800/50 border border-slate-700/40 p-4 rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg text-slate-300 mb-4">
                <Upload className="w-8 h-8 text-indigo-400" />
              </div>

              <Label htmlFor="file-upload" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer block mb-1">
                Haz clic aquí para buscar un archivo
              </Label>
              <p className="text-xs text-slate-500">o arrastra y suelta tu archivo PDF o DOCX aquí</p>
            </div>

            {/* Error o Éxito */}
            {error && (
              <div className="p-4 bg-red-950/30 border border-red-500/25 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-shake">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/25 rounded-xl flex items-center gap-3 text-emerald-400 text-sm animate-pulse">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">¡Expediente cargado con éxito! Redireccionando...</span>
              </div>
            )}

            {/* Detalles del archivo seleccionado */}
            {file && !success && (
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg border border-indigo-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate max-w-[280px] sm:max-w-sm">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg cursor-pointer h-10 px-5"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </NavigationLayout>
  );
}
