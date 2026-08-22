import React from 'react';
import {
  Calculator,
  Binary,
  Scale,
  Mic,
  HelpCircle,
  ShieldAlert,
  Palette,
  Eye,
  Grid3X3,
  Layers,
  Compass,
  Sparkles,
  Type,
  Zap,
  Flame,
  Crosshair,
  Music,
  Dices,
  Brain,
  Timer,
  BookOpen,
  Film,
  KeyRound,
  Search,
  Globe2,
  SpellCheck,
  Gamepad2,
  Radio,
  Trophy,
  Smile,
} from 'lucide-react';

interface ChallengeIconProps {
  type?: string;
  category?: string;
  rawEmoji?: string;
  iconUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ChallengeIcon({
  type,
  category,
  rawEmoji,
  iconUrl,
  size = 'md',
  className = '',
}: ChallengeIconProps) {
  const [imageError, setImageError] = React.useState(false);

  // Check if rawEmoji is actually a data URL or image link
  const effectiveImageUrl = !imageError && (iconUrl || (rawEmoji && (rawEmoji.startsWith('data:') || rawEmoji.startsWith('http')) ? rawEmoji : undefined));

  // Sizing definitions with smooth rounded squircle curvature
  const sizeClasses = {
    sm: 'w-10 h-10 rounded-[16px] text-xs',
    md: 'w-13 h-13 rounded-[20px] text-sm',
    lg: 'w-16 h-16 rounded-[24px] text-base',
    xl: 'w-20 h-20 rounded-[28px] text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-9 h-9',
  };

  const badgeSizes = {
    sm: 'text-[10px] -bottom-1 -right-1 p-0.5',
    md: 'text-xs -bottom-1.5 -right-1.5 p-0.5',
    lg: 'text-sm -bottom-2 -right-2 p-1',
    xl: 'text-base -bottom-2.5 -right-2.5 p-1',
  };

  // Fun, visually appealing, colorful configurations
  const getStyleConfig = () => {
    switch (type) {
      case 'cinema_quiz':
        return {
          bg: 'bg-gradient-to-br from-[#FF0055] via-[#E50914] to-[#4A0012]',
          shadow: 'shadow-[0_8px_25px_rgba(229,9,20,0.5)]',
          border: 'border-rose-400/40',
          accentColor: 'text-rose-200',
          funEmoji: rawEmoji || '🎬',
          Icon: Film,
        };
      case 'detective_riddle':
        return {
          bg: 'bg-gradient-to-br from-[#A855F7] via-[#7C3AED] to-[#1E1B4B]',
          shadow: 'shadow-[0_8px_25px_rgba(168,85,247,0.45)]',
          border: 'border-purple-400/40',
          accentColor: 'text-purple-200',
          funEmoji: rawEmoji || '🕵️',
          Icon: Search,
        };
      case 'code_breaker':
        return {
          bg: 'bg-gradient-to-br from-[#10B981] via-[#059669] to-[#022C22]',
          shadow: 'shadow-[0_8px_25px_rgba(16,185,129,0.45)]',
          border: 'border-emerald-400/40',
          accentColor: 'text-emerald-200',
          funEmoji: rawEmoji || '🔐',
          Icon: KeyRound,
        };
      case 'math24':
        return {
          bg: 'bg-gradient-to-br from-[#FBBF24] via-[#F59E0B] to-[#78350F]',
          shadow: 'shadow-[0_8px_25px_rgba(245,158,11,0.45)]',
          border: 'border-amber-400/40',
          accentColor: 'text-amber-200',
          funEmoji: rawEmoji || '🎯',
          Icon: Calculator,
        };
      case 'flag_quiz':
        return {
          bg: 'bg-gradient-to-br from-[#38BDF8] via-[#0284C7] to-[#082F49]',
          shadow: 'shadow-[0_8px_25px_rgba(56,189,248,0.45)]',
          border: 'border-sky-400/40',
          accentColor: 'text-sky-200',
          funEmoji: rawEmoji || '🌍',
          Icon: Globe2,
        };
      case 'pitch_match':
        return {
          bg: 'bg-gradient-to-br from-[#818CF8] via-[#6366F1] to-[#312E81]',
          shadow: 'shadow-[0_8px_25px_rgba(99,102,241,0.45)]',
          border: 'border-indigo-400/40',
          accentColor: 'text-indigo-200',
          funEmoji: rawEmoji || '🎵',
          Icon: Music,
        };
      case 'anagram_blitz':
        return {
          bg: 'bg-gradient-to-br from-[#2DD4BF] via-[#0D9488] to-[#134E4A]',
          shadow: 'shadow-[0_8px_25px_rgba(45,212,191,0.45)]',
          border: 'border-teal-400/40',
          accentColor: 'text-teal-200',
          funEmoji: rawEmoji || '🔤',
          Icon: SpellCheck,
        };
      case 'math':
        return {
          bg: 'bg-gradient-to-br from-[#FB923C] via-[#EA580C] to-[#7C2D12]',
          shadow: 'shadow-[0_8px_25px_rgba(234,88,12,0.45)]',
          border: 'border-orange-400/40',
          accentColor: 'text-orange-200',
          funEmoji: rawEmoji || '🧮',
          Icon: Calculator,
        };
      case 'number':
        return {
          bg: 'bg-gradient-to-br from-[#FACC15] via-[#EAB308] to-[#713F12]',
          shadow: 'shadow-[0_8px_25px_rgba(250,204,21,0.45)]',
          border: 'border-yellow-400/40',
          accentColor: 'text-yellow-200',
          funEmoji: rawEmoji || '🔢',
          Icon: Binary,
        };
      case 'compare':
        return {
          bg: 'bg-gradient-to-br from-[#F43F5E] via-[#E11D48] to-[#4C0519]',
          shadow: 'shadow-[0_8px_25px_rgba(244,63,94,0.45)]',
          border: 'border-rose-400/40',
          accentColor: 'text-rose-200',
          funEmoji: rawEmoji || '⚖️',
          Icon: Scale,
        };
      case 'twister':
      case 'voice_riddle':
        return {
          bg: 'bg-gradient-to-br from-[#F472B6] via-[#DB2777] to-[#500724]',
          shadow: 'shadow-[0_8px_25px_rgba(219,39,119,0.45)]',
          border: 'border-pink-400/40',
          accentColor: 'text-pink-200',
          funEmoji: rawEmoji || '🎙️',
          Icon: Mic,
        };
      case 'edu_quiz':
        return {
          bg: 'bg-gradient-to-br from-[#34D399] via-[#059669] to-[#064E3B]',
          shadow: 'shadow-[0_8px_25px_rgba(52,211,153,0.45)]',
          border: 'border-emerald-400/40',
          accentColor: 'text-emerald-200',
          funEmoji: rawEmoji || '🎓',
          Icon: BookOpen,
        };
      case 'emoji_riddle':
        return {
          bg: 'bg-gradient-to-br from-[#F43F5E] via-[#D946EF] to-[#6B21A8]',
          shadow: 'shadow-[0_8px_25px_rgba(217,70,239,0.45)]',
          border: 'border-fuchsia-400/40',
          accentColor: 'text-fuchsia-200',
          funEmoji: rawEmoji || '🔮',
          Icon: Sparkles,
        };
      case 'simon':
        return {
          bg: 'bg-gradient-to-br from-[#F59E0B] via-[#EF4444] to-[#3B82F6]',
          shadow: 'shadow-[0_8px_25px_rgba(245,158,11,0.5)]',
          border: 'border-amber-400/40',
          accentColor: 'text-amber-200',
          funEmoji: rawEmoji || '🚦',
          Icon: Grid3X3,
        };
      case 'trivia':
        return {
          bg: 'bg-gradient-to-br from-[#FB7185] via-[#E11D48] to-[#831843]',
          shadow: 'shadow-[0_8px_25px_rgba(225,29,72,0.45)]',
          border: 'border-rose-400/40',
          accentColor: 'text-rose-200',
          funEmoji: rawEmoji || '💡',
          Icon: HelpCircle,
        };
      case 'truth':
        return {
          bg: 'bg-gradient-to-br from-[#EF4444] via-[#DC2626] to-[#7F1D1D]',
          shadow: 'shadow-[0_8px_25px_rgba(239,68,68,0.45)]',
          border: 'border-red-400/40',
          accentColor: 'text-red-200',
          funEmoji: rawEmoji || '🔎',
          Icon: ShieldAlert,
        };
      case 'draw':
        return {
          bg: 'bg-gradient-to-br from-[#EC4899] via-[#A855F7] to-[#4338CA]',
          shadow: 'shadow-[0_8px_25px_rgba(236,72,153,0.45)]',
          border: 'border-pink-400/40',
          accentColor: 'text-pink-200',
          funEmoji: rawEmoji || '🎨',
          Icon: Palette,
        };
      case 'memory':
      case 'pairs':
        return {
          bg: 'bg-gradient-to-br from-[#C084FC] via-[#9333EA] to-[#3B0764]',
          shadow: 'shadow-[0_8px_25px_rgba(147,51,234,0.45)]',
          border: 'border-purple-400/40',
          accentColor: 'text-purple-200',
          funEmoji: rawEmoji || '🧠',
          Icon: Eye,
        };
      case 'chimp':
        return {
          bg: 'bg-gradient-to-br from-[#6366F1] via-[#4F46E5] to-[#1E1B4B]',
          shadow: 'shadow-[0_8px_25px_rgba(79,70,229,0.45)]',
          border: 'border-indigo-400/40',
          accentColor: 'text-indigo-200',
          funEmoji: rawEmoji || '🐵',
          Icon: Grid3X3,
        };
      case 'pattern':
        return {
          bg: 'bg-gradient-to-br from-[#A78BFA] via-[#7C3AED] to-[#2E1065]',
          shadow: 'shadow-[0_8px_25px_rgba(124,58,237,0.45)]',
          border: 'border-purple-400/40',
          accentColor: 'text-purple-200',
          funEmoji: rawEmoji || '🧭',
          Icon: Compass,
        };
      case 'stroop':
        return {
          bg: 'bg-gradient-to-br from-[#F43F5E] via-[#06B6D4] to-[#8B5CF6]',
          shadow: 'shadow-[0_8px_25px_rgba(6,182,212,0.45)]',
          border: 'border-cyan-400/40',
          accentColor: 'text-cyan-200',
          funEmoji: rawEmoji || '🌈',
          Icon: Sparkles,
        };
      case 'scramble':
        return {
          bg: 'bg-gradient-to-br from-[#A855F7] via-[#6366F1] to-[#1E1B4B]',
          shadow: 'shadow-[0_8px_25px_rgba(99,102,241,0.45)]',
          border: 'border-indigo-400/40',
          accentColor: 'text-indigo-200',
          funEmoji: rawEmoji || '📝',
          Icon: Type,
        };
      case 'reaction':
        return {
          bg: 'bg-gradient-to-br from-[#10B981] via-[#06B6D4] to-[#0284C7]',
          shadow: 'shadow-[0_8px_25px_rgba(6,182,212,0.45)]',
          border: 'border-cyan-400/40',
          accentColor: 'text-cyan-200',
          funEmoji: rawEmoji || '⚡',
          Icon: Zap,
        };
      case 'speedtap':
        return {
          bg: 'bg-gradient-to-br from-[#06B6D4] via-[#3B82F6] to-[#1D4ED8]',
          shadow: 'shadow-[0_8px_25px_rgba(59,130,246,0.45)]',
          border: 'border-blue-400/40',
          accentColor: 'text-blue-200',
          funEmoji: rawEmoji || '🔥',
          Icon: Flame,
        };
      case 'target':
        return {
          bg: 'bg-gradient-to-br from-[#38BDF8] via-[#0EA5E9] to-[#0369A1]',
          shadow: 'shadow-[0_8px_25px_rgba(14,165,233,0.45)]',
          border: 'border-sky-400/40',
          accentColor: 'text-sky-200',
          funEmoji: rawEmoji || '🎯',
          Icon: Crosshair,
        };
      case 'rhythm':
        return {
          bg: 'bg-gradient-to-br from-[#60A5FA] via-[#3B82F6] to-[#1E3A8A]',
          shadow: 'shadow-[0_8px_25px_rgba(59,130,246,0.45)]',
          border: 'border-blue-400/40',
          accentColor: 'text-blue-200',
          funEmoji: rawEmoji || '🥁',
          Icon: Music,
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-[#34D399] via-[#06B6D4] to-[#6366F1]',
          shadow: 'shadow-[0_8px_25px_rgba(6,182,212,0.45)]',
          border: 'border-emerald-400/40',
          accentColor: 'text-emerald-200',
          funEmoji: rawEmoji || '🎮',
          Icon: Gamepad2,
        };
    }
  };

  const config = getStyleConfig();
  const IconComponent = config.Icon;

  return (
    <div
      className={`relative flex items-center justify-center text-white border ${config.border} ${config.bg} ${config.shadow} ${sizeClasses[size]} ${className} flex-shrink-0 select-none overflow-visible transition-all duration-300 group-hover:scale-105`}
    >
      {/* Glossy specular top gradient highlight */}
      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 via-white/10 to-transparent rounded-t-[inherit] pointer-events-none" />

      {/* Radiant inner ambient glow */}
      <div className="absolute inset-0 rounded-[inherit] bg-radial from-white/20 to-transparent pointer-events-none" />

      {effectiveImageUrl ? (
        <img
          src={effectiveImageUrl}
          alt={type || 'game'}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-[inherit] relative z-10"
        />
      ) : (
        /* Main Vector Icon */
        <IconComponent
          className={`${iconSizes[size]} ${config.accentColor} drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)] relative z-10 transition-transform duration-300 group-hover:scale-110`}
        />
      )}

      {/* Fun Floating Emoji Badge on the corner */}
      <div
        className={`absolute ${badgeSizes[size]} rounded-full bg-[#0c1322]/90 border border-white/30 shadow-md flex items-center justify-center z-20 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-125 select-none`}
      >
        <span className="leading-none">{config.funEmoji}</span>
      </div>

      {/* Crisp inner border ring */}
      <div className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/25 pointer-events-none" />
    </div>
  );
}
