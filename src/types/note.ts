export enum NoteStatus {
  Todo = 0,
  InProgress = 1,
  Done = 2
}

export type NoteStatusType = NoteStatus | 'Todo' | 'InProgress' | 'Done' | 0 | 1 | 2;

export interface Note {
  id: string;
  title: string;
  description?: string | null;
  status: NoteStatusType;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface CreateNoteRequest {
  title: string;
  description?: string | null;
  status?: NoteStatusType;
}

export interface UpdateNoteRequest {
  title: string;
  description?: string | null;
  status: NoteStatusType;
}

export interface UpdateStatusRequest {
  status: NoteStatusType;
}

export interface ColumnDefinition {
  id: NoteStatus;
  key: 'Todo' | 'InProgress' | 'Done';
  title: string;
  description: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  accentColor: string;
  iconName: string;
}

export const COLUMNS: ColumnDefinition[] = [
  {
    id: NoteStatus.Todo,
    key: 'Todo',
    title: 'A Fazer',
    description: 'Tarefas e anotações pendentes',
    badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    borderColor: 'border-indigo-500/30 hover:border-indigo-500/60',
    bgColor: 'bg-indigo-950/20',
    accentColor: 'indigo',
    iconName: 'ListTodo'
  },
  {
    id: NoteStatus.InProgress,
    key: 'InProgress',
    title: 'Em Andamento',
    description: 'Em desenvolvimento ativo',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    borderColor: 'border-amber-500/30 hover:border-amber-500/60',
    bgColor: 'bg-amber-950/20',
    accentColor: 'amber',
    iconName: 'Clock'
  },
  {
    id: NoteStatus.Done,
    key: 'Done',
    title: 'Finalizado',
    description: 'Concluído e finalizado',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
    bgColor: 'bg-emerald-950/20',
    accentColor: 'emerald',
    iconName: 'CheckCircle2'
  }
];

export function normalizeStatus(status: NoteStatusType): NoteStatus {
  if (typeof status === 'number') {
    return status;
  }
  if (typeof status === 'string') {
    switch (status.toLowerCase()) {
      case 'todo':
      case '0':
        return NoteStatus.Todo;
      case 'inprogress':
      case '1':
        return NoteStatus.InProgress;
      case 'done':
      case '2':
        return NoteStatus.Done;
      default:
        return NoteStatus.Todo;
    }
  }
  return NoteStatus.Todo;
}
