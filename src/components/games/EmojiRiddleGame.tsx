import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCw,
  Loader2,
  ArrowRight,
  Flame,
  Lightbulb,
} from 'lucide-react';
import { Difficulty } from '../../types';
import { sound } from '../../utils/audio';
import { haptics } from '../../utils/haptics';
import { speechManager, evaluateSpeechWithAI, speakPrompt } from '../../utils/speech';
import { AudioWaveform } from '../AudioWaveform';

interface Props {
  difficulty: Difficulty;
  onSuccess: (score: number, message: string) => void;
  onErrorToast: (msg: string) => void;
  onPenalty?: (amount?: number, reason?: string) => void;
  soundEnabled: boolean;
}

interface EmojiPuzzle {
  id: string;
  category: string;
  emojis: string[];
  answer: string;
  options: string[];
  hint: string;
  funFact: string;
}

const EMOJI_PUZZLES: EmojiPuzzle[] = [
  {
    id: 'e_1',
    category: 'Famous Movie',
    emojis: ['🦁', '👑'],
    answer: 'The Lion King',
    options: ['The Lion King', 'Madagascar', 'Jungle Book', 'Safari King'],
    hint: 'Disney classic set in Pride Rock featuring Simba',
    funFact: 'The roar of the adult lion in the film was actually voiced by Frank Welker using a garbage can!',
  },
  {
    id: 'e_2',
    category: 'Epic Fantasy',
    emojis: ['🧙‍♂️', '💍', '🌋'],
    answer: 'Lord of the Rings',
    options: ['Lord of the Rings', 'Harry Potter', 'Aladdin', 'The Hobbit'],
    hint: 'A quest to cast a precious ring into Mount Doom',
    funFact: 'J.R.R. Tolkien invented entire languages before writing the novels!',
  },
  {
    id: 'e_3',
    category: 'Popular Phrase',
    emojis: ['🌧️', '🐱', '🐶'],
    answer: 'Raining Cats and Dogs',
    options: ['Raining Cats and Dogs', 'Pet Storm', 'Animal Shelter', 'Thunder Paws'],
    hint: 'An idiom meaning it is raining extremely hard',
    funFact: 'This idiom was first recorded in Jonathan Swift’s writings in 1738!',
  },
  {
    id: 'e_4',
    category: 'Superhero',
    emojis: ['🕷️', '🕸️', '🦸‍♂️'],
    answer: 'Spider-Man',
    options: ['Spider-Man', 'Ant-Man', 'Batman', 'The Avengers'],
    hint: 'Bitten by a radioactive arachnid, swings across NYC',
    funFact: 'Stan Lee got the idea after seeing a fly crawling on a wall in his office.',
  },
  {
    id: 'e_5',
    category: 'Space Exploration',
    emojis: ['🚀', '🌙', '👨‍🚀'],
    answer: 'Moon Landing',
    options: ['Moon Landing', 'Star Wars', 'Mars Rover', 'Interstellar'],
    hint: 'Apollo 11 mission: "One giant leap for mankind"',
    funFact: 'Astronauts on Apollo 11 left a gold olive branch on the lunar surface as a symbol of peace.',
  },
  {
    id: 'e_6',
    category: 'World Cuisine',
    emojis: ['🍕', '🍝', '🇮🇹'],
    answer: 'Italian Cuisine',
    options: ['Italian Cuisine', 'French Bakery', 'Mexican Fiesta', 'Greek Diner'],
    hint: 'Home of pizza napoletana, fresh pasta, and gelato',
    funFact: 'In Italy, there are over 350 official different geometric shapes of pasta!',
  },
  {
    id: 'e_7',
    category: 'Sci-Fi Legend',
    emojis: ['🦖', '🏝️', '🧬'],
    answer: 'Jurassic Park',
    options: ['Jurassic Park', 'King Kong', 'Godzilla', 'Avatar'],
    hint: 'Dinosaurs cloned from prehistoric amber DNA on an island',
    funFact: 'The T-Rex roar was created by combining sounds of a baby elephant, tiger, and alligator!',
  },
  {
    id: 'e_8',
    category: 'Everyday Activity',
    emojis: ['☕', '🥐', '☀️'],
    answer: 'Morning Breakfast',
    options: ['Morning Breakfast', 'Coffee Break', 'Midnight Snack', 'Afternoon Tea'],
    hint: 'Starting your day with a hot cup and fresh bakery treat',
    funFact: 'Coffee is the second most consumed beverage in the world after water!',
  },
];

