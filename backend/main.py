# main.py - FastAPI 애플리케이션 진입점
# HELIX (Heterogeneous LLM Integrated eXchange) 백엔드 서버
# 실행: uvicorn backend.main:app --reload --port 8000

import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from backend.api.routes import router
from backend.auth.routes import router as auth_router

load_dotenv()

logger = logging.getLogger("helix.security")

# 약한/기본 시크릿이면 부팅 시 경고 (운영 전 교체 유도) - Phase F
_WEAK_SECRETS = {
    "", "dev_jwt_secret_change_me", "dev_session_secret_change_me",
    "change_me_to_a_long_random_string", "change_me_too",
}
for _name in ("JWT_SECRET", "SESSION_SECRET"):
    _val = os.getenv(_name, "")
    if _val in _WEAK_SECRETS or len(_val) < 32:
        logger.warning("[보안] %s 가 약하거나 기본값입니다. 운영 전 강한 랜덤 값으로 교체하세요.", _name)

# FastAPI 앱 인스턴스 생성
app = FastAPI(title="HELIX", version="0.1.0")  # 앱 이름은 일단 HELIX로 정함. 나중에 멋있는 걸로 바꿔야지

# OAuth state/nonce 저장용 세션 (Authlib가 사용) - 기획서 15.2
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET", "dev_session_secret_change_me"))

# CORS - 허용 출처를 env로 관리 (기본: 로컬 프론트). 운영 시 ALLOWED_ORIGINS로 도메인 제한
_allowed_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록 (/api/health, /api/query 등)
app.include_router(router)  # 라우터 분리해서 관리하니까 깔끔하네
app.include_router(auth_router)  # /api/auth/* (Google OAuth)
# TODO: 미들웨어에 로깅 추가해서 API 호출 이력 남기기
