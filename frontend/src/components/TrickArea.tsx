import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CardData, PlayerData } from '../store/gameStore';
import { Card } from './Card';

interface TrickAreaProps {
  cardsPlayed: Record<string, CardData>;
  players: PlayerData[];
  clientPlayerId: string;
}

export const TrickArea: React.FC<TrickAreaProps> = ({
  cardsPlayed,
  players,
  clientPlayerId,
}) => {
  const N = players.length;
  const clientIdx = players.findIndex(p => p.id === clientPlayerId);

  return (
    <div className="absolute w-48 h-48 md:w-56 md:h-56 rounded-full border border-white/5 bg-[#171719]/30 backdrop-blur-md flex items-center justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
      
      {/* Visual felt marker / trump accent center indicator */}
      <div className="absolute w-24 h-24 rounded-full border border-white/5 bg-[#0e0e0f]/50 pointer-events-none" />

      <AnimatePresence>
        {Object.entries(cardsPlayed).map(([pid, card]) => {
          const playerIdx = players.findIndex(p => p.id === pid);
          if (playerIdx === -1) return null;
          
          // Calculate seat relative to client
          const seat = (playerIdx - clientIdx + N) % N;
          
          // Polar coordinates for played card fanning
          const radius = window.innerWidth < 768 ? 48 : 64; // Inner radius
          const angle = (Math.PI / 2) + (2 * Math.PI * seat / N);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          // Natural rotation layout angle
          const rotate = (seat / N) * 360 - 90;

          return (
            <motion.div
              key={pid}
              initial={{ scale: 0.2, x: x * 3.5, y: y * 3.5, opacity: 0, rotate: 0 }}
              animate={{ scale: 1, x, y, opacity: 1, rotate }}
              exit={{ scale: 0.2, opacity: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 140 }}
              style={{
                position: 'absolute',
                top: `calc(50% - 2.5rem)`, // center offsets
                left: `calc(50% - 1.75rem)`,
              }}
              className="w-14 h-20 pointer-events-none"
            >
              <Card card={card} size="sm" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
export default TrickArea;
