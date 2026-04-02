# EduX — Product Requirements Document

## Context-Aware Resource Discovery for Teaching

**Version:** 1.0
**Date:** April 2026
**Challenge:** 2026 Oceania EduX Hackathon — Cambridge EdTech Society × InCubed
**Challenge Sponsor:** Cambridge University Press & Assessment

---

## 1. Problem statement

Teachers operate in an environment of overwhelming resource abundance but limited time. A Year 10 teacher in rural Queensland searching "quadratic equations worksheet" gets the same results as a teacher in inner-city Melbourne. Neither gets something that references their students' interests, uses locally meaningful examples, or matches the exact point in the curriculum they're at this week.

The teacher then spends 30–60 minutes manually bridging that gap — adapting, rewriting, swapping examples, checking alignment. This process is repeated daily across millions of classrooms.

**The core problem is not search. It is the context gap.**

Existing tools fail because they treat resource discovery as a generic retrieval problem. They return results ranked by popularity or keyword match, not by relevance to a specific teacher's classroom, curriculum position, student cohort, or local community.

### What teachers actually do today

1. Search across 3–5 fragmented platforms (Google, TES, Twinkl, curriculum authority sites, YouTube)
2. Open 15–20 tabs, skim each result for quality and relevance
3. Mentally evaluate: Does this align with my syllabus outcome? Is the reading level right? Are the examples culturally appropriate? Is this source trustworthy?
4. Find 2–3 usable resources from 20+ candidates
5. Spend 30–60 minutes adapting them: swapping examples, adjusting language, adding local context, reformatting for their classroom
6. Repeat tomorrow

**EduX eliminates steps 2–5.**

---

## 2. Solution overview

EduX is a teacher-facing platform that discovers, evaluates, and adapts educational resources through a six-agent AI pipeline, filtered through a persistent classroom context profile.

### Core value proposition

Every search is automatically contextualised to the teacher's curriculum framework, current topic, student cohort, school location, and accumulated preferences. Results arrive pre-evaluated for quality, safety, and alignment, with transparent trust scores and concrete localisation suggestions ready to apply.

### Design principles

- **Support teacher judgement, never replace it.** Every recommendation includes transparent reasoning. The teacher always decides.
- **Local-first discovery.** Start from the teacher's community and expand outward. A Cairns teacher sees Cairns-relevant content before generic content.
- **Trust is visible.** No black-box recommendations. Every score has a justification. Every flag has an explanation. Every adaptation shows what changed and why.
- **Time-respectful.** The system should save time on first use, not after a learning curve. Pre-filled context, suggested searches, one-click adaptations.
- **Privacy by architecture.** No student PII enters the AI pipeline. Only anonymised cohort characteristics (e.g., "3 EAL/D students") are used for personalisation.

---

## 3. Target users

### Primary: Classroom teachers (Years 7–12)

Teachers across diverse settings who spend significant time discovering, evaluating, and adapting resources for their specific classroom context.

| Attribute | Range |
|---|---|
| Subjects | All — with initial focus on Geography, Science, Mathematics, English, History |
| Year levels | 7–12 |
| Settings | Public/private schools, international/bilingual programmes, regional/remote schools |
| Digital literacy | Varies widely — UI must work for both confident and cautious technology users |
| Time available | Minimal — most planning happens in 15–30 minute blocks between classes |

### Secondary users

- **Education publishers and authors** — discovering what teachers need, identifying gaps in existing resources, validating curriculum alignment
- **Curriculum designers** — understanding how resources map to learning outcomes, identifying underserved topics or regions
- **Instructional coaches** — curating resource collections for professional development, identifying high-quality exemplars
- **Language specialists** — finding and adapting resources for EAL/D students, multilingual contexts

### User personas

**Ms. Chen — Year 9 Geography, Cairns QLD**
Public school, 28 students, 3 EAL/D learners, 2 with reading support needs. Students interested in surfing, marine biology, local reef. Teaches NSW NESA syllabus (family relocated from Sydney). Spends 45 min/day searching for resources. Frustrated that nothing references the Great Barrier Reef when teaching coastal processes.

**Mr. Okafor — Year 11 Economics, Melbourne VIC**
Private school, 22 students, diverse cultural backgrounds (12 nationalities). VCE curriculum. Wants resources that use Australian economic data, not US/UK defaults. Needs case studies reflecting his students' family business backgrounds (small retail, hospitality, import/export).

**Dr. Walsh — Curriculum Author, Cambridge University Press**
Writes Geography textbooks for the Australian market. Needs to understand which topics teachers struggle to find good resources for, which local contexts are underserved, and how to make published content more adaptable to regional variation.

---

## 4. System architecture

### 4.1 Six-agent pipeline

```
Teacher Input
    │
    ▼
┌──────────────────────────────────────────────┐
│  Agent 6 — Orchestrator & Learning Agent      │
│  Routes requests, manages state, learns       │
│  from feedback, handles graceful degradation   │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  Agent 1 — Classroom Context Profiler         │
│  Persistent knowledge graph of teacher's      │
│  classroom + auto-generated curriculum         │
│  PII-safe input: anonymised cohort data only   │
└──────────────┬───────────────────────────────┘
               │ Structured context profile
               ▼
┌──────────────────────────────────────────────┐
│  Agent 2 — Intelligent Discovery Engine       │
│  Parallel multi-source search:                 │
│  Brave API · DuckDuckGo · YouTube Data API     │
│  Semantic Scholar · OER Commons · Scootle      │
└──────────────┬───────────────────────────────┘
               │ Deduplicated resource URLs
               ▼
┌──────────────────────────────────────────────┐
│  RAG Pipeline                                  │
│  Fetch → Parse → Chunk (300-500 tok)           │
│  → Embed (Voyage AI) → Vector Index            │
└──────────────┬───────────────────────────────┘
               │ Indexed chunks available to agents
               ▼
┌──────────────────────────────────────────────┐
│  Agent 3 — Deep Evaluation Agent              │
│  7-dimension scoring with RAG retrieval        │
│  against curriculum knowledge base             │
└──────────────┬───────────────────────────────┘
               │ Scored evaluations
               ▼
┌──────────────────────────────────────────────┐
│  Agent 4 — Adversarial Review Agent           │
│  Challenges evaluations: false positives,      │
│  hidden bias, accuracy gaps, safety edges      │
└──────────────┬───────────────────────────────┘
               │ Verified and flagged results
               ▼
┌──────────────────────────────────────────────┐
│  Agent 5 — Localisation & Adaptation Engine   │
│  Concrete substitutions, differentiation,      │
│  local context weaving, tracked changes        │
└──────────────┬───────────────────────────────┘
               │
               ▼
        Teacher Dashboard
        Review, compare, accept, adapt, save
```

