# base.py - 모든 Agent의 공통 추상 클래스 정의
# Gateway API를 통해 이기종 LLM을 통합 호출하는 기반 구조

import os
import re
import time
from abc import ABC, abstractmethod

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel

from backend.utils.token_counter import count_tokens

# .env 파일에서 Gateway API 키와 Base URL을 로드
load_dotenv()

GATEWAY_API_KEY = os.getenv("GATEWAY_API_KEY", "")
GATEWAY_BASE_URL = os.getenv("GATEWAY_BASE_URL", "")


class AgentResponse(BaseModel):
    """Agent 응답 데이터 모델 - 응답 내용, 토큰 수, 지연시간을 포함"""
    agent_name: str   # Agent 이름 (Leader, Researcher 등)
    role: str         # Agent 역할 식별자
    content: str      # LLM 응답 내용
    token_count: int  # tiktoken 기반 토큰 수 (API 값 미사용)
    latency_ms: float # 응답 지연시간 (밀리초)


class BaseAgent(ABC):
    """Agent 추상 클래스 - 모든 Agent가 이 클래스를 상속하여 구현"""
    name: str
    role: str
    model_name: str
    system_prompt: str

    def __init__(self, name: str, role: str, model_name: str, system_prompt: str):
        self.name = name
        self.role = role
        self.model_name = model_name
        self.system_prompt = system_prompt
        # OpenAI SDK 호환 Gateway를 통해 다양한 provider의 모델을 통합 호출
        self.llm = ChatOpenAI(
            model=model_name,
            api_key=GATEWAY_API_KEY,
            base_url=GATEWAY_BASE_URL,
        )

    async def generate(self, prompt: str, max_tokens: int = 2000) -> AgentResponse:
        """프롬프트를 LLM에 전송하고, 응답을 AgentResponse로 반환"""
        start = time.perf_counter()  # 지연시간 측정 시작
        messages = [
            SystemMessage(content=self.system_prompt),  # 역할별 시스템 프롬프트
            HumanMessage(content=prompt),               # 사용자 질문/지시
        ]
        response = await self.llm.ainvoke(messages, max_tokens=max_tokens)
        content = response.content
        # Sonar 모델의 <think>...</think> 태그 제거
        content = re.sub(r"<think>[\s\S]*?</think>", "", content).strip()
        # tiktoken으로 직접 토큰 수 측정 (Tran & Kiela 논문 방법론 준수)
        token_count = count_tokens(content)
        latency_ms = (time.perf_counter() - start) * 1000
        return AgentResponse(
            agent_name=self.name,
            role=self.role,
            content=content,
            token_count=token_count,
            latency_ms=latency_ms,
        )
