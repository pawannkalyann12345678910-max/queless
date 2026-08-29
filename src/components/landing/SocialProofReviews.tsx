import React from 'react';
import { Star, CheckCircle2, MessageSquare } from 'lucide-react';

interface Review {
  name: string;
  role: string;
  org: string;
  city: string;
  quote: string;
  metric: string;
}

const REVIEWS: Review[] = [
  {
    name: "Dr. Elena Rostova",
    role: "Clinical Director",
    org: "Apex Outpatient Medical Center",
    city: "Chicago, IL",
    quote: "Our waiting rooms used to be overwhelmed with anxious patients. With Queless, patients wait safely in their cars or grab a coffee nearby until their 10-minute buzz sounds. Congestion dropped by 85%.",
    metric: "Wait Room Crowding: -85%"
  },
  {
    name: "Marcus Vance",
    role: "Head of Branch Operations",
    org: "Horizon Credit Union",
    city: "Austin, TX",
    quote: "We replaced three $4,500 kiosk machines with simple QR counter posters. Teller efficiency increased immediately, and walkaway customer abandonment virtually vanished.",
    metric: "Hardware Cost: $0 Kiosks"
  },
  {
    name: "Aaliyah Patel",
    role: "University Registrar",
    org: "State University Academic Affairs",
    city: "Seattle, WA",
    quote: "During rush week, our student lines used to stretch down the entire second-floor hallway. Queless routed 2,400+ students smoothly across 12 desks with zero chaos.",
    metric: "Throughput: +42% Daily Volume"
  }
];

export const SocialProofReviews: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#141312] text-xs font-bold uppercase tracking-wider border border-[#EAE5DE] shadow-2xs">
          <MessageSquare size={13} className="text-[#C28E5C]" />
          Verified Stories from Counter Hosts & Visitors
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-[#141312] tracking-tight">
          Trusted by High-Volume Organizations
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REVIEWS.map((r) => (
          <div
            key={r.name}
            className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAE5DE] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#C4BDAF] transition-all"
          >
            <div className="space-y-3">
              {/* Stars */}
              <div className="flex items-center gap-1 text-[#C28E5C]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="fill-[#C28E5C] text-[#C28E5C]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-xs sm:text-sm text-[#736E66] leading-relaxed italic">
                "{r.quote}"
              </p>
            </div>

            <div className="pt-4 border-t border-[#EAE5DE] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#141312] flex items-center gap-1">
                    {r.name}
                    <CheckCircle2 size={13} className="text-emerald-600" />
                  </h4>
                  <p className="text-xs text-[#9E988E]">{r.role} • {r.org}</p>
                </div>
              </div>

              <span className="inline-block text-[11px] font-bold text-[#141312] bg-[#FAF7F2] px-2.5 py-0.5 rounded-md border border-[#EAE5DE]">
                {r.metric}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
