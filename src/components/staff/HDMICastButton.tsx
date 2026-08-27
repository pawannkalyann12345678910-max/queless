import React from 'react';
import { Button } from '../common/Button';
import { Tv, ExternalLink } from 'lucide-react';

interface HDMICastButtonProps {
  queueId: string;
  queueName?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'emerald' | 'amber' | 'glass';
}

export const HDMICastButton: React.FC<HDMICastButtonProps> = ({
  queueId,
  className = '',
  variant = 'glass'
}) => {
  const handleLaunchDisplay = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `/display/${queueId}`;
    window.open(url, '_blank');
  };

  return (
    <a
      href={`/display/${queueId}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleLaunchDisplay}
      className="inline-block no-underline"
    >
      <Button
        type="button"
        variant={variant}
        size="sm"
        className={`font-semibold border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-cyan-600/20 shadow-lg shadow-cyan-500/10 ${className}`}
        leftIcon={<Tv size={16} className="text-cyan-400" />}
        rightIcon={<ExternalLink size={12} className="opacity-70" />}
      >
        Launch Public HDMI Screen
      </Button>
    </a>
  );
};
