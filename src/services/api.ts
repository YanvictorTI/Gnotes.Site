import { Note, CreateNoteRequest, UpdateNoteRequest, NoteStatus, normalizeStatus } from '../types/note';

const DEFAULT_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5098';
const STORAGE_KEY_API_URL = 'gnotes_api_url';
const STORAGE_KEY_LOCAL_NOTES = 'gnotes_fallback_notes';

export function getBaseUrl(): string {
  return localStorage.getItem(STORAGE_KEY_API_URL) || DEFAULT_API_URL;
}

export function setBaseUrl(url: string): void {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY_API_URL, cleanUrl);
}

export function resetBaseUrl(): void {
  localStorage.removeItem(STORAGE_KEY_API_URL);
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

export const notesApi = {
  async checkConnection(): Promise<boolean> {
    const baseUrl = getBaseUrl();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${baseUrl}/api/notes`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
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
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Note[] = await res.json();
      isBackendOffline = false;
      return { data, isOffline: false };
    } catch (err) {
      console.warn('[Gnotes API] Backend não acessível, usando armazenamento local sincronizado:', err);
      isBackendOffline = true;
      return { data: getLocalNotes(), isOffline: true };
    }
  },

  async getById(id: string): Promise<Note | null> {
    const baseUrl = getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/notes/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      const local = getLocalNotes();
      return local.find(n => n.id === id) || null;
    }
  },

  async getByStatus(status: NoteStatus): Promise<Note[]> {
    const baseUrl = getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/notes/status/${status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
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
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description || null,
          status: normalizedStatus
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created: Note = await res.json();
      isBackendOffline = false;
      return created;
    } catch (err) {
      console.warn('[Gnotes API] Falha na criação remota, salvando localmente:', err);
      isBackendOffline = true;
      const newNote: Note = {
        id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: payload.title,
        description: payload.description || null,
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
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description || null,
          status: normalizedStatus
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: Note = await res.json();
      isBackendOffline = false;
      return updated;
    } catch (err) {
      console.warn('[Gnotes API] Falha no update remoto, atualizando localmente:', err);
      isBackendOffline = true;
      const list = getLocalNotes();
      const index = list.findIndex(n => n.id === id);
      if (index === -1) throw new Error('Nota não encontrada');

      const updatedNote: Note = {
        ...list[index],
        title: payload.title,
        description: payload.description || null,
        status: normalizedStatus,
        updatedAtUtc: new Date().toISOString()
      };
      list[index] = updatedNote;
      saveLocalNotes(list);
      return updatedNote;
    }
  },

  async updateStatus(id: string, currentNote: Note, newStatus: NoteStatus): Promise<Note> {
    const baseUrl = getBaseUrl();

    // 1st attempt: PATCH /api/notes/{id}/status
    try {
      const patchRes = await fetch(`${baseUrl}/api/notes/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (patchRes.ok) {
        isBackendOffline = false;
        return await patchRes.json();
      }
    } catch {
      // Ignore and fallback to PUT
    }

    // 2nd attempt: PUT /api/notes/{id}
    try {
      const putRes = await fetch(`${baseUrl}/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: currentNote.title,
          description: currentNote.description || null,
          status: newStatus
        })
      });

      if (putRes.ok) {
        isBackendOffline = false;
        return await putRes.json();
      }
      throw new Error(`HTTP ${putRes.status}`);
    } catch (err) {
      console.warn('[Gnotes API] Falha na troca de status remota, aplicando localmente:', err);
      isBackendOffline = true;
      const list = getLocalNotes();
      const index = list.findIndex(n => n.id === id);
      if (index === -1) throw new Error('Nota não encontrada');

      const updatedNote: Note = {
        ...list[index],
        status: newStatus,
        updatedAtUtc: new Date().toISOString()
      };
      list[index] = updatedNote;
      saveLocalNotes(list);
      return updatedNote;
    }
  },

  async delete(id: string): Promise<boolean> {
    const baseUrl = getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/notes/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
      isBackendOffline = false;
      return true;
    } catch (err) {
      console.warn('[Gnotes API] Falha no delete remoto, removendo localmente:', err);
      isBackendOffline = true;
      const list = getLocalNotes().filter(n => n.id !== id);
      saveLocalNotes(list);
      return true;
    }
  }
};
