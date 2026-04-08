import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { PresetFormClient } from "@/features/presets/components/preset-form-client";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditPresetPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  return <PresetFormClient presetId={id} />;
}
