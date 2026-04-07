"""Search query generation agent.

Generates provider-tailored search queries from a user query and classroom
preset, replacing the hardcoded query construction in each provider.
"""

from src.agents.base import BaseAgent, format_teacher_context
from src.discovery.schemas import GeneratedSearchQueries
from src.lib.logging import get_logger
from src.presets.model import ClassroomPreset

logger = get_logger(__name__)


_SYSTEM_PROMPT = """\
You are a search query strategist for an educational resource discovery system.

Given a teacher's search request and their classroom context, you generate \
optimised search queries for three different providers. Each provider has \
different strengths — tailor the queries accordingly.

## Providers

- **ddgs** (DuckDuckGo): General web search. Good for lesson plans, \
worksheets, blog posts, interactive tools, and educational websites. \
Queries should include practical teaching terms (e.g. "worksheet", \
"lesson plan", "activity", "interactive").

- **youtube**: Video search. Good for explainer videos, documentaries, \
recorded lessons, and visual demonstrations. Queries should be natural \
language phrases a student or teacher would type into YouTube.

- **openalex**: Academic paper search. Good for peer-reviewed research, \
meta-analyses, and scholarly sources. Queries should use precise academic \
terminology, subject-specific keywords, and formal phrasing.

## Rules

1. Generate 1-3 queries per provider based on query complexity:
   - Simple/specific queries -> 1 query per provider
   - Moderate queries -> 2 queries per provider
   - Broad/ambiguous queries -> 2-3 queries per provider with different angles
2. Every query must be directly relevant to the teacher's search intent.
3. Incorporate the classroom context (year level, curriculum, country, \
subject, student interests) into the queries where it improves relevance.
4. Queries must be in the teaching language specified.
5. Do NOT repeat the same query across providers - adapt phrasing to each \
provider's strengths.

## Output Format

Return a JSON object with exactly three keys: "ddgs", "youtube", "openalex". \
Each value is a list of 1-3 query strings.
"""


class SearchQueryAgent(BaseAgent[GeneratedSearchQueries]):
    """Generates per-provider search queries from user query + classroom preset."""

    model: str = "gemini-2.5-flash"
    temperature: float = 0.5

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    def build_prompt(self, **kwargs: object) -> str:
        query = str(kwargs["query"])
        preset: ClassroomPreset = kwargs["preset"]  # type: ignore[assignment]

        teacher_context = format_teacher_context(preset)
        return (
            f"## Teacher's Search Request\n\n"
            f"{query}\n\n"
            f"## Classroom Context\n\n"
            f"{teacher_context}\n"
        )

    def parse_response(self, data: dict) -> GeneratedSearchQueries:
        return GeneratedSearchQueries.model_validate(data)
