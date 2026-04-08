import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { CanvasBackground } from "@/components/ui/canvas-background";
import { CollectionOnboarding } from "./components/collection-onboarding";

function OnboardingSkeleton() {
  return (
    <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-xl shadow-black/[0.03] ring-1 ring-black/5 p-10 md:p-14 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-40 rounded-xl bg-gray-200" />
        <div className="h-6 w-16 rounded-lg bg-gray-200" />
      </div>
      {/* Progress bar */}
      <div className="flex w-full h-2 gap-2 mb-12">
        <div className="h-full w-1/3 rounded-full bg-brand-green/40" />
        <div className="h-full w-1/3 rounded-full bg-gray-200" />
        <div className="h-full w-1/3 rounded-full bg-gray-200" />
      </div>
      {/* Title + subtitle */}
      <div className="flex flex-col items-center gap-3 mb-12">
        <div className="h-10 w-80 rounded-xl bg-gray-200" />
        <div className="h-4 w-64 rounded-lg bg-gray-100" />
      </div>
      {/* Form fields */}
      <div className="space-y-8">
        <div>
          <div className="h-5 w-24 rounded-lg bg-gray-200 mb-3" />
          <div className="h-14 w-full rounded-2xl bg-gray-100" />
        </div>
        <div>
          <div className="h-5 w-44 rounded-lg bg-gray-200 mb-3" />
          <div className="h-14 w-full rounded-2xl bg-gray-100" />
        </div>
      </div>
      {/* Footer */}
      <div className="flex justify-end gap-4 mt-16 pt-8 border-t border-gray-100">
        <div className="h-12 w-28 rounded-[2rem] bg-gray-200" />
        <div className="h-12 w-28 rounded-[2rem] bg-brand-green/40" />
      </div>
    </div>
  );
}

export default function NewCollectionPage() {
  return (
    <div className="relative min-h-screen bg-brand-surface overflow-hidden text-brand-ink font-sans">
      <CanvasBackground />
      <Header />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-32 pb-16">
        <Suspense fallback={<OnboardingSkeleton />}>
          <CollectionOnboarding />
        </Suspense>
      </main>
    </div>
  );
}
