# jwt.py - JWT 발급/검증 (기획서 15.2)
# Google 인증 성공 후 세션 토큰을 발급하고, 이후 요청에서 검증

import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from jose import JWTError, jwt

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "dev_jwt_secret_change_me")
ALGORITHM = "HS256"
TOKEN_TTL_DAYS = 7


def create_access_token(sub: str, email: str | None = None) -> str:
    """사용자 ID(sub)를 담은 access 토큰 발급"""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "email": email,
        "iat": now,
        "exp": now + timedelta(days=TOKEN_TTL_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    """토큰을 검증하고 payload를 반환. 실패 시 None"""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        return None
