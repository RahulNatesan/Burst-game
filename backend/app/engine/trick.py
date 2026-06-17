"""Trick resolution for the Burst card game.

Handles lead suit tracking, trump logic, and trick winner determination.

Rules:
1. First card played sets the lead suit.
2. All players with the lead suit MUST follow it.
3. If a player has no lead suit, they may play a Heart (trump) to cut.
4. Any Heart beats any non-Heart card.
5. Among multiple Hearts, the highest rank wins.
6. A non-lead, non-trump card cannot win (discard).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from .card import Card, Suit
from .player import Player


@dataclass
class PlayedCard:
    """A card played by a specific player in a trick."""
    player_id: str
    card: Card
    play_order: int  # 0 = lead, 1 = second, etc.


@dataclass
class Trick:
    """Represents a single trick (one card from each player).

    The trick tracks the lead suit, all played cards, and determines
    the winner based on Burst's trump rules.
    """
    play_order: List[str] = field(default_factory=list)  # Player IDs in play order
    cards_played: Dict[str, Card] = field(default_factory=dict)  # player_id -> Card
    lead_suit: Optional[Suit] = None

    @property
    def is_complete(self) -> bool:
        """Whether all expected players have played."""
        return (
            len(self.play_order) > 0
            and len(self.cards_played) == len(self.play_order)
        )

    @property
    def cards_on_table(self) -> int:
        """Number of cards played so far."""
        return len(self.cards_played)

    def set_play_order(self, player_ids: List[str]) -> None:
        """Set the expected order of play for this trick.

        Args:
            player_ids: List of player IDs in the order they should play.
        """
        self.play_order = player_ids

    def play_card(self, player_id: str, card: Card) -> None:
        """Record a card played by a player.

        The first card played sets the lead suit.

        Args:
            player_id: ID of the player playing the card.
            card: The card being played.

        Raises:
            ValueError: If player already played, or it's not their turn.
        """
        if player_id in self.cards_played:
            raise ValueError(f"Player {player_id} already played in this trick.")

        expected_index = len(self.cards_played)
        if expected_index >= len(self.play_order):
            raise ValueError("All players have already played.")
        if self.play_order[expected_index] != player_id:
            raise ValueError(
                f"Not {player_id}'s turn. Expected {self.play_order[expected_index]}."
            )

        # First card sets the lead suit
        if not self.cards_played:
            self.lead_suit = card.suit

        self.cards_played[player_id] = card

    def determine_winner(self) -> Tuple[str, Card]:
        """Determine the winner of this trick.

        Winner logic:
        1. If any Hearts (trump) were played, the highest Heart wins.
        2. Otherwise, the highest card matching the lead suit wins.
        3. Cards that don't match lead suit AND aren't trump cannot win.

        Returns:
            Tuple of (winner_player_id, winning_card).

        Raises:
            ValueError: If trick is not complete.
        """
        if not self.is_complete:
            raise ValueError(
                f"Trick not complete: {len(self.cards_played)}/{len(self.play_order)} cards played."
            )

        # Start with the lead player as default winner
        winner_id = self.play_order[0]
        winner_card = self.cards_played[winner_id]

        for player_id in self.play_order[1:]:
            challenger_card = self.cards_played[player_id]

            if _beats(challenger_card, winner_card, self.lead_suit):
                winner_id = player_id
                winner_card = challenger_card

        return winner_id, winner_card

    def get_played_cards_ordered(self) -> List[PlayedCard]:
        """Return played cards in order of play."""
        result = []
        for i, pid in enumerate(self.play_order):
            if pid in self.cards_played:
                result.append(PlayedCard(
                    player_id=pid,
                    card=self.cards_played[pid],
                    play_order=i,
                ))
        return result

    def to_dict(self) -> dict:
        """Serialize trick state."""
        return {
            "lead_suit": self.lead_suit.value if self.lead_suit else None,
            "cards_played": {
                pid: card.to_dict()
                for pid, card in self.cards_played.items()
            },
            "play_order": self.play_order,
            "is_complete": self.is_complete,
        }

    @classmethod
    def from_dict(cls, d: dict) -> Trick:
        """Recreate Trick instance from serialized state."""
        from .card import Rank
        lead_suit = Suit(d["lead_suit"]) if d.get("lead_suit") else None
        cards_played = {}
        for pid, card_data in d.get("cards_played", {}).items():
            cards_played[pid] = Card(
                suit=Suit(card_data["suit"]),
                rank=Rank(card_data["rank"])
            )
        return cls(
            play_order=d.get("play_order", []),
            cards_played=cards_played,
            lead_suit=lead_suit
        )


def _beats(challenger: Card, current_best: Card, lead_suit: Suit) -> bool:
    """Determine if challenger card beats the current best card.

    Rules:
    - Trump (Hearts) beats any non-trump.
    - Higher trump beats lower trump.
    - Higher lead-suit card beats lower lead-suit card.
    - Non-lead, non-trump cards never win.
    """
    # Case 1: Challenger is trump, current best is not
    if challenger.is_trump and not current_best.is_trump:
        return True

    # Case 2: Current best is trump, challenger is not
    if current_best.is_trump and not challenger.is_trump:
        return False

    # Case 3: Both are trump — highest rank wins
    if challenger.is_trump and current_best.is_trump:
        return challenger.rank > current_best.rank

    # Case 4: Neither is trump
    # Only lead-suit cards can win
    if challenger.suit == lead_suit and current_best.suit == lead_suit:
        return challenger.rank > current_best.rank

    # Challenger matches lead suit, current doesn't
    if challenger.suit == lead_suit:
        return True

    # Challenger doesn't match lead suit — cannot beat
    return False
