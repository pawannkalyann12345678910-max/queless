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
    <div className="w-full text-left">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`block w-full rounded-lg bg-white border ${
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-zinc-300 focus:border-black focus:ring-black'
        } px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 transition-all ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-black">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};
