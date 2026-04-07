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

const STAGE_KEY: Record<Stage, string> = {
  query_generation: "queryGeneration",
  federated_search: "federatedSearch",
  rag_preparation: "ragPreparation",
  evaluation: "evaluation",
  adversarial: "adversarial",
  complete: "complete",
};

/** Extra cycling messages for long-running working states (hardcoded English
 *  is fine — these are supplementary hints, the primary message comes from i18n) */
const WORKING_HINTS: Record<string, string[]> = {
  bear: [
    "Checking curriculum fit...",
    "Assessing reading level...",
    "Reviewing factual accuracy...",
    "Evaluating source quality...",
  ],
  rabbit: [
    "Scanning for hidden bias...",
    "Verifying licensing...",
    "Cross-checking claims...",
    "Looking for red flags...",
  ],
};

function resolveStatus(
  status: StageStatus | undefined,
  isCached: boolean,
): StageStatus | undefined {
  if (isCached) return "done";
  return status;
}

export function ClassroomScene({ stages, activeStage, isCached }: ClassroomSceneProps) {
  const tAgents = useTranslations("search.classroom.agents");
  const tBubbles = useTranslations("search.classroom.bubbles");

  const owlStatus = resolveStatus(stages.query_generation, isCached);
  const foxStatus = resolveStatus(stages.federated_search, isCached);
  const bearStatus = resolveStatus(stages.evaluation, isCached);
  const rabbitStatus = resolveStatus(stages.adversarial, isCached);

  // Teacher bubble
  const teacherMessage =
    activeStage && activeStage !== "complete" && !isCached
      ? tBubbles(`teacher.${STAGE_KEY[activeStage]}`)
      : null;

  // Student bubbles — returns string or string[] for cycling
  const getBubble = (
    character: string,
    status: StageStatus | undefined,
  ): string | string[] | null => {
    if (!status) return null;
    if (status === "done") return tBubbles(`${character}.${status}`);
    // working — return array with primary message + hints for cycling
    const primary = tBubbles(`${character}.working`);
    const hints = WORKING_HINTS[character];
    if (hints) return [primary, ...hints];
    return primary;
  };

  return (
    <div
      className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl"
      style={{
        aspectRatio: "5 / 3",
        backgroundColor: "#FEF3C7",
        backgroundImage: [
          "radial-gradient(ellipse at 50% 100%, rgba(251,191,36,0.15) 0%, transparent 70%)",
          "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.04) 100%)",
          "repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(180,140,80,0.06) 59px, rgba(180,140,80,0.06) 60px)",
        ].join(", "),
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(0,0,0,0.06)",
      }}
      role="region"
      aria-label="Classroom scene showing search progress"
    >
      {/* Floor line */}
      <div
        className="absolute left-0 right-0 h-px"
        style={{ bottom: "5%", backgroundColor: "rgba(180,140,80,0.3)" }}
      />

      {/* Student desks */}
      {[
        { x: "22%", y: "60%" },
        { x: "65%", y: "60%" },
        { x: "22%", y: "88%" },
        { x: "65%", y: "88%" },
      ].map((pos) => (
        <div
          key={`${pos.x}-${pos.y}`}
          className="absolute"
          style={{ left: pos.x, top: pos.y, transform: "translateX(-50%)" }}
        >
          <svg viewBox="0 0 80 16" className="h-3 w-16">
            <rect x="4" y="0" width="72" height="12" rx="3" fill="#B8904A" opacity="0.7" />
            <rect x="7" y="2" width="66" height="7" rx="2" fill="#D4A96A" opacity="0.8" />
          </svg>
        </div>
      ))}

      {/* Chalkboard */}
      <Chalkboard activeStage={activeStage} isCached={isCached} />

      {/* Quokka teacher */}
      <QuokkaTeacher
        activeStage={activeStage}
        isCached={isCached}
        message={teacherMessage}
      />

      {/* Row 1 students */}
      <StudentAgent
        character="owl"
        position={{ x: "22%", y: "50%" }}
        status={owlStatus}
        label={tAgents("queryGeneration")}
        message={getBubble("owl", owlStatus)}
      />
      <StudentAgent
        character="fox"
        position={{ x: "65%", y: "50%" }}
        status={foxStatus}
        label={tAgents("federatedSearch")}
        message={getBubble("fox", foxStatus)}
      />

      {/* Row 2 students */}
      <StudentAgent
        character="bear"
        position={{ x: "22%", y: "80%" }}
        status={bearStatus}
        label={tAgents("evaluation")}
        message={getBubble("bear", bearStatus)}
      />
      <StudentAgent
        character="rabbit"
        position={{ x: "65%", y: "80%" }}
        status={rabbitStatus}
        label={tAgents("adversarial")}
        message={getBubble("rabbit", rabbitStatus)}
      />
    </div>
  );
}
