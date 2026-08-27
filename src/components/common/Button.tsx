import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'emerald' | 'amber' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2.5 gap-2",
    lg: "text-base px-5 py-3 gap-2.5",
    xl: "text-lg px-7 py-3.5 gap-3 font-semibold"
  };

  const variantStyles = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 focus:ring-indigo-500 border border-indigo-500/30",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-500",
    emerald: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 focus:ring-emerald-500 border border-emerald-500/30",
    amber: "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 focus:ring-amber-500 border border-amber-500/30",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 focus:ring-rose-500 border border-rose-500/30",
    ghost: "bg-transparent hover:bg-white/10 text-slate-300 hover:text-white focus:ring-slate-400",
    glass: "bg-white/10 hover:bg-white/15 text-white backdrop-blur-md border border-white/10 shadow-lg shadow-black/20 focus:ring-white/30"
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
