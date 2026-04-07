"use client";

import { useTranslations } from "next-intl";

import { Chalkboard } from "@/features/search/components/classroom/chalkboard";
import { QuokkaTeacher } from "@/features/search/components/classroom/quokka-teacher";
import { StudentAgent } from "@/features/search/components/classroom/student-agent";
import type { Stage, StageStatus } from "@/features/search/types/search-stream";

interface ClassroomSceneProps {
  stages: Partial<Record<Stage, StageStatus>>;
  activeStage: Stage | null;
  isCached: boolean;
}

/**
 * Derive the effective status for a student in the cached scenario.
 * When isCached is true every student is immediately shown as "done".
 */
function resolveStatus(
  status: StageStatus | undefined,
  isCached: boolean,
): StageStatus | undefined {
  if (isCached) return "done";
  return status;
}

export function ClassroomScene({ stages, activeStage, isCached }: ClassroomSceneProps) {
  const t = useTranslations("search.classroom.agents");
  const owlStatus = resolveStatus(stages.query_generation, isCached);
  const foxStatus = resolveStatus(stages.federated_search, isCached);
  const bearStatus = resolveStatus(stages.evaluation, isCached);
  const rabbitStatus = resolveStatus(stages.adversarial, isCached);

  return (
    <div
      className="relative mx-auto aspect-[3/2] w-full max-w-[600px] overflow-hidden rounded-2xl"
      style={{
        backgroundColor: "#FEF3C7", // amber-100-ish warm classroom
        backgroundImage:
          "radial-gradient(ellipse at 50% 100%, rgba(251,191,36,0.15) 0%, transparent 70%)",
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.06)",
      }}
      role="region"
      aria-label="Classroom scene showing search progress"
    >
      {/* Floor line */}
      <div
        className="absolute bottom-[22%] left-0 right-0 h-px"
        style={{ backgroundColor: "rgba(180,140,80,0.25)" }}
      />

      {/* Chalkboard */}
      <Chalkboard activeStage={activeStage} isCached={isCached} />

      {/* Quokka teacher */}
      <QuokkaTeacher activeStage={activeStage} isCached={isCached} />

      {/* Row 1 students */}
      <StudentAgent
        character="owl"
        position={{ x: "15%", y: "55%" }}
        status={owlStatus}
        label={t("queryGeneration")}
      />
      <StudentAgent
        character="fox"
        position={{ x: "60%", y: "55%" }}
        status={foxStatus}
        label={t("federatedSearch")}
      />

      {/* Row 2 students */}
      <StudentAgent
        character="bear"
        position={{ x: "15%", y: "78%" }}
        status={bearStatus}
        label={t("evaluation")}
      />
      <StudentAgent
        character="rabbit"
        position={{ x: "60%", y: "78%" }}
        status={rabbitStatus}
        label={t("adversarial")}
      />
    </div>
  );
}
