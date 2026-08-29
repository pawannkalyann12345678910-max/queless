import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { Organization } from '../types';
import { OrgCard } from '../components/customer/OrgCard';
import { InteractiveRoiCalculator } from '../components/landing/InteractiveRoiCalculator';
import { BentoBenefitsGrid } from '../components/landing/BentoBenefitsGrid';
import { SocialProofReviews } from '../components/landing/SocialProofReviews';
import { QuelessFaqSection } from '../components/landing/QuelessFaqSection';
import { HeroCanvasScrubber } from '../components/landing/HeroCanvasScrubber';
import { Spinner } from '../components/common/Spinner';
import { Button } from '../components/common/Button';
import { 
  Sparkles, 
  ArrowRight, 
  Search, 
  Building2,
  Check,
  Zap
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, signInWithGoogle, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        setLoading(true);
        const res = await api.getOrganizations();
        setOrganizations(res.organizations);
      } catch (err) {
        console.error('Failed to fetch orgs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  const handleSignIn = async () => {
    await signInWithGoogle();
    if (role === 'STAFF') {
      navigate('/staff');
    } else if (role === 'ADMIN') {
      navigate('/admin');
    }
  };

  const categories = ['All', 'Clinic', 'Hospital', 'Bank', 'University', 'Government', 'Salon', 'Restaurant', 'Retail', 'Service Center'];

  const filteredOrgs = organizations.filter(org => {
    const matchesCategory = selectedCategory === 'All' || org.CATEGORY === selectedCategory;
    const matchesSearch = 
      org.NAME.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (org.CITY && org.CITY.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (org.DESCRIPTION && org.DESCRIPTION.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="text-[#141312] bg-[var(--bg-cream)] w-full">
      
      {/* 1. HERO SECTION (Natural Viewport Layout - Zero Blank Spacing) */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-6 sm:py-10 w-full bg-[var(--bg-cream)] border-b border-[#EAE5DE]">
        
        {/* Ambient subtle modern lobby & queue orchestration backdrop */}
        <div className="absolute inset-0 z-0 opacity-15 pointer-events-none overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop" 
            alt="Modern Service Center Architecture" 
            className="w-full h-full object-cover filter contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-cream)] via-[var(--bg-cream)]/90 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          {/* DESKTOP LAYOUT (2 Columns) */}
          <div className="hidden lg:grid grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Typography & CTAs (5 cols) */}
            <div className="col-span-5 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#EAE5DE] text-[#141312] text-xs font-bold uppercase tracking-wider shadow-2xs">
                <Sparkles size={14} className="text-[#C28E5C]" />
                <span>Smart Digital Pass & Live Queue Flow</span>
              </div>

              <h1 className="text-5xl xl:text-7xl font-black tracking-tight text-[#141312] leading-[1.03]">
                Eliminate Physical Lines. <br />
                <span className="text-[#141312]">
                  Turn Any Counter Into A Live Digital Pass.
                </span>
              </h1>

              <p className="text-lg xl:text-xl text-[#736E66] leading-relaxed font-normal">
                Replace hardware kiosks with instant mobile ticketing, live turn algorithms, 10-minute proximity buzz alerts, and waiting room HDMI TV broadcasting.
              </p>

              {/* CTAs */}
              <div className="flex items-center gap-3.5 pt-2">
                {user ? (
                  <a href="#collections">
                    <Button
                      variant="primary"
                      size="lg"
                      className="font-bold px-8 py-3.5 text-base bg-[#141312] hover:bg-[#262422] text-white rounded-xl shadow-xs cursor-pointer"
                      rightIcon={<ArrowRight size={18} />}
                    >
                      Explore Live Counters
                    </Button>
                  </a>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSignIn}
                    isLoading={authLoading}
                    className="font-bold px-8 py-3.5 text-base bg-[#141312] hover:bg-[#262422] text-white rounded-xl shadow-xs cursor-pointer"
                    rightIcon={<ArrowRight size={18} />}
                  >
                    Sign In to View Counters
                  </Button>
                )}

                <Link to="/admin/register">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="font-bold border border-[#EAE5DE] bg-white hover:bg-[#FAF7F2] text-[#141312] rounded-xl px-7 py-3.5 text-base shadow-2xs cursor-pointer"
                    leftIcon={<Zap size={18} className="text-[#C28E5C]" />}
                  >
                    Setup Business (Free)
                  </Button>
                </Link>
              </div>

              {/* Trust Proof Checklist */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#736E66]">
                <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50/80 px-3 py-1.5 rounded-lg border border-emerald-200/80">
                  <Check size={14} className="stroke-[3]" /> Zero App Download
                </span>
                <span className="flex items-center gap-1.5 text-[#141312] bg-white px-3 py-1.5 rounded-lg border border-[#EAE5DE]">
                  <Check size={14} className="stroke-[3]" /> Real-Time Sync
                </span>
                <span className="flex items-center gap-1.5 text-[#141312] bg-white px-3 py-1.5 rounded-lg border border-[#EAE5DE]">
                  <Check size={14} className="stroke-[3]" /> HDMI TV Screen Cast
                </span>
              </div>
            </div>

            {/* Right Column: Animation Canvas (7 cols) */}
            <div className="col-span-7 relative flex items-center justify-center">
              <div className="w-full relative bg-white border border-[#EAE5DE] rounded-3xl shadow-sm overflow-hidden p-2">
                <HeroCanvasScrubber />
              </div>
            </div>
          </div>

          {/* MOBILE / TABLET LAYOUT */}
          <div className="lg:hidden flex flex-col justify-between py-2 space-y-4">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#EAE5DE] text-[#141312] text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                <Sparkles size={12} className="text-[#C28E5C]" />
                <span>Smart Digital Queue Pass</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#141312] leading-tight">
                Eliminate Physical Lines. <br />
                <span className="text-[#141312]">Live Digital Pass.</span>
              </h1>
            </div>

            {/* High-Definition Animation Stage on Mobile */}
            <div className="w-full min-h-[220px] max-h-[55vh] relative overflow-hidden bg-white border border-[#EAE5DE] rounded-2xl p-1.5 shadow-xs">
              <HeroCanvasScrubber />
            </div>

            {/* Mobile CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {user ? (
                <a href="#collections" className="w-full">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full font-bold bg-[#141312] text-white rounded-xl py-2.5 text-xs shadow-xs cursor-pointer"
                    rightIcon={<ArrowRight size={14} />}
                  >
                    Explore Counters
                  </Button>
                </a>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSignIn}
                  isLoading={authLoading}
                  className="w-full font-bold bg-[#141312] text-white rounded-xl py-2.5 text-xs shadow-xs cursor-pointer"
                  rightIcon={<ArrowRight size={14} />}
                >
                  Sign In to Book Passes
                </Button>
              )}

              <Link to="/admin/register" className="w-full">
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full font-bold border border-[#EAE5DE] bg-white text-[#141312] rounded-xl py-2.5 text-xs cursor-pointer"
                >
                  Setup Business
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 2. KINETIC MARQUEE TICKER */}
      <div className="bg-[#141312] text-white py-3.5 overflow-hidden whitespace-nowrap border-y border-[#262422] shadow-xs">
        <div className="inline-flex gap-8 font-black text-xs uppercase tracking-widest animate-marquee font-mono">
          <span>⚡ ZERO APP INSTALLATION REQUIRED</span>
          <span>•</span>
          <span>📱 REAL-TIME TURN COUNTDOWN ALGORITHMS</span>
          <span>•</span>
          <span>🔔 10-MINUTE PROXIMITY BUZZ ALERTS</span>
          <span>•</span>
          <span>📺 HDMI WAITING ROOM TV SCREEN BROADCAST</span>
          <span>•</span>
          <span>🚀 DIGITAL COUNTER ROUTING</span>
          <span>•</span>
          <span>🔒 256-BIT ENCRYPTED</span>
          <span>•</span>
          <span>⚡ ZERO APP INSTALLATION REQUIRED</span>
          <span>•</span>
          <span>📱 REAL-TIME TURN COUNTDOWN ALGORITHMS</span>
          <span>•</span>
          <span>🔔 10-MINUTE PROXIMITY BUZZ ALERTS</span>
          <span>•</span>
          <span>📺 HDMI WAITING ROOM TV SCREEN BROADCAST</span>
        </div>
      </div>

      {/* 3. BENTO ARCHITECTURE & BENEFITS SECTION */}
      <section className="py-16 sm:py-24 bg-[var(--bg-cream)]">
        <BentoBenefitsGrid />
      </section>

      {/* 4. STORY & ROI ESTIMATOR SECTION */}
      <section id="story" className="py-16 sm:py-24 bg-white border-y border-[#EAE5DE]">
        <InteractiveRoiCalculator />
      </section>

      {/* 5. COLLECTIONS / LIVE COUNTER DIRECTORY SECTION */}
      <section id="collections" className="py-16 sm:py-24 bg-[var(--bg-cream)] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EAE5DE] shadow-xs space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#EAE5DE] pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#EAE5DE] text-[#141312] text-xs font-bold uppercase tracking-wider mb-2">
                  <Building2 size={13} className="text-[#141312]" />
                  <span>Verified Counter Directory</span>
                </div>
                <h2 className="text-3xl font-black text-[#141312] tracking-tight">
                  Live Queues & Digital Counters
                </h2>
                <p className="text-sm text-[#736E66] mt-1">
                  Select an organization below to check live serving tokens, estimated wait minutes, and book your digital pass.
                </p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E988E]" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clinic, bank, campus, city..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE5DE] text-xs text-[#141312] placeholder-[#9E988E] focus:outline-none focus:ring-1 focus:ring-[#141312] focus:border-[#141312] transition-all"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#141312] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#736E66] hover:bg-[#F5F1E9] border border-[#EAE5DE]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Organization Cards Grid */}
            {loading ? (
              <Spinner size="lg" className="py-20" />
            ) : filteredOrgs.length === 0 ? (
              <div className="text-center py-20 bg-[#FAF7F2] border border-dashed border-[#EAE5DE] rounded-2xl p-8">
                <Building2 className="mx-auto text-[#9E988E] mb-3" size={32} />
                <h4 className="text-base font-bold text-[#141312]">No organizations found</h4>
                <p className="text-xs text-[#736E66] mt-1 max-w-sm mx-auto">
                  Try selecting a different category or adjusting your search term.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrgs.map((org) => (
                  <OrgCard key={org.ORG_ID} organization={org} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. SOCIAL PROOF & TESTIMONIALS */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#EAE5DE]">
        <SocialProofReviews />
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-16 sm:py-24 bg-[var(--bg-cream)]">
        <QuelessFaqSection />
      </section>

      {/* 8. BUSINESS CALL TO ACTION BANNER */}
      <section className="py-16 sm:py-24 bg-[var(--primary)] text-white border-t border-[#262422]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-8 sm:p-14 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 border border-[#262422] bg-[#1a1817]">
            <div className="space-y-2 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Enterprise & Counter Onboarding</span>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Are You a Clinic, Bank, University, or Salon?
              </h3>
              <p className="text-xs sm:text-sm text-[#9E988E] max-w-xl">
                Set up digital counters in under 2 minutes. Assign staff Google emails for auto-routing, download printable QR posters, and broadcast calls to waiting room TVs.
              </p>
            </div>

            <Link to="/admin/register" className="shrink-0 w-full sm:w-auto">
              <Button variant="white" size="lg" rightIcon={<ArrowRight size={16} />} className="font-bold px-8 rounded-xl w-full sm:w-auto bg-white text-[#141312] hover:bg-[#FAF7F2] cursor-pointer shadow-xs">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
