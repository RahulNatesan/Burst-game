import { useGameStore, type CardData } from '../store/gameStore';

let socket: WebSocket | null = null;


export const socketService = {
  /** Establish WebSocket connection for a room. */
  connect(roomCode: string) {
    if (socket) {
      socket.close();
    }

    const token = useGameStore.getState().token;
    if (!token) {
      console.error("Cannot connect to WebSocket: Auth token not found.");
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsBaseUrl = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.hostname}:8000`;
    const wsUrl = `${wsBaseUrl}/ws/${roomCode}?token=${token}`;
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      useGameStore.getState().setWsConnected(true);
      console.log("WebSocket connected successfully.");
    };

    socket.onclose = () => {
      useGameStore.getState().setWsConnected(false);
      console.log("WebSocket connection closed.");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;

        if (type === "ROOM_UPDATE") {
          useGameStore.getState().setRoomState(data);
          useGameStore.getState().setRoomCode(data.code);
        } else if (type === "CHAT") {
          useGameStore.getState().addChatMessage(data.sender, data.message);
        } else if (type === "ERROR") {
          console.error("WebSocket server error payload:", data.message || payload.message);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };
  },

  /** Toggle player ready status in lobby. */
  sendReady(ready: boolean) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "READY", data: { ready } }));
    }
  },

  /** Submit player's bid. */
  sendBid(bid: number) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "SUBMIT_BID", data: { bid } }));
    }
  },

  /** Play a card from hand. */
  playCard(card: CardData) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "PLAY_CARD", data: { card } }));
    }
  },

  /** Send a chat message. */
  sendChatMessage(message: string) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "CHAT", data: { message } }));
    }
  },

  /** Disconnect WebSocket. */
  disconnect() {
    if (socket) {
      socket.close();
      socket = null;
    }
    useGameStore.getState().setWsConnected(false);
    useGameStore.getState().setRoomState(null);
    useGameStore.getState().setRoomCode(null);
  }
};
