import { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, ArrowRight, Zap } from 'lucide-react';
import { Challenge, Difficulty } from '../types';
import { sound } from '../utils/audio';
import { MathGame } from './games/MathGame';
import { MemoryGame } from './games/MemoryGame';
import { ReactionGame } from './games/ReactionGame';
import { NumberGame } from './games/NumberGame';
import { DrawGame } from './games/DrawGame';
import { TwisterGame } from './games/TwisterGame';
import { PatternGame } from './games/PatternGame';
import { TargetGame } from './games/TargetGame';
import { StroopGame } from './games/StroopGame';
import { WordScrambleGame } from './games/WordScrambleGame';
import { PairMatchGame } from './games/PairMatchGame';
import { ChimpGame } from './games/ChimpGame';
import { SpeedTapGame } from './games/SpeedTapGame';
import { RhythmGame } from './games/RhythmGame';
import { TriviaGame } from './games/TriviaGame';
import { TruthGame } from './games/TruthGame';
import { CompareGame } from './games/CompareGame';

interface Props {
  challenge: Challenge | null;
  difficulty: Difficulty;
  playerLevel?: number;
  onChangeDifficulty: (diff: Difficulty) => void;
  onClose: () => void;
  onComplete: (challenge: Challenge, earnedPoints: number) => void;
  onNextRandom: () => void;
  onToast: (msg: string) => void;
  onPenalty: (amount?: number, reason?: string) => void;
  soundEnabled: boolean;
}

export function GameModal({
  challenge,
  difficulty,
  playerLevel = 1,
  onChangeDifficulty,
  onClose,
  onComplete,
  onNextRandom,
  onToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const [result, setResult] = useState<{ score: number; message: string } | null>(null);

  if (!challenge) return null;

  const handleSuccess = (score: number, message: string) => {
    // Level scaling reward bonus
    const levelBonus = Math.round(score * (0.05 * (playerLevel - 1)));
    const totalScore = score + levelBonus;

    setResult({
      score: totalScore,
      message: levelBonus > 0 ? `${message} (+${levelBonus} Lvl ${playerLevel} scaling bonus!)` : message,
    });
    sound.playSuccess(soundEnabled);

    // Fire celebration confetti
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff9f1c', '#ef3fa2', '#793cff', '#58e66b', '#38bdf8'],
      });
    } catch {}

    onComplete(challenge, totalScore);
  };

  const handleNextChallenge = () => {
    setResult(null);
    onNextRandom();
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  const getDifficultyPoints = (basePts: number, diff: Difficulty) => {
    if (diff === 'Easy') return Math.round(basePts * 0.75);
    if (diff === 'Hard') return Math.round(basePts * 1.5);
    return basePts;
  };

  const currentRewardPts = getDifficultyPoints(challenge.pts, difficulty);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-[#0c1322] border border-[#263149] rounded-t-[28px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[94vh] flex flex-col overflow-y-auto animate-in slide-in-from-bottom-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#263149]/70 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{challenge.icon}</span>
            <div>
              <h2 className="font-display font-extrabold text-lg text-white leading-tight">
                {challenge.title}
              </h2>
              <span className="text-xs text-[#9ca7bd] flex items-center gap-1.5 flex-wrap">
                <span>{challenge.cat}</span>
                {challenge.subCat && (
                  <>
                    <span>•</span>
                    <span className="text-slate-300 font-semibold">{challenge.subCat}</span>
                  </>
                )}
                <span>•</span>
                <strong className="text-amber-400">+{currentRewardPts} pts</strong>
                <span>•</span>
                <span className="text-amber-300 font-bold flex items-center gap-0.5 text-[11px]">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Lvl {playerLevel} Scaling
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-[#182138] hover:bg-[#232f4e] text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Difficulty Pill Switcher in Modal */}
        {!result && (
          <div className="flex items-center justify-between bg-[#11192b] border border-[#222e47] rounded-xl px-3 py-1.5 mb-3">
            <span className="text-[11px] font-bold text-slate-400">Difficulty:</span>
            <div className="flex items-center gap-1">
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => {
                const isActive = difficulty === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onChangeDifficulty(d)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                      isActive
                        ? d === 'Easy'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : d === 'Medium'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-rose-600 text-white shadow-sm'
                        : 'bg-[#172238] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Body: Active Game vs Completed Result */}
        {result ? (
          <div className="py-4 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-4xl shadow-xl shadow-purple-900/40 mb-4 animate-bounce">
              ⭐
            </div>

            <span className="text-xs font-black tracking-widest uppercase text-amber-400">
              Challenge Conquered!
            </span>
            <h3 className="text-2xl font-display font-black text-white mt-1 mb-2">
              +{result.score} Points
            </h3>
            <p className="text-sm text-[#9ca7bd] max-w-xs mb-6 leading-relaxed">
              {result.message}
            </p>

            <div className="w-full space-y-2.5">
              <button
                id="modal-next-challenge-btn"
                onClick={handleNextChallenge}
                className="w-full py-3.5 rounded-xl font-black text-white bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-95 active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 cursor-pointer"
              >
                <span>NEXT CHALLENGE</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleClose}
                className="w-full py-3 bg-[#111a2c] hover:bg-[#18243c] text-slate-300 font-bold rounded-xl border border-[#263149] transition text-sm cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {challenge.type === 'math' && (
              <MathGame
                difficulty={difficulty}
                playerLevel={playerLevel}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'memory' && (
              <MemoryGame
                difficulty={difficulty}
                playerLevel={playerLevel}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'reaction' && (
              <ReactionGame
                difficulty={difficulty}
                playerLevel={playerLevel}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'number' && (
              <NumberGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'draw' && (
              <DrawGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'twister' && (
              <TwisterGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'pattern' && (
              <PatternGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'target' && (
              <TargetGame
                difficulty={difficulty}
                playerLevel={playerLevel}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'stroop' && (
              <StroopGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'scramble' && (
              <WordScrambleGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'pairs' && (
              <PairMatchGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'chimp' && (
              <ChimpGame
                difficulty={difficulty}
                playerLevel={playerLevel}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'speedtap' && (
              <SpeedTapGame
                difficulty={difficulty}
                playerLevel={playerLevel}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'rhythm' && (
              <RhythmGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'trivia' && (
              <TriviaGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'truth' && (
              <TruthGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'compare' && (
              <CompareGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={onToast}
                onPenalty={onPenalty}
                soundEnabled={soundEnabled}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
