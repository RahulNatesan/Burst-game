"""Master state machine for the Burst card game.

Orchestrates rounds, tricks, bidding, and player turns, including
automatic triggers for bot actions.
"""

from __future__ import annotations

import uuid
from enum import Enum
from typing import Dict, List, Optional

from .card import Card, Deck
from .player import Player
from .bidding import BiddingRound
from .trick import Trick
from .scoring import calculate_score
from .bot_ai import BotAI


class GamePhase(str, Enum):
    """Phases of the game state machine."""
    LOBBY = "LOBBY"
    BIDDING = "BIDDING"
    PLAYING = "PLAYING"
    TRICK_END = "TRICK_END"
    ROUND_END = "ROUND_END"
    GAME_OVER = "GAME_OVER"


class GameState:
    """Manages the full state and lifecycle of a Burst game match."""

    def __init__(self, game_id: Optional[str] = None):
        self.game_id: str = game_id or str(uuid.uuid4())[:8]
        self.players: List[Player] = []
        self.phase: GamePhase = GamePhase.LOBBY
        self.deck: Deck = Deck()
        
        self.current_round: int = 0
        self.total_rounds: int = 0
        
        self.current_bidding: Optional[BiddingRound] = None
        self.current_trick: Optional[Trick] = None
        
        self.bidding_starter_index: int = 0
        self.active_player_index: int = 0
        self.lead_player_index: int = 0
        
        self.tricks_played_in_round: int = 0
        self.round_history: List[dict] = []
        self.winner_ids: List[str] = []

    @property
    def cards_in_current_round(self) -> int:
        """Number of cards dealt per player in the current round."""
        if self.current_round == 0:
            return 0
        return self.total_rounds - self.current_round + 1

    def get_player(self, player_id: str) -> Optional[Player]:
        """Find a player by their ID."""
        for p in self.players:
            if p.id == player_id:
                return p
        return None

    def add_player(self, player: Player) -> None:
        """Add a player to the lobby.

        Raises:
            ValueError: If game is not in LOBBY phase, or room is full.
        """
        if self.phase != GamePhase.LOBBY:
            raise ValueError("Cannot add players after game has started.")
        if len(self.players) >= 7:
            raise ValueError("Room is full. Maximum 7 players.")
        
        # Avoid duplicate player IDs
        if self.get_player(player.id) is not None:
            raise ValueError(f"Player with ID {player.id} is already in the game.")
            
        self.players.append(player)

    def remove_player(self, player_id: str) -> None:
        """Remove a player from the game.

        If in LOBBY, removes them completely.
        If in-game, marks them as disconnected.
        """
        player = self.get_player(player_id)
        if not player:
            return

        if self.phase == GamePhase.LOBBY:
            self.players.remove(player)
        else:
            player.is_connected = False

    def start_game(self) -> None:
        """Transition from LOBBY to the first round of gameplay.

        Raises:
            ValueError: If not in LOBBY phase, or player count is invalid (2-7).
        """
        if self.phase != GamePhase.LOBBY:
            raise ValueError("Game has already started.")
        if not (2 <= len(self.players) <= 7):
            raise ValueError(f"Need 2-7 players to start, got {len(self.players)}")

        # Calculate total rounds based on player count
        self.total_rounds = Deck.cards_per_player(len(self.players))
        self.current_round = 1
        self.round_history = []
        self.winner_ids = []
        
        # Choose a random player to start bidding in the first round
        # subsequent rounds will rotate the starter
        import random
        self.bidding_starter_index = random.randint(0, len(self.players) - 1)
        
        self._start_round()

    def _start_round(self) -> None:
        """Initialize a new round: reset players, deal cards, and start bidding."""
        cards = self.cards_in_current_round
        
        # Reset player hands and tricks won
        for p in self.players:
            p.reset_for_round()

        # Build and shuffle deck
        self.deck.reset_and_shuffle()

        # Deal cards
        for p in self.players:
            p.receive_cards(self.deck.deal(cards))

        # Determine bidding order starting from the rotated bidding starter
        bidding_order = []
        for i in range(len(self.players)):
            idx = (self.bidding_starter_index + i) % len(self.players)
            bidding_order.append(self.players[idx].id)

        # Initialize bidding round
        self.current_bidding = BiddingRound(
            total_tricks=cards,
            bidding_order=bidding_order
        )
        self.phase = GamePhase.BIDDING
        self.active_player_index = self.bidding_starter_index
        self.tricks_played_in_round = 0
        self.current_trick = None

        # Let bots take their turns automatically if any
        self.handle_bot_turns()

    def submit_bid(self, player_id: str, bid: int) -> None:
        """Submit a bid for a player.

        Args:
            player_id: ID of the bidding player.
            bid: Bid value.

        Raises:
            ValueError: If phase is not BIDDING, or action is out of turn.
        """
        if self.phase != GamePhase.BIDDING:
            raise ValueError("Not in bidding phase.")
        
        active_player = self.players[self.active_player_index]
        if active_player.id != player_id:
            raise ValueError(f"Not {player_id}'s turn to bid. Expected {active_player.name}.")

        # This will raise ValueError if bid is invalid or restricted
        self.current_bidding.submit_bid(player_id, bid)
        active_player.bid = bid

        # Check if bidding is complete
        if self.current_bidding.is_complete:
            self._start_playing_phase()
        else:
            # Advance to next bidder
            self.active_player_index = (self.active_player_index + 1) % len(self.players)
            self.handle_bot_turns()

    def _start_playing_phase(self) -> None:
        """Transition from bidding to trick-playing."""
        self.phase = GamePhase.PLAYING
        # The bidding starter also leads the first trick
        self.lead_player_index = self.bidding_starter_index
        self._start_trick()

    def _start_trick(self) -> None:
        """Initialize a new trick."""
        self.phase = GamePhase.PLAYING
        self.active_player_index = self.lead_player_index
        
        # Trick play order rotates clockwise from the lead player
        play_order = []
        for i in range(len(self.players)):
            idx = (self.lead_player_index + i) % len(self.players)
            play_order.append(self.players[idx].id)

        self.current_trick = Trick()
        self.current_trick.set_play_order(play_order)

        # Let bots take their turns automatically if any
        self.handle_bot_turns()

    def play_card(self, player_id: str, card: Card) -> None:
        """Record a player playing a card.

        Args:
            player_id: ID of the playing player.
            card: Card to play.

        Raises:
            ValueError: If phase is not PLAYING, or action is out of turn,
                        or card play violates game rules.
        """
        if self.phase != GamePhase.PLAYING:
            raise ValueError("Not in playing phase.")

        active_player = self.players[self.active_player_index]
        if active_player.id != player_id:
            raise ValueError(f"Not {player_id}'s turn to play. Expected {active_player.name}.")

        # Check that card is in player hand
        if card not in active_player.hand:
            raise ValueError(f"{active_player.name} does not hold card {card}.")

        # Check suit following rules
        if not active_player.can_play(card, self.current_trick.lead_suit):
            raise ValueError(
                f"Invalid play. Must follow lead suit ({self.current_trick.lead_suit.value}) if possible."
            )

        # Play card (removes from hand)
        active_player.play_card(card)
        self.current_trick.play_card(player_id, card)

        # Check if trick is complete
        if self.current_trick.is_complete:
            self.phase = GamePhase.TRICK_END
            # Determine trick winner
            winner_id, winning_card = self.current_trick.determine_winner()
            winner_player = self.get_player(winner_id)
            if winner_player:
                winner_player.win_trick()
                # Update lead player index for next trick
                self.lead_player_index = self.players.index(winner_player)
            self.tricks_played_in_round += 1
        else:
            # Advance to next player
            self.active_player_index = (self.active_player_index + 1) % len(self.players)
            self.handle_bot_turns()

    def resolve_trick_and_continue(self) -> None:
        """Confirm trick resolution and proceed to next trick or end the round.

        This is usually triggered after a brief delay on the client/socket layer
        to let players view the trick outcome.
        """
        if self.phase != GamePhase.TRICK_END:
            raise ValueError("Can only resolve trick when trick is complete (TRICK_END phase).")

        # If players still have cards in hand, start next trick
        if self.players[0].hand:  # All players have same hand count, check player 0
            self._start_trick()
        else:
            self._end_round()

    def _end_round(self) -> None:
        """Resolve the round, calculate scores, and set phase to ROUND_END."""
        self.phase = GamePhase.ROUND_END
        
        # Calculate scores earned this round
        scores_earned = {}
        for p in self.players:
            score = calculate_score(p.bid, p.tricks_won)
            scores_earned[p.id] = score
            p.total_score += score
            p.round_scores.append(score)

        # Record round in history
        self.round_history.append({
            "round": self.current_round,
            "cards": self.cards_in_current_round,
            "bids": {p.id: p.bid for p in self.players},
            "tricks_won": {p.id: p.tricks_won for p in self.players},
            "scores_earned": scores_earned,
            "cumulative_scores": {p.id: p.total_score for p in self.players}
        })

    def start_next_round_or_end_game(self) -> None:
        """Proceed to the next round, or conclude the game if it was the last round."""
        if self.phase != GamePhase.ROUND_END:
            raise ValueError("Can only advance when round is complete (ROUND_END phase).")

        if self.current_round < self.total_rounds:
            # Advance round and rotate bidding starter
            self.current_round += 1
            self.bidding_starter_index = (self.bidding_starter_index + 1) % len(self.players)
            self._start_round()
        else:
            self._end_game()

    def _end_game(self) -> None:
        """Conclude the game and compute the winners."""
        self.phase = GamePhase.GAME_OVER
        self.current_bidding = None
        self.current_trick = None
        
        # Determine winner(s)
        max_score = max(p.total_score for p in self.players)
        self.winner_ids = [p.id for p in self.players if p.total_score == max_score]

    def handle_bot_turns(self) -> None:
        """Automatically execute turns for bots in a loop until a human player's turn is reached."""
        while self.phase in (GamePhase.BIDDING, GamePhase.PLAYING):
            active_player = self.players[self.active_player_index]
            if not active_player.is_bot:
                break  # Stop, waiting for human input

            # Executing Bot Action
            if self.phase == GamePhase.BIDDING:
                valid_bids = self.current_bidding.valid_bids()
                bid = BotAI.decide_bid(active_player, self.cards_in_current_round, valid_bids)
                self.submit_bid(active_player.id, bid)
            elif self.phase == GamePhase.PLAYING:
                card = BotAI.decide_card(
                    active_player,
                    self.current_trick.lead_suit,
                    self.current_trick.cards_played,
                    len(self.players)
                )
                self.play_card(active_player.id, card)

    def to_dict(self, for_player_id: Optional[str] = None) -> dict:
        """Serialize the game state to a JSON-safe dictionary.

        Args:
            for_player_id: Optional player ID. If provided, other players' hands
                           are hidden to prevent client-side cheating.
        """
        # Serialize players (optionally hiding hands)
        serialized_players = []
        for p in self.players:
            hide_hand = (for_player_id is not None and p.id != for_player_id)
            serialized_players.append(p.to_dict(hide_hand=hide_hand))

        active_player = self.players[self.active_player_index] if self.players else None
        bidding_starter = self.players[self.bidding_starter_index] if self.players else None
        lead_player = self.players[self.lead_player_index] if self.players and self.phase in (GamePhase.PLAYING, GamePhase.TRICK_END) else None

        return {
            "game_id": self.game_id,
            "phase": self.phase.value,
            "players": serialized_players,
            "current_round": self.current_round,
            "total_rounds": self.total_rounds,
            "cards_in_round": self.cards_in_current_round,
            "active_player_id": active_player.id if active_player else None,
            "active_player_name": active_player.name if active_player else None,
            "bidding_starter_id": bidding_starter.id if bidding_starter else None,
            "lead_player_id": lead_player.id if lead_player else None,
            "current_bidding": self.current_bidding.to_dict() if self.current_bidding else None,
            "current_trick": self.current_trick.to_dict() if self.current_trick else None,
            "tricks_played_in_round": self.tricks_played_in_round,
            "round_history": self.round_history,
            "winner_ids": self.winner_ids,
        }

    def to_save_dict(self) -> dict:
        """Serialize the complete game state including private variables for persistence."""
        return {
            "game_id": self.game_id,
            "phase": self.phase.value,
            "players": [p.to_dict(hide_hand=False) for p in self.players],
            "current_round": self.current_round,
            "total_rounds": self.total_rounds,
            "deck_cards": [c.to_dict() for c in self.deck._cards],
            "bidding_starter_index": self.bidding_starter_index,
            "active_player_index": self.active_player_index,
            "lead_player_index": self.lead_player_index,
            "tricks_played_in_round": self.tricks_played_in_round,
            "round_history": self.round_history,
            "winner_ids": self.winner_ids,
            "current_bidding": self.current_bidding.to_dict() if self.current_bidding else None,
            "current_trick": self.current_trick.to_dict() if self.current_trick else None,
        }

    @classmethod
    def from_save_dict(cls, d: dict) -> GameState:
        """Recreate GameState from serialized complete representation."""
        from .card import Suit, Rank
        game = cls(game_id=d["game_id"])
        game.phase = GamePhase(d["phase"])
        game.players = [Player.from_dict(p) for p in d["players"]]
        game.current_round = d["current_round"]
        game.total_rounds = d["total_rounds"]
        
        # Restore deck cards
        game.deck = Deck()
        game.deck._cards = [
            Card(suit=Suit(c["suit"]), rank=Rank(c["rank"]))
            for c in d.get("deck_cards", [])
        ]
        
        game.bidding_starter_index = d["bidding_starter_index"]
        game.active_player_index = d["active_player_index"]
        game.lead_player_index = d["lead_player_index"]
        game.tricks_played_in_round = d["tricks_played_in_round"]
        game.round_history = d["round_history"]
        game.winner_ids = d["winner_ids"]
        
        if d.get("current_bidding"):
            game.current_bidding = BiddingRound.from_dict(d["current_bidding"])
        else:
            game.current_bidding = None
            
        if d.get("current_trick"):
            game.current_trick = Trick.from_dict(d["current_trick"])
        else:
            game.current_trick = None
            
        return game