### 4.2 Agent specifications

#### Agent 1 — Classroom Context Profiler

**Purpose:** Build and maintain a persistent, evolving knowledge graph of the teacher's classroom context. Accepts minimal teacher input and infers the rest — including auto-generating curriculum alignment from school and cohort information.

**Inputs:**
- Teacher-provided profile data (curriculum, subject, year level, location, student cohort)
- Accumulated interaction history (past searches, selections, rejections, modifications)
- Inferred context from location and curriculum (e.g., Cairns + coastal geography → Great Barrier Reef, Torres Strait Islander perspectives, tropical cyclone data)

**Input PII rules:**
All student information entering the system is subject to strict PII controls:
- **Never collected:** student names, student IDs, email addresses, photos, home addresses, or any individually identifiable data
- **Collected as anonymised aggregates only:** cohort size, count of EAL/D students, count of students with reading support needs, average reading level band, language backgrounds (as a list, never tied to individuals), general interest categories
- **Input validation:** Free-text fields are scanned and rejected if they contain patterns matching names, emails, phone numbers, or student IDs. The UI displays a warning: "Please describe your class in general terms — do not enter individual student names or identifying information."
- **Storage:** All cohort data is stored as aggregate statistics, encrypted at rest, and associated with an anonymised teacher profile ID — never with a school student management system
- **What is NOT sent to LLMs:** Raw student data is never passed to any AI model. Only the structured, anonymised context profile object (see data model below) is included in agent prompts.

**Curriculum auto-generation:**
Teachers should not need to manually specify every curriculum detail. Given minimal input (state/territory + year level + subject), the system auto-generates:
- Applicable curriculum framework (e.g., Queensland + Year 9 + Geography → Queensland QCE / Australian Curriculum v9)
- Relevant syllabus outcomes and content descriptors for the current topic
- Cross-curriculum priorities applicable to the context (e.g., Aboriginal and Torres Strait Islander Histories and Cultures, Sustainability)
- Assessment standards and expected depth of treatment for the year level

This is achieved by maintaining a structured curriculum knowledge base (see Section 9.3) that maps the hierarchy: state/territory → framework → subject → year level → unit → outcomes. When the teacher provides a topic, the system matches it against this hierarchy and populates the curriculum fields automatically. The teacher can review and override any auto-generated field.

**Outputs:**
- Structured context object passed to all downstream agents (with auto-populated curriculum fields)
- Contextualised search query suggestions
- Inferred relevance signals (local landmarks, community organisations, regional data sources)

**Key capability — inference, not just storage:** If a teacher in Cairns is teaching coastal geography, this agent should already know that the Great Barrier Reef, Torres Strait Islander perspectives, and tropical cyclone data are contextually relevant before anyone asks.

**Data model:**

```json
{
  "teacher_id": "uuid",
  "curriculum": {
    "framework": "NSW NESA Syllabus",
    "subject": "Geography",
    "year_level": "Year 9",
    "current_unit": "Sustainable Biomes",
    "current_topic": "Coastal erosion and management",
    "outcomes_targeted": ["GE5-2", "GE5-4", "GE5-5"],
    "sequence_position": "Week 4 of 8"
  },
  "school": {
    "name": "Cairns State High School",
    "location": { "city": "Cairns", "state": "QLD", "country": "Australia" },
    "type": "public_secondary",
    "region_characteristics": ["tropical", "coastal", "regional", "high_indigenous_population"]
  },
  "cohort": {
    "class_size": 28,
    "eal_d_students": 3,
    "reading_support": 2,
    "extension_students": 4,
    "language_backgrounds": ["English", "Tagalog", "Mandarin", "Torres Strait Creole"],
    "interests": ["surfing", "marine_biology", "local_reef", "gaming"],
    "average_reading_level": "Year 8.5"
  },
  "preferences": {
    "preferred_resource_types": ["interactive", "video", "dataset"],
    "avoided_sources": [],
    "past_selections": [],
    "past_rejections": [],
    "adaptation_patterns": []
  },
  "inferred_context": {
    "local_landmarks": ["Great Barrier Reef", "Daintree Rainforest", "Trinity Beach"],
    "indigenous_nations": ["Yirrganydji", "Djabugay"],
    "local_data_sources": ["GBRMPA", "BOM Cairns", "ABS Region 306"],
    "regional_industries": ["tourism", "marine_science", "agriculture"],
    "local_organisations": ["Reef HQ", "CSIRO Tropical Research", "Cairns Regional Council"]
  }
}
```

#### Agent 2 — Intelligent Discovery Engine

**Purpose:** Parallel multi-source retrieval with contextualised query diversification.

**Inputs:**
- Structured context profile from Agent 1
- Teacher's search query (natural language)

