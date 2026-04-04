import { DdgsCard } from "@/features/search/components/resource-card/ddgs-card";
import { OpenAlexCard } from "@/features/search/components/resource-card/open-alex-card";
import { YoutubeCard } from "@/features/search/components/resource-card/youtube-card";
import type { ResourceCard } from "@/lib/api/model";

interface ResourceCardRendererProps {
  resource: ResourceCard;
}

export function ResourceCardRenderer({ resource }: ResourceCardRendererProps) {
  switch (resource.source) {
    case "ddgs":
      return <DdgsCard resource={resource} />;
    case "youtube":
      return <YoutubeCard resource={resource} />;
    case "openalex":
      return <OpenAlexCard resource={resource} />;
    default:
      return null;
  }
}
