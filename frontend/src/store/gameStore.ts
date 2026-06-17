import { create } from 'zustand';

export interface CardData {
  suit: string;
  rank: number;
  display: string;
  short_code: string;
  is_trump: boolean;
  color: string;
  symbol: string;
}

export interface PlayerData {
  id: string;
  name: string;
  avatar_url: string;
  is_bot: boolean;
  hand: CardData[];
  hand_count: number;
  bid: number | null;
  tricks_won: number;
  total_score: number;
  is_connected: boolean;
  round_scores: number[];
}

export interface BiddingData {
  total_tricks: number;
  bidding_order: string[];
  bids: Record<string, number>;
  current_bidder: string | null;
  is_last_bidder: boolean;
  restricted_bid: number | null;
  valid_bids: number[];
  is_complete: boolean;
}

export interface TrickData {
  lead_suit: string | null;
  cards_played: Record<string, CardData>;
  play_order: string[];
  is_complete: boolean;
}

export interface GameStateData {
  game_id: string;
  phase: string; // "LOBBY" | "BIDDING" | "PLAYING" | "TRICK_END" | "ROUND_END" | "GAME_OVER"
  players: PlayerData[];
  current_round: number;
  total_rounds: number;
  cards_in_round: number;
  active_player_id: string | null;
  active_player_name: string | null;
  bidding_starter_id: string | null;
  lead_player_id: string | null;
  current_bidding: BiddingData | null;
  current_trick: TrickData | null;
  tricks_played_in_round: number;
  round_history: any[];
  winner_ids: string[];
}

export interface RoomStateData {
  code: string;
  host_id: string | null;
  players: PlayerData[];
  ready_states: Record<string, boolean>;
  is_everyone_ready: boolean;
  game_active: boolean;
  game_state: GameStateData | null;
}

export interface ChatMessage {
  sender: string;
  message: string;
  timestamp: string;
}

interface GameStore {
  token: string | null;
  playerId: string | null;
  username: string | null;
  avatarUrl: string | null;
  roomCode: string | null;
  roomState: RoomStateData | null;
  wsConnected: boolean;
  chatMessages: ChatMessage[];
  
  // Actions
  setAuth: (token: string, playerId: string, username: string, avatarUrl: string) => void;
  clearAuth: () => void;
  setRoomState: (state: RoomStateData | null) => void;
  setRoomCode: (code: string | null) => void;
  setWsConnected: (connected: boolean) => void;
  addChatMessage: (sender: string, message: string) => void;
  clearChat: () => void;
  resetStore: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  token: localStorage.getItem("burst_token"),
  playerId: localStorage.getItem("burst_player_id"),
  username: localStorage.getItem("burst_username"),
  avatarUrl: localStorage.getItem("burst_avatar_url"),
  roomCode: null,
  roomState: null,
  wsConnected: false,
  chatMessages: [],

  setAuth: (token, playerId, username, avatarUrl) => {
    localStorage.setItem("burst_token", token);
    localStorage.setItem("burst_player_id", playerId);
    localStorage.setItem("burst_username", username);
    localStorage.setItem("burst_avatar_url", avatarUrl);
    set({ token, playerId, username, avatarUrl });
  },

  clearAuth: () => {
    localStorage.removeItem("burst_token");
    localStorage.removeItem("burst_player_id");
    localStorage.removeItem("burst_username");
    localStorage.removeItem("burst_avatar_url");
    set({ token: null, playerId: null, username: null, avatarUrl: null });
  },

  setRoomState: (roomState) => set({ roomState }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setWsConnected: (wsConnected) => set({ wsConnected }),
  
  addChatMessage: (sender, message) => set((state) => ({
    chatMessages: [
      ...state.chatMessages,
      {
        sender,
        message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ].slice(-50) // keep last 50 messages
  })),

  clearChat: () => set({ chatMessages: [] }),
  
  resetStore: () => set({
    roomCode: null,
    roomState: null,
    chatMessages: [],
  })
}));
