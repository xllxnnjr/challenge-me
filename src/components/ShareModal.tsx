import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  Mail,
  MessageSquare,
  Sparkles,
  ExternalLink,
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
  const encodedTitle = encodeURIComponent(data.title);

  // Check if native Web Share API is supported
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
        onToast('Shared successfully! 🚀');
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
        onToast('Share text copied to clipboard! 📋');
        setTimeout(() => setCopiedText(false), 2500);
      }
    } catch {
      onToast('Unable to copy to clipboard');
    }
  };

  const handleCopyLink = async () => {
    sound.playSuccess(soundEnabled);
    haptics.success();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(appUrl);
        setCopiedLink(true);
        onToast('App link copied to clipboard! 🔗');
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      onToast('Unable to copy link');
    }
  };

  const shareApps = [
    {
      name: 'WhatsApp',
      description: 'Send to chats or status',
      iconBg: 'bg-emerald-500',
      iconColor: 'text-white',
      badge: 'Popular',
      url: `https://api.whatsapp.com/send?text=${encodedText}`,
      svg: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.004.573 1.777.876 2.806.876 3.182 0 5.768-2.587 5.768-5.767 0-3.179-2.586-5.758-5.768-5.758zm3.385 8.163c-.145.407-.847.77-1.182.817-.321.044-.725.074-2.316-.583-1.656-.684-2.73-2.361-2.812-2.47-.083-.11-.676-.899-.676-1.714 0-.814.428-1.215.581-1.38.152-.165.332-.206.442-.206.111 0 .221.001.318.006.103.004.24-.039.375.285.145.346.497 1.215.541 1.304.044.089.073.193.015.309-.058.117-.088.19-.175.293-.088.103-.186.23-.265.31-.089.088-.182.185-.078.363.104.179.462.763.992 1.235.682.609 1.258.798 1.437.886.179.088.283.078.388-.044.105-.122.449-.523.568-.702.119-.179.238-.149.402-.089.164.06.992.468 1.162.553.17.085.283.128.324.199.041.071.041.411-.104.818zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.307C8.423 21.547 10.153 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.63 0-3.15-.46-4.44-1.26l-.32-.2-2.96.78.79-2.89-.21-.34C4.01 14.81 3.5 13.46 3.5 12c0-4.69 3.81-8.5 8.5-8.5s8.5 3.81 8.5 8.5-3.81 8.5-8.5 8.5z" />
        </svg>
      ),
    },
    {
      name: 'X (Twitter)',
      description: 'Post challenge & score',
      iconBg: 'bg-black',
      iconColor: 'text-white border border-white/20',
      badge: 'Tweet',
      url: `https://twitter.com/intent/tweet?text=${encodedText}`,
      svg: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'Telegram',
      description: 'Share to groups or channels',
      iconBg: 'bg-[#229ED9]',
      iconColor: 'text-white',
      badge: null,
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      svg: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      ),
    },
    {
      name: 'Messages / SMS',
      description: 'Direct mobile message',
      iconBg: 'bg-gradient-to-tr from-green-500 to-emerald-400',
      iconColor: 'text-white',
      badge: 'SMS',
      url: `sms:?&body=${encodedText}`,
      svg: <MessageSquare className="w-5 h-5 text-white" />,
    },
    {
      name: 'Email / Mail',
      description: 'Send scorecard report',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-indigo-500',
      iconColor: 'text-white',
      badge: null,
      url: `mailto:?subject=${encodedTitle}&body=${encodedText}`,
      svg: <Mail className="w-5 h-5 text-white" />,
    },
    {
      name: 'LinkedIn',
      description: 'Post challenge milestone',
      iconBg: 'bg-[#0A66C2]',
      iconColor: 'text-white',
      badge: null,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      svg: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 1 0-.01-3.2 1.6 1.6 0 0 0 .01 3.2m1.4 9.74V10.13H5.06v8.37h2.8z" />
        </svg>
      ),
    },
    {
      name: 'Reddit',
      description: 'Share to community',
      iconBg: 'bg-[#FF4500]',
      iconColor: 'text-white',
      badge: null,
      url: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      svg: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.2 8.7a1.6 1.6 0 0 0-1.57-1.57c-.4 0-.76.15-1.04.4-1.1-.7-2.6-1.15-4.27-1.2l.86-3.88 2.78.6a1.18 1.18 0 1 0 1.24-1.08 1.18 1.18 0 0 0-1.14.88l-3.1-.66a.3.3 0 0 0-.35.23l-.98 4.4c-1.72.04-3.25.5-4.38 1.22a1.59 1.59 0 0 0-1.07-.42 1.6 1.6 0 0 0-1.12 2.74c-.03.18-.04.36-.04.54 0 2.76 3.2 5 7.15 5s7.15-2.24 7.15-5c0-.17-.01-.34-.04-.51.62-.3 1.01-.94 1.01-1.65z" />
        </svg>
      ),
    },
  ];

  const handleAppClick = (url: string, appName: string) => {
    sound.playClick(soundEnabled);
    haptics.selection();
    window.open(url, '_blank', 'noopener,noreferrer');
    onToast(`Opening ${appName}... 🚀`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[32px] bg-gradient-to-br from-[#1E1B4B] via-[#0F172A] to-[#18181B] border border-white/20 p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] text-white max-h-[90vh] overflow-y-auto no-scrollbar space-y-4">
        {/* Specular gloss top reflection */}
        <div className="absolute top-0 inset-x-0 h-1/4 bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-[32px]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[16px] bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-950/40">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white leading-tight">
                Share to Application
              </h3>
              <p className="text-xs text-slate-400">
                Choose an app to broadcast your score & challenge friends
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Share Card Preview */}
        <div className="p-3.5 rounded-[24px] bg-white/[0.04] border border-white/10 space-y-2 relative overflow-hidden backdrop-blur-xl">
          <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Share Preview</span>
            </span>
            <span className="text-slate-400 font-medium">Ready to broadcast</span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-sans bg-black/30 p-2.5 rounded-[16px] border border-white/5 whitespace-pre-line select-all">
            {data.text}
          </p>

          {/* Quick Copy Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCopyText}
              className="flex-1 py-2 px-3 rounded-[16px] bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-amber-300"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copied Text!' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex-1 py-2 px-3 rounded-[16px] bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-slate-300"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied Link!' : 'Copy App Link'}</span>
            </button>
          </div>
        </div>

        {/* Native OS Share Sheet Hero Button (If supported or on mobile/tablet/desktop) */}
        {hasNativeShare && (
          <button
            onClick={handleNativeShare}
            className="w-full py-3.5 px-4 rounded-[22px] bg-gradient-to-r from-[#007AFF] via-[#5856D6] to-[#AF52DE] hover:opacity-95 text-white font-display font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-purple-950/40 active:scale-[0.98] transition cursor-pointer group"
          >
            <Smartphone className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Open System Share Sheet (AirDrop, Apps, etc.)</span>
          </button>
        )}

        {/* Applications Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Installed & Web Applications
            </span>
            <span className="text-[10px] text-slate-500">{shareApps.length} destinations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {shareApps.map((app) => (
              <button
                key={app.name}
                type="button"
                onClick={() => handleAppClick(app.url, app.name)}
                className="p-3 rounded-[20px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 transition-all text-left flex items-center gap-3 active:scale-95 cursor-pointer shadow-sm group"
              >
                <div
                  className={`w-10 h-10 rounded-[14px] ${app.iconBg} ${app.iconColor} flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}
                >
                  {app.svg}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <strong className="block text-xs font-black text-white truncate group-hover:text-amber-300 transition-colors">
                      {app.name}
                    </strong>
                    {app.badge && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-white/10 text-amber-300">
                        {app.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {app.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            className="w-full py-3 rounded-[20px] bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
