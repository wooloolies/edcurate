import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { PresetListClient } from "@/features/presets/components/preset-list-client";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function PresetsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <PresetListClient />;
}
