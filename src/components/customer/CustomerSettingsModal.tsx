import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { User, Phone, Mail, Shield, Check, Sparkles, BellRing } from 'lucide-react';

interface CustomerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerSettingsModal: React.FC<CustomerSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, updateProfile, refreshAuth } = useAuth();
  const [displayName, setDisplayName] = useState(user?.DISPLAY_NAME || '');
  const [phone, setPhone] = useState(user?.PHONE || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.DISPLAY_NAME || '');
      setPhone(user.PHONE || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 7) {
      setError('A valid phone number is required for WhatsApp turn alerts and token verification.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (updateProfile) {
        await updateProfile(displayName.trim(), phone.trim());
      } else {
        await api.updateProfile(displayName.trim(), phone.trim());
        await refreshAuth();
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profile & Account Settings"
      subtitle="Manage your personal details and WhatsApp notification preferences"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-2xs">
            <Check size={16} className="text-emerald-600" />
            <span>Profile settings saved successfully!</span>
          </div>
        )}

        {/* User Identity Info Card */}
        <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EAE5DE] flex items-center gap-3.5 shadow-2xs">
          {user?.PHOTO_URL ? (
            <img
              src={user.PHOTO_URL}
              alt={user.DISPLAY_NAME}
              className="w-12 h-12 rounded-2xl object-cover border border-[#EAE5DE] shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-[#141312] text-white flex items-center justify-center font-black text-lg shrink-0">
              {user?.DISPLAY_NAME?.charAt(0) || 'U'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-[#141312] truncate">{user?.DISPLAY_NAME}</h4>
            <p className="text-xs text-[#736E66] truncate">{user?.EMAIL}</p>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#EAE5DE] text-[10px] font-bold text-[#141312] uppercase tracking-wider">
            <Shield size={11} className="text-[#C28E5C]" />
            <span>{user?.ROLE || 'CUSTOMER'}</span>
          </div>
        </div>

        {/* Editable Display Name */}
        <Input
          label="Full Name / Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Sarah Jenkins"
          leftIcon={<User size={16} />}
          required
        />

        {/* Editable Phone Number */}
        <Input
          label="Mobile Phone Number (For WhatsApp Turn Alerts)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +1 555 019 2834"
          leftIcon={<Phone size={16} />}
          helperText="Required so staff can alert you when your turn pass is called."
          required
        />

        {/* Read-Only Verified Google Email */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#141312] mb-1">
            Linked Google Account (Verified)
          </label>
          <div className="relative rounded-xl bg-[#FAF7F2] border border-[#EAE5DE] px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-[#736E66]">
            <Mail size={16} className="text-[#9E988E]" />
            <span className="font-mono">{user?.EMAIL}</span>
          </div>
        </div>

        {/* Notification Preferences Card */}
        <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#EAE5DE] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#141312]">
            <BellRing size={14} className="text-[#C28E5C]" />
            <span>Proximity & Turn Alerts</span>
          </div>
          <p className="text-[11px] text-[#736E66] leading-relaxed">
            When you hold an active pass, Queless automatically calculates your live turn countdown, buzzes you 10 minutes in advance, and notifies you when staff calls your number.
          </p>
        </div>

        {/* Modal Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="flex-1 border-[#EAE5DE] text-[#141312] hover:bg-[#FAF7F2] rounded-xl cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="emerald"
            size="md"
            className="flex-1 font-bold rounded-xl cursor-pointer bg-[#141312] hover:bg-[#262422] text-white"
            isLoading={loading}
            leftIcon={<Sparkles size={15} />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
