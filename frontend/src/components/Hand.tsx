import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { CardData } from '../store/gameStore';
import { Card } from './Card';

interface HandProps {
  hand: CardData[];
  validPlays: CardData[];
  active: boolean;
  onPlayCard: (card: CardData) => void;
<<<<<<< HEAD
  cardSize?: 'sm' | 'md' | 'lg';
=======
  layout?: 'horizontal' | 'vertical';
>>>>>>> 0c199d9 (Add production cors)
}

export const Hand: React.FC<HandProps> = ({
  hand,
  validPlays,
  active,
  onPlayCard,
<<<<<<< HEAD
  cardSize = 'lg',
=======
  layout = 'horizontal',
>>>>>>> 0c199d9 (Add production cors)
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

<<<<<<< HEAD
  const overlap = cardSize === 'sm' 
    ? '-32px' 
    : cardSize === 'md' 
      ? '-44px' 
      : isMobile 
        ? '-52px' 
        : '-56px';

  return (
    <div className={`relative flex items-end justify-center w-full px-4 overflow-x-auto py-2 scrollbar-hide ${
      cardSize === 'sm' ? 'h-24 md:h-28' : cardSize === 'md' ? 'h-36 md:h-40' : 'h-48 md:h-56'
    }`}>
      <div className="flex items-center justify-center min-w-max px-6">
=======
  const isVertical = layout === 'vertical';
  const overlap = isMobile ? '-24px' : '-28px';
  const overlapY = '-56px';
  const cardSize = isVertical ? 'md' : 'lg';

  return (
    <div 
      className={`relative flex px-4 scrollbar-hide ${
        isVertical 
          ? 'flex-col items-center w-full h-full overflow-y-auto py-2' 
          : 'flex-row items-end justify-center w-full h-48 md:h-56 overflow-x-auto py-4'
      }`}
    >
      <div 
        className={`flex ${
          isVertical 
            ? 'flex-col items-center min-h-max py-4' 
            : 'items-center justify-center min-w-max px-6'
        }`}
      >
>>>>>>> 0c199d9 (Add production cors)
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
                marginLeft: isVertical ? 0 : (i === 0 ? 0 : overlap),
                marginTop: isVertical ? (i === 0 ? 0 : overlapY) : 0,
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
                size={cardSize}
<<<<<<< HEAD
=======
                layout={layout}
>>>>>>> 0c199d9 (Add production cors)
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
