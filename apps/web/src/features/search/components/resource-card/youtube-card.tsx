import { ExternalLink, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RelevanceIndicator } from "@/features/search/components/resource-card/relevance-indicator";
import type { ResourceCard } from "@/lib/api/model";

interface YoutubeCardProps {
  resource: ResourceCard;
}

export function YoutubeCard({ resource }: YoutubeCardProps) {
  const meta = resource.metadata as {
    channel?: string;
    duration?: string;
    view_count?: number;
    published_date?: string;
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
              <Play className="mr-1.5 inline h-4 w-4 text-red-500" />
              {resource.title}
              <ExternalLink className="ml-1 inline h-3 w-3" />
            </a>
          </CardTitle>
          <Badge variant="outline" className="shrink-0 border-red-200 text-red-700">
            YouTube
          </Badge>
        </div>
        {meta.channel && <p className="text-xs text-muted-foreground">{meta.channel}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-3">
          {resource.thumbnail_url && (
            <img
              src={resource.thumbnail_url}
              alt={resource.title}
              className="h-20 w-36 shrink-0 rounded object-cover"
            />
          )}
          <p className="text-sm text-muted-foreground line-clamp-3">{resource.snippet}</p>
        </div>
        <RelevanceIndicator
          score={resource.relevance_score}
          reason={resource.relevance_reason}
          details={resource.evaluation_details}
        />
      </CardContent>
    </Card>
  );
}
