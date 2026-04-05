import { ExternalLink, Globe } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RelevanceIndicator } from "@/features/search/components/resource-card/relevance-indicator";
import type { ResourceCard } from "@/lib/api/model";

interface DdgsCardProps {
  resource: ResourceCard;
}

export function DdgsCard({ resource }: DdgsCardProps) {
  const meta = resource.metadata as { domain?: string };
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
              <Globe className="mr-1.5 inline h-4 w-4 text-muted-foreground" />
              {resource.title}
              <ExternalLink className="ml-1 inline h-3 w-3" />
            </a>
          </CardTitle>
          <Badge variant="outline" className="shrink-0">
            DDGS
          </Badge>
        </div>
        {meta.domain && <p className="text-xs text-muted-foreground">{meta.domain}</p>}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{resource.snippet}</p>
        <RelevanceIndicator
          score={resource.relevance_score}
          reason={resource.relevance_reason}
          details={resource.evaluation_details}
        />
      </CardContent>
    </Card>
  );
}
