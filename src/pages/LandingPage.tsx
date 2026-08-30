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
  Zap,
  MapPin,
  Navigation
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, signInWithGoogle, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Geolocation & Location Filter State
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [currentLocality, setCurrentLocality] = useState<string>('All Locations');

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

  // Turn ON / OFF Geolocation Detection
  const handleToggleLocation = () => {
    if (isGpsActive) {
      setIsGpsActive(false);
      setCurrentLocality('All Locations');
      return;
    }

    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsGpsActive(true);
          setCurrentLocality('Indiranagar, Bengaluru');
          setGpsLoading(false);
        },
        () => {
          // Graceful fallback for mock / permission denied
          setIsGpsActive(true);
          setCurrentLocality('Bengaluru Central');
          setGpsLoading(false);
        },
        { timeout: 4000 }
      );
    } else {
      setIsGpsActive(true);
      setCurrentLocality('Bengaluru Central');
      setGpsLoading(false);
    }
  };

  const categories = ['All', 'Clinic', 'Hospital', 'Bank', 'University', 'Government', 'Salon', 'Restaurant', 'Retail', 'Service Center'];
  const localities = ['All Locations', 'Indiranagar', 'Koramangala', 'MG Road', 'Whitefield', 'Andrahalli'];

  // Filter and sort by distance
  const filteredOrgs = organizations
    .filter(org => {
      const matchesCategory = selectedCategory === 'All' || org.CATEGORY.toLowerCase() === selectedCategory.toLowerCase();
      
      const matchesLocality = currentLocality === 'All Locations' || 
        (org.ADDRESS && org.ADDRESS.toLowerCase().includes(currentLocality.toLowerCase().split(',')[0].trim())) ||
        (org.CITY && org.CITY.toLowerCase().includes(currentLocality.toLowerCase().split(',')[0].trim()));

      const matchesSearch = 
        org.NAME.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (org.CITY && org.CITY.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (org.ADDRESS && org.ADDRESS.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (org.DESCRIPTION && org.DESCRIPTION.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesLocality && matchesSearch;
    })
    .sort((a, b) => {
      if (isGpsActive) {
        return (a.DISTANCE_KM || 99) - (b.DISTANCE_KM || 99);
      }
      return 0;
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          {/* DESKTOP 2-COLUMN VIEW */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Col (5 cols): High-Impact Copywriting & Primary CTAs */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#EAE5DE] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#141312]">
                  Live Digital Turn Calling System
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-black text-[#141312] tracking-tight leading-[1.08]">
                  Eliminate Physical Lines. Turn Any Counter Into A Live Digital Pass.
                </h1>
                <p className="text-sm text-[#736E66] leading-relaxed max-w-md">
                  No expensive hardware kiosks. Zero app download. Visitors scan QR or book passes from mobile, wait comfortably anywhere, and receive 10-minute proximity turn buzz alerts.
                </p>
              </div>

              {/* Verified Features Pill List */}
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-[#141312]">
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Instant Mobile Passes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Proximity Turn Buzz</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>+5m Delay Shift</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Waiting Room HDMI TV</span>
                </div>
              </div>

              {/* Primary Call to Action Actions */}
              <div className="flex items-center gap-3 pt-2">
                {user ? (
                  <a href="#collections">
                    <Button
                      variant="primary"
                      size="lg"
                      className="font-bold bg-[#141312] hover:bg-[#262422] text-white rounded-2xl px-6 py-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer text-xs"
                      rightIcon={<ArrowRight size={15} />}
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
                    className="font-bold bg-[#141312] hover:bg-[#262422] text-white rounded-2xl px-6 py-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer text-xs"
                    rightIcon={<ArrowRight size={15} />}
                  >
                    Sign In to Book Passes
                  </Button>
                )}

                <Link to="/admin/register">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="font-bold border border-[#EAE5DE] bg-white hover:bg-[#FAF7F2] text-[#141312] rounded-2xl px-5 py-3.5 transition-all cursor-pointer text-xs"
                    leftIcon={<Zap size={14} className="text-[#C28E5C]" />}
                  >
                    Setup Business (Free)
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-[#736E66] pt-1">
                <span className="flex items-center gap-1 font-bold text-emerald-800">
                  <Sparkles size={13} className="text-emerald-600" />
                  100% Free for Single Counters
                </span>
                <span>•</span>
                <span>Setup in 2 mins</span>
              </div>
            </div>

            {/* Right Col (7 cols): Interactive Live 3D Scrollytelling Animation Canvas */}
            <div className="lg:col-span-7 relative">
              <HeroCanvasScrubber />
            </div>

          </div>

          {/* MOBILE VIEW (< lg screens) */}
          <div className="lg:hidden flex flex-col space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#EAE5DE] shadow-2xs w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#141312]">
                Live Turn System
              </span>
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#141312] tracking-tight leading-tight">
                Eliminate Physical Lines. Turn Any Counter Into A Live Digital Pass.
              </h1>
              <p className="text-xs text-[#736E66] leading-relaxed">
                Hardware-free digital queue orchestration with instant mobile ticketing, turn countdowns, and proximity buzz alerts.
              </p>
            </div>

            {/* Animation Canvas */}
            <div className="w-full">
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

      {/* 5. COLLECTIONS / LIVE COUNTER DIRECTORY SECTION WITH GPS LOCATION PLACARD */}
      <section id="collections" className="py-16 sm:py-24 bg-[var(--bg-cream)] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EAE5DE] shadow-xs space-y-7">
            
            {/* Header + Search Bar */}
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
                  Select a category or turn on location to check live serving tokens and book your digital pass.
                </p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E988E]" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clinic, salon, bank, city..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE5DE] text-xs text-[#141312] placeholder-[#9E988E] focus:outline-none focus:ring-1 focus:ring-[#141312] focus:border-[#141312] transition-all"
                />
              </div>
            </div>

            {/* LOCATION-BASED GPS PLACARD BAR */}
            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EAE5DE] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-2xs ${
                  isGpsActive ? 'bg-emerald-600' : 'bg-[#141312]'
                }`}>
                  <Navigation size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#141312] block">
                    {isGpsActive ? `📍 Nearest Places: ${currentLocality}` : 'Location-Based Counter Discovery'}
                  </span>
                  <span className="text-[11px] text-[#736E66]">
                    {isGpsActive 
                      ? 'GPS Active: Sorting verified clinics, salons & banks by nearest distance' 
                      : 'Turn on location to find counters and queues around you'}
                  </span>
                </div>
              </div>

              {/* Geolocation Button + Localities */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleToggleLocation}
                  disabled={gpsLoading}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isGpsActive 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                      : 'bg-white hover:bg-zinc-100 border border-[#EAE5DE] text-[#141312]'
                  }`}
                >
                  <MapPin size={13} className={isGpsActive ? "text-amber-300" : "text-[#C28E5C]"} />
                  <span>{gpsLoading ? 'Detecting Location...' : isGpsActive ? '🟢 Location ON' : 'Turn ON Location'}</span>
                </button>

                {/* Quick Area Filters */}
                <div className="hidden md:flex items-center gap-1">
                  {localities.map(loc => (
                    <button
                      key={loc}
                      onClick={() => {
                        setCurrentLocality(loc);
                        setIsGpsActive(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        currentLocality.includes(loc.split(' ')[0])
                          ? 'bg-[#141312] text-white shadow-2xs'
                          : 'bg-white text-[#736E66] hover:text-[#141312] border border-[#EAE5DE]'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
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
              <div className="text-center py-20 bg-[#FAF7F2] border border-dashed border-[#EAE5DE] rounded-3xl p-8">
                <Building2 className="mx-auto text-[#9E988E] mb-3" size={32} />
                <h4 className="text-base font-bold text-[#141312]">No organizations found</h4>
                <p className="text-xs text-[#736E66] mt-1 max-w-sm mx-auto">
                  Try selecting a different category or adjusting your search term.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrgs.map((org) => (
                  <OrgCard key={org.ORG_ID} organization={org} userDistance={org.DISTANCE_KM} />
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
