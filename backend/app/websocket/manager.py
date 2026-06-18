"""WebSocket connection manager for real-time Burst gameplay."""

import logging
from typing import Dict, Any

from fastapi import WebSocket
from app.engine.room import Room

logger = logging.getLogger("burst.websocket")


class ConnectionManager:
    """Manages active WebSockets and broadcasts player-customized states."""

    def __init__(self):
        # room_code -> { player_id -> WebSocket }
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, room_code: str, player_id: str, websocket: WebSocket) -> None:
        """Accept connection and register player socket in room."""
        await websocket.accept()
        if room_code not in self.active_connections:
            self.active_connections[room_code] = {}
        self.active_connections[room_code][player_id] = websocket
        logger.info(f"WebSocket connected: player {player_id} in room {room_code}")

    def disconnect(self, room_code: str, player_id: str, websocket: WebSocket) -> None:
        """De-register player socket from room on disconnect."""
        if room_code in self.active_connections:
            if player_id in self.active_connections[room_code]:
                if self.active_connections[room_code][player_id] == websocket:
                    del self.active_connections[room_code][player_id]
                    logger.info(f"WebSocket disconnected: player {player_id} from room {room_code}")
            if not self.active_connections[room_code]:
                del self.active_connections[room_code]

    def is_player_connected(self, room_code: str, player_id: str) -> bool:
        """Check if a player has an active WebSocket connection."""
        return room_code in self.active_connections and player_id in self.active_connections[room_code]

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket) -> None:
        """Send a JSON payload directly to a specific socket."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Failed to send personal WebSocket message: {e}")

    async def broadcast_room_state(self, room: Room) -> None:
        """Broadcast the room state to all connected players in the room.

        Dynamically hides other players' hands on a per-player basis.
        """
        room_code = room.code
        if room_code not in self.active_connections:
            return

        for player_id, ws in self.active_connections[room_code].items():
            # Build payload customized for this specific player (hiding other player hands)
            payload = {
                "code": room.code,
                "host_id": room.host_id,
                "players": [p.to_dict(hide_hand=True) for p in room.players],
                "ready_states": room.ready_states,
                "is_everyone_ready": room.is_everyone_ready(),
                "game_active": room.game is not None,
                "game_state": room.game.to_dict(for_player_id=player_id) if room.game else None
            }
            try:
                await ws.send_json({
                    "type": "ROOM_UPDATE",
                    "data": payload
                })
            except Exception as e:
                logger.error(f"Error broadcasting state to player {player_id} in room {room_code}: {e}")

    async def broadcast_chat_message(self, room_code: str, sender_name: str, message: str) -> None:
        """Broadcast chat message to all players in the room."""
        if room_code not in self.active_connections:
            return

        payload = {
            "type": "CHAT",
            "data": {
                "sender": sender_name,
                "message": message
            }
        }
        for player_id, ws in self.active_connections[room_code].items():
            try:
                await ws.send_json(payload)
            except Exception:
                pass


manager = ConnectionManager()
