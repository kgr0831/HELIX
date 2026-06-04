# test_nodes.py - 언어/어조 설정 → 프롬프트 지시문 변환 단위 테스트 (오프라인)

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.graph.nodes import _style_directive


def test_style_directive_default_is_empty():
    """기본값(ko/balanced)은 추가 지시문이 없어야 함"""
    assert _style_directive({"language": "ko", "tone": "balanced"}) == ""
    assert _style_directive({}) == ""


def test_style_directive_language():
    """언어 설정이 영어 지시문으로 반영되는지"""
    out = _style_directive({"language": "en", "tone": "balanced"})
    assert "English" in out


def test_style_directive_tone():
    """어조 설정(간결)이 지시문에 포함되는지"""
    out = _style_directive({"language": "ko", "tone": "concise"})
    assert "간결" in out


def test_style_directive_combined():
    """언어 + 어조가 모두 반영되는지"""
    out = _style_directive({"language": "en", "tone": "concise"})
    assert "English" in out and "간결" in out
