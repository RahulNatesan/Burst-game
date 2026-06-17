import React from 'react';
import { motion } from 'framer-motion';
import type { CardData } from '../store/gameStore';

interface CardProps {
  card: CardData;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  card,
  onClick,
  disabled = false,
  selected = false,
  className = '',
  size = 'md',
}) => {
  const isHeart = card.suit === 'HEARTS';
  const isRed = card.color === 'red';

  const sizeClasses = {
    sm: 'w-14 h-20 text-xs p-1.5 rounded-md',
    md: 'w-20 h-30 md:w-22 md:h-32 text-md p-2 rounded-lg',
    lg: 'w-26 h-38 md:w-28 md:h-40 text-xl p-3 rounded-2xl',
  };

  return (
    <motion.div
      whileHover={!disabled && !selected ? { y: -12, scale: 1.03 } : {}}
      onClick={() => !disabled && onClick && onClick()}
      className={`
        relative select-none border flex flex-col justify-between card-shadow transition-all duration-300
        ${sizeClasses[size]}
        ${disabled 
          ? 'opacity-30 cursor-not-allowed border-outline-variant/20 bg-surface-dim/80' 
          : onClick 
            ? 'cursor-pointer hover:border-electricBlue/50' 
            : 'cursor-default'
        }
        ${selected ? 'border-electricBlue shadow-[0_0_15px_rgba(59,130,246,0.6)] translate-y-[-8px]' : ''}
        ${isHeart && !disabled 
          ? 'bg-gradient-to-br from-charcoal/90 to-crimson/10 border-crimson/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]' 
          : 'bg-gradient-to-br from-charcoal/95 to-surface-dim/95 border-outline-variant/30'
        }
        ${className}
      `}
    >
      {/* Top Left Rank/Suit */}
      <div className="flex flex-col items-start leading-none font-bold font-mono">
        <span className={isRed ? 'text-crimson' : 'text-on-surface'}>
          {card.display}
        </span>
        <span className={`text-xs mt-0.5 ${isRed ? 'text-crimson' : 'text-on-surface-variant'}`}>
          {card.symbol}
        </span>
      </div>

      {/* Large Center Translucent Symbol */}
      <div className={`
        absolute inset-0 flex items-center justify-center pointer-events-none select-none font-extrabold opacity-10 text-4xl md:text-5xl
        ${isRed ? 'text-crimson' : 'text-on-surface'}
        ${isHeart ? 'trump-glow' : ''}
      `}>
        {card.symbol}
      </div>

      {/* Cyberpunk frame overlay for face cards */}
      {['J', 'Q', 'K', 'A'].includes(card.display) && (
        <div className="absolute inset-x-1.5 inset-y-6 md:inset-y-8 border border-white/5 rounded flex items-center justify-center opacity-25 text-[8px] md:text-[9px] uppercase font-mono tracking-widest text-on-surface-variant select-none">
          {card.display === 'A' ? 'Core' : 'Officer'}
        </div>
      )}

      {/* Bottom Right Rank/Suit (Rotated) */}
      <div className="flex flex-col items-end leading-none font-bold font-mono self-end rotate-180">
        <span className={isRed ? 'text-crimson' : 'text-on-surface'}>
          {card.display}
        </span>
        <span className={`text-xs mt-0.5 ${isRed ? 'text-crimson' : 'text-on-surface-variant'}`}>
          {card.symbol}
        </span>
      </div>
    </motion.div>
  );
};
export default Card;
