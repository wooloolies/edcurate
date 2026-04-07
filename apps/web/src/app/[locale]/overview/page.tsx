import { ArrowLeft } from "lucide-react";
import { Link } from "@/lib/i18n/routing";
import { Header } from "@/components/layout/header";

interface OverviewPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const resolvedParams = await searchParams;
  const title = resolvedParams.title as string ?? "Resource Overview";
  const type = resolvedParams.type as string ?? "Document";

  return (
    <div className="min-h-dvh bg-[#F8F9FA] text-[#111827] font-sans flex flex-col">
      <Header />
      
      <main className="flex-1 mt-36 max-w-[90rem] mx-auto w-full px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20">
        <div className="lg:col-span-12 mb-2">
           <div className="inline-block px-4 py-1.5 bg-gray-200 rounded-full text-xs font-bold text-gray-600 mb-4 uppercase tracking-wider">
             Generated Analysis
           </div>
           <h1 className="text-5xl font-bold tracking-tight">Overview</h1>
           <p className="text-2xl text-gray-500 mt-3">{title} <span className="opacity-50">({type})</span></p>
        </div>

        {/* Left Column: Abstract & Analysis */}
        <div className="lg:col-span-8 flex flex-col gap-10">
           <section className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-sm border border-white/80">
             <h2 className="text-3xl font-bold mb-5 text-[#111827]">Abstract</h2>
             <p className="text-[#111827]/80 text-xl leading-relaxed">
               This resource provides a comprehensive overview of the subject matter, detailing the fundamental principles and their practical applications. It is particularly suited for educators looking to integrate modern methodologies into their curriculum design while maintaining rigorous academic standards.
             </p>
           </section>

           <section className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-sm border border-white/80">
             <h2 className="text-3xl font-bold mb-8 text-[#111827]">Pedagogical Reasoning</h2>
             
             <div className="space-y-6">
               <div className="bg-[#B7FF70]/20 rounded-[2rem] p-8 border border-[#B7FF70]/50">
                 <h3 className="font-bold text-xl text-emerald-950 mb-4">Advantages</h3>
                 <ul className="list-disc pl-6 text-emerald-900 space-y-2 text-lg">
                   <li>Highly aligned with standard curriculum benchmarks and competencies</li>
                   <li>Engaging and interactive content formats tailored for modern classrooms</li>
                   <li>Clear differentiation options for diverse learner profiles</li>
                 </ul>
               </div>

               <div className="bg-rose-50 rounded-[2rem] p-8 border border-rose-100">
                 <h3 className="font-bold text-xl text-rose-950 mb-4">Disadvantages</h3>
                 <ul className="list-disc pl-6 text-rose-900 space-y-2 text-lg">
                   <li>May require prior foundational subject knowledge from students</li>
                   <li>Some examples included are culturally specific and may lack international relevance</li>
                 </ul>
               </div>

               <div className="bg-[#111827] text-white rounded-[2rem] p-8 shadow-md">
                 <h3 className="font-bold text-xl text-[#B7FF70] mb-4">Adjustment Advice</h3>
                 <p className="text-white/90 text-lg leading-relaxed">
                   Consider pre-teaching core vocabulary before introducing this resource to the class. For international classrooms, it is strictly recommended to supplement the culturally specific examples with local equivalents to ensure relatability and context retention among students.
                 </p>
               </div>
             </div>
           </section>
        </div>

        {/* Right Column: Verify Panel & Evidence */}
        <div className="lg:col-span-4 flex flex-col gap-10">
           <section className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/80 p-8 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.1)] sticky top-36">
             <h2 className="text-3xl font-bold mb-2 text-[#111827]">Verify Panel</h2>
             <p className="text-gray-500 text-base mb-6">
               Automated evidence extraction cross-referenced against your classroom preset.
             </p>

             {/* Evaluation Standards */}
             <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100">
               <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-3">Our evaluation standard</h3>
               <p className="text-sm text-slate-600 leading-relaxed mb-3">
                 Each resource is assessed against three core dimensions derived from educational best practice and your preset context:
               </p>
               <div className="flex flex-wrap gap-2">
                 <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-slate-700 border border-slate-200">Curriculum Fit</span>
                 <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-slate-700 border border-slate-200">Accessibility</span>
                 <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-slate-700 border border-slate-200">Trustworthiness</span>
               </div>
             </div>

             <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-5">Extracted evidence</h3>

             <div className="space-y-8">
               {/* Evidence 1 */}
               <div className="space-y-2">
                 <div className="flex items-center gap-2">
                   <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-700 uppercase">Curriculum Fit</span>
                   <span className="text-[11px] text-slate-400 font-medium">Strong</span>
                 </div>
                 <blockquote className="border-l-4 border-[#111827] pl-5 italic text-gray-800 text-base leading-relaxed font-serif">
                   "The integration of context-aware examples improves student retention by up to 40% in secondary education settings."
                 </blockquote>
                 <p className="text-sm text-slate-500 leading-relaxed pl-5">
                   This quote directly supports curriculum alignment because it demonstrates evidence-backed pedagogy relevant to your Year level and subject context. It confirms the resource uses research-informed teaching strategies.
                 </p>
               </div>

               {/* Evidence 2 */}
               <div className="space-y-2">
                 <div className="flex items-center gap-2">
                   <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-bold text-amber-700 uppercase">Accessibility</span>
                   <span className="text-[11px] text-slate-400 font-medium">Adequate</span>
                 </div>
                 <blockquote className="border-l-4 border-[#111827] pl-5 italic text-gray-800 text-base leading-relaxed font-serif">
                   "Educators found that utilizing dynamic assessments allowed for natural differentiation among mixed-ability cohorts."
                 </blockquote>
                 <p className="text-sm text-slate-500 leading-relaxed pl-5">
                   Extracted because it indicates built-in differentiation support, which is critical for your class profile. This evidence demonstrates the resource can accommodate diverse learner needs without requiring significant adaptation.
                 </p>
               </div>
               
               {/* Evidence 3 */}
               <div className="space-y-2">
                 <div className="flex items-center gap-2">
                   <span className="px-2.5 py-0.5 bg-[#B7FF70]/40 border border-[#B7FF70] rounded-full text-[11px] font-bold text-emerald-900 uppercase">Curriculum Link</span>
                 </div>
                 <blockquote className="border-l-4 border-[#B7FF70] pl-5 italic text-gray-800 text-base leading-relaxed font-serif">
                   "Addresses syllabus outcome: ENG-7-03 — Evaluates meaning and structure of informational texts."
                 </blockquote>
                 <p className="text-sm text-slate-500 leading-relaxed pl-5">
                   A direct syllabus reference extracted to verify that this resource maps to a specific curriculum outcome. This allows you to confidently cite alignment when integrating it into lesson plans.
                 </p>
               </div>
             </div>

             {/* Methodology note */}
             <div className="mt-8 pt-6 border-t border-slate-100">
               <p className="text-xs text-slate-400 leading-relaxed">
                 Quotes are extracted verbatim from the source material by our evaluation agent, then cross-referenced against your classroom preset (subject, year level, class profile) to determine relevance. No content is paraphrased or generated.
               </p>
             </div>
           </section>
        </div>
      </main>
    </div>
  );
}
