import React from 'react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  RefreshCw, 
  Server, 
  CheckCircle, 
  AlertCircle, 
  SlidersHorizontal 
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewNote: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  isOffline: boolean;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenNewNote,
  onRefresh,
  isLoading,
  isOffline,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse-subtle" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                  Gnotes
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Site
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Gerenciador de Tarefas & Notas Inteligente
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por título ou descrição..."
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 px-1 py-0.5"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Actions & Connection Info */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* API Status Badge */}
            <button
              onClick={onOpenSettings}
              title={isOffline ? "Backend Offline (Usando armazenamento local) - Clique para configurar" : "Backend Conectado - Clique para ver detalhes"}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isOffline
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              {isOffline ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Modo Local</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>API Online</span>
                </>
              )}
              <SlidersHorizontal className="w-3 h-3 ml-0.5 opacity-60" />
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Recarregar notas da API"
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {/* Settings Mobile Button */}
            <button
              onClick={onOpenSettings}
              title="Configurações da API"
              className="sm:hidden p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 transition-all"
            >
              <Server className="w-4 h-4 text-slate-400" />
            </button>

            {/* Create Note CTA */}
            <button
              onClick={onOpenNewNote}
              className="flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Nova Nota</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
