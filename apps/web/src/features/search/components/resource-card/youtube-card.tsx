import { ExternalLink, Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RelevanceIndicator } from "@/features/search/components/resource-card/relevance-indicator";
import type { JudgmentResult, ResourceCard } from "@/lib/api/model";

interface YoutubeCardProps {
  resource: ResourceCard;
  judgment?: JudgmentResult | null;
  action?: React.ReactNode;
}

export function YoutubeCard({ resource, judgment, action }: YoutubeCardProps) {
  const t = useTranslations("search");
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
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="border-red-200 text-red-700">
              {t("tabs.video")}
            </Badge>
            {action}
          </div>
        </div>
        {!!meta.channel && <p className="text-xs text-muted-foreground">{meta.channel}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          {!!resource.thumbnail_url && (
            <img
              src={resource.thumbnail_url}
              alt={resource.title}
              className="w-full shrink-0 rounded object-cover sm:h-20 sm:w-36"
            />
          )}
          <p className="text-sm text-muted-foreground line-clamp-3">{resource.snippet}</p>
        </div>
        <RelevanceIndicator
          verdict={resource.verdict}
          reason={resource.relevance_reason}
          judgment={judgment}
        />
      </CardContent>
    </Card>
  );
}
