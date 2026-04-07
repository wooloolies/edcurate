"use client";

import { Download, Minus, Plus } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

interface MindmapNode {
  name: string;
  children?: MindmapNode[];
}

interface MindmapViewerProps {
  data: MindmapNode;
}

const NODE_H = 36;
const NODE_PAD_X = 20;
const NODE_GAP_Y = 14;
const EDGE_GAP_X = 40;
const FONT_SIZE = 13;
const CHAR_WIDTH = 7.4;
const ROOT_FONT_SIZE = 15;
const ROOT_CHAR_WIDTH = 8.6;

const BRANCH_COLORS = [
  "#111827",
  "#B7FF70",
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
];

interface LayoutNode {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
  color: string;
  hasChildren: boolean;
  parentId: string | null;
  childIds: string[];
}

function getNodeWidth(name: string, depth: number): number {
  const cw = depth === 0 ? ROOT_CHAR_WIDTH : CHAR_WIDTH;
  return name.length * cw + NODE_PAD_X * 2;
}

function layoutTree(
  root: MindmapNode,
  collapsed: Set<string>
): { nodes: Map<string, LayoutNode>; width: number; height: number } {
  const nodes = new Map<string, LayoutNode>();
  let globalY = 0;

  function walk(
    node: MindmapNode,
    id: string,
    depth: number,
    parentId: string | null,
    branchColor: string,
    parentRight: number
  ): { yStart: number; yEnd: number } {
    const w = getNodeWidth(node.name, depth);
    const x = depth === 0 ? 0 : parentRight + EDGE_GAP_X;
    const hasChildren = !!node.children?.length;
    const isCollapsed = collapsed.has(id);

    const childIds: string[] = [];

    if (hasChildren && !isCollapsed) {
      let firstY = 0;
      let lastY = 0;
      node.children!.forEach((child, i) => {
        const childId = `${id}-${i}`;
        childIds.push(childId);
        const childColor = depth === 0 ? BRANCH_COLORS[i % BRANCH_COLORS.length] : branchColor;
        const range = walk(child, childId, depth + 1, id, childColor, x + w);
        if (i === 0) firstY = range.yStart;
        lastY = range.yEnd;
      });

      const midY = (firstY + lastY) / 2;
      nodes.set(id, {
        id,
        name: node.name,
        x,
        y: midY,
        w,
        h: NODE_H,
        depth,
        color: branchColor,
        hasChildren,
        parentId,
        childIds,
      });
      return { yStart: firstY, yEnd: lastY };
    }

    const y = globalY;
    globalY += NODE_H + NODE_GAP_Y;
    nodes.set(id, {
      id,
      name: node.name,
      x,
      y,
      w,
      h: NODE_H,
      depth,
      color: branchColor,
      hasChildren,
      parentId,
      childIds,
    });
    return { yStart: y, yEnd: y };
  }

  walk(root, "root", 0, null, BRANCH_COLORS[0], 0);

  let maxX = 0;
  nodes.forEach((n) => {
    const right = n.x + n.w;
    if (right > maxX) maxX = right;
  });

  return { nodes, width: maxX + 40, height: globalY };
}

