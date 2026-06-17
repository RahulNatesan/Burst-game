"""Bidding logic for the Burst card game.

Handles bid collection, validation, and the critical last-bidder restriction:
The total of all bids CANNOT equal the total number of tricks available.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

from .player import Player


@dataclass
class BiddingRound:
    """Manages the bidding phase for a single round.

    Attributes:
        total_tricks: Number of tricks available this round (= cards per player).
        bidding_order: Player IDs in the order they bid.
        bids: Recorded bids (player_id -> bid value).
    """
    total_tricks: int
    bidding_order: List[str] = field(default_factory=list)
    bids: Dict[str, int] = field(default_factory=dict)

    @property
    def bids_collected(self) -> int:
        """Number of bids already submitted."""
        return len(self.bids)

    @property
    def is_complete(self) -> bool:
        """Whether all players have bid."""
        return len(self.bids) == len(self.bidding_order)

    @property
    def current_bidder_id(self) -> Optional[str]:
        """ID of the player whose turn it is to bid, or None if complete."""
        if self.is_complete:
            return None
        return self.bidding_order[len(self.bids)]

    @property
    def is_last_bidder(self) -> bool:
        """Whether the current bidder is the last to bid."""
        return len(self.bids) == len(self.bidding_order) - 1

    @property
    def current_bid_sum(self) -> int:
        """Sum of all bids placed so far."""
        return sum(self.bids.values())

    def restricted_bid(self) -> Optional[int]:
        """Return the bid value that the last bidder CANNOT choose.

        Only applies to the last bidder. The restricted value is:
            total_tricks - sum(all_previous_bids)

        This prevents the total bids from equaling the total tricks.

        Returns:
            The forbidden bid value, or None if not the last bidder
            or if the restricted value is out of valid range.
        """
        if not self.is_last_bidder:
            return None

        restricted = self.total_tricks - self.current_bid_sum

        # Only restrict if the value is actually in the valid range
        if 0 <= restricted <= self.total_tricks:
            return restricted
        return None

    def valid_bids(self) -> List[int]:
        """Return all valid bid values for the current bidder.

        Values range from 0 to total_tricks, minus the restricted value
        for the last bidder.
        """
        all_bids = list(range(0, self.total_tricks + 1))
        restricted = self.restricted_bid()
        if restricted is not None:
            all_bids = [b for b in all_bids if b != restricted]
        return all_bids

    def submit_bid(self, player_id: str, bid: int) -> None:
        """Submit a bid for a player.

        Args:
            player_id: The bidding player's ID.
            bid: The bid value.

        Raises:
            ValueError: If it's not this player's turn, bid is invalid,
                        or bid violates the last-bidder restriction.
        """
        if player_id in self.bids:
            raise ValueError(f"Player {player_id} has already bid.")

        if self.current_bidder_id != player_id:
            raise ValueError(
                f"Not {player_id}'s turn to bid. "
                f"Expected {self.current_bidder_id}."
            )

        if not (0 <= bid <= self.total_tricks):
            raise ValueError(
                f"Bid must be between 0 and {self.total_tricks}, got {bid}."
            )

        # Enforce last-bidder restriction
        restricted = self.restricted_bid()
        if restricted is not None and bid == restricted:
            raise ValueError(
                f"Last bidder cannot bid {bid}. "
                f"Total bids ({self.current_bid_sum} + {bid} = "
                f"{self.current_bid_sum + bid}) cannot equal "
                f"total tricks ({self.total_tricks})."
            )

        self.bids[player_id] = bid

    def get_bid(self, player_id: str) -> Optional[int]:
        """Get a player's bid, or None if they haven't bid yet."""
        return self.bids.get(player_id)

    def to_dict(self) -> dict:
        """Serialize bidding state."""
        return {
            "total_tricks": self.total_tricks,
            "bidding_order": self.bidding_order,
            "bids": self.bids,
            "current_bidder": self.current_bidder_id,
            "is_last_bidder": self.is_last_bidder,
            "restricted_bid": self.restricted_bid(),
            "valid_bids": self.valid_bids(),
            "is_complete": self.is_complete,
        }

    @classmethod
    def from_dict(cls, d: dict) -> BiddingRound:
        """Recreate BiddingRound instance from serialized state."""
        br = cls(
            total_tricks=d["total_tricks"],
            bidding_order=d["bidding_order"]
        )
        br.bids = {k: int(v) for k, v in d.get("bids", {}).items()}
        return br
