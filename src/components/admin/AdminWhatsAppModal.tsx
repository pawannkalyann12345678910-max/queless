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
  Send,
  MessageSquare
} from 'lucide-react';

interface AdminWhatsAppModalProps {
  orgId: string;
  orgName: string;
  isOpen: boolean;
  onClose: () => void;
}

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

  const fetchStatus = async () => {
    try {
      const res = await api.getWhatsAppStatus(sessionId);
      setStatus(res.status);
      setQrCodeUrl(res.qrCodeUrl);
      setUserNumber(res.userNumber);
    } catch (err: any) {
      console.warn('WhatsApp status poll error:', err);
    }
  };

  // Poll status when modal is open and in connecting/QR state
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
      setError(err.message || 'Failed to start WhatsApp gateway');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect this WhatsApp account? Automated notifications will stop.')) return;
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

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      setError('Please enter a valid phone number for the test.');
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
        customText: `🎟️ Queless Test Notice: WhatsApp integration for ${orgName} is working successfully!`
      });
      if (res.success && res.connected) {
        setTestSuccess(`Message sent successfully from +${res.sender} to ${res.recipient}!`);
      } else if (res.directWaLink) {
        window.open(res.directWaLink, '_blank');
        setTestSuccess('Opened 1-click WhatsApp link in new tab.');
      } else {
        setError(res.message || 'Delivery error');
      }
    } catch (err: any) {
      setError(err.message || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin WhatsApp Gateway"
      subtitle={`Automated Turn Alerts & Pass Confirmations for ${orgName}`}
      maxWidth="lg"
    >
      <div className="space-y-6 pt-2">
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Connection Status Banner */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              status === 'CONNECTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-700'
            }`}>
              <MessageSquare size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-black">WhatsApp Web Gateway</span>
                {status === 'CONNECTED' ? (
                  <Badge variant="emerald" size="sm" dot>Connected</Badge>
                ) : status === 'QR_READY' ? (
                  <Badge variant="amber" size="sm" dot>Scan QR Code</Badge>
                ) : status === 'CONNECTING' ? (
                  <Badge variant="neutral" size="sm" dot>Connecting...</Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Disconnected</Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {status === 'CONNECTED' 
                  ? `Active bot linked to +${userNumber}`
                  : 'Link WhatsApp once to auto-notify customers when their turn is called.'}
              </p>
            </div>
          </div>

          {status === 'CONNECTED' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              isLoading={loading}
              leftIcon={<PowerOff size={14} />}
              className="text-red-600 hover:bg-red-50 text-xs font-bold"
            >
              Disconnect
            </Button>
          ) : (
            <Button
              variant="emerald"
              size="sm"
              onClick={handleConnect}
              isLoading={loading}
              leftIcon={<QrCode size={15} />}
              className="font-bold text-xs"
            >
              {status === 'QR_READY' ? 'Refresh QR' : 'Connect WhatsApp'}
            </Button>
          )}
        </div>

        {/* QR Code Scanner Stage */}
        {(status === 'QR_READY' || status === 'CONNECTING') && (
          <div className="border border-zinc-200 rounded-2xl p-6 bg-white flex flex-col items-center text-center space-y-4">
            <h4 className="text-base font-black text-black">Scan QR Code with WhatsApp</h4>
            
            {qrCodeUrl ? (
              <div className="p-3 bg-white border-2 border-zinc-900 rounded-2xl shadow-md">
                <img src={qrCodeUrl} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
              </div>
            ) : (
              <div className="w-64 h-64 border border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center text-zinc-400 space-y-2">
                <RefreshCw size={24} className="animate-spin text-zinc-600" />
                <span className="text-xs font-medium">Generating WhatsApp QR...</span>
              </div>
            )}

            {/* Step-by-Step Instructions */}
            <div className="text-left bg-zinc-50 p-4 rounded-xl border border-zinc-200 w-full max-w-md text-xs space-y-2 text-zinc-600">
              <div className="font-bold text-black flex items-center gap-1.5">
                <Smartphone size={14} className="text-zinc-700" />
                <span>How to connect:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Open <b>WhatsApp</b> on your mobile phone.</li>
                <li>Tap <b>Settings</b> (or 3 dots menu) &gt; <b>Linked Devices</b>.</li>
                <li>Tap <b>Link a Device</b> and point your camera at this QR code.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Connected Success Stage */}
        {status === 'CONNECTED' && (
          <div className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-950">WhatsApp Bot Active &amp; Ready</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Customers will automatically receive instant WhatsApp updates when staff members call their token or when 5 minutes are remaining.
                </p>
              </div>
            </div>

            {/* Test WhatsApp Message */}
            <form onSubmit={handleSendTest} className="pt-2 border-t border-emerald-200/60 flex items-center gap-2">
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Enter test phone number (+91...)"
                className="flex-1 px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={loading}
                leftIcon={<Send size={13} />}
                className="font-bold bg-black text-white text-xs"
              >
                Send Test
              </Button>
            </form>

            {testSuccess && (
              <p className="text-xs text-emerald-700 font-bold">{testSuccess}</p>
            )}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button variant="secondary" size="md" onClick={onClose} className="px-6">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
