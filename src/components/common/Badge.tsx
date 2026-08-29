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
    sm: "text-[11px] px-2 py-0.5 font-semibold rounded-md",
    md: "text-xs px-2.5 py-0.5 font-semibold rounded-lg",
    lg: "text-xs px-3 py-1 font-bold rounded-lg"
  };

  const variantStyles = {
    neutral: "bg-[#FAF7F2] text-[#141312] border-[#EAE5DE]",
    slate: "bg-[#FAF7F2] text-[#736E66] border-[#EAE5DE]",
    emerald: "bg-emerald-50/80 text-emerald-800 border-emerald-200/80",
    indigo: "bg-[#FAF7F2] text-[#141312] border-[#EAE5DE]",
    amber: "bg-amber-50/80 text-amber-900 border-amber-200/80",
    rose: "bg-rose-50/80 text-rose-800 border-rose-200/80",
    cyan: "bg-[#FAF7F2] text-[#141312] border-[#EAE5DE]",
    purple: "bg-purple-50/80 text-purple-800 border-purple-200/80"
  };

  const dotColors = {
    neutral: "bg-[#736E66]",
    slate: "bg-[#736E66]",
    emerald: "bg-emerald-600",
    indigo: "bg-[#141312]",
    amber: "bg-amber-600",
    rose: "bg-rose-600",
    cyan: "bg-[#141312]",
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
