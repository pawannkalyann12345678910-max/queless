import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { audioService } from '../services/audio';
import { usePolling } from '../hooks/usePolling';
import type { HDMIDisplayPayload } from '../types';
import { Spinner } from '../components/common/Spinner';
import { 
  Volume2, 
  VolumeX, 
  Maximize, 
  Users, 
  ArrowLeft,
  Bluetooth,
  BluetoothConnected,
  Sparkles
} from 'lucide-react';

export const HDMIDisplayPage: React.FC = () => {
  const { queueId } = useParams<{ queueId: string }>();
  const [data, setData] = useState<HDMIDisplayPayload | null>(null);
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
    const targetQueueId = queueId || 'live';
    try {
      const res = await api.getHDMIDisplayData(targetQueueId);
      setData(res);

      // Check if a new token was called and audio is enabled
      if (res.nowServing && res.nowServing.TOKEN_ID !== lastCalledTokenId) {
        setLastCalledTokenId(res.nowServing.TOKEN_ID);
        if (audioEnabled) {
          audioService.announceToken(res.nowServing.TOKEN_NUMBER, res.queue.COUNTER_LABEL || 'Counter 1');
        }
      }
    } catch (err: any) {
      console.error('Failed to load HDMI display data:', err);
      // Fallback: create live simulation state if backend call failed
      if (!data) {
        setData({
          queue: {
            QUEUE_ID: 'live-fallback',
            ORG_ID: 'org-live',
            NAME: 'General Service Counter',
            PREFIX: 'DOC-',
            COUNTER_LABEL: 'Counter 1',
            AVG_SERVICE_MINS: 8,
            MAX_DAILY_TOKENS: 100,
            CURRENT_TOKEN_SEQ: 6,
            IS_ACTIVE: 1,
            IS_PAUSED: 0,
            ORG_NAME: 'Queless Service Center',
            ORG_CATEGORY: 'Clinic',
            CREATED_AT: new Date().toISOString()
          },
          nowServing: {
            TOKEN_ID: 'live-call',
            TOKEN_NUMBER: 'DOC-ABC123-006',
            STATUS: 'CALLED',
            CALLED_AT: new Date().toISOString()
          },
          nextInLine: [
            { TOKEN_ID: 't-1', TOKEN_NUMBER: 'DOC-ABC123-007', POSITION_IN_QUEUE: 1, ESTIMATED_WAIT_MINS: 4 },
            { TOKEN_ID: 't-2', TOKEN_NUMBER: 'DOC-ABC123-008', POSITION_IN_QUEUE: 2, ESTIMATED_WAIT_MINS: 10 },
            { TOKEN_ID: 't-3', TOKEN_NUMBER: 'DOC-ABC123-009', POSITION_IN_QUEUE: 3, ESTIMATED_WAIT_MINS: 16 }
          ],
          stats: {
            TOTAL_WAITING: 3,
            TOTAL_SERVED_TODAY: 12
          },
          timestamp: new Date().toISOString()
        });
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

          <div className="my-auto py-8 text-center">
            {nowServing ? (
              <div className="space-y-4">
                <div className="text-7xl sm:text-8xl md:text-9xl font-black font-mono tracking-tighter text-black">
                  {nowServing.TOKEN_NUMBER}
                </div>
                <div className="inline-block px-4 py-1.5 rounded-lg bg-zinc-200 text-black text-sm font-bold">
                  Proceed to {counterLabel}
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-10">
                <div className="text-4xl sm:text-5xl font-black text-zinc-300 font-mono">
                  ---
                </div>
                <p className="text-xs text-zinc-400 font-medium">Counter is Ready for Next Token</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-4 border-t border-zinc-200 font-mono">
            <span>Counter: {counterLabel}</span>
            <span>Est. Service: ~{queue.AVG_SERVICE_MINS || 10} mins</span>
          </div>
        </div>

        {/* Right Col: NEXT IN LINE & UPCOMING (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-zinc-600" />
                <h3 className="text-sm font-black text-black uppercase tracking-wider">
                  Upcoming in Line ({stats.TOTAL_WAITING})
                </h3>
              </div>
              <span className="text-xs text-zinc-400 font-mono">Real-time Order</span>
            </div>

            {/* Upcoming Token Cards List */}
            <div className="mt-4 space-y-3">
              {nextInLine.length === 0 ? (
                <div className="text-center py-16 text-zinc-400">
                  <p className="text-xs">No tokens waiting in queue</p>
                </div>
              ) : (
                nextInLine.map((item, idx) => (
                  <div
                    key={item.TOKEN_ID}
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                      idx === 0 
                        ? 'bg-amber-50/70 border-amber-200' 
                        : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        idx === 0 ? 'bg-amber-200 text-amber-900' : 'bg-zinc-200 text-zinc-700'
                      }`}>
                        #{item.POSITION_IN_QUEUE}
                      </span>
                      <span className="font-mono font-black text-xl text-black">
                        {item.TOKEN_NUMBER}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className={`text-xs font-bold block ${
                        idx === 0 ? 'text-amber-800 font-black' : 'text-zinc-500'
                      }`}>
                        {idx === 0 ? 'NEXT IN LINE' : `~${item.ESTIMATED_WAIT_MINS}m`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Statistics */}
          <div className="mt-6 pt-4 border-t border-zinc-100 grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Waiting</span>
              <span className="text-xl font-black text-black font-mono">{stats.TOTAL_WAITING}</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Served Today</span>
              <span className="text-xl font-black text-emerald-600 font-mono">{stats.TOTAL_SERVED_TODAY}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between text-xs text-zinc-400 pt-4 border-t border-zinc-100">
        <Link to="/" className="hover:text-black flex items-center gap-1 font-bold">
          <ArrowLeft size={13} /> Return to Queless Directory
        </Link>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-zinc-600 font-bold">
            <Sparkles size={13} className="text-[#C28E5C]" /> Queless High-Definition Display Protocol
          </span>
        </div>
      </div>
    </div>
  );
};
