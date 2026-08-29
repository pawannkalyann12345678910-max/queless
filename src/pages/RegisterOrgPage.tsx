import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { 
  Building2, 
  Sparkles, 
  MapPin, 
  ArrowLeft, 
  ShieldCheck, 
  Check,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

const CATEGORY_OPTIONS = [
  { value: 'Clinic', label: 'Clinic / Medical Practice' },
  { value: 'Hospital', label: 'Hospital / Diagnostic Center' },
  { value: 'Bank', label: 'Bank / Financial Branch' },
  { value: 'University', label: 'University / College Admissions' },
  { value: 'Government', label: 'Government / Public Services' },
  { value: 'Salon', label: 'Salon / Spa / Wellness' },
  { value: 'Restaurant', label: 'Restaurant / Food Pickup' },
  { value: 'Retail', label: 'Retail Store / Supermarket' },
  { value: 'Service Center', label: 'Repair / Customer Care Center' },
  { value: 'Other', label: 'Other Enterprise Service' }
];

const SUBSCRIPTION_TIERS = [
  {
    id: 'STARTER',
    name: 'Starter Trial',
    price: '1-Week Free Trial',
    features: [
      '1 Active Service Counter',
      '7-Day Full Access Trial',
      'Digital Mobile Passes',
      'Public HDMI Waiting Screen',
      'Basic Live Analytics'
    ]
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: '₹2,000 / mo',
    features: [
      'Up to 2 Active Counters',
      'Automated WhatsApp Bot Alerts',
      'Voice Chime Broadcaster',
      'Staff Desk Auto-Routing',
      'Hourly Flow & Heatmaps',
      'CSV Data Export'
    ]
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: '₹5,000 / mo',
    features: [
      'Up to 4 Active Counters',
      'Multi-Department Transfer',
      'WhatsApp Bot & Auto-Routing',
      'Unlimited Daily Visitor Passes',
      'Full Analytics & Reporting',
      'Priority Support'
    ]
  }
];

export const RegisterOrgPage: React.FC = () => {
  const { user, signInWithGoogle, refreshAuth } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Clinic');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [selectedTier, setSelectedTier] = useState('STARTER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      await signInWithGoogle();
      return;
    }

    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.registerOrganization({
        name: name.trim(),
        category,
        description: description.trim(),
        logoUrl: logoUrl.trim(),
        subscriptionTier: selectedTier,
        city: city.trim(),
        address: address.trim()
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      await refreshAuth();
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Failed to onboard organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-4">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-black transition-colors">
        <ArrowLeft size={16} /> Back to Directory
      </Link>

      <div className="bg-white rounded-2xl p-8 sm:p-10 border border-zinc-200 shadow-xs">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Register Your Organization
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Create your organization profile, select your category, and set up your live queue counters.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 mt-8 pt-6 border-t border-zinc-100">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Section 1: Business Profile */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">
              1. Organization Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Organization Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. City Health Clinic"
                leftIcon={<Building2 size={16} />}
                required
                autoFocus
              />

              <Select
                label="Service Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORY_OPTIONS}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="City / Region"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New York, London, Tokyo"
                leftIcon={<MapPin size={16} />}
                required
              />

              <Input
                label="Logo Image URL (Optional)"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                leftIcon={<ImageIcon size={16} />}
              />
            </div>

            <Input
              label="Physical Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 742 Evergreen Terrace, Floor 2"
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Description / About Organization
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your clinic, services offered, special counter instructions..."
                className="w-full rounded-lg bg-white border border-zinc-300 p-3 text-sm text-black placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
              />
            </div>
          </div>

          {/* Section 2: Subscription Tier */}
          <div className="space-y-4 pt-4 border-t border-zinc-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">
              2. Subscription Plan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUBSCRIPTION_TIERS.map((tier) => {
                const isSelected = selectedTier === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`cursor-pointer rounded-xl p-5 border transition-all ${
                      isSelected
                        ? 'bg-zinc-50 border-2 border-black shadow-sm'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-black text-sm">{tier.name}</h4>
                      <span className="text-xs font-bold font-mono text-black bg-zinc-100 px-2 py-0.5 rounded">
                        {tier.price}
                      </span>
                    </div>

                    <ul className="space-y-1.5 text-xs text-zinc-600 mt-3">
                      {tier.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check size={13} className="text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action button */}
          <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-zinc-500 flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-600" />
              Secured with Google Authentication
            </span>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="font-bold px-8 bg-black hover:bg-zinc-800 text-white rounded-lg w-full sm:w-auto"
              isLoading={loading}
              leftIcon={<Sparkles size={16} />}
            >
              Complete Registration
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
