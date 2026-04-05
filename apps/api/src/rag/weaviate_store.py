"""Weaviate vector store — upsert and query resource chunks."""

import uuid

import weaviate
from weaviate.classes.config import Configure, DataType, Property
from weaviate.classes.query import Filter, MetadataQuery

from src.lib.config import settings
from src.lib.logging import get_logger
from src.rag.chunker import Chunk

logger = get_logger(__name__)

_COLLECTION_NAME = "ResourceChunk"


def _get_client() -> weaviate.WeaviateClient:
    """Create a Weaviate client connection."""
    url = settings.WEAVIATE_URL or "http://localhost:8080"
    api_key = settings.WEAVIATE_API_KEY

    if api_key:
        return weaviate.connect_to_custom(
            http_host=url.replace("http://", "").replace("https://", "").split(":")[0],
            http_port=int(url.split(":")[-1]) if ":" in url.split("//")[-1] else 8080,
            http_secure=url.startswith("https"),
            grpc_host=url.replace("http://", "").replace("https://", "").split(":")[0],
            grpc_port=50051,
            grpc_secure=url.startswith("https"),
            auth_credentials=weaviate.auth.AuthApiKey(api_key),
        )
    return weaviate.connect_to_local(
        host=url.replace("http://", "").replace("https://", "").split(":")[0],
        port=int(url.split(":")[-1]) if ":" in url.split("//")[-1] else 8080,
    )


def ensure_collection() -> None:
    """Create the ResourceChunk collection if it doesn't exist."""
    client = _get_client()
    try:
        if not client.collections.exists(_COLLECTION_NAME):
            client.collections.create(
                name=_COLLECTION_NAME,
                vectorizer_config=Configure.Vectorizer.none(),
                properties=[
                    Property(
                        name="resource_url",
                        data_type=DataType.TEXT,
                    ),
                    Property(
                        name="chunk_text",
                        data_type=DataType.TEXT,
                    ),
                    Property(
                        name="chunk_index",
                        data_type=DataType.INT,
                    ),
                    Property(
                        name="heading",
                        data_type=DataType.TEXT,
                    ),
                    Property(
                        name="source_type",
                        data_type=DataType.TEXT,
                    ),
                    Property(
                        name="search_id",
                        data_type=DataType.TEXT,
                    ),
                ],
            )
            logger.info("Created Weaviate collection", collection=_COLLECTION_NAME)
    finally:
        client.close()


def upsert_chunks(
    chunks: list[Chunk],
    resource_url: str,
    source_type: str,
    search_id: str,
    vectors: list[list[float]],
) -> None:
    """Insert chunks with their embedding vectors into Weaviate."""
    client = _get_client()
    try:
        collection = client.collections.get(_COLLECTION_NAME)
        with collection.batch.dynamic() as batch:
            for chunk, vector in zip(chunks, vectors, strict=True):
                batch.add_object(
                    properties={
                        "resource_url": resource_url,
                        "chunk_text": chunk.text,
                        "chunk_index": chunk.index,
                        "heading": chunk.heading,
                        "source_type": source_type,
                        "search_id": search_id,
                    },
                    uuid=uuid.uuid5(
                        uuid.NAMESPACE_URL,
                        f"{search_id}:{resource_url}:{chunk.index}",
                    ),
                    vector=vector,
                )
        logger.info(
            "Upserted chunks",
            count=len(chunks),
            resource_url=resource_url,
        )
    finally:
        client.close()


def query_chunks(
    query_vector: list[float],
    search_id: str,
    resource_url: str,
    limit: int = 5,
) -> list[dict[str, object | None]]:
    """
    Query Weaviate for chunks most similar to the query vector.

    Filters by search_id and resource_url to scope results.
    """
    client = _get_client()
    try:
        collection = client.collections.get(_COLLECTION_NAME)
        result = collection.query.near_vector(
            near_vector=query_vector,
            limit=limit,
            return_metadata=MetadataQuery(distance=True),
            filters=(
                Filter.by_property("search_id").equal(search_id)
                & Filter.by_property("resource_url").equal(resource_url)
            ),
        )
        return [
            {
                "chunk_text": obj.properties.get("chunk_text", ""),
                "chunk_index": obj.properties.get("chunk_index", 0),
                "heading": obj.properties.get("heading", ""),
                "distance": obj.metadata.distance if obj.metadata else None,
            }
            for obj in result.objects
        ]
    finally:
        client.close()
