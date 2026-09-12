import React, { useCallback, useRef, useState } from 'react';
import {
  Plus,
  ListTodo,
  Clock,
  CheckCircle2,
  PauseCircle,
  Inbox
} from 'lucide-react';
import { Note, NoteStatus, COLUMNS, normalizeStatus } from '../types/note';
import { NoteCard } from './NoteCard';

interface KanbanBoardProps {
  notes: Note[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onMoveNoteStatus: (note: Note, newStatus: NoteStatus) => void;
  onQuickAdd: (status: NoteStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  notes,
  onEditNote,
  onDeleteNote,
  onMoveNoteStatus,
  onQuickAdd,
}) => {
  const [dragOverColumn, setDragOverColumn] = useState<NoteStatus | null>(null);
  const draggedNoteRef = useRef<Note | null>(null);
  const dragOverColumnRef = useRef<NoteStatus | null>(null);

  const getColumnIcon = (iconName: string) => {
    switch (iconName) {
      case 'ListTodo':
        return <ListTodo className="w-4 h-4 text-indigo-400" />;
      case 'Clock':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'PauseCircle':
        return <PauseCircle className="w-4 h-4 text-sky-400" />;
      default:
        return <ListTodo className="w-4 h-4 text-indigo-400" />;
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent, note: Note) => {
    draggedNoteRef.current = note;
    e.dataTransfer.setData('text/plain', note.id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    draggedNoteRef.current = null;
    dragOverColumnRef.current = null;
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: NoteStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnRef.current !== status) {
      dragOverColumnRef.current = status;
      setDragOverColumn(status);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    dragOverColumnRef.current = null;
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetStatus: NoteStatus) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedNote = draggedNoteRef.current;
    draggedNoteRef.current = null;
    dragOverColumnRef.current = null;
    setDragOverColumn(null);
    if (!draggedNote) return;

    if (normalizeStatus(draggedNote.status) !== targetStatus) {
      onMoveNoteStatus(draggedNote, targetStatus);
    }
  }, [onMoveNoteStatus]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 xl:gap-4 items-start">
      {COLUMNS.map((col) => {
        const columnNotes = notes.filter(n => normalizeStatus(n.status) === col.id);
        const isTarget = dragOverColumn === col.id;

        return (
          <div
            key={col.key}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-2xl border transition-colors duration-75 min-h-[500px] ${
              isTarget 
                ? 'bg-indigo-950/35 border-indigo-400 ring-2 ring-indigo-400/50 shadow-lg shadow-indigo-500/10' 
                : 'bg-slate-900/40 border-slate-800/80'
            }`}
          >
            {/* Column Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl bg-slate-800/70 border border-slate-700/50`}>
                  {getColumnIcon(col.iconName)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">
                      {col.title}
                    </h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                      {columnNotes.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {col.description}
                  </p>
                </div>
              </div>

              {/* Quick Add Button in Column */}
              <button
                onClick={() => onQuickAdd(col.id)}
                title={`Adicionar nota em ${col.title}`}
                className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Notes List / Column Body */}
            <div className="p-3.5 sm:p-4 flex-1 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-230px)]">
              {columnNotes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-slate-800/80 bg-slate-950/20">
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center mb-3 text-slate-400 border border-slate-800">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">
                    Nenhuma nota nesta coluna
                  </p>
                  <button
                    onClick={() => onQuickAdd(col.id)}
                    className="mt-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar primeira
                  </button>
                </div>
              ) : (
                columnNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={onEditNote}
                    onDelete={onDeleteNote}
                    onMoveStatus={onMoveNoteStatus}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    hideImages={columnNotes.length > 1}
                  />
                ))
              )}
            </div>

            {/* Quick Add Footer */}
            <div className="p-3 border-t border-slate-800/40">
              <button
                onClick={() => onQuickAdd(col.id)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/70 border border-slate-800/60 hover:border-slate-700 text-xs font-medium text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar item</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
