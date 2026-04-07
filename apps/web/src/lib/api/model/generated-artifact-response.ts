/**
 * Manually created — will be replaced by orval gen:api
 */
export interface GeneratedArtifactResponse {
  id: string;
  preset_id: string;
  artifact_type: string;
  content: Record<string, unknown>;
  source_resource_ids: string[];
  created_at: string;
}

export interface ArtifactListResponse {
  artifacts: GeneratedArtifactResponse[];
  total: number;
}
