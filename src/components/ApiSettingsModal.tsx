import React, { useState, useEffect } from 'react';
import { 
  Server, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Globe, 
  Database,
  ExternalLink,
  Save,
  RotateCcw
} from 'lucide-react';
import { getBaseUrl, setBaseUrl, resetBaseUrl, notesApi } from '../services/api';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  onConnectionChange,
}) => {
  const [apiUrl, setApiUrlState] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiUrlState(getBaseUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      setBaseUrl(apiUrl);
      const isOk = await notesApi.checkConnection();
      if (isOk) {
        setTestResult({
          success: true,
          message: 'Conexão estabelecida com sucesso com a API Gnotes!'
        });
      } else {
        setTestResult({
          success: false,
          message: 'Não foi possível conectar. Verifique se o backend está em execução.'
        });
      }
      onConnectionChange();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Erro ao tentar comunicação com o servidor.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setBaseUrl(apiUrl);
    onConnectionChange();
    onClose();
  };

  const handleReset = () => {
    resetBaseUrl();
    const defaultUrl = getBaseUrl();
    setApiUrlState(defaultUrl);
    setTestResult(null);
    onConnectionChange();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl rounded-3xl glass-panel border border-slate-700/80 bg-slate-900 shadow-2xl p-6 sm:p-7 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Configuração da API Gnotes
              </h2>
              <p className="text-xs text-slate-400">
                Ajuste o endpoint do backend .NET RESTful e verifique a conectividade
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              URL Base da API (Backend .NET)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrlState(e.target.value)}
                  placeholder="Ex.: http://localhost:5098 ou https://localhost:7237"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting || !apiUrl.trim()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-indigo-400' : ''}`} />
                <span>Testar</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Padrão HTTP: <code className="text-indigo-300">http://localhost:5098</code> | HTTPS: <code className="text-indigo-300">https://localhost:7237</code>
            </p>
          </div>

          {/* Test Feedback Message */}
          {testResult && (
            <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-semibold">{testResult.success ? 'Online' : 'Aviso'}: </span>
                <span>{testResult.message}</span>
              </div>
            </div>
          )}

          {/* Endpoints Documentation Quick Reference */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" /> Endpoints Disponibilizados
              </span>
              <a
                href={`${apiUrl}/swagger`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
              >
                Abrir Swagger <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="text-[11px] font-mono text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between py-0.5 border-b border-slate-900">
                <span className="text-emerald-400 font-bold">GET</span>
                <span>/api/notes</span>
                <span className="text-slate-400 font-sans">Listar todas as notas</span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-b border-slate-900">
                <span className="text-emerald-400 font-bold">GET</span>
                <span>/api/notes/status/{`{status}`}</span>
                <span className="text-slate-400 font-sans">Filtrar por coluna</span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-b border-slate-900">
                <span className="text-indigo-400 font-bold">POST</span>
                <span>/api/notes</span>
                <span className="text-slate-400 font-sans">Criar nova nota</span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-b border-slate-900">
                <span className="text-amber-400 font-bold">PUT</span>
                <span>/api/notes/{`{id}`}</span>
                <span className="text-slate-400 font-sans">Atualizar nota</span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-b border-slate-900">
                <span className="text-purple-400 font-bold">PATCH</span>
                <span>/api/notes/{`{id}`}/status</span>
                <span className="text-slate-400 font-sans">Alterar coluna/status</span>
              </div>
              <div className="flex items-center justify-between py-0.5">
                <span className="text-rose-400 font-bold">DELETE</span>
                <span>/api/notes/{`{id}`}</span>
                <span className="text-slate-400 font-sans">Excluir nota</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Salvar Configuração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
