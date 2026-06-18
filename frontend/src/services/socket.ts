import { useGameStore, type CardData } from '../store/gameStore';

let socket: WebSocket | null = null;
let pingInterval: ReturnType<typeof setInterval> | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let isIntentionalDisconnect = false;

export const socketService = {
  /** Establish WebSocket connection for a room. */
  connect(roomCode: string) {
    if (socket) {
      socket.close();
    }

    isIntentionalDisconnect = false;

    if (useGameStore.getState().roomCode !== roomCode) {
      useGameStore.getState().setRoomState(null);
      useGameStore.getState().setRoomCode(null);
    }

    const token = useGameStore.getState().token;
    if (!token) {
      console.error("Cannot connect to WebSocket: Auth token not found.");
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsBaseUrl = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.hostname}:8000`;
    
    // Auto-fix URL scheme if accidentally configured with http/https
    wsBaseUrl = wsBaseUrl.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://');
    wsBaseUrl = wsBaseUrl.replace(/\/$/, ''); // Remove trailing slash if present

    const wsUrl = `${wsBaseUrl}/ws/${roomCode}?token=${token}`;
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      useGameStore.getState().setWsConnected(true);
      console.log("WebSocket connected successfully.");
      
      // Clear any existing intervals
      if (pingInterval) clearInterval(pingInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);

      // Keep-Alive Ping to prevent reverse proxy (Nginx/Render/Heroku) idle timeouts
      pingInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "PING" }));
        }
      }, 25000); // 25 seconds
    };

    socket.onclose = (event) => {
      if (pingInterval) clearInterval(pingInterval);
      useGameStore.getState().setWsConnected(false);
      console.log("WebSocket connection closed.", event.code, event.reason);
      
      // Explicit backend rejections
      if (event.code >= 4000 && event.code <= 4010) {
        window.location.href = '/';
        return;
      }

      // Auto-Reconnect if it wasn't a manual disconnect
      if (!isIntentionalDisconnect) {
        console.log("Attempting to reconnect in 3 seconds...");
        reconnectTimeout = setTimeout(() => {
          socketService.connect(roomCode);
        }, 3000);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;

        if (type === "ROOM_UPDATE") {
          console.log("ROOM UPDATE RECEIVED", data);
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
    isIntentionalDisconnect = true;
    if (pingInterval) clearInterval(pingInterval);
    if (reconnectTimeout) clearTimeout(reconnectTimeout);

    if (socket) {
      socket.close();
      socket = null;
    }
    useGameStore.getState().setWsConnected(false);
    useGameStore.getState().setRoomState(null);
    useGameStore.getState().setRoomCode(null);
  }
};
