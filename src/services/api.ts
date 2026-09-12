import { Note, CreateNoteRequest, UpdateNoteRequest, NoteStatus, normalizeStatus } from '../types/note';
import { appConfig } from '../config';

const STORAGE_KEY_API_URL = 'gnotes_api_url';
const STORAGE_KEY_LOCAL_NOTES = 'gnotes_fallback_notes';
const STORAGE_KEY_AUTH_TOKEN = 'gnotes_auth_token';

export function getBaseUrl(): string {
  return localStorage.getItem(STORAGE_KEY_API_URL) || appConfig.apiBaseUrl;
}

export function setBaseUrl(url: string): void {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY_API_URL, cleanUrl);
}

export function resetBaseUrl(): void {
  localStorage.removeItem(STORAGE_KEY_API_URL);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
}

export function setAccessToken(token: string | null): void {
  if (token) {
    localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
    return;
  }

  localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
}

function getAuthHeaders(extraHeaders: HeadersInit = {}): HeadersInit {
  const headers = new Headers(extraHeaders);
  const token = getAccessToken();

  headers.set('Accept', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

async function readApiPayload<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

function getApiErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const body = payload as {
      message?: string;
      title?: string;
      detail?: string;
      errors?: Record<string, string[]>;
    };
    const validationErrors = body.errors
      ? Object.values(body.errors).flat().filter(Boolean).join(' ')
      : '';

    return validationErrors || body.message || body.detail || body.title || `HTTP ${status}`;
  }

  return `HTTP ${status}`;
}

async function throwApiError(response: Response): Promise<never> {
  const payload = await readApiPayload<unknown>(response);
  throw new Error(getApiErrorMessage(payload, response.status));
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof DOMException && error.name === 'AbortError');
}

// Initial mock notes if local storage is empty
const INITIAL_DEMO_NOTES: Note[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    title: 'Configurar banco de dados SQL Server',
    description: 'Executar migrations do Entity Framework Core ou configurar connection string no appsettings.json',
    status: NoteStatus.Todo,
    createdAtUtc: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAtUtc: null
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    title: 'Desenvolvimento do Front-end em React',
    description: 'Criar componentes de colunas Kanban (A Fazer, Em Andamento, Finalizado) com layout moderno e responsivo',
    status: NoteStatus.InProgress,
    createdAtUtc: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAtUtc: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    title: 'Construção das APIs em .NET',
    description: 'Endpoints RESTful implementados com sucesso: GET, POST, PUT, PATCH e DELETE com controllers e services',
    status: NoteStatus.Done,
    createdAtUtc: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAtUtc: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

function getLocalNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_NOTES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LOCAL_NOTES, JSON.stringify(INITIAL_DEMO_NOTES));
      return INITIAL_DEMO_NOTES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_NOTES;
  }
}

function saveLocalNotes(notes: Note[]): void {
  localStorage.setItem(STORAGE_KEY_LOCAL_NOTES, JSON.stringify(notes));
}

let isBackendOffline = false;

export function getIsOffline(): boolean {
  return isBackendOffline;
}

export const authApi = {
  async register(email: string, password: string): Promise<{ message: string }> {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        confirmPassword: password
      })
    });

    const payload = await readApiPayload<{ message?: string }>(response);

    if (!response.ok) await throwApiError(response);

    return { message: payload.message || 'Usuário registrado com sucesso.' };
  },

  async login(email: string, password: string): Promise<{ token: string; message?: string }> {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const payload = await readApiPayload<{ accessToken?: string; token?: string; message?: string; tokenType?: string }>(response);

    if (!response.ok) await throwApiError(response);

    const token = payload.accessToken ?? payload.token;
    if (!token) {
      throw new Error('Resposta da API não retornou um token válido.');
    }

    setAccessToken(token);
    return { token, message: payload.message || 'Login realizado com sucesso.' };
  }
};

