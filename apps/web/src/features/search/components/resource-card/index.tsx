import { CustomCard } from "@/features/search/components/resource-card/custom-card";
import { DdgsCard } from "@/features/search/components/resource-card/ddgs-card";
import { OpenAlexCard } from "@/features/search/components/resource-card/open-alex-card";
import { YoutubeCard } from "@/features/search/components/resource-card/youtube-card";
import type { JudgmentResult, ResourceCard } from "@/lib/api/model";

interface ResourceCardRendererProps {
  resource: ResourceCard;
  judgment?: JudgmentResult | null;
  presetId?: string;
  hideAction?: boolean;
  checked?: boolean;
  onToggleChecked?: (e: React.MouseEvent, checked: boolean) => void;
}

import { BookmarkButton } from "./bookmark-button";

export function ResourceCardRenderer({
  resource,
  judgment,
  presetId,
  hideAction,
  checked,
  onToggleChecked,
  customAction,
}: ResourceCardRendererProps & { customAction?: React.ReactNode }) {
  const isSearchPageMode = checked !== undefined && onToggleChecked !== undefined;

  let action: React.ReactNode;
  if (customAction) {
    action = customAction;
  } else if ((presetId && !hideAction) || isSearchPageMode) {
    action = (
      <BookmarkButton
        presetId={presetId}
        resource={resource}
        checked={checked}
        onToggleChecked={onToggleChecked}
      />
    );
  }

  switch (resource.source) {
    case "ddgs":
      return <DdgsCard resource={resource} judgment={judgment} action={action} />;
    case "youtube":
      return <YoutubeCard resource={resource} judgment={judgment} action={action} />;
    case "openalex":
      return <OpenAlexCard resource={resource} judgment={judgment} action={action} />;
    case "custom":
      return <CustomCard resource={resource} judgment={judgment} action={action} />;
    default:
      return null;
  }
}
