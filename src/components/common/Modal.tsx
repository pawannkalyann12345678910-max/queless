import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  preventClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  preventClose = false
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!preventClose && onClose) onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className={`relative w-full ${maxWidthStyles[maxWidth]} glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-200 z-10 max-h-[90vh] overflow-y-auto`}>
        {(title || !preventClose) && (
          <div className="flex items-start justify-between gap-4 mb-5 pb-3 border-b border-white/10">
            <div>
              {title && <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            </div>
            {!preventClose && onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
