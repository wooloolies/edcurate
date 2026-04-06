import { DdgsCard } from "@/features/search/components/resource-card/ddgs-card";
import { OpenAlexCard } from "@/features/search/components/resource-card/open-alex-card";
import { YoutubeCard } from "@/features/search/components/resource-card/youtube-card";
import type { AdversarialReviewResult, ResourceCard } from "@/lib/api/model";

interface ResourceCardRendererProps {
  resource: ResourceCard;
  adversarial?: AdversarialReviewResult | null;
}

export function ResourceCardRenderer({ resource, adversarial }: ResourceCardRendererProps) {
  switch (resource.source) {
    case "ddgs":
      return <DdgsCard resource={resource} adversarial={adversarial} />;
    case "youtube":
      return <YoutubeCard resource={resource} adversarial={adversarial} />;
    case "openalex":
      return <OpenAlexCard resource={resource} adversarial={adversarial} />;
    default:
      return null;
  }
}