**Process:**
1. Generate 5–10 query variations from the context profile and teacher input to avoid search bias
2. Execute parallel searches across all source categories
3. Deduplicate results by URL and content similarity
4. Merge metadata from overlapping sources
5. Rank by preliminary relevance score (context match, source quality, recency)

**Query diversification example:**
For teacher query "coastal erosion resources":
- `"coastal erosion Year 9 NSW geography"` (curriculum-specific)
- `"shoreline management stage 5 geography activities"` (syllabus terminology)
- `"beach erosion Cairns Queensland case study"` (location-specific)
- `"coastal processes interactive simulation"` (resource type)
- `"Indigenous coastal knowledge Australia teaching"` (cross-curriculum priority)
- `"Great Barrier Reef coastline change data"` (inferred local context)

**Source categories:**

| Category | Sources | API / Access Method | Priority |
|---|---|---|---|
| Curriculum authority | ACARA, NESA, VCAA, QCAA | Direct API / web scraping with caching | Highest — guaranteed alignment |
| Government data | ABS, BOM, Geoscience Australia, state agencies | Open data APIs (data.gov.au) | High — authoritative, open data |
| OER repositories | Scootle, OER Commons, MIT OCW, Khan Academy | OER Commons API, Scootle search API | High — free, adaptable |
| Academic | Google Scholar, university education faculties | Google Scholar API / Semantic Scholar API | Medium — research-backed |
| Indigenous knowledge | AIATSIS, local land council resources, ABC Indigenous | Curated index + web fetch | Medium — cross-curriculum priority |
| Video | YouTube, ABC Education, TED-Ed | YouTube Data API v3 (search, captions, metadata) | Medium — high engagement format |
| Web (general) | Broad web search with quality filters | Brave Search API (primary), DuckDuckGo API (fallback) | Lower — broad but noisy |

**Search engine selection rationale:**
- **Brave Search API** (primary web search): Privacy-respecting, independent index (not a Google/Bing wrapper), supports `search_lang` and `country` filtering for Australian content prioritisation, returns structured snippets suitable for downstream evaluation. Rate limit: 2,000 queries/month on free tier, 20 queries/second on paid.
- **DuckDuckGo API** (fallback): No tracking, instant answers for factual queries, fallback when Brave rate limit is hit or returns sparse results. Limited to instant answer API (no full search API — use web scraping for full results).
- **YouTube Data API v3**: Searches video content by relevance, returns metadata (title, description, channel, duration, captions availability), supports `regionCode=AU` for Australian content prioritisation. Captions can be fetched for readability analysis by Agent 3. Quota: 10,000 units/day.
- **Semantic Scholar API**: Free, no API key required, returns peer-reviewed papers with citation counts and abstracts. Used specifically for academic source verification in Agent 3.

**Multi-engine fusion strategy:**
Each diversified query is routed to the most appropriate engine(s):
- Curriculum-specific queries → Brave (with `site:` style filtering for .edu.au and .gov.au domains)
- Video resource queries → YouTube Data API
- Academic verification queries → Semantic Scholar
- General discovery queries → Brave (primary) + DuckDuckGo (supplementary)
- Local context queries → Brave (with `country=AU` + location terms)

Results from all engines are normalised into a common schema (title, URL, source, snippet, type, metadata) before deduplication.

**Outputs:**
- Deduplicated list of resource candidates (target: 10–20 from 40–60 raw results)
- Metadata per resource: title, source, URL, type, description, preliminary relevance score
- Full resource content passed to RAG pipeline (Section 4.3) for deep evaluation

### 4.3 RAG pipeline — Resource ingestion, chunking, and retrieval

Before Agents 3–5 can evaluate and adapt resources, the raw content must be ingested, processed, and made available for deep analysis. This is handled by a Retrieval-Augmented Generation (RAG) pipeline that sits between discovery (Agent 2) and evaluation (Agent 3).

#### Pipeline stages

```
Raw resource URLs from Agent 2
        │
        ▼
┌─────────────────────┐
│  1. Content Fetcher  │  ← Retrieves full content from URLs
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  2. Content Parser   │  ← Extracts clean text from HTML, PDF, video captions
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  3. Chunker          │  ← Splits content into semantically coherent chunks
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  4. Embedding Engine │  ← Generates vector embeddings per chunk
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  5. Vector Index     │  ← Stores embeddings for similarity retrieval
└────────┬────────────┘
         │
         ▼
    Available to Agents 3, 4, 5
    for deep evaluation and adaptation
```

#### Stage 1 — Content fetcher

Retrieves full content from each resource URL discovered by Agent 2:
- **HTML pages:** Full page fetch with JavaScript rendering (Playwright/headless browser) for dynamic content
- **PDFs:** Download and extract via PyMuPDF or pdfplumber
- **YouTube videos:** Fetch auto-generated or manual captions via YouTube Data API; fall back to Whisper transcription if captions unavailable
- **Interactive simulations:** Capture visible text content and metadata; flag as "partial content — interactive elements not fully indexable"

**Caching:** Fetched content is stored in the Resource Cache (Layer 2) with a 30-day staleness threshold. Subsequent searches for the same URL skip fetching and use cached content.

#### Stage 2 — Content parser

Converts raw fetched content into clean, structured text:
- Strip HTML boilerplate (navigation, footers, ads, cookie banners) using readability algorithms (Mozilla Readability or Trafilatura)
- Preserve semantic structure: headings, lists, tables, figure captions
- Extract metadata: author, publication date, last updated, license information, language
- For PDFs: handle multi-column layouts, extract tables as structured data, OCR scanned pages if needed
- For video captions: clean timestamp artifacts, segment by topic using pause/silence detection

#### Stage 3 — Chunking strategy

Content is split into chunks optimised for both evaluation accuracy and retrieval relevance:

