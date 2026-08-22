import { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, ArrowRight, Zap, Share2 } from 'lucide-react';
import { Challenge, Difficulty } from '../types';
import { sound } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { ChallengeIcon } from './ChallengeIcon';
import { ShareModal, ShareData } from './ShareModal';
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
import { VoiceRiddleGame } from './games/VoiceRiddleGame';
import { EduQuizGame } from './games/EduQuizGame';
import { EmojiRiddleGame } from './games/EmojiRiddleGame';
import { SimonGame } from './games/SimonGame';
import { CodeBreakerGame } from './games/CodeBreakerGame';
import { DetectiveRiddleGame } from './games/DetectiveRiddleGame';
import { CinemaQuizGame } from './games/CinemaQuizGame';
import { Math24Game } from './games/Math24Game';
import { FlagQuizGame } from './games/FlagQuizGame';
import { PitchMatchGame } from './games/PitchMatchGame';
import { AnagramBlitzGame } from './games/AnagramBlitzGame';

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
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  if (!challenge) return null;

  const handleShareVictory = () => {
    sound.playSuccess(soundEnabled);
    haptics.celebration();
    setShareModalOpen(true);
  };

  const handleSuccess = (score: number, message: string) => {
    setResult({
      score,
      message,
    });
    sound.playSuccess(soundEnabled);
    haptics.celebration();

    // Fire celebration confetti
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff9f1c', '#ef3fa2', '#793cff', '#58e66b', '#38bdf8'],
      });
    } catch {}

    onComplete(challenge, score);
  };

  const handlePenaltyWrapped = (amount?: number, reason?: string) => {
    haptics.error();
    onPenalty(amount, reason);
  };

  const handleErrorToastWrapped = (msg: string) => {
    haptics.error();
    onToast(msg);
  };

  const handleNextChallenge = () => {
    haptics.medium();
    setResult(null);
    setShowExitWarning(false);
    onNextRandom();
  };

  const handleClose = () => {
    // If the challenge is active and unfinished, prevent exit unless forfeited
    if (!result) {
      sound.playError(soundEnabled);
      haptics.error();
      setShowExitWarning(true);
      return;
    }
    haptics.light();
    setResult(null);
    setShowExitWarning(false);
    onClose();
  };

  const handleForfeitAndLeave = () => {
    haptics.error();
    onPenalty(10, `Abandoned "${challenge.title}" in progress`);
    onToast('Challenge forfeited (-10 pts penalty) ⚠️');
    setShowExitWarning(false);
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-[#0c1322]/95 backdrop-blur-3xl border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-h-[94vh] flex flex-col overflow-y-auto animate-in slide-in-from-bottom-6 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple Modal Top Grabber Pill */}
        <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto mb-3 sm:hidden" />

        {/* Exit Warning Dialog (Game Locked until finished) */}
        {showExitWarning && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 rounded-[32px] p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center text-3xl mb-3 shadow-lg">
              🔒
            </div>
            <h3 className="text-lg font-display font-black text-white mb-1.5">
              Challenge In Progress!
            </h3>
            <p className="text-xs text-slate-300 max-w-xs mb-5 leading-relaxed font-medium">
              You cannot leave before finishing the challenge. Complete the game now to earn{' '}
              <strong className="text-amber-400">+{currentRewardPts} Points & XP</strong>!
            </p>
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => {
                  haptics.success();
                  setShowExitWarning(false);
                }}
                className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 font-black text-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer"
              >
                Keep Playing & Finish
              </button>
              <button
                type="button"
                onClick={handleForfeitAndLeave}
                className="w-full py-2.5 rounded-2xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/40 text-rose-400 hover:text-rose-300 font-bold text-xs transition active:scale-95 cursor-pointer"
              >
                Forfeit Challenge (-10 Pts Penalty)
              </button>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5">
          <div className="flex items-center gap-3">
            <ChallengeIcon
              type={challenge.type}
              category={challenge.cat}
              rawEmoji={challenge.icon}
              size="md"
            />
            <div>
              <h2 className="font-display font-black text-lg text-white leading-tight">
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
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Difficulty Badge (Locked during active challenge) */}
        {!result && (
          <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-full px-3.5 py-1.5 mb-3.5 shadow-inner">
            <span className="text-[11px] font-bold text-slate-400">Active Challenge Tier:</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm ${
                  difficulty === 'Easy'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : difficulty === 'Hard'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                <span>{difficulty}</span>
                <span className="opacity-80">({difficulty === 'Easy' ? '0.75x' : difficulty === 'Hard' ? '1.5x' : '1.0x'} XP)</span>
              </span>
            </div>
          </div>
        )}

        {/* Modal Body: Active Game vs Completed Result */}
        {result ? (
          <div className="py-4 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-[24px] bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-4xl shadow-xl shadow-purple-900/40 mb-4 animate-bounce">
              ⭐
            </div>

            <span className="text-xs font-black tracking-widest uppercase text-amber-400">
              Challenge Conquered!
            </span>
            <h3 className="text-2xl font-display font-black text-white mt-1 mb-2">
              +{result.score} Points
            </h3>
            <p className="text-sm text-[#9ca7bd] max-w-xs mb-6 leading-relaxed font-normal">
              {result.message}
            </p>

            <div className="w-full space-y-2.5">
              <button
                id="modal-next-challenge-btn"
                onClick={handleNextChallenge}
                className="w-full py-4 rounded-[22px] font-black text-white bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-95 active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 cursor-pointer"
              >
                <span>NEXT CHALLENGE</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="modal-share-victory-btn"
                onClick={handleShareVictory}
                className="w-full py-3 bg-white/[0.08] hover:bg-white/[0.12] text-amber-300 font-bold rounded-[20px] border border-white/15 transition text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Share Victory to App</span>
              </button>

              <button
                onClick={handleClose}
                className="w-full py-3 bg-white/10 hover:bg-white/15 text-slate-300 font-bold rounded-[20px] border border-white/10 transition text-sm cursor-pointer"
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
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'memory' && (
              <MemoryGame
                difficulty={difficulty}
                playerLevel={playerLevel}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'reaction' && (
              <ReactionGame
                difficulty={difficulty}
                playerLevel={playerLevel}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'number' && (
              <NumberGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'draw' && (
              <DrawGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'twister' && (
              <TwisterGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'voice_riddle' && (
              <VoiceRiddleGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'edu_quiz' && (
              <EduQuizGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'emoji_riddle' && (
              <EmojiRiddleGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'simon' && (
              <SimonGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'pattern' && (
              <PatternGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'target' && (
              <TargetGame
                difficulty={difficulty}
                playerLevel={playerLevel}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'stroop' && (
              <StroopGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'scramble' && (
              <WordScrambleGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'pairs' && (
              <PairMatchGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'chimp' && (
              <ChimpGame
                difficulty={difficulty}
                playerLevel={playerLevel}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'speedtap' && (
              <SpeedTapGame
                difficulty={difficulty}
                playerLevel={playerLevel}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'rhythm' && (
              <RhythmGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'trivia' && (
              <TriviaGame
                difficulty={difficulty}
                challengeId={challenge.id}
                challengeTitle={challenge.title}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'truth' && (
              <TruthGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'compare' && (
              <CompareGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'cinema_quiz' && (
              <CinemaQuizGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'detective_riddle' && (
              <DetectiveRiddleGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'code_breaker' && (
              <CodeBreakerGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'math24' && (
              <Math24Game
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'flag_quiz' && (
              <FlagQuizGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'pitch_match' && (
              <PitchMatchGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}
            {challenge.type === 'anagram_blitz' && (
              <AnagramBlitzGame
                difficulty={difficulty}
                onSuccess={handleSuccess}
                onErrorToast={handleErrorToastWrapped}
                onPenalty={handlePenaltyWrapped}
                soundEnabled={soundEnabled}
              />
            )}

          </div>
        )}
      </div>

      {/* Share to Application Modal */}
      {result && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          data={{
            title: `Conquered ${challenge.title} on Challenge Me!`,
            text: `⚡ I just conquered "${challenge.title}" on ${difficulty} tier and earned +${result.score} points on Challenge Me!\n\nCategory: ${challenge.cat}\nThink you can beat my reaction time & mental agility?`,
            category: challenge.cat,
            score: result.score,
            challengeTitle: challenge.title,
          }}
          onToast={onToast}
          soundEnabled={soundEnabled}
        />
      )}
    </div>
  );
}
