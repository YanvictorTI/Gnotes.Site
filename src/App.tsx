import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LogOut, ShieldCheck, Mail, Lock } from 'lucide-react';
import { Note, NoteStatus, normalizeStatus, COLUMNS } from './types/note';
import { notesApi, getAccessToken, clearAuth, authApi } from './services/api';
import { Header } from './components/Header';
import { MetricsBar } from './components/MetricsBar';
import { KanbanBoard } from './components/KanbanBoard';
import { NoteModal } from './components/NoteModal';
import { DeleteModal } from './components/DeleteModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { GnotesLogo } from './components/GnotesLogo';

export const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<NoteStatus | 'all'>('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Modals state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [defaultStatusForNew, setDefaultStatusForNew] = useState<NoteStatus>(NoteStatus.Todo);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


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

  const handleLogout = useCallback(() => {
    clearAuth();
    setIsAuthenticated(false);
    setNotes([]);
    setIsLoading(false);
    setAuthError(null);
    showToast('info', 'Sessão encerrada', 'Você saiu da aplicação.');
  }, [showToast]);

  const fetchNotes = useCallback(async (quiet = false) => {
    if (!getAccessToken()) {
      setNotes([]);
      setIsLoading(false);
      setIsAuthenticated(false);
      return;
    }

    if (!quiet) setIsLoading(true);
    try {
      const result = await notesApi.getAll();
      setNotes(result.data);
      setIsAuthenticated(true);
    } catch (err: any) {
      if (err?.message?.includes('Sessão expirada')) {
        handleLogout();
        setAuthError('Sua sessão expirou. Faça login novamente.');
        return;
      }

      showToast('error', 'Falha ao carregar notas', err?.message);
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [handleLogout, showToast]);

  useEffect(() => {
    if (Boolean(getAccessToken())) {
      fetchNotes();
      return;
    }

    setNotes([]);
    setIsLoading(false);
  }, [fetchNotes]);

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError(null);

    if (authMode === 'register' && authPassword !== authConfirmPassword) {
      setAuthError('As senhas não conferem.');
      return;
    }

    setIsSubmittingAuth(true);

    try {
      if (authMode === 'register') {
        await authApi.register(authEmail.trim(), authPassword);
        await authApi.login(authEmail.trim(), authPassword);
        setAuthPassword('');
        setAuthConfirmPassword('');
        await fetchNotes();
        showToast('success', 'Cadastro realizado', 'Conta criada com sucesso. Você já está conectado.');
        return;
      }

      await authApi.login(authEmail.trim(), authPassword);
      setAuthPassword('');
      setAuthConfirmPassword('');
      setAuthError(null);
      await fetchNotes();
      showToast('success', 'Login realizado', 'Bem-vindo ao Gnotes.');
    } catch (err: any) {
      setAuthError(err?.message || 'Não foi possível concluir a autenticação.');
      showToast('error', 'Autenticação falhou', err?.message);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

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
      const updated = await notesApi.update(editingNote.id, {
        title: payload.title,
        description: payload.description,
        status: payload.status
      });

      setNotes((prev) => prev.map((n) => (n.id === editingNote.id ? updated : n)));
      showToast('success', 'Nota atualizada!', `"${payload.title}" salva com sucesso.`);
    } else {
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

  const handleMoveNoteStatus = async (note: Note, newStatus: NoteStatus) => {
    const previousNote = note;
    const optimisticNote = {
      ...note,
      status: newStatus,
      updatedAtUtc: new Date().toISOString()
    };

    setNotes((prev) => prev.map((current) => (current.id === note.id ? optimisticNote : current)));

    try {
      const updated = await notesApi.updateStatus(note, newStatus);
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));

      const targetColumn = COLUMNS.find((c) => c.id === newStatus);
      showToast('info', 'Status atualizado', `Movido para "${targetColumn?.title || 'nova coluna'}"`);
    } catch (err: any) {
      setNotes((prev) => prev.map((current) => (current.id === previousNote.id ? previousNote : current)));
      showToast('error', 'Erro ao atualizar status', err?.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070b12] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <GnotesLogo />

          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="flex rounded-xl border border-slate-800 bg-slate-950/60 p-1">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${authMode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${authMode === 'register' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'}`}
              >
                Cadastrar
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                E-mail
                <div className="mt-1.5 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-600/40"
                  />
                </div>
              </label>

              <label className="block text-xs font-medium text-slate-300">
                Senha
                <div className="mt-1.5 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="********"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-600/40"
                  />
                </div>
              </label>

              {authMode === 'register' && (
                <label className="block text-xs font-medium text-slate-300">
                  Confirmar senha
                  <div className="mt-1.5 relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={authConfirmPassword}
                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                      placeholder="********"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-600/40"
                    />
                  </div>
                </label>
              )}
            </div>

            {authError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={
                isSubmittingAuth ||
                !authEmail.trim() ||
                !authPassword.trim() ||
                (authMode === 'register' && !authConfirmPassword.trim())
              }
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmittingAuth ? (authMode === 'login' ? 'Entrando...' : 'Cadastrando...') : authMode === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Seus dados protegidos</span>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewNote={() => handleOpenCreateNote(NoteStatus.Todo)}
        onRefresh={() => fetchNotes()}
        isLoading={isLoading}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-6 space-y-5 sm:space-y-6">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-600 hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>

        <MetricsBar
          notes={notes}
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse p-6 space-y-4">
                <div className="h-6 w-32 bg-slate-800 rounded-lg" />
                <div className="h-28 bg-slate-800/60 rounded-xl" />
                <div className="h-28 bg-slate-800/60 rounded-xl" />
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

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-400">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Gnotes Site</span>
            <span>&bull;</span>
            <span>Organize suas tarefas com clareza</span>
          </div>
        </div>
      </footer>

      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        initialNote={editingNote}
        defaultStatus={defaultStatusForNew}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        note={deletingNote}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
