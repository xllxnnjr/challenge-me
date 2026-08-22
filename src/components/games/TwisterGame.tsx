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
  Zap,
} from 'lucide-react';
import { Difficulty } from '../../types';
import { sound } from '../../utils/audio';
import { haptics } from '../../utils/haptics';
import {
  speechManager,
  evaluateSpeechWithAI,
  speakPrompt,
  isSpeechRecognitionSupported,
  SpeechEvaluationResult,
} from '../../utils/speech';
import { AudioWaveform } from '../AudioWaveform';

interface Props {
  difficulty: Difficulty;
  onSuccess: (score: number, message: string) => void;
  onErrorToast: (msg: string) => void;
  soundEnabled: boolean;
}

const TWISTERS: { text: string; diff: Difficulty }[] = [
  // Easy
  { text: 'Red lorry, yellow lorry, red lorry, yellow lorry.', diff: 'Easy' },
  { text: 'She sells seashells by the seashore.', diff: 'Easy' },
  { text: 'Fresh fried fish, fish fresh fried.', diff: 'Easy' },
  // Medium
  { text: 'Peter Piper picked a peck of pickled peppers.', diff: 'Medium' },
  { text: 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?', diff: 'Medium' },
  { text: 'Six slippery snails slid slowly seaward.', diff: 'Medium' },
  // Hard
  { text: 'Unique New York, unique New York, you know you need unique New York.', diff: 'Hard' },
  { text: 'Pad kid pour curd pulled cod, pad kid pour curd pulled cod.', diff: 'Hard' },
  { text: 'Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair. Fuzzy Wuzzy wasn’t fuzzy, was he?', diff: 'Hard' },
];

export function TwisterGame({ difficulty, onSuccess, onErrorToast, soundEnabled }: Props) {
  const [twister, setTwister] = useState(TWISTERS[0]);
  const [reps, setReps] = useState(0);
  const targetReps = difficulty === 'Easy' ? 2 : difficulty === 'Medium' ? 3 : 4;

  // Microphone & AI Speech State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiResult, setAiResult] = useState<SpeechEvaluationResult | null>(null);
  const [micVolume, setMicVolume] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const transcriptRef = useRef('');

  useEffect(() => {
    const matching = TWISTERS.filter((t) => t.diff === difficulty);
    const pool = matching.length > 0 ? matching : TWISTERS;
    const random = pool[Math.floor(Math.random() * pool.length)];
    setTwister(random);
    setReps(0);
    setTranscript('');
    setAiResult(null);
    setMicError(null);

    return () => {
      speechManager.stopListening();
    };
  }, [difficulty]);

  const handleNextTwister = () => {
    sound.playClick(soundEnabled);
    haptics.selection();
    if (isListening) {
      handleStopMic();
    }
    const matching = TWISTERS.filter((t) => t.diff === difficulty && t.text !== twister.text);
    const pool = matching.length > 0 ? matching : TWISTERS;
    setTwister(pool[Math.floor(Math.random() * pool.length)]);
    setReps(0);
    setTranscript('');
    setAiResult(null);
  };

  const handleListenTwister = () => {
    haptics.light();
    sound.playClick(soundEnabled);
    setIsSpeaking(true);
    speakPrompt(twister.text, () => {
      setIsSpeaking(false);
    });
  };

  // Toggle Microphone
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
      onResult: (text, isFinal) => {
        setTranscript(text);
        transcriptRef.current = text;
      },
      onError: (err) => {
        console.warn('Mic speech error:', err);
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

    // If we captured speech, automatically prompt AI Evaluation
    if (transcriptRef.current.trim().length > 3) {
      evaluateCurrentSpeech(transcriptRef.current);
    }
  };

  // Run AI Speech Synthesis & Evaluation using Gemini backend
  const evaluateCurrentSpeech = async (spokenText: string) => {
    setIsEvaluating(true);
    haptics.selection();

    try {
      const res = await evaluateSpeechWithAI({
        challengeType: 'twister',
        targetText: twister.text,
        spokenText,
        targetReps,
        difficulty,
      });

      setAiResult(res);

      if (res.isCorrect) {
        sound.playSuccess(soundEnabled);
        haptics.success();
        const basePts = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 45 : 65;
        const totalPts = basePts + (res.bonusPoints || 0);

        setTimeout(() => {
          onSuccess(
            totalPts,
            `🗣️ AI Verified (${res.accuracyScore}% accuracy): ${res.feedback}`
          );
        }, 1200);
      } else {
        sound.playError(soundEnabled);
        haptics.error();
        onErrorToast(
          res.feedback ||
            `Accuracy: ${res.accuracyScore}%. Try reciting more clearly into the mic!`
        );
      }
    } catch (err: any) {
      onErrorToast('AI speech verification failed. You can retry or tap manual recitation.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleManualRep = () => {
    sound.playPop(soundEnabled);
    haptics.selection();
    setReps((r) => r + 1);
  };

  const handleManualComplete = () => {
    const basePts = difficulty === 'Easy' ? 25 : difficulty === 'Medium' ? 35 : 55;
    sound.playSuccess(soundEnabled);
    haptics.success();
    onSuccess(basePts, `🗣️ Vocal dexterity champion (${difficulty})!`);
  };

  return (
    <div className="flex flex-col items-center text-center py-1 select-none">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between px-1 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-950/70 border border-pink-700/50 text-pink-200 text-xs font-bold shadow-sm">
          <Mic className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span>Microphone AI Voice Coach</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-amber-300">
          Tier: {difficulty}
        </span>
      </div>

      {/* Twister Card Box */}
      <div className="w-full bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-black/40 border border-white/15 rounded-[26px] p-5 mb-3.5 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-pink-300/80">
            Recite {targetReps}× clearly
          </span>
          <button
            type="button"
            onClick={handleListenTwister}
            title="Listen to phrase pronunciation"
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition active:scale-90 cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-amber-400 animate-bounce' : ''}`} />
            <span>Listen</span>
          </button>
        </div>

        <p className="text-lg sm:text-xl font-black font-display text-white leading-relaxed my-2 px-1">
          &ldquo;{twister.text}&rdquo;
        </p>

        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleNextTwister}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" /> Another Twister
          </button>
        </div>
      </div>

      {/* Apple-Style Live Microphone Audio Console */}
      <div className="w-full bg-[#0a1020]/90 border border-pink-500/20 rounded-[26px] p-4 mb-3.5 flex flex-col items-center gap-3 relative shadow-lg">
        {/* Glow halo when active */}
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
                ? 'Listening to your voice...'
                : isEvaluating
                ? 'AI Synthesizing & Verifying...'
                : 'Tap Mic to Speak & Recite'}
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
                <span>Stop & Evaluate</span>
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
              Live Speech Input:
            </span>
            <p className="text-sm font-semibold text-white italic min-h-[1.5rem]">
              {transcript || <span className="text-slate-500">Speaking now...</span>}
            </p>
          </div>
        )}

        {/* AI Evaluation Result Banner */}
        {isEvaluating && (
          <div className="w-full p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center gap-2 text-amber-300 text-xs font-bold animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>Gemini AI is analyzing pronunciation & repetition cadence...</span>
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
                <span>
                  {aiResult.isCorrect ? 'Speech Verified!' : 'Needs More Clarity'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-black/40 text-[11px] font-bold">
                Accuracy: {aiResult.accuracyScore}%
              </span>
            </div>
            <p className="text-xs opacity-90">{aiResult.feedback}</p>
            {aiResult.bonusPoints ? (
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> +{aiResult.bonusPoints} AI Precision Bonus
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

      {/* Manual Tap Fallback Console */}
      <div className="w-full bg-[#0a1020]/60 border border-white/10 rounded-[22px] p-3.5 mb-3 flex items-center justify-between">
        <div className="text-left">
          <p className="text-[11px] text-[#9ca7bd]">Manual count fallback:</p>
          <div className="text-base font-black text-amber-300">
            {reps} of {targetReps} recited
          </div>
        </div>
        <button
          type="button"
          onClick={handleManualRep}
          className="px-3.5 py-1.5 bg-[#1f2b48] hover:bg-amber-900/40 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Tap Rep
        </button>
      </div>

      {/* Manual Confirmation Action */}
      <button
        id="twister-done-btn"
        type="button"
        onClick={handleManualComplete}
        disabled={reps < targetReps}
        className="w-full py-3.5 rounded-[22px] font-display font-black text-sm tracking-wide text-white bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:opacity-95 active:scale-[0.98] transition disabled:opacity-30 shadow-lg shadow-pink-950/40 cursor-pointer"
      >
        I SAID IT {targetReps}× CLEANLY 🚀
      </button>
    </div>
  );
}
