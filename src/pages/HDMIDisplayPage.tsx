import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { audioService } from '../services/audio';
import { usePolling } from '../hooks/usePolling';
import type { HDMIDisplayPayload } from '../types';
import { Spinner } from '../components/common/Spinner';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Users, 
  ArrowLeft 
} from 'lucide-react';

export const HDMIDisplayPage: React.FC = () => {
  const { queueId } = useParams<{ queueId: string }>();
  const [data, setData] = useState<HDMIDisplayPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastCalledTokenId, setLastCalledTokenId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Live Clock interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll HDMI display data every 3 seconds
  usePolling(async () => {
    if (!queueId) return;
    try {
      const res = await api.getHDMIDisplayData(queueId);
      setData(res);
      setError(null);

      // Check if a new token was called and audio is enabled
      if (res.nowServing && res.nowServing.TOKEN_ID !== lastCalledTokenId) {
        setLastCalledTokenId(res.nowServing.TOKEN_ID);
        if (audioEnabled) {
          audioService.announceToken(res.nowServing.TOKEN_NUMBER, res.queue.COUNTER_LABEL || 'Counter 1');
        }
      }
    } catch (err: any) {
      console.error('Failed to load HDMI display data:', err);
      if (!data) {
        setError(err.message || 'Counter queue screen not found');
      }
    }
  }, 3000);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center p-8 text-white text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
          <Tv size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Display Screen Not Found</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{error}</p>
        <Link to="/" className="text-xs text-indigo-400 hover:text-white underline flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back to Queless Directory
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center p-8 text-white">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400 mt-4 font-mono">Connecting to Live Counter Display Screen...</p>
      </div>
    );
  }

  const { queue, nowServing, nextInLine, stats } = data;
  const orgName = queue.ORG_NAME || 'Service Counter';
  const queueName = queue.NAME || 'General Queue';
  const counterLabel = queue.COUNTER_LABEL || 'Counter 1';

  return (
    <div className="min-h-screen bg-[#050811] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          {queue.ORG_LOGO_URL ? (
            <img
              src={queue.ORG_LOGO_URL}
              alt={orgName}
              className="w-16 h-16 rounded-2xl object-cover border border-white/20 bg-slate-900 shadow-xl"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 border border-indigo-400 flex items-center justify-center font-black text-2xl text-white shadow-xl">
              {orgName.charAt(0)}
            </div>
          )}

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 block mb-0.5">
              {orgName} {queue.ORG_CATEGORY ? `• ${queue.ORG_CATEGORY}` : ''}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {queueName} ({counterLabel})
            </h1>
          </div>
        </div>

        {/* Live Clock & Screen Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right font-mono">
            <div className="text-2xl sm:text-3xl font-black text-slate-100">{currentTime}</div>
            <div className="flex items-center gap-1.5 justify-end text-[11px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE DISPLAY
            </div>
          </div>

          <div className="flex items-center gap-2 pl-4 border-l border-white/10">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? "Voice Broadcast: ON" : "Voice Broadcast: MUTED"}
              className={`p-3 rounded-2xl border transition-colors ${
                audioEnabled 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-slate-900 text-slate-500 border-white/10'
              }`}
            >
              {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            <button
              onClick={toggleFullscreen}
              title="Fullscreen Mode (F11)"
              className="p-3 rounded-2xl bg-slate-900 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual Grid: NOW SERVING vs NEXT IN LINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 flex-1 items-stretch">
        {/* Left Col: Giant NOW SERVING Board (7 cols) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-slate-950/95 border-2 border-indigo-500/50 rounded-3xl p-8 sm:p-12 flex flex-col justify-between shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Tv size={180} />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-black text-xs uppercase tracking-widest mb-4">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              NOW CALLING & SERVING
            </div>
          </div>

          <div className="my-auto py-6 text-center">
            {nowServing ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-7xl sm:text-9xl font-black font-mono tracking-tight text-white drop-shadow-[0_10px_35px_rgba(99,102,241,0.6)]">
                  {nowServing.TOKEN_NUMBER}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 tracking-tight">
                  ➔ PLEASE PROCEED TO {counterLabel.toUpperCase()} ➔
                </div>
              </div>
            ) : (
              <div className="py-12">
                <span className="text-6xl font-mono font-bold text-slate-600">---</span>
                <p className="text-lg text-slate-400 mt-4 font-semibold">Waiting for next customer call...</p>
              </div>
            )}
          </div>

          {/* Bottom stats within Now Serving */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Avg Consultation Speed: ~{queue.AVG_SERVICE_MINS || 10}m / token</span>
            <span>Audio Announcement: {audioEnabled ? 'Active 🔊' : 'Muted 🔇'}</span>
          </div>
        </div>

        {/* Right Col: NEXT IN LINE & Up Next (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-7 flex-1 shadow-xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className="text-amber-400" size={18} /> NEXT IN LINE
              </h3>
              <span className="text-xs font-bold font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                {stats.TOTAL_WAITING} In Line
              </span>
            </div>

            {nextInLine.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No upcoming tokens waiting.
              </div>
            ) : (
              <div className="space-y-3">
                {nextInLine.map((t, idx) => (
                  <div
                    key={t.TOKEN_ID}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-indigo-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      <span className="text-2xl font-black font-mono text-white tracking-tight">
                        {t.TOKEN_NUMBER}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        ~{t.ESTIMATED_WAIT_MINS} mins
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Total throughput */}
          <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between text-xs">
            <span className="text-emerald-300 font-semibold">Total Served Today:</span>
            <span className="text-lg font-black font-mono text-white">{stats.TOTAL_SERVED_TODAY} visitors</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer with QR Code for walk-ins */}
      <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-md flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950" fill="currentColor">
              <rect x="0" y="0" width="30" height="30" />
              <rect x="5" y="5" width="20" height="20" fill="white" />
              <rect x="10" y="10" width="10" height="10" />
              <rect x="70" y="0" width="30" height="30" />
              <rect x="75" y="5" width="20" height="20" fill="white" />
              <rect x="80" y="10" width="10" height="10" />
              <rect x="0" y="70" width="30" height="30" />
              <rect x="5" y="75" width="20" height="20" fill="white" />
              <rect x="10" y="80" width="10" height="10" />
              <rect x="40" y="20" width="10" height="20" />
              <rect x="50" y="10" width="10" height="10" />
              <rect x="35" y="60" width="30" height="10" />
              <rect x="70" y="50" width="20" height="20" />
              <rect x="45" y="45" width="10" height="10" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-white text-sm">Join the Queue from Your Smartphone</p>
            <p className="text-slate-400 text-xs">Scan or visit <strong>{window.location.origin}</strong> to track your live position from home or waiting area.</p>
          </div>
        </div>

        <div className="font-mono text-slate-500 text-[11px]">
          POWERED BY QUELESS • ORACLE PROTOCOL ENGINE
        </div>
      </div>
    </div>
  );
};
