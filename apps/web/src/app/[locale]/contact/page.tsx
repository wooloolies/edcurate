"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Mail, MapPin } from "lucide-react";
import { Header } from "@/components/layout/header";
import { CanvasBackground } from "@/components/ui/canvas-background";

const teamContacts = [
  {
    name: "Stephen Pan",
    email: "Feihong.Pan-1@student.uts.edu.au",
    github: "Vnyl",
  },
  {
    name: "Tinnapat Plangsri",
    email: "Tinnapat.Plangsri@student.uts.edu.au",
    github: "tintinap",
  },
  {
    name: "VanAn Hoang",
    email: "VanAn.Hoang@student.uts.edu.au",
    github: "EthAnHoangg",
  },
  {
    name: "Eunkwang Shin",
    email: "Eunkwang.Shin@student.uts.edu.au",
    github: "gracefullight",
  },
];

export default function ContactPage() {
  const t = useTranslations("contact");
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const title = encodeURIComponent(`[Contact] ${formState.name}`);
    const body = encodeURIComponent(
      `**From:** ${formState.name} (${formState.email})\n\n---\n\n${formState.message}`
    );
    window.open(
      `https://github.com/wooloolies/edcurate/issues/new?title=${title}&body=${body}&labels=contact`,
      "_blank"
    );
    setSubmitted(true);
  }

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] overflow-hidden text-[#111827] font-sans">
      <CanvasBackground />
      <Header />

      <main className="relative z-10 mx-auto max-w-5xl px-4 pt-32 pb-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-lg text-gray-500">{t("subtitle")}</p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          {/* Contact form */}
          <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-xl p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#B7FF70]/20">
                  <Mail className="h-6 w-6 text-[#111827]" />
                </div>
                <h3 className="text-lg font-semibold">{t("thankYou")}</h3>
                <p className="mt-2 text-sm text-gray-500">{t("thankYouDescription")}</p>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setFormState({ name: "", email: "", message: "" }); }}
                  className="mt-6 text-sm font-medium text-gray-500 hover:text-black transition-colors"
                >
                  {t("sendAnother")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("nameLabel")}
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                    placeholder={t("namePlaceholder")}
                    className="w-full rounded-lg border border-black/10 bg-white/80 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black/20 focus:ring-0"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("emailLabel")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                    placeholder={t("emailPlaceholder")}
                    className="w-full rounded-lg border border-black/10 bg-white/80 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black/20 focus:ring-0"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("messageLabel")}
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formState.message}
                    onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                    placeholder={t("messagePlaceholder")}
                    className="w-full resize-none rounded-lg border border-black/10 bg-white/80 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black/20 focus:ring-0"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-[2rem] bg-[#B7FF70] px-6 py-2.5 text-sm font-semibold text-[#111827] transition-all hover:bg-[#111827] hover:text-white shadow-sm"
                >
                  {t("send")}
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-6">
            <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold">{t("location")}</h3>
              </div>
              <p className="text-sm text-gray-500">University of Technology Sydney (UTS)</p>
              <p className="text-sm text-gray-500">15 Broadway, Ultimo NSW 2007, Australia</p>
            </div>

            <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold">{t("teamEmails")}</h3>
              </div>
              <div className="space-y-3">
                {teamContacts.map((member) => (
                  <div key={member.github} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{member.name}</span>
                    <a
                      href={`mailto:${member.email}`}
                      className="text-sm text-gray-500 hover:text-black transition-colors"
                    >
                      {member.email}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