| Strategy | When used | Chunk size |
|---|---|---|
| Semantic chunking | Default — splits on heading boundaries, paragraph breaks, and topic shifts | 300–500 tokens per chunk |
| Sentence-level | For readability analysis (Agent 3) — each sentence scored independently | 1 sentence |
| Section-level | For curriculum alignment — each major section compared against syllabus outcomes | Full section (up to 1,000 tokens) |
| Full document | For overall bias and framing analysis (Agent 4) | Entire document (truncated at 4,000 tokens if needed) |

**Chunking rules:**
- Chunks preserve paragraph boundaries — never split mid-sentence
- Each chunk retains its parent heading as metadata (e.g., chunk from "Section 3: Coastal Management" carries that heading)
- Overlapping windows: 50-token overlap between adjacent chunks to preserve cross-boundary context
- Tables and lists are kept as single chunks regardless of token count (up to 800 tokens)

#### Stage 4 — Embedding engine

Each chunk is embedded into a vector representation for similarity-based retrieval:

| Component | Technology | Rationale |
|---|---|---|
| Embedding model | Voyage AI `voyage-3` (1024-dim) or OpenAI `text-embedding-3-small` (1536-dim) | High-quality semantic embeddings; cost-effective for education content |
| Batch processing | Chunks from all resources in a single search are embedded in one batch call | Reduces API latency and cost |
| Dimensionality | 1024 or 1536 dimensions depending on model | Sufficient for distinguishing educational content by topic, level, and framing |

**What gets embedded:**
- Each content chunk (for retrieval during evaluation)
- The teacher's context profile (for relevance scoring)
- Curriculum outcome descriptions (for alignment matching)

#### Stage 5 — Vector index

Embeddings are stored in a vector index for fast similarity retrieval:

| Component | Technology (prototype) | Technology (production) |
|---|---|---|
| Vector store | In-memory array with cosine similarity (prototype) | Pinecone / Qdrant / pgvector (production) |
| Index structure | Flat index — adequate for 10–20 resources × 20–50 chunks each | HNSW index for sub-millisecond retrieval at scale |
| Metadata filtering | Filter by resource ID, content type, section heading | Filter by curriculum framework, year level, subject, recency |

**How agents use the index:**

- **Agent 3 (Evaluation):** Retrieves chunks most similar to targeted syllabus outcomes to score curriculum alignment. Retrieves all chunks for readability scoring. Retrieves chunks matching known bias patterns for bias audit.
- **Agent 4 (Adversarial):** Retrieves chunks containing factual claims for cross-reference verification. Retrieves chunks similar to known problematic framing patterns.
- **Agent 5 (Localisation):** Retrieves chunks containing geographic references, cultural references, and data citations for substitution candidates. Retrieves chunks at different reading levels for differentiation analysis.

#### Curriculum knowledge base

A pre-built, structured knowledge base of curriculum documents is also embedded and indexed:
- Australian Curriculum v9 content descriptors and achievement standards
- State syllabus documents (NSW NESA, VIC VCAA, QLD QCE, etc.)
- IB MYP and DP subject guides
- Cambridge IGCSE and A Level syllabi

These are chunked at the outcome/descriptor level (one chunk per learning outcome) and embedded for similarity matching against resource content. This enables Agent 1 to auto-generate curriculum alignment from minimal teacher input (state + subject + year level + topic).

**Maintenance:** Curriculum documents are re-indexed when new versions are published (typically annually). Version history is preserved so resources evaluated against v8 can be flagged for re-evaluation when v9 is adopted.

### 4.4 Agent specifications (continued)

#### Agent 3 — Deep Evaluation Agent

**Purpose:** Multi-dimensional quality assessment with natural language justification for every score.

**Inputs:**
- Resource candidates from Agent 2
- Context profile from Agent 1

**Evaluation dimensions:**

| Dimension | What it measures | Scoring method |
|---|---|---|
| Curriculum alignment | Outcome-level match, not just topic overlap | Compare resource content against targeted syllabus outcomes |
| Pedagogical quality | Bloom's taxonomy level, inquiry depth, student engagement potential | Analyse task types and cognitive demand |
| Reading level | Flesch-Kincaid calibrated for Australian English, EAL/D suitability | Automated readability + vocabulary complexity analysis |
| Bias & representation | Diverse perspectives, cultural sensitivity, framing analysis | Check for Western-default framing, Indigenous representation, gender balance |
| Factual accuracy | Cross-reference key claims against authoritative sources | Verify against peer-reviewed sources, government data |
| Source credibility | Domain authority, authorship, institutional backing, recency | Assess publisher reputation, author credentials, publication date |
| Licensing & IP | Creative Commons status, adaptation rights, attribution requirements | Parse license metadata, check terms of use |

**Output per resource:**
```json
{
  "resource_id": "uuid",
  "scores": {
    "curriculum_alignment": { "score": 9, "max": 10, "reason": "Directly addresses GE5-2 and GE5-4..." },
    "pedagogical_quality": { "score": 8, "max": 10, "reason": "Promotes analysis through guided inquiry..." }
  },
  "overall_score": 8.4,
  "recommended_use": "primary_resource | supplementary | reference_only"
}
```

#### Agent 4 — Adversarial Review Agent

**Purpose:** Challenge Agent 3's evaluations to catch false positives, hidden bias, accuracy gaps, and safety edge cases.

**Inputs:**
- Agent 3's scored evaluations
- Original resource content
- Context profile from Agent 1

**Review categories:**

