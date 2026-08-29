import React, { useState } from 'react';
import { api } from '../../services/api';
import type { Queue } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Plus, Mail, Layers, Clock, Hash, X, Eye, EyeOff } from 'lucide-react';

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
  const [isActive, setIsActive] = useState(true);
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

    let finalStaffEmails = [...staffEmails];
    if (staffEmailInput && staffEmailInput.trim().includes('@')) {
      const clean = staffEmailInput.trim().toLowerCase();
      if (!finalStaffEmails.includes(clean)) {
        finalStaffEmails.push(clean);
      }
    }

    try {
      const res = await api.createQueue(orgId, {
        name: name.trim(),
        prefix: prefix.trim(),
        counterLabel: counterLabel.trim(),
        avgServiceMins: Number(avgServiceMins) || 10,
        maxDailyTokens: Number(maxDailyTokens) || 0,
        operatingHours: operatingHours.trim(),
        staffEmails: finalStaffEmails,
        isActive: isActive
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
      title="Create New Service Counter"
      subtitle="Configure counter rules, token prefix, visibility, and staff email"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Row 1: Name + Counter Label */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Queue / Counter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. General Consultation"
            leftIcon={<Layers size={16} />}
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

        {/* Row 2: Prefix + Avg Mins + Max Tokens + Hours */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input
            label="Token Prefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="e.g. DOC-"
            leftIcon={<Hash size={15} />}
            required
          />
          <Input
            label="Avg Mins / Token"
            type="number"
            min="1"
            max="120"
            value={avgServiceMins}
            onChange={(e) => setAvgServiceMins(parseInt(e.target.value) || 10)}
            leftIcon={<Clock size={15} />}
            required
          />
          <Input
            label="Daily Max (0=∞)"
            type="number"
            min="0"
            value={maxDailyTokens}
            onChange={(e) => setMaxDailyTokens(parseInt(e.target.value) || 0)}
          />
          <Input
            label="Operating Hours"
            value={operatingHours}
            onChange={(e) => setOperatingHours(e.target.value)}
            placeholder="09:00 - 17:00"
          />
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

        {/* Staff Email Assignment Section */}
        <div className="pt-3 border-t border-zinc-100 space-y-2.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-0.5">
              Assign Staff Google Emails
            </label>
            <p className="text-[11px] text-zinc-500">
              Staff who log in with these emails are auto-directed to this counter's control room.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={staffEmailInput}
                onChange={(e) => setStaffEmailInput(e.target.value)}
                placeholder="e.g. doctor.smith@gmail.com"
                leftIcon={<Mail size={15} />}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddStaffEmail();
                  }
                }}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddStaffEmail}
              leftIcon={<Plus size={14} />}
              className="shrink-0 self-end mb-0.5 font-bold"
            >
              Add
            </Button>
          </div>

          {/* Email tags */}
          {staffEmails.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
              {staffEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white text-zinc-800 border border-zinc-200 text-xs font-semibold shadow-xs"
                >
                  <Mail size={11} className="text-zinc-500" />
                  {email}
                  <button
                    type="button"
                    onClick={() => handleRemoveStaffEmail(email)}
                    className="text-zinc-400 hover:text-red-600 ml-0.5 transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer buttons */}
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
            Create Counter Queue
          </Button>
        </div>
      </form>
    </Modal>
  );
};
