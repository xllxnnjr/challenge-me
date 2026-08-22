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
  BookOpen,
  Globe,
  Cpu,
  Atom,
  Landmark,
  ArrowRight,
  Flame,
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
  topic?: 'tech' | 'science' | 'geography' | 'history' | 'language' | 'all';
}

interface EduQuestion {
  id: string;
  category: string;
  topic: 'tech' | 'science' | 'geography' | 'history' | 'language';
  icon: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  funFact: string;
  difficulty: Difficulty;
}

const EDU_QUESTIONS: EduQuestion[] = [
  // Tech & Computing
  {
    id: 'tech_1',
    category: 'Technology & AI',
    topic: 'tech',
    icon: '💻',
    question: 'What does "AI" stand for in modern computing?',
    options: ['Artificial Intelligence', 'Automated Interface', 'Algorithmic Integration', 'Advanced Internet'],
    correctIndex: 0,
    explanation: 'AI stands for Artificial Intelligence—the simulation of human intelligence by computer systems.',
    funFact: 'The term "Artificial Intelligence" was first coined at a Dartmouth workshop in 1956!',
    difficulty: 'Easy',
  },
  {
    id: 'tech_2',
    category: 'Technology & Computing',
    topic: 'tech',
    icon: '⚡',
    question: 'Which company originally created the TypeScript programming language?',
    options: ['Apple', 'Microsoft', 'Google', 'Mozilla'],
    correctIndex: 1,
    explanation: 'TypeScript was designed by Anders Hejlsberg at Microsoft and released in 2012.',
    funFact: 'TypeScript compiles directly into standard clean JavaScript that runs anywhere!',
    difficulty: 'Medium',
  },
  {
    id: 'tech_3',
    category: 'Computer Science',
    topic: 'tech',
    icon: '🧠',
    question: 'Who is widely recognized as the world’s first computer programmer?',
    options: ['Alan Turing', 'Ada Lovelace', 'Grace Hopper', 'Charles Babbage'],
    correctIndex: 1,
    explanation: 'Ada Lovelace published the first algorithm intended to be executed by Charles Babbage’s Mechanical Analytical Engine in 1843.',
    funFact: 'Lovelace called her approach "poetical science" combining mathematics and imagination.',
    difficulty: 'Hard',
  },

  // Science & Cosmos
  {
    id: 'sci_1',
    category: 'Science & Cosmos',
    topic: 'science',
    icon: '🪐',
    question: 'Which planet in our solar system is known as the "Red Planet"?',
    options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
    correctIndex: 1,
    explanation: 'Mars appears reddish because of widespread iron oxide (rust) on its surface.',
    funFact: 'Mars is home to Olympus Mons, the largest known volcano in the entire solar system (3x height of Everest)!',
    difficulty: 'Easy',
  },
  {
    id: 'sci_2',
    category: 'Biology & Physics',
    topic: 'science',
    icon: '🧬',
    question: 'What organelle is famously known as the "powerhouse of the cell"?',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus'],
    correctIndex: 1,
    explanation: 'Mitochondria generate most of the chemical energy needed to power cellular reactions via ATP.',
    funFact: 'Mitochondria have their own distinct circular DNA separate from the cell nucleus!',
    difficulty: 'Easy',
  },
  {
    id: 'sci_3',
    category: 'Chemistry & Cosmos',
    topic: 'science',
    icon: '⚛️',
    question: 'What is the most abundant chemical element in the observable universe?',
    options: ['Oxygen', 'Helium', 'Hydrogen', 'Carbon'],
    correctIndex: 2,
    explanation: 'Hydrogen constitutes roughly 75% of all baryonic elemental mass in the universe.',
    funFact: 'Stars like our Sun fuse about 600 million tons of hydrogen into helium every single second!',
    difficulty: 'Medium',
  },

  // Geography & World Wonders
  {
    id: 'geo_1',
    category: 'Geography & World',
    topic: 'geography',
    icon: '🗾',
    question: 'What is the capital city of Japan?',
    options: ['Kyoto', 'Osaka', 'Tokyo', 'Sapporo'],
    correctIndex: 2,
    explanation: 'Tokyo is the capital and most populous metropolitan area in Japan.',
    funFact: 'Tokyo was originally a small fishing village named Edo before becoming the imperial capital in 1868.',
    difficulty: 'Easy',
  },
  {
    id: 'geo_2',
    category: 'World Explorer',
    topic: 'geography',
    icon: '🏔️',
    question: 'Mount Everest is situated on the international border between Nepal and which region/country?',
    options: ['India', 'Bhutan', 'China (Tibet)', 'Pakistan'],
    correctIndex: 2,
    explanation: 'The summit ridge of Mount Everest marks the border between Nepal and the Tibet Autonomous Region of China.',
    funFact: 'Mount Everest grows approximately 4 millimeters taller every year due to tectonic plate shifts!',
    difficulty: 'Medium',
  },
  {
    id: 'geo_3',
    category: 'World Geography',
    topic: 'geography',
    icon: '🌊',
    question: 'Which country in the world possesses the largest number of natural lakes?',
    options: ['United States', 'Canada', 'Russia', 'Finland'],
    correctIndex: 1,
    explanation: 'Canada contains over 2 million lakes, holding more than 50% of the world’s natural lake surface area.',
    funFact: 'Canada’s lake area is so vast that about 9% of the entire country is covered in fresh water!',
    difficulty: 'Hard',
  },

  // History & Epochs
  {
    id: 'hist_1',
    category: 'World History',
    topic: 'history',
    icon: '🏛️',
    question: 'In which year did the historic Apollo 11 mission first land humans on the Moon?',
    options: ['1965', '1969', '1972', '1975'],
    correctIndex: 1,
    explanation: 'Astronauts Neil Armstrong and Buzz Aldrin landed the Apollo Lunar Module Eagle on the Moon on July 20, 1969.',
    funFact: 'The computer that guided Apollo 11 had only about 64 kilobytes of memory and ran at 0.043 MHz!',
    difficulty: 'Easy',
  },
  {
    id: 'hist_2',
    category: 'Arts & Renaissance',
    topic: 'history',
    icon: '🎨',
    question: 'Who painted the iconic masterpiece "The Mona Lisa" and designed early conceptual flying machines?',
    options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Vincent van Gogh'],
    correctIndex: 1,
    explanation: 'Leonardo da Vinci was a polymath of the High Renaissance active as a painter, draughtsman, engineer, and theorist.',
    funFact: 'Da Vinci wrote his personal notebooks in mirror script (from right to left) to avoid smudging his ink!',
    difficulty: 'Easy',
  },
  {
    id: 'hist_3',
    category: 'Ancient Wonders',
    topic: 'history',
    icon: '📜',
    question: 'The legendary Great Library was located in which ancient Mediterranean city?',
    options: ['Rome', 'Athens', 'Alexandria', 'Carthage'],
    correctIndex: 2,
    explanation: 'The Great Library of Alexandria in Egypt was one of the largest and most significant libraries of the ancient world.',
    funFact: 'At its peak, the Library of Alexandria was estimated to hold up to 400,000 papyrus scrolls!',
    difficulty: 'Medium',
  },

  // Language & Logic
  {
    id: 'lang_1',
    category: 'Language & Word Power',
    topic: 'language',
    icon: '📖',
    question: 'What is the linguistic term for a word or phrase that reads identically forwards and backwards (e.g. "racecar")?',
    options: ['Anagram', 'Palindrome', 'Homophone', 'Acronym'],
    correctIndex: 1,
    explanation: 'A palindrome is a word, number, phrase, or other sequence of characters that reads the same backward as forward.',
    funFact: 'The word "palindrome" comes from the Greek roots "palin" (again) and "dromos" (direction/running)!',
    difficulty: 'Easy',
  },
  {
    id: 'lang_2',
    category: 'Etymology & Origins',
    topic: 'language',
    icon: '🦁',
    question: 'The word "Safari" (meaning expedition or journey) originated from which language?',
    options: ['Swahili', 'Arabic', 'Hindi', 'Zulu'],
    correctIndex: 0,
    explanation: 'Safari is a Swahili word meaning "journey" (which itself borrowed from the Arabic "safar").',
    funFact: 'The word entered English in the late 19th century through travel journals and exploration accounts.',
    difficulty: 'Medium',
  },
];

