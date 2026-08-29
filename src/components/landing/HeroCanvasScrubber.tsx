import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RefreshCw, Volume2, VolumeX } from 'lucide-react';

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
  const [isSoundOn, setIsSoundOn] = useState(false);
  const isSoundOnRef = useRef(false);
  const playIndexRef = useRef(0);
  const lastChimeFrameRef = useRef(-1);
  const animFrameIdRef = useRef<number | null>(null);
  const isUserInteractingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    isSoundOnRef.current = isSoundOn;
  }, [isSoundOn]);

  // Web Audio Context initialization
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Play High-End Proximity Notification Chime
  const playNotificationChime = useCallback(() => {
    if (!isSoundOnRef.current) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // Dual resonant bell chime (D5 -> A5 -> F#6)
      const freqs = [587.33, 880.00, 1479.98];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.18 / (i + 1), now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 1.3);
      });

      // Crowdless Peaceful Ambient Harmonic Pad
      const padOsc = ctx.createOscillator();
      const padGain = ctx.createGain();
      padOsc.type = 'triangle';
      padOsc.frequency.setValueAtTime(440, now);
      padGain.gain.setValueAtTime(0, now);
      padGain.gain.linearRampToValueAtTime(0.08, now + 0.3);
      padGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      padOsc.connect(padGain);
      padGain.connect(ctx.destination);

      padOsc.start(now);
      padOsc.stop(now + 2.6);

      // Subtle Spoken Proximity Voice Alert via SpeechSynthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Your pass is ready. Please proceed to Counter 4.");
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
        utterance.volume = 0.75;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('Audio chime notice:', err);
    }
  }, []);

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

  // Draw frame helper & sound trigger & phone in hand overlay
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

      // Original clean frame rendering - zero artificial overlays
    }

    // Trigger notification chime when passing the notification moment (~frames 95 - 110)
    if (clampedIndex >= 95 && clampedIndex <= 110) {
      if (Math.abs(lastChimeFrameRef.current - clampedIndex) > 50) {
        lastChimeFrameRef.current = clampedIndex;
        playNotificationChime();
      }
    } else if (clampedIndex < 30 || clampedIndex > 200) {
      lastChimeFrameRef.current = -1;
    }
  }, [playNotificationChime]);

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

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isSoundOn;
    setIsSoundOn(nextState);
    if (nextState) {
      getAudioContext();
      playNotificationChime();
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
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

      {/* Bottom Controls: Sound On/Off & Play/Pause */}
      <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
        {/* Sound Toggle Button */}
        <button
          onClick={toggleSound}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer backdrop-blur-md ${
            isSoundOn 
              ? 'bg-emerald-700 text-white hover:bg-emerald-800' 
              : 'bg-[#141312]/85 text-[#EAE5DE] hover:bg-[#141312]'
          }`}
          title={isSoundOn ? "Mute notification sound" : "Enable notification sound & calm chime"}
        >
          {isSoundOn ? <Volume2 size={13} className="text-white" /> : <VolumeX size={13} className="text-zinc-400" />}
          <span>{isSoundOn ? 'Sound On' : 'Sound Off'}</span>
        </button>

        {/* Auto-Play / Pause Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-[#141312]/85 hover:bg-[#141312] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer backdrop-blur-md"
        >
          {isPlaying ? <Pause size={13} className="text-amber-400" /> : <Play size={13} className="text-emerald-400" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>
      </div>
    </div>
  );
};
