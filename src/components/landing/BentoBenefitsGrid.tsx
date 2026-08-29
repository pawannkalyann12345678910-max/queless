import React from 'react';
import { 
  Clock, 
  BellRing, 
  QrCode, 
  Hourglass, 
  Tv, 
  Layers, 
  CheckCircle2, 
  Zap 
} from 'lucide-react';

export const BentoBenefitsGrid: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#141312] text-xs font-bold uppercase tracking-wider border border-[#EAE5DE] shadow-2xs">
          <Layers size={13} className="text-[#C28E5C]" />
          The Queless Architecture
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-[#141312] tracking-tight">
          Built for Velocity. Zero Waiting Lines.
        </h2>
        <p className="text-xs sm:text-sm text-[#736E66]">
          A full-stack suite of real-time queue orchestration tools engineered for any high-volume counter.
        </p>
      </div>

      {/* Bento 12-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Tile 1 (Span 8): Real-Time Token Turn Countdown & Mobile Live Pass */}
        <div className="md:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE5DE] shadow-xs flex flex-col justify-between hover:border-[#C4BDAF] transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EAE5DE] text-[#141312] flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#141312] tracking-tight">
              Live Token Turn Countdown & Remote Mobile Pass
            </h3>
            <p className="text-xs sm:text-sm text-[#736E66] leading-relaxed max-w-xl">
              Customers hold their place in line without being trapped in the waiting room. Live WebSocket algorithms continuously calculate position and dynamic wait minutes.
            </p>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE5DE] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black text-[#141312] font-mono">#B-104</div>
              <div className="text-xs text-[#736E66] font-medium">Dr. Peterson • General OPD</div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <CheckCircle2 size={14} /> 2 Tokens Ahead (~6 mins)
            </div>
          </div>
        </div>

        {/* Tile 2 (Span 4): 10-Min Proximity Alert */}
        <div className="md:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE5DE] shadow-xs flex flex-col justify-between hover:border-[#C4BDAF] transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EAE5DE] text-[#C28E5C] flex items-center justify-center font-bold">
              <BellRing size={20} />
            </div>
            <h3 className="text-xl font-black text-[#141312] tracking-tight">
              10-Min Proximity Buzz
            </h3>
            <p className="text-xs sm:text-sm text-[#736E66] leading-relaxed">
              Automated sound and visual alerts trigger 5 tokens ahead so patients and visitors arrive right on time.
            </p>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE5DE] text-xs font-bold text-[#141312] flex items-center gap-2">
            <Zap size={14} className="text-[#C28E5C]" /> Sound & visual alarm activated
          </div>
        </div>

        {/* Tile 3 (Span 4): Zero-Friction QR Scan */}
        <div className="md:col-span-4 bg-white rounded-3xl p-6 border border-[#EAE5DE] space-y-2.5 hover:border-[#C4BDAF] transition-all shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EAE5DE] text-emerald-700 flex items-center justify-center font-bold">
            <QrCode size={20} />
          </div>
          <h4 className="text-base font-bold text-[#141312]">Instant QR Poster Passes</h4>
          <p className="text-xs text-[#736E66] leading-relaxed">
            Download high-res printable QR posters for counter desks. Visitors scan with camera to join immediately.
          </p>
        </div>

        {/* Tile 4 (Span 4): Delay +5m Negotiator */}
        <div className="md:col-span-4 bg-white rounded-3xl p-6 border border-[#EAE5DE] space-y-2.5 hover:border-[#C4BDAF] transition-all shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EAE5DE] text-[#C28E5C] flex items-center justify-center font-bold">
            <Hourglass size={20} />
          </div>
          <h4 className="text-base font-bold text-[#141312]">+5 Min Delay Negotiator</h4>
          <p className="text-xs text-[#736E66] leading-relaxed">
            Running late from parking? Request a 5-minute shift down the queue with 1-click staff operator approval.
          </p>
        </div>

        {/* Tile 5 (Span 4): Waiting Room TV Broadcast */}
        <div className="md:col-span-4 bg-white rounded-3xl p-6 border border-[#EAE5DE] space-y-2.5 hover:border-[#C4BDAF] transition-all shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EAE5DE] text-[#141312] flex items-center justify-center font-bold">
            <Tv size={20} />
          </div>
          <h4 className="text-base font-bold text-[#141312]">HDMI TV Broadcast</h4>
          <p className="text-xs text-[#736E66] leading-relaxed">
            Full-screen waiting room TV display with chime audio and automatic token turn transitions.
          </p>
        </div>

      </div>
    </section>
  );
};
