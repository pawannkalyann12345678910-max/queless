import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glow?: 'indigo' | 'emerald' | 'amber' | 'none';
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  interactive = false,
  glow = 'none',
  children,
  className = '',
  ...props
}) => {
  const glowClasses = {
    indigo: 'glow-indigo',
    emerald: 'glow-emerald',
    amber: 'glow-amber',
    none: ''
  };

  const baseClass = interactive ? 'glass-panel-interactive cursor-pointer' : 'glass-panel';

  return (
    <div
      className={`${baseClass} rounded-2xl p-5 ${glowClasses[glow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
