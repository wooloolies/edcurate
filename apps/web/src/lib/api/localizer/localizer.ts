/**
 * Hand-written localizer API hooks — will be replaced by orval gen:api
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type {
  ArtifactListResponse,
  GenerateArtifactRequest,
  GeneratedArtifactResponse,
} from "../model";
import { useCustomInstance } from "../../../hooks/use-custom-instance";

// --- Query Keys ---

export const getLocalizerArtifactsQueryKey = (presetId: string) =>
  ["/api/localizer", { preset_id: presetId }] as const;

export const getLocalizerArtifactQueryKey = (artifactId: string) =>
  ["/api/localizer", artifactId] as const;

// --- Hooks ---

export const useGenerateArtifactApiLocalizerGeneratePost = () => {
  const instance = useCustomInstance<GeneratedArtifactResponse>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateArtifactRequest) => {
      return instance({
        url: "/api/localizer/generate",
        method: "POST",
        data,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: getLocalizerArtifactsQueryKey(variables.preset_id),
      });
    },
  });
};

export const useListArtifactsApiLocalizerGet = (presetId: string | undefined) => {
  const instance = useCustomInstance<ArtifactListResponse>();

  return useQuery({
    queryKey: getLocalizerArtifactsQueryKey(presetId ?? ""),
    queryFn: () =>
      instance({
        url: "/api/localizer",
        method: "GET",
        params: { preset_id: presetId },
      }),
    enabled: !!presetId,
  });
};

export const useGetArtifactApiLocalizerArtifactIdGet = (artifactId: string | undefined) => {
  const instance = useCustomInstance<GeneratedArtifactResponse>();

  return useQuery({
    queryKey: getLocalizerArtifactQueryKey(artifactId ?? ""),
    queryFn: () =>
      instance({
        url: `/api/localizer/${artifactId}`,
        method: "GET",
      }),
    enabled: !!artifactId,
  });
};

export const useDeleteArtifactApiLocalizerArtifactIdDelete = () => {
  const instance = useCustomInstance<void>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (artifactId: string) => {
      return instance({
        url: `/api/localizer/${artifactId}`,
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/localizer"] });
    },
  });
};
