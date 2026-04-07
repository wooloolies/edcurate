"use client";

import { useEffect, useRef } from "react";

export function LineCanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    
    // Scale for high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let animationFrameId: number;
    let time = 0;

    // Helper function to linearly interpolate between two rgb arrays
    function lerpColor(c1: number[], c2: number[], t: number) {
      return [
        Math.round(c1[0] + (c2[0] - c1[0]) * t),
        Math.round(c1[1] + (c2[1] - c1[1]) * t),
        Math.round(c1[2] + (c2[2] - c1[2]) * t),
      ];
    }

    // We simulate 3D flowing ribbons by calculating points along parametric curves
    const ribbons = Array.from({ length: 5 }).map((_, i) => ({
      rx: Math.random() * 1.5 + 1,
      ry: Math.random() * 1.5 + 1,
      speed: Math.random() * 0.0015 + 0.0005,
      offset: Math.random() * Math.PI * 2,
    }));

    function draw() {
      if (!ctx) return;
      
      time += 6; // advance time

      // Oscillate background lerp value continuously using Math.sin
      const bgLerpT = (Math.sin(time * 0.0008) + 1) / 2;
      
      // Dynamic pulsing background using Edcurate greens
      const bgTopColor = lerpColor([183, 255, 112], [52, 211, 153], bgLerpT);
      const bgBottomColor = lerpColor([240, 253, 244], [183, 255, 112], bgLerpT);
      
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, `rgba(${bgTopColor.join(',')}, 0.8)`);
      bgGradient.addColorStop(1, `rgba(${bgBottomColor.join(',')}, 0.5)`);
      
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) * 0.5;

      // Draw flowing transparent white ribbons overlaid onto the background
      ribbons.forEach((ribbon) => {
        const numLines = 5; 

        for (let i = 0; i < numLines; i++) {
          const progress = i / numLines;
          const curveOffset = progress * Math.PI * 2 + time * ribbon.speed + ribbon.offset;
          
          ctx.beginPath();
          
          // Generate sweeping trajectory with high step count for ultra-smoothness
          const smoothingSteps = 150;
          for (let step = 0; step <= smoothingSteps; step++) {
            const t = step / smoothingSteps;
            const theta = t * Math.PI * 2 + curveOffset;
            
            // Simplified 3D projection math maintaining elegance
            const x3d = Math.sin(theta * ribbon.rx) * maxRadius;
            const z3d = Math.cos(theta * ribbon.ry) * maxRadius;
            const y3d = Math.sin(theta * 1.5 + time * 0.001) * (maxRadius * 0.5);
            
            // Perspective projection
            const fov = 300;
            const z = z3d + 400; // Move it forward
            const scale = fov / z;
            
            const px = centerX + x3d * scale;
            const py = centerY + y3d * scale;

            if (step === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }

          // Use a stroke varying between sharp and slightly transparent white
          const opacity = Math.max(0.05, 0.6 * (1 - progress));
          ctx.lineWidth = 6.0;
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none rounded-[2rem]"
    />
  );
}
