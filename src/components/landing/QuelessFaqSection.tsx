import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FaqItem {
  question: string;
  answer: string;
  category: 'customers' | 'business' | 'tech';
}

const FAQS: FaqItem[] = [
  {
    category: 'customers',
    question: 'Do customers need to download a mobile app?',
    answer: 'No. Queless operates completely as a web application. Customers simply scan an on-site counter QR code or search the directory from any browser to get their digital token pass instantly.'
  },
  {
    category: 'customers',
    question: 'How do proximity buzz alerts work?',
    answer: 'When your position is 5 tokens away (approx. 10 minutes before your turn), Queless sounds a chime on your mobile browser and displays an active arrival countdown banner.'
  },
  {
    category: 'customers',
    question: 'What if I am running 5 minutes late?',
    answer: 'You can tap the "+5 Mins Delay" button on your active pass. The staff operator will see your request in their counter dashboard and can grant the extension with one click.'
  },
  {
    category: 'business',
    question: 'How do staff members access their counter?',
    answer: 'Staff members simply sign in with their authorized Google email. The system instantly detects their assignment and auto-routes them directly to their assigned counter queue desk.'
  },
  {
    category: 'tech',
    question: 'How does the Waiting Room HDMI TV screen work?',
    answer: 'Any smart TV, external monitor, or cast device can open the dedicated `/display/:orgId` route. It displays high-contrast public tokens, counter numbers, and voice chimes with zero customer personal data.'
  }
];

export const QuelessFaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [filter, setFilter] = useState<'all' | 'customers' | 'business' | 'tech'>('all');

  const filteredFaqs = filter === 'all' ? FAQS : FAQS.filter(f => f.category === filter);

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#141312] text-xs font-bold uppercase tracking-wider border border-[#EAE5DE] shadow-2xs">
          <HelpCircle size={13} className="text-[#C28E5C]" />
          Frequently Asked Questions
        </span>
        <h3 className="text-2xl sm:text-4xl font-black text-[#141312] tracking-tight">
          Everything You Need to Know About Queless
        </h3>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { id: 'all', label: 'All Questions' },
          { id: 'customers', label: 'For Visitors & Patients' },
          { id: 'business', label: 'For Organizations & Staff' },
          { id: 'tech', label: 'Display TV & Security' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === tab.id
                ? 'bg-[#141312] text-white shadow-xs'
                : 'bg-white text-[#736E66] hover:bg-[#FAF7F2] border border-[#EAE5DE]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.question}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isOpen ? 'bg-white border-[#C4BDAF] shadow-xs' : 'bg-white border-[#EAE5DE] hover:border-[#D3CCC2]'
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-[#141312] text-sm sm:text-base cursor-pointer"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 ml-4 text-[#736E66] transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[#141312]' : ''
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <div className="px-4 sm:px-5 pb-4 pt-1 text-xs sm:text-sm text-[#736E66] leading-relaxed border-t border-[#EAE5DE]">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};