export function EmojiRiddleGame({
  difficulty,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const [puzzles, setPuzzles] = useState<EmojiPuzzle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Voice recognition
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const transcriptRef = useRef('');

  const targetCount = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 4 : 5;

  useEffect(() => {
    const shuffled = [...EMOJI_PUZZLES].sort(() => Math.random() - 0.5).slice(0, targetCount);
    setPuzzles(shuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setStreak(0);
    setShowHint(false);
    setTranscript('');
    setAiFeedback(null);

    return () => {
      speechManager.stopListening();
    };
  }, [difficulty]);

  const currentP = puzzles[currentIndex] || EMOJI_PUZZLES[0];

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
    setAiFeedback(null);

    const node = await speechManager.startAudioAnalyser((vol) => {
      setMicVolume(vol);
    });
    setAnalyser(node);

    speechManager.startListening({
      continuous: true,
      interimResults: true,
      onStart: () => setIsListening(true),
      onResult: (text) => {
        setTranscript(text);
        transcriptRef.current = text;
      },
      onError: (err) => {
        onErrorToast(err);
        setIsListening(false);
      },
      onEnd: () => setIsListening(false),
    });
  };

  const handleStopMic = () => {
    speechManager.stopListening();
    setIsListening(false);
    sound.playClick(soundEnabled);
    haptics.medium();

    if (transcriptRef.current.trim().length > 1) {
      evaluateSpoken(transcriptRef.current);
    }
  };

  const evaluateSpoken = async (spoken: string) => {
    if (!currentP || isAnswered) return;
    setIsEvaluating(true);

    try {
      const clean = spoken.toLowerCase();
      let matched: string | null = null;

      currentP.options.forEach((opt) => {
        if (clean.includes(opt.toLowerCase())) {
          matched = opt;
        }
      });

      if (!matched && clean.includes(currentP.answer.toLowerCase())) {
        matched = currentP.answer;
      }

      if (matched) {
        handleSelectOption(matched);
        setAiFeedback(`🗣️ AI Recognized: "${matched}"`);
      } else {
        const res = await evaluateSpeechWithAI({
          challengeType: 'voice_riddle',
          question: `Emoji riddle: ${currentP.emojis.join(' ')}`,
          expectedAnswer: currentP.answer,
          spokenText: spoken,
          difficulty,
        });

        if (res.isCorrect) {
          handleSelectOption(currentP.answer);
          setAiFeedback(`🗣️ AI Verified: "${currentP.answer}"`);
        } else {
          setAiFeedback(`AI heard "${spoken}". Try tapping the option.`);
        }
      }
    } catch {
      onErrorToast('Could not evaluate speech. Tap an option.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSelectOption = (opt: string) => {
    if (isAnswered || !currentP) return;

    setSelectedOption(opt);
    setIsAnswered(true);

    const correct = opt === currentP.answer;
    setIsCorrect(correct);

    if (correct) {
      sound.playSuccess(soundEnabled);
      haptics.success();
      setCorrectCount((c) => c + 1);
      setStreak((s) => s + 1);
    } else {
      sound.playError(soundEnabled);
      haptics.error();
      setStreak(0);
      if (onPenalty) {
        onPenalty(difficulty === 'Easy' ? 2 : 4, 'Incorrect emoji riddle');
      }
    }
  };

  const handleNext = () => {
    sound.playClick(soundEnabled);
    haptics.selection();

    if (currentIndex + 1 < puzzles.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setShowHint(false);
      setTranscript('');
      setAiFeedback(null);
    } else {
      const total = puzzles.length;
      const basePts = difficulty === 'Easy' ? 35 : difficulty === 'Medium' ? 55 : 75;
      const finalScore = Math.round(basePts * (correctCount / total)) + (correctCount === total ? 20 : 0);

      onSuccess(
        finalScore,
        correctCount === total
          ? `🎉 Master Decipherer! (${correctCount}/${total} solved)`
          : `✨ Emoji Quest Finished! (${correctCount}/${total} solved)`
      );
    }
  };

  if (!currentP) return null;

  return (
    <div className="flex flex-col items-center text-center py-1 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between px-1 mb-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{currentP.category}</span>
        </div>

        <div className="flex items-center gap-2">
          {streak > 1 && (
            <span className="flex items-center gap-1 text-xs font-black text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full animate-bounce">
              <Flame className="w-3 h-3 fill-current" />
              <span>{streak}x Streak</span>
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-white">
            {currentIndex + 1} / {puzzles.length}
          </span>
        </div>
      </div>

      {/* Emoji Stage Display */}
      <div className="w-full bg-gradient-to-br from-purple-950/40 via-[#0d1326] to-[#070a14] border border-pink-500/25 rounded-[28px] p-6 mb-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center justify-center gap-3 sm:gap-4 py-2">
          {currentP.emojis.map((emoji, idx) => (
            <span
              key={idx}
              className="text-4xl sm:text-5xl drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)] hover:scale-110 transition-transform cursor-default"
            >
              {emoji}
            </span>
          ))}
        </div>

        <p className="text-xs text-slate-400 mt-2 font-medium">
          What phrase, movie, or concept do these emojis represent?
        </p>

        {/* Hint toggle */}
        {!isAnswered && (
          <button
            type="button"
            onClick={() => {
              haptics.selection();
              setShowHint((h) => !h);
            }}
            className="mt-2 text-[11px] text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 cursor-pointer bg-white/5 px-2.5 py-1 rounded-full border border-white/10"
          >
            <Lightbulb className="w-3 h-3" />
            <span>{showHint ? currentP.hint : 'Need a hint?'}</span>
          </button>
        )}
      </div>

      {/* Options Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
        {currentP.options.map((opt, idx) => {
          const isChosen = selectedOption === opt;
          const isTheCorrect = opt === currentP.answer;

          let btnStyle = 'bg-white/[0.04] border-white/10 text-slate-200 hover:bg-white/[0.08] hover:border-white/25';
          if (isAnswered) {
            if (isTheCorrect) {
              btnStyle = 'bg-emerald-600/30 border-emerald-400 text-emerald-100 ring-1 ring-emerald-400';
            } else if (isChosen) {
              btnStyle = 'bg-rose-600/30 border-rose-400 text-rose-100 ring-1 ring-rose-400';
            } else {
              btnStyle = 'opacity-40 bg-white/[0.02] border-white/5 text-slate-400';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => handleSelectOption(opt)}
              className={`w-full p-3.5 rounded-[20px] border font-display font-semibold text-xs sm:text-sm text-left flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-95 ${btnStyle}`}
            >
              <span>{opt}</span>
              {isAnswered && isTheCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              {isAnswered && isChosen && !isTheCorrect && <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Voice Assistant Mic */}
      {!isAnswered && (
        <div className="w-full bg-[#0a1020]/90 border border-pink-500/20 rounded-[24px] p-2.5 mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-300 pl-2">
            {isListening ? 'Say the title or phrase aloud...' : 'Or Speak Answer with Mic'}
          </span>

          <button
            type="button"
            onClick={handleToggleMic}
            className={`px-3 py-1 rounded-full font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer ${
              isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-pink-600 text-white'
            }`}
          >
            {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
            <span>{isListening ? 'Stop' : 'Voice Mic'}</span>
          </button>
        </div>
      )}

      {/* Post-Answer Explanation Card */}
      {isAnswered && (
        <div
          className={`w-full p-4 rounded-[22px] border text-left mb-3 animate-in fade-in ${
            isCorrect ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-black text-xs flex items-center gap-1.5">
              {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
              <span>{isCorrect ? 'Spot On!' : `Answer: ${currentP.answer}`}</span>
            </span>
            <span className="text-[10px] font-bold uppercase bg-black/40 px-2 py-0.5 rounded">Trivia</span>
          </div>
          <p className="text-xs text-white/90 leading-relaxed">{currentP.funFact}</p>
        </div>
      )}

      {/* Next Button */}
      {isAnswered && (
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-3.5 rounded-[22px] font-display font-black text-sm text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-95 active:scale-[0.98] transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{currentIndex + 1 < puzzles.length ? 'NEXT PUZZLE' : 'FINISH CHALLENGE 🏆'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
