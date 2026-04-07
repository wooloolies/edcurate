import { ExternalLink, Globe, Play, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { BackButton } from "./back-button";

interface OverviewPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const SOURCE_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  youtube: { label: "Video", icon: <Play className="h-3.5 w-3.5" />, className: "bg-red-50 text-red-700 border-red-200" },
  ddgs: { label: "Web", icon: <Globe className="h-3.5 w-3.5" />, className: "bg-slate-50 text-slate-700 border-slate-200" },
  openalex: { label: "Paper", icon: <BookOpen className="h-3.5 w-3.5" />, className: "bg-blue-50 text-blue-700 border-blue-200" },
  general: { label: "Web", icon: <Globe className="h-3.5 w-3.5" />, className: "bg-slate-50 text-slate-700 border-slate-200" },
};

const VERDICT_CONFIG: Record<string, { label: string; className: string }> = {
  use_it: { label: "Use it", className: "text-emerald-800 bg-emerald-50 border-emerald-200" },
  adapt_it: { label: "Adapt it", className: "text-amber-900 bg-amber-50 border-amber-200" },
  skip_it: { label: "Skip it", className: "text-red-800 bg-red-50 border-red-200" },
};

function StatusDot({ rating }: { rating: "strong" | "adequate" | "weak" }) {
  if (rating === "strong") {
    return (
      <span className="relative flex h-5 w-5 shrink-0">
        <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#f87171,#facc15,#4ade80,#60a5fa,#a78bfa,#f472b6,#f87171)] animate-spin" style={{ animationDuration: "4s" }} />
        <span className="relative m-[2px] rounded-full bg-white flex-1" />
      </span>
    );
  }
  if (rating === "adequate") {
    return <span className="h-5 w-5 shrink-0 rounded-full bg-amber-400 border-2 border-amber-300" />;
  }
  return <span className="h-5 w-5 shrink-0 rounded-full bg-red-500 border-2 border-red-400" />;
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const resolvedParams = await searchParams;
  const title = resolvedParams.title as string ?? "Resource Overview";
  const type = resolvedParams.type as string ?? "general";
  const verdict = resolvedParams.verdict as string ?? "";

  const source = SOURCE_CONFIG[type] ?? SOURCE_CONFIG.general;
  const verdictInfo = verdict ? VERDICT_CONFIG[verdict] : null;

  return (
    <div className="min-h-dvh bg-background text-foreground font-sans flex flex-col">
      <Header />

      <main className="flex-1 mt-32 max-w-[90rem] mx-auto w-full px-6 md:px-10 pb-20">

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:scale-105 transition-all"
                title="Open original resource"
              >
                <ExternalLink className="h-4 w-4 text-slate-500" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full px-6 py-2.5 text-sm font-bold shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 text-white border-0 bg-black btn-rainbow-hover"
            >
              Save
            </button>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold ${source.className}`}>
                {source.icon}
                {source.label}
              </div>
              {verdictInfo && (
                <div className={`flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${verdictInfo.className}`}>
                  {verdictInfo.label}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Article Title */}
        <p className="text-xl text-gray-500 mb-8 pl-14">{title}</p>

        {/* Row 1: Abstract + Reasoning */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <section className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-white/80">
            <h2 className="text-2xl font-bold mb-4 text-[#111827]">Abstract</h2>
            <p className="text-[#111827]/70 text-base leading-relaxed">
              This resource provides a comprehensive overview of the subject matter, detailing the fundamental principles and their practical applications. It is particularly suited for educators looking to integrate modern methodologies into their curriculum design while maintaining rigorous academic standards.
            </p>
          </section>

          <section className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-white/80">
            <h2 className="text-2xl font-bold mb-4 text-[#111827]">Reasoning</h2>
            <p className="text-[#111827]/70 text-base leading-relaxed">
              The resource was evaluated for its direct applicability to classroom contexts. Its structure supports scaffolded learning, and the content density is appropriate for the target year level. The pedagogical approach aligns with inquiry-based learning frameworks widely adopted in current curriculum standards.
            </p>
          </section>
        </div>

        {/* Row 2: Evaluation Metrics */}
        <section className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-white/80 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-[#111827]">Evaluation</h2>
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <StatusDot rating="strong" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-[#111827]">Curriculum Fit</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">Highly aligned with standard curriculum benchmarks. The resource directly addresses syllabus outcomes and supports competency-based learning objectives.</p>
              </div>
            </div>
            <div className="border-t border-slate-100" />
            <div className="flex items-start gap-4">
              <StatusDot rating="adequate" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-[#111827]">Accessibility</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">Adequate for most learners. Some sections may require pre-teaching of vocabulary for EAL/D students. Built-in differentiation supports mixed-ability cohorts.</p>
              </div>
            </div>
            <div className="border-t border-slate-100" />
            <div className="flex items-start gap-4">
              <StatusDot rating="strong" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-[#111827]">Trustworthiness</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">Published by a reputable educational institution with peer-reviewed methodology. No factual errors or bias detected during evaluation.</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <StatusDot rating="strong" />
              <span>Best fit</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <StatusDot rating="adequate" />
              <span>Requires adjustment</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <StatusDot rating="weak" />
              <span>Not recommended</span>
            </div>
          </div>
        </section>

        {/* Row 3: Advantages + Disadvantages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <section className="bg-[#B7FF70]/20 rounded-[2rem] p-8 border border-[#B7FF70]/50">
            <h3 className="font-bold text-xl text-emerald-950 mb-4">Advantages</h3>
            <ul className="list-disc pl-5 text-emerald-900 space-y-2.5 text-base">
              <li>Highly aligned with standard curriculum benchmarks and competencies</li>
              <li>Engaging and interactive content formats tailored for modern classrooms</li>
              <li>Clear differentiation options for diverse learner profiles</li>
            </ul>
          </section>

          <section className="bg-rose-50 rounded-[2rem] p-8 border border-rose-100">
            <h3 className="font-bold text-xl text-rose-950 mb-4">Disadvantages</h3>
            <ul className="list-disc pl-5 text-rose-900 space-y-2.5 text-base">
              <li>May require prior foundational subject knowledge from students</li>
              <li>Some examples included are culturally specific and may lack international relevance</li>
            </ul>
          </section>
        </div>

        {/* Row 4: Adaptation */}
        <section className="bg-[#111827] text-white rounded-[2rem] p-8 shadow-md mb-6">
          <h3 className="font-bold text-xl text-[#B7FF70] mb-4">Adaptation Advice</h3>
          <p className="text-white/90 text-base leading-relaxed">
            Consider pre-teaching core vocabulary before introducing this resource to the class. For international classrooms, it is strictly recommended to supplement the culturally specific examples with local equivalents to ensure relatability and context retention among students.
          </p>
        </section>

        {/* Row 5: Verify Panel + Evidence */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Verify Panel */}
          <section className="lg:col-span-2 bg-amber-50/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-amber-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <h2 className="text-2xl font-bold text-[#111827]">Verify</h2>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              Automated evidence extraction cross-referenced against your classroom preset.
            </p>
            <div className="bg-white/80 rounded-xl p-4 border border-amber-100 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Our standard</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Each resource is assessed against three core dimensions derived from educational best practice and your preset context.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-white rounded-full text-[11px] font-semibold text-slate-600 border border-slate-200">Curriculum Fit</span>
                <span className="px-2.5 py-1 bg-white rounded-full text-[11px] font-semibold text-slate-600 border border-slate-200">Accessibility</span>
                <span className="px-2.5 py-1 bg-white rounded-full text-[11px] font-semibold text-slate-600 border border-slate-200">Trustworthiness</span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-amber-100">
              <p className="text-xs text-slate-400 leading-relaxed">
                Quotes are extracted verbatim from the source material, then cross-referenced against your classroom preset. No content is paraphrased or generated.
              </p>
            </div>
          </section>

          {/* Evidence Panel */}
          <section className="lg:col-span-3 bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-white/80">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#111827]">Evidence</h2>
              <div className="flex items-center gap-2">
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>
                <span className="text-xs font-medium text-slate-400 tabular-nums">1 / 3</span>
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-700 uppercase">Curriculum Fit</span>
                  <span className="text-[11px] text-slate-400 font-medium">Strong</span>
                </div>
                <blockquote className="border-l-4 border-[#111827] pl-5 italic text-gray-800 text-base leading-relaxed font-serif">
                  "The integration of context-aware examples improves student retention by up to 40% in secondary education settings."
                </blockquote>
                <p className="text-sm text-slate-500 leading-relaxed pl-5">
                  This quote directly supports curriculum alignment because it demonstrates evidence-backed pedagogy relevant to your Year level and subject context.
                </p>
              </div>

              <div className="border-t border-slate-100" />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-bold text-amber-700 uppercase">Accessibility</span>
                  <span className="text-[11px] text-slate-400 font-medium">Adequate</span>
                </div>
                <blockquote className="border-l-4 border-[#111827] pl-5 italic text-gray-800 text-base leading-relaxed font-serif">
                  "Educators found that utilizing dynamic assessments allowed for natural differentiation among mixed-ability cohorts."
                </blockquote>
                <p className="text-sm text-slate-500 leading-relaxed pl-5">
                  Extracted because it indicates built-in differentiation support, critical for your class profile.
                </p>
              </div>

              <div className="border-t border-slate-100" />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#B7FF70]/40 border border-[#B7FF70] rounded-full text-[11px] font-bold text-emerald-900 uppercase">Curriculum Link</span>
                </div>
                <blockquote className="border-l-4 border-[#B7FF70] pl-5 italic text-gray-800 text-base leading-relaxed font-serif">
                  "Addresses syllabus outcome: ENG-7-03 — Evaluates meaning and structure of informational texts."
                </blockquote>
                <p className="text-sm text-slate-500 leading-relaxed pl-5">
                  A direct syllabus reference to verify this resource maps to a specific curriculum outcome.
                </p>
              </div>
            </div>
          </section>
        </div>

      </main>
    </div>
  );
}
