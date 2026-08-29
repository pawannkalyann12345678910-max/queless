import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { ProfileCompletionModal } from '../auth/ProfileCompletionModal';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="luxury-ecommerce min-h-screen flex flex-col bg-[var(--bg-cream)] text-[var(--text-main)] selection:bg-[#141312] selection:text-white w-full pb-14 sm:pb-0">
      <Header />
      <main className="flex-1 w-full bg-[var(--bg-cream)]">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      <ProfileCompletionModal />
    </div>
  );
};
