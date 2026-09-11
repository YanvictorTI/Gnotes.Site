import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  WifiOff 
} from 'lucide-react';
import { Note, NoteStatus, normalizeStatus, COLUMNS } from './types/note';
import { notesApi, getBaseUrl } from './services/api';
import { Header } from './components/Header';
import { MetricsBar } from './components/MetricsBar';
import { KanbanBoard } from './components/KanbanBoard';
import { NoteModal } from './components/NoteModal';
import { DeleteModal } from './components/DeleteModal';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<NoteStatus | 'all'>('all');

  // Modals state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [defaultStatusForNew, setDefaultStatusForNew] = useState<NoteStatus>(NoteStatus.Todo);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch all notes
  const fetchNotes = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const result = await notesApi.getAll();
      setNotes(result.data);
      setIsOffline(result.isOffline);
    } catch (err: any) {
      setIsOffline(true);
      showToast('error', 'Falha ao carregar notas', err?.message);
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Periodic connection probe
  useEffect(() => {
    const interval = setInterval(async () => {
      const isOk = await notesApi.checkConnection();
      setIsOffline(!isOk);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Filter notes by search query and optional status filter
  const filteredNotes = useMemo(() => {
    let list = notes;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((n) => 
        n.title.toLowerCase().includes(q) || 
        (n.description && n.description.toLowerCase().includes(q))
      );
    }

    if (selectedFilter !== 'all') {
      list = list.filter((n) => normalizeStatus(n.status) === selectedFilter);
    }

    return list;
  }, [notes, searchQuery, selectedFilter]);

  // Handlers for modal actions
  const handleOpenCreateNote = (status: NoteStatus = NoteStatus.Todo) => {
    setEditingNote(null);
    setDefaultStatusForNew(status);
    setIsNoteModalOpen(true);
  };

  const handleOpenEditNote = (note: Note) => {
    setEditingNote(note);
    setDefaultStatusForNew(normalizeStatus(note.status));
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async (payload: { title: string; description?: string; status: NoteStatus }) => {
    if (editingNote) {
      // Update note
      const updated = await notesApi.update(editingNote.id, {
        title: payload.title,
        description: payload.description,
        status: payload.status
      });

      setNotes((prev) => prev.map((n) => (n.id === editingNote.id ? updated : n)));
      showToast('success', 'Nota atualizada!', `"${payload.title}" salva com sucesso.`);
    } else {
      // Create new note
      const created = await notesApi.create({
        title: payload.title,
        description: payload.description,
        status: payload.status
      });

      setNotes((prev) => [created, ...prev]);
      showToast('success', 'Nota criada!', `"${payload.title}" adicionada ao quadro.`);
    }
  };

  const handleOpenDelete = (note: Note) => {
    setDeletingNote(note);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingNote) return;
    try {
      setIsDeleting(true);
      await notesApi.delete(deletingNote.id);
      setNotes((prev) => prev.filter((n) => n.id !== deletingNote.id));
      showToast('info', 'Nota excluída', `"${deletingNote.title}" foi removida.`);
      setIsDeleteModalOpen(false);
      setDeletingNote(null);
    } catch (err: any) {
      showToast('error', 'Erro ao excluir', err?.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Move note status (Kanban column shift or drag & drop)
  const handleMoveNoteStatus = async (note: Note, newStatus: NoteStatus) => {
    // Optimistic UI update
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, status: newStatus, updatedAtUtc: new Date().toISOString() } : n))
    );

    try {
      const updated = await notesApi.updateStatus(note.id, note, newStatus);
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
      
      const targetColumn = COLUMNS.find((c) => c.id === newStatus);
      showToast('info', 'Status atualizado', `Movido para "${targetColumn?.title || 'nova coluna'}"`);
    } catch (err: any) {
      // Rollback on failure
      fetchNotes(true);
      showToast('error', 'Erro ao atualizar status', err?.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewNote={() => handleOpenCreateNote(NoteStatus.Todo)}
        onRefresh={() => fetchNotes()}
        isLoading={isLoading}
        isOffline={isOffline}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Offline / Backend notice banner if disconnected */}
        {isOffline && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <strong className="font-semibold block text-amber-100">Backend Gnotes (.NET API) desconectado</strong>
                <span>
                  O site está funcionando em modo local sincronizado. Inicie o projeto <code className="text-amber-300">Gnotes</code> em <code className="text-amber-300">{getBaseUrl()}</code> para persistência no banco SQL Server.
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-100 font-semibold transition-colors flex-shrink-0"
            >
              Configurar Conexão
            </button>
          </div>
        )}

        {/* Dashboard Metrics */}
        <MetricsBar
          notes={notes}
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
        />

        {/* Kanban Board Columns: A Fazer | Em Andamento | Finalizado */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-slate-900/40 border border-slate-800 animate-pulse p-6 space-y-4">
                <div className="h-6 w-32 bg-slate-800 rounded-lg" />
                <div className="h-28 bg-slate-800/60 rounded-2xl" />
                <div className="h-28 bg-slate-800/60 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : (
          <KanbanBoard
            notes={filteredNotes}
            onEditNote={handleOpenEditNote}
            onDeleteNote={handleOpenDelete}
            onMoveNoteStatus={handleMoveNoteStatus}
            onQuickAdd={(status) => handleOpenCreateNote(status)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Gnotes Site</span>
            <span>&bull;</span>
            <span>API .NET Core 10 + React Kanban Board</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="hover:text-slate-200 transition-colors"
            >
              API Swagger & Configurações
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        initialNote={editingNote}
        defaultStatus={defaultStatusForNew}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        note={deletingNote}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingNote(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <ApiSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onConnectionChange={() => fetchNotes(true)}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
