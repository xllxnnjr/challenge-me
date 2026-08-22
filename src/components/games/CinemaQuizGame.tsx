import React, { useState, useEffect } from 'react';
import { Film, Mic, MicOff, Check, X, Sparkles, Volume2, Clapperboard } from 'lucide-react';
import { Difficulty } from '../../types';
import { sound } from '../../utils/audio';
import { haptics } from '../../utils/haptics';

interface Props {
  difficulty: Difficulty;
  onSuccess: (score: number, message: string) => void;
  onErrorToast: (msg: string) => void;
  onPenalty?: (amount?: number, reason?: string) => void;
  soundEnabled: boolean;
}

interface CinemaQuestion {
  movieTitle: string;
  year: string;
  quoteOrTrivia: string;
  category: 'Famous Quote' | 'Oscar Lore' | 'Sci-Fi Universe' | 'Iconic Director';
  correctAnswer: string;
  options: string[];
  emojiBanner: string;
}

const CINEMA_VAULT: CinemaQuestion[] = [
  {
    movieTitle: 'The Dark Knight',
    year: '2008',
    quoteOrTrivia: 'Which iconic villain famously uttered: "Why so serious?" while holding Gotham in chaos?',
    category: 'Famous Quote',
    correctAnswer: 'The Joker (Heath Ledger)',
    options: ['The Joker (Heath Ledger)', 'Bane', 'Two-Face', 'Scarecrow'],
    emojiBanner: '🃏 🦇 🏙️',
  },
  {
    movieTitle: 'Interstellar',
    year: '2014',
    quoteOrTrivia: 'Who composed the epic organ-heavy orchestral soundtrack for Christopher Nolan\'s Interstellar?',
    category: 'Famous Quote',
    correctAnswer: 'Hans Zimmer',
    options: ['Hans Zimmer', 'John Williams', 'Ennio Morricone', 'Ludwig Göransson'],
    emojiBanner: '🚀 🪐 ⏳ 🌌',
  },
  {
    movieTitle: 'Star Wars',
    year: '1980',
    quoteOrTrivia: 'Complete Darth Vader\'s iconic quote to Luke Skywalker: "No, I am your ______."',
    category: 'Famous Quote',
    correctAnswer: 'Father',
    options: ['Father', 'Master', 'Brother', 'Destiny'],
    emojiBanner: '⚔️ 🌌 👑 🤖',
  },
  {
    movieTitle: 'Titanic',
    year: '1997',
    quoteOrTrivia: 'How many Academy Awards (Oscars) did James Cameron\'s Titanic win, tying the all-time record?',
    category: 'Oscar Lore',
    correctAnswer: '11 Oscars',
    options: ['11 Oscars', '9 Oscars', '14 Oscars', '8 Oscars'],
    emojiBanner: '🚢 ❄️ 💎 🌊',
  },
  {
    movieTitle: 'Inception',
    year: '2010',
    quoteOrTrivia: 'What spinning object does Dom Cobb use as his totem to check if he is in a dream?',
    category: 'Sci-Fi Universe',
    correctAnswer: 'Spinning Top',
    options: ['Spinning Top', 'Loaded Die', 'Chess Pawn', 'Brass Ring'],
    emojiBanner: '🌀 🛌 🏙️ ⏱️',
  },
  {
    movieTitle: 'The Matrix',
    year: '1999',
    quoteOrTrivia: 'Which colored pill does Neo choose from Morpheus to see how deep the rabbit hole goes?',
    category: 'Sci-Fi Universe',
    correctAnswer: 'The Red Pill',
    options: ['The Red Pill', 'The Blue Pill', 'The Green Pill', 'The Gold Pill'],
    emojiBanner: '💊 🕶️ 💻 🐇',
  },
  {
    movieTitle: 'Pulp Fiction',
    year: '1994',
    quoteOrTrivia: 'Which legendary director wrote and directed Pulp Fiction, Reservoir Dogs, and Kill Bill?',
    category: 'Iconic Director',
    correctAnswer: 'Quentin Tarantino',
    options: ['Quentin Tarantino', 'Martin Scorsese', 'Steven Spielberg', 'David Fincher'],
    emojiBanner: '🔫 🍔 🕺 💼',
  },
];

