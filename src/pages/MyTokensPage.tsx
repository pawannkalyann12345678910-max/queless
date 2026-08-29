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

  usePolling(loadTokens, 4000, !!user);

  if (!user) {
    return (
      <div className="text-center py-20 bg-white rounded-xl p-8 max-w-md mx-auto border border-zinc-200 shadow-xs">
        <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-black mb-3">
          <Ticket size={24} />
        </div>
        <h3 className="text-lg font-black text-black">Sign In to View Your Passes</h3>
        <p className="text-xs text-zinc-500 mt-1 mb-5">
          Sign in with your Google account to view active passes, live queue countdowns, and ticket history.
        </p>
        <Link to="/">
          <Button variant="primary" size="md" className="bg-black text-white">
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
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black flex items-center gap-2.5">
            <Ticket className="text-blue-600" size={24} />
            My Digital Passes
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time live queue tracking with turn countdowns and proximity alerts.
          </p>
        </div>

        <Link to="/">
          <Button variant="secondary" size="sm" leftIcon={<Compass size={14} />}>
            Explore More Queues
          </Button>
        </Link>
      </div>

      {/* Active Passes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-black flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Passes in Progress ({activeTokens.length})
          </h2>
        </div>

        {activeTokens.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-xl p-6 border border-zinc-200 shadow-xs">
            <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400 mb-2">
              <Ticket size={24} />
            </div>
            <h4 className="text-sm font-bold text-black">No Active Digital Passes</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-5">
              You are not currently in any waiting lines. Discover clinics, banks, or counters to book a pass.
            </p>
            <Link to="/">
              <Button variant="primary" size="md" className="bg-black text-white" rightIcon={<ArrowRight size={14} />}>
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
        <div className="pt-6 border-t border-zinc-200">
          <div className="flex items-center gap-2 mb-4">
            <History className="text-zinc-400" size={18} />
            <h3 className="text-base font-bold text-black">Past Passes History ({pastTokens.length})</h3>
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
