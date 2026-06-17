import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGameStore } from '../store/gameStore';
import { socketService } from '../services/socket';

export const Results: React.FC = () => {
  const navigate = useNavigate();
  const roomState = useGameStore((state) => state.roomState);
  const playerId = useGameStore((state) => state.playerId);

  // Trigger celebration confetti at throttled intervals to avoid browser lag
  useEffect(() => {
    const duration = 4.5 * 1000;
    const end = Date.now() + duration;

    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      
      confetti({
        particleCount: 12,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.65 },
        colors: ['#3B82F6', '#EF4444', '#F59E0B']
      });
      confetti({
        particleCount: 12,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.65 },
        colors: ['#3B82F6', '#EF4444', '#F59E0B']
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  if (!roomState || !roomState.game_state) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center felt-texture p-6">
        <div className="absolute inset-0 bg-[#0e0e0f]/50 backdrop-blur-[2px] z-0" />
        <div className="z-10 flex flex-col items-center">
          <h3 className="text-white font-mono mb-4 text-xs">No active match data found.</h3>
          <button 
            onClick={() => navigate('/')} 
            className="bg-charcoal border border-outline-variant/35 hover:border-electricBlue text-white px-4 py-2.5 rounded-xl text-xs font-bold font-mono active:scale-95 transition-all"
          >
            Return to HQ
          </button>
        </div>
      </div>
    );
  }

  const game = roomState.game_state;
  const sortedPlayers = [...game.players].sort((a, b) => b.total_score - a.total_score);
  
  const first = sortedPlayers[0];
  const second = sortedPlayers[1];
  const third = sortedPlayers[2];

  const handleReturnHome = () => {
    socketService.disconnect();
    useGameStore.getState().resetStore();
    navigate('/');
  };

  const getStats = (p: any) => {
    const totalRounds = game.total_rounds;
    // A player hit if their round score was > 0 (10 + 11*bid if hit, 0 if burst)
    const hits = p.round_scores.filter((score: number) => score > 0).length;
    const hitRate = totalRounds > 0 ? Math.round((hits / totalRounds) * 100) : 0;
    return { hits, hitRate };
  };

  return (
    <div className="felt-texture h-full w-full flex flex-col justify-between p-4 md:p-8 relative overflow-y-auto">
      <div className="absolute inset-0 bg-[#0e0e0f]/50 backdrop-blur-[2px] z-0" />

      {/* Main Column */}
      <div className="max-w-2xl lg:max-w-3xl w-full mx-auto flex flex-col z-10 flex-1 justify-center py-6">
        
        {/* Title */}
        <h2 className="font-headline font-black text-3xl md:text-4xl lg:text-5xl text-center text-primary italic uppercase tracking-wider mb-8">
          Final Roster Standings
        </h2>

        {/* Podium Stand Display */}
        <div className="flex items-end justify-center gap-5 mb-8 h-56 md:h-64 lg:h-72 shrink-0">
          
          {/* Second Place */}
          {second && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '70%', opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', damping: 15 }}
              className="flex flex-col items-center justify-end w-28 md:w-32 bg-[#1b1b1d]/85 rounded-t-2xl border-t border-x border-zinc-700/40 pb-4 shadow-md"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border border-zinc-600 mb-2 shrink-0">
                <img 
                  src={second.avatar_url} 
                  alt={second.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${second.name}`;
                  }}
                />
              </div>
              <span className="text-xs font-mono text-zinc-400 max-w-[95px] truncate text-center font-bold leading-none">
                {second.name}
              </span>
              <span className="text-sm md:text-base font-bold font-mono text-white mt-1.5 leading-none">
                {second.total_score}
              </span>
              <div className="text-[9px] bg-zinc-800 text-zinc-400 font-bold px-2 py-0.5 rounded font-mono mt-2.5 scale-90">
                2ND
              </div>
            </motion.div>
          )}

          {/* First Place */}
          {first && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '88%', opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 15 }}
              className="flex flex-col items-center justify-end w-32 md:w-38 bg-amber-500/10 rounded-t-2xl border-t border-x border-amber-500/30 pb-5 shadow-[0_0_15px_rgba(245,158,11,0.12)] relative"
            >
              {/* Crown */}
              <span className="absolute -top-8 text-2xl animate-bounce">👑</span>
              
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-amber-400 mb-2 shrink-0">
                <img 
                  src={first.avatar_url} 
                  alt={first.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${first.name}`;
                  }}
                />
              </div>
              <span className="text-sm font-mono text-amber-300 max-w-[110px] truncate text-center font-bold leading-none">
                {first.name}
              </span>
              <span className="text-base md:text-lg font-bold font-mono text-amber-400 mt-1.5 leading-none">
                {first.total_score}
              </span>
              <div className="text-[9px] bg-amber-500 text-obsidian font-bold px-2.5 py-0.5 rounded font-mono mt-2.5 scale-90">
                WINNER
              </div>
            </motion.div>
          )}

          {/* Third Place */}
          {third && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '55%', opacity: 1 }}
              transition={{ delay: 0.6, type: 'spring', damping: 15 }}
              className="flex flex-col items-center justify-end w-28 bg-[#1b1b1d]/85 rounded-t-2xl border-t border-x border-zinc-700/40 pb-4 shadow-md"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border border-zinc-600 mb-2 shrink-0">
                <img 
                  src={third.avatar_url} 
                  alt={third.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${third.name}`;
                  }}
                />
              </div>
              <span className="text-xs font-mono text-zinc-400 max-w-[95px] truncate text-center font-bold leading-none">
                {third.name}
              </span>
              <span className="text-sm md:text-base font-bold font-mono text-white mt-1.5 leading-none">
                {third.total_score}
              </span>
              <div className="text-[9px] bg-zinc-800 text-zinc-400 font-bold px-2 py-0.5 rounded font-mono mt-2.5 scale-90">
                3RD
              </div>
            </motion.div>
          )}
        </div>

        {/* Standings List */}
        <div className="glass-panel rounded-3xl p-5 md:p-6 border border-white/5 space-y-2.5 flex-1 mb-6 shadow-lg overflow-y-auto max-h-[360px] md:max-h-[440px]">
          {sortedPlayers.map((p, idx) => {
            const { hitRate } = getStats(p);
            const isMe = p.id === playerId;

            return (
              <div
                key={p.id}
                className={`
                  flex items-center justify-between p-3.5 md:p-4 rounded-2xl border transition-all duration-200
                  ${isMe 
                    ? 'border-electricBlue bg-electricBlue/5' 
                    : 'border-outline-variant/15 bg-charcoal/30'
                  }
                `}
              >
                <div className="flex items-center gap-3.5">
                  <span className="font-mono font-bold text-sm md:text-base text-on-surface-variant w-6 shrink-0 text-center">
                    #{idx + 1}
                  </span>
                  
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-zinc-800 border border-white/5 shrink-0">
                    <img 
                      src={p.avatar_url} 
                      alt={p.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${p.name}`;
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm md:text-base text-white leading-none">{p.name}</span>
                      {p.is_bot && (
                        <span className="text-[8px] md:text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-400 rounded px-1.5 py-0.5 font-mono font-bold leading-none shrink-0 tracking-wider">
                          AI
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-on-surface-variant font-mono mt-1.5 leading-none">
                      Hit Accuracy: <span className="text-white font-bold">{hitRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-sm md:text-base text-white">
                    {p.total_score} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back Button */}
        <button
          onClick={handleReturnHome}
          className="w-full max-w-xs mx-auto bg-gradient-to-r from-electricBlue to-[#1d4ed8] text-white font-headline text-xs md:text-sm font-bold uppercase tracking-wider py-4 rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer font-mono shrink-0"
        >
          Exit to Lobby
        </button>
      </div>
    </div>
  );
};
export default Results;