export const notesApi = {
  async checkConnection(): Promise<boolean> {
    const baseUrl = getBaseUrl();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const ok = res.ok;
      isBackendOffline = !ok;
      return ok;
    } catch {
      isBackendOffline = true;
      return false;
    }
  },

  async getAll(): Promise<{ data: Note[]; isOffline: boolean }> {
    const baseUrl = getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/notes`, {
        headers: getAuthHeaders()
      });

      if (res.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      if (!res.ok) await throwApiError(res);
      const data: Note[] = await res.json();
      isBackendOffline = false;
      return { data, isOffline: false };
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      console.warn('[Gnotes API] Backend não acessível, usando armazenamento local sincronizado:', err);
      isBackendOffline = true;
      return { data: getLocalNotes(), isOffline: true };
    }
  },

  async getById(id: string): Promise<Note | null> {
    const baseUrl = getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/notes/${id}`, { headers: getAuthHeaders() });
      if (res.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      if (res.status === 404) return null;
      if (!res.ok) await throwApiError(res);
      return await res.json();
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      const local = getLocalNotes();
      return local.find(n => n.id === id) || null;
    }
  },

  async getByStatus(status: NoteStatus): Promise<Note[]> {
    const baseUrl = getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/notes/status/${status}`, { headers: getAuthHeaders() });
      if (res.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      if (!res.ok) await throwApiError(res);
      return await res.json();
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      const local = getLocalNotes();
      return local.filter(n => normalizeStatus(n.status) === status);
    }
  },

  async create(payload: CreateNoteRequest): Promise<Note> {
    const baseUrl = getBaseUrl();
    const normalizedStatus = payload.status !== undefined ? normalizeStatus(payload.status) : NoteStatus.Todo;

    try {
      const res = await fetch(`${baseUrl}/api/notes`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          title: payload.title,
          description: payload.description || null,
          imageDataUrl: payload.imageDataUrl || null,
          imagePosition: payload.imagePosition ?? null,
          status: normalizedStatus
        })
      });

      if (res.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      if (!res.ok) await throwApiError(res);
      const created: Note = await res.json();
      isBackendOffline = false;
      return created;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      console.warn('[Gnotes API] Falha na criação remota, salvando localmente:', err);
      isBackendOffline = true;
      const newNote: Note = {
        id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: payload.title,
        description: payload.description || null,
        imageDataUrl: payload.imageDataUrl || null,
        imagePosition: payload.imagePosition ?? null,
        status: normalizedStatus,
        createdAtUtc: new Date().toISOString(),
        updatedAtUtc: null
      };
      const list = getLocalNotes();
      list.unshift(newNote);
      saveLocalNotes(list);
      return newNote;
    }
  },

  async update(id: string, payload: UpdateNoteRequest): Promise<Note> {
    const baseUrl = getBaseUrl();
    const normalizedStatus = normalizeStatus(payload.status);

    try {
      const res = await fetch(`${baseUrl}/api/notes/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          title: payload.title,
          description: payload.description || null,
          imageDataUrl: payload.imageDataUrl || null,
          imagePosition: payload.imagePosition ?? null,
          status: normalizedStatus
        })
      });

      if (res.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      if (!res.ok) await throwApiError(res);
      const updated: Note = await res.json();
      isBackendOffline = false;
      return updated;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      console.warn('[Gnotes API] Falha no update remoto, atualizando localmente:', err);
      isBackendOffline = true;
      const list = getLocalNotes();
      const index = list.findIndex(n => n.id === id);
      if (index === -1) throw new Error('Nota não encontrada');

      const updatedNote: Note = {
        ...list[index],
        title: payload.title,
        description: payload.description || null,
        imageDataUrl: payload.imageDataUrl || null,
        imagePosition: payload.imagePosition ?? null,
        status: normalizedStatus,
        updatedAtUtc: new Date().toISOString()
      };
      list[index] = updatedNote;
      saveLocalNotes(list);
      return updatedNote;
    }
  },

  async updateStatus(currentNote: Note, newStatus: NoteStatus): Promise<Note> {
    const baseUrl = getBaseUrl();
    const id = currentNote.id;

    try {
      const patchRes = await fetch(`${baseUrl}/api/notes/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ status: newStatus })
      });

      if (patchRes.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      if (patchRes.ok) {
        isBackendOffline = false;
        const payload = await patchRes.json() as {
          status: NoteStatus;
          updatedAtUtc: string;
        };
        return {
          ...currentNote,
          status: normalizeStatus(payload.status),
          updatedAtUtc: payload.updatedAtUtc
        };
      }
      await throwApiError(patchRes);
    } catch (err) {
      if (!isNetworkError(err)) {
        throw err;
      }
    }

    console.warn('[Gnotes API] Backend não acessível, status não atualizado.');
    isBackendOffline = true;
    throw new Error('Não foi possível atualizar o status. Tente novamente quando a conexão estiver disponível.');
  },

  async delete(id: string): Promise<boolean> {
    const baseUrl = getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/notes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (res.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      if (!res.ok && res.status !== 404) await throwApiError(res);
      isBackendOffline = false;
      return true;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      console.warn('[Gnotes API] Falha no delete remoto, removendo localmente:', err);
      isBackendOffline = true;
      const list = getLocalNotes().filter(n => n.id !== id);
      saveLocalNotes(list);
      return true;
    }
  }
};
