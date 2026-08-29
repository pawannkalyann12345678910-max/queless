import React from 'react';
import type { TokenStatus, DelayStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate' | 'cyan' | 'purple' | 'neutral';
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
  let effectiveVariant = variant || 'neutral';

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
    sm: "text-[11px] px-2 py-0.5 font-medium rounded-md",
    md: "text-xs px-2.5 py-0.5 font-medium rounded-md",
    lg: "text-xs px-3 py-1 font-semibold rounded-md"
  };

  const variantStyles = {
    neutral: "bg-zinc-100 text-zinc-800 border-zinc-200",
    slate: "bg-zinc-100 text-zinc-800 border-zinc-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    indigo: "bg-blue-50 text-blue-800 border-blue-200/80",
    amber: "bg-amber-50 text-amber-900 border-amber-200/80",
    rose: "bg-red-50 text-red-800 border-red-200/80",
    cyan: "bg-zinc-100 text-zinc-900 border-zinc-200",
    purple: "bg-purple-50 text-purple-800 border-purple-200/80"
  };

  const dotColors = {
    neutral: "bg-zinc-500",
    slate: "bg-zinc-500",
    emerald: "bg-emerald-600",
    indigo: "bg-blue-600",
    amber: "bg-amber-600",
    rose: "bg-red-600",
    cyan: "bg-zinc-700",
    purple: "bg-purple-600"
  };

  // Convert raw status codes into human readable Title Case
  let content = children || status;
  if (typeof content === 'string') {
    if (content === 'LIVE ACTIVE' || content === 'Live Active') content = 'Live Active';
    else if (content === 'WAITING') content = 'Waiting';
    else if (content === 'SERVING') content = 'Serving';
    else if (content === 'CALLED') content = 'Called';
    else if (content === 'COMPLETED') content = 'Completed';
    else if (content === 'NO_SHOW') content = 'No Show';
    else if (content === 'CANCELLED') content = 'Cancelled';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 border leading-tight select-none ${sizeStyles[size]} ${variantStyles[effectiveVariant]} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[effectiveVariant]}`} />
      )}
      {content}
    </span>
  );
};
