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
    <div className="w-full text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-xs">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`block w-full rounded-lg bg-white border ${
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-zinc-300 focus:border-black focus:ring-black'
          } ${leftIcon ? 'pl-9' : 'pl-3'} pr-3 py-2 text-sm text-black placeholder-zinc-400 focus:outline-none focus:ring-1 transition-all ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-zinc-500">{helperText}</p>}
    </div>
  );
};
