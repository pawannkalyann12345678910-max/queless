import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Organization } from '../types';
import { SearchBar } from '../components/customer/SearchBar';
import { CategoryFilter } from '../components/customer/CategoryFilter';
import { OrgCard } from '../components/customer/OrgCard';
import { Spinner } from '../components/common/Spinner';
import { Button } from '../components/common/Button';
import { 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Tv, 
  ArrowRight, 
  Building2, 
  Layers 
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const res = await api.getOrganizations({
        category: selectedCategory,
        search,
        city
      });
      setOrganizations(res.organizations);
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, [selectedCategory, search, city]);

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSearch('');
    setCity('');
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-10 sm:py-16 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles size={14} className="text-indigo-400" />
          Say Goodbye to Physical Waiting Lines
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          Never Stand in a Queue Again. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Your Digital Pass is Live.
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
          Book digital tokens from home or on-site for clinics, banks, universities, and government counters. Track live turn countdowns, receive 10-minute proximity alerts, and walk in when called.
        </p>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-10">
          <div className="glass-panel rounded-2xl p-4 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Live Time Estimator</h4>
              <p className="text-[11px] text-slate-400">Accurate countdowns per token</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Proximity Alerts</h4>
              <p className="text-[11px] text-slate-400">Alerted 5 tokens ahead</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Tv size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">HDMI TV Broadcasting</h4>
              <p className="text-[11px] text-slate-400">Waiting room public screen</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Category Filter Section */}
      <section className="space-y-6">
        <SearchBar
          search={search}
          city={city}
          onSearchChange={setSearch}
          onCityChange={setCity}
          onClear={handleClearFilters}
        />

        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Directory Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="text-indigo-400" size={20} />
              Available Service Organizations ({organizations.length})
            </h2>
          </div>

          {loading ? (
            <Spinner size="lg" className="py-20" />
          ) : organizations.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl p-8">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto text-slate-500 mb-4">
                <Layers size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">No Organizations Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
                No matching business or counter queues match your filters. Register your own organization to start issuing tokens!
              </p>
              <Link to="/admin/register">
                <Button variant="emerald" size="md">
                  Register Your Organization
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map((org) => (
                <OrgCard key={org.ORG_ID} organization={org} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Register Business Call to Action */}
      <section className="glass-panel rounded-3xl p-8 sm:p-12 border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-950/80 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">For Business Owners & Institutions</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Are You a Clinic, Bank, University, or Salon?
          </h3>
          <p className="text-sm text-slate-400 max-w-xl">
            Eliminate waiting lines at your organization. Setup counters in under 2 minutes, assign staff emails for auto-routing, and broadcast calls to waiting room TVs.
          </p>
        </div>

        <Link to="/admin/register" className="shrink-0">
          <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />} className="font-bold">
            Get Started Free
          </Button>
        </Link>
      </section>
    </div>
  );
};
