import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { SourceError } from "@/lib/api/model";

interface ErrorBannerProps {
  errors: SourceError[];
}

export function ErrorBanner({ errors }: ErrorBannerProps) {
  if (errors.length === 0) return null;

  return (
    <Alert variant="destructive" role="alert">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {errors.map((err) => (
          <span key={err.source} className="block">
            {err.source}: {err.message}
          </span>
        ))}
      </AlertDescription>
    </Alert>
  );
}
