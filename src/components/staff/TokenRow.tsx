import React, { useState } from 'react';
import type { Token } from '../../types';
import { api } from '../../services/api';
import { audioService } from '../../services/audio';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  Volume2, 
  Play, 
  CheckCircle, 
  AlertOctagon, 
  ArrowRightLeft, 
  Phone, 
  Check,
  X,
  MessageSquare
} from 'lucide-react';

interface TokenRowProps {
  token: Token;
  counterLabel: string;
  onRefresh: () => void;
  onTransferClick: (token: Token) => void;
}

export const TokenRow: React.FC<TokenRowProps> = ({
  token,
  counterLabel,
  onRefresh,
  onTransferClick
}) => {
  const [loading, setLoading] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  // Button 1: Call Next / Re-Chime
  const handleCall = async () => {
    setLoading(true);
    try {
      if (token.STATUS === 'CALLED') {
        audioService.announceToken(token.TOKEN_NUMBER, counterLabel);
      } else {
        await api.callToken(token.TOKEN_ID);
        audioService.announceToken(token.TOKEN_NUMBER, counterLabel);
        
        // Auto-send WhatsApp turn alert if phone is present
        if (token.CUSTOMER_PHONE) {
          api.sendTokenWhatsAppAlert({
            tokenId: token.TOKEN_ID,
            queueId: token.QUEUE_ID,
            messageType: 'CALL'
          }).catch(err => console.warn('Auto WhatsApp notice:', err));
        }

        onRefresh();
      }
    } catch (err: any) {
      alert(err.message || 'Call failed');
    } finally {
      setLoading(false);
    }
  };

  // Dedicated WhatsApp Notify Button (Sends via Background Bot)
  const handleNotifyWhatsApp = async () => {
    if (!token.CUSTOMER_PHONE) {
      alert('This customer did not provide a mobile phone number.');
      return;
    }

    setNotifyLoading(true);
    try {
      const res = await api.sendTokenWhatsAppAlert({
        tokenId: token.TOKEN_ID,
        queueId: token.QUEUE_ID,
        messageType: isCalled ? 'CALL' : isWaiting ? 'ADVANCE_5M' : 'CALL'
      });

      if (res.connected && res.success) {
        setNotifySuccess(true);
        setTimeout(() => setNotifySuccess(false), 3500);
      } else {
        alert(res.message || 'WhatsApp is not connected yet. Please click "Connect WhatsApp" at the top of the desk to scan the QR code and link your WhatsApp number.');
      }
    } catch (err: any) {
      alert(err.message || 'Could not send WhatsApp alert. Please make sure WhatsApp is connected.');
    } finally {
      setNotifyLoading(false);
    }
  };

  // Button 2: Start Serving
  const handleServe = async () => {
    setLoading(true);
    try {
      await api.serveToken(token.TOKEN_ID);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Serve failed');
    } finally {
      setLoading(false);
    }
  };

  // Button 3: Complete Service
  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.completeToken(token.TOKEN_ID);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Complete failed');
    } finally {
      setLoading(false);
    }
  };

  // Button 4: Mark No-Show
  const handleNoShow = async () => {
    if (!window.confirm(`Mark token ${token.TOKEN_NUMBER} as No-Show?`)) return;
    setLoading(true);
    try {
      await api.markNoShow(token.TOKEN_ID);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'No-show failed');
    } finally {
      setLoading(false);
    }
  };

  // Delay Accept
  const handleApproveDelay = async () => {
    setLoading(true);
    try {
      await api.approveDelay(token.TOKEN_ID);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Approve delay failed');
    } finally {
      setLoading(false);
    }
  };

  // Delay Reject
  const handleRejectDelay = async () => {
    setLoading(true);
    try {
      await api.rejectDelay(token.TOKEN_ID);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Reject delay failed');
    } finally {
      setLoading(false);
    }
  };

  const isWaiting = token.STATUS === 'WAITING';
  const isCalled = token.STATUS === 'CALLED';
  const isServing = token.STATUS === 'SERVING';
  const hasDelayRequest = token.DELAY_STATUS === 'REQUESTED_5M';

  return (
    <tr className={`border-b border-zinc-100 transition-colors ${
      isCalled ? 'bg-blue-50/50' :
      isServing ? 'bg-emerald-50/40' :
      hasDelayRequest ? 'bg-amber-50/50' : 'hover:bg-zinc-50/60'
    }`}>
      {/* Token Number */}
      <td className="py-4 px-4 font-mono font-black text-base text-black">
        <div className="flex items-center gap-2">
          <span>{token.TOKEN_NUMBER}</span>
          {hasDelayRequest && (
            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.5 rounded">
              +5m Request
            </span>
          )}
        </div>
      </td>

      {/* Customer Info */}
      <td className="py-4 px-4">
        <div className="font-bold text-black text-sm">{token.CUSTOMER_NAME}</div>
        <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5 font-medium">
          <Phone size={12} className="text-zinc-400" />
          <span>{token.CUSTOMER_PHONE}</span>
        </div>
        {token.SERVICE_NOTE && (
          <div className="text-xs text-zinc-500 italic mt-0.5 truncate max-w-xs">
            "{token.SERVICE_NOTE}"
          </div>
        )}
      </td>

      {/* Status Badge */}
      <td className="py-4 px-4">
        <Badge status={token.STATUS} size="sm" dot />
      </td>

      {/* Wait Time / Position */}
      <td className="py-4 px-4 text-xs font-mono text-zinc-700">
        {isWaiting ? (
          <div>
            <span className="font-bold text-black">#{token.POSITION_IN_QUEUE} in line</span>
            <span className="text-zinc-500 block font-normal">~{token.ESTIMATED_WAIT_MINS}m ETA</span>
          </div>
        ) : (
          <span className="text-zinc-400">-</span>
        )}
      </td>

      {/* Action Buttons Toolbar */}
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {/* Delay Request Review Buttons */}
          {hasDelayRequest && (
            <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-lg border border-amber-200 mr-1">
              <button
                onClick={handleApproveDelay}
                disabled={loading}
                title="Approve +5m Delay"
                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-xs flex items-center gap-1 font-bold cursor-pointer"
              >
                <Check size={13} /> Accept
              </button>
              <button
                onClick={handleRejectDelay}
                disabled={loading}
                title="Reject +5m Delay"
                className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white transition-colors text-xs flex items-center gap-1 font-bold cursor-pointer"
              >
                <X size={13} /> Reject
              </button>
            </div>
          )}

          {/* WhatsApp Notify Button */}
          {(isWaiting || isCalled) && (
            <Button
              variant={notifySuccess ? "emerald" : "secondary"}
              size="sm"
              isLoading={notifyLoading}
              onClick={handleNotifyWhatsApp}
              leftIcon={<MessageSquare size={13} className={notifySuccess ? "text-white" : "text-emerald-600"} />}
              title="Notify customer on WhatsApp"
              className="text-xs px-2.5 font-bold"
            >
              {notifySuccess ? "Notified!" : "Notify"}
            </Button>
          )}

          {/* 1. Call / Re-Chime Button */}
          {(isWaiting || isCalled) && (
            <Button
              variant={isCalled ? "secondary" : "primary"}
              size="sm"
              isLoading={loading}
              onClick={handleCall}
              leftIcon={<Volume2 size={13} />}
              className="text-xs px-2.5 font-bold"
            >
              {isCalled ? "Re-Chime" : "Call Next"}
            </Button>
          )}

          {/* 2. Start Serving Button */}
          {isCalled && (
            <Button
              variant="emerald"
              size="sm"
              isLoading={loading}
              onClick={handleServe}
              leftIcon={<Play size={13} />}
              className="text-xs px-2.5 font-bold"
            >
              Start Serving
            </Button>
          )}

          {/* 3. Complete Service Button */}
          {isServing && (
            <Button
              variant="emerald"
              size="sm"
              isLoading={loading}
              onClick={handleComplete}
              leftIcon={<CheckCircle size={13} />}
              className="text-xs px-2.5 font-bold"
            >
              Complete
            </Button>
          )}

          {/* 4. Mark No-Show Button */}
          {(isCalled || isWaiting) && (
            <Button
              variant="ghost"
              size="sm"
              isLoading={loading}
              onClick={handleNoShow}
              title="Mark No-Show"
              className="text-zinc-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
            >
              <AlertOctagon size={15} />
            </Button>
          )}

          {/* 5. Transfer Button */}
          {(isWaiting || isCalled || isServing) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTransferClick(token)}
              title="Transfer to another counter"
              className="text-zinc-400 hover:text-black hover:bg-zinc-100 p-1.5 rounded-lg"
            >
              <ArrowRightLeft size={15} />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};
