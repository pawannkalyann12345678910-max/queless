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
    <div className="bg-white rounded-xl p-5 sm:p-7 border border-zinc-200 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          {organization.LOGO_URL ? (
            <img
              src={organization.LOGO_URL}
              alt={organization.NAME}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-zinc-200 bg-zinc-50 shadow-xs shrink-0 aspect-square"
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-black text-white flex items-center justify-center font-black text-2xl shadow-xs shrink-0 aspect-square">
              {organization.NAME.charAt(0)}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="neutral" size="sm">{organization.CATEGORY}</Badge>
              <Badge variant="emerald" size="sm">
                {organization.SUBSCRIPTION_TIER === 'ENTERPRISE' ? 'Enterprise (4 Counters)' :
                 organization.SUBSCRIPTION_TIER === 'PROFESSIONAL' ? 'Professional (2 Counters)' :
                 'Starter 1-Week Trial (1 Counter)'}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">{organization.NAME}</h2>
            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 font-medium flex-wrap">
              <span className="flex items-center gap-1.5"><Mail size={13} className="text-zinc-400" /> {organization.ADMIN_EMAIL}</span>
              {organization.CITY && <span className="flex items-center gap-1.5"><MapPin size={13} className="text-zinc-400" /> {organization.CITY}</span>}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            leftIcon={<Edit3 size={14} />}
            className="font-bold w-full sm:w-auto"
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
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
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
              leftIcon={<ImageIcon size={16} />}
            />

            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              leftIcon={<MapPin size={16} />}
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
              <Button type="submit" variant="primary" size="md" className="flex-1 font-bold bg-black text-white" isLoading={loading}>
                Save Updates
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
