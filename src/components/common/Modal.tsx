import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl'
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Clean solid dark overlay */}
      <div 
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={() => {
          if (!preventClose && onClose) onClose();
        }}
      />

      {/* Centered Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 relative z-10">
        <div className={`relative w-full ${maxWidthStyles[maxWidth]} bg-white border border-zinc-200 rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col`}>
          {(title || !preventClose) && (
            <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-zinc-200 shrink-0">
              <div>
                {title && <h3 className="text-lg font-black text-black tracking-tight">{title}</h3>}
                {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
              </div>
              {!preventClose && onClose && (
                <button
                  onClick={onClose}
                  className="text-zinc-400 hover:text-black p-1 rounded-md hover:bg-zinc-100 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          )}

          <div className="overflow-y-auto flex-1 pr-1 -mr-1 text-zinc-900">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
