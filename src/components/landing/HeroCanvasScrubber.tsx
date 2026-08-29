import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RefreshCw } from 'lucide-react';

interface HeroCanvasScrubberProps {
  scrollProgress: any;
}

const TOTAL_FRAMES = 240;

export const HeroCanvasScrubber: React.FC<HeroCanvasScrubberProps> = ({ scrollProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIndexRef = useRef(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Preload all 240 frames
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    let count = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/frames/frame_${frameNum}.jpg`;
      img.onload = () => {
        count++;
        setLoadedCount(count);
        if (count === 1 && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      };
      loadedImages.push(img);
    }
    imagesRef.current = loadedImages;
  }, []);

  // Draw frame helper
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const images = imagesRef.current;
    if (!canvas || !images.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));
    const img = images[clampedIndex];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Bind scroll progress: smooth slow scroll tracking
  useEffect(() => {
    if (isPlaying) return;

    const unsubscribe = scrollProgress.on('change', (v: number) => {
      const targetFrame = Math.floor(v * (TOTAL_FRAMES - 1));
      drawFrame(targetFrame);
    });

    return () => unsubscribe();
  }, [scrollProgress, isPlaying, drawFrame]);

  // Auto-Play Loop: 15 seconds duration
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      return;
    }

    let lastTime = performance.now();
    const intervalMs = 15000 / TOTAL_FRAMES; // ~62.5ms per frame

    const loop = (currentTime: number) => {
      const elapsed = currentTime - lastTime;
      if (elapsed > intervalMs) {
        lastTime = currentTime - (elapsed % intervalMs);
        playIndexRef.current = (playIndexRef.current + 1) % TOTAL_FRAMES;
        drawFrame(playIndexRef.current);
      }
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, drawFrame]);

  const loadPercent = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  return (
    <div className="relative w-full bg-white flex items-center justify-center">
      {/* Loading Progress Bar */}
      {loadPercent < 100 && (
        <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center text-zinc-900 text-xs space-y-2">
          <RefreshCw size={22} className="animate-spin text-blue-600" />
          <span className="font-bold font-mono">Loading Experience... {loadPercent}%</span>
        </div>
      )}

      {/* Expanded Canvas - Maximum Size, High Definition, Zero Borders */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="w-full h-auto max-h-[82vh] block object-contain mx-auto select-none border-none outline-none ring-0 shadow-none rounded-none"
      />

      {/* Fallback video if first load */}
      {loadedCount === 0 && (
        <video
          src="/videos/hero_comparison_30fps.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-contain border-none outline-none shadow-none rounded-none"
        />
      )}

      {/* Subtle Auto-Play / Pause Button (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-30">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-4 py-2 rounded-lg bg-black/85 hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {isPlaying ? <Pause size={13} className="text-amber-400" /> : <Play size={13} className="text-emerald-400" />}
          <span>{isPlaying ? 'Pause 15s Flow' : 'Play 15s Flow'}</span>
        </button>
      </div>
    </div>
  );
};
