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
    ? 'bg-white rounded-3xl p-6 border border-[#EAE5DE] shadow-2xs hover:border-[#C4BDAF] hover:shadow-md transition-all cursor-pointer' 
    : 'bg-white rounded-3xl p-6 border border-[#EAE5DE] shadow-2xs';

  return (
    <div
      className={`${baseClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
