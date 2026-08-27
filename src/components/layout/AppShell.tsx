import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ProfileCompletionModal } from '../auth/ProfileCompletionModal';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
      <ProfileCompletionModal />
    </div>
  );
};
