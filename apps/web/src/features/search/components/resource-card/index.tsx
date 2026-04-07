import { useTranslations } from "next-intl";
import { CustomCard } from "@/features/search/components/resource-card/custom-card";
import { DdgsCard } from "@/features/search/components/resource-card/ddgs-card";
import { OpenAlexCard } from "@/features/search/components/resource-card/open-alex-card";
import { YoutubeCard } from "@/features/search/components/resource-card/youtube-card";
import type { ResourceCard } from "@/lib/api/model";
import { Link } from "@/lib/i18n/routing";

interface ResourceCardRendererProps {
  index: number;
  resource: ResourceCard;
  presetId?: string;
  hideAction?: boolean;
  checked?: boolean;
  onToggleChecked?: (e: React.MouseEvent, checked: boolean) => void;
}

import { BookmarkButton } from "./bookmark-button";

export function ResourceCardRenderer({
  index,
  resource,
  presetId,
  hideAction,
  checked,
  onToggleChecked,
  customAction,
}: ResourceCardRendererProps & { customAction?: React.ReactNode }) {
  const t = useTranslations("search");
  const isSearchPageMode = checked !== undefined && onToggleChecked !== undefined;

  let action: React.ReactNode;

  if (customAction) {
    action = customAction;
  } else if ((presetId && !hideAction) || isSearchPageMode) {
    action = (
      <div className="flex items-center gap-3">
        <Link
          href={`/overview?title=${encodeURIComponent(resource.title || "Resource Overview")}&type=${encodeURIComponent(resource.source || "general")}&verdict=${encodeURIComponent(resource.verdict || "")}`}
          target="_blank"
          className="rounded-full px-5 py-2 text-sm font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 whitespace-nowrap"
        >
          {t("overview")}
        </Link>
        <BookmarkButton
          presetId={presetId}
          resource={resource}
          checked={checked}
          onToggleChecked={onToggleChecked}
        />
      </div>
    );
  }

  switch (resource.source) {
    case "ddgs":
      return <DdgsCard index={index} resource={resource} action={action} />;
    case "youtube":
      return <YoutubeCard index={index} resource={resource} action={action} />;
    case "openalex":
      return <OpenAlexCard index={index} resource={resource} action={action} />;
    case "custom":
      return <CustomCard index={index} resource={resource} action={action} />;
    default:
      return null;
  }
}
