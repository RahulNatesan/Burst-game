"""Card and Deck classes for the Burst card game.

Standard 52-card deck with suits: Spades, Hearts, Diamonds, Clubs.
Hearts are always the trump suit.
Card ranking: A(14) > K(13) > Q(12) > J(11) > 10 > 9 > ... > 2
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from enum import IntEnum, Enum
from typing import List


class Suit(str, Enum):
    """Standard playing card suits."""
    SPADES = "SPADES"
    HEARTS = "HEARTS"
    DIAMONDS = "DIAMONDS"
    CLUBS = "CLUBS"

    @property
    def symbol(self) -> str:
        return {
            Suit.SPADES: "♠",
            Suit.HEARTS: "♥",
            Suit.DIAMONDS: "♦",
            Suit.CLUBS: "♣",
        }[self]

    @property
    def color(self) -> str:
        """Returns 'red' for Hearts/Diamonds, 'black' for Spades/Clubs."""
        return "red" if self in (Suit.HEARTS, Suit.DIAMONDS) else "black"

    @property
    def is_trump(self) -> bool:
        """Hearts are always the trump suit in Burst."""
        return self == Suit.HEARTS


class Rank(IntEnum):
    """Card ranks with numeric power values for comparison."""
    TWO = 2
    THREE = 3
    FOUR = 4
    FIVE = 5
    SIX = 6
    SEVEN = 7
    EIGHT = 8
    NINE = 9
    TEN = 10
    JACK = 11
    QUEEN = 12
    KING = 13
    ACE = 14

    @property
    def display(self) -> str:
        """Human-readable rank display."""
        special = {
            Rank.JACK: "J",
            Rank.QUEEN: "Q",
            Rank.KING: "K",
            Rank.ACE: "A",
        }
        return special.get(self, str(self.value))


@dataclass(frozen=True)
class Card:
    """An immutable playing card with a suit and rank.

    Cards are compared by rank within the same suit.
    Trump (Hearts) logic is handled by the Trick class.
    """
    suit: Suit
    rank: Rank

    @property
    def power(self) -> int:
        """Numeric power for comparison (rank value)."""
        return self.rank.value

    @property
    def is_trump(self) -> bool:
        """Whether this card is a trump card (Hearts)."""
        return self.suit.is_trump

    @property
    def short_code(self) -> str:
        """Short code like 'AH', '10S', 'KD', '2C'."""
        suit_letter = self.suit.value[0]  # S, H, D, C
        return f"{self.rank.display}{suit_letter}"

    def to_dict(self) -> dict:
        """Serialize to JSON-safe dict."""
        return {
            "suit": self.suit.value,
            "rank": self.rank.value,
            "display": self.rank.display,
            "short_code": self.short_code,
            "is_trump": self.is_trump,
            "color": self.suit.color,
            "symbol": self.suit.symbol,
        }

    def __str__(self) -> str:
        return f"{self.rank.display}{self.suit.symbol}"

    def __repr__(self) -> str:
        return f"Card({self.rank.display}{self.suit.symbol})"


class Deck:
    """A standard 52-card deck with shuffle and deal operations.

    Uses Fisher-Yates shuffle for uniform randomness.
    """

    def __init__(self):
        self._cards: List[Card] = []
        self._build()

    def _build(self) -> None:
        """Build a fresh 52-card deck."""
        self._cards = [
            Card(suit=suit, rank=rank)
            for suit in Suit
            for rank in Rank
        ]

    @property
    def remaining(self) -> int:
        """Number of cards remaining in the deck."""
        return len(self._cards)

    def shuffle(self) -> None:
        """Fisher-Yates shuffle for uniform randomness."""
        random.shuffle(self._cards)

    def deal(self, count: int) -> List[Card]:
        """Deal `count` cards from the top of the deck.

        Args:
            count: Number of cards to deal.

        Returns:
            List of dealt cards.

        Raises:
            ValueError: If not enough cards remain.
        """
        if count > len(self._cards):
            raise ValueError(
                f"Cannot deal {count} cards, only {len(self._cards)} remaining."
            )
        dealt = self._cards[:count]
        self._cards = self._cards[count:]
        return dealt

    def reset_and_shuffle(self) -> None:
        """Rebuild and shuffle the deck for a new round."""
        self._build()
        self.shuffle()

    @staticmethod
    def cards_per_player(num_players: int) -> int:
        """Calculate cards dealt to each player.

        Formula: floor(52 / num_players)

        Args:
            num_players: Number of players (2-7).

        Returns:
            Number of cards per player.
        """
        if not 2 <= num_players <= 7:
            raise ValueError(f"Need 2-7 players, got {num_players}")
        return 52 // num_players

    @staticmethod
    def discarded_cards(num_players: int) -> int:
        """Calculate number of cards discarded (not dealt).

        Formula: 52 mod num_players
        """
        if not 2 <= num_players <= 7:
            raise ValueError(f"Need 2-7 players, got {num_players}")
        return 52 % num_players

    @staticmethod
    def total_rounds(num_players: int) -> int:
        """Calculate total number of rounds in a game.

        Starts at floor(52/n) cards and decreases by 1 each round down to 1.
        Total rounds = floor(52/n)
        """
        return Deck.cards_per_player(num_players)
