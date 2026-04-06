import { ExternalLink, Link as LinkIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RelevanceIndicator } from "@/features/search/components/resource-card/relevance-indicator";
import type { AdversarialReviewResult, ResourceCard } from "@/lib/api/model";

interface CustomCardProps {
  resource: ResourceCard;
  adversarial?: AdversarialReviewResult | null;
  action?: React.ReactNode;
}

export function CustomCard({ resource, adversarial, action }: CustomCardProps) {
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
              <LinkIcon className="mr-1.5 inline h-4 w-4 text-muted-foreground" />
              {resource.title}
              <ExternalLink className="ml-1 inline h-3 w-3" />
            </a>
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary">Custom</Badge>
            {action}
          </div>
        </div>
        {!!meta.domain && <p className="text-xs text-muted-foreground">{meta.domain}</p>}
      </CardHeader>
      <CardContent>
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
          score={resource.relevance_score}
          reason={resource.relevance_reason}
          details={resource.evaluation_details}
          adversarial={adversarial}
        />
      </CardContent>
    </Card>
  );
}
