import React from 'react';
import { 
  Calendar, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  GripVertical
} from 'lucide-react';
import { Note, NoteStatus, COLUMNS, normalizeStatus } from '../types/note';

function sanitizeDescriptionHtml(value: string): string {
  const document = new DOMParser().parseFromString(value, 'text/html');

  document.querySelectorAll('script, style, iframe, object, embed').forEach((element) => element.remove());
  document.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name);
      }

      if (element.tagName === 'IMG' && name === 'src' && !attribute.value.startsWith('data:image/')) {
        element.remove();
      }

      if (element.tagName === 'IMG') {
        element.setAttribute('draggable', 'false');
      }
    });
  });

  return document.body.innerHTML;
}

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onMoveStatus: (note: Note, newStatus: NoteStatus) => void;
  onDragStart: (e: React.DragEvent, note: Note) => void;
  onDragEnd: () => void;
  hideImages?: boolean;
}

const NoteCardComponent: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onMoveStatus,
  onDragStart,
  onDragEnd,
  hideImages = false,
}) => {
  const status = normalizeStatus(note.status);
  const columnIndex = COLUMNS.findIndex((column) => column.id === status);

  const formattedCreated = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(note.createdAtUtc));

  const formattedUpdated = note.updatedAtUtc
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(note.updatedAtUtc))
    : null;

  const description = note.description || '';
  const descriptionHtml = sanitizeDescriptionHtml(description);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, note)}
      onDragEnd={onDragEnd}
      className="group relative rounded-xl glass-card p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 cursor-grab active:cursor-grabbing border border-slate-800/80 bg-slate-900/60"
    >
      {/* Card Header: Drag grip & Quick actions */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <GripVertical className="w-4 h-4 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          <h3 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors truncate">
            {note.title}
          </h3>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(note)}
            title="Editar nota"
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(note)}
            title="Excluir nota"
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description with inline images */}
      {descriptionHtml && (
        <div className="mb-4 rounded-xl border border-indigo-500/15 bg-slate-950/30 px-3.5 py-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300/80">
            Descrição
          </p>
          <div
            className={`${hideImages ? 'max-h-12 overflow-hidden' : 'max-h-96 overflow-y-auto'} text-sm font-medium leading-relaxed text-slate-200 ${hideImages ? '[&_img]:hidden' : '[&_img]:pointer-events-none [&_img]:my-3 [&_img]:max-h-64 [&_img]:w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-slate-700/70 [&_img]:object-cover'}`}
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        </div>
      )}

      {/* Card Footer: Metadata and Column Move Controls */}
      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 text-[11px] text-slate-400">
        
        {/* Date Stamp */}
        <div className="flex items-center gap-1 text-slate-400 truncate" title={`Criado em: ${formattedCreated}${formattedUpdated ? ` | Atualizado: ${formattedUpdated}` : ''}`}>
          <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="truncate">{formattedCreated}</span>
        </div>

        {/* Step Shift Arrows */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {columnIndex > 0 && (
            <button
              onClick={() => onMoveStatus(note, COLUMNS[columnIndex - 1].id)}
              title="Mover para coluna anterior"
              className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {columnIndex >= 0 && columnIndex < COLUMNS.length - 1 && (
            <button
              onClick={() => onMoveStatus(note, COLUMNS[columnIndex + 1].id)}
              title="Mover para próxima coluna"
              className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export const NoteCard = React.memo(NoteCardComponent);
