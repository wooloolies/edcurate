"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MathMarkdown } from "@/components/ui/math-markdown";

interface SummaryData {
  summary: string;
}

interface SummaryViewerProps {
  data: SummaryData;
}

export function SummaryViewer({ data }: SummaryViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MathMarkdown>{data.summary}</MathMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
