import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { SourceError } from "@/lib/api/model";

interface ErrorBannerProps {
  errors: SourceError[];
}

export function ErrorBanner({ errors }: ErrorBannerProps) {
  const t = useTranslations("search");

  if (errors.length === 0) return null;

  const sourceLabel = (source: SourceError["source"]) => {
    if (source === "ddgs") return t("tabs.web");
    if (source === "youtube") return t("tabs.video");
    return t("tabs.papers");
  };

  return (
    <Alert variant="destructive" role="alert">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <span className="mb-2 block font-medium">{t("partialError")}</span>
        {errors.map((err) => (
          <span key={err.source} className="block">
            {sourceLabel(err.source)}: {err.message}
          </span>
        ))}
      </AlertDescription>
    </Alert>
  );
}
