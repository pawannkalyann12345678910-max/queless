import React from 'react';

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

const CATEGORIES = [
  { id: 'All', label: 'All Services', icon: '✨' },
  { id: 'Clinic', label: 'Clinics', icon: '🩺' },
  { id: 'Hospital', label: 'Hospitals', icon: '🏥' },
  { id: 'Bank', label: 'Banks', icon: '🏦' },
  { id: 'University', label: 'Universities', icon: '🎓' },
  { id: 'Government', label: 'Public Services', icon: '🏛️' },
  { id: 'Salon', label: 'Salons & Spas', icon: '💇' },
  { id: 'Restaurant', label: 'Dining', icon: '🍽️' },
  { id: 'Retail', label: 'Retail', icon: '🛍️' },
  { id: 'Service Center', label: 'Support Centers', icon: '🔧' }
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ selected, onSelect }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 shrink-0 ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/40 border border-indigo-400/30 scale-105'
                : 'glass-panel text-slate-300 hover:text-white hover:bg-white/10 border-white/5'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
