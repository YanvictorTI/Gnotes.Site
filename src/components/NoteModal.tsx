import React, { useState, useEffect } from 'react';
import { X, Save, Plus, ListTodo, Clock, CheckCircle2 } from 'lucide-react';
import { Note, NoteStatus, COLUMNS, normalizeStatus } from '../types/note';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: { title: string; description?: string; status: NoteStatus }) => Promise<void>;
  initialNote?: Note | null;
  defaultStatus?: NoteStatus;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote,
  defaultStatus = NoteStatus.Todo,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<NoteStatus>(defaultStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title || '');
      setDescription(initialNote.description || '');
      setStatus(normalizeStatus(initialNote.status));
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
    }
    setError(null);
  }, [initialNote, defaultStatus, isOpen]);

  // Keyboard shortcut: Ctrl + Enter to submit, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, description, status]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('O título da nota é obrigatório.');
      return;
    }

    if (trimmedTitle.length > 200) {
      setError('O título deve ter no máximo 200 caracteres.');
      return;
    }

    if (description.length > 2000) {
      setError('A descrição deve ter no máximo 2000 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        title: trimmedTitle,
        description: description.trim() || undefined,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Falha ao salvar a nota. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (colId: NoteStatus) => {
    switch (colId) {
      case NoteStatus.Todo:
        return <ListTodo className="w-4 h-4" />;
      case NoteStatus.InProgress:
        return <Clock className="w-4 h-4" />;
      case NoteStatus.Done:
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg rounded-3xl glass-panel border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {initialNote ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialNote ? 'Editar Nota' : 'Criar Nova Nota'}
              </h2>
              <p className="text-xs text-slate-400">
                {initialNote ? 'Atualize as informações da sua nota' : 'Preencha os detalhes para registrar uma nova tarefa'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">
                Título <span className="text-rose-400">*</span>
              </label>
              <span className="text-slate-400">{title.length}/200</span>
            </div>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Desenvolver endpoints do backend..."
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">
                Descrição <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <span className="text-slate-400">{description.length}/2000</span>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione notas, links, checklists ou especificações detalhadas..."
              maxLength={2000}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y"
            />
          </div>

          {/* Column Status Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Coluna / Status da Nota
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {COLUMNS.map((col) => {
                const isSelected = status === col.id;
                return (
                  <button
                    type="button"
                    key={col.key}
                    onClick={() => setStatus(col.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                      isSelected
                        ? `${col.badgeColor} border-current ring-1 ring-current shadow-md`
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {getStatusIcon(col.id)}
                    <span>{col.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Dica: Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Ctrl+Enter</kbd> para salvar
            </span>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{initialNote ? 'Atualizar Nota' : 'Criar Nota'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
