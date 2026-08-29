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
  XCircle,
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

  // Button 4: Cancel / Void Token Pass
  const handleCancelToken = async () => {
    if (!window.confirm(`Are you sure you want to cancel pass ${token.TOKEN_NUMBER} for ${token.CUSTOMER_NAME}?`)) return;
    setLoading(true);
    try {
      await api.cancelToken(token.TOKEN_ID);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    } finally {
      setLoading(false);
    }
  };

  // Button 5: Mark No-Show
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
    <tr className={`border-b border-[#EAE5DE] transition-colors ${
      isCalled ? 'bg-amber-50/60' :
      isServing ? 'bg-emerald-50/50' :
      hasDelayRequest ? 'bg-amber-50/50' : 'hover:bg-[#FAF7F2]'
    }`}>
      {/* Token Number */}
      <td className="py-4 px-4 font-mono font-black text-base text-[#141312]">
        <div className="flex items-center gap-2">
          <span>{token.TOKEN_NUMBER}</span>
          {hasDelayRequest && (
            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.5 rounded-md">
              +5m Request
            </span>
          )}
        </div>
      </td>

      {/* Customer Info */}
      <td className="py-4 px-4">
        <div className="font-bold text-[#141312] text-sm">{token.CUSTOMER_NAME}</div>
        <div className="text-xs text-[#736E66] flex items-center gap-1.5 mt-0.5 font-medium">
          <Phone size={12} className="text-[#9E988E]" />
          <span>{token.CUSTOMER_PHONE}</span>
        </div>
        {token.SERVICE_NOTE && (
          <div className="text-xs text-[#736E66] italic mt-0.5 truncate max-w-xs">
            "{token.SERVICE_NOTE}"
          </div>
        )}
      </td>

      {/* Status Badge */}
      <td className="py-4 px-4">
        <Badge status={token.STATUS} size="sm" dot />
      </td>

      {/* Wait Time / Position */}
      <td className="py-4 px-4 text-xs font-mono text-[#736E66]">
        {isWaiting ? (
          <div>
            <span className="font-bold text-[#141312]">#{token.POSITION_IN_QUEUE} in line</span>
            <span className="text-[#736E66] block font-normal">~{token.ESTIMATED_WAIT_MINS}m ETA</span>
          </div>
        ) : (
          <span className="text-[#9E988E]">-</span>
        )}
      </td>

      {/* Action Buttons Toolbar */}
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {/* Delay Request Review Buttons */}
          {hasDelayRequest && (
            <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-xl border border-amber-200 mr-1">
              <button
                onClick={handleApproveDelay}
                disabled={loading}
                title="Approve +5m Delay"
                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-xs flex items-center gap-1 font-bold cursor-pointer"
              >
                <Check size={13} /> Accept
              </button>
              <button
                onClick={handleRejectDelay}
                disabled={loading}
                title="Reject +5m Delay"
                className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors text-xs flex items-center gap-1 font-bold cursor-pointer"
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
              leftIcon={<MessageSquare size={13} className={notifySuccess ? "text-white" : "text-emerald-700"} />}
              title="Notify customer on WhatsApp"
              className="text-xs px-2.5 font-bold border-[#EAE5DE] rounded-xl cursor-pointer"
            >
              {notifySuccess ? "Notified!" : "Notify"}
            </Button>
          )}

          {/* 1. Call Next / Re-Chime Button */}
          {(isWaiting || isCalled) && (
            <Button
              variant={isCalled ? "secondary" : "primary"}
              size="sm"
              isLoading={loading}
              onClick={handleCall}
              leftIcon={<Volume2 size={13} />}
              className={`text-xs px-2.5 font-bold rounded-xl cursor-pointer ${
                isCalled 
                  ? 'border-[#EAE5DE] bg-white hover:bg-[#FAF7F2] text-[#141312]' 
                  : 'bg-[#141312] hover:bg-[#262422] text-white'
              }`}
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
              className="text-xs px-2.5 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
            >
              Start Serving
            </Button>
          )}

          {/* 3. Direct Complete Service Button (For CALLED and SERVING tokens) */}
          {(isServing || isCalled) && (
            <Button
              variant="emerald"
              size="sm"
              isLoading={loading}
              onClick={handleComplete}
              leftIcon={<CheckCircle size={13} />}
              className="text-xs px-2.5 font-bold rounded-xl bg-[#141312] hover:bg-[#262422] text-white cursor-pointer shadow-xs"
              title="Mark customer visit as Completed"
            >
              Complete
            </Button>
          )}

          {/* 4. Staff Cancel Pass Button */}
          {(isWaiting || isCalled || isServing) && (
            <Button
              variant="ghost"
              size="sm"
              isLoading={loading}
              onClick={handleCancelToken}
              title="Cancel / Void Token Pass"
              className="text-rose-700 hover:text-rose-900 bg-rose-50/80 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl border border-rose-200/80 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <XCircle size={13} />
              <span>Cancel</span>
            </Button>
          )}

          {/* 5. Mark No-Show Button */}
          {(isCalled || isWaiting) && (
            <Button
              variant="ghost"
              size="sm"
              isLoading={loading}
              onClick={handleNoShow}
              title="Mark Customer as No-Show"
              className="text-[#736E66] hover:text-amber-700 hover:bg-amber-50 p-1.5 rounded-xl border border-transparent hover:border-amber-200 cursor-pointer"
            >
              <AlertOctagon size={15} />
            </Button>
          )}

          {/* 6. Transfer Button */}
          {(isWaiting || isCalled || isServing) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTransferClick(token)}
              title="Transfer to another counter"
              className="text-[#736E66] hover:text-[#141312] hover:bg-[#FAF7F2] p-1.5 rounded-xl border border-transparent hover:border-[#EAE5DE] cursor-pointer"
            >
              <ArrowRightLeft size={15} />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};
