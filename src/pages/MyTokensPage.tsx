import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePolling } from '../hooks/usePolling';
import { api } from '../services/api';
import type { Token } from '../types';
import { LiveTokenPass } from '../components/customer/LiveTokenPass';
import { TokenHistoryCard } from '../components/customer/TokenHistoryCard';
import { Spinner } from '../components/common/Spinner';
import { Button } from '../components/common/Button';
import { Ticket, History, Compass, ArrowRight } from 'lucide-react';

export const MyTokensPage: React.FC = () => {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTokens = async () => {
    if (!user) return;
    try {
      const res = await api.getMyTokens();
      setTokens(res.tokens);
    } catch (err) {
      console.error('Failed to load user tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll active tokens every 4 seconds
  usePolling(loadTokens, 4000, !!user);

  if (!user) {
    return (
      <div className="text-center py-24 glass-panel rounded-3xl p-8 max-w-lg mx-auto border border-white/10">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 mb-4">
          <Ticket size={32} />
        </div>
        <h3 className="text-xl font-bold text-white">Sign In to View Your Passes</h3>
        <p className="text-xs text-slate-400 mt-2 mb-6">
          Sign in with your Google account to view active passes, live queue countdowns, and ticket history.
        </p>
        <Link to="/">
          <Button variant="primary" size="md">
            Explore Queues
          </Button>
        </Link>
      </div>
    );
  }

  if (loading && tokens.length === 0) {
    return <Spinner size="lg" className="py-24" />;
  }

  const activeTokens = tokens.filter(t => ['WAITING', 'CALLED', 'SERVING'].includes(t.STATUS));
  const pastTokens = tokens.filter(t => ['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(t.STATUS));

  return (
    <div className="space-y-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Ticket className="text-indigo-400" size={28} />
            My Digital Passes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time live queue tracking with turn countdowns and proximity alerts.
          </p>
        </div>

        <Link to="/">
          <Button variant="glass" size="sm" leftIcon={<Compass size={16} />}>
            Explore More Queues
          </Button>
        </Link>
      </div>

      {/* Active Passes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Active Passes in Progress ({activeTokens.length})
          </h2>
        </div>

        {activeTokens.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl p-8 border border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto text-slate-500 mb-3">
              <Ticket size={28} />
            </div>
            <h4 className="text-base font-bold text-white">No Active Digital Passes</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              You are not currently in any waiting lines. Discover clinics, banks, or counters to book a pass.
            </p>
            <Link to="/">
              <Button variant="emerald" size="md" rightIcon={<ArrowRight size={16} />}>
                Browse Queues
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeTokens.map((token) => (
              <LiveTokenPass key={token.TOKEN_ID} token={token} onRefresh={loadTokens} />
            ))}
          </div>
        )}
      </div>

      {/* History Section */}
      {pastTokens.length > 0 && (
        <div className="pt-8 border-t border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <History className="text-slate-400" size={20} />
            <h3 className="text-lg font-bold text-white">Past Passes History ({pastTokens.length})</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastTokens.map((token) => (
              <TokenHistoryCard key={token.TOKEN_ID} token={token} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