export function EduQuizGame({
  difficulty,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
  topic = 'all',
}: Props) {
  const [questions, setQuestions] = useState<EduQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Microphone & Speech Evaluation State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiSpeechFeedback, setAiSpeechFeedback] = useState<string | null>(null);
  const [micVolume, setMicVolume] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const transcriptRef = useRef('');

  const targetQuestionCount = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 4 : 5;

  // Initialize randomized question pool
  useEffect(() => {
    let pool = EDU_QUESTIONS;
    if (topic && topic !== 'all') {
      pool = pool.filter((q) => q.topic === topic);
    }
    // Filter matching difficulty or fallback
    const matched = pool.filter((q) => q.difficulty === difficulty);
    const candidatePool = matched.length >= targetQuestionCount ? matched : pool;

    // Shuffle
    const shuffled = [...candidatePool].sort(() => Math.random() - 0.5).slice(0, targetQuestionCount);
    setQuestions(shuffled.length > 0 ? shuffled : EDU_QUESTIONS.slice(0, targetQuestionCount));
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setStreak(0);
    setTranscript('');
    setAiSpeechFeedback(null);

    return () => {
      speechManager.stopListening();
    };
  }, [difficulty, topic]);

  const currentQ = questions[currentIndex] || EDU_QUESTIONS[0];

  // Read question aloud via Web Speech
  const handleReadAloud = () => {
    if (!currentQ) return;
    haptics.light();
    sound.playClick(soundEnabled);
    setIsSpeaking(true);
    const speechText = `${currentQ.question}. Option A: ${currentQ.options[0]}. Option B: ${currentQ.options[1]}. Option C: ${currentQ.options[2]}. Option D: ${currentQ.options[3]}.`;
    speakPrompt(speechText, () => {
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
    setAiSpeechFeedback(null);
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
      evaluateSpokenAnswer(transcriptRef.current);
    }
  };

  // Evaluate speech with Gemini AI or pattern recognition
  const evaluateSpokenAnswer = async (spokenText: string) => {
    if (!currentQ || isAnswered) return;
    setIsEvaluating(true);

    try {
      const correctText = currentQ.options[currentQ.correctIndex];
      const res = await evaluateSpeechWithAI({
        challengeType: 'edu_quiz',
        question: currentQ.question,
        expectedAnswer: correctText,
        spokenText,
        difficulty,
      });

      // Check if user named an option or letter (A, B, C, D or exact words)
      const clean = spokenText.toLowerCase();
      let matchedIndex: number | null = null;

      if (clean.includes('option a') || clean.startsWith('a ') || clean === 'a') matchedIndex = 0;
      else if (clean.includes('option b') || clean.startsWith('b ') || clean === 'b') matchedIndex = 1;
      else if (clean.includes('option c') || clean.startsWith('c ') || clean === 'c') matchedIndex = 2;
      else if (clean.includes('option d') || clean.startsWith('d ') || clean === 'd') matchedIndex = 3;

      if (matchedIndex === null) {
        // Match by words in options
        currentQ.options.forEach((opt, idx) => {
          if (clean.includes(opt.toLowerCase())) {
            matchedIndex = idx;
          }
        });
      }

      if (matchedIndex !== null) {
        handleSelectOption(matchedIndex);
        setAiSpeechFeedback(`🗣️ AI Recognized: "${currentQ.options[matchedIndex]}"`);
      } else if (res.isCorrect) {
        handleSelectOption(currentQ.correctIndex);
        setAiSpeechFeedback(`🗣️ AI Verified Correct Answer: "${correctText}"`);
      } else {
        setAiSpeechFeedback(`AI heard "${spokenText}". Please tap your answer or speak clearly.`);
      }
    } catch (e) {
      onErrorToast('AI speech recognition could not parse choice. You can tap to choose.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Handle Option Selection
  const handleSelectOption = (idx: number) => {
    if (isAnswered || !currentQ) return;

    setSelectedOption(idx);
    setIsAnswered(true);

    const correct = idx === currentQ.correctIndex;
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
        onPenalty(difficulty === 'Easy' ? 2 : 4, 'Incorrect quiz answer');
      }
    }
  };

  // Proceed to next question or complete challenge
  const handleNext = () => {
    sound.playClick(soundEnabled);
    haptics.selection();

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setTranscript('');
      setAiSpeechFeedback(null);
    } else {
      // Completed all questions!
      const totalQuestions = questions.length;
      const basePts = difficulty === 'Easy' ? 35 : difficulty === 'Medium' ? 55 : 80;
      const accuracyMultiplier = correctCount / totalQuestions;
      const finalScore = Math.round(basePts * accuracyMultiplier) + (correctCount === totalQuestions ? 20 : 0);

      const winMessage =
        correctCount === totalQuestions
          ? `🎓 Perfect Knowledge Mastery! (${correctCount}/${totalQuestions} correct)`
          : `📚 Educational Sprint Finished! (${correctCount}/${totalQuestions} correct)`;

      onSuccess(finalScore, winMessage);
    }
  };

  if (!currentQ) return null;

  return (
    <div className="flex flex-col items-center text-center py-1 select-none">
      {/* Header Info & Progress */}
      <div className="w-full flex items-center justify-between px-1 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold shadow-sm">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentQ.category}</span>
        </div>

        <div className="flex items-center gap-2">
          {streak > 1 && (
            <span className="flex items-center gap-1 text-xs font-black text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full animate-bounce">
              <Flame className="w-3 h-3 fill-current" />
              <span>{streak}x Streak</span>
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-white">
            Q {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 transition-all duration-300"
          style={{ width: `${((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card Box */}
      <div className="w-full bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-black/40 border border-white/15 rounded-[26px] p-5 mb-3 shadow-xl relative overflow-hidden backdrop-blur-md text-left">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <span>{currentQ.icon}</span>
            <span>Educational Quiz</span>
          </span>
          <button
            type="button"
            onClick={handleReadAloud}
            title="Read Question Aloud"
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition active:scale-90 cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-amber-400 animate-bounce' : ''}`} />
            <span>Read</span>
          </button>
        </div>

        <h3 className="text-base sm:text-lg font-bold font-display text-white leading-snug my-1">
          {currentQ.question}
        </h3>
      </div>

      {/* Interactive Options Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
        {currentQ.options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isChosen = selectedOption === idx;
          const isTheCorrectOne = currentQ.correctIndex === idx;

          let btnStyle = 'bg-white/[0.04] border-white/10 text-slate-200 hover:bg-white/[0.08] hover:border-white/25';
          if (isAnswered) {
            if (isTheCorrectOne) {
              btnStyle = 'bg-emerald-600/30 border-emerald-400 text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400';
            } else if (isChosen) {
              btnStyle = 'bg-rose-600/30 border-rose-400 text-rose-100 ring-1 ring-rose-400';
            } else {
              btnStyle = 'opacity-40 bg-white/[0.02] border-white/5 text-slate-400';
            }
          }

          return (
            <button
              key={idx}
              id={`quiz-opt-${idx}`}
              type="button"
              disabled={isAnswered}
              onClick={() => handleSelectOption(idx)}
              className={`w-full p-3.5 rounded-[20px] border font-display font-semibold text-xs sm:text-sm text-left flex items-center gap-3 transition-all duration-200 cursor-pointer active:scale-95 ${btnStyle}`}
            >
              <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                isAnswered && isTheCorrectOne
                  ? 'bg-emerald-500 text-black'
                  : isAnswered && isChosen
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/10 text-amber-300'
              }`}>
                {letter}
              </span>
              <span className="flex-1 leading-snug">{opt}</span>
              {isAnswered && isTheCorrectOne && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              {isAnswered && isChosen && !isTheCorrectOne && <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Live Voice Answer Console */}
      {!isAnswered && (
        <div className="w-full bg-[#0a1020]/90 border border-pink-500/20 rounded-[24px] p-3 mb-3 flex flex-col items-center gap-2 relative shadow-lg">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2 text-left">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isListening ? 'bg-rose-500 animate-ping' : 'bg-slate-600'
                }`}
              />
              <span className="text-[11px] font-bold text-slate-300">
                {isListening ? 'Speak answer or letter (A, B, C, D)...' : 'Or Speak Answer with Mic'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleMic}
              className={`px-3 py-1 rounded-full font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-gradient-to-r from-pink-500 to-rose-600 text-white'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3 h-3" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3" />
                  <span>Voice Mic</span>
                </>
              )}
            </button>
          </div>

          {/* Waveform */}
          {isListening && (
            <div className="w-full py-0.5">
              <AudioWaveform isListening={isListening} volume={micVolume} analyser={analyser} className="w-full" />
            </div>
          )}

          {transcript && (
            <p className="text-xs text-amber-300 italic">
              Hearing: &ldquo;{transcript}&rdquo;
            </p>
          )}

          {isEvaluating && (
            <div className="flex items-center gap-1.5 text-xs text-amber-300 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>AI Verifying speech...</span>
            </div>
          )}
        </div>
      )}

      {/* Answer Explanation & Fun Fact Banner */}
      {isAnswered && (
        <div
          className={`w-full p-4 rounded-[22px] border text-left mb-3.5 transition-all animate-in fade-in zoom-in-95 ${
            isCorrect
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-black text-xs flex items-center gap-1.5">
              {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
              <span>{isCorrect ? 'Brilliant Answer!' : 'Incorrect'}</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded">
              Explanation
            </span>
          </div>

          <p className="text-xs text-white/90 leading-relaxed mb-2">
            {currentQ.explanation}
          </p>

          <div className="pt-2 border-t border-white/10 flex items-start gap-2 text-[11px] text-amber-200/90 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <span><strong>Did you know?</strong> {currentQ.funFact}</span>
          </div>
        </div>
      )}

      {/* Action Next / Complete Button */}
      {isAnswered && (
        <button
          id="quiz-next-btn"
          type="button"
          onClick={handleNext}
          className="w-full py-3.5 rounded-[22px] font-display font-black text-sm tracking-wide text-white bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:opacity-95 active:scale-[0.98] transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{currentIndex + 1 < questions.length ? 'NEXT QUESTION' : 'COMPLETE SPRINT 🏆'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
