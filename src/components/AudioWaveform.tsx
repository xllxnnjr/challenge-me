import React, { useEffect, useRef } from 'react';

interface Props {
  isListening: boolean;
  volume?: number; // 0 to 1
  analyser?: AnalyserNode | null;
  className?: string;
}

export function AudioWaveform({ isListening, volume = 0, analyser, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!isListening) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      animationFrameId = requestAnimationFrame(render);

      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Fallback synthetic wave simulation based on volume
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.min(255, Math.floor((volume * 180 + Math.random() * 60)));
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const barCount = 24;
      const barWidth = 3.5;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * (bufferLength / 2));
        const val = dataArray[dataIndex] || (volume * 150);
        const percent = Math.max(0.12, val / 255);
        const barHeight = Math.max(4, percent * height * 0.85);

        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        // Dynamic Apple gradient for glowing voice waves
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#FF2D55');
        gradient.addColorStop(0.5, '#FF9500');
        gradient.addColorStop(1, '#AF52DE');

        ctx.fillStyle = gradient;
        ctx.shadowColor = '#FF2D55';
        ctx.shadowBlur = isListening ? 8 : 0;

        // Rounded bar pills
        ctx.beginPath();
        const radius = barWidth / 2;
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }
    };

    if (isListening) {
      render();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isListening, volume, analyser]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={180}
        height={36}
        className="w-full h-9 max-w-[200px]"
      />
    </div>
  );
}
