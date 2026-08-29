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
  ArrowLeft,
  ArrowRight,
  Bluetooth,
  BluetoothConnected
} from 'lucide-react';

export const HDMIDisplayPage: React.FC = () => {
  const { queueId } = useParams<{ queueId: string }>();
  const [data, setData] = useState<HDMIDisplayPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [lastCalledTokenId, setLastCalledTokenId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-black text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-4 text-zinc-600">
          <Tv size={28} />
        </div>
        <h2 className="text-2xl font-black text-black mb-2">Display Screen Not Found</h2>
        <p className="text-sm text-zinc-500 max-w-md mb-6">{error}</p>
        <Link to="/" className="text-xs text-blue-600 hover:text-black underline flex items-center gap-1.5 font-bold">
          <ArrowLeft size={14} /> Back to Queless Directory
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-black">
        <Spinner size="lg" />
        <p className="text-sm text-zinc-500 mt-4 font-mono">Connecting to Live Counter Display Screen...</p>
      </div>
    );
  }

  const { queue, nowServing, nextInLine, stats } = data;
  const orgName = queue.ORG_NAME || 'Service Counter';
  const queueName = queue.NAME || 'General Queue';
  const counterLabel = queue.COUNTER_LABEL || 'Counter 1';

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-6">
        <div className="flex items-center gap-4">
          {queue.ORG_LOGO_URL ? (
            <img
              src={queue.ORG_LOGO_URL}
              alt={orgName}
              className="w-14 h-14 rounded-xl object-cover border border-zinc-200 bg-zinc-50 shadow-xs"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-black text-white flex items-center justify-center font-black text-2xl shadow-xs">
              {orgName.charAt(0)}
            </div>
          )}

          <div>
            <span className="text-xs font-semibold text-zinc-500 block">
              {orgName} {queue.ORG_CATEGORY ? `• ${queue.ORG_CATEGORY}` : ''}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
              {queueName} <span className="text-zinc-500 font-normal">({counterLabel})</span>
            </h1>
          </div>
        </div>

        {/* Live Clock & Screen Controls */}
        <div className="flex items-center gap-5">
          <div className="text-right font-mono">
            <div className="text-2xl sm:text-3xl font-black text-black">{currentTime}</div>
            <div className="flex items-center gap-1.5 justify-end text-xs font-medium text-emerald-700 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Live Display
            </div>
          </div>

          <div className="flex items-center gap-2 pl-4 border-l border-zinc-200">
            <button
              onClick={() => setBluetoothConnected(!bluetoothConnected)}
              title={bluetoothConnected ? "Bluetooth Screen Sync: Connected (Click to Turn OFF)" : "Bluetooth Screen Sync: Disconnected (Click to Connect)"}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                bluetoothConnected 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                  : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
              }`}
            >
              {bluetoothConnected ? <BluetoothConnected size={16} /> : <Bluetooth size={16} />}
              <span className="hidden sm:inline">{bluetoothConnected ? 'BT Linked' : 'BT Off'}</span>
            </button>

            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? "Voice Broadcast: ON" : "Voice Broadcast: MUTED"}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                audioEnabled 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-zinc-100 text-zinc-400 border-zinc-200'
              }`}
            >
              {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              onClick={toggleFullscreen}
              title="Fullscreen Mode (F11)"
              className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors cursor-pointer"
            >
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual Grid: NOW SERVING vs NEXT IN LINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 flex-1 items-stretch">
        {/* Left Col: Giant NOW SERVING Board (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-50 border border-zinc-200 rounded-2xl p-8 sm:p-12 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-black text-white font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Now Serving
            </span>
          </div>

          <div className="my-auto py-6 text-center">
            {nowServing ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-7xl sm:text-9xl font-black font-mono tracking-tight text-black">
                  {nowServing.TOKEN_NUMBER}
                </div>
                <div className="text-xl sm:text-2xl font-bold text-zinc-700 tracking-tight flex items-center justify-center gap-2">
                  <span>Please proceed to</span>
                  <span className="text-black font-black underline decoration-2">{counterLabel}</span>
                  <ArrowRight size={22} className="text-black" />
                </div>
              </div>
            ) : (
              <div className="py-12">
                <span className="text-6xl font-mono font-bold text-zinc-300">---</span>
                <p className="text-base text-zinc-500 mt-3 font-medium">Waiting for next turn call...</p>
              </div>
            )}
          </div>

          {/* Bottom stats within Now Serving */}
          <div className="pt-6 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Avg Service Time: ~{queue.AVG_SERVICE_MINS || 10}m / token</span>
            <span>Audio Voice: {audioEnabled ? 'Active' : 'Muted'}</span>
          </div>
        </div>

        {/* Right Col: NEXT IN LINE & Up Next (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 flex-1 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
                <Users className="text-zinc-700" size={16} /> Up Next
              </h3>
              <span className="text-xs font-semibold text-zinc-700 bg-white px-2.5 py-0.5 rounded-md border border-zinc-200 shadow-xs">
                {stats.TOTAL_WAITING} Waiting
              </span>
            </div>

            {nextInLine.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">
                No upcoming tokens in waiting line.
              </div>
            ) : (
              <div className="space-y-2.5">
                {nextInLine.map((t, idx) => (
                  <div
                    key={t.TOKEN_ID}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-mono font-bold text-zinc-600">
                        {idx + 1}
                      </span>
                      <span className="text-xl font-black font-mono text-black tracking-tight">
                        {t.TOKEN_NUMBER}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono text-zinc-600">
                        ~{t.ESTIMATED_WAIT_MINS}m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Total throughput */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center justify-between text-xs font-medium">
            <span className="text-zinc-600">Served Today</span>
            <span className="text-base font-black font-mono text-black">{stats.TOTAL_SERVED_TODAY} visitors</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer with QR Code for walk-ins */}
      <div className="border-t border-zinc-200 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-white rounded-lg p-1.5 shadow-xs flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
              <rect x="0" y="0" width="30" height="30" />
              <rect x="5" y="5" width="20" height="20" fill="black" />
              <rect x="10" y="10" width="10" height="10" fill="white" />
              <rect x="70" y="0" width="30" height="30" />
              <rect x="75" y="5" width="20" height="20" fill="black" />
              <rect x="80" y="10" width="10" height="10" fill="white" />
              <rect x="0" y="70" width="30" height="30" />
              <rect x="5" y="75" width="20" height="20" fill="black" />
              <rect x="10" y="80" width="10" height="10" fill="white" />
              <rect x="40" y="20" width="10" height="20" fill="white" />
              <rect x="50" y="10" width="10" height="10" fill="white" />
              <rect x="35" y="60" width="30" height="10" fill="white" />
              <rect x="70" y="50" width="20" height="20" fill="white" />
              <rect x="45" y="45" width="10" height="10" fill="white" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-black text-xs">Join Queue from Your Smartphone</p>
            <p className="text-zinc-500 text-[11px]">Scan or visit <span className="font-semibold text-black">{window.location.origin}</span> to book tokens remotely.</p>
          </div>
        </div>

        <div className="text-zinc-400 text-xs">
          Queless Digital Queue Platform
        </div>
      </div>
    </div>
  );
};
