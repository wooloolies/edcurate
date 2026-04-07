"use client";

import { ChevronDown, ChevronUp, Globe, GraduationCap, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { GeneratedSearchQueries } from "@/lib/api/model";

const PROVIDER_CONFIG = {
  ddgs: { icon: Globe, key: "ddgs" as const },
  youtube: { icon: Play, key: "youtube" as const },
  openalex: { icon: GraduationCap, key: "openalex" as const },
} as const;

interface GeneratedQueriesProps {
  queries: GeneratedSearchQueries;
}

export function GeneratedQueriesPanel({ queries }: GeneratedQueriesProps) {
  const t = useTranslations("search.generatedQueries");
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50">
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
        {t("title")}
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 rounded-md border bg-muted/30 px-4 py-3">
        <div className="space-y-2">
          {Object.entries(PROVIDER_CONFIG).map(([provider, { icon: Icon, key }]) => {
            const providerQueries = queries[key];
            if (!providerQueries || providerQueries.length === 0) return null;
            return (
              <div key={provider} className="flex items-start gap-2">
                <div className="flex shrink-0 items-center gap-1.5 pt-0.5 text-xs font-medium text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  {t(key)}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {providerQueries.map((q) => (
                    <Badge key={q} variant="secondary" className="font-normal">
                      {q}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
