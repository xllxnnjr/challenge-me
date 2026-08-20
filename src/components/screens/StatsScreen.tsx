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

    const history = state.history.length >= 2 ? state.history : [15, 30, 45, 60, 50, 75, 90];
    const maxVal = Math.max(...history, 100);

    // Subtle background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 25; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(15, y);
      ctx.lineTo(width - 15, y);
      ctx.stroke();
    }

    // Line gradient (Apple Fitness neon aesthetic)
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#FA114F');
    gradient.addColorStop(0.5, '#FF9F0A');
    gradient.addColorStop(1, '#92E82A');

    const points: { x: number; y: number }[] = history.map((val, idx) => {
      const x = 20 + (idx / Math.max(1, history.length - 1)) * (width - 40);
      const y = height - 25 - (val / maxVal) * (height - 50);
      return { x, y };
    });

    // Smooth spline fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - 8);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height - 8);
    ctx.closePath();

    const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
    fillGrad.addColorStop(0, 'rgba(250, 17, 79, 0.25)');
    fillGrad.addColorStop(1, 'rgba(250, 17, 79, 0.0)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Stroke line
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Draw point dots with neon aura
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#FA114F';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });
  }, [state.history]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-8">
      {/* Title */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white">
            Activity & Metrics
          </h2>
          <span className="text-xs text-[#94a3b8]">
            Apple Fitness & Health progress dashboard
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareStats}
            title="Share stats to applications"
            className="p-2.5 bg-white/[0.08] hover:bg-white/[0.14] rounded-[20px] border border-white/15 text-amber-400 shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share Stats</span>
          </button>
          <div className="p-2.5 bg-white/[0.06] rounded-[20px] border border-white/10 text-amber-400 shadow-md">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Apple Activity Rings Pod */}
      <div className="rounded-[30px] bg-gradient-to-br from-white/[0.09] via-white/[0.04] to-white/[0.015] backdrop-blur-2xl border border-white/10 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-black text-white text-base">
            Today&apos;s Activity Rings
          </h3>
          <span className="text-xs font-bold text-slate-400">Daily Target</span>
        </div>

        <ActivityRings
          points={state.points}
          pointsGoal={Math.max(100, (currentLevel + 1) * 60)}
          streak={state.streak}
          streakGoal={7}
          completed={state.done}
          completedGoal={10}
          size={120}
          showLabels={true}
        />
      </div>

      {/* Level Summary Banner */}
      <div className="rounded-[28px] bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] backdrop-blur-2xl border border-white/10 p-5 flex items-center gap-4 shadow-[0_10px_32px_rgba(0,0,0,0.4)]">
        <div className="w-14 h-14 rounded-[20px] bg-gradient-to-tr from-[#FF9500] via-[#FF2D55] to-[#AF52DE] flex items-center justify-center text-3xl shadow-lg shadow-purple-950/40 flex-shrink-0">
          ⚡
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-white text-base truncate">
              Level {currentLevel} Challenger
            </h3>
            <span className="text-xs text-amber-400 font-black">{state.xp} Total XP</span>
          </div>
          <p className="text-xs text-[#9ca7bd] mb-2 font-normal">Keep conquering challenges to level up</p>
          <div className="w-full bg-white/[0.08] rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${state.xp % 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white/[0.04] border border-white/10 rounded-[24px] p-3.5 text-center shadow-inner">
          <strong className="block font-display font-black text-xl sm:text-2xl text-[#FA114F]">
            {state.points}
          </strong>
          <small className="text-[11px] text-[#8e9cb4] font-medium">Total Points</small>
        </div>
        <div className="bg-white/[0.04] border border-white/10 rounded-[24px] p-3.5 text-center shadow-inner">
          <strong className="block font-display font-black text-xl sm:text-2xl text-[#92E82A]">
            {state.streak}
          </strong>
          <small className="text-[11px] text-[#8e9cb4] font-medium">Day Streak</small>
        </div>
        <div className="bg-white/[0.04] border border-white/10 rounded-[24px] p-3.5 text-center shadow-inner">
          <strong className="block font-display font-black text-xl sm:text-2xl text-[#00E5FF]">
            {state.done}
          </strong>
          <small className="text-[11px] text-[#8e9cb4] font-medium">Completed</small>
        </div>
      </div>

      {/* Apple Health Points Progression Chart */}
      <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[30px] p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FA114F]" />
            <h3 className="font-display font-black text-sm text-white">
              XP Growth Curve
            </h3>
          </div>
          <span className="text-[11px] text-[#9ca7bd] font-medium">Recent Activity</span>
        </div>

        <div className="bg-black/40 rounded-[22px] border border-white/5 p-2.5 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={440}
            height={160}
            className="w-full h-[150px] block"
          />
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display font-black text-base text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Recent Completed Challenges</span>
          </h3>
          <span className="text-xs text-[#9ca7bd]">{state.detailedHistory?.length || 0} logged</span>
        </div>

        {state.detailedHistory && state.detailedHistory.length > 0 ? (
          <div className="space-y-2.5">
            {state.detailedHistory.slice(0, 5).map((item) => {
              const matchingChallenge = CHALLENGES.find((c) => c.title === item.title);

              return (
                <div
                  key={item.id}
                  className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-[24px] p-3.5 flex items-center justify-between transition-colors shadow-sm"
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
                      <span className="text-[10px] text-[#9ca7bd]">{item.dateStr}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                    +{item.pts} XP
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-[26px] bg-white/[0.02] border border-white/10 text-center">
            <p className="text-xs text-[#828fa6]">
              Complete your first challenge to see your activity timeline here! 🚀
            </p>
          </div>
        )}
      </div>

      {/* Reusable Share to Application Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        data={{
          title: `${state.playerName}'s Fitness & Activity Stats`,
          text: `📊 ${state.playerName}'s Challenge Me Activity Report:\n• Level ${currentLevel} Challenger (${state.xp} XP)\n• Total Points: ${state.points} pts\n• Current Streak: ${state.streak} days 🔥\n• Challenges Completed: ${state.done}\n• Active Difficulty: ${state.selectedDifficulty || 'Medium'}\n\nTrack your mental agility & compete with friends!`,
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
