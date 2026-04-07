import { ExternalLink, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import { ResourceListRow } from "@/features/search/components/resource-card/resource-list-row";
import { VerdictBadge } from "@/features/search/components/resource-card/relevance-indicator";
import type { ResourceCard } from "@/lib/api/model";

interface CustomCardProps {
  index: number;
  resource: ResourceCard;
  action?: React.ReactNode;
}

export function CustomCard({ index, resource, action }: CustomCardProps) {
  const meta = resource.metadata as { domain?: string };

  const contentNode = (
    <div className="flex items-start gap-2.5">
      <LinkIcon className="h-4 w-4 shrink-0 text-slate-500 mt-1" />
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
        {!!resource.thumbnail_url && (
          <Image
            src={resource.thumbnail_url}
            alt={resource.title}
            width={320}
            height={180}
            sizes="(max-width: 640px) 100vw, 320px"
            className="w-full max-w-xs rounded-lg object-cover border border-slate-100"
          />
        )}
        <div className="space-y-1">
          <p className="text-muted-foreground line-clamp-3 leading-relaxed">{resource.snippet}</p>
          {!!meta.domain && <p className="text-xs font-medium text-slate-400">{meta.domain}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <ResourceListRow
      index={index}
      verdictNode={<VerdictBadge verdict={resource.verdict} />}
      contentNode={contentNode}
      actionsNode={action}
    />
  );
}
