import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, Palette } from 'lucide-react';
import { Difficulty } from '../../types';
import { sound } from '../../utils/audio';

interface Props {
  difficulty: Difficulty;
  onSuccess: (score: number, message: string) => void;
  onErrorToast: (msg: string) => void;
  soundEnabled: boolean;
}

const PROMPTS: { text: string; icon: string; diff: Difficulty }[] = [
  // Easy
  { text: 'A shining star ⭐', icon: '⭐', diff: 'Easy' },
  { text: 'A smiling face 😊', icon: '😊', diff: 'Easy' },
  { text: 'A warm coffee cup ☕', icon: '☕', diff: 'Easy' },
  // Medium
  { text: 'A rocket ship 🚀', icon: '🚀', diff: 'Medium' },
  { text: 'A leafy tree 🌳', icon: '🌳', diff: 'Medium' },
  { text: 'A playful cat 🐱', icon: '🐱', diff: 'Medium' },
  // Hard
  { text: 'An astronaut exploring space 🧑‍🚀', icon: '🧑‍🚀', diff: 'Hard' },
  { text: 'A ferocious fire-breathing dragon 🐉', icon: '🐉', diff: 'Hard' },
  { text: 'A detailed medieval castle 🏰', icon: '🏰', diff: 'Hard' },
];

const COLORS = ['#ffffff', '#ff9f1c', '#ef3fa2', '#793cff', '#58e66b', '#38bdf8', '#fbbf24'];

export function DrawGame({ difficulty, onSuccess, soundEnabled }: Props) {
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const matching = PROMPTS.filter(p => p.diff === difficulty);
    const pool = matching.length > 0 ? matching : PROMPTS;
    const randomPrompt = pool[Math.floor(Math.random() * pool.length)];
    setPrompt(randomPrompt);
  }, [difficulty]);

  const getCoordinates = (
    e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    if (!canvas || typeof canvas.getBoundingClientRect !== 'function') {
      return { x: 0, y: 0, valid: false };
    }
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('changedTouches' in e && e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        return { x: 0, y: 0, valid: false };
      }
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return { x: 0, y: 0, valid: false };
    }

    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      valid: true,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current || (e.currentTarget as HTMLCanvasElement);
    if (!canvas || typeof canvas.getBoundingClientRect !== 'function') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e, canvas);
    if (!coords.valid) return;

    isDrawing.current = true;
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setHasDrawn(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current || (e.currentTarget as HTMLCanvasElement);
    if (!canvas || typeof canvas.getBoundingClientRect !== 'function') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e, canvas);
    if (!coords.valid) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = false;
    if (e && e.currentTarget && typeof e.currentTarget.releasePointerCapture === 'function') {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    sound.playClick(soundEnabled);
  };

  const handleFinish = () => {
    const basePts = difficulty === 'Easy' ? 25 : difficulty === 'Medium' ? 35 : 55;
    sound.playSuccess(soundEnabled);
    onSuccess(basePts, `🎨 Masterpiece created for ${prompt.text} (${difficulty})!`);
  };

  return (
    <div className="flex flex-col items-center text-center py-1 select-none">
      <div className="w-full flex items-center justify-between px-1 mb-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs font-bold">
          <span>✏️ Prompt:</span> Draw <span className="text-white font-extrabold">{prompt.text}</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-emerald-300">
          Tier: {difficulty}
        </span>
      </div>

      {/* Canvas container */}
      <div className="w-full bg-[#0a1020] border-2 border-[#263149] rounded-2xl overflow-hidden shadow-inner touch-none relative mb-3">
        <canvas
          ref={canvasRef}
          width={440}
          height={260}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          className="w-full h-[220px] sm:h-[250px] cursor-crosshair block touch-none"
        />

        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
            <Palette className="w-6 h-6 opacity-60" />
            <span>Draw your doodle here with touch, pen, or mouse</span>
          </div>
        )}
      </div>

      {/* Color Palette & Controls */}
      <div className="w-full flex items-center justify-between gap-2 p-2 bg-[#111a2c] border border-[#263149] rounded-xl mb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                sound.playClick(soundEnabled);
              }}
              style={{ backgroundColor: c }}
              className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                color === c ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setBrushSize(b => (b === 4 ? 8 : b === 8 ? 14 : 4))}
            className="px-2.5 py-1 text-xs bg-[#18233c] hover:bg-[#223050] text-slate-300 rounded-lg border border-[#2c3a57] cursor-pointer"
          >
            {brushSize === 4 ? 'Fine' : brushSize === 8 ? 'Med' : 'Thick'}
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            title="Clear canvas"
            className="p-1.5 bg-[#18233c] hover:bg-rose-950/60 text-rose-300 rounded-lg border border-[#2c3a57] transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <button
        id="draw-done-btn"
        onClick={handleFinish}
        className="w-full py-3.5 rounded-xl font-black text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:opacity-95 active:scale-[0.98] transition shadow-lg shadow-emerald-950/40 cursor-pointer"
      >
        I&apos;M DONE DRAWING 🎨
      </button>
    </div>
  );
}
