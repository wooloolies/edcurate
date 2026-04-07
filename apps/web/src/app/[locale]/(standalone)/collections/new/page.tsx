import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { CollectionOnboarding } from "./components/collection-onboarding";
import { CanvasBackground } from "@/components/ui/canvas-background";

export default function NewCollectionPage() {
  return (
    <div className="relative min-h-screen bg-[#F8F9FA] overflow-hidden text-[#111827] font-sans">
      <CanvasBackground />
      <Header />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-32 pb-16">
        <Suspense fallback={<div className="w-full max-w-4xl h-[500px] bg-white/40 backdrop-blur-md shadow-xl rounded-[2.5rem] animate-pulse" />}>
          <CollectionOnboarding />
        </Suspense>
      </main>
    </div>
  );
}
