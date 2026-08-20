import { useEffect } from 'react';

interface Props {
  message: string | null;
  onClear: () => void;
}

export function Toast({ message, onClear }: Props) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClear();
    }, 2400);
    return () => clearTimeout(timer);
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div className="fixed left-1/2 bottom-20 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
      <div className="bg-white/95 text-[#070b16] px-4 py-2.5 rounded-2xl shadow-2xl font-display font-extrabold text-xs sm:text-sm tracking-wide border border-slate-200 flex items-center gap-2">
        <span>{message}</span>
      </div>
    </div>
  );
}
