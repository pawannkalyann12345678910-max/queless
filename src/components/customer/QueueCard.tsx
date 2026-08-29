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
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAE5DE] shadow-2xs flex flex-col justify-between hover:border-[#C4BDAF] hover:shadow-md transition-all">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <span className="text-xs font-bold text-[#736E66] block mb-0.5">
              {queue.COUNTER_LABEL || 'Counter'}
            </span>
            <h4 className="text-lg font-black text-[#141312] tracking-tight">{queue.NAME}</h4>
          </div>

          {isPaused ? (
            <Badge variant="rose" dot>Intake Paused</Badge>
          ) : (
            <Badge variant="emerald" dot>Live Active</Badge>
          )}
        </div>

        {/* Live Serving Counter Box */}
        <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EAE5DE] mb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#736E66] block">
              Now Serving
            </span>
            <span className="text-xl font-black tracking-tight text-[#141312] font-mono">
              {queue.CURRENT_SERVING_TOKEN || 'None'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#736E66] block">
              Waiting in Line
            </span>
            <span className="text-base font-bold text-[#141312] flex items-center gap-1 justify-end">
              <Users size={15} className="text-[#736E66]" />
              {waitingCount} people
            </span>
          </div>
        </div>

        {/* Info stats */}
        <div className="grid grid-cols-2 gap-2 text-xs text-[#736E66] mb-5">
          <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EAE5DE]">
            <Clock size={14} className="text-[#141312] shrink-0" />
            <span>Avg {queue.AVG_SERVICE_MINS || 10}m / person</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EAE5DE]">
            <Clock size={14} className="text-[#C28E5C] shrink-0" />
            <span>~{estWaitTotal}m total queue</span>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div>
        <Button
          variant={isPaused ? "secondary" : "primary"}
          size="md"
          className="w-full font-bold bg-[#141312] hover:bg-[#262422] text-white rounded-xl py-3 shadow-xs cursor-pointer"
          disabled={isPaused}
          onClick={() => setIsBookingOpen(true)}
          leftIcon={<Ticket size={16} />}
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
