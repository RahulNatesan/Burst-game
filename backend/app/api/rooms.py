"""REST API endpoints for Room lobby management."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_current_player
from app.engine.room import Room
from app.engine.player import Player
from app.services.redis_service import redis_service
from app.database.session import get_db
from app.database.models import RoomModel

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("")
def create_room(current_player: dict = Depends(get_current_player), db: Session = Depends(get_db)):
    """Create a new game lobby. The creator becomes the host."""
    room = Room(host_id=current_player["player_id"])

    # Add host as the first player
    host = Player(
        id=current_player["player_id"],
        name=current_player["username"],
        avatar_url=current_player["avatar_url"],
        is_bot=False
    )
    room.add_player(host)

    # Cache the room state in Redis
    redis_service.save_room_state(room.code, room.to_save_dict())

    # Persist room in SQL DB (optional fallback handles connection issues)
    try:
        db_room = RoomModel(
            code=room.code,
            host_id=room.host_id,
            status="LOBBY"
        )
        db.add(db_room)
        db.commit()
    except Exception:
        db.rollback()  # Silent fail if DB service is offline, Redis is source of truth for active lobby

    return room.to_dict()


@router.get("/{code}")
def get_room(code: str, current_player: dict = Depends(get_current_player)):
    """Retrieve details of a specific room lobby by code."""
    code_upper = code.upper()
    state = redis_service.get_room_state(code_upper)
    if not state:
        raise HTTPException(status_code=404, detail="Room not found.")

    room = Room.from_save_dict(state)
    return room.to_dict()


@router.post("/{code}/join")
def join_room(code: str, current_player: dict = Depends(get_current_player)):
    """Join an existing room lobby."""
    code_upper = code.upper()
    state = redis_service.get_room_state(code_upper)
    if not state:
        raise HTTPException(status_code=404, detail="Room not found.")

    room = Room.from_save_dict(state)

    # If the game has already started, check if player is reconnecting
    if room.game:
        player = room.get_player(current_player["player_id"])
        if player:
            player.is_connected = True
            redis_service.save_room_state(room.code, room.to_save_dict())
            return room.to_dict()
        raise HTTPException(status_code=400, detail="Cannot join this room. Game is already in progress.")

    # Check if player is already in lobby, otherwise add them
    player = room.get_player(current_player["player_id"])
    if not player:
        new_player = Player(
            id=current_player["player_id"],
            name=current_player["username"],
            avatar_url=current_player["avatar_url"],
            is_bot=False
        )
        try:
            room.add_player(new_player)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    redis_service.save_room_state(room.code, room.to_save_dict())
    return room.to_dict()


@router.post("/{code}/bot")
async def add_bot_to_room(code: str, current_player: dict = Depends(get_current_player)):
    """Add an AI bot to the lobby. Only the host can perform this action."""
    code_upper = code.upper()
    state = redis_service.get_room_state(code_upper)
    if not state:
        raise HTTPException(status_code=404, detail="Room not found.")

    room = Room.from_save_dict(state)

    if room.host_id != current_player["player_id"]:
        raise HTTPException(status_code=403, detail="Only the room host can add bots.")
    if room.game:
        raise HTTPException(status_code=400, detail="Cannot add bots to an active game.")

    bot_names = ["Viper_99", "Aria_Flux", "CardKing", "Luna_7", "Ace_King", "Lucky_J"]
    bot_avatars = [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCby83oI4tck_gLxdndmcWKao-SaUtJ1BdDOwHUZaMQXglpXtZ1fqtc6fde3khK1WyVVVxrLUBBRSAJKNYCCIYadfTqIajXwuOAUbK2Cw8LcisjRanEv27s7SvOqSQz_ZbSn3fFNBy5na9_gzj93X24NhMH8i_eB17Oqcgy0GHbclqLLGWQEmpzrOoE1CCV4h_Hcgg8byOTzxZndSVBLsiLJN7asdDQKgoz7h_BZqU2pA-F0c3r-0_z1vlBKPXnpwxBnaQ-VIU3WCFq",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDUFyt1hchKLvy3teUXjD0ury1bpwORkFG9PlOXckMHQu1BuLXJAzc6IKiApFUkR43Fyzall7zWJiDc9XNez6_9Hn_96gx8rAOusmO3JxLWMounzePC58FjmkUI0cyT6PA3gaMmZpc7FIDHRuAqwGhQ3UAKtdyNAdTGhmidJFN39oB8NwskBNu3I-9p5lw1CzObrFeyeRLWA4gtJ-2tznOfxg3_SvnyuN6xA6qqXMKwZ3e1ZV6ecboZ_Xbv1jKw2kQW002T7YX8aJSU",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC-JklfANT-Z9BMvdJr9Kv1wEN4nE4dKCv94STFUBR243sLsLfjKwwIkEMURVWQayWGmHgsB7V_0sZbstx3_F_6bTNFIFVjEDArVsu6T02t8BbUEHtEGhxqgToc_ekTd0ZxP0TYtGIK1BRlHdj_aRgNb2nfRAVdXgjNjP6-GEB8n1bNhUR2T9H9J21xbhVM5o-OxCWZIpT62W5JG4B6Rm9-OskTyvkIypxDLY73qPa1Iw0iNgUNw-Yu6IskymYQyLbi47MqYZB0UJwP",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBayMwbTiPOzu-wwzpwQhiKEVy09cK48cEaLwYzsLnT2VTp6IVJFWHM6O3eK-P3blJ-Be2WxOWbj_HKxSqqC6tChYAJhBsFMqj4dpPWk60JtAC-W_yPNKb6BOA1PMNUdbGdDJ6CZqjHdidP0P_SYPcvAZ8QNMdaWZxfFsZXf5LUAX7dsSjjmDp9Ntw89vlFa9OlkAdEqTzQEyuYdTH2fZQvK5ziIpDPJhsIoVwf3a-9xXq6EvYWNC6AV73mcV_s-4caCu5Pir7s3vC0",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCs394ZHVhhVlPFvJoLP04axrkwT56yhfZQsWk2intKH1gVR7RaucsBlAKg7LK-8xyLJzP7pZPYmpvYQerB7y_dVjQPKGXv88fBhs4OnQwcK0cdLCRV7CFw9L3K37TMl9axmtf3Zw-3-6RmMkFl0dpqR3pRixnaSY5uvCfRYIW1EZiBwsbaLQnE5uDsFrVVj_cMvCr7FRlAgP-04-F62pnVCvLaqwScZUz7urpsKGk3lrw-sfiWIve3tQQt4-NGRwAY-pmQAUn-4LQh",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBM8S45GipDblpLeUtIM1yxMundt6RSd9DuB32kgYWBAnqxtz_qx4uhjAdQc6dyp1gKlDAaCDDJmdhvl2jnwf4yL_RWPd9bHEtTYfclwkgY1kM_iargkbJVeFfB7eSudnSDXYiuXriAxmMJxLKSkDVtkm9M7NhilXGDWhCEsEAHZxHFiq9bI7Yz98EyjqgVHtifFJN49dtfNHaRv9QYjq2pbEe1YgrfzE19SjVGM6V7Du_1wxJLv2CHb4hdrXDeMVaxq3opZLPvU0k0"
    ]

    # Find a bot name that isn't already used in this lobby
    current_names = {p.name for p in room.players}
    available_bots = [
        (name, avatar) for name, avatar in zip(bot_names, bot_avatars)
        if name not in current_names
    ]

    if not available_bots:
        raise HTTPException(status_code=400, detail="No more unique bots available.")

    bot_name, bot_avatar = available_bots[0]
    try:
        room.add_bot(name=bot_name, avatar_url=bot_avatar)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    redis_service.save_room_state(room.code, room.to_save_dict())
    
    # Broadcast updated room state to all WebSocket connections
    from app.websocket.manager import manager
    await manager.broadcast_room_state(room)

    return room.to_dict()


@router.delete("/{code}/bot/{bot_id}")
async def remove_bot_from_room(code: str, bot_id: str, current_player: dict = Depends(get_current_player)):
    """Remove a bot from the lobby. Only the host can perform this action."""
    code_upper = code.upper()
    state = redis_service.get_room_state(code_upper)
    if not state:
        raise HTTPException(status_code=404, detail="Room not found.")

    room = Room.from_save_dict(state)

    if room.host_id != current_player["player_id"]:
        raise HTTPException(status_code=403, detail="Only the room host can remove bots.")
    if room.game:
        raise HTTPException(status_code=400, detail="Cannot remove bots from an active game.")

    bot = room.get_player(bot_id)
    if not bot or not bot.is_bot:
        raise HTTPException(status_code=404, detail="Bot not found in lobby.")

    room.remove_player(bot_id)
    redis_service.save_room_state(room.code, room.to_save_dict())

    # Broadcast updated room state to all WebSocket connections
    from app.websocket.manager import manager
    await manager.broadcast_room_state(room)

    return room.to_dict()


@router.post("/{code}/start")
async def start_game(code: str, current_player: dict = Depends(get_current_player), db: Session = Depends(get_db)):
    """Transition lobby to game state and start round 1. Only the host can start."""
    code_upper = code.upper()
    state = redis_service.get_room_state(code_upper)
    if not state:
        raise HTTPException(status_code=404, detail="Room not found.")

    room = Room.from_save_dict(state)

    if room.host_id != current_player["player_id"]:
        raise HTTPException(status_code=403, detail="Only the host can start the game.")
    if room.game:
        raise HTTPException(status_code=400, detail="Game has already started.")

    try:
        room.start_game()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Update persistent database status
    try:
        db_room = db.query(RoomModel).filter(RoomModel.code == room.code).first()
        if db_room:
            db_room.status = "ACTIVE"
            db.commit()
    except Exception:
        db.rollback()

    redis_service.save_room_state(room.code, room.to_save_dict())

    # Broadcast updated room state to all WebSocket connections
    from app.websocket.manager import manager
    await manager.broadcast_room_state(room)

    return room.to_dict()
