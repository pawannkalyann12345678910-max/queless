import React, { useState } from 'react';
import type { Organization } from '../../types';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { MapPin, Edit3, Mail, Image as ImageIcon } from 'lucide-react';

interface OrgOverviewCardProps {
  organization: Organization;
  onRefresh: () => void;
}

export const OrgOverviewCard: React.FC<OrgOverviewCardProps> = ({ organization, onRefresh }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [name, setName] = useState(organization.NAME);
  const [category] = useState(organization.CATEGORY);
  const [description] = useState(organization.DESCRIPTION || '');
  const [logoUrl, setLogoUrl] = useState(organization.LOGO_URL || '');
  const [city, setCity] = useState(organization.CITY || '');
  const [address, setAddress] = useState(organization.ADDRESS || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.updateOrganization(organization.ORG_ID, {
        name: name.trim(),
        category,
        description: description.trim(),
        logoUrl: logoUrl.trim(),
        city: city.trim(),
        address: address.trim()
      });
      setIsEditOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 mb-8 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-5">
          {organization.LOGO_URL ? (
            <img
              src={organization.LOGO_URL}
              alt={organization.NAME}
              className="w-20 h-20 rounded-3xl object-cover border border-white/15 bg-slate-900 shadow-xl"
            />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-cyan-500 border border-white/20 flex items-center justify-center font-black text-white text-3xl shadow-xl">
              {organization.NAME.charAt(0)}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="indigo" size="sm">{organization.CATEGORY}</Badge>
              <Badge variant="emerald" size="sm">{organization.SUBSCRIPTION_TIER} PLAN</Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{organization.NAME}</h2>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1"><Mail size={13} /> {organization.ADMIN_EMAIL}</span>
              {organization.CITY && <span className="flex items-center gap-1"><MapPin size={13} /> {organization.CITY}</span>}
            </div>
          </div>
        </div>

        <div>
          <Button
            variant="glass"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            leftIcon={<Edit3 size={15} />}
          >
            Edit Profile & Logo
          </Button>
        </div>
      </div>

      {isEditOpen && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title="Edit Organization Profile"
          subtitle="Update branding, logo image, and location"
          maxWidth="md"
        >
          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <Input
              label="Organization Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Logo Image URL (or Base64)"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://... or data:image/..."
              leftIcon={<ImageIcon size={18} />}
            />

            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              leftIcon={<MapPin size={18} />}
            />

            <Input
              label="Physical Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 450 Medical Plaza, Suite 200"
            />

            <div className="pt-3 flex items-center gap-3">
              <Button type="button" variant="secondary" size="md" className="flex-1" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" className="flex-1 font-bold" isLoading={loading}>
                Save Updates
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
