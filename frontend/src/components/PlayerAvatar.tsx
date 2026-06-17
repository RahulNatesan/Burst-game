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
  compact?: boolean; // Enable smaller avatar layouts for crowded tables
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
  compact = false,
}) => {
  // SVG circular countdown properties
  const radius = compact ? 31 : 42;
  const stroke = compact ? 2.5 : 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (timeLeft / 100) * circumference;

  // Blue at start, crimson when under 35% time remaining
  const timerColor = timeLeft > 35 ? '#3B82F6' : '#EF4444';

  const circleSizeClass = compact ? 'w-18 h-18' : 'w-24 h-24';
  const imgSizeClass = compact ? 'w-14 h-14' : 'w-20 h-20';

  return (
    <div className="flex flex-col items-center relative select-none">
      {/* Circle Container */}
      <div className={`relative ${circleSizeClass} flex items-center justify-center`}>
        
        {/* Time Remaining Ring (active turn) */}
        {isActive && !isLobby && (
          <svg className={`absolute -rotate-90 pointer-events-none z-10 ${compact ? 'w-18 h-18' : 'w-24 h-24'}`}>
            <circle
              stroke="rgba(0,0,0,0.3)"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={compact ? 36 : 48}
              cy={compact ? 36 : 48}
            />
            <circle
              stroke={timerColor}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }}
              r={normalizedRadius}
              cx={compact ? 36 : 48}
              cy={compact ? 36 : 48}
            />
          </svg>
        )}

        {/* Regular Border Frame */}
        {!isActive && (
          <div className={`
            absolute inset-1 rounded-full border z-10 pointer-events-none
            ${isLobby && ready ? 'border-emerald-500/50' : 'border-outline-variant/30'}
          `} />
        )}

        {/* User Avatar Image or Initials */}
        <div className={`
          ${imgSizeClass} rounded-full overflow-hidden bg-charcoal border border-outline-variant/10 z-0 flex items-center justify-center relative
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
            <div className={`font-semibold text-primary uppercase font-mono ${compact ? 'text-sm' : 'text-lg'}`}>
              {player.name ? player.name.substring(0, 2) : '??'}
            </div>
          )}

          {/* Disconnection mask */}
          {!player.is_connected && !player.is_bot && (
            <div className={`absolute inset-0 bg-black/70 backdrop-blur-[1px] flex items-center justify-center z-10 text-red-500 font-bold tracking-wider font-mono ${
              compact ? 'text-[7.5px]' : 'text-[9px]'
            }`}>
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
          <div className={`absolute top-0.5 right-0.5 bg-amber-500 text-obsidian border border-amber-300 rounded-full flex items-center justify-center font-bold shadow-md z-20 ${
            compact ? 'w-4 h-4 text-[8px]' : 'w-5 h-5 text-[10px]'
          }`} title="Bidding Starter">
            ★
          </div>
        )}

        {/* Kick Button (Lobby bot removal) */}
        {showKickButton && onKick && (
          <button 
            onClick={(e) => { e.stopPropagation(); onKick(); }}
            className="absolute top-0.5 left-0.5 bg-red-600 border border-red-400 hover:bg-red-500 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] shadow-md z-30 transition-all font-bold"
            title="Kick Bot"
          >
            ×
          </button>
        )}
      </div>

      {/* Label Box */}
      <div className={`${compact ? 'mt-1' : 'mt-2.5'} text-center flex flex-col items-center`}>
        <div className="flex items-center gap-1">
          <span className={`font-bold max-w-[90px] md:max-w-[110px] truncate text-on-surface ${
            compact ? 'text-xs md:text-sm' : 'text-sm md:text-base'
          }`}>
            {player.name}
          </span>
          {player.is_bot && (
            <span className={`bg-zinc-800 border border-zinc-700 text-zinc-400 rounded font-mono uppercase font-bold tracking-wider scale-85 ${
              compact ? 'text-[6px] px-1 py-0.1' : 'text-[8px] px-1.5 py-0.5'
            }`}>
              AI
            </span>
          )}
        </div>

        {/* Stats indicators */}
        {!isLobby && (
          <div className={`flex items-center gap-1.5 mt-0.5 font-mono text-on-surface-variant ${
            compact ? 'text-[9.5px] md:text-[10.5px]' : 'text-xs md:text-sm'
          }`}>
            <span className={`
              px-1.5 py-0.2 rounded font-bold
              ${player.bid !== null ? 'bg-electricBlue/10 border-electricBlue/30 text-electricBlue' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}
            `}>
              Bid: {player.bid !== null ? player.bid : '—'}
            </span>
            <span className={`
              px-1.5 py-0.2 rounded font-bold
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
