import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

interface Props {
  xp: number;
  level: number;
  soundEnabled?: boolean;
  compact?: boolean;
}

export function AnimatedLevelBar({ xp, level, soundEnabled = true, compact = false }: Props) {
  const currentXpInLevel = xp % 100;
  const prevLevelRef = useRef<number>(level);
  const [showLevelUpAlert, setShowLevelUpAlert] = useState(false);

  useEffect(() => {
    if (level > prevLevelRef.current) {
      // Level Up Event!
      setShowLevelUpAlert(true);
      sound.playSuccess(soundEnabled);

      try {
        confetti({
          particleCount: 50,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#ffb21d', '#ec3d9a', '#7c3cff', '#58e66b'],
        });
      } catch {}

      const timer = setTimeout(() => {
        setShowLevelUpAlert(false);
      }, 3500);

      prevLevelRef.current = level;
      return () => clearTimeout(timer);
    }
    prevLevelRef.current = level;
  }, [level, soundEnabled]);

  return (
    <div className="w-full space-y-1.5 relative">
      {/* Level Up Celebration Toast Overlay */}
      <AnimatePresence>
        {showLevelUpAlert && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -6 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-400/60 shadow-lg shadow-amber-500/10 mb-1.5"
          >
            <div className="flex items-center gap-1.5">
              <motion.span
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-base"
              >
                👑
              </motion.span>
              <span className="text-xs font-black font-display text-amber-300 tracking-wide uppercase">
                Level Up! Reached Level {level}
              </span>
            </div>
            <span className="text-[10px] font-bold text-purple-200 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-700/60">
              Rank Elevated ✨
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Meta Labels */}
      {!compact && (
        <div className="text-xs text-[#9ca7bd] flex items-center justify-between">
          <span className="flex items-center gap-1 font-medium">
            <span>Next Level</span>
            <span className="text-slate-400">({currentXpInLevel}% to Lvl {level + 1})</span>
          </span>
          <span className="font-bold text-slate-200 font-mono text-[11px]">
            {currentXpInLevel} / 100 XP
          </span>
        </div>
      )}

      {/* Animated Level Bar Track */}
      <div className="relative w-full bg-[#18233a] rounded-full h-2.5 overflow-hidden border border-[#2a395c]/60 shadow-inner">
        {/* Fill with Framer Motion */}
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 relative"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(4, currentXpInLevel)}%` }}
          transition={{ type: 'spring', stiffness: 45, damping: 12 }}
        >
          {/* Shimmer light effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </div>
  );
}
