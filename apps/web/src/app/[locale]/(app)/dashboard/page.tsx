"use client";

import { Plus, Search } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListPresetsApiPresetsGet } from "@/lib/api/presets/presets";
import { Link } from "@/lib/i18n/routing";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tPresets = useTranslations("presets");
  const tNav = useTranslations("nav");
  const { data } = useListPresetsApiPresetsGet();
  const presets = data?.data ?? [];

  const todayStart = DateTime.now().startOf("day");
  const todayCount = presets.filter((p) => DateTime.fromISO(p.created_at) >= todayStart).length;

  return (
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

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("quickActions")}</h2>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/collections/new">
              <Plus className="mr-1 h-4 w-4" />
              {tPresets("newPreset")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/search">
              <Search className="mr-1 h-4 w-4" />
              {tNav("search")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
