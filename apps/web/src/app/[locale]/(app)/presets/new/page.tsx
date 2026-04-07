import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { PresetFormClient } from "@/features/presets/components/preset-form-client";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function NewPresetPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <PresetFormClient />;
}
