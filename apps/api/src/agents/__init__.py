# Agents module — shared base and schemas for all Gemini-powered agents.

from src.agents.base import (
    DIMENSIONS,
    DIMENSIONS_SET,
    BaseAgent,
    format_teacher_context,
    get_gemini_client,
)

__all__ = [
    "DIMENSIONS",
    "DIMENSIONS_SET",
    "BaseAgent",
    "format_teacher_context",
    "get_gemini_client",
]
