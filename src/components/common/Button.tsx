import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'emerald' | 'amber' | 'danger' | 'ghost' | 'glass' | 'white';
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
  const baseStyles = "inline-flex items-center justify-center font-bold transition-colors duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-5 py-2.5 gap-2.5",
    xl: "text-base px-6 py-3 gap-3"
  };

  const variantStyles = {
    primary: "bg-black hover:bg-zinc-800 text-white shadow-xs focus:ring-zinc-900",
    secondary: "bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 shadow-xs focus:ring-zinc-400",
    white: "bg-white hover:bg-zinc-100 !text-black border border-transparent shadow-sm focus:ring-white",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-emerald-600",
    amber: "bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus:ring-amber-600",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-xs focus:ring-red-600",
    ghost: "bg-transparent hover:bg-zinc-100 text-zinc-700 focus:ring-zinc-400",
    glass: "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 focus:ring-zinc-400"
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
