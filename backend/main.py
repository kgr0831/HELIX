# main.py - FastAPI 애플리케이션 진입점
# HELIX (Heterogeneous LLM Integrated eXchange) 백엔드 서버
# 실행: uvicorn backend.main:app --reload --port 8000

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import router

# FastAPI 앱 인스턴스 생성
app = FastAPI(title="HELIX", version="0.1.0")

# CORS 미들웨어 설정 - 프론트엔드(localhost:5173)에서의 요청을 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite 개발 서버 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록 (/api/health, /api/query 등)
app.include_router(router)
