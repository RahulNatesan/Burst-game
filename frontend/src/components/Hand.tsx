import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { CardData } from '../store/gameStore';
import { Card } from './Card';

interface HandProps {
  hand: CardData[];
  validPlays: CardData[];
  active: boolean;
  onPlayCard: (card: CardData) => void;
}

export const Hand: React.FC<HandProps> = ({
  hand,
  validPlays,
  active,
  onPlayCard,
}) => {
  const [shakingCardCode, setShakingCardCode] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCardClick = (card: CardData) => {
    if (!active) return;

    // Check if card is a valid play
    const isValid = validPlays.some(
      (c) => c.suit === card.suit && c.rank === card.rank
    );

    if (isValid) {
      onPlayCard(card);
    } else {
      // Trigger temporary shake effect for feedback
      setShakingCardCode(card.short_code);
      setTimeout(() => setShakingCardCode(null), 400);
    }
  };

  const overlap = isMobile ? '-52px' : '-56px';

  return (
    <div className="relative flex items-end justify-center w-full h-48 md:h-56 px-4 overflow-x-auto py-4 scrollbar-hide">
      <div className="flex items-center justify-center min-w-max px-6">
        {hand.map((card, i) => {
          // Check validity
          const isValid = active && validPlays.some(
            (c) => c.suit === card.suit && c.rank === card.rank
          );
          
          const isShaking = shakingCardCode === card.short_code;

          return (
            <motion.div
              key={card.short_code}
              style={{
                zIndex: i,
                marginLeft: i === 0 ? 0 : overlap,
              }}
              animate={
                isShaking
                  ? {
                      x: [-8, 8, -8, 8, 0],
                    }
                  : {}
              }
              transition={
                isShaking
                  ? { duration: 0.3 }
                  : { type: 'spring', damping: 22, stiffness: 150 }
              }
              className="relative hover:z-50 transition-all duration-150"
            >
              <Card
                card={card}
                size="lg"
                disabled={active && !isValid}
                onClick={() => handleCardClick(card)}
                className="hover:z-50"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
export default Hand;
