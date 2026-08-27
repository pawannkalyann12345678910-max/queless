import React, { useState } from 'react';
import { api } from '../../services/api';
import type { Queue } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Plus, Trash2, Mail, Layers, Clock, Hash } from 'lucide-react';

interface CreateQueueModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (queue: Queue) => void;
}

export const CreateQueueModal: React.FC<CreateQueueModalProps> = ({
  orgId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('DOC-');
  const [counterLabel, setCounterLabel] = useState('Counter 1');
  const [avgServiceMins, setAvgServiceMins] = useState(10);
  const [maxDailyTokens, setMaxDailyTokens] = useState(0);
  const [operatingHours, setOperatingHours] = useState('09:00 - 17:00');
  const [staffEmailInput, setStaffEmailInput] = useState('');
  const [staffEmails, setStaffEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddStaffEmail = () => {
    if (!staffEmailInput || !staffEmailInput.includes('@')) {
      setError('Please enter a valid staff email address');
      return;
    }
    const clean = staffEmailInput.trim().toLowerCase();
    if (!staffEmails.includes(clean)) {
      setStaffEmails([...staffEmails, clean]);
    }
    setStaffEmailInput('');
    setError('');
  };

  const handleRemoveStaffEmail = (email: string) => {
    setStaffEmails(staffEmails.filter(e => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Queue name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.createQueue(orgId, {
        name: name.trim(),
        prefix: prefix.trim(),
        counterLabel: counterLabel.trim(),
        avgServiceMins: Number(avgServiceMins) || 10,
        maxDailyTokens: Number(maxDailyTokens) || 0,
        operatingHours: operatingHours.trim(),
        staffEmails
      });

      onSuccess(res.queue);
    } catch (err: any) {
      setError(err.message || 'Failed to create queue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Service Counter / Queue"
      subtitle="Configure counter rules, token prefix, and assign staff Google email(s)"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Queue / Counter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. General Consultation"
            leftIcon={<Layers size={18} />}
            required
            autoFocus
          />

          <Input
            label="Counter Room / Label"
            value={counterLabel}
            onChange={(e) => setCounterLabel(e.target.value)}
            placeholder="e.g. Room 102, Counter 3"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Token Prefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="e.g. DOC-, ADM-, BNK-"
            leftIcon={<Hash size={18} />}
            required
          />

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
          placeholder="e.g. 09:00 - 17:00 (Mon - Fri)"
        />

        {/* Staff Email Assignment Section */}
        <div className="pt-2 border-t border-white/10">
          <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1">
            Assign Staff Email Addresses (For Google Login Auto-Routing)
          </label>
          <p className="text-xs text-slate-400 mb-2">
            When staff members log in using these Google email addresses, they will be automatically routed into this counter's control room.
          </p>

          <div className="flex gap-2 mb-3">
            <Input
              value={staffEmailInput}
              onChange={(e) => setStaffEmailInput(e.target.value)}
              placeholder="e.g. doctor.smith@gmail.com"
              leftIcon={<Mail size={16} />}
              className="py-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddStaffEmail();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddStaffEmail}
              leftIcon={<Plus size={14} />}
              className="shrink-0"
            >
              Add Staff
            </Button>
          </div>

          {staffEmails.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2.5 bg-slate-900/60 rounded-xl border border-white/5">
              {staffEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs"
                >
                  <Mail size={12} />
                  {email}
                  <button
                    type="button"
                    onClick={() => handleRemoveStaffEmail(email)}
                    className="text-slate-400 hover:text-rose-400 ml-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 flex items-center gap-3">
          <Button type="button" variant="secondary" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="emerald"
            size="md"
            className="flex-1 font-bold shadow-emerald-600/20"
            isLoading={loading}
          >
            Create Counter Queue
          </Button>
        </div>
      </form>
    </Modal>
  );
};
