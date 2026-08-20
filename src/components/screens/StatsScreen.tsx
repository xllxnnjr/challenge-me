import { useRef, useEffect } from 'react';
import { BarChart3, Flame, Target, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { GameState } from '../../types';
import { calculateLevel } from '../../utils/storage';

interface Props {
  state: GameState;
}

export function StatsScreen({ state }: Props) {
  const currentLevel = calculateLevel(state.xp);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw smooth performance line chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const history = state.history.length >= 2 ? state.history : [10, 25, 30, 45, 40, 50];
    const maxVal = Math.max(...history, 60);

    // Background gradient grid lines
    ctx.strokeStyle = '#18243e';
    ctx.lineWidth = 1;
    for (let y = 30; y < height; y += 35) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }

    // Line gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#ff9f1c');
    gradient.addColorStop(0.5, '#ef3fa2');
    gradient.addColorStop(1, '#793cff');

    const points: { x: number; y: number }[] = history.map((val, idx) => {
      const x = 25 + (idx / Math.max(1, history.length - 1)) * (width - 50);
      const y = height - 25 - (val / maxVal) * (height - 50);
      return { x, y };
    });

    // Fill area below chart
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - 10);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height - 10);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
    fillGrad.addColorStop(0, 'rgba(124, 60, 255, 0.25)');
    fillGrad.addColorStop(1, 'rgba(124, 60, 255, 0.0)');
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

    // Draw point dots
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#793cff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [state.history]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-black text-white">
            Performance Stats
          </h2>
          <span className="text-xs text-[#9ca7bd]">
            All-time gameplay metrics and progress
          </span>
        </div>
        <div className="p-2 bg-[#111a2c] rounded-xl border border-[#263149] text-amber-400">
          <BarChart3 className="w-5 h-5" />
        </div>
      </div>

      {/* Level Summary Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-[#121d31] to-[#0e1424] border border-[#263149] p-4 flex items-center gap-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg">
          ⚡
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-extrabold text-white text-base">
              Level {currentLevel} Challenger
            </h3>
            <span className="text-xs text-amber-400 font-black">{state.xp} Total XP</span>
          </div>
          <p className="text-xs text-[#9ca7bd] mb-2">Keep conquering challenges to level up</p>
          <div className="w-full bg-[#1c263c] rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${state.xp % 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#10182a] border border-[#263149] rounded-2xl p-3 text-center">
          <strong className="block font-display font-black text-2xl text-amber-400">
            {state.points}
          </strong>
          <small className="text-xs text-[#9ca7bd] font-semibold">Total Points</small>
        </div>
        <div className="bg-[#10182a] border border-[#263149] rounded-2xl p-3 text-center">
          <strong className="block font-display font-black text-2xl text-orange-400">
            {state.streak}
          </strong>
          <small className="text-xs text-[#9ca7bd] font-semibold">Day Streak</small>
        </div>
        <div className="bg-[#10182a] border border-[#263149] rounded-2xl p-3 text-center">
          <strong className="block font-display font-black text-2xl text-purple-300">
            {state.done}
          </strong>
          <small className="text-xs text-[#9ca7bd] font-semibold">Challenges Solved</small>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-[#10182a] border border-[#263149] rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pink-400" />
            <h3 className="font-display font-bold text-sm text-white">
              Points Progression
            </h3>
          </div>
          <span className="text-[11px] text-[#9ca7bd]">Recent Rounds</span>
        </div>

        <div className="bg-[#0a1020] rounded-xl border border-[#1b253b] p-2 overflow-hidden">
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
          <h3 className="font-display font-extrabold text-base text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Recent Completed Challenges</span>
          </h3>
          <span className="text-xs text-[#9ca7bd]">{state.detailedHistory?.length || 0} logged</span>
        </div>

        {state.detailedHistory && state.detailedHistory.length > 0 ? (
          <div className="space-y-2">
            {state.detailedHistory.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="bg-[#10182a] border border-[#263149] rounded-2xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-[#9ca7bd]">{item.dateStr}</span>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-400 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  +{item.pts} pts
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#0c1221] border border-[#263149] text-center">
            <p className="text-xs text-[#828fa6]">
              Complete your first challenge to see your activity timeline here! 🚀
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
