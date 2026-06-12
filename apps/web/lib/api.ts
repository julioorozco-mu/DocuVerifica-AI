const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

// FastAPI puede devolver detail como string o como array de objetos (errores Pydantic).
// Esta función lo convierte siempre a string legible.
function parseDetail(detail: unknown): string {
  if (!detail) return "Error desconocido";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) =>
        typeof d === "object" && d !== null && "msg" in d ? String((d as Record<string, unknown>).msg) : JSON.stringify(d)
      )
      .join(" | ");
  }
  return JSON.stringify(detail);
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "revisor";
  status?: string;
  created_at: string;
}

export interface DocumentInfo {
  id: string;
  filename: string;
  size_bytes: number;
  status: string;
  user_id?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentFileData {
  filename: string;
  media_type: string;
  size_bytes: number;
  data_base64: string;
}

export interface HumanVerdict {
  id: string;
  document_id: string;
  reviewer_id?: string;
  status: "cumple" | "no_cumple" | "requiere_revision" | "no_encontrado";
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  text: string;
  section_heading?: string;
  headings: string[];
  page_start?: number;
  page_end?: number;
  word_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ExtractionResult {
  document_id: string;
  status: string;
  total_chunks: number;
  total_words: number;
  ocr_required: boolean;
  markdown_preview?: string;
  message: string;
}

export interface AIReviewResult {
  id: string;
  document_id: string;
  criterion_id: string;
  status: "cumple" | "no_cumple" | "no_encontrado" | "requiere_revision";
  confidence: number;
  evidence?: string;
  page_number?: number;
  explanation?: string;
  human_action_required: boolean;
  created_at: string;
}

export interface ReviewCriterion {
  id: string;
  name: string;
  description?: string;
  rule_type: "rule" | "semantic" | "ai" | "rule_then_ai";
  rule_pattern?: string;
  is_active: boolean;
  project_type?: string;
  reviewer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AISimulationResult {
  criterion_id: string;
  status: "cumple" | "no_cumple" | "no_encontrado" | "requiere_revision";
  confidence: number;
  evidence: string;
  page_number?: number;
  explanation: string;
  human_action_required: boolean;
}

export interface DashboardMetrics {
  metrics: {
    total_documents: number;
    pending_documents: number;
    error_documents: number;
    approved_documents: number;
    rejected_documents: number;
    revision_required_documents: number;
  };
  recent_activity: {
    id: string;
    folio?: string | null;
    filename: string;
    status: string;
    updated_at: string | null;
    created_at?: string | null;
    reviewer?: string | null;
    reviewer_initials?: string | null;
    ai_status?: string | null;
    human_status?: string | null;
    document_type?: string | null;
  }[];
  reviewer_stats: {
    name: string;
    reviews: number;
  }[];
  timeline: {
    date: string;
    pendientes: number;
    en_cola_ia: number;
    revisados: number;
  }[];
  categories: {
    name: string;
    value: number;
    color: string;
  }[];
}

// Helper para obtener headers con token
function getHeaders(isMultipart = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("rd_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export const api = {
  setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("rd_token", token);
    }
  },

  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rd_token");
    }
    return null;
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("rd_token");
    }
  },

  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!res.ok) {
      let errData;
      try {
        errData = await res.json();
      } catch {
        throw new Error(`Error del servidor (HTTP ${res.status}): Posible tiempo de espera agotado al conectar con la IA.`);
      }
      throw new Error(parseDetail(errData.detail) || `Error HTTP ${res.status}`);
    }
    return res.json();
  },

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
      throw new Error(parseDetail(err.detail) || `Error HTTP ${res.status}`);
    }
    return res.json();
  },

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
      throw new Error(parseDetail(err.detail) || `Error HTTP ${res.status}`);
    }
    return res.json();
  },

  async delete(endpoint: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
      throw new Error(parseDetail(err.detail) || `Error HTTP ${res.status}`);
    }
  },

  async uploadFile(file: File): Promise<DocumentInfo> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
      throw new Error(err.detail || `Error al subir el archivo: ${res.status}`);
    }
    return res.json();
  },

  getFileUrl(docId: string): string {
    const token = this.getToken();
    return `${API_BASE_URL}/documents/${docId}/file${token ? `?token=${token}` : ""}`;
  },

  // Users CRUD
  async getUsers(): Promise<UserProfile[]> {
    return this.get<UserProfile[]>("/users");
  },

  async createUser(userData: Record<string, unknown>): Promise<UserProfile> {
    return this.post<UserProfile>("/users", userData);
  },

  async updateUser(userId: string, userData: Record<string, unknown>): Promise<UserProfile> {
    return this.put<UserProfile>(`/users/${userId}`, userData);
  },

  async deleteUser(userId: string): Promise<void> {
    return this.delete(`/users/${userId}`);
  },

  // Helper para realizar llamadas directas con token si es necesario
  async getFileBlob(docId: string): Promise<Blob> {
    const res = await fetch(`${API_BASE_URL}/documents/${docId}/file`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (res.status !== 200) {
      throw new Error(`Error al descargar el PDF: ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/pdf")) {
      throw new Error("La respuesta del servidor no es un archivo PDF.");
    }

    const blob = await res.blob();
    if (blob.size === 0) {
      throw new Error("El archivo PDF descargado está vacío.");
    }

    return blob;
  },

  async getFileBytes(docId: string): Promise<Uint8Array> {
    const fileData = await this.get<DocumentFileData>(`/documents/${docId}/file-data`);

    if (fileData.media_type !== "application/pdf") {
      throw new Error("La respuesta del servidor no es un archivo PDF.");
    }

    if (fileData.size_bytes <= 0 || !fileData.data_base64) {
      throw new Error("El archivo PDF descargado está vacío.");
    }

    const binary = atob(fileData.data_base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  }
};
