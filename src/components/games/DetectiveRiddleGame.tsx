import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, CheckCircle2, XCircle, Lightbulb, Clock } from 'lucide-react';
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

interface Mystery {
  caseTitle: string;
  story: string;
  clue: string;
  suspects: { name: string; statement: string; isGuilty: boolean; explanation: string }[];
}

const MYSTERIES: Mystery[] = [
  {
    caseTitle: 'The Rainy Day Heist',
    story: 'A priceless sapphire was stolen from the gallery on a stormy afternoon during heavy rainfall.',
    clue: 'Look closely at the suspects’ clothes and actions during the rain.',
    suspects: [
      {
        name: 'Chef Marcus',
        statement: 'I was baking sourdough bread in the basement oven all afternoon.',
        isGuilty: false,
        explanation: 'Basement kitchen was dry and verified by the sous chef.',
      },
      {
        name: 'Gardener Thomas',
        statement: 'I spent 2 hours outside planting delicate paper roses in the soil during the downpour.',
        isGuilty: true,
        explanation: 'Paper roses would dissolve and ruin instantly in pouring rain! His alibi is fabricated.',
      },
      {
        name: 'Curator Eleanor',
        statement: 'I was in the dry library archiving catalog records on the top floor.',
        isGuilty: false,
        explanation: 'Eleanor was visible on internal dry hallway cameras.',
      },
    ],
  },
  {
    caseTitle: 'The Winter Cabin Locked Room',
    story: 'A rare watch vanished from a snowbound alpine cabin at midnight during sub-zero temperatures.',
    clue: 'Think about thermal physical changes in water and ice.',
    suspects: [
      {
        name: 'Skier Julian',
        statement: 'I was sitting by the roaring stone fireplace drinking hot cocoa.',
        isGuilty: false,
        explanation: 'Julian had cocoa stains and was warming his hands.',
      },
      {
        name: 'Photographer Sarah',
        statement: 'I washed my car in the outdoor driveway with warm water at midnight without ice forming.',
        isGuilty: true,
        explanation: 'Water in sub-zero alpine midnight freezes into ice within seconds on contact! Sarah lied.',
      },
      {
        name: 'Host Raymond',
        statement: 'I was checking the breaker switch in the garage with a dry flashlight.',
        isGuilty: false,
        explanation: 'The breaker logs confirm a switch toggle at 11:58 PM.',
      },
    ],
  },
  {
    caseTitle: 'The Museum Clock Mystery',
    story: 'A diamond necklace disappeared at exactly 12:00 noon while museum clocks were being synchronized.',
    clue: 'Examine shadow angles and sun movements.',
    suspects: [
      {
        name: 'Sculptor Arthur',
        statement: 'I was outside watching the sun cast long, 10-foot shadows across the courtyard at 12:00 noon.',
        isGuilty: true,
        explanation: 'At 12:00 noon the sun is directly overhead and casts virtually minimal or zero long shadows! Caught in a lie.',
      },
      {
        name: 'Security Guard Leo',
        statement: 'I was monitoring the central turnstile counter verifying ticket tallies.',
        isGuilty: false,
        explanation: 'Turnstile logs verify his manual counter inputs.',
      },
      {
        name: 'Historian Clara',
        statement: 'I was reading microfilms under UV light in the basement records.',
        isGuilty: false,
        explanation: 'The microfilm room badge reader registered Clara.',
      },
    ],
  },
  {
    caseTitle: 'The Desert Caravan Riddle',
    story: 'Gold coins were taken from a camel saddlebag during an oasis rest stop in 45°C heat.',
    clue: 'Think about animal physiology and extreme desert heat.',
    suspects: [
      {
        name: 'Trader Omar',
        statement: 'I was resting under the palm trees sipping cool well water.',
        isGuilty: false,
        explanation: 'The well pump was actively running at that time.',
      },
      {
        name: 'Guide Tariq',
        statement: 'I took my heavy polar fur parka and wore it for a 3-mile sprint across the scorching desert sand.',
        isGuilty: true,
        explanation: 'Wearing a heavy polar fur coat while sprinting in 45°C desert heat causes fatal heatstroke within minutes! Pure fiction.',
      },
      {
        name: 'Merchant Zainab',
        statement: 'I was bargaining for fresh dates with the local orchard keeper.',
        isGuilty: false,
        explanation: 'The orchard keeper confirmed the purchase receipt.',
      },
    ],
  },
];

