import React from 'react';
import { ListTodo, Clock, CheckCircle2, PauseCircle, Layers } from 'lucide-react';
import { Note, NoteStatus, normalizeStatus } from '../types/note';

interface MetricsBarProps {
  notes: Note[];
  selectedFilter: NoteStatus | 'all';
  onSelectFilter: (status: NoteStatus | 'all') => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  notes,
  selectedFilter,
  onSelectFilter,
}) => {
  const total = notes.length;
  const todoCount = notes.filter(n => normalizeStatus(n.status) === NoteStatus.Todo).length;
  const inProgressCount = notes.filter(n => normalizeStatus(n.status) === NoteStatus.InProgress).length;
  const doneCount = notes.filter(n => normalizeStatus(n.status) === NoteStatus.Done).length;
  const waitingCount = notes.filter(n => normalizeStatus(n.status) === NoteStatus.Waiting).length;

  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const items = [
    {
      id: 'all' as const,
      label: 'Total de Notas',
      count: total,
      icon: Layers,
      color: 'text-slate-300',
      activeBg: 'bg-slate-800 border-slate-600',
      progressColor: 'bg-slate-400',
      subtext: 'No quadro geral'
    },
    {
      id: NoteStatus.Todo,
      label: 'A Fazer',
      count: todoCount,
      icon: ListTodo,
      color: 'text-indigo-400',
      activeBg: 'bg-indigo-950/50 border-indigo-500/50',
      progressColor: 'bg-indigo-500',
      subtext: `${total ? Math.round((todoCount / total) * 100) : 0}% do total`
    },
    {
      id: NoteStatus.InProgress,
      label: 'Em Andamento',
      count: inProgressCount,
      icon: Clock,
      color: 'text-amber-400',
      activeBg: 'bg-amber-950/50 border-amber-500/50',
      progressColor: 'bg-amber-500',
      subtext: `${total ? Math.round((inProgressCount / total) * 100) : 0}% do total`
    },
    {
      id: NoteStatus.Done,
      label: 'Finalizado',
      count: doneCount,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-950/50 border-emerald-500/50',
      progressColor: 'bg-emerald-500',
      subtext: `${completionRate}% concluído`
    },
    {
      id: NoteStatus.Waiting,
      label: 'Em Espera',
      count: waitingCount,
      icon: PauseCircle,
      color: 'text-sky-400',
      activeBg: 'bg-sky-950/50 border-sky-500/50',
      progressColor: 'bg-sky-500',
      subtext: `${total ? Math.round((waitingCount / total) * 100) : 0}% do total`
    }
  ];

  return (
    <div className="space-y-4">
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedFilter === item.id;

          return (
            <button
              key={item.label}
              onClick={() => onSelectFilter(item.id)}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                isSelected 
                  ? `${item.activeBg} shadow-lg ring-1 ring-indigo-500/30` 
                  : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300">
                  {item.label}
                </span>
                <div className={`p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {item.count}
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  {item.subtext}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress Bar of Completion */}
      <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300">Progresso Geral:</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-emerald-400">{completionRate}%</span>
            <span className="text-slate-400">das tarefas finalizadas ({doneCount}/{total})</span>
          </div>
        </div>

        <div className="w-full sm:w-64 h-2 rounded-full bg-slate-800 overflow-hidden flex">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full" 
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </div>
  );
};
