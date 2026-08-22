import React, { useState, useEffect } from 'react';
import { Globe2, Check, X, Compass, Sparkles } from 'lucide-react';
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

interface FlagQuestion {
  flagEmoji: string;
  country: string;
  capital: string;
  continent: string;
  fact: string;
  options: string[];
}

const FLAGS_VAULT: FlagQuestion[] = [
  {
    flagEmoji: '🇯🇵',
    country: 'Japan',
    capital: 'Tokyo',
    continent: 'Asia',
    fact: 'Known as the Land of the Rising Sun with over 6,800 islands!',
    options: ['Japan', 'South Korea', 'China', 'Singapore'],
  },
  {
    flagEmoji: '🇧🇷',
    country: 'Brazil',
    capital: 'Brasília',
    continent: 'South America',
    fact: 'Home to the vast Amazon rainforest and the famous Christ the Redeemer!',
    options: ['Brazil', 'Argentina', 'Colombia', 'Peru'],
  },
  {
    flagEmoji: '🇨🇦',
    country: 'Canada',
    capital: 'Ottawa',
    continent: 'North America',
    fact: 'Has the longest coastline in the world stretching 202,080 km!',
    options: ['Canada', 'Norway', 'Finland', 'New Zealand'],
  },
  {
    flagEmoji: '🇪🇬',
    country: 'Egypt',
    capital: 'Cairo',
    continent: 'Africa',
    fact: 'Home to the Great Pyramids of Giza, the oldest of the Seven Ancient Wonders!',
    options: ['Egypt', 'Morocco', 'Greece', 'Jordan'],
  },
  {
    flagEmoji: '🇦🇺',
    country: 'Australia',
    capital: 'Canberra',
    continent: 'Oceania',
    fact: 'The only country in the world that is also an entire continent!',
    options: ['Australia', 'United Kingdom', 'New Zealand', 'Fiji'],
  },
  {
    flagEmoji: '🇮🇸',
    country: 'Iceland',
    capital: 'Reykjavik',
    continent: 'Europe',
    fact: 'Known as the Land of Fire and Ice due to its active volcanoes and massive glaciers!',
    options: ['Iceland', 'Sweden', 'Denmark', 'Norway'],
  },
  {
    flagEmoji: '🇲🇽',
    country: 'Mexico',
    capital: 'Mexico City',
    continent: 'North America',
    fact: 'Introduced chocolate, chili, and corn to the rest of the world!',
    options: ['Mexico', 'Spain', 'Chile', 'Guatemala'],
  },
];

export function FlagQuizGame({
  difficulty,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const [qIdx, setQIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);

  useEffect(() => {
    setQIdx(Math.floor(Math.random() * FLAGS_VAULT.length));
    setSelectedOpt(null);
  }, [difficulty]);

  const q = FLAGS_VAULT[qIdx];

  const handleSelect = (opt: string) => {
    if (selectedOpt) return;
    setSelectedOpt(opt);

    if (opt === q.country) {
      sound.playSuccess(soundEnabled);
      haptics.celebration();
      const score = difficulty === 'Easy' ? 40 : difficulty === 'Medium' ? 55 : 70;
      onSuccess(score, `Correct! ${q.flagEmoji} ${q.country} (Capital: ${q.capital}) • ${q.fact}`);
    } else {
      sound.playError(soundEnabled);
      haptics.error();
      if (onPenalty) onPenalty(15, `Incorrect flag guess. Correct was ${q.country}`);
      onErrorToast(`❌ That flag is ${q.country}! Capital is ${q.capital}.`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Flag Display Card */}
      <div className="rounded-[26px] bg-gradient-to-br from-cyan-950/50 via-[#0b1222] to-blue-950/40 border border-cyan-500/30 p-6 text-center shadow-xl relative overflow-hidden">
        <div className="text-7xl sm:text-8xl py-2 drop-shadow-xl animate-bounce">
          {q.flagEmoji}
        </div>

        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-[10px] uppercase border border-cyan-500/40">
            Continent: {q.continent}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-black text-[10px]">
            Capital: ???
          </span>
        </div>

        <h3 className="font-display font-black text-white text-sm sm:text-base mt-2.5">
          Which world nation flies this flag?
        </h3>
      </div>

      {/* Country Options Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {q.options.map((opt) => {
          const isSelected = selectedOpt === opt;
          const isCorrect = opt === q.country;

          let btnStyle = 'bg-white/[0.05] border-white/10 hover:bg-white/10 text-white';
          if (selectedOpt) {
            if (isCorrect) {
              btnStyle = 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-md';
            } else if (isSelected) {
              btnStyle = 'bg-rose-500/25 border-rose-400 text-rose-200';
            } else {
              btnStyle = 'opacity-40 bg-black/20 border-white/5';
            }
          }

          return (
            <button
              key={opt}
              type="button"
              disabled={!!selectedOpt}
              onClick={() => handleSelect(opt)}
              className={`p-3.5 rounded-[20px] border font-display font-black text-xs sm:text-sm text-center transition-all active:scale-95 cursor-pointer shadow-sm ${btnStyle}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
