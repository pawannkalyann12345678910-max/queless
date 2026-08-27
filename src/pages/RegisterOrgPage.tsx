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
  CheckCircle,
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
    name: 'Starter Plan',
    price: 'Free',
    features: ['Up to 3 Active Counters', 'Unlimited Daily Tokens', 'Public HDMI Screen Mode', 'Basic Analytics']
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional Plan',
    price: '$29/mo',
    features: ['Up to 15 Counters', 'SMS & WhatsApp Notifications', 'Voice Chime Broadcaster', 'Hourly Traffic Heatmaps', 'CSV Data Export']
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise Plan',
    price: '$99/mo',
    features: ['Unlimited Counters & Campuses', 'Multi-Department Transfer', 'Custom White-Label Branding', 'Dedicated Account Manager']
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Directory
      </Link>

      <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-white/10 relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Building2 size={14} className="text-emerald-400" />
            Enterprise Self-Service Onboarding
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Register Your Business on Queless
          </h1>

          <p className="text-sm text-slate-400 mt-2">
            Create your organization profile, select your category, and start creating service queues in under 2 minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 mt-10 pt-8 border-t border-white/10">
          {error && (
            <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Section 1: Business Profile */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              1. Business Details & Category
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Organization / Business Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. City Health Clinic, Stanford Admissions"
                leftIcon={<Building2 size={18} />}
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
                placeholder="e.g. New York, London, Bangalore"
                leftIcon={<MapPin size={18} />}
                required
              />

              <Input
                label="Logo Image URL (Optional)"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://... (or leave blank for initial icon)"
                leftIcon={<ImageIcon size={18} />}
              />
            </div>

            <Input
              label="Physical Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 742 Evergreen Terrace, Floor 2"
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Description / About Organization
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your clinic, services offered, special counter instructions..."
                className="w-full rounded-xl bg-slate-900/80 border border-white/10 p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section 2: Subscription Tier */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              2. Select Your Subscription Plan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUBSCRIPTION_TIERS.map((tier) => {
                const isSelected = selectedTier === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-600/20'
                        : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-white text-base">{tier.name}</h4>
                      <span className="text-xs font-black font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                        {tier.price}
                      </span>
                    </div>

                    <ul className="space-y-1.5 text-[11px] text-slate-400 mt-4">
                      {tier.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-emerald-400 shrink-0" />
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
          <div className="pt-6 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-400" />
              Secured with Firebase Google Authentication
            </span>

            <Button
              type="submit"
              variant="emerald"
              size="lg"
              className="font-black px-8 shadow-emerald-500/20"
              isLoading={loading}
              leftIcon={<Sparkles size={18} />}
            >
              Complete Registration & Open Dashboard
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
