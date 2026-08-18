from dataclasses import dataclass
from typing import Iterable

import models
from auth import decode_token
from database import SessionLocal


@dataclass(frozen=True)
class WebSocketPrincipal:
    user_id: int
    token_version: int


def authenticate_websocket_token(token: str | None) -> WebSocketPrincipal | None:
    if not token:
        return None

    payload = decode_token(token)
    user_id_raw = payload.get("sub")
    if not user_id_raw or payload.get("type") != "access":
        return None

    try:
        user_id = int(user_id_raw)
        token_version = int(payload.get("ver", 0))
    except (TypeError, ValueError):
        return None

    with SessionLocal() as db:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user or not user.is_active:
            return None
        current_version = user.token_version if user.token_version is not None else 0
        if token_version != current_version:
            return None

    return WebSocketPrincipal(user_id=user_id, token_version=token_version)


def load_websocket_session_states(user_ids: Iterable[int]) -> dict[int, tuple[bool, int]]:
    unique_ids = sorted(set(user_ids))
    if not unique_ids:
        return {}

    with SessionLocal() as db:
        users = db.query(models.User).filter(models.User.id.in_(unique_ids)).all()
        return {
            user.id: (
                bool(user.is_active),
                user.token_version if user.token_version is not None else 0,
            )
            for user in users
        }


def websocket_session_is_current(principal: WebSocketPrincipal) -> bool:
    state = load_websocket_session_states([principal.user_id]).get(principal.user_id)
    return bool(state and state == (True, principal.token_version))
