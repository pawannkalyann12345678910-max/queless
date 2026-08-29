import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useScroll } from 'framer-motion';
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

  // Hero Scroll Runway
  const heroScrollTrackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroScrollTrackRef,
    offset: ["start start", "end end"]
  });

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
    <div className="space-y-16 sm:space-y-24 pb-20 sm:pb-12 text-zinc-900 bg-white w-full">
      
      {/* 1. PINNED 2-COLUMN HERO STAGE WITH MOBILE RESPONSIVENESS */}
      <div ref={heroScrollTrackRef} className="relative h-[220vh] sm:h-[300vh] w-full bg-white">
        <div className="sticky top-16 h-[calc(100vh-4rem)] w-full flex flex-col justify-center overflow-hidden bg-white z-10 py-2 sm:py-4">
          <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-center">
            
            {/* DESKTOP LAYOUT (2 Columns) */}
            <div className="hidden lg:grid grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Typography & CTAs (5 cols) */}
              <div className="col-span-5 text-left space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-bold uppercase tracking-wider">
                  <Sparkles size={14} className="text-blue-600" />
                  <span>Smart Digital Pass & Live Queue Flow</span>
                </div>

                <h1 className="text-5xl xl:text-7xl font-black tracking-tight text-black leading-[1.03]">
                  Eliminate Physical Lines. <br />
                  <span className="text-blue-600">
                    Turn Any Counter Into A Live Digital Pass.
                  </span>
                </h1>

                <p className="text-lg xl:text-xl text-zinc-600 leading-relaxed font-normal">
                  Replace hardware kiosks with instant mobile ticketing, live turn algorithms, 10-minute proximity buzz alerts, and waiting room HDMI TV broadcasting.
                </p>

                {/* CTAs */}
                <div className="flex items-center gap-3.5 pt-2">
                  {user ? (
                    <a href="#explore-counters">
                      <Button
                        variant="primary"
                        size="lg"
                        className="font-bold px-8 py-3.5 text-base bg-black hover:bg-zinc-800 text-white rounded-xl shadow-sm"
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
                      className="font-bold px-8 py-3.5 text-base bg-black hover:bg-zinc-800 text-white rounded-xl shadow-sm"
                      rightIcon={<ArrowRight size={18} />}
                    >
                      Sign In to View Counters
                    </Button>
                  )}

                  <Link to="/admin/register">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="font-bold border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-900 rounded-xl px-7 py-3.5 text-base"
                      leftIcon={<Zap size={18} className="text-amber-500" />}
                    >
                      Setup Business (Free)
                    </Button>
                  </Link>
                </div>

                {/* Trust Proof Checklist */}
                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-600">
                  <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <Check size={14} className="stroke-[3]" /> Zero App Download
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                    <Check size={14} className="stroke-[3]" /> Real-Time Sync
                  </span>
                  <span className="flex items-center gap-1.5 text-zinc-800 bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
                    <Check size={14} className="stroke-[3]" /> HDMI TV Screen Cast
                  </span>
                </div>
              </div>

              {/* Right Column: Animation Canvas (7 cols) */}
              <div className="col-span-7 relative flex items-center justify-center">
                <div className="w-full relative bg-white">
                  <HeroCanvasScrubber scrollProgress={scrollYProgress} />
                </div>
              </div>
            </div>

            {/* MOBILE / TABLET LAYOUT (Stacked, perfectly fitted to viewport) */}
            <div className="lg:hidden flex flex-col justify-between h-full py-2 space-y-2">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles size={12} className="text-blue-600" />
                  <span>Smart Digital Queue Pass</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black leading-tight">
                  Eliminate Physical Lines. <br />
                  <span className="text-blue-600">Live Digital Pass.</span>
                </h1>
              </div>

              {/* Prominent High-Definition Animation Stage on Mobile */}
              <div className="w-full flex-1 flex items-center justify-center min-h-[180px] max-h-[48vh] relative overflow-hidden bg-white">
                <HeroCanvasScrubber scrollProgress={scrollYProgress} />
              </div>

              {/* Mobile CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {user ? (
                  <a href="#explore-counters" className="w-full">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full font-bold bg-black text-white rounded-lg py-2.5 text-xs"
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
                    className="w-full font-bold bg-black text-white rounded-lg py-2.5 text-xs"
                    rightIcon={<ArrowRight size={14} />}
                  >
                    Sign In to Book Passes
                  </Button>
                )}

                <Link to="/admin/register" className="w-full">
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full font-bold border border-zinc-300 bg-white text-black rounded-lg py-2.5 text-xs"
                  >
                    Setup Business
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. KINETIC MARQUEE TICKER */}
      <div className="bg-black text-white py-3 overflow-hidden whitespace-nowrap border-y border-zinc-800">
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

      {/* 3. BENTO BENEFITS & ARCHITECTURE SHOWCASE */}
      <BentoBenefitsGrid />

      {/* 4. INTERACTIVE ROI & WAITING TIME COST CALCULATOR */}
      <InteractiveRoiCalculator />

      {/* 5. LIVE COUNTER DIRECTORY & PUBLIC EXPLORE */}
      <section id="explore-counters" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Building2 size={13} className="text-black" />
              <span>Verified Counter Directory</span>
            </div>
            <h2 className="text-3xl font-black text-black tracking-tight">
              Live Queues & Digital Counters
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Select an organization below to check live serving tokens, estimated wait minutes, and book your digital pass.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clinic, bank, campus, city..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-300 text-xs text-black placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
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
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
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
          <div className="text-center py-20 bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl p-8">
            <Building2 className="mx-auto text-zinc-400 mb-3" size={32} />
            <h4 className="text-base font-bold text-black">No organizations found</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
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
      </section>

      {/* 6. SOCIAL PROOF & TESTIMONIALS */}
      <SocialProofReviews />

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <QuelessFaqSection />

      {/* 8. BUSINESS CALL TO ACTION BANNER */}
      <section className="bg-black text-white rounded-2xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 max-w-7xl mx-auto mx-4 sm:mx-auto">
        <div className="space-y-2 text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Enterprise & Counter Onboarding</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Are You a Clinic, Bank, University, or Salon?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
            Set up digital counters in under 2 minutes. Assign staff Google emails for auto-routing, download printable QR posters, and broadcast calls to waiting room TVs.
          </p>
        </div>

        <Link to="/admin/register" className="shrink-0 w-full sm:w-auto">
          <Button variant="white" size="lg" rightIcon={<ArrowRight size={16} />} className="font-bold px-8 rounded-lg w-full sm:w-auto">
            Get Started Free
          </Button>
        </Link>
      </section>

    </div>
  );
};
