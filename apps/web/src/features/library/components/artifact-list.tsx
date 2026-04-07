"use client";

import { BookOpen, BrainCircuit, FileText, Layers, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useDeleteArtifactEndpointApiLocalizerArtifactIdDelete,
  useListArtifactsEndpointApiLocalizerGet,
} from "@/lib/api/localizer/localizer";
import type { GeneratedArtifactResponse } from "@/lib/api/model";

import { FlashcardsViewer } from "./flashcards-viewer";
import { MindmapViewer } from "./mindmap-viewer";
import { QuizViewer } from "./quiz-viewer";
import { SummaryViewer } from "./summary-viewer";

const TYPE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  quiz: { label: "Quiz", icon: <BookOpen className="h-4 w-4" /> },
  mindmap: { label: "Mind Map", icon: <BrainCircuit className="h-4 w-4" /> },
  summary: { label: "Summary", icon: <FileText className="h-4 w-4" /> },
  flashcards: { label: "Flashcards", icon: <Layers className="h-4 w-4" /> },
};

interface ArtifactListProps {
  presetId: string;
}

export function ArtifactList({ presetId }: ArtifactListProps) {
  const { data, isLoading } = useListArtifactsEndpointApiLocalizerGet({ preset_id: presetId });
  const { mutateAsync: deleteArtifact } = useDeleteArtifactEndpointApiLocalizerArtifactIdDelete();
  const [viewingArtifact, setViewingArtifact] = useState<GeneratedArtifactResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const artifacts = data?.artifacts ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Generated Artifacts
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artifacts.map((artifact) => {
            const meta = TYPE_META[artifact.artifact_type] ?? {
              label: artifact.artifact_type,
              icon: <FileText className="h-4 w-4" />,
            };
            return (
              <Card
                key={artifact.id}
                className="cursor-pointer transition-colors hover:bg-muted/30"
                onClick={() => setViewingArtifact(artifact)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setViewingArtifact(artifact);
                  }
                }}
                aria-label={`View ${meta.label}`}
                role="button"
                tabIndex={0}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <div className="flex items-center gap-2">
                    {meta.icon}
                    <CardTitle className="text-sm font-medium">{meta.label}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={(e) => handleDelete(e, artifact.id)}
                    disabled={deletingId === artifact.id}
                    aria-label={`Delete ${meta.label}`}
                  >
                    {deletingId === artifact.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {artifact.source_resource_ids.length} source
                      {artifact.source_resource_ids.length !== 1 ? "s" : ""}
                    </Badge>
                    <span>{new Date(artifact.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
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
            <DialogTitle>
              {viewingArtifact
                ? (TYPE_META[viewingArtifact.artifact_type]?.label ?? "Artifact")
                : null}
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
    default:
      return (
        <pre className="rounded bg-muted p-4 text-xs overflow-auto max-h-96">
          {JSON.stringify(content, null, 2)}
        </pre>
      );
  }
}
