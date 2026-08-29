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
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 shrink-0 ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/30 scale-105'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs'
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
