import { useGameStore } from '../store/gameStore';

const apiBaseUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;
const BASE_URL = `${apiBaseUrl}/api`;


async function request(endpoint: string, options: RequestInit = {}) {
  const token = useGameStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Network request failed.');
  }

  return response.json();
}

export const api = {
  /** Log in as guest player. */
  async guestLogin(username: string, avatarUrl: string) {
    const data = await request('/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ username, avatar_url: avatarUrl }),
    });
    // Save token and info to Zustand store
    useGameStore.getState().setAuth(
      data.token,
      data.player_id,
      data.username,
      data.avatar_url
    );
    return data;
  },

  /** Create a new room lobby. */
  async createRoom() {
    return request('/rooms', {
      method: 'POST',
    });
  },

  /** Join an existing room lobby. */
  async joinRoom(code: string) {
    return request(`/rooms/${code}/join`, {
      method: 'POST',
    });
  },

  /** Fetch active room status. */
  async getRoom(code: string) {
    return request(`/rooms/${code}`, {
      method: 'GET',
    });
  },

  /** Add an AI bot to the room lobby. */
  async addBot(code: string) {
    return request(`/rooms/${code}/bot`, {
      method: 'POST',
    });
  },

  /** Remove an AI bot from the room lobby. */
  async removeBot(code: string, botId: string) {
    return request(`/rooms/${code}/bot/${botId}`, {
      method: 'DELETE',
    });
  },

  /** Start the match. */
  async startGame(code: string) {
    return request(`/rooms/${code}/start`, {
      method: 'POST',
    });
  }
};
