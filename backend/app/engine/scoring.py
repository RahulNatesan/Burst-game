"""Scoring logic for the Burst card game.

Only exact bid matches receive points.
Formula: Score = 10 + (11 * bid) if bid == tricks_won, else 0.
"""

from __future__ import annotations

from typing import List, Dict


def calculate_score(bid: int, tricks_won: int) -> int:
    """Calculate the score for a player in a round.

    Args:
        bid: The number of tricks the player bid.
        tricks_won: The number of tricks the player actually won.

    Returns:
        The score: 10 + (11 * bid) if exact match, 0 otherwise.

    Examples:
        >>> calculate_score(0, 0)
        10
        >>> calculate_score(1, 1)
        21
        >>> calculate_score(3, 3)
        43
        >>> calculate_score(5, 5)
        65
        >>> calculate_score(3, 2)
        0
        >>> calculate_score(0, 1)
        0
    """
    if bid == tricks_won:
        return 10 + (11 * bid)
    return 0


def calculate_round_scores(
    player_bids: Dict[str, int],
    player_tricks: Dict[str, int],
) -> Dict[str, int]:
    """Calculate scores for all players in a round.

    Args:
        player_bids: Map of player_id -> bid.
        player_tricks: Map of player_id -> tricks won.

    Returns:
        Map of player_id -> round score.
    """
    scores = {}
    for player_id, bid in player_bids.items():
        tricks_won = player_tricks.get(player_id, 0)
        scores[player_id] = calculate_score(bid, tricks_won)
    return scores


def is_hit(bid: int, tricks_won: int) -> bool:
    """Check if a player hit their bid exactly."""
    return bid == tricks_won


# Precomputed score table for quick reference
SCORE_TABLE = {bid: 10 + (11 * bid) for bid in range(0, 27)}
