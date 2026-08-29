import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glow?: 'indigo' | 'emerald' | 'amber' | 'none';
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  interactive = false,
  children,
  className = '',
  ...props
}) => {
  const baseClass = interactive 
    ? 'bg-white rounded-xl p-5 border border-zinc-200 shadow-xs hover:border-zinc-400 hover:shadow-md transition-all cursor-pointer' 
    : 'bg-white rounded-xl p-5 border border-zinc-200 shadow-xs';

  return (
    <div
      className={`${baseClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
