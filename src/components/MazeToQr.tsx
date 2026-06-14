'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// A simplified 21x21 QR Code grid template (Version 1 QR Code)
// 1 represents filled module, 0 represents empty module
const QR_GRID_TEMPLATE = [
  [1,1,1,1,1,1,1,0,0,1,0,1,1,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,0,1,1,1,0,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,1,0,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0],
  [1,1,0,1,0,1,1,0,0,0,1,1,1,1,1,0,1,1,0,0,1],
  [0,0,1,0,0,1,0,1,0,1,0,0,0,1,0,0,1,0,1,1,0],
  [1,0,1,1,0,0,1,0,1,0,1,1,0,1,1,1,0,0,1,0,0],
  [0,1,0,0,1,0,1,0,1,1,0,1,0,0,0,1,1,0,1,0,1],
  [1,1,0,1,0,0,0,0,1,0,0,1,0,1,1,0,0,1,0,1,1],
  [0,0,0,0,0,0,0,0,1,1,1,0,1,1,0,0,1,0,0,1,0],
  [1,1,1,1,1,1,1,0,0,1,0,0,0,1,1,1,0,0,1,1,1],
  [1,0,0,0,0,0,1,0,1,0,1,1,0,0,1,0,1,0,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,1,0,0,1,0,0,0,0,1,1,1,0],
  [1,0,1,1,1,0,1,0,0,1,0,1,1,0,1,1,0,0,1,0,1],
  [1,0,0,0,0,0,1,0,1,0,0,1,0,1,0,1,0,1,0,1,0],
  [1,1,1,1,1,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,1]
];

