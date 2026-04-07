import { BookOpen, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { VerdictBadge } from "@/features/search/components/resource-card/relevance-indicator";
import { ResourceListRow } from "@/features/search/components/resource-card/resource-list-row";
import type { ResourceCard } from "@/lib/api/model";

interface OpenAlexCardProps {
  index: number;
  resource: ResourceCard;
  action?: React.ReactNode;
  isEvaluating?: boolean;
}

export function OpenAlexCard({ index, resource, action, isEvaluating }: OpenAlexCardProps) {
  const t = useTranslations("search");

  const meta = resource.metadata as {
    authors?: string[];
    journal?: string | null;
    citation_count?: number | null;
    doi?: string | null;
    published_date?: string | null;
  };

  const contentNode = (
    <div className="flex items-start gap-2.5">
      <BookOpen className="h-4 w-4 shrink-0 text-blue-500 mt-1" />
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
        <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground font-medium">
          {meta.authors && meta.authors.length > 0 && (
            <span>{meta.authors.slice(0, 3).join(", ")}</span>
          )}
          {!!meta.journal && <span>&middot; {meta.journal}</span>}
          {!!meta.published_date && <span>&middot; {meta.published_date.slice(0, 4)}</span>}
          {meta.citation_count != null && (
            <span className="text-slate-500">
              &middot; {meta.citation_count} {t("card.citations")}
            </span>
          )}
        </div>
        {!!meta.doi && (
          <a
            href={meta.doi}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-600 hover:underline inline-flex items-center w-fit"
          >
            DOI
          </a>
        )}
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
