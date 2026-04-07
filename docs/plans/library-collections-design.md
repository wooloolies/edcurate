# Library Collections Feature Design

## Intent & Scope
Provide users with the ability to organizationally group saved links into named, public or private **Collections**, tied closely to what queries and presets they are using. Introduce a "Suggested Collections" federated search feature to surface public collections created by other users running similar queries.

## Chosen Architecture: Dedicated `LibraryCollection` Model
Instead of duplicating tags heavily on the `SavedResource` table, a formal `LibraryCollection` SQLAlchemy model is introduced to store Collection attributes and semantic embeddings cleanly, referencing `SavedResource` rows as its children.

### 1. Data Model Adjustments
* **New Table (`LibraryCollection`)**: 
  - `id` (UUID)
  - `user_id` (UUID)
  - `preset_id` (UUID)
  - `search_query` (String)
  - `name` (String)
  - `is_public` (Boolean, default `False`)
  - `clone_count` (Integer)
  - `search_query_embedding` (Vector 1536)
* **Updated Table (`SavedResource`)**: 
  - `collection_id` (ForeignKey to `LibraryCollection` with `CASCADE` delete).

### 2. API Contracts
**POST `/api/collections`** (Creation)
- Body: `preset_id`, `search_query`, `name`, `is_public`, and `resources`/`evaluation_data_list`.
- Behavior: Automatically calls Vertex AI to embed `search_query`. Creates `LibraryCollection` and nested `SavedResource` targets in bulk.

**GET `/api/collections/suggested`** (Semantic Retrieval)
- Params: `preset_id` & `search_query`.
- Behavior: Searches `pgvector` for collections with similar query vectors, where `is_public=true`.

**POST `/api/collections/{id}/clone`** (Duplication)
- Behavior: Generates a completely separate `LibraryCollection` (private by default) + resources under the cloning user's `user_id`. Increments `clone_count` on the original entity.

### 3. UI Flow adjustments
- **Save Action**: Bookmark button click opens a modal with inputs for "Collection Name" and "Privacy".
- **Privacy Confirmation Alert**: Explicit user confirmation is required natively in the UI if they toggle standard private privacy to public.
- **Search Suggestions**: A right-side card rail rendering collections ranked by similarity + clone count in the Search Dashboard.

### 4. Edge Cases Handled
- Validates Vertex AI embedding generation failures with a graceful `NULL` DB save.
- Deletions: Cascaded delete correctly scrubs target resources. Clones are fully decoupled; deleting original doesn't affect clones.
- Privacy Retractions: Switching public collections to private immediately unlists them from semantic suggestion indexes.
