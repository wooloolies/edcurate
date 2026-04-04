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
    ) -> list[ResourceCard]:
        """
        Search for educational resources.

        Args:
            query: The user's search query string.
            context: Classroom preset providing search context and filters.
            limit: Maximum number of results to return.

        Returns:
            List of normalised ResourceCard objects.
        """
        ...
