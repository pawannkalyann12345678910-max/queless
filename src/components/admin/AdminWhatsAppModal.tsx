import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  PowerOff, 
  MessageSquare,
  ShieldCheck,
  Zap,
  Check,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminWhatsAppModalProps {
  orgId: string;
  orgName: string;
  isOpen: boolean;
  onClose: () => void;
}

const QR_REFRESH_INTERVAL_SECS = 20;

export const AdminWhatsAppModal: React.FC<AdminWhatsAppModalProps> = ({
  orgId,
  orgName,
  isOpen,
  onClose
}) => {
  const sessionId = `admin_${orgId}`;
  const [status, setStatus] = useState<'DISCONNECTED' | 'QR_READY' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [userNumber, setUserNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testSuccess, setTestSuccess] = useState('');
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
      console.warn('Admin WhatsApp status error:', err);
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
      setError(err.message || 'Failed to start admin WhatsApp gateway');
    } finally {
      if (!isAutoRefresh) setLoading(false);
    }
  };

  // 1. Auto-initiate connection on open if disconnected
  useEffect(() => {
    if (!isOpen) return;

    fetchStatus();

    const autoInit = setTimeout(() => {
      if (status === 'DISCONNECTED') {
        handleConnect(false);
      }
    }, 300);

    return () => clearTimeout(autoInit);
  }, [isOpen]);

  // 2. Status polling interval
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
          // Automatic silent refresh without manual user action
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
    if (!window.confirm('Disconnect this organization WhatsApp? Turn alerts will stop.')) return;
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

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      setError('Please enter a phone number to test message delivery.');
      return;
    }
    setLoading(true);
    setTestSuccess('');
    setError('');
    try {
      const res = await api.sendTokenWhatsAppAlert({
        orgId,
        tokenId: 'test',
        phone: testPhone.trim(),
        messageType: 'CUSTOM',
        customText: `🎟️ Queless Test Alert: Automated WhatsApp bot for ${orgName} is active and dispatching real-time turn reminders!`
      });
      if (res.success && res.connected) {
        setTestSuccess(`Message sent successfully from +${res.sender} to ${res.recipient}!`);
        confetti({ particleCount: 50, spread: 60 });
      } else if (res.directWaLink) {
        window.open(res.directWaLink, '_blank');
        setTestSuccess('Opened 1-click WhatsApp web link.');
      } else {
        setError(res.message || 'Delivery error');
      }
    } catch (err: any) {
      setError(err.message || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

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
      title="Admin WhatsApp Notification Gateway"
      subtitle={`Automated Turn Reminders & Digital Pass Confirmations for ${orgName}`}
      maxWidth="lg"
    >
      <div className="space-y-6 pt-2">
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
                <span className="text-sm font-black text-[#141312]">WhatsApp Web Gateway</span>
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
                  ? `Active automated bot linked to +${userNumber}`
                  : 'Link WhatsApp once to auto-notify customers when their turn arrives.'}
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
              Disconnect
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

        {/* QR Code Scanner Stage with Automatic 20-Second Refresh */}
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
                  alt="WhatsApp Web QR Code" 
                  className="w-60 h-60 object-contain rounded-2xl transition-opacity duration-300" 
                />
              ) : (
                <div className="w-60 h-60 flex flex-col items-center justify-center text-[#736E66] space-y-2">
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
            <div className="text-left bg-[#FAF7F2] p-4 rounded-2xl border border-[#EAE5DE] w-full max-w-md text-xs space-y-2 text-[#736E66]">
              <div className="font-bold text-[#141312] flex items-center gap-1.5">
                <Smartphone size={14} className="text-[#C28E5C]" />
                <span>How to link organization phone:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 leading-relaxed">
                <li>Open <strong>WhatsApp</strong> on your phone.</li>
                <li>Tap <strong>Settings</strong> (or ⋮ menu) &gt; <strong>Linked Devices</strong>.</li>
                <li>Tap <strong>Link a Device</strong> and point your camera at this QR code.</li>
              </ol>
            </div>

            {/* Quick Test Pair Button */}
            <div className="w-full max-w-md pt-1">
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

        {/* Connected Success View & Live Test Dispatcher */}
        {status === 'CONNECTED' && (
          <div className="border border-emerald-200 bg-emerald-50/60 rounded-3xl p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-950">WhatsApp Bot Active & Running!</h4>
                <p className="text-xs text-emerald-800">
                  Linked to <strong>+{userNumber || '918747087477'}</strong>. All customer pass updates and proximity reminders will dispatch automatically.
                </p>
              </div>
            </div>

            {/* Test WhatsApp Dispatch Form */}
            <form onSubmit={handleSendTest} className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-3 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#141312] block">
                Send Live Test Message
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  placeholder="e.g. 918747087477 or 8310066760"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs bg-[#FAF7F2] border border-[#EAE5DE] rounded-xl text-[#141312] placeholder-[#9E988E] focus:outline-none focus:ring-1 focus:ring-[#141312]"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={loading}
                  leftIcon={<Send size={13} />}
                  className="bg-[#141312] hover:bg-[#262422] text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                >
                  Send Test
                </Button>
              </div>

              {testSuccess && (
                <div className="p-2.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>{testSuccess}</span>
                </div>
              )}
            </form>
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
