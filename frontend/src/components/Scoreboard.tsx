import React from 'react';
import type { PlayerData } from '../store/gameStore';

interface ScoreboardProps {
  players: PlayerData[];
  activePlayerId: string | null;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  players,
  activePlayerId,
}) => {
  // Sort players by total score descending
  const sortedPlayers = [...players].sort((a, b) => b.total_score - a.total_score);

  return (
    <div className="glass-panel w-full rounded-2xl p-4 md:p-5 border border-white/5 flex flex-col">
      <h3 className="font-headline font-bold text-base md:text-lg text-primary tracking-wider uppercase mb-3 border-b border-outline-variant/30 pb-2 flex items-center gap-2 shrink-0">
        <span className="material-symbols-outlined text-lg">leaderboard</span>
        Live Leaderboard
      </h3>

      <div className="space-y-2.5">
        {sortedPlayers.map((p, idx) => {
          const isActive = p.id === activePlayerId;
          const hitScore = p.bid !== null && p.tricks_won === p.bid;

          return (
            <div
              key={p.id}
              className={`
                flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200
                ${isActive 
                  ? 'border-electricBlue bg-electricBlue/5 shadow-[0_0_10px_rgba(59,130,246,0.12)]' 
                  : 'border-outline-variant/20 bg-charcoal/40'
                }
              `}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Ranking */}
                <span className="font-mono text-sm md:text-base font-bold text-on-surface-variant w-4 shrink-0 text-center">
                  {idx + 1}
                </span>

                {/* Micro Avatar */}
                <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 border border-outline-variant/10 shrink-0">
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
                    <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-primary uppercase">
                      {p.name.substring(0, 2)}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm md:text-base truncate text-on-surface">
                      {p.name}
                    </span>
                    {p.is_bot && (
                      <span className="text-[7px] bg-zinc-800 border border-zinc-700 text-zinc-400 rounded px-0.5 font-mono scale-90 shrink-0">
                        AI
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] md:text-xs text-on-surface-variant font-mono leading-none mt-1">
                    Bid: {p.bid !== null ? p.bid : '—'} | Won: {p.tricks_won}
                  </span>
                </div>
              </div>

              {/* Status and Score */}
              <div className="flex items-center gap-1.5 shrink-0">
                {hitScore && (
                  <span className="material-symbols-outlined text-sm text-emerald-500 font-bold" title="Bid Matched (HIT!)">
                    check_circle
                  </span>
                )}
                <span className={`font-mono font-bold text-sm md:text-base ${idx === 0 ? 'text-amber-400' : 'text-white'}`}>
                  {p.total_score}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default Scoreboard;
