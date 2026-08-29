import React from 'react';
import { Search, MapPin, X } from 'lucide-react';

interface SearchBarProps {
  search: string;
  city: string;
  onSearchChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onClear: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  search,
  city,
  onSearchChange,
  onCityChange,
  onClear
}) => {
  return (
    <div className="w-full bg-white rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-center gap-2 border border-slate-200 shadow-md">
      {/* Search keywords */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by hospital, bank, clinic, university, service..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* City / Location filter */}
      <div className="relative w-full sm:w-56">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="City / Location"
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>

      {(search || city) && (
        <button
          onClick={onClear}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors whitespace-nowrap"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
};
