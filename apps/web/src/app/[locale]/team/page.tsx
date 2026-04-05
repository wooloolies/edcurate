import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/routing";

interface TeamPageProps {
  params: Promise<{ locale: string }>;
}

const members = [
  {
    name: "Stephen Pan",
    github: "Vnyl",
    avatar: "https://avatars.githubusercontent.com/u/203847401?v=4",
    email: "Feihong.Pan-1@student.uts.edu.au",
  },
  {
    name: "Tinnapat Plangsri",
    github: "tintinap",
    avatar: "https://avatars.githubusercontent.com/u/31465850?v=4",
    email: "Tinnapat.Plangsri@student.uts.edu.au",
  },
  {
    name: "VanAn Hoang",
    github: "EthAnHoangg",
    avatar: "https://avatars.githubusercontent.com/u/96238764?v=4",
    email: "VanAn.Hoang@student.uts.edu.au",
  },
  {
    name: "Eunkwang Shin",
    github: "gracefullight",
    avatar: "https://avatars.githubusercontent.com/u/11773683?v=4",
    email: "Eunkwang.Shin@student.uts.edu.au",
  },
];

export default async function TeamPage({ params }: TeamPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("team");

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold">
            Edcurate
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild size="sm" variant="ghost">
              <Link href="/">{t("backToHome")}</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-28 pb-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t("subtitle")}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("description")}</p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member) => (
            <a
              key={member.github}
              href={`https://github.com/${member.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center rounded-xl border bg-card p-6 transition-colors hover:border-primary/20 hover:bg-accent"
            >
              <img
                src={member.avatar}
                alt={member.name}
                width={96}
                height={96}
                className="rounded-full"
              />
              <h2 className="mt-4 text-lg font-semibold">{member.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">@{member.github}</p>
            </a>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          University of Technology Sydney (UTS)
        </p>
      </main>
    </>
  );
}