export function CinemaQuizGame({
  difficulty,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [spokenText, setSpokenText] = useState('');

  useEffect(() => {
    setQuestionIdx(Math.floor(Math.random() * CINEMA_VAULT.length));
    setSelectedOpt(null);
    setSpokenText('');
  }, [difficulty]);

  const q = CINEMA_VAULT[questionIdx];

  const handleOptionClick = (opt: string) => {
    if (selectedOpt || isEvaluating) return;
    setSelectedOpt(opt);

    if (opt === q.correctAnswer) {
      sound.playSuccess(soundEnabled);
      haptics.celebration();
      const score = difficulty === 'Easy' ? 45 : difficulty === 'Medium' ? 60 : 75;
      onSuccess(score, `Spot on! "${opt}" from ${q.movieTitle} (${q.year})!`);
    } else {
      sound.playError(soundEnabled);
      haptics.error();
      if (onPenalty) onPenalty(15, `Wrong cinema answer. Correct: ${q.correctAnswer}`);
      onErrorToast(`❌ Cut! The correct answer was: ${q.correctAnswer}`);
    }
  };

  const handleVoiceAnswer = async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onErrorToast('Voice speech recognition is not supported on this browser. Tap an option below!');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsRecording(true);
      sound.playTap(soundEnabled);
      haptics.medium();

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpokenText(transcript);
        setIsRecording(false);
        setIsEvaluating(true);

        try {
          // Send to server evaluate-speech
          const res = await fetch('/api/evaluate-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              challengeType: 'cinema_quiz',
              spokenText: transcript,
              expectedAnswer: q.correctAnswer,
              question: q.quoteOrTrivia,
              difficulty,
            }),
          });

          const data = await res.json();
          setIsEvaluating(false);

          if (data.isCorrect) {
            sound.playSuccess(soundEnabled);
            haptics.celebration();
            const score = (difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 65 : 80) + (data.bonusPoints || 10);
            onSuccess(score, `🎬 AI Director Approved! "${transcript}" • ${data.feedback}`);
          } else {
            sound.playError(soundEnabled);
            haptics.error();
            if (onPenalty) onPenalty(15, `Spoken answer missed. Correct was ${q.correctAnswer}`);
            onErrorToast(`❌ ${data.feedback || `Recognized: "${transcript}". Expected: ${q.correctAnswer}`}`);
          }
        } catch {
          setIsEvaluating(false);
          // Fallback check
          if (transcript.toLowerCase().includes(q.correctAnswer.toLowerCase())) {
            sound.playSuccess(soundEnabled);
            onSuccess(55, `🎬 Recognized: "${transcript}"!`);
          } else {
            onErrorToast(`❌ Recognized: "${transcript}". Correct: ${q.correctAnswer}`);
          }
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
        onErrorToast('Mic timed out. Please tap your answer.');
      };

      recognition.start();
    } catch {
      setIsRecording(false);
      onErrorToast('Could not access microphone. Tap an option below.');
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Movie Banner Card (Netflix Poster Look) */}
      <div className="rounded-[24px] bg-gradient-to-br from-red-950/60 via-[#140b18] to-[#0a0f1d] border border-red-500/30 p-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
            <Clapperboard className="w-3 h-3 text-red-400" />
            <span>{q.category}</span>
          </span>

          <span className="text-xs font-black text-slate-400 font-mono">
            {q.movieTitle} ({q.year})
          </span>
        </div>

        <div className="text-center py-1 text-2xl tracking-widest mb-1.5">
          {q.emojiBanner}
        </div>

        <h3 className="font-display font-black text-white text-sm sm:text-base leading-snug text-center">
          {q.quoteOrTrivia}
        </h3>

        {spokenText && (
          <div className="mt-2 text-center text-xs text-amber-300 bg-black/40 py-1 px-2 rounded-xl">
            🎙️ You said: &ldquo;{spokenText}&rdquo;
          </div>
        )}
      </div>

      {/* Mic Voice Answer Option */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleVoiceAnswer}
          disabled={isRecording || isEvaluating}
          className={`px-4 py-2 rounded-full font-black text-xs flex items-center gap-2 border shadow-lg transition active:scale-95 cursor-pointer ${
            isRecording
              ? 'bg-red-500 text-white border-red-400 animate-pulse'
              : isEvaluating
              ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
              : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
          }`}
        >
          {isRecording ? <Mic className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4 text-red-400" />}
          <span>{isRecording ? 'Listening... Speak Answer!' : isEvaluating ? 'AI Evaluating...' : 'Answer with Voice Mic 🎙️'}</span>
        </button>
      </div>

      {/* Multiple Choice Options */}
      <div className="grid grid-cols-1 gap-2">
        {q.options.map((opt) => {
          const isSelected = selectedOpt === opt;
          const isCorrect = opt === q.correctAnswer;

          let btnStyle = 'bg-white/[0.05] border-white/10 hover:bg-white/10 text-white';
          if (selectedOpt) {
            if (isCorrect) {
              btnStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-md';
            } else if (isSelected) {
              btnStyle = 'bg-rose-500/20 border-rose-400 text-rose-200';
            } else {
              btnStyle = 'opacity-40 bg-black/20 border-white/5';
            }
          }

          return (
            <button
              key={opt}
              type="button"
              disabled={!!selectedOpt || isEvaluating}
              onClick={() => handleOptionClick(opt)}
              className={`p-3 rounded-[18px] border text-left font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-between cursor-pointer ${btnStyle}`}
            >
              <span>{opt}</span>
              {selectedOpt && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
              {selectedOpt && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
