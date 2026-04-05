import { redirect } from "next/navigation";

import { routing } from "@/lib/i18n/routing";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  redirect(
    locale === routing.defaultLocale ? "/dashboard/presets" : `/${locale}/dashboard/presets`
  );
}
