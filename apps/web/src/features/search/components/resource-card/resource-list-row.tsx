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
      {/* Desktop: horizontal row */}
      <div className="hidden sm:flex items-stretch gap-3 p-4 text-sm">
        <div className="shrink-0 w-28 flex flex-col items-center justify-between pt-0.5 pb-0.5">
          <span className="text-brand-ink font-bold text-base leading-none">{index}</span>
          {verdictNode}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">{contentNode}</div>
        <div className="flex items-center gap-2 shrink-0 pt-1">{actionsNode}</div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="flex sm:hidden flex-col gap-3 p-4 text-sm">
        <div className="flex-1 min-w-0">{contentNode}</div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-brand-ink font-bold text-sm leading-none">#{index}</span>
            {verdictNode}
          </div>
          <div className="flex items-center gap-2">{actionsNode}</div>
        </div>
      </div>
    </div>
  );
}
