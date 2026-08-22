import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  RotateCw,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { Difficulty } from '../../types';
import { sound } from '../../utils/audio';
import { haptics } from '../../utils/haptics';
import {
  speechManager,
  evaluateSpeechWithAI,
  speakPrompt,
  SpeechEvaluationResult,
} from '../../utils/speech';
import { AudioWaveform } from '../AudioWaveform';

interface Props {
  difficulty: Difficulty;
  onSuccess: (score: number, message: string) => void;
  onErrorToast: (msg: string) => void;
  onPenalty?: (amount?: number, reason?: string) => void;
  soundEnabled: boolean;
}

interface VoiceRiddle {
  q: string;
  expectedAnswer: string;
  hint: string;
  diff: Difficulty;
}

const VOICE_RIDDLES: VoiceRiddle[] = [
  // Easy
  {
    q: 'What has to be broken before you can use it?',
    expectedAnswer: 'An egg',
    hint: 'Think breakfast item in a shell!',
    diff: 'Easy',
  },
  {
    q: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
    expectedAnswer: 'An echo',
    hint: 'Sounds bouncing back in a cave or canyon!',
    diff: 'Easy',
  },
  {
    q: 'What gets wet while drying?',
    expectedAnswer: 'A towel',
    hint: 'You use it after a bath or shower!',
    diff: 'Easy',
  },
  // Medium
  {
    q: 'The more of this there is, the less you see. What is it?',
    expectedAnswer: 'Darkness',
    hint: 'Opposite of bright light!',
    diff: 'Medium',
  },
  {
    q: 'What has a head and a tail that will never meet, but has no body?',
    expectedAnswer: 'A coin',
    hint: 'Used for currency or flipping decisions!',
    diff: 'Medium',
  },
  {
    q: 'What can travel around the world while staying in a corner?',
    expectedAnswer: 'A postage stamp',
    hint: 'Stuck on the top right of an envelope!',
    diff: 'Medium',
  },
  // Hard
  {
    q: 'I am not alive, but I grow; I don’t have lungs, but I need air; I don’t have a mouth, but water kills me. What am I?',
    expectedAnswer: 'Fire',
    hint: 'Produces smoke and warmth!',
    diff: 'Hard',
  },
  {
    q: 'What comes once in a minute, twice in a moment, but never in a thousand years?',
    expectedAnswer: 'The letter M',
    hint: 'Look closely at the spelling of the words!',
    diff: 'Hard',
  },
  {
    q: 'I have keys but no locks. I have space but no room. You can enter, but you cannot go outside. What am I?',
    expectedAnswer: 'A keyboard',
    hint: 'You use it to type words!',
    diff: 'Hard',
  },
];

