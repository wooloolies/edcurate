import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { SearchPageClient } from "@/features/search/components/search-page-client";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function SearchPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <SearchPageClient />;
}
