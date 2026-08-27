import React from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`block w-full rounded-xl bg-slate-900/80 border ${
            error ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500'
          } ${leftIcon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-400">{helperText}</p>}
    </div>
  );
};
