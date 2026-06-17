import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore, type CardData } from '../store/gameStore';

const getValidPlays = (hand: CardData[], leadSuit: string | null): CardData[] => {
  if (!leadSuit) return hand;
  const leadSuitCards = hand.filter((c) => c.suit === leadSuit);
  if (leadSuitCards.length > 0) return leadSuitCards;
  return hand;
};
import { socketService } from '../services/socket';
import Scoreboard from '../components/Scoreboard';
import PlayerAvatar from '../components/PlayerAvatar';
import TrickArea from '../components/TrickArea';
import BidPanel from '../components/BidPanel';
import RoundSummary from '../components/RoundSummary';
import Hand from '../components/Hand';
import { sfx } from '../services/sfx';

export const Game: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const roomState = useGameStore((state) => state.roomState);
  const playerId = useGameStore((state) => state.playerId);
  const chatMessages = useGameStore((state) => state.chatMessages);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [chatInput, setChatInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(100);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [muted, setMuted] = useState(sfx.muted);

  const prevRound = useRef(0);
  const prevPhase = useRef('');
  const prevTricksWon = useRef<Record<string, number>>({});
  const [prevRanking, setPrevRanking] = useState<string[]>([]);

  const [biddingDelayTimeLeft, setBiddingDelayTimeLeft] = useState(0);

  // Monitor round start to trigger 15s inspection timer
  useEffect(() => {
    if (!roomState?.game_state) return;
    const game = roomState.game_state;
    if (game.phase === 'BIDDING' && game.current_round > prevRound.current) {
      prevRound.current = game.current_round;
      setBiddingDelayTimeLeft(15);
    }
  }, [roomState?.game_state?.current_round, roomState?.game_state?.phase]);

  // Countdown timer handler
  useEffect(() => {
    if (biddingDelayTimeLeft <= 0) return;
    const timer = setTimeout(() => {
      setBiddingDelayTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [biddingDelayTimeLeft]);

  // Monitor Window Resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync scroll for chat logs
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Reconnection management
  useEffect(() => {
    if (!code) return;
    if (!roomState) {
      socketService.connect(code);
    }
  }, [code, roomState]);

  // Redirect to Results on Game Over
  useEffect(() => {
    if (roomState?.game_state?.phase === 'GAME_OVER') {
      navigate('/results');
    }
  }, [roomState, navigate]);

  // Handle Active Turn Timer (Ticks down locally for UX feel)
  useEffect(() => {
    if (!roomState?.game_state) return;
    
    // Reset timer when active player changes
    setTimeLeft(100);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 0;
        return prev - 2; // Ticks down roughly over ~15 seconds (2% per 300ms)
      });
    }, 300);

    return () => clearInterval(interval);
  }, [roomState?.game_state?.active_player_id, roomState?.game_state?.current_trick?.cards_played]);

  // Sound Observers: Deal SFX
  useEffect(() => {
    if (!roomState?.game_state) return;
    const game = roomState.game_state;
    if (game.current_round > prevRound.current) {
      sfx.playDeal();
      prevRound.current = game.current_round;
    }
  }, [roomState?.game_state?.current_round]);

  // Sound Observers: Trick Winning SFX
  useEffect(() => {
    if (!roomState?.game_state || !playerId) return;
    const game = roomState.game_state;
    const playersList = Array.isArray(game.players) ? game.players : [];
    const myPlayer = playersList.find(p => p.id === playerId);
    if (myPlayer) {
      const prev = prevTricksWon.current[myPlayer.id] ?? 0;
      if (myPlayer.tricks_won > prev) {
        sfx.playWinTrick();
      }
      playersList.forEach(p => {
        prevTricksWon.current[p.id] = p.tricks_won;
      });
    }
  }, [roomState?.game_state?.tricks_played_in_round, roomState?.game_state?.players, playerId]);

  // Sound Observers: Round End Score Outcome SFX + capture previous ranking
  useEffect(() => {
    if (!roomState?.game_state || !playerId) return;
    const game = roomState.game_state;
    const playersList = Array.isArray(game.players) ? game.players : [];
    if (game.phase === 'ROUND_END' && prevPhase.current !== 'ROUND_END') {
      const myPlayer = playersList.find(p => p.id === playerId);
      if (myPlayer) {
        const isHit = myPlayer.bid === myPlayer.tricks_won;
        if (isHit) {
          sfx.playChime();
        } else {
          sfx.playBurst();
        }
      }
    }
    // Capture ranking order whenever we're NOT in ROUND_END so it persists as "previous" when ROUND_END arrives
    if (game.phase !== 'ROUND_END' && game.phase !== 'GAME_OVER') {
      const rankedIds = [...playersList]
        .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
        .map(p => p.id);
      setPrevRanking(rankedIds);
    }
    prevPhase.current = game.phase;
  }, [roomState?.game_state?.phase, roomState?.game_state?.players, playerId]);

  if (!roomState || !roomState.game_state) {
    return (
      <div className="h-full w-full flex items-center justify-center felt-texture">
        <div className="absolute inset-0 bg-[#0e0e0f]/50 backdrop-blur-[2px] z-0" />
        <div className="text-white font-mono animate-pulse text-sm z-10">
          Syncing Game Table...
        </div>
      </div>
    );
  }

  const game = roomState.game_state;
  const myPlayer = game.players.find((p) => p.id === playerId);
  const activePlayer = game.players.find((p) => p.id === game.active_player_id);

  const isMyBiddingTurn = game.phase === 'BIDDING' && game.active_player_id === playerId && biddingDelayTimeLeft <= 0;
  const isMyPlayTurn = game.phase === 'PLAYING' && game.active_player_id === playerId;
  const isInspectionActive = game.phase === 'BIDDING' && biddingDelayTimeLeft > 0;

  // Seating configuration clockwise around the circular table starting from client player at index 0
  const N = game.players.length;
  const clientIdx = game.players.findIndex((p) => p.id === playerId);

  // Seating calculations: use an ellipse (oval) to spread players horizontally on widescreen displays
  const xRadius = isMobile
    ? Math.min(window.innerWidth * 0.32, 110)
    : Math.max(140, Math.min(window.innerHeight * 0.28, window.innerWidth * 0.22, 260));

  const yRadius = isMobile
    ? Math.min(window.innerWidth * 0.32, 110)
    : Math.max(110, Math.min(window.innerHeight * 0.18, window.innerWidth * 0.13, 160));

  // The base reference table radius (used to size the central TrickArea relative to vertical space)
  const calculatedRadius = yRadius;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sfx.playTick();
      socketService.sendChatMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const handlePlayCard = (card: any) => {
    sfx.playCardPlay();
    socketService.playCard(card);
  };

  const handleSubmitBid = (bid: number) => {
    sfx.playTick();
    socketService.sendBid(bid);
  };

  return (
    <div className="felt-texture h-full w-full flex flex-col justify-between overflow-hidden relative">
      <div className="absolute inset-0 bg-[#0e0e0f]/50 backdrop-blur-[1px] z-0" />

      {/* Top HUD Header */}
      <header className={`bg-surface-dim/80 backdrop-blur-xl border-b border-outline-variant/20 h-14 px-4 flex justify-between items-center shrink-0 transition-all duration-500 ${isInspectionActive ? 'z-10 pointer-events-none opacity-20' : 'z-30'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-on-surface-variant hover:text-white cursor-pointer flex items-center pr-1 transition-all active:scale-90"
            title="Open System Menu"
          >
            <span className="material-symbols-outlined text-lg md:text-xl">menu</span>
          </button>
          <span className="font-headline font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-electricBlue to-crimson select-none text-base md:text-lg">
            BURST
          </span>
          <div className="h-4 w-px bg-outline-variant/30" />
          <span className="text-sm font-mono text-on-surface-variant">
            Room: <span className="text-white font-bold">{roomState.code}</span>
          </span>
        </div>

        {/* Center Combined Info HUD Capsule */}
        <div className="bg-charcoal/90 border border-white/10 rounded-full px-5 py-1.5 flex items-center gap-4 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-20">
          {/* Trump Indicator */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-crimson font-black uppercase tracking-widest select-none">
              Trump
            </span>
            <span className="text-base font-bold text-crimson trump-glow select-none leading-none">
              ♥
            </span>
          </div>
          
          <div className="w-px h-3 bg-outline-variant/30" />

          {/* Round Counter */}
          <div className="text-xs md:text-sm font-mono text-on-surface flex items-center gap-1">
            Round: <span className="text-white font-bold">{game.current_round}/{game.total_rounds}</span>
          </div>

          <div className="w-px h-3 bg-outline-variant/30" />

          {/* Cards per Player */}
          <div className="text-xs md:text-sm font-mono text-on-surface flex items-center gap-1">
            Deal: <span className="text-electricBlue font-bold">{game.cards_in_round} cards</span>
          </div>
        </div>

        {/* Right Connection Status Badge */}
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" />
          <span className="text-[11px] md:text-xs font-mono text-emerald-400 uppercase font-black tracking-widest">
            Online
          </span>
        </div>
      </header>

      {/* Main Table Content */}
      <main className={`flex-1 w-full flex flex-col md:flex-row relative items-center justify-center p-4 transition-all duration-500 ${isInspectionActive ? 'z-10 pointer-events-none opacity-20' : 'z-10'}`}>
        
        {/* Seated Table Container */}
        <div className="relative w-full max-w-[42vh] md:max-w-[48vh] lg:max-w-[50vh] aspect-square flex items-center justify-center border border-white/5 rounded-full bg-charcoal/10 shadow-[inset_0_0_60px_rgba(0,0,0,0.8)] z-10">
          
          {/* Active Center Trick Area */}
          {game.current_trick && (
            <TrickArea
              cardsPlayed={game.current_trick.cards_played}
              players={game.players}
              clientPlayerId={playerId || ''}
              tableRadius={calculatedRadius}
            />
          )}

          {/* Seat Players Around Circular Perimeter */}
          {game.players.map((p, idx) => {
            const seat = (idx - clientIdx + N) % N;
            
            const angle = (Math.PI / 2) + (2 * Math.PI * seat / N);
            const x = Math.cos(angle) * xRadius;
            const y = Math.sin(angle) * yRadius;
            
            const isPlayerActive = game.active_player_id === p.id;
            const isBiddingStarter = game.bidding_starter_id === p.id;

            return (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
                className="z-10"
              >
                <PlayerAvatar
                  player={p}
                  isActive={isPlayerActive}
                  isBiddingStarter={isBiddingStarter}
                  timeLeft={isPlayerActive ? timeLeft : 100}
                  compact={N > 5}
                />
              </div>
            );
          })}
        </div>

        {/* Desktop Sidebars (Leaderboard + Chat) */}
        {!isMobile && (
          <aside className="w-80 xl:w-96 h-[80%] flex flex-col gap-4 absolute right-6 top-[10%] z-20">
            <div className="flex-1">
              <Scoreboard players={game.players} activePlayerId={game.active_player_id} />
            </div>
            
            {/* Cyber Chat Log */}
            <div className="h-64 glass-panel rounded-2xl p-4 border border-white/5 flex flex-col">
              <h4 className="text-xs md:text-sm uppercase tracking-widest text-on-surface-variant font-mono font-bold mb-2 flex items-center gap-2 border-b border-outline-variant/30 pb-2 shrink-0">
                <span className="material-symbols-outlined text-sm">chat</span>
                Link Communications
              </h4>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2 font-mono text-xs md:text-sm text-zinc-300">
                {chatMessages.length === 0 && (
                  <div className="text-zinc-650 italic">No communications received.</div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className="break-all leading-relaxed">
                    <span className="text-electricBlue font-bold">{msg.sender}: </span>
                    <span>{msg.message}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendChat} className="flex gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Broadcast message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value.slice(0, 35))}
                  className="flex-1 bg-[#1b1b1d] border border-outline-variant/30 text-white rounded-lg px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-electricBlue"
                />
                <button type="submit" className="bg-electricBlue hover:bg-[#1d4ed8] text-white px-4 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider font-mono cursor-pointer transition-all active:scale-95">
                  Send
                </button>
              </form>
            </div>
          </aside>
        )}
      </main>

      {/* Hand Cards Panel at bottom */}
      {(() => {
        const cardSize = isMobile ? 'sm' : window.innerHeight < 750 ? 'md' : 'lg';
        const footerHeightClass = cardSize === 'sm'
          ? 'h-28'
          : cardSize === 'md'
            ? 'h-38 md:h-42'
            : 'h-52 md:h-60';

        return (
          <footer className={`w-full ${footerHeightClass} z-35 relative shrink-0 flex flex-col items-center justify-end bg-gradient-to-t from-[#0e0e0f] to-transparent pb-4`}>
            {/* Status prompt alert */}
            <div className="absolute top-0 transform -translate-y-8 font-mono text-[10px] md:text-xs text-on-surface-variant bg-[#131315]/85 border border-outline-variant/20 rounded-full px-4 py-1 animate-pulse z-30">
              {game.phase === 'BIDDING' && biddingDelayTimeLeft > 0 && "Inspect your cards. Bidding countdown active."}
              {isMyBiddingTurn && "Place your trick forecast bid."}
              {isMyPlayTurn && "Your turn. Play a card following lead suit if possible."}
              {!isMyBiddingTurn && !isMyPlayTurn && game.phase === 'BIDDING' && biddingDelayTimeLeft <= 0 && activePlayer && `Waiting for ${activePlayer.name} to bid...`}
              {!isMyBiddingTurn && !isMyPlayTurn && game.phase === 'PLAYING' && activePlayer && `Waiting for ${activePlayer.name}...`}
            </div>

            {myPlayer && (
              <Hand
                hand={myPlayer.hand}
                validPlays={isMyPlayTurn && game.current_trick ? getValidPlays(myPlayer.hand, game.current_trick.lead_suit) : []}
                active={isMyPlayTurn}
                onPlayCard={handlePlayCard}
                cardSize={cardSize}
              />
            )}
          </footer>
        );
      })()}

      {/* Overlays / Modals */}
      <AnimatePresence>
        {isMyBiddingTurn && game.current_bidding && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40 p-4">
            <BidPanel
              totalTricks={game.current_bidding.total_tricks}
              restrictedBid={game.current_bidding.restricted_bid}
              validBids={game.current_bidding.valid_bids}
              currentBidSum={Object.values(game.current_bidding.bids).reduce((sum, b) => sum + b, 0)}
              onSubmit={handleSubmitBid}
            />
          </div>
        )}

        {isInspectionActive && (
          <>
            {/* Smooth Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-[#070708]/80 backdrop-blur-sm z-30 pointer-events-none"
            />
            {/* Centered animated Card Inspection popup */}
            <div className="fixed inset-0 flex flex-col items-center justify-center z-40 pointer-events-none select-none p-4 bg-transparent">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 15 }}
                transition={{ type: "spring", damping: 20, stiffness: 260 }}
                className="glass-panel px-8 py-6 rounded-3xl flex flex-col items-center border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-w-sm w-full pointer-events-auto"
              >
                <span className="text-xs uppercase font-mono tracking-widest text-electricBlue font-black mb-2.5 flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                    className="material-symbols-outlined text-base text-electricBlue select-none flex items-center justify-center"
                    style={{ willChange: 'transform' }}
                  >
                    progress_activity
                  </motion.span>
                  Card Inspection Phase
                </span>
                <span className="text-2xl font-black font-mono text-white text-center">
                  Bidding begins in <span className="text-amber-500 font-extrabold">{biddingDelayTimeLeft}s</span>
                </span>
              </motion.div>
            </div>
          </>
        )}

        {game.phase === 'ROUND_END' && (
          <RoundSummary round={game.current_round} players={game.players} previousRanking={prevRanking} />
        )}

        {/* Left Settings Sidebar Drawer */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity" 
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Drawer Content */}
            <div className="relative w-72 max-w-xs bg-charcoal/95 border-r border-white/10 h-full flex flex-col p-6 shadow-2xl z-10 glass-panel animate-slide-in">
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4 mb-6">
                <h3 className="font-headline font-black text-lg text-primary tracking-wider uppercase flex items-center gap-2">
                  <span className="material-symbols-outlined">settings</span>
                  SYSTEM MENU
                </h3>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-on-surface-variant hover:text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Menu Options */}
              <div className="flex-1 space-y-4">
                {/* Audio Toggle */}
                <button 
                  onClick={() => {
                    sfx.muted = !sfx.muted;
                    setMuted(sfx.muted);
                  }}
                  className="w-full bg-[#1b1b1d] hover:bg-electricBlue/10 border border-outline-variant/30 hover:border-electricBlue text-white rounded-xl p-3.5 flex items-center gap-3.5 transition-all text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  <span className="material-symbols-outlined text-electricBlue">
                    {muted ? 'volume_off' : 'volume_up'}
                  </span>
                  <span>{muted ? 'Unmute Audio' : 'Mute Audio'}</span>
                </button>

                {/* Rules & Guide */}
                <button 
                  onClick={() => {
                    alert(
                      "BURST RULES:\n\n" +
                      "1. Standard 52-card deck. Hearts (♥) are always the trump suit.\n" +
                      "2. Deal size starts at floor(52/n) and decreases by 1 card each round down to 1.\n" +
                      "3. Bidding Phase: Estimate how many tricks you will win. Last bidder cannot choose a bid that makes the total bids equal the total tricks.\n" +
                      "4. Bidding starter rotates clockwise each round.\n" +
                      "5. Playing Phase: Must follow the lead suit if possible. Highest card of lead suit wins the trick, unless cut by a Heart (trump).\n" +
                      "6. Score: 10 + 11 * bid if you match exactly. Otherwise, you get 0 (BURST!)."
                    );
                  }}
                  className="w-full bg-[#1b1b1d] hover:bg-electricBlue/10 border border-outline-variant/30 hover:border-electricBlue text-white rounded-xl p-3.5 flex items-center gap-3.5 transition-all text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  <span className="material-symbols-outlined text-amber-500">menu_book</span>
                  <span>Rules & Guide</span>
                </button>
              </div>

              {/* Quit / Disconnect */}
              <div className="mt-auto pt-6 border-t border-outline-variant/30">
                <button 
                  onClick={() => {
                    if (confirm("Are you sure you want to quit this game?")) {
                      socketService.disconnect();
                      navigate('/');
                    }
                  }}
                  className="w-full bg-crimson/10 hover:bg-crimson/20 border border-crimson/30 hover:border-crimson text-crimson rounded-xl p-3.5 flex items-center justify-center gap-2 transition-all text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  <span className="material-symbols-outlined">logout</span>
                  <span>Abandon Match</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Game;
