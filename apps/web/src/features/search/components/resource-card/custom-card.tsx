import { ExternalLink, Link as LinkIcon } from "lucide-react";
import {
  RelevanceDetails,
  VerdictBadge,
} from "@/features/search/components/resource-card/relevance-indicator";
import { ResourceListRow } from "@/features/search/components/resource-card/resource-list-row";
import type { JudgmentResult, ResourceCard } from "@/lib/api/model";

interface CustomCardProps {
  index: number;
  resource: ResourceCard;
  judgment?: JudgmentResult | null;
  action?: React.ReactNode;
}

export function CustomCard({ index, resource, judgment, action }: CustomCardProps) {
  const meta = resource.metadata as { domain?: string };

  const contentNode = (
    <>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-base font-semibold text-slate-900 border-b border-transparent hover:border-slate-400 max-w-fit transition-colors leading-snug truncate"
      >
        <LinkIcon className="mr-1.5 inline h-4 w-4 text-slate-500" />
        {resource.title}
        <ExternalLink className="ml-1.5 inline h-3 w-3 text-slate-400" />
      </a>
      <div className="flex flex-col gap-3 sm:flex-row mt-1">
        {!!resource.thumbnail_url && (
          // biome-ignore lint/performance/noImgElement: external dynamic thumbnail URL
          <img
            src={resource.thumbnail_url}
            alt={resource.title}
            className="w-full shrink-0 rounded object-cover sm:h-20 sm:w-36 border border-slate-100"
          />
        )}
        <div className="space-y-1">
          <p className="text-muted-foreground line-clamp-3 leading-relaxed">{resource.snippet}</p>
          {!!meta.domain && <p className="text-xs font-medium text-slate-400">{meta.domain}</p>}
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
