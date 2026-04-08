"use client";

import { ChevronDown, ChevronRight, Copyright, Plus, Search, X } from "lucide-react";
import { useLocale } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";

const LOCALE_COUNTRY: Record<string, string> = {
  en: "Australia",
  ko: "Korea",
  zh: "China",
  th: "Thailand",
  vi: "Vietnam",
};

interface SourceEngine {
  id: string;
  label: string;
  color: string;
}

const ALL_ENGINES: SourceEngine[] = [
  { id: "ddgs", label: "DuckDuckGo", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { id: "youtube", label: "YouTube", color: "bg-red-100 text-red-700 border-red-200" },
  { id: "openalex", label: "OpenAlex", color: "bg-blue-100 text-blue-700 border-blue-200" },
];

const DEFAULT_ACTIVE = ["ddgs", "youtube", "openalex"];

interface SubjectCategory {
  subject: string;
  topics: string[];
}

const SUBJECT_CATEGORIES: SubjectCategory[] = [
  { subject: "English", topics: ["Grammar", "Speaking", "Reading", "Writing", "Literature"] },
  { subject: "Maths", topics: ["Probability", "Algebra", "Geometry", "Statistics", "Calculus"] },
  { subject: "Science", topics: ["Physics", "Chemistry", "Biology", "Earth Science"] },
  { subject: "History", topics: ["Ancient", "Modern", "World Wars", "Civilisations"] },
  { subject: "Geography", topics: ["Climate", "Mapping", "Urbanisation", "Resources"] },
];

export function SourceSelector() {
  const [active, setActive] = useState<string[]>(DEFAULT_ACTIVE);

  const activeEngines = ALL_ENGINES.filter((e) => active.includes(e.id));
  const inactiveEngines = ALL_ENGINES.filter((e) => !active.includes(e.id));
  const pct = active.length > 0 ? Math.round(100 / active.length) : 0;

  function remove(id: string) {
    setActive((prev) => (prev.length <= 1 ? prev : prev.filter((eid) => eid !== id)));
  }

  function add(id: string) {
    setActive((prev) => [...prev, id]);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {activeEngines.map((engine) => (
        <button
          key={engine.id}
          type="button"
          onClick={() => remove(engine.id)}
          className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all hover:scale-105 active:scale-95 ${engine.color}`}
        >
          <Search className="size-3.5" />
          {engine.label}
          <span className="text-[11px] font-bold opacity-60">{pct}%</span>
          <X className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}

      {inactiveEngines.map((engine) => (
        <button
          key={engine.id}
          type="button"
          onClick={() => add(engine.id)}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 bg-white/60 px-4 py-2 text-sm font-medium text-slate-400 transition-all hover:border-slate-400 hover:text-slate-600 hover:scale-105 active:scale-95"
        >
          <Plus className="size-3.5" />
          {engine.label}
        </button>
      ))}
    </div>
  );
}

// --- Scroll-reveal wrapper ---
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// --- Audience statements ---
const AUDIENCE_STATEMENTS = [
  {
    heading: "Built for Year 7–12 classrooms",
    body: "Every resource is evaluated against your specific year level, subject area, and curriculum standard — not a generic relevance score.",
    placeholder: false,
  },
  {
    heading: "Designed with curriculum designers in mind",
    body: "Transparent evaluation criteria let you inspect exactly why a resource was recommended, so you can trust the results you share with your team.",
    placeholder: true,
  },
  {
    heading: "Trusted by educators internationally",
    body: "Supporting multiple curricula and languages, Edcurate adapts to how teachers work across different educational systems worldwide.",
    placeholder: true,
  },
];

export function AudienceStatements() {
  return (
    <div className="space-y-24 md:space-y-32">
      {AUDIENCE_STATEMENTS.map((item, i) => (
        <ScrollReveal key={item.heading} delay={i * 100}>
          <div className="max-w-3xl mx-auto text-center">
            {item.placeholder ? (
              <span className="inline-block mb-3 rounded-full border border-dashed border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Placeholder
              </span>
            ) : null}
            <h3
              className={`text-3xl md:text-[2.5rem] font-bold tracking-tight leading-[1.1] ${item.placeholder ? "text-slate-300" : "text-[#111827]"}`}
            >
              {item.heading}
            </h3>
            <p
              className={`mt-5 text-base md:text-lg leading-relaxed max-w-xl mx-auto ${item.placeholder ? "text-slate-300" : "text-slate-500"}`}
            >
              {item.body}
            </p>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}

function SubjectColumn({ category }: { category: SubjectCategory }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-2 cursor-pointer group w-full"
      >
        <span className="text-[15px] md:text-base font-bold text-[#111827] truncate group-hover:underline">
          {category.subject}
        </span>
        {expanded ? (
          <ChevronDown className="size-3.5 shrink-0 text-[#111827]" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-[#111827]" />
        )}
      </button>

      {expanded ? (
        <div className="mt-2 space-y-1">
          {category.topics.map((topic) => (
            <p
              key={topic}
              className="text-[13px] md:text-sm text-[#111827]/60 font-medium leading-snug"
            >
              {topic}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SubjectBanner() {
  const locale = useLocale();
  const country = LOCALE_COUNTRY[locale] ?? "Australia";

  return (
    <section className="relative w-full rounded-[2rem] bg-[#B7FF70] px-8 py-8 md:px-12 md:py-10 shadow-lg overflow-hidden">
      {/* Header row with divider */}
      <div className="flex items-baseline justify-between pb-4 border-b-2 border-[#111827]">
        <span className="text-xl md:text-2xl font-bold tracking-tight text-[#111827]">
          <span className="text-blue-600">Ed</span>curate
        </span>
        <span className="text-base md:text-lg font-bold text-[#111827]">{country}</span>
      </div>

      {/* Subject categories — horizontal row */}
      <div className="mt-6 flex gap-6 md:gap-8">
        {SUBJECT_CATEGORIES.map((cat) => (
          <SubjectColumn key={cat.subject} category={cat} />
        ))}
      </div>

      {/* Copyright footer */}
      <div className="mt-10 flex items-center justify-center gap-2 text-sm font-semibold text-[#111827]">
        <Copyright className="size-4" />
        <span>Copyright Wooloolies 2026</span>
      </div>
    </section>
  );
}
