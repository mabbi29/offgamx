import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const SolarisFarm: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [credits, setCredits] = useState(100);
  const [targetCredits, setTargetCredits] = useState(500 + level * 350);
  const [drones, setDrones] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  // Expose to loop
  const creditsRef = useRef(100);
  const dronesRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let bioCredits = 100 + level * 20;
    creditsRef.current = bioCredits;
    setCredits(bioCredits);
    const goalCredits = 500 + level * 350;
    setTargetCredits(goalCredits);

    // 12 Hydroponic bio-plots
    interface Plot {
      id: number;
      c: number;
      r: number;
      crop: 'sprout' | 'melon' | 'quantum' | null;
      stage: number; // 0 to 1 growth progress
      growthSpeed: number;
      value: number;
    }

    const plots: Plot[] = [];
    const cols = 4;
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        plots.push({
          id: r * cols + c,
          c,
          r,
          crop: (r + c) % 2 === 0 ? 'sprout' : null,
          stage: 0.2,
          growthSpeed: 0.18 + Math.random() * 0.05,
          value: 30,
        });
      }
    }

    // Canvas click to plant or harvest
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / rect.width;
      const clickY = (e.clientY - rect.top) / rect.height;

      // Check buy drone button area (top right)
      if (clickX > 0.72 && clickY < 0.15) {
        if (creditsRef.current >= 150) {
          bioCredits -= 150;
          creditsRef.current = bioCredits;
          dronesRef.current += 1;
          setCredits(bioCredits);
          setDrones(dronesRef.current);
          sound.playTone(800, 'sine', 0.1);
        }
        return;
      }

      // Check plot clicks
      const gridW = 0.8;
      const gridH = 0.7;
      const gridStartX = 0.1;
      const gridStartY = 0.2;

      if (clickX >= gridStartX && clickX <= gridStartX + gridW && clickY >= gridStartY && clickY <= gridStartY + gridH) {
        const pc = Math.floor(((clickX - gridStartX) / gridW) * cols);
        const pr = Math.floor(((clickY - gridStartY) / gridH) * rows);
        const plot = plots.find((p) => p.c === pc && p.r === pr);

        if (plot) {
          if (plot.crop === null) {
            // Plant crop (Cost 15 credits)
            if (creditsRef.current >= 15) {
              bioCredits -= 15;
              creditsRef.current = bioCredits;
              setCredits(bioCredits);
              plot.crop = level > 3 ? 'melon' : 'sprout';
              plot.stage = 0.05;
              plot.value = plot.crop === 'melon' ? 60 : 35;
              sound.playTone(450, 'sine', 0.06);
            }
          } else if (plot.stage >= 1.0) {
            // Harvest crop!
            bioCredits += plot.value;
            creditsRef.current = bioCredits;
            setCredits(bioCredits);
            plot.crop = null;
            plot.stage = 0;
            sound.playCoin();

            if (bioCredits >= goalCredits) {
              sound.playWin();
              setGameWon(true);
            }
          } else {
            // Water / accelerate growth
            plot.stage = Math.min(1.0, plot.stage + 0.35);
            sound.playTone(600, 'sine', 0.04);
          }
        }
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

      if (!isPaused && !gameWon) {
        // Grow crops
        for (const p of plots) {
          if (p.crop !== null && p.stage < 1.0) {
            p.stage = Math.min(1.0, p.stage + p.growthSpeed * dt);
          }
        }

        // Harvester drones automatically collect ready crops
        if (dronesRef.current > 0) {
          for (let d = 0; d < dronesRef.current; d++) {
            const readyPlot = plots.find((p) => p.crop !== null && p.stage >= 1.0);
            if (readyPlot) {
              bioCredits += readyPlot.value;
              creditsRef.current = bioCredits;
              setCredits(bioCredits);
              readyPlot.crop = 'sprout';
              readyPlot.stage = 0.05;
              readyPlot.value = 35;
              sound.playCoin();

              if (bioCredits >= goalCredits) {
                sound.playWin();
                setGameWon(true);
                return;
              }
            }
          }
        }
      }

      // RENDER
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Bio-dome Glass Ceiling
      const domeGrad = ctx.createLinearGradient(0, 0, 0, h * 0.4);
      domeGrad.addColorStop(0, '#0c4a6e');
      domeGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = domeGrad;
      ctx.fillRect(0, 0, w, h * 0.4);

      // Draw Plots
      const gridW = w * 0.8;
      const gridH = h * 0.7;
      const startX = w * 0.1;
      const startY = h * 0.2;
      const cellW = gridW / cols;
      const cellH = gridH / rows;

      for (const p of plots) {
        const px = startX + p.c * cellW + 6;
        const py = startY + p.r * cellH + 6;
        const pw = cellW - 12;
        const ph = cellH - 12;

        // Hydroponic bed
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 12);
        ctx.fill();
        ctx.stroke();

        // Water/Nutrient fluid pool
        ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.fillRect(px + 6, py + 6, pw - 12, ph - 12);

        // Crop rendering
        if (p.crop !== null) {
          const cx = px + pw * 0.5;
          const cy = py + ph * 0.55;
          const size = Math.min(pw, ph) * 0.35 * Math.max(0.2, p.stage);

          // Glowing Flora
          const floraColor = p.stage >= 1.0 ? '#10b981' : p.crop === 'melon' ? '#ec4899' : '#38bdf8';
          ctx.fillStyle = floraColor;
          ctx.shadowColor = floraColor;
          ctx.shadowBlur = p.stage >= 1.0 ? 14 : 4;

          ctx.beginPath();
          ctx.arc(cx, cy, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Ready indicator
          if (p.stage >= 1.0) {
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('HARVEST!', cx, py + 18);
          } else {
            // Growth progress bar
            ctx.fillStyle = '#334155';
            ctx.fillRect(cx - 20, py + ph - 14, 40, 4);
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(cx - 20, py + ph - 14, 40 * p.stage, 4);
          }
        } else {
          // Empty plot click prompt
          ctx.fillStyle = '#64748b';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('+ Plant', px + pw * 0.5, py + ph * 0.5);
        }
      }

      // Drone buy button banner (top right)
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(w * 0.72, 12, w * 0.25, 42, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+ Drone (150 C)', w * 0.845, 30);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.fillText(`Active: ${dronesRef.current}`, w * 0.845, 44);

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
          <span className="text-cyan-400 font-bold">MILESTONE {level} / 20</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">💎 {credits} BIO-CREDITS</span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-emerald-400 font-bold">GOAL: {targetCredits} CREDITS</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-slate-400 text-xs bg-slate-900/70 px-4 py-1.5 rounded-full border border-slate-700/60">
        Click empty plots to plant flora, click water to accelerate, harvest when fully grown
      </div>

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">HARVEST MILESTONE REACHED!</h2>
          <p className="text-slate-300 text-sm mt-2">Bio-Dome quota achieved with surplus credits.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Sector (Milestone {Math.min(20, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
