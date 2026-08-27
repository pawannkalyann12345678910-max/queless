import React, { useState } from 'react';
import type { Queue } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { BookingModal } from './BookingModal';
import { Clock, Users, Ticket } from 'lucide-react';

interface QueueCardProps {
  queue: Queue;
  onBookSuccess?: () => void;
}

export const QueueCard: React.FC<QueueCardProps> = ({ queue, onBookSuccess }) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const isPaused = queue.IS_PAUSED === 1;
  const waitingCount = queue.WAITING_COUNT || 0;
  const estWaitTotal = waitingCount * (queue.AVG_SERVICE_MINS || 10);

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              {queue.COUNTER_LABEL || 'Counter'}
            </span>
            <h4 className="text-xl font-bold text-white tracking-tight">{queue.NAME}</h4>
          </div>

          {isPaused ? (
            <Badge variant="rose" dot>Intake Paused</Badge>
          ) : (
            <Badge variant="emerald" dot>Live Active</Badge>
          )}
        </div>

        {/* Live Serving Counter Box */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/5 mb-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">
              Now Serving
            </span>
            <span className="text-2xl font-black tracking-tight text-indigo-400 font-mono">
              {queue.CURRENT_SERVING_TOKEN || 'None'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">
              Waiting in Line
            </span>
            <span className="text-lg font-bold text-white flex items-center gap-1 justify-end">
              <Users size={16} className="text-amber-400" />
              {waitingCount} people
            </span>
          </div>
        </div>

        {/* Info stats */}
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 mb-6">
          <div className="flex items-center gap-1.5 bg-white/5 p-2.5 rounded-xl">
            <Clock size={15} className="text-indigo-400 shrink-0" />
            <span>Avg {queue.AVG_SERVICE_MINS || 10}m / person</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 p-2.5 rounded-xl">
            <Clock size={15} className="text-amber-400 shrink-0" />
            <span>~{estWaitTotal}m total queue</span>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div>
        <Button
          variant={isPaused ? "secondary" : "primary"}
          size="lg"
          className="w-full font-bold shadow-lg"
          disabled={isPaused}
          onClick={() => setIsBookingOpen(true)}
          leftIcon={<Ticket size={18} />}
        >
          {isPaused ? "Bookings Paused" : "Book Digital Pass"}
        </Button>
      </div>

      {isBookingOpen && (
        <BookingModal
          queue={queue}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          onSuccess={() => {
            setIsBookingOpen(false);
            if (onBookSuccess) onBookSuccess();
          }}
        />
      )}
    </div>
  );
};