export function VoiceRiddleGame({
  difficulty,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const [riddle, setRiddle] = useState<VoiceRiddle>(VOICE_RIDDLES[0]);
  const [showHint, setShowHint] = useState(false);

  // Microphone & AI Speech State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiResult, setAiResult] = useState<SpeechEvaluationResult | null>(null);
  const [micVolume, setMicVolume] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);

  const transcriptRef = useRef('');

  useEffect(() => {
    const matching = VOICE_RIDDLES.filter((r) => r.diff === difficulty);
    const pool = matching.length > 0 ? matching : VOICE_RIDDLES;
    const random = pool[Math.floor(Math.random() * pool.length)];
    setRiddle(random);
    setShowHint(false);
    setTranscript('');
    setAiResult(null);
    setMicError(null);

    return () => {
      speechManager.stopListening();
    };
  }, [difficulty]);

  const handleNextRiddle = () => {
    sound.playClick(soundEnabled);
    haptics.selection();
    if (isListening) {
      handleStopMic();
    }
    const matching = VOICE_RIDDLES.filter((r) => r.diff === difficulty && r.q !== riddle.q);
    const pool = matching.length > 0 ? matching : VOICE_RIDDLES;
    setRiddle(pool[Math.floor(Math.random() * pool.length)]);
    setShowHint(false);
    setTranscript('');
    setAiResult(null);
  };

  const handleListenQuestion = () => {
    haptics.light();
    sound.playClick(soundEnabled);
    setIsSpeakingPrompt(true);
    speakPrompt(riddle.q, () => {
      setIsSpeakingPrompt(false);
    });
  };

  const handleToggleMic = async () => {
    if (isListening) {
      handleStopMic();
    } else {
      handleStartMic();
    }
  };

  const handleStartMic = async () => {
    sound.playPop(soundEnabled);
    haptics.selection();
    setTranscript('');
    transcriptRef.current = '';
    setAiResult(null);
    setMicError(null);

    const node = await speechManager.startAudioAnalyser((vol) => {
      setMicVolume(vol);
    });
    setAnalyser(node);

    speechManager.startListening({
      continuous: true,
      interimResults: true,
      onStart: () => {
        setIsListening(true);
      },
      onResult: (text) => {
        setTranscript(text);
        transcriptRef.current = text;
      },
      onError: (err) => {
        setMicError(err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  const handleStopMic = () => {
    speechManager.stopListening();
    setIsListening(false);
    sound.playClick(soundEnabled);
    haptics.medium();

    if (transcriptRef.current.trim().length > 1) {
      evaluateCurrentAnswer(transcriptRef.current);
    }
  };

  const evaluateCurrentAnswer = async (spokenText: string) => {
    setIsEvaluating(true);
    haptics.selection();

    try {
      const res = await evaluateSpeechWithAI({
        challengeType: 'voice_riddle',
        question: riddle.q,
        expectedAnswer: riddle.expectedAnswer,
        spokenText,
        difficulty,
      });

      setAiResult(res);

      if (res.isCorrect) {
        sound.playSuccess(soundEnabled);
        haptics.success();
        const basePts = difficulty === 'Easy' ? 35 : difficulty === 'Medium' ? 50 : 70;
        const totalPts = basePts + (res.bonusPoints || 0);

        setTimeout(() => {
          onSuccess(
            totalPts,
            `💡 AI Verified Answer ("${riddle.expectedAnswer}"): ${res.feedback}`
          );
        }, 1200);
      } else {
        sound.playError(soundEnabled);
        haptics.error();
        if (onPenalty) {
          onPenalty(difficulty === 'Easy' ? 3 : 5, 'Incorrect vocal answer');
        }
        onErrorToast(
          res.feedback || `Not quite! You said "${spokenText}". Try giving another spoken answer!`
        );
      }
    } catch (err: any) {
      onErrorToast('AI speech verification failed. Please try speaking again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-1 select-none">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between px-1 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-950/70 border border-pink-700/50 text-pink-200 text-xs font-bold shadow-sm">
          <Mic className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span>Speak Answer to AI Judge</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-amber-300">
          Tier: {difficulty}
        </span>
      </div>

      {/* Riddle Question Card */}
      <div className="w-full bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-black/40 border border-white/15 rounded-[26px] p-5 mb-3.5 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-pink-300/80">
            Voice Riddle Challenge
          </span>
          <button
            type="button"
            onClick={handleListenQuestion}
            title="Read riddle question aloud"
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition active:scale-90 cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isSpeakingPrompt ? 'text-amber-400 animate-bounce' : ''}`} />
            <span>Read Out</span>
          </button>
        </div>

        <p className="text-base sm:text-lg font-bold font-display text-white leading-relaxed my-2 px-1 text-left sm:text-center">
          &ldquo;{riddle.q}&rdquo;
        </p>

        {showHint ? (
          <div className="mt-2 p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs font-medium">
            💡 Hint: {riddle.hint}
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                haptics.light();
                setShowHint(true);
              }}
              className="text-xs text-amber-400/90 hover:text-amber-300 underline underline-offset-2 cursor-pointer font-semibold"
            >
              Need a hint?
            </button>
          </div>
        )}

        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleNextRiddle}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" /> Another Riddle
          </button>
        </div>
      </div>

      {/* Voice Input Console */}
      <div className="w-full bg-[#0a1020]/90 border border-pink-500/20 rounded-[26px] p-4 mb-3 flex flex-col items-center gap-3 relative shadow-lg">
        {isListening && (
          <div className="absolute inset-0 rounded-[26px] bg-pink-500/10 animate-pulse pointer-events-none" />
        )}

        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-left">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isListening ? 'bg-rose-500 animate-ping' : 'bg-slate-600'
              }`}
            />
            <span className="text-xs font-bold text-slate-300">
              {isListening
                ? 'Speak your answer now...'
                : isEvaluating
                ? 'AI Synthesizing & Verifying...'
                : 'Tap Mic to Speak Answer'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleMic}
            className={`px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] animate-pulse'
                : 'bg-gradient-to-r from-pink-500 to-rose-600 hover:brightness-110 text-white shadow-md'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>Stop & Check</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Start Mic</span>
              </>
            )}
          </button>
        </div>

        {/* Live Audio Visualizer Waveform */}
        <div className="w-full py-1">
          <AudioWaveform
            isListening={isListening}
            volume={micVolume}
            analyser={analyser}
            className="w-full"
          />
        </div>

        {/* Live Speech Recognition Transcript Box */}
        {(transcript || isListening) && (
          <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Your Spoken Answer:
            </span>
            <p className="text-sm font-semibold text-white italic min-h-[1.5rem]">
              {transcript || <span className="text-slate-500">Listening to voice...</span>}
            </p>
          </div>
        )}

        {/* AI Evaluation Result Banner */}
        {isEvaluating && (
          <div className="w-full p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center gap-2 text-amber-300 text-xs font-bold animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>Gemini AI is analyzing your vocal answer...</span>
          </div>
        )}

        {aiResult && !isEvaluating && (
          <div
            className={`w-full p-3.5 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${
              aiResult.isCorrect
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-xs">
                {aiResult.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>{aiResult.isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-black/40 text-[11px] font-bold">
                Accuracy: {aiResult.accuracyScore}%
              </span>
            </div>
            <p className="text-xs opacity-90">{aiResult.feedback}</p>
            {aiResult.bonusPoints ? (
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> +{aiResult.bonusPoints} AI Voice Bonus
              </span>
            ) : null}
          </div>
        )}

        {micError && (
          <p className="text-xs text-amber-400/90 bg-amber-950/30 px-3 py-1.5 rounded-xl border border-amber-800/40">
            {micError}
          </p>
        )}
      </div>

      <p className="text-xs text-[#8e9ab2]">
        Say your answer aloud into your microphone. The AI will synthesize and verify your answer in real-time!
      </p>
    </div>
  );
}
