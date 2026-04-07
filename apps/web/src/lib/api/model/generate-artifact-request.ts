/**
 * Manually created — will be replaced by orval gen:api
 */
export type ArtifactType = "quiz" | "mindmap" | "summary" | "flashcards";

export interface GenerateArtifactRequest {
  preset_id: string;
  saved_resource_ids: string[];
  artifact_type: ArtifactType;
}