| Category | What it catches | Example |
|---|---|---|
| False positives | Inflated alignment or quality scores | "Rated 9/10 alignment but covers Stage 6 content, not Stage 5. Terminology overlaps but depth is wrong." |
| Hidden bias | Subtle framing issues, representation gaps | "Uses passive voice for colonisation ('land was settled') which minimises Indigenous displacement." |
| Accuracy gaps | Outdated data, superseded findings | "Climate data is from 2015 — figures have been significantly updated since the Paris Agreement review." |
| Safety edge cases | Content requiring warnings or teacher review | "Discusses mental health themes that may require content warnings for Year 9 students." |
| Licensing traps | Misidentified permissions | "Site claims CC license but images are Getty watermarked — mixed licensing." |

**Architecture note:** Not an iterative debate loop. Single chained call after Agent 3. Agent 3 evaluates, Agent 4 reviews in one pass. Two LLM calls total, not a back-and-forth.

**Outputs:**
- Adjusted scores with justification (where warranted)
- Flags with severity (high/medium/low), explanation, and suggested action
- Verdict: approved / approved with caveats / flagged for teacher review / not recommended

#### Agent 5 — Localisation & Adaptation Engine

**Purpose:** Transform generic resources into classroom-specific materials with concrete, actionable suggestions.

**Inputs:**
- Top-ranked resources (post-adversarial review)
- Full context profile from Agent 1

**Adaptation types:**

| Type | What it does | Example |
|---|---|---|
| Substitution | Replace generic examples with local ones | "Replace London rainfall dataset → BOM data for Cairns" |
| Addition | Layer in local context that doesn't exist in the resource | "Add Great Barrier Reef Marine Park Authority coastal monitoring data" |
| Cultural integration | Weave in Indigenous and community perspectives | "Yirrganydji Traditional Owners' seasonal knowledge of tidal patterns" |
| Differentiation | Adjust for different learner levels within the class | "Simplified glossary scaffold for EAL/D students; primary source analysis task for extension group" |
| Engagement | Connect to student interests | "How do groynes and sea walls affect wave quality at local surf breaks?" |
| Preset | Pre-configure interactive tools for local context | "Pre-load map centred on Cairns coastline with 2000–2024 comparison" |
| Task design | Create inquiry tasks using the resource | "Compare erosion rates at Trinity Beach vs Green Island — why does the reef protect one but not the other?" |

**Key design decision:** All adaptations use tracked changes. The teacher sees exactly what was modified and why. Nothing is silently altered.

**Outputs:**
- List of suggested adaptations per resource, each with type, description, and rationale
- Where applicable, generated adapted content (e.g., modified worksheet, localised dataset)
- Teacher can accept, reject, or modify each suggestion independently

#### Agent 6 — Orchestrator & Learning Agent

**Purpose:** Manage the pipeline, handle failures gracefully, and learn from teacher behaviour over time.

**Responsibilities:**
- Route teacher requests through the appropriate agent sequence
- Handle graceful degradation (if a source is unreachable, still return results from other sources)
- Manage conversation state for iterative refinement ("show me more like this one but easier")
- Track teacher feedback: selections, rejections, modifications, and reasons
- Use feedback to improve future recommendations (preference learning, not model fine-tuning)
- Detect when the teacher's context has changed (new unit, new term) and prompt for profile updates

**Conversation state management:**
```
Teacher: "Find me resources on coastal erosion"
→ Full pipeline executes, returns 3 results

Teacher: "Show me more like result #3 but easier reading level"
→ Orchestrator interprets as: re-run Agent 2 with bias toward data/map resources,
   add constraint "reading level ≤ Year 8", keep same context
→ Skips full pipeline, runs Agent 2 → 3 → 4 → 5 with modified parameters

Teacher: "I need something with more Indigenous perspectives"
→ Orchestrator adds "Indigenous perspectives" as high-priority filter,
   boosts AIATSIS and land council sources in Agent 2,
   adjusts Agent 3 bias scoring weights
```

### 4.3 Data architecture

#### Layer 1 — Teacher Profile Store

- Classroom context, preferences, accumulated history
- **Privacy:** encrypted at rest, never shared across teachers
- **PII policy:** No student names, no identifiable information enters this store. Only anonymised cohort characteristics ("3 EAL/D students", "average reading level Year 8.5")
- **Persistence:** survives across sessions, updated incrementally

#### Layer 2 — Resource Cache & Index

- Previously discovered and evaluated resources with their scores and metadata
- **Purpose:** Avoid redundant API calls, enable faster re-discovery
- **Freshness:** Resources re-evaluated if accessed after 30 days, or if curriculum framework version changes
- **Sharing:** Anonymised resource quality data can be aggregated across teachers (opt-in) to improve ranking for all users

#### Layer 3 — Feedback Loop Database

- Every teacher interaction: select, reject, modify, rate, time-spent
- **Purpose:** Improve ranking algorithms and adaptation suggestions over time
- **Mechanism:** Preference learning at the workflow level — the system learns what "good" means for this specific teacher in this specific context
- **Privacy:** Feedback data is associated with anonymised teacher profiles, never with student data

---

## 5. User interface specification

### 5.1 Dashboard layout

```
┌─────────────────────────────────────────────────────────┐
│  [Logo] EduX                      [Context] [Settings]  │
├────────────────┬────────────────────────────────────────┤
│                │                                        │
│  Classroom     │  Search bar                            │
│  Context       │  ┌──────────────────────────────────┐  │
│  Profile       │  │ [Suggested searches based on     │  │
│                │  │  context]                         │  │
│  ○ Curriculum  │  └──────────────────────────────────┘  │
│  ○ Subject     │                                        │
│  ○ Year level  │  Results                               │
│  ○ Topic       │  ┌──────────────────────────────────┐  │
│  ○ Location    │  │  Resource Card                    │  │
│  ○ Cohort      │  │  [Score] Title — Source            │  │
│  ○ Interests   │  │  Description                      │  │
│  ○ Additional  │  │  [Flags] [Type badge]             │  │
│                │  │                                    │  │
│  Privacy note  │  │  ▼ Expand for:                    │  │
│                │  │  [Trust eval | Adversarial | Local]│  │
│                │  └──────────────────────────────────┘  │
│                │                                        │
│                │  [Refinement suggestions]               │
│                │                                        │
└────────────────┴────────────────────────────────────────┘
```

