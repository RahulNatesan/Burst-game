import React from 'react';
import { motion } from 'framer-motion';

interface BidPanelProps {
  totalTricks: number;
  restrictedBid: number | null;
  validBids: number[];
  onSubmit: (bid: number) => void;
  currentBidSum: number;
}

export const BidPanel: React.FC<BidPanelProps> = ({
  totalTricks,
  restrictedBid,
  validBids,
  onSubmit,
  currentBidSum,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.97 }}
      transition={{ type: 'spring', damping: 20, stiffness: 180 }}
      className="glass-panel w-full max-w-sm rounded-2xl p-5 md:p-6 shadow-2xl relative border border-white/10 z-50 flex flex-col items-center"
    >
      <h3 className="font-headline-md text-headline-md font-bold text-primary tracking-wider uppercase mb-1 text-center">
        Place Your Bid
      </h3>
      <p className="text-xs text-on-surface-variant mb-5 text-center max-w-[280px]">
        Predict how many tricks you will win this round.
      </p>

      {/* Info Metrics */}
      <div className="flex justify-between w-full text-xs font-mono text-on-surface-variant border-b border-outline-variant/30 pb-3 mb-5">
        <div>
          Tricks in Round: <span className="text-white font-bold">{totalTricks}</span>
        </div>
        <div>
          Total Bids: <span className="text-electricBlue font-bold">{currentBidSum}</span>
        </div>
      </div>

      {/* Bids Grid */}
      <div className="grid grid-cols-4 gap-2.5 w-full mb-5">
        {Array.from({ length: totalTricks + 1 }, (_, i) => {
          const isValid = validBids.includes(i);
          const isForbidden = i === restrictedBid;
          
          return (
            <button
              key={i}
              disabled={!isValid}
              onClick={() => onSubmit(i)}
              className={`
                h-12 rounded-xl font-mono text-md font-bold flex flex-col items-center justify-center border transition-all duration-200
                ${isValid 
                  ? 'bg-charcoal border-outline-variant/30 text-white hover:bg-electricBlue/10 hover:border-electricBlue cursor-pointer active:scale-95' 
                  : isForbidden 
                    ? 'bg-crimson/5 border-crimson/20 text-crimson/40 cursor-not-allowed'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                }
              `}
            >
              <span>{i}</span>
              {isForbidden && (
                <span className="text-[6px] text-crimson font-sans uppercase font-bold tracking-wider mt-0.5 scale-90">
                  BURST
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Warning Alert Banner */}
      {restrictedBid !== null && (
        <div className="bg-crimson/10 border border-crimson/20 rounded-lg p-2.5 text-[10px] md:text-[11px] text-crimson/95 font-medium leading-relaxed text-center w-full flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm shrink-0">warning</span>
          <span>
            Last Bidder rule active: You cannot bid <span className="font-bold underline text-white">{restrictedBid}</span>.
          </span>
        </div>
      )}
    </motion.div>
  );
};
export default BidPanel;
