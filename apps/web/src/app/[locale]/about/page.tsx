import Image from "next/image";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { CanvasBackground } from "@/components/ui/canvas-background";

interface AboutPageProps {
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

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("team");

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] overflow-hidden text-[#111827] font-sans">
      <CanvasBackground />
      <Header />

      <main className="relative z-10 mx-auto max-w-5xl px-4 pt-32 pb-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-lg text-gray-500">{t("subtitle")}</p>
          <p className="mx-auto mt-4 max-w-2xl text-gray-500">{t("description")}</p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member) => (
            <a
              key={member.github}
              href={`https://github.com/${member.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center rounded-xl border border-black/5 bg-white/60 backdrop-blur-xl p-6 transition-all hover:border-black/10 hover:shadow-lg"
            >
              <Image
                src={member.avatar}
                alt={member.name}
                width={96}
                height={96}
                className="rounded-full"
              />
              <h2 className="mt-4 text-lg font-semibold">{member.name}</h2>
              <p className="mt-1 text-sm text-gray-500">@{member.github}</p>
            </a>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-2 text-sm text-gray-400">
          <p>University of Technology Sydney (UTS)</p>
          <a
            href="https://github.com/wooloolies/edcurate"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
          >
            github.com/wooloolies/edcurate
          </a>
        </div>
      </main>
    </div>
  );
}
