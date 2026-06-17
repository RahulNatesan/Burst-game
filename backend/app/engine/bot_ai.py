"""Bot AI for the Burst card game.

Provides intelligent bidding and card-play heuristics for AI players.
The AI evaluates hand strength for bidding and uses strategic card
selection during play based on whether it needs more or fewer tricks.
"""

from __future__ import annotations

import random
from typing import List, Optional

from .card import Card, Suit, Rank
from .player import Player


class BotAI:
    """AI decision-making for bot players.

    The AI uses heuristics based on:
    - Trump card count and strength
    - Number of high cards (Aces, Kings, Queens)
    - Void suits (opportunities to cut with trumps)
    - Current bid deficit (tricks still needed)
    """

    @staticmethod
    def decide_bid(
        player: Player,
        total_tricks: int,
        valid_bids: List[int],
    ) -> int:
        """Decide how many tricks to bid.

        Evaluates each card's trick-winning potential:
        - Trump cards: Very likely to win (especially high-ranked)
        - Aces of non-trump: Usually win their trick
        - Kings of non-trump: Sometimes win
        - Other cards: Unlikely to win

        Args:
            player: The bot player with their dealt hand.
            total_tricks: Total tricks available this round.
            valid_bids: List of allowed bid values (last-bid restriction applied).

        Returns:
            The chosen bid value.
        """
        hand = player.hand
        expected_tricks = 0.0

        for card in hand:
            score = 0.0

            # Trump cards are highly valuable
            if card.is_trump:
                score += 0.6
                if card.rank >= Rank.JACK:
                    score += 0.3  # High trumps almost certainly win
                if card.rank == Rank.ACE:
                    score += 0.1  # Ace of trumps is king

            # High non-trump cards
            elif card.rank == Rank.ACE:
                score += 0.7  # Aces usually win unless cut
            elif card.rank == Rank.KING:
                score += 0.4
            elif card.rank == Rank.QUEEN:
                score += 0.2

            expected_tricks += score

        # Void suit bonus: Having no cards of a suit lets you cut
        suits_in_hand = set(c.suit for c in hand)
        non_trump_suits = {Suit.SPADES, Suit.DIAMONDS, Suit.CLUBS}
        void_count = len(non_trump_suits - suits_in_hand)
        trump_count = sum(1 for c in hand if c.is_trump)

        # Void + having trumps = can cut more often
        if void_count > 0 and trump_count > 0:
            expected_tricks += void_count * 0.3

        # Round to nearest integer
        bid = round(expected_tricks)

        # Add slight randomness for variety (±1 occasionally)
        rand = random.random()
        if rand < 0.12:
            bid = max(0, bid - 1)
        elif rand > 0.88:
            bid = min(total_tricks, bid + 1)

        # Clamp to valid range
        bid = max(0, min(total_tricks, bid))

        # Ensure bid is in the valid bids list (respects last-bid restriction)
        if bid not in valid_bids:
            # Pick the closest valid bid
            bid = min(valid_bids, key=lambda b: abs(b - bid))

        return bid

    @staticmethod
    def decide_card(
        player: Player,
        lead_suit: Optional[Suit],
        cards_on_table: dict,  # player_id -> Card
        total_players: int,
    ) -> Card:
        """Decide which card to play.

        Strategy:
        - If leading: Choose based on bid deficit.
        - If following: Try to win/lose based on need.
        - If can cut with trump: Strategic trump use.

        Args:
            player: The bot player.
            lead_suit: The suit led this trick, None if leading.
            cards_on_table: Cards already played by others.
            total_players: Total number of players.

        Returns:
            The chosen card to play.
        """
        valid_cards = player.valid_plays(lead_suit)

        if not valid_cards:
            # Shouldn't happen, but fallback
            return player.hand[0]

        if len(valid_cards) == 1:
            return valid_cards[0]

        bid_deficit = (player.bid or 0) - player.tricks_won
        wants_to_win = bid_deficit > 0

        # LEADING THE TRICK
        if lead_suit is None:
            return BotAI._lead_strategy(player, valid_cards, wants_to_win)

        # FOLLOWING SUIT
        has_lead_suit = player.has_suit(lead_suit)

        if has_lead_suit:
            lead_cards = [c for c in valid_cards if c.suit == lead_suit]
            return BotAI._follow_strategy(
                lead_cards, cards_on_table, lead_suit, wants_to_win
            )

        # CAN'T FOLLOW — can cut with trump or discard
        trump_cards = [c for c in valid_cards if c.is_trump]
        non_trump_cards = [c for c in valid_cards if not c.is_trump]

        if wants_to_win and trump_cards:
            # Cut with the lowest trump that still wins
            return BotAI._cut_strategy(trump_cards, cards_on_table)

        if non_trump_cards:
            # Discard the lowest non-trump card
            return min(non_trump_cards, key=lambda c: c.rank.value)

        # Only trumps available, play lowest
        return min(trump_cards, key=lambda c: c.rank.value)

    @staticmethod
    def _lead_strategy(
        player: Player, valid_cards: List[Card], wants_to_win: bool
    ) -> Card:
        """Strategy when leading a trick."""
        if wants_to_win:
            # Lead with strongest non-trump first (save trumps for cutting)
            non_trumps = [c for c in valid_cards if not c.is_trump]
            if non_trumps:
                # Lead highest non-trump
                return max(non_trumps, key=lambda c: c.rank.value)
            # Only trumps — lead highest
            return max(valid_cards, key=lambda c: c.rank.value)
        else:
            # Don't want more tricks — lead lowest card
            non_trumps = [c for c in valid_cards if not c.is_trump]
            if non_trumps:
                return min(non_trumps, key=lambda c: c.rank.value)
            return min(valid_cards, key=lambda c: c.rank.value)

    @staticmethod
    def _follow_strategy(
        lead_cards: List[Card],
        cards_on_table: dict,
        lead_suit: Suit,
        wants_to_win: bool,
    ) -> Card:
        """Strategy when following the lead suit."""
        if wants_to_win:
            # Play highest card of lead suit to try to win
            return max(lead_cards, key=lambda c: c.rank.value)
        else:
            # Play lowest card of lead suit to try to lose
            return min(lead_cards, key=lambda c: c.rank.value)

    @staticmethod
    def _cut_strategy(
        trump_cards: List[Card], cards_on_table: dict
    ) -> Card:
        """Strategy when cutting with a trump card."""
        # Check if someone already played a trump
        existing_trumps = [
            c for c in cards_on_table.values() if c.is_trump
        ]

        if existing_trumps:
            highest_existing = max(existing_trumps, key=lambda c: c.rank.value)
            # Play the lowest trump that beats the existing highest
            winning_trumps = [
                c for c in trump_cards
                if c.rank.value > highest_existing.rank.value
            ]
            if winning_trumps:
                return min(winning_trumps, key=lambda c: c.rank.value)
            # Can't beat existing trump, play lowest
            return min(trump_cards, key=lambda c: c.rank.value)

        # No existing trumps — play lowest trump to win cheaply
        return min(trump_cards, key=lambda c: c.rank.value)