### 5.2 Key UI components

#### Classroom context sidebar
- Persistent, collapsible panel
- Pre-filled with demo data for hackathon (Cairns, Year 9, Geography)
- All fields editable, changes immediately affect search behaviour
- Privacy notice: "No student PII is sent to AI models"

#### Search bar
- Full-width, prominent placement
- Placeholder text reflects current context: "Search resources for Geography — Coastal erosion..."
- Suggested search chips generated from classroom profile
- Enter to search, button to discover

#### Resource cards (collapsed)
- Overall trust score (colour-coded: green ≥ 8, amber ≥ 6, red < 6)
- Title, source, resource type badge
- Description (2–3 lines)
- Adversarial flag badges (high/medium/low severity)

#### Resource cards (expanded)
Three-column detail panel:

**Column 1 — Trust evaluation:**
- All 7 scoring dimensions with progress bars
- Natural language justification per dimension
- Colour-coded scores (green/amber/red)

**Column 2 — Adversarial review:**
- Overall verdict badge (approved/caveats/flagged)
- Individual flags with severity, explanation, and suggested action
- Score adjustments where applicable, showing original → adjusted with reason

**Column 3 — Localisation suggestions:**
- Categorised by type (substitution, addition, cultural, differentiation, engagement)
- Each suggestion shows: what to change, what to change it to, and why
- "Apply adaptation" button per suggestion
- Strikethrough on original content being replaced

#### Refinement panel
- Appears below results
- Contextual follow-up suggestions: "Show me more like result #3", "Find resources with stronger First Nations content", "I need something easier for my EAL/D students"
- Supports iterative, conversational refinement

### 5.3 Loading states

Pipeline stages shown sequentially during search:
1. "Building contextualised queries from classroom profile..."
2. "Searching across 6 source categories in parallel..."
3. "Deduplicating and merging results..."
4. "Running deep evaluation on top candidates..."
5. "Adversarial review challenging evaluations..."
6. "Generating localisation suggestions for [location] context..."

**Purpose:** Transparency. The teacher sees that the system is doing real work, not just searching Google. Each stage maps to a specific agent, reinforcing trust.

---

## 6. Scoring rubric alignment

How EduX maps to the four judging criteria (10 points each, 40 total):

### Human-centred application & challenge relevance (10 pts)

| Requirement | How EduX addresses it |
|---|---|
| Clarity of real user problem | The context gap — teachers find generic resources but waste 30–60 min adapting them |
| Depth of understanding of target users | Three detailed personas with specific pain points, validated against real teacher workflows |
| Strong alignment with challenge | Directly addresses resource discovery, evaluation, adaptation, and trust for Years 7–12 |
| Educational/psychological theories | Bloom's taxonomy integrated into pedagogical quality scoring; Zone of Proximal Development informs differentiation suggestions; Culturally Responsive Teaching principles inform localisation engine |

### Technological implementation & feasibility (10 pts)

| Requirement | How EduX addresses it |
|---|---|
| Sound technical approach | Six-agent pipeline with clear separation of concerns, defined inputs/outputs, and explicit handoff protocols |
| Effective use of AI | LLMs for contextual query generation, multi-dimensional evaluation, adversarial review, and adaptation — not just chatbot wrapper |
| Prototype works | Functional React dashboard with simulated pipeline, ready for live API integration |
| Realistic constraints | Claude API (Sonnet) for all agents, web search for discovery, local storage for profiles — no exotic infrastructure |

### Responsible AI & ethics (10 pts)

| Requirement | How EduX addresses it |
|---|---|
| Fairness | Bias audit dimension in evaluation; adversarial agent specifically checks for representation gaps and cultural framing |
| Privacy | No student PII in AI pipeline; anonymised cohort data only; encrypted profile storage |
| Safety | Content safety flags for age-appropriateness; mental health content warnings; adversarial review catches edge cases |
| Transparency | Every score has a justification; every flag has an explanation; every adaptation shows tracked changes |
| Accountability | Teacher always decides — system recommends, never auto-applies; all sources cited and linked |

### Creativity & innovation (10 pts)

| Requirement | How EduX addresses it |
|---|---|
| Originality | Persistent classroom context profile that infers local relevance; adversarial review as trust mechanism; local-first discovery |
| Novel recombination | Combines RAG, multi-agent evaluation, adversarial AI, and localisation in a teacher-specific workflow |
| Meaningful impact | Eliminates 30–60 min daily adaptation time; surfaces Indigenous and local perspectives that teachers want but can't find efficiently |
| Beyond standard solutions | Not a chatbot, not a search engine — a context-aware evaluation and adaptation pipeline |

---

## 7. Educational theory integration

### Bloom's taxonomy (cognitive domain)

Agent 3 evaluates pedagogical quality by analysing the cognitive demand level of resource tasks:
- **Remember/Understand** — definitions, recall questions, fill-in-the-blank (scored lower for Year 9+)
- **Apply/Analyse** — guided inquiry, data interpretation, case study analysis (target level)
- **Evaluate/Create** — independent investigation, argument construction, project-based tasks (extension level)

Resources scored higher when they promote higher-order thinking appropriate to the year level.

### Zone of Proximal Development (Vygotsky)

Agent 5's differentiation suggestions are informed by ZPD:
- Resources are adapted to sit just above current capability with appropriate scaffolding
- EAL/D scaffolds (glossaries, visual supports) bring challenging content into the accessible zone
- Extension tasks push high-achieving students into productive struggle without removing support