export function DetectiveRiddleGame({
  difficulty,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const [caseIndex, setCaseIndex] = useState(0);
  const [selectedSuspect, setSelectedSuspect] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25);
  const [hintShown, setHintShown] = useState(false);

  useEffect(() => {
    const rand = Math.floor(Math.random() * MYSTERIES.length);
    setCaseIndex(rand);
    setSelectedSuspect(null);
    setRevealed(false);
    setHintShown(false);
    setTimeLeft(difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 22 : 16);
  }, [difficulty]);

  useEffect(() => {
    if (revealed || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [revealed, timeLeft]);

  const activeMystery = MYSTERIES[caseIndex];

  const handleTimeOut = () => {
    if (revealed) return;
    sound.playError(soundEnabled);
    haptics.error();
    if (onPenalty) onPenalty(10, 'Time expired on Detective Case!');
    onErrorToast('⏰ Time expired! The culprit escaped the scene!');
  };

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelectedSuspect(idx);
    setRevealed(true);

    const suspect = activeMystery.suspects[idx];
    if (suspect.isGuilty) {
      sound.playSuccess(soundEnabled);
      haptics.celebration();
      const score = difficulty === 'Easy' ? 45 : difficulty === 'Medium' ? 60 : 75;
      onSuccess(score, `Case Closed! ${suspect.name} was guilty: ${suspect.explanation}`);
    } else {
      sound.playError(soundEnabled);
      haptics.error();
      if (onPenalty) onPenalty(15, `Falsely accused ${suspect.name}!`);
      onErrorToast(`❌ Innocent! ${suspect.name} is innocent. ${suspect.explanation}`);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Case Header Banner */}
      <div className="p-3.5 rounded-[22px] bg-gradient-to-r from-purple-950/50 via-[#0c1322] to-amber-950/40 border border-purple-500/30 shadow-md">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🕵️</span>
            <h4 className="font-display font-black text-white text-sm">
              {activeMystery.caseTitle}
            </h4>
          </div>
          <div className="flex items-center gap-1 text-xs font-black text-amber-300 px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {activeMystery.story}
        </p>

        {hintShown ? (
          <div className="mt-2 text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl">
            💡 <strong>Detective Clue:</strong> {activeMystery.clue}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setHintShown(true);
              sound.playBonus(soundEnabled);
              haptics.light();
            }}
            className="mt-2 text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            <Lightbulb className="w-3 h-3" />
            <span>Reveal Forensic Clue</span>
          </button>
        )}
      </div>

      {/* Suspects Statements */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 px-1">
          Who has the fabricated alibi / lie? Tap the culprit:
        </span>

        {activeMystery.suspects.map((suspect, idx) => {
          const isChosen = selectedSuspect === idx;
          let statusStyle = 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-white';

          if (revealed) {
            if (suspect.isGuilty) {
              statusStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-500/20';
            } else if (isChosen && !suspect.isGuilty) {
              statusStyle = 'bg-rose-500/20 border-rose-400 text-rose-200';
            } else {
              statusStyle = 'opacity-40 bg-black/30 border-white/5';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={revealed}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left p-3 rounded-[20px] border transition-all duration-200 cursor-pointer ${statusStyle}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-display font-black text-xs sm:text-sm text-amber-300">
                  {suspect.name}
                </span>
                {revealed && (
                  <span className="text-xs font-black">
                    {suspect.isGuilty ? '🚨 CULPRIT' : '✅ INNOCENT'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 italic leading-snug">
                &ldquo;{suspect.statement}&rdquo;
              </p>
              {revealed && (
                <p className="mt-1.5 text-[11px] font-medium text-slate-300 border-t border-white/10 pt-1">
                  {suspect.explanation}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
