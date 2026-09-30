import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const QuantumPulse: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [targetsHit, setTargetsHit] = useState(0);
  const [totalTargets, setTotalTargets] = useState(1);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const gridRows = 8;
    const gridCols = 10;

    interface Mirror {
      r: number;
      c: number;
      angle: number; // in degrees (0, 45, 90, 135)
      movable: boolean;
    }

    interface Target {
      r: number;
      c: number;
      lit: boolean;
    }

    interface Emitter {
      r: number;
      c: number;
      dir: { dr: number; dc: number };
    }

    const emitter: Emitter = { r: 1, c: 0, dir: { dr: 0, dc: 1 } };
    const targets: Target[] = [
      { r: 6, c: 8, lit: false },
    ];
    if (level > 4) {
      targets.push({ r: 2, c: 7, lit: false });
    }
    setTotalTargets(targets.length);

    // Initial Mirrors based on level
    const mirrors: Mirror[] = [
      { r: 1, c: 4, angle: 45, movable: true },
      { r: 5, c: 4, angle: 135, movable: true },
      { r: 5, c: 8, angle: 45, movable: true },
    ];
    if (level > 3) {
      mirrors.push({ r: 2, c: 4, angle: 0, movable: true });
      mirrors.push({ r: 6, c: 4, angle: 90, movable: true });
    }

    // Raycast tracing path points
    interface RayPoint {
      x: number;
      y: number;
    }
    let beamPoints: RayPoint[] = [];

    const calculateLaser = () => {
      beamPoints = [];
      targets.forEach((t) => (t.lit = false));

      let currR = emitter.r;
      let currC = emitter.c;
      let dr = emitter.dir.dr;
      let dc = emitter.dir.dc;

      beamPoints.push({ x: currC + 0.5, y: currR + 0.5 });

      let bounces = 0;
      while (bounces < 20) {
        currR += dr;
        currC += dc;

        if (currR < 0 || currR >= gridRows || currC < 0 || currC >= gridCols) {
          beamPoints.push({ x: currC + 0.5, y: currR + 0.5 });
          break;
        }

        beamPoints.push({ x: currC + 0.5, y: currR + 0.5 });

        // Check Target
        for (const tg of targets) {
          if (tg.r === currR && tg.c === currC) {
            tg.lit = true;
          }
        }

        // Check Mirror
        const m = mirrors.find((mir) => mir.r === currR && mir.c === currC);
        if (m) {
          bounces++;
          // Angle 45 (/): reflects (0,1)->(-1,0), (1,0)->(0,-1), (0,-1)->(1,0), (-1,0)->(0,1)
          if (m.angle === 45) {
            const nextDr = -dc;
            const nextDc = -dr;
            dr = nextDr;
            dc = nextDc;
          } else if (m.angle === 135) {
            // Angle 135 (\): reflects (0,1)->(1,0), (-1,0)->(0,-1), (0,-1)->(-1,0), (1,0)->(0,1)
            const nextDr = dc;
            const nextDc = dr;
            dr = nextDr;
            dc = nextDc;
          } else {
            // Flat 0 or 90 blocks or absorbs
            break;
          }
        }
      }

      const litCount = targets.filter((t) => t.lit).length;
      setTargetsHit(litCount);

      if (litCount === targets.length) {
        sound.playWin();
        setGameWon(true);
      }
    };

    calculateLaser();

    // Click to rotate mirror
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / rect.width;
      const clickY = (e.clientY - rect.top) / rect.height;

      const c = Math.floor(clickX * gridCols);
      const r = Math.floor(clickY * gridRows);

      const mirror = mirrors.find((m) => m.r === r && m.c === c && m.movable);
      if (mirror) {
        mirror.angle = (mirror.angle + 45) % 180;
        sound.playTone(620, 'sine', 0.05);
        calculateLaser();
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    const updateSize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.scale(dpr, dpr);
    };

    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    updateSize();

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      // Grid cell dimensions
      const cellW = w / gridCols;
      const cellH = h / gridRows;

      // Lab Background
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;
      for (let r = 0; r <= gridRows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellH);
        ctx.lineTo(w, r * cellH);
        ctx.stroke();
      }
      for (let c = 0; c <= gridCols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellW, 0);
        ctx.lineTo(c * cellW, h);
        ctx.stroke();
      }

      // Draw Emitter
      const ex = (emitter.c + 0.5) * cellW;
      const ey = (emitter.r + 0.5) * cellH;
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(ex, ey, Math.min(cellW, cellH) * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(ex, ey, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw Laser Beam
      if (beamPoints.length > 1) {
        ctx.strokeStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(beamPoints[0].x * cellW, beamPoints[0].y * cellH);
        for (let i = 1; i < beamPoints.length; i++) {
          ctx.lineTo(beamPoints[i].x * cellW, beamPoints[i].y * cellH);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw Targets
      for (const tg of targets) {
        const tx = (tg.c + 0.5) * cellW;
        const ty = (tg.r + 0.5) * cellH;
        const rad = Math.min(cellW, cellH) * 0.32;

        ctx.strokeStyle = tg.lit ? '#10b981' : '#f43f5e';
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = tg.lit ? 14 : 4;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(tx, ty, rad, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = tg.lit ? '#10b981' : '#334155';
        ctx.beginPath();
        ctx.arc(tx, ty, rad * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Mirrors
      for (const m of mirrors) {
        const mx = (m.c + 0.5) * cellW;
        const my = (m.r + 0.5) * cellH;
        const len = Math.min(cellW, cellH) * 0.38;

        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate((m.angle * Math.PI) / 180);

        // Mirror base frame
        ctx.fillStyle = '#334155';
        ctx.fillRect(-len, -3, len * 2, 6);

        // Silver Reflective face
        ctx.fillStyle = '#e2e8f0';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.fillRect(-len, -1, len * 2, 3);
        ctx.shadowBlur = 0;

        ctx.restore();

        // Rotation hint circle around movable mirrors
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mx, my, len * 1.1, 0, Math.PI * 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', handleCanvasClick);
      ro.disconnect();
    };
  }, [level, isPaused, gameWon]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-slate-950 select-none overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="w-full h-full flex-1 block cursor-pointer" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">LEVEL {level} / 20</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">OPTICS LAB</span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-emerald-400 font-bold">
            TARGETS: {targetsHit} / {totalTargets}
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-slate-400 text-xs bg-slate-900/70 px-4 py-1.5 rounded-full border border-slate-700/60">
        Click mirrors to rotate angle and guide quantum laser to sensors
      </div>

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">QUANTUM LOCK ACHIEVED!</h2>
          <p className="text-slate-300 text-sm mt-2">All detectors calibrated with coherent beam reflection.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Lab (Level {Math.min(20, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
