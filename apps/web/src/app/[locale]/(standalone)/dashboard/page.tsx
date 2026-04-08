"use client";

import { DateTime } from "luxon";
import { useTranslations } from "next-intl";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CanvasBackground } from "@/components/ui/canvas-background";
import { useListPresetsApiPresetsGet } from "@/lib/api/presets/presets";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { data } = useListPresetsApiPresetsGet();
  const presets = data?.data ?? [];

  const todayStart = DateTime.now().startOf("day");
  const todayCount = presets.filter((p) => DateTime.fromISO(p.created_at) >= todayStart).length;

  return (
    <div className="relative min-h-screen bg-brand-surface overflow-hidden text-brand-ink font-sans">
      <CanvasBackground />
      <Header />
      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-16">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">{t("title")}</h1>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("presetsToday", { count: todayCount })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{todayCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("presetsTotal", { count: presets.length })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{presets.length}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
