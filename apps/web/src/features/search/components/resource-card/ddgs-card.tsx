import { ExternalLink, Globe } from "lucide-react";

import { ResourceListRow } from "@/features/search/components/resource-card/resource-list-row";
import { VerdictBadge } from "@/features/search/components/resource-card/relevance-indicator";
import type { ResourceCard } from "@/lib/api/model";

interface DdgsCardProps {
  index: number;
  resource: ResourceCard;
  action?: React.ReactNode;
  isEvaluating?: boolean;
}

export function DdgsCard({ index, resource, action, isEvaluating }: DdgsCardProps) {
  const meta = resource.metadata as { domain?: string };

  const contentNode = (
    <div className="flex items-start gap-2.5">
      <Globe className="h-4 w-4 shrink-0 text-slate-500 mt-1" />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-base font-semibold text-slate-900 border-b border-transparent hover:border-slate-400 max-w-fit transition-colors leading-snug truncate"
        >
          {resource.title}
          <ExternalLink className="ml-1.5 inline h-3 w-3 text-slate-400" />
        </a>
        <p className="text-muted-foreground line-clamp-2 leading-relaxed">
          {resource.snippet}
        </p>
        {!!meta.domain && <p className="text-xs font-medium text-slate-400">{meta.domain}</p>}
      </div>
    </div>
  );

  return (
    <ResourceListRow
      index={index}
      verdictNode={<VerdictBadge verdict={resource.verdict} isEvaluating={isEvaluating} />}
      contentNode={contentNode}
      actionsNode={action}
    />
  );
}