export default function MazeToQr() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile for rendering quality / fallback
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas sizing
    const size = Math.min(containerRef.current?.clientWidth || 500, 500);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const gridSize = 21;
    const cellSize = size / gridSize;

    // Define particles / cells in the maze
    // Each cell will transition from a "maze segment" to a "QR block"
    const cells: any[] = [];

    // Seed deterministic random to keep layout identical across refreshes
    let seed = 42;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const isQrFilled = QR_GRID_TEMPLATE[r][c] === 1;
        
        // Is this part of the corner finder patterns of the QR code?
        // Top-left (0-6, 0-6), Top-right (0-6, 14-20), Bottom-left (14-20, 0-6)
        const isFinderPattern =
          (r < 7 && c < 7) ||
          (r < 7 && c >= 14) ||
          (r >= 14 && c < 7);

        // Generate maze walls
        // A wall is either horizontal, vertical, or empty
        const wallType = random() > 0.45 ? (random() > 0.5 ? 'H' : 'V') : 'none';

        cells.push({
          row: r,
          col: c,
          x: c * cellSize,
          y: r * cellSize,
          isQrFilled,
          isFinderPattern,
          wallType,
          // Animation states interpolated by GSAP
          progress: 0, 
        });
      }
    }

    // GSAP ScrollTrigger Animation Object
    const animObj = { progress: 0 };

    const tl = gsap.to(animObj, {
      progress: 1,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top center+=100',
        end: 'bottom center-=100',
        scrub: 1.2,
      },
      onUpdate: () => {
        draw(animObj.progress);
      },
    });

    // Drawing function
    function draw(progress: number) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, size, size);

      // Background hint grid (subtle glass border effect)
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(size, i * cellSize);
        ctx.stroke();
      }

      cells.forEach((cell) => {
        const cx = cell.x + cellSize / 2;
        const cy = cell.y + cellSize / 2;

        // Maze Mode (progress = 0) vs QR Mode (progress = 1)
        if (progress < 0.4) {
          // --- MAZE RENDER PHASE ---
          // Draw copper-gold lines
          const localProgress = progress / 0.4; // 0 to 1 in this phase
          
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.75 * (1 - localProgress)})`;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';

          // Glow effect (skipped on mobile for performance)
          if (!isMobile) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgb(245, 158, 11)';
          }

          ctx.beginPath();
          if (cell.wallType === 'H') {
            // Draw horizontal wall line
            ctx.moveTo(cell.x + 2, cy);
            ctx.lineTo(cell.x + cellSize - 2, cy);
          } else if (cell.wallType === 'V') {
            // Draw vertical wall line
            ctx.moveTo(cx, cell.y + 2);
            ctx.lineTo(cx, cell.y + cellSize - 2);
          }
          ctx.stroke();
          
          // Clear shadow
          ctx.shadowBlur = 0;

        } else if (progress >= 0.4 && progress < 0.7) {
          // --- MORPH/REORGANIZATION PHASE ---
          // Maze lines disappear/disassemble while blocks begin to emerge
          const localProgress = (progress - 0.4) / 0.3; // 0 to 1
          
          if (cell.isQrFilled) {
            // Scale up QR squares with a nice glowing fade-in
            const blockScale = localProgress;
            const blockSize = cellSize * blockScale * 0.85;

            // Interpolated colors: from warm gold to emerald green
            ctx.fillStyle = `rgba(16, 185, 129, ${localProgress})`;
            
            if (!isMobile && cell.isFinderPattern) {
              ctx.shadowBlur = 10 * localProgress;
              ctx.shadowColor = 'rgb(16, 185, 129)';
            }
            
            ctx.fillRect(
              cx - blockSize / 2,
              cy - blockSize / 2,
              blockSize,
              blockSize
            );
            ctx.shadowBlur = 0;
          }

        } else {
          // --- QR CODE COMPLETE PHASE ---
          // Render neat, high-fidelity QR Code blocks
          const localProgress = (progress - 0.7) / 0.3; // 0 to 1
          
          if (cell.isQrFilled) {
            const blockSize = cellSize * 0.9;
            
            if (cell.isFinderPattern) {
              // Finder pattern: premium emerald green
              ctx.fillStyle = '#10b981';
              if (!isMobile) {
                ctx.shadowBlur = 12;
                ctx.shadowColor = 'rgb(16, 185, 129)';
              }
            } else {
              // Standard code module: stark white/silver with micro-accent
              ctx.fillStyle = `rgba(244, 244, 245, ${0.85 + 0.15 * localProgress})`;
              ctx.shadowBlur = 0;
            }

            // Draw rounded-corners block for premium feel
            const radius = 2.5;
            const bx = cx - blockSize / 2;
            const by = cy - blockSize / 2;

            ctx.beginPath();
            ctx.moveTo(bx + radius, by);
            ctx.lineTo(bx + blockSize - radius, by);
            ctx.quadraticCurveTo(bx + blockSize, by, bx + blockSize, by + radius);
            ctx.lineTo(bx + blockSize, by + blockSize - radius);
            ctx.quadraticCurveTo(bx + blockSize, by + blockSize, bx + blockSize - radius, by + blockSize);
            ctx.lineTo(bx + radius, by + blockSize);
            ctx.quadraticCurveTo(bx, by + blockSize, bx, by + blockSize - radius);
            ctx.lineTo(bx, by + radius);
            ctx.quadraticCurveTo(bx, by, bx + radius, by);
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowBlur = 0;
          }
        }
      });
    }

    // Initial paint
    draw(0);

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center relative w-full h-[550px] bg-stone-950/20 rounded-3xl border border-stone-850 backdrop-blur-sm p-8 overflow-hidden"
    >
      {/* Dynamic Background Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2d2d24_1px,transparent_1px),linear-gradient(to_bottom,#2d2d24_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />
      
      {/* Decorative Glow Behind Canvas */}
      <div className="absolute w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse" />

      {/* The Morphing Canvas */}
      <canvas
        ref={canvasRef}
        className="relative z-10 aspect-square drop-shadow-[0_0_25px_rgba(16,185,129,0.12)] max-w-full"
      />
      
      {/* Accessibility alternative text */}
      <div className="sr-only">
        Karmaşık menü yönetim labirentinin, kaydırma ile düzenli, sade ve şık bir QR kod yapısına dönüşümünü simgeleyen interaktif 3D animasyon alanı.
      </div>
    </div>
  );
}
