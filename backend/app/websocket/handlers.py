"""WebSocket route handlers for real-time Burst gameplay."""

import logging
import asyncio
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.api.auth import get_current_player_from_token
from app.websocket.manager import manager
from app.services.redis_service import redis_service
from app.engine.room import Room
from app.engine.game_state import GamePhase
from app.engine.card import Card, Suit, Rank

logger = logging.getLogger("burst.websocket")
router = APIRouter()


async def handle_game_transitions(room_code: str) -> None:
    """Asynchronous background worker to orchestrate game phase transitions.

    Waits at TRICK_END (2.5 seconds) and ROUND_END (5.0 seconds) to allow clients
    to view outcomes, then resolves state and broadcasts updates.
    """
    # Wait for client visibility delay
    state = redis_service.get_room_state(room_code)
    if not state:
        return
    room = Room.from_save_dict(state)
    game = room.game
    if not game:
        return

    if game.phase == GamePhase.TRICK_END:
        await asyncio.sleep(2.5)  # 2.5s delay to let players see played cards

        # Fetch fresh state after sleep to avoid write collisions
        state = redis_service.get_room_state(room_code)
        room = Room.from_save_dict(state)
        game = room.game
        if game and game.phase == GamePhase.TRICK_END:
            game.resolve_trick_and_continue()
            redis_service.save_room_state(room_code, room.to_save_dict())
            await manager.broadcast_room_state(room)
            
            # Recurse if the resolution immediately triggered bot actions leading to a new state
            if game.phase in (GamePhase.TRICK_END, GamePhase.ROUND_END):
                await handle_game_transitions(room_code)

    elif game.phase == GamePhase.ROUND_END:
        await asyncio.sleep(5.0)  # 5s delay for round summary overlay

        # Fetch fresh state after sleep
        state = redis_service.get_room_state(room_code)
        room = Room.from_save_dict(state)
        game = room.game
        if game and game.phase == GamePhase.ROUND_END:
            game.start_next_round_or_end_game()
            redis_service.save_room_state(room_code, room.to_save_dict())
            await manager.broadcast_room_state(room)
            
            # Recurse to handle initial round dealing & bot actions
            if game.phase in (GamePhase.TRICK_END, GamePhase.ROUND_END):
                await handle_game_transitions(room_code)


@router.websocket("/ws/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, token: str = Query(...)):
    """WebSocket endpoint to play a game of Burst in real-time."""
    room_code = room_code.upper()

    # 1. Authenticate Player from Token query parameter
    try:
        player_info = get_current_player_from_token(token)
        player_id = player_info["player_id"]
        username = player_info["username"]
    except Exception as e:
        logger.warning(f"WebSocket connection rejected. Token validation failed: {e}")
        await websocket.close(code=4001, reason="Invalid token")
        return

    # 2. Fetch Room
    state = redis_service.get_room_state(room_code)
    if not state:
        await websocket.close(code=4004, reason="Room lobby not found")
        return

    room = Room.from_save_dict(state)
    player = room.get_player(player_id)
    if not player:
        # Fallback: add player if room is in LOBBY phase
        if room.game:
            await websocket.close(code=4003, reason="Game in progress. Cannot join.")
            return

        from app.engine.player import Player
        player = Player(
            id=player_id,
            name=username,
            avatar_url=player_info["avatar_url"]
        )
        try:
            room.add_player(player)
        except Exception as e:
            await websocket.close(code=4000, reason=str(e))
            return

    # 3. Register WebSocket Connection
    await manager.connect(room_code, player_id, websocket)
    player.is_connected = True
    redis_service.save_room_state(room_code, room.to_save_dict())
    await manager.broadcast_room_state(room)

    try:
        while True:
            # Main receive loop
            data = await websocket.receive_json()
            msg_type = data.get("type")
            payload = data.get("data", {})

            # Fetch fresh state for concurrency safety
            state = redis_service.get_room_state(room_code)
            if not state:
                await websocket.send_json({"type": "ERROR", "message": "Room no longer exists."})
                continue
            room = Room.from_save_dict(state)

            if msg_type == "READY":
                is_ready = payload.get("ready", False)
                try:
                    room.set_ready(player_id, is_ready)
                    redis_service.save_room_state(room_code, room.to_save_dict())
                    await manager.broadcast_room_state(room)
                except ValueError as e:
                    await websocket.send_json({"type": "ERROR", "message": str(e)})

            elif msg_type == "SUBMIT_BID":
                bid = payload.get("bid")
                if bid is None:
                    await websocket.send_json({"type": "ERROR", "message": "Bid value is required."})
                    continue
                if not room.game:
                    await websocket.send_json({"type": "ERROR", "message": "Game has not started."})
                    continue

                try:
                    room.game.submit_bid(player_id, int(bid))
                    redis_service.save_room_state(room_code, room.to_save_dict())
                    await manager.broadcast_room_state(room)

                    # Trigger transitions if bots completed bidding or trick ended
                    if room.game.phase in (GamePhase.TRICK_END, GamePhase.ROUND_END):
                        asyncio.create_task(handle_game_transitions(room_code))
                except ValueError as e:
                    await websocket.send_json({"type": "ERROR", "message": str(e)})

            elif msg_type == "PLAY_CARD":
                card_data = payload.get("card")
                if not card_data:
                    await websocket.send_json({"type": "ERROR", "message": "Card data is required."})
                    continue
                if not room.game:
                    await websocket.send_json({"type": "ERROR", "message": "Game has not started."})
                    continue

                try:
                    card = Card(suit=Suit(card_data["suit"]), rank=Rank(card_data["rank"]))
                    room.game.play_card(player_id, card)
                    redis_service.save_room_state(room_code, room.to_save_dict())
                    await manager.broadcast_room_state(room)

                    # Trigger transitions if trick or round ended
                    if room.game.phase in (GamePhase.TRICK_END, GamePhase.ROUND_END):
                        asyncio.create_task(handle_game_transitions(room_code))
                except ValueError as e:
                    await websocket.send_json({"type": "ERROR", "message": str(e)})

            elif msg_type == "CHAT":
                message = payload.get("message", "").strip()
                if message:
                    await manager.broadcast_chat_message(room_code, username, message)

    except WebSocketDisconnect:
        manager.disconnect(room_code, player_id, websocket)
        
        # ONLY update room state and broadcast if the player actually doesn't have an active connection anymore
        if not manager.is_player_connected(room_code, player_id):
            # Fetch fresh state
            state = redis_service.get_room_state(room_code)
            if state:
                room = Room.from_save_dict(state)
                room.remove_player(player_id)
                redis_service.save_room_state(room_code, room.to_save_dict())
                await manager.broadcast_room_state(room)
