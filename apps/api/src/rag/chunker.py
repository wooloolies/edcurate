"""Semantic chunker — splits text into token-bounded chunks."""

from dataclasses import dataclass

import tiktoken

_ENCODER = tiktoken.get_encoding("cl100k_base")
_MIN_CHUNK_TOKENS = 100
_TARGET_CHUNK_TOKENS = 400
_MAX_CHUNK_TOKENS = 500
_OVERLAP_TOKENS = 50


@dataclass
class Chunk:
    """A single text chunk with metadata."""

    text: str
    index: int
    heading: str
    token_count: int


def chunk_text(
    text: str,
    heading: str = "",
    max_chunks: int = 20,
) -> list[Chunk]:
    """
    Split text into semantic chunks of 300-500 tokens.

    Strategy:
    - Split on paragraph boundaries (double newline)
    - Merge small paragraphs until target size reached
    - Never split mid-sentence
    - 50-token overlap between adjacent chunks
    """
    if not text.strip():
        return []

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        return []

    chunks: list[Chunk] = []
    current_text = ""
    current_tokens = 0

    for para in paragraphs:
        para_tokens = len(_ENCODER.encode(para))

        # If adding this paragraph exceeds max, finalize current chunk
        if current_tokens + para_tokens > _MAX_CHUNK_TOKENS and current_text:
            chunks.append(
                Chunk(
                    text=current_text.strip(),
                    index=len(chunks),
                    heading=heading,
                    token_count=current_tokens,
                )
            )
            if len(chunks) >= max_chunks:
                break

            # Overlap: take last ~50 tokens worth of text
            overlap = _get_overlap_text(current_text)
            current_text = overlap + "\n\n" + para
            current_tokens = len(_ENCODER.encode(current_text))
        else:
            if current_text:
                current_text += "\n\n" + para
            else:
                current_text = para
            current_tokens += para_tokens

    # Don't forget the last chunk
    if current_text.strip() and len(chunks) < max_chunks:
        chunks.append(
            Chunk(
                text=current_text.strip(),
                index=len(chunks),
                heading=heading,
                token_count=len(_ENCODER.encode(current_text)),
            )
        )

    return chunks


def _get_overlap_text(text: str) -> str:
    """Get approximately the last OVERLAP_TOKENS tokens of text."""
    sentences = text.replace("\n", " ").split(". ")
    overlap = ""
    for sentence in reversed(sentences):
        candidate = sentence + ". " + overlap if overlap else sentence
        if len(_ENCODER.encode(candidate)) > _OVERLAP_TOKENS:
            break
        overlap = candidate
    return overlap.strip()
