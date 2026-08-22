import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { haptics } from '../utils/haptics';
import { sound } from '../utils/audio';

export interface ShareData {
  title: string;
  text: string;
  url?: string;
  category?: string;
  score?: number;
  level?: number;
  streak?: number;
  trophiesCount?: number;
  challengeTitle?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareData;
  onToast: (msg: string) => void;
  soundEnabled?: boolean;
}

export function ShareModal({
  isOpen,
  onClose,
  data,
  onToast,
  soundEnabled = true,
}: ShareModalProps) {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const appUrl =
    data.url ||
    (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://challenge-me.app');

  const fullShareText = `${data.text}\n\nPlay now: ${appUrl}`;
  const encodedText = encodeURIComponent(fullShareText);
  const encodedUrl = encodeURIComponent(appUrl);

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = async () => {
    sound.playClick(soundEnabled);
    haptics.medium();
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: appUrl,
        });
        onToast('Shared! 🚀');
        onClose();
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          handleCopyText();
        }
      }
    } else {
      handleCopyText();
    }
  };

  const handleCopyText = async () => {
    sound.playSuccess(soundEnabled);
    haptics.success();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullShareText);
        setCopiedText(true);
        onToast('Text copied! 📋');
        setTimeout(() => setCopiedText(false), 2000);
      }
    } catch {
      onToast('Unable to copy');
    }
  };

  const handleCopyLink = async () => {
    sound.playSuccess(soundEnabled);
    haptics.success();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(appUrl);
        setCopiedLink(true);
        onToast('Link copied! 🔗');
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      onToast('Unable to copy link');
    }
  };

  const shareApps = [
    {
      name: 'WhatsApp',
      bg: 'bg-emerald-600 hover:bg-emerald-500',
      url: `https://api.whatsapp.com/send?text=${encodedText}`,
      svg: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.004.573 1.777.876 2.806.876 3.182 0 5.768-2.587 5.768-5.767 0-3.179-2.586-5.758-5.768-5.758zm3.385 8.163c-.145.407-.847.77-1.182.817-.321.044-.725.074-2.316-.583-1.656-.684-2.73-2.361-2.812-2.47-.083-.11-.676-.899-.676-1.714 0-.814.428-1.215.581-1.38.152-.165.332-.206.442-.206.111 0 .221.001.318.006.103.004.24-.039.375.285.145.346.497 1.215.541 1.304.044.089.073.193.015.309-.058.117-.088.19-.175.293-.088.103-.186.23-.265.31-.089.088-.182.185-.078.363.104.179.462.763.992 1.235.682.609 1.258.798 1.437.886.179.088.283.078.388-.044.105-.122.449-.523.568-.702.119-.179.238-.149.402-.089.164.06.992.468 1.162.553.17.085.283.128.324.199.041.071.041.411-.104.818zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.307C8.423 21.547 10.153 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.63 0-3.15-.46-4.44-1.26l-.32-.2-2.96.78.79-2.89-.21-.34C4.01 14.81 3.5 13.46 3.5 12c0-4.69 3.81-8.5 8.5-8.5s8.5 3.81 8.5 8.5-3.81 8.5-8.5 8.5z" />
        </svg>
      ),
    },
    {
      name: 'X (Twitter)',
      bg: 'bg-black hover:bg-neutral-900 border border-white/20',
      url: `https://twitter.com/intent/tweet?text=${encodedText}`,
      svg: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'Telegram',
      bg: 'bg-[#229ED9] hover:bg-[#1f91c7]',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      svg: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      ),
    },
    {
      name: 'SMS',
      bg: 'bg-emerald-700 hover:bg-emerald-600',
      url: `sms:?&body=${encodedText}`,
      svg: <MessageSquare className="w-4 h-4 text-white" />,
    },
  ];

  const handleAppClick = (url: string) => {
    sound.playClick(soundEnabled);
    haptics.selection();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm rounded-[24px] bg-[#0c1322] border border-white/15 p-5 shadow-2xl text-white space-y-3.5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-400" />
            <h3 className="font-display font-bold text-sm text-white">
              Share Challenge
            </h3>
          </div>
          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Preview */}
        <div className="bg-black/40 rounded-xl p-3 border border-white/5">
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 select-all">
            {data.text}
          </p>
        </div>

        {/* Quick Action Copy Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-amber-300"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-slate-300"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Native Share Button */}
        {hasNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-md"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Share via Apps & AirDrop</span>
          </button>
        )}

        {/* Quick App Destinations */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {shareApps.map((app) => (
            <button
              key={app.name}
              type="button"
              onClick={() => handleAppClick(app.url)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition active:scale-90 cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-full ${app.bg} text-white flex items-center justify-center shadow-sm`}>
                {app.svg}
              </div>
              <span className="text-[10px] text-slate-300 font-medium truncate max-w-full">
                {app.name}
              </span>
            </button>
          ))}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            haptics.light();
            onClose();
          }}
          className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-semibold text-xs transition cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
