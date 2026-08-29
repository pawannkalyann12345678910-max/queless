import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Phone, User, ShieldCheck } from 'lucide-react';

export const ProfileCompletionModal: React.FC = () => {
  const { user, needsProfileCompletion, updateProfile, role } = useAuth();
  
  // Track dismissal in sessionStorage so it never pops up again during the active browsing session
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('queless_profile_dismissed') === 'true';
  });

  const [displayName, setDisplayName] = useState(() => user?.DISPLAY_NAME || '');
  const [phone, setPhone] = useState(() => user?.PHONE || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('queless_profile_dismissed', 'true');
  };

  // Only show for logged-in CUSTOMERS who have genuinely incomplete profiles and haven't dismissed
  // (ADMIN and STAFF roles don't need a customer booking profile forced upon them)
  if (!user || role === 'ADMIN' || role === 'STAFF' || !needsProfileCompletion || isDismissed) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 7) {
      setError('Please enter a valid mobile phone number (at least 7 digits)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateProfile(displayName.trim() || user?.DISPLAY_NAME || 'User', phone.trim());
      handleDismiss();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      // Fallback: update local session to unblock user
      if (user) {
        user.PHONE = phone.trim();
        user.DISPLAY_NAME = displayName.trim() || user.DISPLAY_NAME;
        user.PROFILE_COMPLETE = 1;
        localStorage.setItem('queless_user_session', JSON.stringify(user));
      }
      handleDismiss();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleDismiss}
      title="Complete Your Profile"
      subtitle="One-time setup for instant 1-click digital token passes"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
          <ShieldCheck className="text-indigo-400 shrink-0" size={24} />
          <p className="text-xs text-indigo-200">
            Your contact details are securely stored in your session so you never have to re-enter them when booking queues.
          </p>
        </div>

        <Input
          label="Full Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Sarah Jenkins"
          leftIcon={<User size={18} />}
          required
        />

        <Input
          label="Mobile Phone Number (Mandatory)"
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (error) setError('');
          }}
          placeholder="e.g. +1 (555) 019-2834"
          leftIcon={<Phone size={18} />}
          error={error}
          required
        />

        <div className="pt-2 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="flex-1 text-slate-400 hover:text-white"
            onClick={handleDismiss}
          >
            Explore First
          </Button>
          <Button
            type="submit"
            variant="emerald"
            size="md"
            className="flex-1 font-bold shadow-emerald-500/20"
            isLoading={loading}
          >
            Save & Continue
          </Button>
        </div>
      </form>
    </Modal>
  );
};
