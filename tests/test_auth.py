# test_auth.py - JWT 발급/검증 단위 테스트 (오프라인)

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.auth.jwt import create_access_token, decode_token


def test_jwt_roundtrip():
    """발급한 토큰을 디코드하면 sub/email이 보존되는지"""
    token = create_access_token(sub="user-123", email="a@b.com")
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["email"] == "a@b.com"


def test_jwt_invalid_token():
    """변조/엉뚱한 토큰은 None을 반환하는지"""
    assert decode_token("not-a-real-jwt") is None
    assert decode_token("") is None