export function MindmapViewer({ data }: MindmapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setCollapsed(new Set()), []);
  const collapseAll = useCallback(() => {
    const ids = new Set<string>();
    function walk(node: MindmapNode, id: string) {
      if (node.children?.length) {
        ids.add(id);
        for (let i = 0; i < node.children.length; i++) {
          walk(node.children[i], `${id}-${i}`);
        }
      }
    }
    walk(data, "root");
    ids.delete("root");
    setCollapsed(ids);
  }, [data]);

  const svgRef = useRef<SVGSVGElement>(null);

  const downloadPng = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const clone = svg.cloneNode(true) as SVGSVGElement;

    const style = document.createElement("style");
    style.textContent = `text { font-family: ui-sans-serif, system-ui, sans-serif; }`;
    clone.prepend(style);

    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    const scale = 2;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#F8F9FA";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const a = document.createElement("a");
      a.download = `${data.name.replace(/[^a-zA-Z0-9]/g, "_")}_mindmap.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  }, [data.name]);

  const { nodes, width, height } = useMemo(() => layoutTree(data, collapsed), [data, collapsed]);

  const PAD = 20;
  const svgW = width + PAD * 2;
  const svgH = height + PAD * 2;

  const edges: { from: LayoutNode; to: LayoutNode }[] = [];
  nodes.forEach((node) => {
    for (const cid of node.childIds) {
      const child = nodes.get(cid);
      if (child) edges.push({ from: node, to: child });
    }
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between">
        <h3 className="text-lg font-bold text-[#111827]">{data.name}</h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={expandAll}
            className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-[#111827]/60 transition-colors hover:bg-[#111827]/5 hover:text-[#111827]"
          >
            <Plus className="mr-1 h-3 w-3" /> Expand
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-[#111827]/60 transition-colors hover:bg-[#111827]/5 hover:text-[#111827]"
          >
            <Minus className="mr-1 h-3 w-3" /> Collapse
          </button>
          <button
            type="button"
            onClick={downloadPng}
            className="inline-flex items-center rounded-full bg-[#B7FF70] px-3.5 py-1.5 text-xs font-medium text-[#111827] transition-all hover:bg-[#111827] hover:text-white"
          >
            <Download className="mr-1 h-3 w-3" /> Download
          </button>
        </div>
      </div>

      {/* SVG canvas */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-auto rounded-2xl border border-white/80 bg-white/70 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-sm"
      >
        <svg
          ref={svgRef}
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="select-none"
          role="img"
          aria-label={`Mind map: ${data.name}`}
        >
          <g transform={`translate(${PAD}, ${PAD})`}>
            {/* Edges */}
            {edges.map(({ from, to }) => {
              const x1 = from.x + from.w;
              const y1 = from.y + NODE_H / 2;
              const x2 = to.x;
              const y2 = to.y + NODE_H / 2;
              const midX = x1 + (x2 - x1) / 2;

              return (
                <path
                  key={`${from.id}-${to.id}`}
                  d={`M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`}
                  fill="none"
                  stroke={to.color}
                  strokeWidth={1.5}
                  strokeOpacity={0.4}
                />
              );
            })}

            {/* Nodes */}
            {Array.from(nodes.values()).map((node) => {
              const isRoot = node.depth === 0;
              const canToggle = node.hasChildren;
              const isCollapsed = collapsed.has(node.id);
              const ry = isRoot ? 8 : 18;

              return (
                // biome-ignore lint/a11y/noStaticElementInteractions: SVG <g> with role="button" is intentional
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={canToggle ? () => toggle(node.id) : undefined}
                  className={canToggle ? "cursor-pointer" : ""}
                  role={canToggle ? "button" : "presentation"}
                  aria-label={canToggle ? `Toggle ${node.name}` : undefined}
                  tabIndex={canToggle ? 0 : undefined}
                  onKeyDown={
                    canToggle
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") toggle(node.id);
                        }
                      : undefined
                  }
                >
                  <rect
                    x={0}
                    y={0}
                    width={node.w}
                    height={NODE_H}
                    rx={ry}
                    ry={ry}
                    fill={isRoot ? "#111827" : `${node.color}15`}
                    stroke={isRoot ? "#111827" : node.color}
                    strokeWidth={isRoot ? 0 : 1}
                    strokeOpacity={0.3}
                    className="transition-colors"
                  />

                  <text
                    x={node.w / 2}
                    y={NODE_H / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={isRoot ? ROOT_FONT_SIZE : FONT_SIZE}
                    fontWeight={isRoot || node.depth === 1 ? 600 : 400}
                    fill={isRoot ? "#F8F9FA" : "#111827"}
                    className="pointer-events-none"
                  >
                    {node.name}
                  </text>

                  {canToggle && isCollapsed ? (
                    <g transform={`translate(${node.w - 14}, ${NODE_H / 2 - 6})`}>
                      <rect
                        x={0}
                        y={0}
                        width={12}
                        height={12}
                        rx={6}
                        fill={node.color}
                        fillOpacity={0.8}
                      />
                      <text
                        x={6}
                        y={6}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={8}
                        fontWeight={700}
                        fill="#fff"
                      >
                        +
                      </text>
                    </g>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
