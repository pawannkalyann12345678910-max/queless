import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { 
  Smartphone, 
  AlertCircle, 
  RefreshCw, 
  PowerOff,
  MessageSquare,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StaffWhatsAppModalProps {
  queueId: string;
  counterLabel: string;
  isOpen: boolean;
  onClose: () => void;
}

const QR_REFRESH_INTERVAL_SECS = 20;

export const StaffWhatsAppModal: React.FC<StaffWhatsAppModalProps> = ({
  queueId,
  counterLabel,
  isOpen,
  onClose
}) => {
  const sessionId = `staff_${queueId}`;
  const [status, setStatus] = useState<'DISCONNECTED' | 'QR_READY' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [userNumber, setUserNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Auto-refresh countdown state (in seconds)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(QR_REFRESH_INTERVAL_SECS);
  const [autoRefreshCount, setAutoRefreshCount] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await api.getWhatsAppStatus(sessionId);
      setStatus(res.status);
      setQrCodeUrl(res.qrCodeUrl);
      setUserNumber(res.userNumber);
      if (res.status === 'CONNECTED') {
        setSecondsRemaining(QR_REFRESH_INTERVAL_SECS);
      }
    } catch (err: any) {
      console.warn('Staff WhatsApp status error:', err);
    }
  };

  const handleConnect = async (isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    setError('');
    try {
      const res = await api.connectWhatsApp(sessionId);
      setStatus(res.status || 'QR_READY');
      setQrCodeUrl(res.qrCodeUrl || null);
      setSecondsRemaining(QR_REFRESH_INTERVAL_SECS);
      if (isAutoRefresh) {
        setAutoRefreshCount(c => c + 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start staff WhatsApp gateway');
    } finally {
      if (!isAutoRefresh) setLoading(false);
    }
  };

  // 1. Auto-initiate connection when modal opens if disconnected
  useEffect(() => {
    if (!isOpen) return;

    fetchStatus();

    // If disconnected, automatically generate QR code without waiting for user click
    const autoInit = setTimeout(() => {
      if (status === 'DISCONNECTED') {
        handleConnect(false);
      }
    }, 300);

    return () => clearTimeout(autoInit);
  }, [isOpen]);

  // 2. Status Polling interval
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      if (status === 'CONNECTING' || status === 'QR_READY' || !userNumber) {
        fetchStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, status, sessionId, userNumber]);

  // 3. Automatic 20-Second QR Refresh Countdown Timer
  useEffect(() => {
    if (!isOpen || status === 'CONNECTED' || status === 'DISCONNECTED') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Automatic refresh without asking!
          handleConnect(true);
          return QR_REFRESH_INTERVAL_SECS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, status]);

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect this counter WhatsApp? Turn alerts will pause until reconnected.')) return;
    setLoading(true);
    try {
      await api.disconnectWhatsApp(sessionId);
      setStatus('DISCONNECTED');
      setQrCodeUrl(null);
      setUserNumber(null);
      setSecondsRemaining(QR_REFRESH_INTERVAL_SECS);
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  // Instant Pairing Simulator for testing without physical phone
  const handleSimulatedPair = () => {
    setStatus('CONNECTED');
    setUserNumber('918747087477');
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const progressPercent = ((QR_REFRESH_INTERVAL_SECS - secondsRemaining) / QR_REFRESH_INTERVAL_SECS) * 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Counter WhatsApp Gateway"
      subtitle={`Auto-dispatch WhatsApp turn notifications directly from ${counterLabel}`}
      maxWidth="md"
    >
      <div className="space-y-5 pt-2">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 font-medium flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Status Header */}
        <div className="p-4 bg-[#FAF7F2] border border-[#EAE5DE] rounded-2xl flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
              status === 'CONNECTED' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-[#141312] text-white shadow-xs'
            }`}>
              <MessageSquare size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#141312]">{counterLabel} WhatsApp</span>
                {status === 'CONNECTED' ? (
                  <Badge variant="emerald" size="sm" dot>Connected</Badge>
                ) : status === 'QR_READY' ? (
                  <Badge variant="amber" size="sm" dot>Scan Secure QR</Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Connecting...</Badge>
                )}
              </div>
              <p className="text-xs text-[#736E66] mt-0.5">
                {status === 'CONNECTED' 
                  ? `Active & sending from +${userNumber}`
                  : 'QR code generated automatically. Point your camera to link.'}
              </p>
            </div>
          </div>

          {status === 'CONNECTED' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              isLoading={loading}
              leftIcon={<PowerOff size={13} />}
              className="text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl cursor-pointer"
            >
              Unlink
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleConnect(false)}
              isLoading={loading}
              leftIcon={<RefreshCw size={13} className={loading ? "animate-spin" : ""} />}
              className="text-xs font-bold border-[#EAE5DE] bg-white text-[#141312] rounded-xl cursor-pointer"
            >
              Regenerate
            </Button>
          )}
        </div>

        {/* QR Code Scanner Stage with Automatic Auto-Refresh Countdown */}
        {(status === 'QR_READY' || status === 'CONNECTING' || status === 'DISCONNECTED') && (
          <div className="border border-[#EAE5DE] rounded-3xl p-6 bg-white flex flex-col items-center text-center space-y-4 shadow-xs relative overflow-hidden">
            
            {/* Auto-Refresh Timer Banner */}
            <div className="w-full bg-[#FAF7F2] rounded-2xl p-2.5 border border-[#EAE5DE] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#141312]">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Secure Baileys WhatsApp Session</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <RefreshCw size={11} className="animate-spin text-amber-700" /> Auto-refreshes in {secondsRemaining}s
                </span>
              </div>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full bg-[#EAE5DE] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#141312] h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${100 - progressPercent}%` }}
              />
            </div>

            {/* Live QR Image */}
            <div className="p-3 bg-[#FAF7F2] border-2 border-[#141312] rounded-3xl shadow-sm relative group">
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="Live Staff WhatsApp QR" 
                  className="w-56 h-56 object-contain rounded-2xl transition-opacity duration-300" 
                />
              ) : (
                <div className="w-56 h-56 flex flex-col items-center justify-center text-[#736E66] space-y-2">
                  <RefreshCw size={24} className="animate-spin text-[#141312]" />
                  <span className="text-xs font-bold">Generating Secure QR Code...</span>
                </div>
              )}

              {autoRefreshCount > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#141312]/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  Refreshed #{autoRefreshCount}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="text-left bg-[#FAF7F2] p-4 rounded-2xl border border-[#EAE5DE] w-full text-xs space-y-2 text-[#736E66]">
              <div className="font-bold text-[#141312] flex items-center gap-1.5">
                <Smartphone size={14} className="text-[#C28E5C]" />
                <span>How to scan from phone:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 leading-relaxed">
                <li>Open <strong>WhatsApp</strong> on your phone.</li>
                <li>Tap <strong>Settings</strong> (or ⋮ menu) &gt; <strong>Linked Devices</strong>.</li>
                <li>Tap <strong>Link a Device</strong> and point your camera at this QR code.</li>
              </ol>
            </div>

            {/* Quick Pair Simulator for instant developer testing */}
            <div className="w-full pt-1">
              <button
                type="button"
                onClick={handleSimulatedPair}
                className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Zap size={13} className="text-emerald-700" />
                <span>Quick Test: Instant Pair WhatsApp (Simulation Mode)</span>
              </button>
            </div>
          </div>
        )}

        {/* Connected Success View */}
        {status === 'CONNECTED' && (
          <div className="border border-emerald-200 bg-emerald-50/60 rounded-3xl p-6 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
              <Check size={24} />
            </div>
            <div>
              <h4 className="text-base font-black text-emerald-950">WhatsApp Connected Successfully!</h4>
              <p className="text-xs text-emerald-800 leading-relaxed mt-1 max-w-sm mx-auto">
                Linked to <strong>+{userNumber || '918747087477'}</strong>. When customers are called or delayed, notifications will automatically dispatch in real-time.
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button 
            variant="primary" 
            size="md" 
            onClick={onClose} 
            className="px-8 bg-[#141312] hover:bg-[#262422] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
          >
            {status === 'CONNECTED' ? 'Done' : 'Close'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
