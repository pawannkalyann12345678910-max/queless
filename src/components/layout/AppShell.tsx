import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { ProfileCompletionModal } from '../auth/ProfileCompletionModal';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 selection:bg-blue-500 selection:text-white w-full pb-14 sm:pb-0">
      <Header />
      <main className="flex-1 w-full bg-white">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      <ProfileCompletionModal />
    </div>
  );
};
