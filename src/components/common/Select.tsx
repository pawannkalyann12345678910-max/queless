import React from 'react';
import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`block w-full rounded-xl bg-slate-900/80 border ${
          error ? 'border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500'
        } px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 transition-all ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-400 font-medium">{error}</p>}
    </div>
  );
};
