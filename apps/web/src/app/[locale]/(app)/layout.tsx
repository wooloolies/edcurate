import { Header } from "@/components/layout/header";
import { CanvasBackground } from "@/components/ui/canvas-background";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-brand-surface text-brand-ink">
      <CanvasBackground />
      <Header />
      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-6">{children}</main>
    </div>
  );
}
