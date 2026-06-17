import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CardData, PlayerData } from '../store/gameStore';
import { Card } from './Card';

interface TrickAreaProps {
  cardsPlayed: Record<string, CardData>;
  players: PlayerData[];
  clientPlayerId: string;
  tableWidth?: number;
=======
  xRadius: number; // Added for horizontal elliptical fanning
  yRadius: number; // Added for vertical elliptical fanning
>>>>>>> 8d0340f (Shift layout left and increase avatar spread)
}

export const TrickArea: React.FC<TrickAreaProps> = ({
  cardsPlayed,
  players,
  clientPlayerId,
  tableWidth = 450,
=======
  xRadius,
  yRadius,
>>>>>>> 8d0340f (Shift layout left and increase avatar spread)
}) => {
  const N = players.length;
  const clientIdx = players.findIndex(p => p.id === clientPlayerId);
  const isMobile = window.innerWidth < 768;

  const innerAreaSize = isMobile ? 140 : Math.max(220, Math.min(tableWidth * 0.45, 340));
  const markerSize = innerAreaSize * 0.4;
  const radius = isMobile ? 42 : Math.max(70, Math.min(tableWidth * 0.16, 110));

  // Center indicator felt circle scale
  const innerMarkerSize = Math.max(60, yRadius * 0.45);

  return (
    <div 
      style={{ width: `${innerAreaSize}px`, height: `${innerAreaSize}px` }}
      className="absolute rounded-full border border-white/5 bg-[#171719]/30 backdrop-blur-md flex items-center justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-300"
=======
      className="absolute flex items-center justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-300 pointer-events-none"
>>>>>>> 8d0340f (Shift layout left and increase avatar spread)
    >
      
      {/* Visual felt marker / trump accent center indicator */}
      <div 
        style={{ width: `${markerSize}px`, height: `${markerSize}px` }}
        className="absolute rounded-full border border-white/5 bg-[#0e0e0f]/50 pointer-events-none" 
      />

      <AnimatePresence>
        {Object.entries(cardsPlayed).map(([pid, card]) => {
          const playerIdx = players.findIndex(p => p.id === pid);
          if (playerIdx === -1) return null;
          
          // Calculate seat relative to client
          const seat = (playerIdx - clientIdx + N) % N;
          
          // Polar coordinates for played card fanning
=======
          // Polar coordinates for played card fanning - fully proportional to table dimensions
          const fanningX = xRadius * 0.35;
          const fanningY = yRadius * 0.35;
>>>>>>> 8d0340f (Shift layout left and increase avatar spread)
          const angle = (Math.PI / 2) + (2 * Math.PI * seat / N);
          const x = Math.cos(angle) * fanningX;
          const y = Math.sin(angle) * fanningY;
          
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
