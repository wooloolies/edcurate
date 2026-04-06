# Saved Resources Feature Design

## 1. Overview
The Saved Resources feature allows users to "bookmark" resources from federated search results or add custom links manually. These resources are grouped by their `ClassroomPreset` context and can be batch-evaluated on demand via the existing RAG pipeline.

---

## 2. Database Schema

A single denormalized table using JSONB to store the resource snapshot and evaluation state.

### `saved_resources` Table
```python
class SavedResource(Base):
    __tablename__ = "saved_resources"
    __table_args__ = (
        UniqueConstraint("user_id", "preset_id", "resource_url", name="uq_saved_resource"),
        Index("ix_saved_resources_user_preset", "user_id", "preset_id"),
    )

    id          : UUID        # PK, gen_random_uuid()
    user_id     : UUID        # FK → users.id ON DELETE CASCADE
    preset_id   : UUID        # FK → classroom_presets.id ON DELETE CASCADE
    resource_url: str(2048)   # The URL of the saved resource
    resource_data: JSONB      # Full ResourceCard snapshot at save time
    evaluation_data: JSONB    # Nullable — populated when user triggers "Evaluate"
    saved_at    : timestamptz # server_default=now()
```

---

## 3. API Endpoints

All endpoints are protected and require the `CurrentUser` dependency.

### `POST /api/saved`
- **Purpose**: Toggle save (bookmark from search).
- **Behavior**: Uses `INSERT ... ON CONFLICT DO NOTHING`. Idempotent.
- **Body**: `{ "preset_id": "...", "resource": <ResourceCard JSON> }`

### `DELETE /api/saved/{id}`
- **Purpose**: Unsave/delete a resource.
- **Behavior**: Verifies `user_id` owns the resource before deletion.

### `POST /api/saved/link`
- **Purpose**: Add a custom link manually.
- **Behavior**: 
  - Backend fetches the URL, scrapes metadata (`<title>`, `<meta description>`, `<og:image>`).
  - Constructs a `ResourceCard` with `source="custom"` and `type="webpage"`.
  - Inserts into `saved_resources` (with `evaluation_data = NULL`).
- **Body**: `{ "preset_id": "...", "url": "https://...", "title": "Optional Override" }`

### `GET /api/saved`
- **Purpose**: List library resources.
- **Query Params**: `?preset_id=` (optional filter).
- **Response**: Groups resources by preset ID and name for easy frontend rendering.

### `POST /api/saved/evaluate`
- **Purpose**: Batch evaluate unevaluated resources for a preset.
- **Behavior**:
  - Finds all saved resources for the given `preset_id` where `evaluation_data IS NULL`.
  - Runs the `_run_rag_pipeline` (fetch → chunk → embed → Agent 3+4 → reconcile).
  - Patches `evaluation_data` with the results.

---

## 4. Frontend Integration

1.  **Search Page (`ResourceCard`)**: 
    - Add a Bookmark toggle button (top-right of card).
    - `Outline` icon = unsaved, `Solid` icon = saved.
    - Triggers `POST` or `DELETE` API.
2.  **Search Page (Sidebar)**:
    - Quick-access drawer showing saved items for the current active preset.
    - Click `[🗑️]` to remove.
3.  **Library Page (`/library`)**:
    - Tabs for each `ClassroomPreset`.
    - Render saved `ResourceCard`s.
    - "Add Link" input at the top (`POST /api/saved/link`).
    - "Evaluate All Unevaluated (N)" button (`POST /api/saved/evaluate`).

---

## 5. Schema Updates

To support custom links, the `ResourceCard` schema will be updated:

```python
# In apps/api/src/discovery/schemas.py

source: Literal["ddgs", "youtube", "openalex", "custom"]

class CustomMetadata(BaseModel):
    source: Literal["custom"] = "custom"
    domain: str          
    og_title: str | None = None
    og_description: str | None = None
    og_image: str | None = None

ResourceMetadata = Annotated[
    DdgsMetadata | YoutubeMetadata | OpenAlexMetadata | CustomMetadata,
    Field(discriminator="source"),
]
```
