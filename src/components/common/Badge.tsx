import React from 'react';
import type { TokenStatus, DelayStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate' | 'cyan' | 'purple';
  status?: TokenStatus | DelayStatus | string;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  size = 'md',
  dot = false,
  className = ''
}) => {
  // Determine variant automatically from status if not specified
  let effectiveVariant = variant || 'slate';

  if (status) {
    switch (status) {
      case 'WAITING':
        effectiveVariant = 'amber';
        break;
      case 'CALLED':
        effectiveVariant = 'indigo';
        break;
      case 'SERVING':
        effectiveVariant = 'emerald';
        break;
      case 'COMPLETED':
        effectiveVariant = 'cyan';
        break;
      case 'NO_SHOW':
      case 'CANCELLED':
      case 'REJECTED_5M':
        effectiveVariant = 'rose';
        break;
      case 'REQUESTED_5M':
        effectiveVariant = 'amber';
        break;
      case 'APPROVED_5M':
        effectiveVariant = 'emerald';
        break;
      case 'RESCHEDULED':
        effectiveVariant = 'purple';
        break;
    }
  }

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 font-medium tracking-wide",
    md: "text-xs px-2.5 py-1 font-medium",
    lg: "text-sm px-3.5 py-1.5 font-semibold"
  };

  const variantStyles = {
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    slate: "bg-slate-700/40 text-slate-300 border-slate-600/40",
    cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    purple: "bg-purple-500/15 text-purple-300 border-purple-500/30"
  };

  const dotColors = {
    emerald: "bg-emerald-400",
    indigo: "bg-indigo-400 animate-pulse",
    amber: "bg-amber-400 animate-pulse",
    rose: "bg-rose-400",
    slate: "bg-slate-400",
    cyan: "bg-cyan-400",
    purple: "bg-purple-400"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeStyles[size]} ${variantStyles[effectiveVariant]} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[effectiveVariant]}`} />
      )}
      {children || status}
    </span>
  );
};
