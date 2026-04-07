"use client";

import { useCallback, useEffect, useRef } from "react";

export function CanvasBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const crispCanvasRef = useRef<HTMLCanvasElement>(null);

  const syncCanvasSize = useCallback(
    (
      container: HTMLDivElement,
      bgCanvas: HTMLCanvasElement,
      crispCanvas: HTMLCanvasElement,
      bgCtx: CanvasRenderingContext2D,
      crispCtx: CanvasRenderingContext2D
    ) => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = container.clientWidth;
      const cssH = container.clientHeight;

      // Set the canvas buffer to physical pixels
      bgCanvas.width = cssW * dpr;
      bgCanvas.height = cssH * dpr;
      crispCanvas.width = cssW * dpr;
      crispCanvas.height = cssH * dpr;

      // Reset transform before re-scaling (setTransform is safer after resize)
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      crispCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      return { width: cssW, height: cssH };
    },
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    const bgCanvas = bgCanvasRef.current;
    const crispCanvas = crispCanvasRef.current;
    if (!container || !bgCanvas || !crispCanvas) return;

    const bgCtx = bgCanvas.getContext("2d");
    const crispCtx = crispCanvas.getContext("2d");
    if (!bgCtx || !crispCtx) return;

    let { width, height } = syncCanvasSize(container, bgCanvas, crispCanvas, bgCtx, crispCtx);

    const mouse = { x: -9999, y: -9999 };
    const squareSize = 80;

    interface Cell {
      x: number;
      y: number;
      alpha: number;
      fading: boolean;
      lastTouched: number;
      offsetX: number;
      offsetY: number;
      vx: number;
      vy: number;
      nodeId: string;
    }

    const grid: Cell[] = [];
    let counter = 0;

    function initGrid() {
      grid.length = 0;
      counter = 0;
      for (let x = 0; x < width; x += squareSize) {
        for (let y = 0; y < height; y += squareSize) {
          grid.push({
            x,
            y,
            alpha: 0,
            fading: false,
            lastTouched: 0,
            offsetX: Math.random() * 20 - 10,
            offsetY: Math.random() * 20 - 10,
            vx: Math.random() * 0.5 - 0.25,
            vy: Math.random() * 0.5 - 0.25,
            nodeId: `ED-${(counter++).toString().padStart(3, "0")}`, // Digital identifier
          });
        }
      }
    }

    function _getCellAt(x: number, y: number) {
      return grid.find(
        (cell) => x >= cell.x && x < cell.x + squareSize && y >= cell.y && y < cell.y + squareSize
      );
    }

    // Debounce resize so rapid zoom steps don't thrash the grid
    let resizeTimer: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ({ width, height } = syncCanvasSize(container, bgCanvas, crispCanvas, bgCtx, crispCtx));
        initGrid();
      }, 100);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      const radius = 250;
      for (const cell of grid) {
        const dx = mouse.x - (cell.x + squareSize / 2);
        const dy = mouse.y - (cell.y + squareSize / 2);
        const distSq = dx * dx + dy * dy;
        const radiusSq = radius * radius;

        if (distSq < radiusSq) {
          const dist = Math.sqrt(distSq);
          const intensity = 1 - dist / radius;
          if (cell.alpha < intensity) {
            cell.alpha = intensity;
            cell.lastTouched = Date.now();
            cell.fading = false;
          }
        }
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    // visualViewport fires on pinch-zoom and browser Ctrl+/- zoom
    const vvResize = () => handleResize();
    window.visualViewport?.addEventListener("resize", vvResize);

    let animationFrameId: number;

    function drawGrid() {
      if (!bgCtx || !crispCtx) return;

      bgCtx.clearRect(0, 0, width, height);
      crispCtx.clearRect(0, 0, width, height);

      const now = Date.now();

      for (let i = 0; i < grid.length; i++) {
        const cell = grid[i];

        if (cell.alpha > 0 && !cell.fading && now - cell.lastTouched > 400) {
          cell.fading = true;
        }

        if (cell.fading) {
          cell.alpha -= 0.03;
          if (cell.alpha <= 0) {
            cell.alpha = 0;
            cell.fading = false;
          }
        }

        cell.offsetX += cell.vx;
        cell.offsetY += cell.vy;
        if (cell.offsetX > 20 || cell.offsetX < -20) cell.vx *= -1;
        if (cell.offsetY > 20 || cell.offsetY < -20) cell.vy *= -1;

        if (cell.alpha > 0) {
          const gridCenterX = cell.x + squareSize / 2;
          const gridCenterY = cell.y + squareSize / 2;

          const morphRadius = squareSize / 2 + 8;
          const currentX = gridCenterX + cell.offsetX * 0.5;
          const currentY = gridCenterY + cell.offsetY * 0.5;

          // --- 1. BACKGROUND CANVAS (Morphed Digitalized Layer) ---
          bgCtx.beginPath();
          bgCtx.arc(currentX, currentY, morphRadius, 0, Math.PI * 2);
          bgCtx.fillStyle = `rgba(183, 255, 112, ${cell.alpha})`;
          bgCtx.fill();

          // Draw geometric 'data fragments' orbiting the sphere that merge into the morph seamlessly
          const bitSize = 8;
          bgCtx.fillRect(
            currentX + cell.offsetX * 1.5,
            currentY - cell.offsetY * 1.5,
            bitSize,
            bitSize
          );
          bgCtx.fillRect(
            currentX - cell.offsetX * 1.5,
            currentY + cell.offsetY * 1.5,
            bitSize,
            bitSize
          );

          // --- 2. CRISP CANVAS (Delicate Tech/Academic Schematics) ---

          // Faint Neural Net structural crosshairs (anchoring the mathematical grid)
          crispCtx.strokeStyle = `rgba(183, 255, 112, ${cell.alpha * 0.5})`;
          crispCtx.lineWidth = 1;
          crispCtx.beginPath();
          crispCtx.moveTo(gridCenterX - 6, gridCenterY);
          crispCtx.lineTo(gridCenterX + 6, gridCenterY);
          crispCtx.moveTo(gridCenterX, gridCenterY - 6);
          crispCtx.lineTo(gridCenterX, gridCenterY + 6);
          crispCtx.stroke();

          // Delicate digital micro-data metrics in HUD style
          crispCtx.fillStyle = `rgba(17, 24, 39, ${cell.alpha * 0.6})`;
          crispCtx.font = "500 9px 'Roboto Mono', monospace";
          crispCtx.textAlign = "left";
          crispCtx.textBaseline = "middle";
          crispCtx.fillText(`${cell.nodeId}`, cell.x + 4, cell.y + 12);

          // Draw mesh to connect adjacent active nodes
          for (let j = i + 1; j < grid.length; j++) {
            const sibling = grid[j];
            if (sibling.alpha > 0.05) {
              const dist = Math.hypot(cell.x - sibling.x, cell.y - sibling.y);
              if (dist < squareSize * 1.5) {
                crispCtx.beginPath();
                crispCtx.moveTo(gridCenterX, gridCenterY);
                crispCtx.lineTo(sibling.x + squareSize / 2, sibling.y + squareSize / 2);
                crispCtx.strokeStyle = `rgba(183, 255, 112, ${Math.min(cell.alpha, sibling.alpha) * 0.25})`;
                crispCtx.stroke();
              }
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(drawGrid);
    }

    initGrid();
    drawGrid();

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.visualViewport?.removeEventListener("resize", vvResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [syncCanvasSize]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      style={{ width: "100dvw", height: "100dvh" }}
    >
      {/* SVG gooey & glitch filter */}
      <svg
        width="0"
        height="0"
        className="absolute pointer-events-none"
        style={{ position: "absolute" }}
      >
        <title>Digital Goo Filter</title>
        <defs>
          <filter id="digital-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0  
                0 1 0 0 0  
                0 0 1 0 0  
                0 0 0 25 -11
              "
              result="goo"
            />
            <feMorphology in="goo" operator="dilate" radius="2" result="larger_goo" />
            <feComposite in="larger_goo" in2="goo" operator="out" result="outline" />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.05 0.5"
              numOctaves="1"
              result="static"
            />
            <feDisplacementMap
              in="outline"
              in2="static"
              scale="4"
              xChannelSelector="R"
              yChannelSelector="G"
              result="digitalized"
            />
          </filter>
        </defs>
      </svg>

      {/* Morphed digital fluid layer */}
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 w-full h-full opacity-70"
        style={{ filter: "url(#digital-goo)" }}
      />

      {/* Crisp un-filtered geometric schematics layer */}
      <canvas ref={crispCanvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
