import { useTranslations } from "next-intl";
import { CustomCard } from "@/features/search/components/resource-card/custom-card";
import { DdgsCard } from "@/features/search/components/resource-card/ddgs-card";
import { OpenAlexCard } from "@/features/search/components/resource-card/open-alex-card";
import { YoutubeCard } from "@/features/search/components/resource-card/youtube-card";
import type { ResourceCard } from "@/lib/api/model";
import { Link } from "@/lib/i18n/routing";

interface ResourceCardRendererProps {
  index?: number;
  resource: ResourceCard;
  hideAction?: boolean;
  checked?: boolean;
  isEvaluating?: boolean;
  evaluationId?: string;
}

import { BookmarkButton } from "./bookmark-button";

export function buildOverviewHref(resource: ResourceCard, evaluationId?: string) {
  if (evaluationId) {
    return `/overview/${evaluationId}`;
  }
  const params = new URLSearchParams({
    title: resource.title || "Resource Overview",
    type: resource.source || "general",
    ...(resource.verdict && { verdict: resource.verdict }),
  });
  return `/overview?${params.toString()}`;
}

export function ResourceCardRenderer({
  index,
  resource,
  hideAction,
  checked,
  isEvaluating,
  evaluationId,
  customAction,
}: ResourceCardRendererProps & { customAction?: React.ReactNode }) {
  const t = useTranslations("search");

  let action: React.ReactNode;

  if (customAction) {
    action = customAction;
  } else if (!hideAction) {
    action = (
      <div className="flex items-center gap-3">
        <Link
          href={buildOverviewHref(resource, evaluationId)}
          className="rounded-full px-5 py-2 text-sm font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 whitespace-nowrap"
        >
          {t("overview")}
        </Link>
        <BookmarkButton resource={resource} checked={checked} />
      </div>
    );
  }

  switch (resource.source) {
    case "ddgs":
      return (
        <DdgsCard index={index} resource={resource} action={action} isEvaluating={isEvaluating} />
      );
    case "youtube":
      return (
        <YoutubeCard
          index={index}
          resource={resource}
          action={action}
          isEvaluating={isEvaluating}
        />
      );
    case "openalex":
      return (
        <OpenAlexCard
          index={index}
          resource={resource}
          action={action}
          isEvaluating={isEvaluating}
        />
      );
    case "custom":
      return (
        <CustomCard index={index} resource={resource} action={action} isEvaluating={isEvaluating} />
      );
    default:
      return null;
  }
}
