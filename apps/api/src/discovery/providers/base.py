from abc import ABC, abstractmethod

from src.discovery.schemas import ResourceCard
from src.presets.model import ClassroomPreset


class SearchProvider(ABC):
    """Abstract base class for all search providers."""

    @abstractmethod
    async def search(
        self,
        query: str,
        context: ClassroomPreset,
        limit: int,
        queries: list[str] | None = None,
    ) -> list[ResourceCard]:
        """
        Search for educational resources.

        Args:
            query: The user's search query string.
            context: Classroom preset providing search context and filters.
            limit: Maximum number of results to return.
            queries: Optional agent-generated queries. When provided, the
                provider runs each query and merges/deduplicates results.
                When None, falls back to the provider's default query
                construction.

        Returns:
            List of normalised ResourceCard objects.
        """
        ...
