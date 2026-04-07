import type { ReactNode } from "react";

interface ResourceListRowProps {
  index: number;
  verdictNode: ReactNode;
  contentNode: ReactNode;
  actionsNode: ReactNode;
}

export function ResourceListRow({
  index,
  verdictNode,
  contentNode,
  actionsNode,
}: ResourceListRowProps) {
  return (
    <div className="group border-b border-slate-200 last:border-0 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-stretch gap-3 p-4 text-sm">
        {/* Col 1: Index + Verdict */}
        <div className="shrink-0 w-28 flex flex-col items-center justify-between pt-0.5 pb-0.5">
          <span className="text-brand-ink font-bold text-base leading-none">{index}</span>
          {verdictNode}
        </div>

        {/* Col 2: Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">{contentNode}</div>

        {/* Col 3: Actions */}
        <div className="flex items-center gap-2 shrink-0 pt-1">{actionsNode}</div>
      </div>
    </div>
  );
}
