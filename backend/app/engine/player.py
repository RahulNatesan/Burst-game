"""Player class for the Burst card game.

Tracks a player's hand, bid, tricks won, and cumulative score.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import List, Optional

from .card import Card, Suit


@dataclass
class Player:
    """Represents a player (human or bot) in the game.

    Attributes:
        id: Unique player identifier.
        name: Display name.
        avatar_url: URL to avatar image.
        is_bot: Whether this is an AI player.
        hand: Current cards in hand.
        bid: Number of tricks bid for current round.
        tricks_won: Number of tricks won in current round.
        total_score: Cumulative score across all rounds.
        is_connected: WebSocket connection status (humans only).
        round_scores: History of scores per round.
    """
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str = "Player"
    avatar_url: str = ""
    is_bot: bool = False
    hand: List[Card] = field(default_factory=list)
    bid: Optional[int] = None
    tricks_won: int = 0
    total_score: int = 0
    is_connected: bool = True
    round_scores: List[int] = field(default_factory=list)

    def receive_cards(self, cards: List[Card]) -> None:
        """Receive dealt cards and sort them by suit then rank."""
        self.hand = sorted(cards, key=lambda c: (c.suit.value, c.rank.value))

    def has_suit(self, suit: Suit) -> bool:
        """Check if the player has any card of the given suit."""
        return any(c.suit == suit for c in self.hand)

    def cards_of_suit(self, suit: Suit) -> List[Card]:
        """Return all cards of a specific suit from hand."""
        return [c for c in self.hand if c.suit == suit]

    def play_card(self, card: Card) -> Card:
        """Remove and return a card from hand.

        Args:
            card: The card to play.

        Returns:
            The played card.

        Raises:
            ValueError: If card is not in hand.
        """
        if card not in self.hand:
            raise ValueError(f"{self.name} does not have {card} in hand.")
        self.hand.remove(card)
        return card

    def can_play(self, card: Card, lead_suit: Optional[Suit]) -> bool:
        """Check if playing this card is legal.

        Rules:
        - If no lead suit (you're leading), any card is valid.
        - If you have the lead suit, you MUST play it.
        - If you don't have the lead suit, any card is valid.
        """
        if lead_suit is None:
            return True  # Leading the trick, any card
        if card.suit == lead_suit:
            return True  # Following suit
        # Only valid if player has NO cards of lead suit
        return not self.has_suit(lead_suit)

    def valid_plays(self, lead_suit: Optional[Suit]) -> List[Card]:
        """Return all legal cards the player can play."""
        return [c for c in self.hand if self.can_play(c, lead_suit)]

    def reset_for_round(self) -> None:
        """Reset per-round state (hand, bid, tricks)."""
        self.hand = []
        self.bid = None
        self.tricks_won = 0

    def win_trick(self) -> None:
        """Record winning a trick."""
        self.tricks_won += 1

    def to_dict(self, hide_hand: bool = False) -> dict:
        """Serialize player state to JSON-safe dict.

        Args:
            hide_hand: If True, hand is hidden (for other players' view).
        """
        return {
            "id": self.id,
            "name": self.name,
            "avatar_url": self.avatar_url,
            "is_bot": self.is_bot,
            "hand": [c.to_dict() for c in self.hand] if not hide_hand else [],
            "hand_count": len(self.hand),
            "bid": self.bid,
            "tricks_won": self.tricks_won,
            "total_score": self.total_score,
            "is_connected": self.is_connected,
            "round_scores": self.round_scores,
        }

    @classmethod
    def from_dict(cls, d: dict) -> Player:
        """Recreate Player instance from serialized state."""
        from .card import Rank
        hand = [Card(suit=Suit(c["suit"]), rank=Rank(c["rank"])) for c in d.get("hand", [])]
        return cls(
            id=d["id"],
            name=d["name"],
            avatar_url=d.get("avatar_url", ""),
            is_bot=d.get("is_bot", False),
            hand=hand,
            bid=d.get("bid"),
            tricks_won=d.get("tricks_won", 0),
            total_score=d.get("total_score", 0),
            is_connected=d.get("is_connected", True),
            round_scores=d.get("round_scores", [])
        )

    def __str__(self) -> str:
        return f"{self.name} (Score: {self.total_score}, Bid: {self.bid}, Won: {self.tricks_won})"
