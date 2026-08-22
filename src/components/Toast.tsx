import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { haptics } from '../utils/haptics';

interface Props {
  message: string | null;
  onClear: () => void;
}

export function Toast({ message, onClear }: Props) {
  const [visible, setVisible] = useState(false);
  const onClearRef = React.useRef(onClear);
  onClearRef.current = onClear;

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);

    // Automatically hide the pop-up notification smoothly after 1800ms
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onClearRef.current();
      }, 200); // Give time for exit fade animation
    }, 1800);

    return () => clearTimeout(timer);
  }, [message]);

  if (!message || !visible) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.light();
    setVisible(false);
    setTimeout(() => {
      onClearRef.current();
    }, 150);
  };

  return (
    <div
      onClick={handleDismiss}
      className="fixed left-1/2 bottom-20 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 cursor-pointer pointer-events-auto max-w-[90vw]"
    >
      <div className="bg-[#0f172a]/95 text-white backdrop-blur-xl px-4 py-2.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.6)] font-display font-bold text-xs sm:text-sm tracking-tight border border-white/20 flex items-center gap-2.5 hover:border-white/40 transition active:scale-95 group relative overflow-hidden">
        <span className="flex-1 text-center truncate select-none relative z-10">{message}</span>
        <button
          type="button"
          onClick={handleDismiss}
          className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition shrink-0 relative z-10"
          title="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
        {/* Subtle auto-dismiss animated timer bar */}
        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500 animate-[width_1.8s_linear]" />
      </div>
    </div>
  );
}
