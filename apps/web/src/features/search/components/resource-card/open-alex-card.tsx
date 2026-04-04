import { BookOpen, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResourceCard } from "@/lib/api/model";

interface OpenAlexCardProps {
  resource: ResourceCard;
}

export function OpenAlexCard({ resource }: OpenAlexCardProps) {
  const meta = resource.metadata as {
    authors?: string[];
    journal?: string | null;
    citation_count?: number | null;
    doi?: string | null;
    published_date?: string | null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              <BookOpen className="mr-1.5 inline h-4 w-4 text-blue-500" />
              {resource.title}
              <ExternalLink className="ml-1 inline h-3 w-3" />
            </a>
          </CardTitle>
          <Badge variant="outline" className="shrink-0 border-blue-200 text-blue-700">
            OpenAlex
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          {meta.authors && meta.authors.length > 0 && (
            <span>{meta.authors.slice(0, 3).join(", ")}</span>
          )}
          {meta.journal && <span>&middot; {meta.journal}</span>}
          {meta.published_date && <span>&middot; {meta.published_date.slice(0, 4)}</span>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {meta.citation_count != null && (
            <span className="font-medium">{meta.citation_count} citations</span>
          )}
          {meta.doi && (
            <a
              href={meta.doi}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:underline"
            >
              DOI
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
