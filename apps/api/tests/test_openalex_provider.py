from src.discovery.providers.openalex import _reconstruct_abstract


def test_reconstruct_abstract_orders_words_by_position() -> None:
    abstract = _reconstruct_abstract(
        {
            "water": [2],
            "The": [0],
            "cycle": [3],
            "is": [1],
        }
    )

    assert abstract == "The is water cycle"


def test_reconstruct_abstract_returns_empty_string_for_missing_index() -> None:
    assert _reconstruct_abstract(None) == ""
