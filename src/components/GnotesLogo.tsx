import React from 'react';
import { NotebookPen } from 'lucide-react';

interface GnotesLogoProps {
  compact?: boolean;
  small?: boolean;
}

export const GnotesLogo: React.FC<GnotesLogoProps> = ({ compact = false, small = false }) => (
  <div className="flex items-center gap-3" aria-label="Gnotes">
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 ring-1 ring-white/25 ${small ? 'h-8 w-8 rounded-[10px] sm:h-9 sm:w-9' : 'h-10 w-10 sm:h-11 sm:w-11'}`}>
      <div className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-white/20 blur-md" />
      <NotebookPen className={`relative z-10 -rotate-6 text-white ${small ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'}`} strokeWidth={2.2} />
      <span className="absolute bottom-1.5 right-1.5 z-10 h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
    </div>
    {!compact && (
      <div>
        <div className={`${small ? 'text-lg' : 'text-xl'} font-extrabold tracking-tight text-white`}>Gnotes</div>
        <div className={`${small ? 'hidden' : 'text-[10px]'} font-semibold uppercase tracking-[0.16em] text-cyan-300/80`}>Capture. Organize. Move.</div>
      </div>
    )}
  </div>
);