### Culturally Responsive Teaching (Gay, 2010; Ladson-Billings, 1995)

The localisation engine operationalises CRT principles:
- Local examples and case studies reflect students' lived experience
- Indigenous knowledge is integrated as a valid knowledge system, not an add-on
- Community context (local organisations, industries, cultural figures) connects curriculum to student identity
- Student interests are used as hooks for engagement, not treated as distractions

### Universal Design for Learning (CAST)

Multiple means of engagement, representation, and action/expression are considered:
- Resource type diversity (interactive, video, text, dataset) across search results
- Reading level assessment ensures accessibility for diverse learners
- Differentiation suggestions provide multiple entry points to the same content

---

## 8. Ethical framework

### 8.1 Principles

1. **Teacher agency is paramount.** The system informs, recommends, and suggests. It never decides for the teacher. Every output is a proposal that the teacher accepts, rejects, or modifies.

2. **Transparency over accuracy.** A transparent 7/10 score with clear reasoning is more valuable than an opaque 9/10. Teachers need to understand *why* to trust the system.

3. **Indigenous knowledge requires respect, not extraction.** When surfacing First Nations perspectives, the system cites sources, acknowledges Traditional Owners, and never presents Indigenous knowledge as a "fun fact" or decoration. Where possible, it links to community-controlled resources.

4. **Privacy is architectural, not policy.** Student data protection is enforced by system design (anonymised cohort data only), not by terms of service that users must remember to follow.

5. **Bias detection is ongoing, not one-time.** The adversarial agent runs on every search, not as an initial audit. Bias can be subtle and context-dependent — what's appropriate in one classroom may be problematic in another.

### 8.2 Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI recommends biased or culturally insensitive resource | Medium | High | Adversarial review agent with explicit bias detection; teacher always reviews before use |
| Teacher over-relies on AI evaluation, stops exercising judgement | Medium | Medium | Scores presented as "here's what we found" not "here's what's best"; UI encourages exploration |
| Student PII accidentally enters the system | Low | High | Input validation; no free-text student name fields; anonymised cohort data only |
| Indigenous knowledge misrepresented or decontextualised | Medium | High | Priority linking to community-controlled sources; flagging when Indigenous content lacks proper attribution |
| AI-generated adaptations contain factual errors | Medium | Medium | Tracked changes show all modifications; teacher reviews before use; adversarial agent checks adapted content |
| Source licensing misidentified | Low | Medium | Conservative licensing assessment; when uncertain, flag as "verify before adapting" |
| System reinforces existing search biases | Low | Medium | Query diversification in Agent 2; multiple source categories; adversarial review checks for source homogeneity |

### 8.3 Governance

- All AI-generated or AI-modified content is labelled as such
- Sources are cited with full attribution for every resource and adaptation
- Teacher feedback data is anonymised and never sold or shared with third parties
- System behaviour is auditable — every agent's input and output can be logged and reviewed
- Regular bias audits of the evaluation rubric and adversarial review criteria

---

## 9. Technical implementation

### 9.1 Technology stack

| Component | Technology | Rationale |
|---|---|---|
| Frontend | React (JSX artifact) | Fast prototyping, rich interactivity, single-file deployment |
| AI backbone | Claude API (Sonnet) | Strong reasoning for evaluation and adversarial review; tool use for web search |
| Web search (primary) | Brave Search API | Privacy-respecting, independent index, supports Australian content filtering, structured snippets |
| Web search (fallback) | DuckDuckGo API | No tracking, instant answers, fallback when Brave rate limit hit |
| Video search | YouTube Data API v3 | Video discovery with metadata, captions for readability analysis, `regionCode=AU` filtering |
| Academic search | Semantic Scholar API | Free, no key required, peer-reviewed papers with citation counts |
| Content fetching | Playwright (JS rendering) + Trafilatura (HTML parsing) | Handles dynamic content and clean text extraction from diverse page structures |
| Embedding model | Voyage AI `voyage-3` (prototype) / OpenAI `text-embedding-3-small` (production) | Cost-effective semantic embeddings for educational content |
| Vector store | In-memory cosine similarity (prototype) → Pinecone / pgvector (production) | Zero infrastructure for hackathon; scalable similarity retrieval for production |
| Chunking | Custom semantic chunker (heading-boundary + overlap) | Preserves educational content structure; 300–500 token chunks with 50-token overlap |
| Curriculum knowledge base | Pre-embedded curriculum documents (ACARA v9, NESA, VCAA, IB, Cambridge) | Enables auto-generation of curriculum alignment from minimal teacher input |
| Data persistence | Browser local storage (prototype) → Supabase (production) | Zero backend for hackathon; scalable for production |
| Deployment | Claude artifact / Vercel | Instant sharing for demo day |

### 9.2 API call structure

Each search triggers the following call sequence:

```
1. Context Agent (1 LLM call)
   Input: teacher profile + search query
   Output: structured context + 5-10 diversified queries
   + auto-generated curriculum alignment if not manually specified

2. Discovery Agent (multiple API calls, parallelised)
   Input: diversified queries
   APIs hit: Brave Search (3-5 queries), YouTube Data (1-2 queries),
             Semantic Scholar (1 query), OER Commons (1 query)
   Output: deduplicated resource list (10-20 candidates)

3. RAG Pipeline (automated, no LLM call)
   Input: resource URLs from discovery
   Process: fetch content → parse → chunk (300-500 tokens) → embed → index
   Output: vector-indexed chunks ready for agent retrieval
   Latency: ~2-3 seconds for 10 resources (parallelised fetching)

4. Evaluation Agent (1 LLM call per resource, parallelised)
   Input: resource chunks (retrieved from vector index) + context profile
   Retrieval: curriculum-aligned chunks, full-text for readability, bias-pattern matches
   Output: 7-dimension scored evaluation

5. Adversarial Agent (1 LLM call per resource, chained after eval)
   Input: evaluation results + resource chunks (retrieved for verification)
   Retrieval: factual-claim chunks for cross-reference, framing-pattern matches
   Output: adjusted scores, flags, verdict

6. Localisation Agent (1 LLM call per top resource)
   Input: resource chunks + context profile + adversarial results
   Retrieval: geographic-reference chunks, cultural-reference chunks, data-citation chunks
   Output: adaptation suggestions with tracked changes
```

