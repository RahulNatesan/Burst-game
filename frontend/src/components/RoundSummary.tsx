import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerData } from '../store/gameStore';

interface RoundSummaryProps {
  round: number;
  players: PlayerData[];
  previousRanking?: string[]; // Made optional with safe fallback
}

export const RoundSummary: React.FC<RoundSummaryProps> = ({
  round,
  players = [],
  previousRanking = [],
}) => {
  const DISPLAY_SECONDS = 10;
  const [timeLeft, setTimeLeft] = useState(DISPLAY_SECONDS);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Sort players by total_score descending for current ranking
  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => (b.total_score || 0) - (a.total_score || 0)),
    [players]
  );

  // Compute rank changes safely
  const rankChanges = useMemo(() => {
    const changes: Record<string, number> = {};
    const safeRanking = Array.isArray(previousRanking) ? previousRanking : [];
    
    sortedPlayers.forEach((p, currentIdx) => {
      const prevIdx = safeRanking.indexOf(p.id);
      if (prevIdx === -1) {
        changes[p.id] = 0;
      } else {
        changes[p.id] = prevIdx - currentIdx;
      }
    });
    return changes;
  }, [sortedPlayers, previousRanking]);

  const progressPercent = (timeLeft / DISPLAY_SECONDS) * 100;

  const playerCount = sortedPlayers.length;
  const isCompact = playerCount > 4;
  const isTight = playerCount > 6;

  // Statically defined spacing classes to ensure Tailwind compiles them correctly
  const listGapClass = isTight ? 'space-y-2' : isCompact ? 'space-y-2.5' : 'space-y-3.5';
  const itemPaddingClass = isTight ? 'p-2 md:p-2.5' : isCompact ? 'p-3 md:p-3.5' : 'p-4 md:p-4.5';
  const avatarSizeClass = isTight ? 'w-8 h-8' : isCompact ? 'w-10 h-10' : 'w-12 h-12 md:w-14 md:h-14';
  const nameTextClass = isTight ? 'text-xs md:text-sm font-bold' : isCompact ? 'text-sm md:text-base font-bold' : 'text-base md:text-lg font-bold';

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-55 p-3 md:p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="glass-panel w-full max-w-2xl lg:max-w-3xl rounded-3xl border border-white/10 flex flex-col shadow-2xl overflow-hidden"
        style={{ maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className={`text-center ${isTight ? 'px-4 pt-3 pb-1' : 'px-6 pt-5 pb-2 md:px-8 md:pt-6'}`}>
          <motion.h3
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={`font-headline font-black text-primary italic uppercase tracking-wider ${
              isTight ? 'text-lg md:text-xl' : 'text-xl md:text-2xl lg:text-3xl'
            }`}
          >
            Round {round} Completed
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[10px] md:text-xs text-on-surface-variant font-mono"
          >
            Leaderboard Standings
          </motion.p>
        </div>

        {/* Player List — Compact enough to fit on one screen, but has scroll backup if viewport is extremely short */}
        <div className={`flex-1 overflow-y-auto ${isTight ? 'px-3 py-2' : 'px-4 py-3 md:px-6'} pr-1.5`}>
          <div className={`${listGapClass}`}>
            <AnimatePresence mode="popLayout">
              {sortedPlayers.map((p, idx) => {
                const isHit = p.bid === p.tricks_won;
                const roundScores = Array.isArray(p.round_scores) ? p.round_scores : [];
                const roundScore = roundScores[roundScores.length - 1] ?? 0;
                const change = rankChanges[p.id] ?? 0;
                const rankLabel = idx + 1;

                const medalIcons = ['🥇', '🥈', '🥉'];

                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{
                      layout: { type: 'spring', damping: 25, stiffness: 200 },
                      opacity: { delay: idx * 0.04 },
                      x: { delay: idx * 0.04, type: 'spring', damping: 20 },
                    }}
                    className={`
                      flex items-center justify-between rounded-2xl border transition-colors duration-300
                      ${itemPaddingClass}
                      ${isHit
                        ? 'bg-emerald-500/5 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.06)]'
                        : 'bg-crimson/5 border-crimson/20 shadow-[0_0_12px_rgba(239,68,68,0.02)]'
                      }
                    `}
                  >
                    {/* Left Rank, Avatar & Player Stats */}
                    <div className="flex items-center gap-2.5 md:gap-3.5 min-w-0">
                      {/* Rank Indicator */}
                      <div className="flex flex-col items-center justify-center shrink-0 w-6">
                        {idx < 3 ? (
                          <span className="text-base md:text-lg leading-none">{medalIcons[idx]}</span>
                        ) : (
                          <span className="font-mono text-xs md:text-sm font-bold text-on-surface-variant">
                            {rankLabel}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className={`${avatarSizeClass} rounded-full overflow-hidden bg-charcoal border border-white/10 shrink-0 flex items-center justify-center`}>
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${p.name}`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-primary uppercase">
                            {p.name ? p.name.substring(0, 2) : '??'}
                          </div>
                        )}
                      </div>

                      {/* Name & Sub-details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`${nameTextClass} truncate text-white leading-tight`}>
                            {p.name}
                          </span>
                          {p.is_bot && (
                            <span className="text-[7.5px] bg-zinc-800 border border-zinc-700 text-zinc-400 rounded px-1 py-0.2 font-mono uppercase font-bold tracking-wider shrink-0 scale-90">
                              AI
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] md:text-xs text-on-surface-variant font-mono mt-0.5 leading-none">
                          Bid: <span className="text-white font-bold">{p.bid !== null ? p.bid : '—'}</span> | Won:{' '}
                          <span className={isHit ? 'text-emerald-400 font-bold' : 'text-crimson font-bold'}>
                            {p.tricks_won}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Rank-Change & Score columns */}
                    <div className="flex items-center gap-2.5 md:gap-3.5 shrink-0">
                      {/* Rank Change Indicator Badge */}
                      {change !== 0 && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 + idx * 0.04, type: 'spring', damping: 15 }}
                          className={`
                            flex items-center gap-0.5 font-mono font-bold rounded-lg px-1.5 py-0.5 text-[9px] md:text-xs
                            ${change > 0
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                              : 'text-crimson bg-crimson/10 border border-crimson/20'
                            }
                          `}
                        >
                          <motion.span
                            initial={{ y: change > 0 ? 5 : -5 }}
                            animate={{ y: 0 }}
                            className="material-symbols-outlined text-[10px] md:text-xs leading-none"
                          >
                            {change > 0 ? 'arrow_upward' : 'arrow_downward'}
                          </motion.span>
                          <span>{Math.abs(change)}</span>
                        </motion.div>
                      )}

                      {/* Scores */}
                      <div className="text-right flex flex-col items-end justify-center">
                        <div
                          className={`font-mono font-bold flex items-center gap-1 text-[11px] md:text-xs ${
                            isHit ? 'text-emerald-400' : 'text-crimson'
                          }`}
                        >
                          <span className="tracking-wider">{isHit ? 'HIT!' : 'BURST!'}</span>
                          <span className="font-bold">{isHit ? `+${roundScore}` : '+0'}</span>
                        </div>
                        <div className="text-[10px] md:text-xs text-on-surface-variant font-mono mt-0.5">
                          Total: <span className="text-white font-bold">{p.total_score || 0}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer with progress indicator */}
        <div className={`border-t border-white/5 ${isTight ? 'px-4 py-2 mt-1' : 'px-6 py-4 mt-2'}`}>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: timeLeft > 3
                    ? 'linear-gradient(90deg, #3B82F6, #6366F1)'
                    : 'linear-gradient(90deg, #EF4444, #F97316)',
                }}
                initial={{ width: '100%' }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.95, ease: 'linear' }}
              />
            </div>
            <span className={`font-mono font-bold text-xs tabular-nums ${
              timeLeft > 3 ? 'text-electricBlue' : 'text-crimson'
            }`}>
              {timeLeft}s
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-1 text-[10px] md:text-xs text-on-surface-variant font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-electricBlue shadow-[0_0_8px_rgba(59,130,246,0.7)] animate-pulse" />
            <span>Updating tables & prepping next deal...</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default RoundSummary;
