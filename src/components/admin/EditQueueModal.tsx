import React, { useState } from 'react';
import { api } from '../../services/api';
import type { Queue } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Layers, Clock, Hash } from 'lucide-react';

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
        operatingHours: operatingHours.trim()
      });

      onSuccess(res.queue);
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
      subtitle={`Counter: ${queue.COUNTER_LABEL}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
            {error}
          </div>
        )}

        <Input
          label="Queue Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<Layers size={18} />}
          required
        />

        <div className="grid grid-cols-2 gap-4">
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
            leftIcon={<Hash size={18} />}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Avg Mins / Person"
            type="number"
            min="1"
            max="120"
            value={avgServiceMins}
            onChange={(e) => setAvgServiceMins(parseInt(e.target.value) || 10)}
            leftIcon={<Clock size={18} />}
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

        <div className="pt-3 flex items-center gap-3">
          <Button type="button" variant="secondary" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
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
