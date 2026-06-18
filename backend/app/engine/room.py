"""Room class for the Burst card game.

Manages player connections, guest ready status, bot players, and starts
the game state machine.
"""

from __future__ import annotations

import random
import string
from typing import Dict, List, Optional

from .player import Player
from .game_state import GameState


def generate_room_code() -> str:
    """Generate a random 6-character uppercase alphanumeric room code."""
    # Exclude confusing characters like O/0, I/1 if desired, but standard is fine
    choices = string.ascii_uppercase + string.digits
    return "".join(random.choices(choices, k=6))


class Room:
    """Represents a lobby/game room where players gather before a match."""

    def __init__(self, code: Optional[str] = None, host_id: Optional[str] = None):
        self.code: str = code or generate_room_code()
        self.players: List[Player] = []
        self.ready_states: Dict[str, bool] = {}  # player_id -> is_ready
        self.host_id: Optional[str] = host_id
        self.game: Optional[GameState] = None

    def get_player(self, player_id: str) -> Optional[Player]:
        """Find a player in the room by their ID."""
        for p in self.players:
            if p.id == player_id:
                return p
        return None

    def add_player(self, player: Player) -> None:
        """Add a player to the room lobby.

        Args:
            player: The player object to add.

        Raises:
            ValueError: If the room is full, or player is already in the room.
        """
        if len(self.players) >= 7:
            raise ValueError("Room is full. Maximum 7 players.")
        if self.get_player(player.id) is not None:
            raise ValueError(f"Player {player.name} is already in room {self.code}.")

        self.players.append(player)
        
        # Bots are automatically ready, humans start as not ready
        self.ready_states[player.id] = player.is_bot

        # Designate host if none exists
        if not self.host_id and not player.is_bot:
            self.host_id = player.id

    def remove_player(self, player_id: str) -> None:
        """Remove a player from the room.

        If the game has already started, this marks the player as disconnected.
        Otherwise, deletes them from the room lobby and updates the host.
        """
        player = self.get_player(player_id)
        if not player:
            return

        if self.game:
            # Game is active, delegate removal to GameState (disconnect player)
            self.game.remove_player(player_id)
        else:
            # Game has not started, remove player from lobby
            self.players.remove(player)
            if player_id in self.ready_states:
                del self.ready_states[player_id]

            # If host left, designate a new human player as host
            if self.host_id == player_id:
                human_players = [p for p in self.players if not p.is_bot]
                if human_players:
                    self.host_id = human_players[0].id
                else:
                    self.host_id = None

    def set_ready(self, player_id: str, is_ready: bool) -> None:
        """Set a player's ready state.

        Args:
            player_id: ID of the player.
            is_ready: Boolean ready status.

        Raises:
            ValueError: If player is not found.
        """
        player = self.get_player(player_id)
        if not player:
            raise ValueError(f"Player with ID {player_id} not found in this room.")
        if player.is_bot:
            return  # Bots are always ready

        self.ready_states[player_id] = is_ready

    def is_everyone_ready(self) -> bool:
        """Check if all players in the room are ready.

        Requires at least 2 players to start. Host is implicitly ready.
        """
        if len(self.players) < 2:
            return False
        return all(
            self.ready_states.get(p.id, False) or p.id == self.host_id or p.is_bot
            for p in self.players
        )

    def add_bot(self, name: str, avatar_url: str = "") -> Player:
        """Create and add a bot player to the room lobby."""
        if len(self.players) >= 7:
            raise ValueError("Room is full. Cannot add another bot.")
        
        bot = Player(
            name=name,
            avatar_url=avatar_url,
            is_bot=True
        )
        self.add_player(bot)
        return bot

    def start_game(self) -> GameState:
        """Initialize the game state and transition to playing phase.

        Raises:
            ValueError: If player count is insufficient or not everyone is ready.
        """
        if len(self.players) < 2:
            raise ValueError("Cannot start game with fewer than 2 players.")
        if not self.is_everyone_ready():
            raise ValueError("Cannot start game. Not all players are ready.")

        # Initialize game state
        self.game = GameState(game_id=self.code)
        
        # Add all room players to the game state
        for p in self.players:
            self.game.add_player(p)

        # Start the game
        self.game.start_game()
        return self.game

    def to_dict(self) -> dict:
        """Serialize the room state."""
        return {
            "code": self.code,
            "host_id": self.host_id,
            "players": [p.to_dict(hide_hand=True) for p in self.players],
            "ready_states": self.ready_states,
            "is_everyone_ready": self.is_everyone_ready(),
            "game_active": self.game is not None,
            "game_state": self.game.to_dict() if self.game else None
        }

    def to_save_dict(self) -> dict:
        """Serialize complete room state including full unmasked game state."""
        return {
            "code": self.code,
            "host_id": self.host_id,
            "players": [p.to_dict(hide_hand=False) for p in self.players],
            "ready_states": self.ready_states,
            "game_state": self.game.to_save_dict() if self.game else None
        }

    @classmethod
    def from_save_dict(cls, d: dict) -> Room:
        """Recreate Room from serialized save state."""
        room = cls(code=d["code"], host_id=d["host_id"])
        room.players = [Player.from_dict(p) for p in d.get("players", [])]
        room.ready_states = d.get("ready_states", {})
        if d.get("game_state"):
            room.game = GameState.from_save_dict(d["game_state"])
        else:
            room.game = None
        return room
