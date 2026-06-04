# routes.py - 인증 엔드포인트 (기획서 15.2)
# Google OAuth 2.0 Authorization Code Flow + JWT 쿠키 세션

import os

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import select

from backend.auth.jwt import create_access_token, decode_token
from backend.auth.oauth import oauth
from backend.db.database import async_session
from backend.db.models import User

router = APIRouter(prefix="/api/auth")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
COOKIE_NAME = "helix_token"
COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7일
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"  # 운영(HTTPS) 시 true


@router.get("/google/login")
async def google_login(request: Request):
    """Google 동의 화면으로 redirect"""
    return await oauth.google.authorize_redirect(request, REDIRECT_URI)


@router.get("/google/callback")
async def google_callback(request: Request):
    """Google이 돌려준 code를 토큰으로 교환 → 사용자 upsert → JWT 쿠키 발급"""
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=oauth")

    info = token.get("userinfo")
    if not info or not info.get("sub"):
        return RedirectResponse(f"{FRONTEND_URL}/login?error=userinfo")

    sub = info["sub"]
    email = info.get("email")
    name = info.get("name")
    picture = info.get("picture")

    # users 테이블 upsert (provider_user_id 기준)
    async with async_session() as session:
        result = await session.execute(select(User).where(User.provider_user_id == sub))
        user = result.scalar_one_or_none()
        if user is None:
            user = User(
                email=email, name=name, picture=picture,
                provider="google", provider_user_id=sub,
            )
            session.add(user)
        else:
            # 프로필 최신화
            user.email = email
            user.name = name
            user.picture = picture
        await session.commit()
        await session.refresh(user)
        uid = user.id

    jwt_token = create_access_token(sub=uid, email=email)
    resp = RedirectResponse(f"{FRONTEND_URL}/chat")
    resp.set_cookie(
        COOKIE_NAME, jwt_token,
        httponly=True, samesite="lax", secure=COOKIE_SECURE, path="/", max_age=COOKIE_MAX_AGE,
    )
    return resp


async def get_current_user(request: Request) -> User:
    """현재 사용자 인증. 쿠키 JWT(웹) 또는 Authorization: Bearer(API 키/JWT) 지원."""
    # 1) 웹 세션 쿠키 (JWT)
    token = request.cookies.get(COOKIE_NAME)
    if token:
        payload = decode_token(token)
        if payload:
            async with async_session() as session:
                user = await session.get(User, payload["sub"])
            if user is not None:
                return user

    # 2) Authorization: Bearer (API 키 'sk-helix-...' 또는 JWT)
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        raw = auth_header[7:].strip()
        if raw.startswith("sk-helix-"):
            from backend.services import apikey as apikey_service
            async with async_session() as session:
                user = await apikey_service.verify_key(session, raw)
            if user is not None:
                return user
        else:
            payload = decode_token(raw)
            if payload:
                async with async_session() as session:
                    user = await session.get(User, payload["sub"])
                if user is not None:
                    return user

    raise HTTPException(status_code=401, detail="not authenticated")


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    """현재 로그인 사용자 정보"""
    return {"id": user.id, "email": user.email, "name": user.name, "picture": user.picture}


@router.post("/logout")
async def logout():
    """세션 쿠키 제거"""
    resp = JSONResponse({"ok": True})
    resp.delete_cookie(COOKIE_NAME, path="/")
    return resp