**Estimated total per search:** 12–20 API calls (LLM + search engines + embedding)
**Estimated latency:** 8–12 seconds (with parallelisation across discovery, fetching, and evaluation)
**Cost per search:** ~$0.15–0.30 USD (Claude Sonnet + embedding + search API calls)

### 9.3 Prompt architecture

Each agent has a dedicated system prompt containing:
- Role definition and constraints
- Input/output schema (JSON)
- Evaluation rubric or review checklist
- Examples of good and bad outputs
- Context injection template (filled from teacher profile)

Prompts are version-controlled and auditable.

---

## 10. Metrics and success criteria

### 10.1 Hackathon success

- Working prototype demonstrating full pipeline flow (context → discover → evaluate → review → localise)
- 3+ realistic demo scenarios with different subjects, locations, and student cohorts
- Pitch video clearly articulating problem, solution, and differentiation in under 3 minutes
- All four judging criteria explicitly addressed in both product and pitch

### 10.2 Product success (post-hackathon)

| Metric | Target | Measurement |
|---|---|---|
| Time saved per search session | ≥ 20 minutes vs. manual workflow | Self-reported + session duration tracking |
| Resource acceptance rate | ≥ 40% of top-3 results used without major modification | Track select/reject/modify actions |
| Trust score accuracy | ≥ 80% agreement between AI evaluation and teacher assessment | Compare AI scores to teacher ratings on same resources |
| Localisation adoption | ≥ 60% of localisation suggestions accepted | Track apply/reject per suggestion |
| Repeat usage | ≥ 3 sessions per teacher per week | Session frequency tracking |
| Context profile completeness | ≥ 80% of fields populated after 3rd session | Profile field completion tracking |

---

## 11. Roadmap

### Phase 1 — Hackathon prototype (current)

- Functional React dashboard with simulated pipeline
- Demo data for 3 resource scenarios
- Classroom context profiler UI
- Trust evaluation, adversarial review, and localisation panels
- Pipeline loading animation showing agent stages

### Phase 2 — Live prototype (post-hackathon, weeks 1–4)

- Wire Claude API calls for real discovery and evaluation
- Implement web search integration for live resource discovery
- Persistent teacher profiles via browser storage
- Real adversarial review on fetched resource content
- 2–3 additional subject areas beyond Geography

### Phase 3 — Beta (months 2–3)

- Backend with Supabase for persistent data
- Resource cache to avoid redundant evaluations
- Feedback loop tracking (select/reject/modify)
- Multi-teacher support with individual profiles
- Curriculum framework database for automated outcome matching
- Teacher-to-teacher resource sharing (opt-in)

### Phase 4 — Production (months 4–6)

- Full feedback-driven preference learning
- Publisher integration (Cambridge UP content library)
- Curriculum authority API integrations (ACARA, NESA)
- Indigenous knowledge source partnerships (AIATSIS, local land councils)
- School/district admin dashboard for resource usage analytics
- Mobile-responsive design for planning on the go

---

## 12. Open questions

1. **Curriculum data structure:** How do we model the hierarchical relationship between frameworks, subjects, year levels, units, topics, and outcomes in a way that scales across Australian state curricula, IB, and Cambridge frameworks?

2. **Indigenous knowledge protocols:** What are the appropriate protocols for surfacing and recommending Indigenous knowledge resources? How do we ensure community consent and proper attribution?

3. **Real-time vs. cached evaluation:** Should resources be re-evaluated every time they're surfaced, or can we cache evaluations with a staleness threshold? What's the right balance between freshness and latency?

4. **Publisher partnerships:** How might Cambridge UP and other publishers expose their content libraries for contextual search and adaptation? What are the licensing implications?

5. **Teacher onboarding:** What's the minimum viable classroom profile that produces useful results? Can we infer most of the profile from just curriculum + location + year level?

6. **Adversarial review calibration:** How do we calibrate the adversarial agent's sensitivity? Too aggressive = everything gets flagged; too lenient = defeats the purpose. Should this be teacher-adjustable?

---

## Appendix A — Demo scenario script

### Scenario: Ms. Chen, Year 9 Geography, Cairns

**Setup:**
- Curriculum: NSW NESA Syllabus
- Subject: Geography
- Year level: Year 9
- Topic: Coastal erosion and management
- Location: Cairns, Queensland
- Class: 28 students, 3 EAL/D, interests in surfing and marine biology

**Search:** "Coastal erosion interactive activities"

**Expected results demonstrate:**
1. A high-scoring interactive simulation (9.1 avg) with a medium locality flag and concrete localisation suggestions (swap Bondi → Trinity Beach, add GBRMPA data, integrate Yirrganydji knowledge)
2. A decent supplementary resource (7.4 avg) with a high bias flag (Western-only perspective) and score downgrade by adversarial agent
3. An excellent government data tool (9.0 avg) with an accessibility flag (needs scaffolding for Year 9) and creative task suggestions

**Pitch narrative:** "Ms. Chen found what she needed in 2 minutes instead of 45. She applied 3 localisation suggestions and her students analysed erosion data from their own beach. The system flagged a bias issue she wouldn't have caught. Next time she searches, it already knows her context."
