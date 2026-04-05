"""Vertex AI embedding wrapper — text-embedding-004 via Vertex AI."""

import asyncio

from google import genai

from src.lib.config import settings
from src.lib.logging import get_logger

logger = get_logger(__name__)

_MODEL = "text-embedding-004"


def _get_client() -> genai.Client:
    """Create a Vertex AI client using Application Default Credentials."""
    return genai.Client(
        vertexai=True,
        project=settings.GOOGLE_CLOUD_PROJECT,
        location="us-central1",
    )


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a batch of texts using Vertex AI text-embedding-004.

    Uses Application Default Credentials (ADC) via GOOGLE_CLOUD_PROJECT.
    Run `gcloud auth application-default login` for local dev.

    Returns list of float vectors, one per input text.
    """
    if not texts:
        return []

    client = _get_client()

    try:
        result = await asyncio.to_thread(
            client.models.embed_content,
            model=_MODEL,
            contents=texts,
        )
        embeddings = result.embeddings or []
        vectors: list[list[float]] = []
        for embedding in embeddings:
            if embedding.values is None:
                raise ValueError("Embedding response did not include vector values")
            vectors.append(list(embedding.values))
        if len(vectors) != len(texts):
            raise ValueError("Embedding response count did not match request count")
        return vectors
    except Exception as e:
        logger.error("Embedding failed", error=str(e), batch_size=len(texts))
        raise


async def embed_single(text: str) -> list[float]:
    """Embed a single text string."""
    vectors = await embed_texts([text])
    return vectors[0]
