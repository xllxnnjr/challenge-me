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
  CheckCircle2,
} from 'lucide-react';

interface ChallengeIconProps {
  type?: string;
  category?: string;
  rawEmoji?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ChallengeIcon({
  type,
  category,
  rawEmoji,
  size = 'md',
  className = '',
}: ChallengeIconProps) {
  // Sizing definitions
  const sizeClasses = {
    sm: 'w-9 h-9 rounded-[14px] text-xs',
    md: 'w-12 h-12 rounded-[18px] text-sm',
    lg: 'w-14 h-14 rounded-[20px] text-base',
    xl: 'w-16 h-16 rounded-[24px] text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  // Apple vibrant gradient themes based on challenge type & category
  const getStyleConfig = () => {
    switch (type) {
      case 'math':
        return {
          bg: 'bg-gradient-to-br from-[#FF9500] via-[#FF5E3A] to-[#FF2A68]',
          shadow: 'shadow-[0_6px_20px_rgba(255,149,0,0.35)]',
          border: 'border-white/25',
          Icon: Calculator,
        };
      case 'number':
        return {
          bg: 'bg-gradient-to-br from-[#FFCC00] via-[#FF9500] to-[#E65100]',
          shadow: 'shadow-[0_6px_20px_rgba(255,204,0,0.35)]',
          border: 'border-white/25',
          Icon: Binary,
        };
      case 'compare':
        return {
          bg: 'bg-gradient-to-br from-[#FF6B6B] via-[#FF8E53] to-[#FE6B8B]',
          shadow: 'shadow-[0_6px_20px_rgba(255,107,107,0.35)]',
          border: 'border-white/25',
          Icon: Scale,
        };
      case 'twister':
        return {
          bg: 'bg-gradient-to-br from-[#FF2D55] via-[#FF375F] to-[#D80064]',
          shadow: 'shadow-[0_6px_20px_rgba(255,45,85,0.35)]',
          border: 'border-white/25',
          Icon: Mic,
        };
      case 'trivia':
        return {
          bg: 'bg-gradient-to-br from-[#FF3B30] via-[#FF2D55] to-[#BF5AF2]',
          shadow: 'shadow-[0_6px_20px_rgba(255,59,48,0.35)]',
          border: 'border-white/25',
          Icon: HelpCircle,
        };
      case 'truth':
        return {
          bg: 'bg-gradient-to-br from-[#FF5252] via-[#FF4081] to-[#7C4DFF]',
          shadow: 'shadow-[0_6px_20px_rgba(255,82,82,0.35)]',
          border: 'border-white/25',
          Icon: ShieldAlert,
        };
      case 'draw':
        return {
          bg: 'bg-gradient-to-br from-[#FF4081] via-[#E040FB] to-[#7C4DFF]',
          shadow: 'shadow-[0_6px_20px_rgba(224,64,251,0.35)]',
          border: 'border-white/25',
          Icon: Palette,
        };
      case 'memory':
        return {
          bg: 'bg-gradient-to-br from-[#AF52DE] via-[#5856D6] to-[#3634A3]',
          shadow: 'shadow-[0_6px_20px_rgba(175,82,222,0.35)]',
          border: 'border-white/25',
          Icon: Eye,
        };
      case 'chimp':
        return {
          bg: 'bg-gradient-to-br from-[#5E5CE6] via-[#6750A4] to-[#3B2D6B]',
          shadow: 'shadow-[0_6px_20px_rgba(94,92,230,0.35)]',
          border: 'border-white/25',
          Icon: Grid3X3,
        };
      case 'pairs':
        return {
          bg: 'bg-gradient-to-br from-[#6A11CB] via-[#2575FC] to-[#0052D4]',
          shadow: 'shadow-[0_6px_20px_rgba(106,17,203,0.35)]',
          border: 'border-white/25',
          Icon: Layers,
        };
      case 'pattern':
        return {
          bg: 'bg-gradient-to-br from-[#8E2DE2] via-[#4A00E0] to-[#2575FC]',
          shadow: 'shadow-[0_6px_20px_rgba(142,45,226,0.35)]',
          border: 'border-white/25',
          Icon: Compass,
        };
      case 'stroop':
        return {
          bg: 'bg-gradient-to-br from-[#DA22FF] via-[#9733EE] to-[#43CBFF]',
          shadow: 'shadow-[0_6px_20px_rgba(218,34,255,0.35)]',
          border: 'border-white/25',
          Icon: Sparkles,
        };
      case 'scramble':
        return {
          bg: 'bg-gradient-to-br from-[#B388FF] via-[#7C4DFF] to-[#304FFE]',
          shadow: 'shadow-[0_6px_20px_rgba(124,77,255,0.35)]',
          border: 'border-white/25',
          Icon: Type,
        };
      case 'reaction':
        return {
          bg: 'bg-gradient-to-br from-[#30D158] via-[#00E5FF] to-[#0A84FF]',
          shadow: 'shadow-[0_6px_20px_rgba(0,229,255,0.35)]',
          border: 'border-white/25',
          Icon: Zap,
        };
      case 'speedtap':
        return {
          bg: 'bg-gradient-to-br from-[#00F2FE] via-[#4FACFE] to-[#0072FF]',
          shadow: 'shadow-[0_6px_20px_rgba(79,172,254,0.35)]',
          border: 'border-white/25',
          Icon: Flame,
        };
      case 'target':
        return {
          bg: 'bg-gradient-to-br from-[#00C6FF] via-[#0072FF] to-[#00223E]',
          shadow: 'shadow-[0_6px_20px_rgba(0,198,255,0.35)]',
          border: 'border-white/25',
          Icon: Crosshair,
        };
      case 'rhythm':
        return {
          bg: 'bg-gradient-to-br from-[#64D2FF] via-[#5AC8FA] to-[#007AFF]',
          shadow: 'shadow-[0_6px_20px_rgba(100,210,255,0.35)]',
          border: 'border-white/25',
          Icon: Music,
        };
      default:
        if (category === 'Math & Logic') {
          return {
            bg: 'bg-gradient-to-br from-[#FF9500] to-[#FF2A68]',
            shadow: 'shadow-[0_6px_20px_rgba(255,149,0,0.35)]',
            border: 'border-white/25',
            Icon: Calculator,
          };
        } else if (category === 'Social & Party') {
          return {
            bg: 'bg-gradient-to-br from-[#FF2D55] to-[#BF5AF2]',
            shadow: 'shadow-[0_6px_20px_rgba(255,45,85,0.35)]',
            border: 'border-white/25',
            Icon: Sparkles,
          };
        } else if (category === 'Memory & Focus') {
          return {
            bg: 'bg-gradient-to-br from-[#AF52DE] to-[#3634A3]',
            shadow: 'shadow-[0_6px_20px_rgba(175,82,222,0.35)]',
            border: 'border-white/25',
            Icon: Brain,
          };
        } else {
          return {
            bg: 'bg-gradient-to-br from-[#30D158] to-[#0A84FF]',
            shadow: 'shadow-[0_6px_20px_rgba(0,229,255,0.35)]',
            border: 'border-white/25',
            Icon: Zap,
          };
        }
    }
  };

  const config = getStyleConfig();
  const IconComponent = config.Icon;

  return (
    <div
      className={`relative flex items-center justify-center text-white border ${config.border} ${config.bg} ${config.shadow} ${sizeClasses[size]} ${className} flex-shrink-0 select-none overflow-hidden transition-transform duration-200`}
    >
      {/* Apple specular light highlight at the top */}
      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-[inherit] pointer-events-none" />

      {/* Vector Icon */}
      <IconComponent className={`${iconSizes[size]} text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] relative z-10`} />

      {/* Subtle inner reflection edge */}
      <div className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/20 pointer-events-none" />
    </div>
  );
}
