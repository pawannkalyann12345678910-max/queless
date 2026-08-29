import React, { useState } from 'react';
import { api } from '../../services/api';
import type { Queue } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Layers, Clock, Hash, Eye, EyeOff, MessageSquare } from 'lucide-react';

interface EditQueueModalProps {
  queue: Queue | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Queue) => void;
}

export const EditQueueModal: React.FC<EditQueueModalProps> = ({
  queue,
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!queue) return null;

  const [name, setName] = useState(queue.NAME);
  const [prefix, setPrefix] = useState(queue.PREFIX);
  const [counterLabel, setCounterLabel] = useState(queue.COUNTER_LABEL || 'Counter 1');
  const [avgServiceMins, setAvgServiceMins] = useState(queue.AVG_SERVICE_MINS || 10);
  const [maxDailyTokens, setMaxDailyTokens] = useState(queue.MAX_DAILY_TOKENS || 0);
  const [operatingHours, setOperatingHours] = useState(queue.OPERATING_HOURS || '09:00 - 17:00');
  const [isActive, setIsActive] = useState(queue.IS_ACTIVE === 1);
  const [allowStaffWhatsApp, setAllowStaffWhatsApp] = useState(queue.ALLOW_STAFF_WHATSAPP === 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Queue name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.updateQueue(queue.QUEUE_ID, {
        name: name.trim(),
        prefix: prefix.trim(),
        counterLabel: counterLabel.trim(),
        avgServiceMins: Number(avgServiceMins) || 10,
        maxDailyTokens: Number(maxDailyTokens) || 0,
        operatingHours: operatingHours.trim(),
        isActive: isActive,
        allowStaffWhatsApp: allowStaffWhatsApp ? 1 : 0
      });

      await api.toggleQueueStaffWhatsApp(queue.QUEUE_ID, allowStaffWhatsApp);

      onSuccess({ ...res.queue, ALLOW_STAFF_WHATSAPP: allowStaffWhatsApp ? 1 : 0 });
    } catch (err: any) {
      setError(err.message || 'Failed to update queue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Queue Settings"
      subtitle={`Counter: ${queue.COUNTER_LABEL || queue.NAME}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <Input
          label="Queue Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<Layers size={16} />}
          required
        />

        <div className="grid grid-cols-2 gap-3.5">
          <Input
            label="Counter Room / Label"
            value={counterLabel}
            onChange={(e) => setCounterLabel(e.target.value)}
            required
          />

          <Input
            label="Token Prefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            leftIcon={<Hash size={16} />}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <Input
            label="Avg Mins / Token"
            type="number"
            min="1"
            max="120"
            value={avgServiceMins}
            onChange={(e) => setAvgServiceMins(parseInt(e.target.value) || 10)}
            leftIcon={<Clock size={16} />}
            required
          />

          <Input
            label="Daily Max Tokens (0=∞)"
            type="number"
            min="0"
            value={maxDailyTokens}
            onChange={(e) => setMaxDailyTokens(parseInt(e.target.value) || 0)}
          />
        </div>

        <Input
          label="Operating Hours"
          value={operatingHours}
          onChange={(e) => setOperatingHours(e.target.value)}
        />

        {/* Staff WhatsApp Connection Toggle */}
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${allowStaffWhatsApp ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-600'}`}>
              <MessageSquare size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-black">Staff WhatsApp Integration</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${allowStaffWhatsApp ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-700'}`}>
                  {allowStaffWhatsApp ? 'Staff QR Enabled' : 'Uses Admin WhatsApp'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {allowStaffWhatsApp
                  ? 'Assigned staff can scan QR in their Staff Desk to send alerts from their own WhatsApp.'
                  : 'Turn notifications for this counter automatically route through the Admin WhatsApp bot.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={allowStaffWhatsApp}
            onClick={() => setAllowStaffWhatsApp(!allowStaffWhatsApp)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              allowStaffWhatsApp ? 'bg-emerald-600' : 'bg-zinc-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                allowStaffWhatsApp ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Visibility Toggle Switch */}
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-600'}`}>
              {isActive ? <Eye size={16} /> : <EyeOff size={16} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-black">Public Visibility</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-700'}`}>
                  {isActive ? 'Visible to Everyone' : 'Hidden from Public'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {isActive 
                  ? 'Queue is live on your public page. Visitors can see wait times and book turn passes.' 
                  : 'Queue is hidden from customers. Only admins and assigned staff can operate it.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isActive ? 'bg-black' : 'bg-zinc-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="pt-3 flex items-center gap-3 border-t border-zinc-100">
          <Button type="button" variant="secondary" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="emerald"
            size="md"
            className="flex-1 font-bold"
            isLoading={loading}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
