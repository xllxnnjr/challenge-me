import React, { useRef, useEffect, useState } from 'react';
import { BarChart3, Flame, Target, Sparkles, TrendingUp, Clock, Award, Share2 } from 'lucide-react';
import { GameState } from '../../types';
import { calculateLevel } from '../../utils/storage';
import { ActivityRings } from '../ActivityRings';
import { ChallengeIcon } from '../ChallengeIcon';
import { ShareModal, ShareData } from '../ShareModal';
import { CHALLENGES } from '../../data/challenges';
import { haptics } from '../../utils/haptics';
import { sound } from '../../utils/audio';

interface Props {
  state: GameState;
  onToast?: (msg: string) => void;
}

export function StatsScreen({ state, onToast = () => {} }: Props) {
  const currentLevel = calculateLevel(state.xp);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleShareStats = () => {
    sound.playSuccess(state.soundEnabled);
    haptics.celebration();
    setShareModalOpen(true);
  };

  // Draw smooth Apple Health-style performance line chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const history = state.history && state.history.length >= 2 ? state.history : [20, 35, 50, 70, 60, 85, 110];
    const maxVal = Math.max(...history, 100);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 20; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(15, y);
      ctx.lineTo(width - 15, y);
      ctx.stroke();
    }

    // Line gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#FA114F');
    gradient.addColorStop(0.5, '#FF9F0A');
    gradient.addColorStop(1, '#92E82A');

    const points: { x: number; y: number }[] = history.map((val, idx) => {
      const x = 20 + (idx / Math.max(1, history.length - 1)) * (width - 40);
      const y = height - 20 - (val / maxVal) * (height - 45);
      return { x, y };
    });

    // Fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - 5);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height - 5);
    ctx.closePath();

    const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
    fillGrad.addColorStop(0, 'rgba(250, 17, 79, 0.25)');
    fillGrad.addColorStop(1, 'rgba(250, 17, 79, 0.0)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Stroke
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Dots
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#FA114F';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [state.history]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-10">
      {/* 1. Header with Share Action */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Activity & Stats
          </h1>
          <p className="text-xs text-slate-400">
            Track daily momentum, level curve & progress
          </p>
        </div>

        <button
          type="button"
          onClick={handleShareStats}
          className="px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#0c1322]/80 border border-white/10 rounded-[22px] p-3.5 text-center shadow-sm">
          <strong className="block font-display font-black text-xl sm:text-2xl text-amber-400">
            {state.points}
          </strong>
          <span className="text-[11px] text-slate-400 font-bold block mt-0.5">Points (💎)</span>
        </div>
        <div className="bg-[#0c1322]/80 border border-white/10 rounded-[22px] p-3.5 text-center shadow-sm">
          <strong className="block font-display font-black text-xl sm:text-2xl text-rose-400">
            {state.streak}d
          </strong>
          <span className="text-[11px] text-slate-400 font-bold block mt-0.5">Day Streak 🔥</span>
        </div>
        <div className="bg-[#0c1322]/80 border border-white/10 rounded-[22px] p-3.5 text-center shadow-sm">
          <strong className="block font-display font-black text-xl sm:text-2xl text-emerald-400">
            {state.done}
          </strong>
          <span className="text-[11px] text-slate-400 font-bold block mt-0.5">Completed 🎯</span>
        </div>
      </div>

      {/* 3. Activity Rings Dashboard */}
      <div className="rounded-[28px] bg-gradient-to-br from-[#12192d] via-[#0d1323] to-[#070b16] border border-white/10 p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-black text-white text-sm sm:text-base">
            Daily Activity Goals
          </h3>
          <span className="text-xs font-bold text-amber-400">
            Level {currentLevel} Challenger
          </span>
        </div>

        <ActivityRings
          points={state.points}
          pointsGoal={Math.max(100, (currentLevel + 1) * 60)}
          streak={state.streak}
          streakGoal={7}
          completed={state.done}
          completedGoal={10}
          size={110}
          showLabels={true}
        />
      </div>

      {/* 4. XP Growth Curve Canvas */}
      <div className="bg-[#0c1322]/80 border border-white/10 rounded-[28px] p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-400" />
            <h3 className="font-display font-black text-sm text-white">
              Performance Trend
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">{state.xp} Total XP</span>
        </div>

        <div className="bg-black/40 rounded-2xl border border-white/5 p-2 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={440}
            height={140}
            className="w-full h-[130px] block"
          />
        </div>
      </div>

      {/* 5. Recent Activity Log */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display font-black text-sm sm:text-base text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Recent Completed Games</span>
          </h3>
          <span className="text-xs text-slate-400">{state.detailedHistory?.length || 0} recorded</span>
        </div>

        {state.detailedHistory && state.detailedHistory.length > 0 ? (
          <div className="space-y-2">
            {state.detailedHistory.slice(0, 5).map((item) => {
              const matchingChallenge = CHALLENGES.find((c) => c.title === item.title);

              return (
                <div
                  key={item.id}
                  className="bg-[#0c1322]/80 hover:bg-[#111a2e] border border-white/10 rounded-2xl p-3 flex items-center justify-between transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <ChallengeIcon
                      type={matchingChallenge?.type}
                      category={matchingChallenge?.cat}
                      rawEmoji={item.icon}
                      size="sm"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400">{item.dateStr}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                    +{item.pts} XP
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
            <p className="text-xs text-slate-400">
              Play any challenge from the Home or Games tab to record your activity here! 🚀
            </p>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        data={{
          title: `${state.playerName}'s Fitness & Activity Stats`,
          text: `📊 ${state.playerName}'s Challenge Me Activity Report:\n• Level ${currentLevel} Challenger (${state.xp} XP)\n• Total Points: ${state.points} pts\n• Current Streak: ${state.streak} days 🔥\n• Challenges Completed: ${state.done}\n\nTrack your mental agility & compete with friends!`,
          level: currentLevel,
          score: state.points,
          streak: state.streak,
        }}
        onToast={onToast}
        soundEnabled={state.soundEnabled}
      />
    </div>
  );
}
