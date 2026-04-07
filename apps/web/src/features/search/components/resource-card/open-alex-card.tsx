import { BookOpen, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import { ResourceListRow } from "@/features/search/components/resource-card/resource-list-row";
import { VerdictBadge, RelevanceDetails } from "@/features/search/components/resource-card/relevance-indicator";
import type { JudgmentResult, ResourceCard } from "@/lib/api/model";

interface OpenAlexCardProps {
  index: number;
  resource: ResourceCard;
  judgment?: JudgmentResult | null;
  action?: React.ReactNode;
}

export function OpenAlexCard({ index, resource, judgment, action }: OpenAlexCardProps) {
  const t = useTranslations("search");

  const meta = resource.metadata as {
    authors?: string[];
    journal?: string | null;
    citation_count?: number | null;
    doi?: string | null;
    published_date?: string | null;
  };

  const contentNode = (
    <>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-base font-semibold text-slate-900 border-b border-transparent hover:border-slate-400 max-w-fit transition-colors leading-snug truncate"
      >
        <BookOpen className="mr-1.5 inline h-4 w-4 text-blue-500" />
        {resource.title}
        <ExternalLink className="ml-1.5 inline h-3 w-3 text-slate-400" />
      </a>
      
      <div className="flex flex-wrap gap-x-2 mt-1 text-xs text-muted-foreground font-medium">
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
          className="text-xs text-slate-400 hover:text-slate-600 hover:underline inline-flex items-center mt-1 w-fit"
        >
          DOI
        </a>
      )}
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
