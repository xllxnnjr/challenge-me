import React from 'react';

interface ActivityRingsProps {
  points: number;
  pointsGoal?: number;
  streak: number;
  streakGoal?: number;
  completed: number;
  completedGoal?: number;
  size?: number;
  className?: string;
  showLabels?: boolean;
}

export function ActivityRings({
  points,
  pointsGoal = 300,
  streak,
  streakGoal = 7,
  completed,
  completedGoal = 10,
  size = 140,
  className = '',
  showLabels = true,
}: ActivityRingsProps) {
  // Calculate clamped and percentage values for the 3 concentric Apple Activity rings
  const pPct = Math.min(Math.max(points / pointsGoal, 0.05), 1.25);
  const sPct = Math.min(Math.max(streak / streakGoal, 0.05), 1.25);
  const cPct = Math.min(Math.max(completed / completedGoal, 0.05), 1.25);

  const center = size / 2;
  const strokeWidth = size * 0.095;

  // Radii for outer (Points/Move - Red/Coral), middle (Streak/Exercise - Volt/Lime), inner (Completed/Stand - Cyan/Aqua)
  const r1 = center - strokeWidth;
  const r2 = r1 - strokeWidth * 1.35;
  const r3 = r2 - strokeWidth * 1.35;

  const circ1 = 2 * Math.PI * r1;
  const circ2 = 2 * Math.PI * r2;
  const circ3 = 2 * Math.PI * r3;

  const offset1 = circ1 * (1 - Math.min(pPct, 1));
  const offset2 = circ2 * (1 - Math.min(sPct, 1));
  const offset3 = circ3 * (1 - Math.min(cPct, 1));

  return (
    <div className={`flex items-center gap-4 sm:gap-6 ${className}`}>
      {/* SVG Concentric Apple Rings */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
        >
          <defs>
            {/* Ring 1: Points (Coral / Red / Orange) */}
            <linearGradient id="ring-points-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FA114F" />
              <stop offset="100%" stopColor="#FF6482" />
            </linearGradient>
            {/* Ring 2: Streak (Volt / Green / Yellow) */}
            <linearGradient id="ring-streak-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#92E82A" />
              <stop offset="100%" stopColor="#AEEA00" />
            </linearGradient>
            {/* Ring 3: Completed (Cyan / Blue / Purple) */}
            <linearGradient id="ring-completed-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#2979FF" />
            </linearGradient>
          </defs>

          {/* Background tracks (Subtle translucent deep tracks) */}
          <circle
            cx={center}
            cy={center}
            r={r1}
            stroke="rgba(250, 17, 79, 0.15)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={center}
            cy={center}
            r={r2}
            stroke="rgba(146, 232, 42, 0.15)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={center}
            cy={center}
            r={r3}
            stroke="rgba(0, 229, 255, 0.15)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Active Animated Ring 1: Points (Outer) */}
          <circle
            cx={center}
            cy={center}
            r={r1}
            stroke="url(#ring-points-grad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circ1}
            strokeDashoffset={offset1}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-1000 ease-out"
          />

          {/* Active Animated Ring 2: Streak (Middle) */}
          <circle
            cx={center}
            cy={center}
            r={r2}
            stroke="url(#ring-streak-grad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circ2}
            strokeDashoffset={offset2}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-1000 ease-out"
          />

          {/* Active Animated Ring 3: Completed (Inner) */}
          <circle
            cx={center}
            cy={center}
            r={r3}
            stroke="url(#ring-completed-grad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circ3}
            strokeDashoffset={offset3}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Sparkle / Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-white/20 blur-[1px]" />
        </div>
      </div>

      {/* Legend & Stats (Apple Fitness style) */}
      {showLabels && (
        <div className="flex-1 space-y-2 min-w-0">
          {/* Ring 1 Label */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FA114F] shadow-[0_0_8px_rgba(250,17,79,0.8)]" />
              <span className="text-xs font-bold text-slate-300">Points</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-white">{points}</span>
              <span className="text-[10px] text-slate-400">/{pointsGoal}</span>
            </div>
          </div>

          {/* Ring 2 Label */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#92E82A] shadow-[0_0_8px_rgba(146,232,42,0.8)]" />
              <span className="text-xs font-bold text-slate-300">Streak</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-white">{streak}</span>
              <span className="text-[10px] text-slate-400">/{streakGoal}d</span>
            </div>
          </div>

          {/* Ring 3 Label */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
              <span className="text-xs font-bold text-slate-300">Challenges</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-white">{completed}</span>
              <span className="text-[10px] text-slate-400">/{completedGoal}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
