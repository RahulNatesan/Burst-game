import React from 'react';
import type { PlayerData } from '../store/gameStore';

interface PlayerAvatarProps {
  player: PlayerData;
  isActive?: boolean;
  isBiddingStarter?: boolean;
  timeLeft?: number; // 0 to 100
  isLobby?: boolean;
  ready?: boolean;
  isHost?: boolean;
  onKick?: () => void;
  showKickButton?: boolean;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  isActive = false,
  isBiddingStarter = false,
  timeLeft = 100,
  isLobby = false,
  ready = false,
  onKick,
  showKickButton = false,
}) => {
  // SVG circular countdown properties
  const radius = 42;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (timeLeft / 100) * circumference;

  // Blue at start, crimson when under 35% time remaining
  const timerColor = timeLeft > 35 ? '#3B82F6' : '#EF4444';

  return (
    <div className="flex flex-col items-center relative select-none">
      {/* Circle Container */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        
        {/* Time Remaining Ring (active turn) */}
        {isActive && !isLobby && (
          <svg className="absolute w-24 h-24 -rotate-90 pointer-events-none z-10">
            <circle
              stroke="rgba(0,0,0,0.3)"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={48}
              cy={48}
            />
            <circle
              stroke={timerColor}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }}
              r={normalizedRadius}
              cx={48}
              cy={48}
            />
          </svg>
        )}

        {/* Regular Border Frame */}
        {!isActive && (
          <div className={`
            absolute inset-1.5 rounded-full border z-10 pointer-events-none
            ${isLobby && ready ? 'border-emerald-500/50' : 'border-outline-variant/30'}
          `} />
        )}

        {/* User Avatar Image or Initials */}
        <div className={`
          w-20 h-20 rounded-full overflow-hidden bg-charcoal border border-outline-variant/10 z-0 flex items-center justify-center relative
          ${isActive ? 'player-active-ring' : ''}
        `}>
          {player.avatar_url ? (
            <img 
              src={player.avatar_url} 
              alt={player.name} 
              className="w-full h-full object-cover" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${player.name}`;
              }}
            />
          ) : (
            <div className="font-semibold text-lg text-primary uppercase font-mono">
              {player.name.substring(0, 2)}
            </div>
          )}

          {/* Disconnection mask */}
          {!player.is_connected && !player.is_bot && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] flex items-center justify-center z-10 text-[9px] text-red-500 font-bold tracking-wider font-mono">
              OFFLINE
            </div>
          )}
        </div>

        {/* Ready Badge in waiting room */}
        {isLobby && (
          <div className={`
            absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center z-20 text-[10px] text-white border shadow-md font-mono
            ${ready 
              ? 'bg-emerald-600 border-emerald-400' 
              : 'bg-zinc-700 border-zinc-500'
            }
          `}>
            {ready ? '✓' : '...'}
          </div>
        )}

        {/* Dealer / Bidding starter star */}
        {isBiddingStarter && !isLobby && (
          <div className="absolute top-1 right-1 bg-amber-500 text-obsidian border border-amber-300 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shadow-md z-20" title="Bidding Starter">
            ★
          </div>
        )}

        {/* Kick Button (Lobby bot removal) */}
        {showKickButton && onKick && (
          <button 
            onClick={(e) => { e.stopPropagation(); onKick(); }}
            className="absolute top-1 left-1 bg-red-600 border border-red-400 hover:bg-red-500 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shadow-md z-30 transition-all font-bold"
            title="Kick Bot"
          >
            ×
          </button>
        )}
      </div>

      {/* Label Box */}
      <div className="mt-2.5 text-center flex flex-col items-center">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm md:text-base max-w-[120px] md:max-w-[140px] truncate text-on-surface">
            {player.name}
          </span>
          {player.is_bot && (
            <span className="text-[8px] bg-zinc-800 border border-zinc-700 text-zinc-400 rounded px-1.5 py-0.5 font-mono uppercase font-bold tracking-wider scale-90">
              AI
            </span>
          )}
        </div>

        {/* Stats indicators */}
        {!isLobby && (
          <div className="flex items-center gap-2 mt-1.5 font-mono text-xs md:text-sm text-on-surface-variant">
            <span className={`
              px-2 py-0.5 rounded-md border font-bold
              ${player.bid !== null ? 'bg-electricBlue/10 border-electricBlue/30 text-electricBlue' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}
            `}>
              Bid: {player.bid !== null ? player.bid : '—'}
            </span>
            <span className={`
              px-2 py-0.5 rounded-md border font-bold
              ${player.tricks_won > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}
            `}>
              Won: {player.tricks_won}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
export default PlayerAvatar;
