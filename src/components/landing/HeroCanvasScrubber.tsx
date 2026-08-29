import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RefreshCw, Sparkles } from 'lucide-react';

const TOTAL_FRAMES = 240;

interface HeroCanvasScrubberProps {
  scrollProgress?: any;
}

export const HeroCanvasScrubber: React.FC<HeroCanvasScrubberProps> = ({ scrollProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const playIndexRef = useRef(0);
  const animFrameIdRef = useRef<number | null>(null);
  const isUserInteractingRef = useRef(false);

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

    const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(frameIndex)));
    playIndexRef.current = clampedIndex;
    const img = images[clampedIndex];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Bind scroll progress if available
  useEffect(() => {
    if (!scrollProgress) return;

    const unsubscribe = scrollProgress.on('change', (v: number) => {
      if (isUserInteractingRef.current) return;
      const targetFrame = Math.floor(v * (TOTAL_FRAMES - 1));
      drawFrame(targetFrame);
    });

    return () => unsubscribe();
  }, [scrollProgress, drawFrame]);

  // Smooth Auto-Play Loop: plays ~10 seconds loop when not hovered
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      return;
    }

    let lastTime = performance.now();
    const intervalMs = 10000 / TOTAL_FRAMES; // ~41.6ms per frame (~24fps)

    const loop = (currentTime: number) => {
      if (!isUserInteractingRef.current) {
        const elapsed = currentTime - lastTime;
        if (elapsed > intervalMs) {
          lastTime = currentTime - (elapsed % intervalMs);
          playIndexRef.current = (playIndexRef.current + 1) % TOTAL_FRAMES;
          drawFrame(playIndexRef.current);
        }
      }
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, drawFrame]);

  // Interactive Hover / Mouse Scrubbing
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || loadedCount < 10) return;
    isUserInteractingRef.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = x / rect.width;
    const targetFrame = Math.floor(ratio * (TOTAL_FRAMES - 1));
    drawFrame(targetFrame);
  };

  const handleMouseLeave = () => {
    isUserInteractingRef.current = false;
  };

  // Interactive Touch Scrubbing for Mobile
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || !e.touches[0] || loadedCount < 10) return;
    isUserInteractingRef.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
    const ratio = x / rect.width;
    const targetFrame = Math.floor(ratio * (TOTAL_FRAMES - 1));
    drawFrame(targetFrame);
  };

  const handleTouchEnd = () => {
    setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 400);
  };

  const loadPercent = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full bg-white flex items-center justify-center cursor-ew-resize rounded-2xl overflow-hidden select-none group"
    >
      {/* Loading Progress Bar */}
      {loadPercent < 100 && (
        <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-[#141312] text-xs space-y-2">
          <RefreshCw size={22} className="animate-spin text-[#C28E5C]" />
          <span className="font-bold font-mono">Loading Experience... {loadPercent}%</span>
        </div>
      )}

      {/* High-Definition 1280x720 240-Frame Canvas */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="w-full h-auto max-h-[75vh] block object-contain mx-auto select-none rounded-2xl pointer-events-none"
      />

      {/* Fallback video if frames still downloading */}
      {loadedCount === 0 && (
        <video
          src="/videos/hero_comparison_30fps.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-contain rounded-2xl pointer-events-none"
        />
      )}

      {/* Interactive Scrub Hint Badge (Appears on Hover) */}
      <div className="absolute top-3 left-3 z-30 opacity-85 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="px-3 py-1 rounded-full bg-[#141312]/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
          <Sparkles size={11} className="text-[#C28E5C]" />
          <span>Move Cursor / Swipe to Scrub Flow</span>
        </span>
      </div>

      {/* Auto-Play / Pause Button (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-[#141312]/85 hover:bg-[#141312] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer backdrop-blur-sm"
        >
          {isPlaying ? <Pause size={13} className="text-amber-400" /> : <Play size={13} className="text-emerald-400" />}
          <span>{isPlaying ? 'Pause Flow' : 'Play Flow'}</span>
        </button>
      </div>
    </div>
  );
};
