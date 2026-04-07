import { ExternalLink, Globe } from "lucide-react";
import { useTranslations } from "next-intl";

import { ResourceListRow } from "@/features/search/components/resource-card/resource-list-row";
import { VerdictBadge, RelevanceDetails } from "@/features/search/components/resource-card/relevance-indicator";
import type { JudgmentResult, ResourceCard } from "@/lib/api/model";

interface DdgsCardProps {
  index: number;
  resource: ResourceCard;
  judgment?: JudgmentResult | null;
  action?: React.ReactNode;
}

export function DdgsCard({ index, resource, judgment, action }: DdgsCardProps) {
  const t = useTranslations("search");
  const meta = resource.metadata as { domain?: string };

  const contentNode = (
    <>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-base font-semibold text-slate-900 border-b border-transparent hover:border-slate-400 max-w-fit transition-colors leading-snug truncate"
      >
        <Globe className="mr-1.5 inline h-4 w-4 text-slate-500" />
        {resource.title}
        <ExternalLink className="ml-1.5 inline h-3 w-3 text-slate-400" />
      </a>
      <p className="text-muted-foreground line-clamp-2 leading-relaxed">
        {resource.snippet}
      </p>
      {!!meta.domain && <p className="text-xs font-medium text-slate-400">{meta.domain}</p>}
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
