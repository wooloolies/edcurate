import { ExternalLink, Play } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  RelevanceDetails,
  VerdictBadge,
} from "@/features/search/components/resource-card/relevance-indicator";
import { ResourceListRow } from "@/features/search/components/resource-card/resource-list-row";
import type { JudgmentResult, ResourceCard } from "@/lib/api/model";

interface YoutubeCardProps {
  index: number;
  resource: ResourceCard;
  judgment?: JudgmentResult | null;
  action?: React.ReactNode;
}

export function YoutubeCard({ index, resource, judgment, action }: YoutubeCardProps) {
  const _t = useTranslations("search");
  const meta = resource.metadata as {
    channel?: string;
    duration?: string;
    view_count?: number;
    published_date?: string;
  };

  const contentNode = (
    <>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-base font-semibold text-slate-900 border-b border-transparent hover:border-slate-400 max-w-fit transition-colors leading-snug truncate"
      >
        <Play className="mr-1.5 inline h-4 w-4 text-red-500" />
        {resource.title}
        <ExternalLink className="ml-1.5 inline h-3 w-3 text-slate-400" />
      </a>
      <div className="flex flex-col gap-3 sm:flex-row mt-1">
        {!!resource.thumbnail_url && (
          <Image
            src={resource.thumbnail_url}
            alt={resource.title}
            width={144}
            height={80}
            className="w-full shrink-0 rounded object-cover sm:h-20 sm:w-36 border border-slate-100"
          />
        )}
        <div className="space-y-1">
          <p className="text-muted-foreground line-clamp-3 leading-relaxed">{resource.snippet}</p>
          {!!meta.channel && <p className="text-xs font-medium text-slate-400">{meta.channel}</p>}
        </div>
      </div>
    </>
  );

  return (
    <ResourceListRow
      index={index}
      verdictNode={<VerdictBadge verdict={resource.verdict} />}
      contentNode={contentNode}
      actionsNode={action}
      expandedDetailsNode={judgment ? <RelevanceDetails judgment={judgment} /> : null}
    />
  );
}
