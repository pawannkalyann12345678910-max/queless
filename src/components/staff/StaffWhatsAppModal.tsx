import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { 
  QrCode, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  PowerOff,
  MessageSquare
} from 'lucide-react';

interface StaffWhatsAppModalProps {
  queueId: string;
  counterLabel: string;
  isOpen: boolean;
  onClose: () => void;
}

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

  const fetchStatus = async () => {
    try {
      const res = await api.getWhatsAppStatus(sessionId);
      setStatus(res.status);
      setQrCodeUrl(res.qrCodeUrl);
      setUserNumber(res.userNumber);
    } catch (err: any) {
      console.warn('Staff WhatsApp status error:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchStatus();

    const interval = setInterval(() => {
      if (status === 'CONNECTING' || status === 'QR_READY' || !userNumber) {
        fetchStatus();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, status, sessionId, userNumber]);

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.connectWhatsApp(sessionId);
      setStatus(res.status || 'CONNECTING');
      setQrCodeUrl(res.qrCodeUrl || null);
    } catch (err: any) {
      setError(err.message || 'Failed to start staff WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect this counter WhatsApp? Calls will fallback to Admin WhatsApp.')) return;
    setLoading(true);
    try {
      await api.disconnectWhatsApp(sessionId);
      setStatus('DISCONNECTED');
      setQrCodeUrl(null);
      setUserNumber(null);
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Counter WhatsApp"
      subtitle={`Send turn alerts to customers directly from ${counterLabel}`}
      maxWidth="md"
    >
      <div className="space-y-5 pt-2">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              status === 'CONNECTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-700'
            }`}>
              <MessageSquare size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-black">{counterLabel} WhatsApp</span>
                {status === 'CONNECTED' ? (
                  <Badge variant="emerald" size="sm" dot>Active</Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Not Linked</Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {status === 'CONNECTED' 
                  ? `Linked to +${userNumber}`
                  : 'Scan QR code to send messages directly from your WhatsApp number.'}
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
              className="text-red-600 hover:bg-red-50 text-xs font-bold"
            >
              Unlink
            </Button>
          ) : (
            <Button
              variant="emerald"
              size="sm"
              onClick={handleConnect}
              isLoading={loading}
              leftIcon={<QrCode size={14} />}
              className="font-bold text-xs"
            >
              {status === 'QR_READY' ? 'Refresh QR' : 'Link WhatsApp'}
            </Button>
          )}
        </div>

        {(status === 'QR_READY' || status === 'CONNECTING') && (
          <div className="border border-zinc-200 rounded-2xl p-5 bg-white flex flex-col items-center text-center space-y-4">
            <h4 className="text-sm font-black text-black">Scan with Counter WhatsApp</h4>
            
            {qrCodeUrl ? (
              <div className="p-2.5 bg-white border-2 border-zinc-900 rounded-xl shadow-xs">
                <img src={qrCodeUrl} alt="Staff WhatsApp QR" className="w-52 h-52 object-contain" />
              </div>
            ) : (
              <div className="w-52 h-52 border border-dashed border-zinc-300 rounded-xl flex flex-col items-center justify-center text-zinc-400 space-y-2">
                <RefreshCw size={20} className="animate-spin text-zinc-600" />
                <span className="text-xs font-medium">Generating QR...</span>
              </div>
            )}

            <div className="text-left bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 w-full text-xs space-y-1.5 text-zinc-600">
              <div className="font-bold text-black flex items-center gap-1.5">
                <Smartphone size={13} className="text-zinc-700" />
                <span>Instructions:</span>
              </div>
              <p>1. Open WhatsApp &gt; <b>Linked Devices</b> &gt; <b>Link a Device</b></p>
              <p>2. Scan this QR code to connect.</p>
            </div>
          </div>
        )}

        {status === 'CONNECTED' && (
          <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-950 font-medium">
              This counter is connected! When you click <b>Notify</b> or <b>Call Next</b>, notifications will be sent directly from your WhatsApp.
            </p>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button variant="secondary" size="md" onClick={onClose} className="px-6">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
