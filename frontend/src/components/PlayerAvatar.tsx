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
<<<<<<< HEAD
  // SVG circular countdown properties
  const radius = compact ? 31 : 42;
  const stroke = compact ? 2.5 : 3;
  const normalizedRadius = radius - stroke * 2;
=======
  // Responsive SVG circular countdown properties
  const isMobileSize = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const containerSize = isMobileSize ? 48 : 56;
  const cx = containerSize / 2;
  const cy = containerSize / 2;
  const stroke = 3;
  const circleRadius = cx - 3;
  const normalizedRadius = circleRadius - stroke;
>>>>>>> 0c199d9 (Add production cors)
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (timeLeft / 100) * circumference;

  // Blue at start, crimson when under 35% time remaining
  const timerColor = timeLeft > 35 ? '#3B82F6' : '#EF4444';

  const circleSizeClass = compact ? 'w-18 h-18' : 'w-24 h-24';
  const imgSizeClass = compact ? 'w-14 h-14' : 'w-20 h-20';

  return (
    <div className={`
      flex flex-col items-center relative select-none bg-[#141416]/95 border rounded-2xl p-2 md:p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.6)] w-22 md:w-24 transition-all duration-300
      ${isActive ? 'border-electricBlue/50 shadow-[0_0_15px_rgba(59,130,246,0.25)]' : 'border-white/10 hover:border-white/20'}
    `}>
      {/* Circle Container */}
<<<<<<< HEAD
      <div className={`relative ${circleSizeClass} flex items-center justify-center`}>
        
        {/* Time Remaining Ring (active turn) */}
        {isActive && !isLobby && (
          <svg className={`absolute -rotate-90 pointer-events-none z-10 ${compact ? 'w-18 h-18' : 'w-24 h-24'}`}>
=======
      <div 
        style={{ width: `${containerSize}px`, height: `${containerSize}px` }}
        className="relative flex items-center justify-center shrink-0"
      >
        
        {/* Time Remaining Ring (active turn) */}
        {isActive && !isLobby && (
          <svg 
            style={{ width: `${containerSize}px`, height: `${containerSize}px`, transform: 'rotate(-90deg)' }}
            className="absolute pointer-events-none z-10"
          >
>>>>>>> 0c199d9 (Add production cors)
            <circle
              stroke="rgba(0,0,0,0.3)"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
<<<<<<< HEAD
              cx={compact ? 36 : 48}
              cy={compact ? 36 : 48}
=======
              cx={cx}
              cy={cy}
>>>>>>> 0c199d9 (Add production cors)
            />
            <circle
              stroke={timerColor}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }}
              r={normalizedRadius}
<<<<<<< HEAD
              cx={compact ? 36 : 48}
              cy={compact ? 36 : 48}
=======
              cx={cx}
              cy={cy}
>>>>>>> 0c199d9 (Add production cors)
            />
          </svg>
        )}

        {/* Regular Border Frame */}
        {!isActive && (
          <div className={`
<<<<<<< HEAD
            absolute inset-1 rounded-full border z-10 pointer-events-none
=======
            absolute inset-0.5 rounded-full border z-10 pointer-events-none
>>>>>>> 0c199d9 (Add production cors)
            ${isLobby && ready ? 'border-emerald-500/50' : 'border-outline-variant/30'}
          `} />
        )}

        {/* User Avatar Image or Initials */}
        <div className={`
<<<<<<< HEAD
          ${imgSizeClass} rounded-full overflow-hidden bg-charcoal border border-outline-variant/10 z-0 flex items-center justify-center relative
=======
          w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-charcoal border border-outline-variant/10 z-0 flex items-center justify-center relative
>>>>>>> 0c199d9 (Add production cors)
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
<<<<<<< HEAD
            <div className={`font-semibold text-primary uppercase font-mono ${compact ? 'text-sm' : 'text-lg'}`}>
              {player.name ? player.name.substring(0, 2) : '??'}
=======
            <div className="font-semibold text-base text-primary uppercase font-mono">
              {player.name.substring(0, 2)}
>>>>>>> 0c199d9 (Add production cors)
            </div>
          )}

          {/* Disconnection mask */}
          {!player.is_connected && !player.is_bot && (
<<<<<<< HEAD
            <div className={`absolute inset-0 bg-black/70 backdrop-blur-[1px] flex items-center justify-center z-10 text-red-500 font-bold tracking-wider font-mono ${
              compact ? 'text-[7.5px]' : 'text-[9px]'
            }`}>
=======
            <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] flex items-center justify-center z-10 text-[8px] text-red-500 font-bold tracking-wider font-mono">
>>>>>>> 0c199d9 (Add production cors)
              OFFLINE
            </div>
          )}
        </div>

        {/* Ready Badge in waiting room */}
        {isLobby && (
          <div className={`
            absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center z-20 text-[9px] text-white border shadow-md font-mono
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
<<<<<<< HEAD
          <div className={`absolute top-0.5 right-0.5 bg-amber-500 text-obsidian border border-amber-300 rounded-full flex items-center justify-center font-bold shadow-md z-20 ${
            compact ? 'w-4 h-4 text-[8px]' : 'w-5 h-5 text-[10px]'
          }`} title="Bidding Starter">
=======
          <div className="absolute top-0 right-0 bg-amber-500 text-obsidian border border-amber-300 w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold text-[9px] shadow-md z-20" title="Bidding Starter">
>>>>>>> 0c199d9 (Add production cors)
            ★
          </div>
        )}

        {/* Kick Button (Lobby bot removal) */}
        {showKickButton && onKick && (
          <button 
            onClick={(e) => { e.stopPropagation(); onKick(); }}
<<<<<<< HEAD
            className="absolute top-0.5 left-0.5 bg-red-600 border border-red-400 hover:bg-red-500 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] shadow-md z-30 transition-all font-bold"
=======
            className="absolute top-0 left-0 bg-red-600 border border-red-400 hover:bg-red-500 w-4.5 h-4.5 rounded-full flex items-center justify-center text-white text-[9px] shadow-md z-30 transition-all font-bold"
>>>>>>> 0c199d9 (Add production cors)
            title="Kick Bot"
          >
            ×
          </button>
        )}
      </div>

      {/* Label Box */}
<<<<<<< HEAD
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
=======
      <div className="mt-2 text-center flex flex-col items-center w-full">
        <div className="flex items-center gap-1 max-w-full justify-center">
          <span className="font-bold text-xs md:text-sm truncate text-on-surface max-w-[64px] md:max-w-[80px]">
            {player.name}
          </span>
          {player.is_bot && (
            <span className="text-[6.5px] bg-zinc-800 border border-zinc-700 text-zinc-400 rounded px-1 py-0.5 font-mono uppercase font-bold tracking-wider shrink-0 scale-90">
>>>>>>> 0c199d9 (Add production cors)
              AI
            </span>
          )}
        </div>

        {/* Stats indicators */}
        {!isLobby && (
<<<<<<< HEAD
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
=======
          <div className="flex flex-col gap-1 w-full mt-1.5 font-mono text-[10px] md:text-xs">
            <div className={`
              w-full py-0.5 rounded-md border font-bold text-center
              ${player.bid !== null ? 'bg-electricBlue/10 border-electricBlue/30 text-electricBlue' : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-500'}
            `}>
              Bid: {player.bid !== null ? player.bid : '—'}
            </div>
            <div className={`
              w-full py-0.5 rounded-md border font-bold text-center
              ${player.tricks_won > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-500'}
>>>>>>> 0c199d9 (Add production cors)
            `}>
              Won: {player.tricks_won}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default PlayerAvatar;
