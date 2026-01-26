import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, MapPin, Euro, Package, TrendingUp, Clock, Sparkles, Lock, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useMatchingEngine } from '../hooks/useMatchingEngine';
import type { TargetWithProfile } from '../lib/types';

interface MatchNotificationProps {
  onViewTarget?: (targetId: string) => void;
  maxVisible?: number;
  minScore?: number;
}

export function MatchNotification({ 
  onViewTarget, 
  maxVisible = 5,
  minScore = 50 
}: MatchNotificationProps) {
  const { profile } = useAuth();
  const [targets, setTargets] = useState<TargetWithProfile[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedMatches, setDismissedMatches] = useState<Set<string>>(new Set());
  const [newMatches, setNewMatches] = useState<Set<string>>(new Set());
  const [unlockedLeads, setUnlockedLeads] = useState<Set<string>>(new Set());
  const [unlocking, setUnlocking] = useState<Set<string>>(new Set());

  const { matchingTargets, topMatches } = useMatchingEngine(profile, targets);

  useEffect(() => {
    if (!profile || profile.role !== 'seller') return;

    loadTargets();
    loadUnlockedLeads();
    
    // Subscribe to new targets
    const channel = supabase
      .channel('match-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'targets',
          filter: 'status=eq.active'
        },
        (payload) => {
          const newTarget = payload.new as any;
          // Mark as new match if it's a high score match
          if (newTarget) {
            setNewMatches(prev => new Set([...prev, newTarget.id]));
            // Reload targets to get fresh matches
            setTimeout(() => loadTargets(), 1000);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profile]);

  const loadTargets = async () => {
    const { data, error } = await supabase
      .from('targets')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading targets:', error);
    } else {
      setTargets(data || []);
    }
  };

  const loadUnlockedLeads = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('unlocked_leads')
      .select('target_id')
      .eq('seller_id', profile.id);

    if (error) {
      console.error('Error loading unlocked leads:', error);
    } else if (data) {
      setUnlockedLeads(new Set(data.map(ul => ul.target_id)));
    }
  };

  const handleUnlockLead = async (targetId: string) => {
    if (!profile) return;

    setUnlocking(prev => new Set([...prev, targetId]));

    const { error } = await supabase
      .from('unlocked_leads')
      .insert({
        seller_id: profile.id,
        target_id: targetId
      });

    if (error) {
      console.error('Error unlocking lead:', error);
      setUnlocking(prev => {
        const updated = new Set(prev);
        updated.delete(targetId);
        return updated;
      });
    } else {
      setUnlockedLeads(prev => new Set([...prev, targetId]));
      setUnlocking(prev => {
        const updated = new Set(prev);
        updated.delete(targetId);
        return updated;
      });
    }
  };

  // Filter and sort matches
  const visibleMatches = matchingTargets
    .filter(match => 
      match.score >= minScore && 
      !dismissedMatches.has(match.target.id)
    )
    .slice(0, isExpanded ? 20 : maxVisible);

  const highScoreMatches = visibleMatches.filter(m => m.score > 80);
  const hasHighScoreMatches = highScoreMatches.length > 0;

  const handleDismiss = (targetId: string) => {
    setDismissedMatches(prev => new Set([...prev, targetId]));
    setNewMatches(prev => {
      const updated = new Set(prev);
      updated.delete(targetId);
      return updated;
    });
  };

  const handleViewTarget = (targetId: string) => {
    if (onViewTarget) {
      onViewTarget(targetId);
    }
    setNewMatches(prev => {
      const updated = new Set(prev);
      updated.delete(targetId);
      return updated;
    });
  };

  if (!profile || profile.role !== 'seller' || visibleMatches.length === 0) {
    return null;
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Adesso';
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative">
      {/* Notification Badge */}
      {hasHighScoreMatches && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 z-10"
        >
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full blur-md"
            />
            <div className="relative bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
              <Zap className="w-3 h-3" />
              <span>{highScoreMatches.length}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Notification Panel */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30">
                <Sparkles className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Nuove Opportunità</h3>
                <p className="text-xs text-slate-400">
                  {visibleMatches.length} match{visibleMatches.length !== 1 ? 'es' : ''} trovati
                </p>
              </div>
            </div>
            {visibleMatches.length > maxVisible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-3 py-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                {isExpanded ? 'Mostra meno' : 'Mostra tutte'}
              </button>
            )}
          </div>
        </div>

        {/* Matches List */}
        <div className="max-h-[600px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {visibleMatches.map((match, index) => {
              const isHighScore = match.score > 80;
              const isNew = newMatches.has(match.target.id);
              const target = match.target;

              return (
                <motion.div
                  key={target.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative group border-b border-slate-700/30 last:border-b-0 ${
                    isHighScore
                      ? 'bg-gradient-to-r from-orange-500/5 via-yellow-500/5 to-orange-500/5'
                      : 'bg-slate-800/20'
                  }`}
                >
                  {/* Animated border for high score matches */}
                  {isHighScore && (
                    <>
                      <div className="absolute inset-0 rounded-none pointer-events-none">
                        <motion.div
                          animate={{
                            background: [
                              'linear-gradient(90deg, rgba(249,115,22,0) 0%, rgba(249,115,22,0.8) 50%, rgba(249,115,22,0) 100%)',
                              'linear-gradient(90deg, rgba(249,115,22,0) 50%, rgba(249,115,22,0.8) 100%, rgba(249,115,22,0) 0%)',
                              'linear-gradient(90deg, rgba(249,115,22,0) 0%, rgba(249,115,22,0.8) 50%, rgba(249,115,22,0) 100%)',
                            ],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                          className="absolute top-0 left-0 right-0 h-[2px] opacity-75"
                        />
                      </div>
                      <div className="absolute top-0 right-0 m-3 z-10">
                        <motion.div
                          animate={{ 
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3
                          }}
                          className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/50 shadow-lg"
                        >
                          <Zap className="w-4 h-4 text-orange-400 fill-orange-400" />
                        </motion.div>
                      </div>
                    </>
                  )}

                  {/* New Badge */}
                  {isNew && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute top-3 left-3 z-10"
                    >
                      <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        NUOVO
                      </div>
                    </motion.div>
                  )}

                  <div className="p-4 pr-12">
                    <div className="flex items-start gap-4">
                      {/* Match Score */}
                      <div className="flex-shrink-0">
                        <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-lg ${
                          isHighScore
                            ? 'bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-2 border-orange-500/50 text-orange-400'
                            : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-400'
                        }`}>
                          <span>{match.score}</span>
                          {isHighScore && (
                            <motion.div
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0.8, 0.5]
                              }}
                              transition={{ 
                                duration: 1.5,
                                repeat: Infinity
                              }}
                              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/30 to-yellow-500/30 blur-sm"
                            />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 text-center mt-1">Match</p>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-base font-bold text-white line-clamp-2 group-hover:text-orange-400 transition-colors">
                            {target.title}
                          </h4>
                        </div>

                        {/* Buyer Name */}
                        <div className="flex items-center gap-2 mb-2">
                          <UserCheck className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-400">
                            {unlockedLeads.has(target.id) ? (
                              <span className="text-slate-300">{target.profile?.full_name || 'Buyer'}</span>
                            ) : (
                              <span className="text-slate-500">Utente Verificato</span>
                            )}
                          </span>
                        </div>

                        {/* Description */}
                        {target.description && (
                          <div className={`mb-3 text-sm text-slate-300 ${!unlockedLeads.has(target.id) ? 'blur-sm select-none' : ''}`}>
                            <p className="line-clamp-2">{target.description}</p>
                          </div>
                        )}

                        {/* Match Reasons */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {match.reasons.slice(0, 2).map((reason, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600/50"
                            >
                              {reason.replace('✓ ', '')}
                            </span>
                          ))}
                          {match.reasons.length > 2 && (
                            <span className="text-xs px-2 py-1 rounded-lg bg-slate-700/50 text-slate-400">
                              +{match.reasons.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            <span>{target.category}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{target.location}</span>
                          </div>
                          {target.budget && (
                            <div className={`flex items-center gap-1 ${unlockedLeads.has(target.id) ? 'text-green-400' : 'text-slate-500 blur-sm select-none'}`}>
                              <Euro className="w-3.5 h-3.5" />
                              <span className="font-semibold">
                                {unlockedLeads.has(target.id) 
                                  ? `€${target.budget.toLocaleString()}`
                                  : '€••••'
                                }
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTimeAgo(target.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700/30">
                      {!unlockedLeads.has(target.id) ? (
                        <>
                          <button
                            onClick={() => handleUnlockLead(target.id)}
                            disabled={unlocking.has(target.id)}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <motion.div
                              animate={{
                                background: [
                                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                                  'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.2) 100%, transparent 0%)',
                                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                                ],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                              className="absolute inset-0"
                            />
                            <Lock className={`w-4 h-4 relative z-10 ${unlocking.has(target.id) ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform`} />
                            <span className="relative z-10">
                              {unlocking.has(target.id) ? 'Sbloccando...' : 'Sblocca Lead'}
                            </span>
                          </button>
                          <button
                            onClick={() => handleDismiss(target.id)}
                            className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-slate-300 transition-colors"
                            title="Ignora"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleViewTarget(target.id)}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-orange-500/25 flex items-center justify-center gap-2 group"
                          >
                            <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Visualizza Opportunità
                          </button>
                          <button
                            onClick={() => handleDismiss(target.id)}
                            className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-slate-300 transition-colors"
                            title="Ignora"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {visibleMatches.length === 0 && (
            <div className="p-8 text-center">
              <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Nessuna nuova opportunità al momento</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
