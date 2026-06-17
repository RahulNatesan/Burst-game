"""Terminal simulation test for the Burst card game engine.

Runs a full game from lobby setup to game over, simulating human choices
to run completely unattended and printing details of each round, trick, and score.
"""

import os
import sys
import random

# Add backend directory to path so imports work when running directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.engine.card import Card
from app.engine.player import Player
from app.engine.room import Room
from app.engine.game_state import GamePhase


def run_simulation():
    print("=" * 60)
    print("           BURST ENGINE TERMINAL SIMULATION")
    print("=" * 60)

    # 1. Setup Room
    room = Room(code="TEST69")
    print(f"Room created with code: {room.code}")

    # Add 1 human player (simulated)
    human = Player(id="human_1", name="Rahul (Simulated)", avatar_url="url_1", is_bot=False)
    room.add_player(human)
    print(f"Added human player: {human.name}")

    # Add 4 bot players
    bot_names = ["Viper 99", "Aria Flux", "Card King", "Luna 7"]
    for i, name in enumerate(bot_names):
        bot = room.add_bot(name=name, avatar_url=f"url_bot_{i}")
        print(f"Added bot: {bot.name} ({bot.id})")

    # Mark human as ready
    room.set_ready(human.id, True)
    print("Human player marked ready.")
    print(f"Everyone ready? {room.is_everyone_ready()}")

    # 2. Start Game
    print("\nStarting game...")
    game = room.start_game()
    print(f"Game started! Total rounds to play: {game.total_rounds}")

    round_count = 0

    # 3. Main Gameplay Loop
    while game.phase != GamePhase.GAME_OVER:
        # Check round change
        if game.phase == GamePhase.BIDDING and game.current_bidding.bids_collected == 0:
            round_count += 1
            print("\n" + "=" * 50)
            print(f" ROUND {game.current_round} / {game.total_rounds} | Cards to deal: {game.cards_in_current_round}")
            print("=" * 50)
            # Print players hands
            print("Dealt Hands:")
            for p in game.players:
                hand_str = ", ".join(str(c) for c in p.hand)
                print(f"  {p.name:18} : [{hand_str}]")
            print("-" * 50)

        # Handle Bidding
        if game.phase == GamePhase.BIDDING:
            active_player = game.players[game.active_player_index]
            if not active_player.is_bot:
                # Human player's turn to bid
                valid_bids = game.current_bidding.valid_bids()
                # Simulate human bidding: pick a bid (e.g., number of high cards/trumps, or random)
                # Let's count high cards and trumps
                hand = active_player.hand
                bid = sum(1 for c in hand if c.is_trump or c.rank >= 12)
                if bid not in valid_bids:
                    bid = random.choice(valid_bids)
                print(f"--> [HUMAN TURN] {active_player.name} bids: {bid} (Valid: {valid_bids})")
                game.submit_bid(active_player.id, bid)
            else:
                # Bots are handled automatically by game.handle_bot_turns()
                # But we can print the bids that were just made
                pass

        # If bidding just completed, print bids summary
        elif game.phase == GamePhase.PLAYING:
            # Check if this is the start of a new trick
            if len(game.current_trick.cards_played) == 0:
                # Print bids if first trick
                if game.tricks_played_in_round == 0:
                    print("\nBidding Complete:")
                    for p in game.players:
                        restricted_val = ""
                        if game.current_bidding.bidding_order[-1] == p.id:
                            restricted_val = " (Last Bidder)"
                        print(f"  {p.name:18} bid: {p.bid}{restricted_val}")
                    print(f"  Total Bids: {sum(p.bid for p in game.players)} vs Total Tricks: {game.cards_in_current_round}")
                    print("-" * 50)

                print(f"\nTrick {game.tricks_played_in_round + 1} lead by {game.players[game.lead_player_index].name}:")

            active_player = game.players[game.active_player_index]
            if not active_player.is_bot:
                # Human player's turn to play a card
                valid_cards = active_player.valid_plays(game.current_trick.lead_suit)
                # Simulated human play: choose a card
                # If we want to win, play highest, else lowest
                wants_to_win = (active_player.bid - active_player.tricks_won) > 0
                if wants_to_win:
                    card_to_play = max(valid_cards, key=lambda c: (c.is_trump, c.rank.value))
                else:
                    card_to_play = min(valid_cards, key=lambda c: (c.is_trump, c.rank.value))
                
                print(f"--> [HUMAN TURN] {active_player.name} plays: {card_to_play} (Valid options: {', '.join(str(c) for c in valid_cards)})")
                game.play_card(active_player.id, card_to_play)
            else:
                # Bot play is automated
                pass

        # Handle Trick End
        elif game.phase == GamePhase.TRICK_END:
            trick = game.current_trick
            print("\nTrick Cards on Table:")
            for pid, card in trick.cards_played.items():
                p = game.get_player(pid)
                print(f"  {p.name:18} played {card}")

            winner_id, winning_card = trick.determine_winner()
            winner = game.get_player(winner_id)
            print(f"** Winner: {winner.name} with {winning_card} **")
            
            # Advance game
            game.resolve_trick_and_continue()

        # Handle Round End
        elif game.phase == GamePhase.ROUND_END:
            print("\n" + "-" * 50)
            print(f"ROUND {game.current_round} RESULTS:")
            print("-" * 50)
            print(f"{'Player Name':18} | {'Bid':3} | {'Won':3} | {'Hit?':4} | {'Round Score':11} | {'Total Score':11}")
            for p in game.players:
                hit = "YES" if p.bid == p.tricks_won else "NO"
                print(f"{p.name:18} | {p.bid:3} | {p.tricks_won:3} | {hit:4} | {p.round_scores[-1]:11} | {p.total_score:11}")
            
            # Proceed
            game.start_next_round_or_end_game()

    # 4. Game Over Screen
    print("\n" + "=" * 60)
    print("                      GAME OVER")
    print("=" * 60)
    print(f"{'Final Standings':18} | {'Total Score':11}")
    print("-" * 60)
    sorted_players = sorted(game.players, key=lambda p: p.total_score, reverse=True)
    for p in sorted_players:
        is_winner = "🏆 WINNER" if p.id in game.winner_ids else ""
        print(f"{p.name:18} | {p.total_score:11} {is_winner}")
    print("=" * 60)


if __name__ == "__main__":
    run_simulation()
