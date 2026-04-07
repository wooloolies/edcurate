import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

interface ResourceListRowProps {
  index: number;
  verdictNode: ReactNode;
  contentNode: ReactNode;
  actionsNode: ReactNode;
  expandedDetailsNode: ReactNode;
}

export function ResourceListRow({
  index,
  verdictNode,
  contentNode,
  actionsNode,
  expandedDetailsNode,
}: ResourceListRowProps) {
  const t = useTranslations("search");
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="group border-b border-slate-200 last:border-0 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-start gap-4 p-4 text-sm">
        {/* Col 1: Index */}
        <div className="w-6 shrink-0 text-slate-400 font-semibold pt-1">
          {index}.
        </div>

        {/* Col 2: Evaluated Status */}
        <div className="w-36 shrink-0 pt-0.5">
          {verdictNode}
        </div>

        {/* Col 3: Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {contentNode}
        </div>

        {/* Col 4: Actions & Expand */}
        <div className="flex items-center gap-2 shrink-0 ml-4 pt-1">
          {actionsNode}
          {!!expandedDetailsNode && (
            <button
              onClick={() => setIsExpanded(p => !p)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              title={isExpanded ? t("hideEvaluationDetails") : t("showEvaluationDetails")}
            >
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>
      
      {/* Expanded Details */}
      {isExpanded && expandedDetailsNode && (
        <div className="ml-10 md:ml-48 pr-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="rounded-md border bg-slate-50/80 shadow-sm overflow-hidden">
            {expandedDetailsNode}
          </div>
        </div>
      )}
    </div>
  );
}
