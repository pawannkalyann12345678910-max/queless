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
  X
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

  // Button 1: Call Next / Re-Chime
  const handleCall = async () => {
    setLoading(true);
    try {
      if (token.STATUS === 'CALLED') {
        // Re-chime
        audioService.announceToken(token.TOKEN_NUMBER, counterLabel);
      } else {
        await api.callToken(token.TOKEN_ID);
        audioService.announceToken(token.TOKEN_NUMBER, counterLabel);
        onRefresh();
      }
    } catch (err: any) {
      alert(err.message || 'Call failed');
    } finally {
      setLoading(false);
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
    <tr className={`border-b border-white/5 transition-colors ${
      isCalled ? 'bg-indigo-950/40 border-indigo-500/30' :
      isServing ? 'bg-emerald-950/30 border-emerald-500/30' :
      hasDelayRequest ? 'bg-amber-950/30 border-amber-500/30' : 'hover:bg-white/[0.02]'
    }`}>
      {/* Token Number */}
      <td className="py-4 px-4 font-mono font-black text-lg text-white">
        <div className="flex items-center gap-2">
          <span>{token.TOKEN_NUMBER}</span>
          {hasDelayRequest && (
            <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded uppercase">
              +5m Req
            </span>
          )}
        </div>
      </td>

      {/* Customer Info */}
      <td className="py-4 px-4">
        <div className="font-semibold text-white text-sm">{token.CUSTOMER_NAME}</div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
          <Phone size={12} className="text-slate-500" />
          <span>{token.CUSTOMER_PHONE}</span>
        </div>
        {token.SERVICE_NOTE && (
          <div className="text-[11px] text-slate-400 italic mt-0.5 truncate max-w-xs">
            "{token.SERVICE_NOTE}"
          </div>
        )}
      </td>

      {/* Status Badge */}
      <td className="py-4 px-4">
        <Badge status={token.STATUS} size="sm" dot />
      </td>

      {/* Wait Time / Position */}
      <td className="py-4 px-4 text-xs font-mono text-slate-300">
        {isWaiting ? (
          <div>
            <span className="font-bold text-white">#{token.POSITION_IN_QUEUE} in line</span>
            <span className="text-slate-400 block">~{token.ESTIMATED_WAIT_MINS}m ETA</span>
          </div>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>

      {/* Action Buttons Toolbar */}
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {/* Delay Request Review Buttons */}
          {hasDelayRequest && (
            <div className="flex items-center gap-1 bg-amber-500/20 p-1 rounded-xl border border-amber-500/30 mr-1">
              <button
                onClick={handleApproveDelay}
                disabled={loading}
                title="Approve +5m Delay"
                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-xs flex items-center gap-1 font-bold"
              >
                <Check size={14} /> Accept +5m
              </button>
              <button
                onClick={handleRejectDelay}
                disabled={loading}
                title="Reject +5m Delay"
                className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors text-xs flex items-center gap-1 font-bold"
              >
                <X size={14} /> Reject
              </button>
            </div>
          )}

          {/* 1. Call / Re-Chime Button */}
          {(isWaiting || isCalled) && (
            <Button
              variant={isCalled ? "glass" : "primary"}
              size="sm"
              isLoading={loading}
              onClick={handleCall}
              leftIcon={<Volume2 size={14} />}
              className={isCalled ? "border-indigo-400 text-indigo-300" : ""}
            >
              {isCalled ? "Re-Chime 🔔" : "Call Next 📢"}
            </Button>
          )}

          {/* 2. Start Serving Button */}
          {isCalled && (
            <Button
              variant="emerald"
              size="sm"
              isLoading={loading}
              onClick={handleServe}
              leftIcon={<Play size={14} />}
            >
              Start Serving ▶️
            </Button>
          )}

          {/* 3. Complete Service Button */}
          {isServing && (
            <Button
              variant="emerald"
              size="sm"
              isLoading={loading}
              onClick={handleComplete}
              leftIcon={<CheckCircle size={14} />}
            >
              Complete ✅
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
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
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
              className="text-slate-400 hover:text-white"
            >
              <ArrowRightLeft size={15} />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};
