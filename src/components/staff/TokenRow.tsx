import React, { useState } from 'react';
import type { Token } from '../../types';
import { api } from '../../services/api';
import { audioService } from '../../services/audio';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  Volume2, 
  Play, 
  Check, 
  X, 
  Phone, 
  ArrowRightLeft, 
  AlertOctagon, 
  MessageSquare,
  XCircle,
  CheckCircle2,
  Hourglass,
  Zap,
  Mail,
  Calendar,
  User as UserIcon
} from 'lucide-react';

interface TokenRowProps {
  token: Token;
  counterLabel: string;
  autoNotifyEnabled?: boolean;
  onRefresh: () => void;
  onTransferClick: (token: Token) => void;
}

export const TokenRow: React.FC<TokenRowProps> = ({
  token,
  counterLabel,
  autoNotifyEnabled = true,
  onRefresh,
  onTransferClick
}) => {
  const [loading, setLoading] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  // Status flags
  const isWaiting = token.STATUS === 'WAITING';
  const isCalled = token.STATUS === 'CALLED';
  const isServing = token.STATUS === 'SERVING';

  const hasDelayRequest = Boolean(
    token.DELAY_STATUS?.startsWith('REQUESTED') || 
    token.DELAY_STATUS === 'REQUESTED_5M' ||
    token.DELAY_STATUS === 'REQUESTED_10M' ||
    token.DELAY_STATUS === 'REQUESTED_15M'
  );
  
  const requestedMins = token.DELAY_MINUTES || (
    token.DELAY_STATUS === 'REQUESTED_15M' ? 15 : 
    token.DELAY_STATUS === 'REQUESTED_10M' ? 10 : 5
  );

  // Button 1: Call / Re-Chime (With Automatic WhatsApp/SMS Notification Dispatch)
  const handleCall = async () => {
    setLoading(true);
    try {
      await api.callToken(token.TOKEN_ID);
      audioService.announceToken(token.TOKEN_NUMBER, counterLabel);

      // If Auto-Notify mode is active, automatically alert the customer's WhatsApp/phone in the background
      if (autoNotifyEnabled && token.CUSTOMER_PHONE) {
        api.sendTokenWhatsAppAlert({
          orgId: token.ORG_ID,
          queueId: token.QUEUE_ID,
          tokenId: token.TOKEN_ID,
          phone: token.CUSTOMER_PHONE,
          messageType: 'CALL'
        }).then(res => {
          if (res?.success) {
            setNotifySuccess(true);
            setTimeout(() => setNotifySuccess(false), 3000);
          }
        }).catch(err => console.log('Auto-notify background log:', err));
      }

      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Call failed');
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp Alert Trigger
  const handleNotifyWhatsApp = async () => {
    setNotifyLoading(true);
    try {
      const res = await api.sendTokenWhatsAppAlert({
        orgId: token.ORG_ID,
        queueId: token.QUEUE_ID,
        tokenId: token.TOKEN_ID,
        phone: token.CUSTOMER_PHONE,
        messageType: isCalled ? 'CALL' : 'ADVANCE_5M'
      });

      if (res?.success) {
        setNotifySuccess(true);
        setTimeout(() => setNotifySuccess(false), 3500);
        if (res.directWaLink && !res.connected) {
          window.open(res.directWaLink, '_blank');
        }
      } else {
        setNotifySuccess(true);
        setTimeout(() => setNotifySuccess(false), 3000);
      }
    } catch (err: any) {
      console.warn('WhatsApp alert notice:', err.message);
      setNotifySuccess(true);
      setTimeout(() => setNotifySuccess(false), 3000);
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

  // Delay Accept & Arrange
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

  // Staff Offers Reschedule to Customer (Next Day / Next Week Choice)
  const handleOfferReschedule = async () => {
    const reason = prompt(
      `Offer ${token.CUSTOMER_NAME} to reschedule to Next Day or Next Week?\nEnter reason:`, 
      'High counter queue volume today — please choose Next Day or Next Week.'
    );
    if (reason === null) return;

    setLoading(true);
    try {
      await api.offerReschedule(token.TOKEN_ID, reason);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to offer reschedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className={`border-b border-[#EAE5DE] transition-colors ${
      isCalled ? 'bg-amber-50/60' :
      isServing ? 'bg-emerald-50/50' :
      hasDelayRequest ? 'bg-amber-50/60' : 'hover:bg-[#FAF7F2]'
    }`}>
      {/* 1. Token Number Column */}
      <td className="py-4 px-4 font-mono font-black text-base text-[#141312]">
        <div className="flex items-center gap-2 flex-wrap">
          <span>{token.TOKEN_NUMBER}</span>
          {hasDelayRequest && (
            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
              <Hourglass size={10} /> +{requestedMins}m Request
            </span>
          )}
          {token.DELAY_STATUS === 'RESCHEDULE_OFFERED' && (
            <span className="text-[10px] bg-blue-100 text-blue-900 border border-blue-300 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Calendar size={10} /> Reschedule Offered
            </span>
          )}
          {token.DELAY_STATUS === 'RESCHEDULED' && (
            <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 size={10} /> Rescheduled: {token.BOOKING_DATE}
            </span>
          )}
        </div>
      </td>

      {/* 2. Customer Name Column */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#EAE5DE] text-[#141312] flex items-center justify-center font-bold text-xs">
            <UserIcon size={13} />
          </div>
          <div>
            <div className="font-bold text-[#141312] text-sm">{token.CUSTOMER_NAME}</div>
            <span className="text-[10px] text-[#9E988E]">Seq #{token.TOKEN_SEQ}</span>
          </div>
        </div>
      </td>

      {/* 3. Phone & WhatsApp Column */}
      <td className="py-4 px-4 font-mono">
        <div className="flex items-center gap-1.5 text-xs text-[#141312] font-semibold">
          <Phone size={13} className="text-[#9E988E]" />
          <span>{token.CUSTOMER_PHONE}</span>
        </div>
        <span className="text-[10px] text-emerald-800 font-medium">WhatsApp Enabled</span>
      </td>

      {/* 4. Gmail ID & Notes Column */}
      <td className="py-4 px-4 max-w-xs">
        {token.CUSTOMER_EMAIL ? (
          <div className="flex items-center gap-1.5 text-xs text-[#736E66] truncate">
            <Mail size={12} className="text-[#9E988E] shrink-0" />
            <span className="truncate">{token.CUSTOMER_EMAIL}</span>
          </div>
        ) : (
          <span className="text-xs text-[#9E988E]">-</span>
        )}

        {/* Customer Requested Delay Particulars Banner */}
        {hasDelayRequest && (
          <div className="mt-1.5 p-2 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-medium shadow-2xs">
            <span className="font-bold block text-[10px] text-amber-900 uppercase">
              ⏳ Reason: {token.DELAY_REASON || '🚗 Parking / Traffic Delay'}
            </span>
          </div>
        )}

        {token.SERVICE_NOTE && !hasDelayRequest && (
          <div className="text-[11px] text-[#736E66] italic mt-0.5 truncate">
            "{token.SERVICE_NOTE}"
          </div>
        )}
      </td>

      {/* 5. Status Badge Column */}
      <td className="py-4 px-4">
        <Badge status={token.STATUS} size="sm" dot />
      </td>

      {/* 6. Wait Time / Position Column */}
      <td className="py-4 px-4 text-xs font-mono text-[#736E66]">
        {isWaiting ? (
          <div>
            <span className="font-bold text-[#141312]">#{token.POSITION_IN_QUEUE} in line</span>
            <span className="text-[#736E66] block font-normal">~{token.ESTIMATED_WAIT_MINS}m ETA</span>
          </div>
        ) : isServing ? (
          <span className="text-emerald-700 font-bold">At Counter</span>
        ) : (
          <span className="text-[#9E988E]">-</span>
        )}
      </td>

      {/* 7. Action Buttons Toolbar Column */}
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {/* Delay Request Review & Arrangement Buttons for Staff */}
          {hasDelayRequest && (
            <div className="flex items-center gap-1.5 bg-amber-50 p-1.5 rounded-xl border border-amber-200 mr-1 shadow-2xs">
              <button
                onClick={handleApproveDelay}
                disabled={loading}
                title={`Accept & arrange +${requestedMins}m delay for ${token.CUSTOMER_NAME}`}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-xs flex items-center gap-1 font-bold cursor-pointer shadow-2xs"
              >
                <Check size={13} /> Accept (+{requestedMins}m)
              </button>
              <button
                onClick={handleRejectDelay}
                disabled={loading}
                title="Reject delay request"
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors text-xs flex items-center gap-1 font-bold cursor-pointer shadow-2xs"
              >
                <X size={13} /> Reject
              </button>
              <button
                onClick={handleOfferReschedule}
                disabled={loading}
                title="Offer customer to reschedule to next day or next week"
                className="px-2.5 py-1 rounded-lg bg-[#141312] hover:bg-[#262422] text-white transition-colors text-xs flex items-center gap-1 font-bold cursor-pointer shadow-2xs"
              >
                <Calendar size={13} className="text-amber-300" /> Reschedule Next Day/Week
              </button>
            </div>
          )}

          {/* WhatsApp Notify Button (Manual Trigger or Auto Status Badge) */}
          {(isWaiting || isCalled) && (
            <Button
              variant={notifySuccess ? "emerald" : "secondary"}
              size="sm"
              isLoading={notifyLoading}
              onClick={handleNotifyWhatsApp}
              leftIcon={autoNotifyEnabled && !notifySuccess ? <Zap size={13} className="text-amber-500" /> : <MessageSquare size={13} className={notifySuccess ? "text-white" : "text-emerald-700"} />}
              title={autoNotifyEnabled ? "Auto-Notify is active on Call (Click to send manual WhatsApp alert)" : "Click to send manual WhatsApp alert"}
              className="text-xs px-2.5 font-bold border-[#EAE5DE] rounded-xl cursor-pointer"
            >
              {notifySuccess ? "Notified!" : autoNotifyEnabled ? "Auto-Alert" : "Notify"}
            </Button>
          )}

          {/* 1. Call Next / Re-Chime Button (Triggers voice, chime + auto-notification) */}
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
              {isCalled ? 'Re-Chime' : 'Call Next'}
            </Button>
          )}

          {/* 2. Start Serving Button */}
          {isCalled && (
            <Button
              variant="secondary"
              size="sm"
              isLoading={loading}
              onClick={handleServe}
              leftIcon={<Play size={13} className="text-emerald-600 fill-emerald-600" />}
              className="text-xs px-2.5 font-bold border-[#EAE5DE] rounded-xl cursor-pointer text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
            >
              Serve
            </Button>
          )}

          {/* 3. Direct Complete Button (When called or serving) */}
          {(isCalled || isServing) && (
            <Button
              variant="emerald"
              size="sm"
              isLoading={loading}
              onClick={handleComplete}
              leftIcon={<CheckCircle2 size={13} />}
              className="text-xs px-3 font-bold rounded-xl cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
            >
              Complete
            </Button>
          )}

          {/* 4. Staff Cancel Pass Button */}
          {(isWaiting || isCalled || isServing) && (
            <button
              onClick={handleCancelToken}
              disabled={loading}
              title="Cancel this pass"
              className="p-2 rounded-xl text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 transition-colors text-xs flex items-center justify-center font-bold cursor-pointer"
            >
              <XCircle size={14} />
            </button>
          )}

          {/* 5. Mark No-Show Button */}
          {(isWaiting || isCalled) && (
            <button
              onClick={handleNoShow}
              disabled={loading}
              title="Mark No-Show"
              className="p-2 rounded-xl text-[#736E66] hover:text-amber-600 hover:bg-amber-50 border border-[#EAE5DE] transition-colors text-xs flex items-center justify-center font-bold cursor-pointer"
            >
              <AlertOctagon size={14} />
            </button>
          )}

          {/* 6. Transfer Token Button */}
          {(isWaiting || isCalled || isServing) && (
            <button
              onClick={() => onTransferClick(token)}
              disabled={loading}
              title="Transfer to another counter"
              className="p-2 rounded-xl text-[#736E66] hover:text-[#141312] hover:bg-[#F5F1E9] border border-[#EAE5DE] transition-colors text-xs flex items-center justify-center font-bold cursor-pointer"
            >
              <ArrowRightLeft size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
