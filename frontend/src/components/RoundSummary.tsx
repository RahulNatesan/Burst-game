import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerData } from '../store/gameStore';

interface RoundSummaryProps {
  round: number;
  players: PlayerData[];
  previousRanking: string[]; // ordered player IDs from previous round (1st to last)
}

export const RoundSummary: React.FC<RoundSummaryProps> = ({
  round,
  players,
  previousRanking,
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
    () => [...players].sort((a, b) => b.total_score - a.total_score),
    [players]
  );

  // Compute rank changes: positive = moved up, negative = moved down, 0 = no change
  const rankChanges = useMemo(() => {
    const changes: Record<string, number> = {};
    sortedPlayers.forEach((p, currentIdx) => {
      const prevIdx = previousRanking.indexOf(p.id);
      if (prevIdx === -1) {
        // New player or first round — no change
        changes[p.id] = 0;
      } else {
        // If prevIdx was 3 and currentIdx is 1, they moved up by 2
        changes[p.id] = prevIdx - currentIdx;
      }
    });
    return changes;
  }, [sortedPlayers, previousRanking]);

  const progressPercent = (timeLeft / DISPLAY_SECONDS) * 100;

  // Determine player count for adaptive sizing
  const playerCount = sortedPlayers.length;
  // Scale down avatar / padding when many players
  const isCompact = playerCount > 5;
  const isTight = playerCount > 7;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-3 md:p-6">
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="glass-panel w-full max-w-2xl lg:max-w-3xl rounded-3xl border border-white/10 flex flex-col shadow-2xl overflow-hidden"
        style={{ maxHeight: '95vh' }}
      >
        {/* Header */}
        <div className={`text-center ${isTight ? 'px-4 pt-4 pb-2' : 'px-6 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4'}`}>
          <motion.h3
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={`font-headline font-black text-primary italic uppercase tracking-wider ${isTight ? 'text-xl md:text-2xl mb-0.5' : 'text-2xl md:text-3xl lg:text-4xl mb-1'}`}
          >
            Round {round} Complete
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs md:text-sm text-on-surface-variant font-mono"
          >
            Leaderboard Updated
          </motion.p>
        </div>

        {/* Player List — NO SCROLL, flex column fitting viewport */}
        <div className={`flex flex-col gap-${isTight ? '1.5' : isCompact ? '2' : '3'} ${isTight ? 'px-3 py-2' : 'px-4 py-3 md:px-6 md:py-4'} flex-1`}>
          <AnimatePresence mode="popLayout">
            {sortedPlayers.map((p, idx) => {
              const isHit = p.bid === p.tricks_won;
              const roundScore = p.round_scores[p.round_scores.length - 1] ?? 0;
              const change = rankChanges[p.id] ?? 0;
              const rankLabel = idx + 1;

              // Medal colors for top 3
              const medalColors = ['text-amber-400', 'text-zinc-300', 'text-amber-600'];
              const medalIcons = ['🥇', '🥈', '🥉'];

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{
                    layout: { type: 'spring', damping: 25, stiffness: 200 },
                    opacity: { delay: 0.1 + idx * 0.07 },
                    x: { delay: 0.1 + idx * 0.07, type: 'spring', damping: 20 },
                  }}
                  className={`
                    flex items-center justify-between rounded-2xl border transition-colors duration-300
                    ${isTight ? 'p-2.5 md:p-3' : isCompact ? 'p-3 md:p-4' : 'p-4 md:p-5'}
                    ${isHit
                      ? 'bg-emerald-500/5 border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                      : 'bg-crimson/5 border-crimson/20 shadow-[0_0_15px_rgba(239,68,68,0.03)]'
                    }
                  `}
                >
                  {/* Left: Rank + Avatar + Info */}
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    {/* Rank */}
                    <div className={`flex flex-col items-center shrink-0 ${isTight ? 'w-7' : 'w-9'}`}>
                      {idx < 3 ? (
                        <span className={`text-lg md:text-xl leading-none`}>{medalIcons[idx]}</span>
                      ) : (
                        <span className={`font-mono font-bold ${isTight ? 'text-sm' : 'text-base md:text-lg'} text-on-surface-variant`}>
                          {rankLabel}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={`${isTight ? 'w-9 h-9' : isCompact ? 'w-10 h-10' : 'w-12 h-12 md:w-14 md:h-14'} rounded-full overflow-hidden bg-charcoal border border-white/10 shrink-0`}>
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
                        <div className="w-full h-full flex items-center justify-center font-bold text-xs md:text-sm text-primary uppercase">
                          {p.name.substring(0, 2)}
                        </div>
                      )}
                    </div>

                    {/* Name + Stats */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold truncate text-white ${isTight ? 'text-sm' : 'text-base md:text-lg'}`}>
                          {p.name}
                        </span>
                        {p.is_bot && (
                          <span className="text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-400 rounded px-1.5 py-0.5 font-mono uppercase font-bold tracking-wider shrink-0">
                            AI
                          </span>
                        )}
                      </div>
                      <div className={`${isTight ? 'text-[11px]' : 'text-xs md:text-sm'} text-on-surface-variant font-mono leading-none mt-1`}>
                        Bid: <span className="text-white font-bold">{p.bid}</span> | Won:{' '}
                        <span className={isHit ? 'text-emerald-400 font-bold' : 'text-crimson font-bold'}>
                          {p.tricks_won}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score + Rank Change */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Rank change indicator */}
                    {change !== 0 && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 + idx * 0.08, type: 'spring', damping: 15 }}
                        className={`
                          flex items-center gap-0.5 font-mono font-black rounded-lg px-2 py-1
                          ${isTight ? 'text-[11px]' : 'text-xs md:text-sm'}
                          ${change > 0
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            : 'text-crimson bg-crimson/10 border border-crimson/20'
                          }
                        `}
                      >
                        <motion.span
                          initial={{ y: change > 0 ? 8 : -8 }}
                          animate={{ y: 0 }}
                          transition={{ delay: 0.6 + idx * 0.08, type: 'spring', damping: 12 }}
                          className="material-symbols-outlined text-sm md:text-base"
                        >
                          {change > 0 ? 'arrow_upward' : 'arrow_downward'}
                        </motion.span>
                        <span>{Math.abs(change)}</span>
                      </motion.div>
                    )}

                    {/* Score column */}
                    <div className="text-right flex flex-col items-end">
                      <div
                        className={`font-mono font-black flex items-center gap-1.5 ${
                          isTight ? 'text-xs' : 'text-sm md:text-base'
                        } ${isHit ? 'text-emerald-400' : 'text-crimson'}`}
                      >
                        <span className="tracking-widest">{isHit ? 'HIT!' : 'BURST!'}</span>
                        <span className="font-bold">{isHit ? `+${roundScore}` : '+0'}</span>
                      </div>
                      <div className={`${isTight ? 'text-[11px]' : 'text-xs md:text-sm'} text-on-surface-variant font-mono mt-0.5`}>
                        Total: <span className="text-white font-bold">{p.total_score}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer: Countdown Progress Bar */}
        <div className={`${isTight ? 'px-4 pb-4 pt-2' : 'px-6 pb-6 pt-3 md:px-8 md:pb-8'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: timeLeft > 3
                    ? 'linear-gradient(90deg, #3B82F6, #6366F1)'
                    : 'linear-gradient(90deg, #EF4444, #F97316)',
                }}
                initial={{ width: '100%' }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.9, ease: 'linear' }}
              />
            </div>
            <span className={`font-mono font-bold text-xs md:text-sm tabular-nums ${
              timeLeft > 3 ? 'text-electricBlue' : 'text-crimson'
            }`}>
              {timeLeft}s
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-on-surface-variant font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-electricBlue shadow-[0_0_8px_rgba(59,130,246,0.7)] animate-pulse" />
            <span>Next round loading...</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default RoundSummary;
