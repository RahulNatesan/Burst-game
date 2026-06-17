import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import { sfx } from '../services/sfx';
import PlayerAvatar from '../components/PlayerAvatar';

export const Lobby: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  
  const roomState = useGameStore((state) => state.roomState);
  const playerId = useGameStore((state) => state.playerId);
  const wsConnected = useGameStore((state) => state.wsConnected);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Connection Handler
  useEffect(() => {
    if (!code) return;
    
    // Connect WebSocket
    socketService.connect(code);
    
    return () => {
      // Disconnect on leaving lobby
      socketService.disconnect();
    };
  }, [code]);

  // Game Start Listener
  useEffect(() => {
    if (roomState && roomState.game_active && code) {
      sfx.playChime(); // Play enter game sound
      navigate(`/game/${code}`);
    }
  }, [roomState, navigate, code]);

  if (!roomState) {
    return (
      <div className="h-full w-full flex items-center justify-center felt-texture">
        <div className="absolute inset-0 bg-[#0e0e0f]/50 backdrop-blur-[2px] z-0" />
        <div className="text-white font-mono animate-pulse text-sm z-10">
          Syncing Operations Room...
        </div>
      </div>
    );
  }

  const isHost = roomState.host_id === playerId;
  const myReadyState = roomState.ready_states[playerId || ''] || false;
  const canStartGame = roomState.is_everyone_ready && roomState.players.length >= 2;

  const handleToggleReady = () => {
    sfx.playTick();
    socketService.sendReady(!myReadyState);
  };

  const handleAddBot = async () => {
    sfx.playTick();
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      await api.addBot(code);
    } catch (err: any) {
      setError(err.message || "Failed to add bot agent.");
    } finally {
      setLoading(false);
    }
  };

  const handleKickBot = async (botId: string) => {
    sfx.playTick();
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      await api.removeBot(code, botId);
    } catch (err: any) {
      setError(err.message || "Failed to remove bot agent.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    sfx.playTick();
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      await api.startGame(code);
    } catch (err: any) {
      setError(err.message || "Failed to initiate table start sequence.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="felt-texture h-full w-full flex flex-col items-center justify-center p-4 md:p-6 relative">
      <div className="absolute inset-0 bg-[#0e0e0f]/50 backdrop-blur-[2px] z-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl lg:max-w-4xl glass-panel rounded-3xl p-6 md:p-10 flex flex-col z-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/5"
      >
        {/* Header Metadata */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-outline-variant/30 pb-5 mb-6 gap-4">
          <div>
            <h2 className="font-headline font-black text-2xl md:text-3xl text-white italic uppercase tracking-wider">
              Operations Control
            </h2>
            <div className="flex items-center gap-2 mt-1.5 text-xs md:text-sm font-mono text-on-surface-variant">
              <span>Secure Link:</span>
              <span className={`flex items-center gap-1 font-bold ${wsConnected ? 'text-emerald-400' : 'text-crimson animate-pulse'}`}>
                <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-crimson'}`} />
                {wsConnected ? 'LINK_SECURED' : 'DISCONNECTED'}
              </span>
            </div>
          </div>

          {/* Copyable Room Code */}
          <div className="bg-[#1b1b1d]/85 border border-outline-variant/35 rounded-xl px-5 py-3 flex items-center justify-between gap-6 select-text">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-on-surface-variant leading-none">
                Room Access Code
              </span>
              <span className="text-xl md:text-2xl font-mono font-extrabold text-electricBlue tracking-wider mt-2 leading-none">
                {roomState.code}
              </span>
            </div>
            <button
              onClick={() => {
                sfx.playTick();
                navigator.clipboard.writeText(roomState.code);
              }}
              className="text-xs bg-charcoal hover:bg-electricBlue/10 hover:border-electricBlue hover:text-white transition-all border border-outline-variant/35 rounded-lg px-3 py-1.5 text-on-surface cursor-pointer font-bold font-mono active:scale-90"
            >
              Copy
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-crimson/10 border border-crimson/20 rounded-xl px-4 py-2.5 text-xs md:text-sm text-crimson mb-4 text-center w-full font-mono">
            {error}
          </div>
        )}

        {/* Players grid */}
        <h3 className="text-xs md:text-sm uppercase tracking-wider text-on-surface-variant font-mono font-bold mb-4">
          Tactical Roster ({roomState.players.length}/7 players)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8 flex-1 overflow-y-auto max-h-[380px] md:max-h-[460px] p-4 bg-[#0e0e0f]/35 border border-white/5 rounded-2xl">
          {roomState.players.map((p) => {
            const isReady = roomState.ready_states[p.id] || false;
            const canKick = isHost && p.is_bot && !loading;
            
            return (
              <div
                key={p.id}
                className="bg-charcoal/20 border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center transition-all h-[160px] hover:bg-charcoal/30"
              >
                <PlayerAvatar
                  player={p}
                  isLobby
                  ready={isReady}
                  showKickButton={canKick}
                  onKick={() => handleKickBot(p.id)}
                />
              </div>
            );
          })}

          {/* Add Bot Node */}
          {isHost && roomState.players.length < 7 && (
            <button
              onClick={handleAddBot}
              disabled={loading}
              className="border-2 border-dashed border-outline-variant/20 hover:border-electricBlue/40 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 bg-charcoal/5 transition-all text-on-surface-variant hover:text-white cursor-pointer group h-[160px]"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform font-bold text-electricBlue">+</span>
              <span className="text-xs font-mono uppercase tracking-wider font-bold">Deploy Bot</span>
            </button>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-4 border-t border-outline-variant/30 pt-6">
          {!isHost && (
            <button
              onClick={handleToggleReady}
              disabled={loading}
              className={`
                flex-1 py-4 rounded-xl font-mono text-sm font-bold uppercase tracking-wider border cursor-pointer active:scale-95 transition-all
                ${myReadyState
                  ? 'bg-emerald-600/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/25'
                  : 'bg-charcoal border-outline-variant/35 text-white hover:border-electricBlue/50'
                }
              `}
            >
              {myReadyState ? 'Status: Active Standby' : 'Set Ready'}
            </button>
          )}

          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={loading || !canStartGame}
              className={`
                flex-1 py-4 rounded-xl font-mono text-sm font-bold uppercase tracking-wider transition-all active:scale-95
                ${canStartGame
                  ? 'bg-gradient-to-r from-electricBlue to-[#1d4ed8] text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] cursor-pointer'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                }
              `}
            >
              Start Play
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
export default Lobby;
