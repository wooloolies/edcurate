"use client";

import { BookOpen, BrainCircuit, FileText, Layers, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDeleteArtifactEndpointApiLocalizerArtifactIdDelete } from "@/lib/api/localizer/localizer";
import type { GeneratedArtifactResponse } from "@/lib/api/model";

import { BriefingDocViewer } from "./briefing-doc-viewer";
import { FlashcardsViewer } from "./flashcards-viewer";
import { MindmapViewer } from "./mindmap-viewer";
import { QuizViewer } from "./quiz-viewer";
import { StudyGuideViewer } from "./study-guide-viewer";
import { SummaryViewer } from "./summary-viewer";

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; surface: string }> = {
  quiz: {
    label: "Quiz",
    icon: <BookOpen className="h-4 w-4" />,
    surface: "bg-brand-green/10",
  },
  mindmap: {
    label: "Mind Map",
    icon: <BrainCircuit className="h-4 w-4" />,
    surface: "bg-brand-ink/5",
  },
  summary: {
    label: "Summary",
    icon: <FileText className="h-4 w-4" />,
    surface: "bg-brand-green/8",
  },
  flashcards: {
    label: "Flashcards",
    icon: <Layers className="h-4 w-4" />,
    surface: "bg-brand-ink/[0.03]",
  },
  study_guide: {
    label: "Study Guide",
    icon: <FileText className="h-4 w-4" />,
    surface: "bg-brand-green/8",
  },
  briefing_doc: {
    label: "Briefing Doc",
    icon: <FileText className="h-4 w-4" />,
    surface: "bg-brand-ink/5",
  },
};

interface ArtifactListProps {
  artifacts: GeneratedArtifactResponse[];
  collectionName?: string;
}

export function ArtifactList({ artifacts, collectionName }: ArtifactListProps) {
  const { mutateAsync: deleteArtifact } = useDeleteArtifactEndpointApiLocalizerArtifactIdDelete();
  const [viewingArtifact, setViewingArtifact] = useState<GeneratedArtifactResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (artifacts.length === 0) return null;

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteArtifact({ artifactId: id });
      toast.success("Artifact deleted");
      if (viewingArtifact?.id === id) setViewingArtifact(null);
    } catch {
      toast.error("Failed to delete artifact");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="mt-4 border-t border-brand-ink/5 pt-4">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {artifacts.map((artifact) => {
            const meta = TYPE_META[artifact.artifact_type] ?? {
              label: artifact.artifact_type,
              icon: <FileText className="h-4 w-4" />,
              surface: "bg-brand-ink/[0.03]",
            };
            return (
              <div
                key={artifact.id}
                className="group relative w-full overflow-hidden rounded-xl border border-brand-ink/5 bg-brand-surface/80 transition-all hover:border-brand-ink/10 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
              >
                <button
                  type="button"
                  className="w-full cursor-pointer px-3.5 py-2.5 pr-10 text-left bg-transparent"
                  onClick={() => setViewingArtifact(artifact)}
                  aria-label={`View ${meta.label}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 text-brand-ink/50">{meta.icon}</span>
                      <span className="truncate text-[13px] font-semibold text-brand-ink">
                        {meta.label}
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] text-brand-ink/30">
                      {new Date(artifact.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-brand-ink/15 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  onClick={(e) => handleDelete(e, artifact.id)}
                  disabled={deletingId === artifact.id}
                  aria-label={`Delete ${meta.label}`}
                >
                  {deletingId === artifact.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!viewingArtifact} onOpenChange={(open) => !open && setViewingArtifact(null)}>
        <DialogContent
          className={
            viewingArtifact?.artifact_type === "mindmap"
              ? "!max-w-[95vw] !w-[95vw] !h-[70vh] flex flex-col"
              : "!max-w-3xl max-h-[85vh] overflow-y-auto"
          }
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingArtifact
                ? (TYPE_META[viewingArtifact.artifact_type]?.label ?? "Artifact")
                : null}
              {!!collectionName && !!viewingArtifact && (
                <span className="text-sm font-normal text-brand-ink/40">from {collectionName}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div
            className={
              viewingArtifact?.artifact_type === "mindmap" ? "flex-1 min-h-0 overflow-hidden" : ""
            }
          >
            {viewingArtifact ? <ArtifactContentViewer artifact={viewingArtifact} /> : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ArtifactContentViewer({ artifact }: { artifact: GeneratedArtifactResponse }) {
  const content = artifact.content as unknown;

  switch (artifact.artifact_type) {
    case "quiz":
      return <QuizViewer data={content as Parameters<typeof QuizViewer>[0]["data"]} />;
    case "mindmap":
      return <MindmapViewer data={content as Parameters<typeof MindmapViewer>[0]["data"]} />;
    case "summary":
      return <SummaryViewer data={content as Parameters<typeof SummaryViewer>[0]["data"]} />;
    case "flashcards":
      return <FlashcardsViewer data={content as Parameters<typeof FlashcardsViewer>[0]["data"]} />;
    case "study_guide":
      return <StudyGuideViewer data={content as Parameters<typeof StudyGuideViewer>[0]["data"]} />;
    case "briefing_doc":
      return (
        <BriefingDocViewer data={content as Parameters<typeof BriefingDocViewer>[0]["data"]} />
      );
    default:
      return (
        <pre className="rounded-xl bg-brand-surface p-4 text-xs overflow-auto max-h-96">
          {JSON.stringify(content, null, 2)}
        </pre>
      );
  }
}
