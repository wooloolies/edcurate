import { getTranslations } from "next-intl/server";

import { LibraryPageClient } from "@/features/library/components/library-page-client";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: t("library"),
    description: "Your saved educational resources library",
  };
}

export default function LibraryPage() {
  return <LibraryPageClient />;
}
