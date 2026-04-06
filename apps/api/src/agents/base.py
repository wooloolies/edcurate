"""Shared base for Gemini-powered evaluation agents."""

import asyncio
import json
from abc import ABC, abstractmethod

from google import genai
from google.genai import types
from pydantic import BaseModel

from src.lib.config import settings
from src.lib.logging import get_logger
from src.presets.model import ClassroomPreset

logger = get_logger(__name__)

DIMENSIONS = (
    "curriculum_alignment",
    "pedagogical_quality",
    "reading_level",
    "bias_representation",
    "factual_accuracy",
    "source_credibility",
    "licensing_ip",
)

DIMENSIONS_SET = frozenset(DIMENSIONS)


def get_gemini_client() -> genai.Client:
    """Create a Vertex AI Gemini client using Application Default Credentials."""
    return genai.Client(
        vertexai=True,
        project=settings.GOOGLE_CLOUD_PROJECT,
        location="us-central1",
    )


def format_teacher_context(preset: ClassroomPreset) -> str:
    """Format a classroom preset into a standard teacher context block."""
    interests = ", ".join(preset.student_interests or [])
    return (
        f"- Subject: {preset.subject}\n"
        f"- Year Level: {preset.year_level}\n"
        f"- Curriculum: {preset.curriculum_framework or 'Not specified'}\n"
        f"- Country: {preset.country}\n"
        f"- Language: {preset.teaching_language}\n"
        f"- Student Interests: {interests or 'Not specified'}\n"
        f"- Class Size: {preset.class_size or 'Not specified'}\n"
        f"- EAL/D Students: {preset.eal_d_students or 0}"
    )


class BaseAgent[T: BaseModel](ABC):
    """Abstract base for Gemini-powered evaluation agents.

    Subclasses define:
    - model: which Gemini model to use
    - temperature: generation temperature
    - system_prompt: the system instruction
    - build_prompt(): formats the user prompt from inputs
    - parse_response(): validates the raw dict into a typed Pydantic model
    """

    model: str = "gemini-2.5-flash"
    temperature: float = 0.2
    max_retries: int = 2

    @property
    @abstractmethod
    def system_prompt(self) -> str: ...

    @abstractmethod
    def build_prompt(self, **kwargs: object) -> str:
        """Build the user prompt from agent-specific inputs."""
        ...

    @abstractmethod
    def parse_response(self, data: dict) -> T:
        """Validate raw Gemini JSON into a typed result.

        Raise ValueError if the data is irrecoverably malformed.
        """
        ...

    async def run(self, **kwargs: object) -> T | None:
        """Build prompt, call Gemini, parse response. Returns None on failure."""
        prompt = self.build_prompt(**kwargs)
        data = await self._call_gemini(prompt)
        if data is None:
            return None
        try:
            return self.parse_response(data)
        except (ValueError, KeyError) as e:
            logger.error("Agent response parsing failed", error=str(e))
            return None

    async def _call_gemini(self, user_prompt: str) -> dict | None:
        """Call Gemini with JSON mode and retry on parse failure."""
        client = get_gemini_client()

        for attempt in range(self.max_retries):
            try:
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=self.model,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=self.system_prompt,
                        temperature=self.temperature,
                        response_mime_type="application/json",
                    ),
                )

                raw_text = response.text
                if raw_text is None or not raw_text.strip():
                    raise ValueError("Gemini response did not include JSON text")

                data = json.loads(raw_text.strip())
                if not isinstance(data, dict):
                    raise ValueError("Gemini JSON root must be an object")
                return data

            except json.JSONDecodeError:
                logger.warning(
                    "Gemini returned invalid JSON",
                    attempt=attempt + 1,
                )
                if attempt < self.max_retries - 1:
                    continue
                return None
            except Exception as e:
                logger.error(
                    "Gemini call failed",
                    error=str(e),
                    attempt=attempt + 1,
                )
                return None

        return None
