import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const AstroMiner: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [depth, setDepth] = useState(0);
  const [targetDepth, setTargetDepth] = useState(1000 + level * 400);
  const [heat, setHeat] = useState(20);
  const [ore, setOre] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const isDrillingRef = useRef(false);
  const isCoolingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentDepth = 0;
    const goalDepth = 1000 + level * 400;
    setTargetDepth(goalDepth);
    let drillHeat = 20;
    let collectedOre = 0;

    // Keys
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'KeyW', 'ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
      }
      keys[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

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

      if (!isPaused && !gameOver && !gameWon) {
        const drilling = keys['Space'] || keys['ArrowDown'] || keys['KeyS'] || isDrillingRef.current;
        const cooling = keys['KeyW'] || keys['ArrowUp'] || isCoolingRef.current;

        if (drilling) {
          const drillSpeed = 120 + level * 8;
          currentDepth += drillSpeed * dt;
          drillHeat += 32 * dt;
          collectedOre += Math.floor(drillSpeed * dt * 0.4);

          if (Math.random() < 0.2) sound.playTone(180, 'sawtooth', 0.05);
        } else {
          drillHeat = Math.max(10, drillHeat - 15 * dt);
        }

        if (cooling) {
          drillHeat = Math.max(10, drillHeat - 55 * dt);
          if (Math.random() < 0.2) sound.playTone(800, 'sine', 0.03);
        }

        setDepth(Math.floor(currentDepth));
        setHeat(Math.floor(drillHeat));
        setOre(collectedOre);

        // Overheat check
        if (drillHeat >= 100) {
          sound.playExplosion();
          setGameOver(true);
          return;
        }

        // Win check
        if (currentDepth >= goalDepth) {
          sound.playWin();
          setGameWon(true);
          return;
        }
      }

      // RENDER
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Subterranean Rock Strata Scrolling
      const strataHeight = 60;
      const offset = (currentDepth * 1.5) % strataHeight;

      const strataColors = ['#1e1b4b', '#3b0764', '#172554', '#1e293b', '#451a03'];
      for (let y = -offset; y < h + strataHeight; y += strataHeight) {
        const idx = Math.floor((currentDepth + y) / strataHeight) % strataColors.length;
        ctx.fillStyle = strataColors[Math.abs(idx)];
        ctx.fillRect(0, y, w, strataHeight - 2);

        // Mineral Crystals inside rock
        ctx.fillStyle = idx % 2 === 0 ? '#38bdf8' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(w * 0.25, y + 25, 4, 0, Math.PI * 2);
        ctx.arc(w * 0.75, y + 40, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Planetary Drill Rig in center
      const drillX = w * 0.5;
      const drillY = h * 0.45;
      const drillW = 50;

      // Drill housing
      ctx.fillStyle = '#475569';
      ctx.fillRect(drillX - drillW * 0.5, drillY - 90, drillW, 90);

      // Rotating Drill Bit Cone
      const bitH = 70;
      const heatHue = Math.max(0, 180 - (drillHeat / 100) * 180); // Cyan to Red
      ctx.fillStyle = `hsl(${heatHue}, 100%, 50%)`;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = drillHeat > 60 ? 16 : 4;

      ctx.beginPath();
      ctx.moveTo(drillX - drillW * 0.5, drillY);
      ctx.lineTo(drillX + drillW * 0.5, drillY);
      ctx.lineTo(drillX, drillY + bitH);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Drill teeth
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(drillX - 10, drillY + 20, 20, 4);
      ctx.fillRect(drillX - 6, drillY + 40, 12, 4);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      ro.disconnect();
    };
  }, [level, isPaused, gameOver, gameWon]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-slate-950 select-none overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="w-full h-full flex-1 block" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">SECTOR {level} / 25</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">
            DEPTH: {depth}m / {targetDepth}m
          </span>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-slate-300">HEAT:</span>
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all ${heat > 75 ? 'bg-rose-500' : 'bg-cyan-400'}`}
              style={{ width: `${heat}%` }}
            />
          </div>
          <span className="text-amber-400 font-bold">ORE: {ore}</span>
        </div>
      </div>

      {/* Mobile action buttons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto sm:hidden">
        <button
          onTouchStart={() => (isCoolingRef.current = true)}
          onTouchEnd={() => (isCoolingRef.current = false)}
          className="px-6 py-3 rounded-2xl bg-cyan-600 text-white font-bold text-xs shadow-lg"
        >
          COOL DRILL
        </button>
        <button
          onTouchStart={() => (isDrillingRef.current = true)}
          onTouchEnd={() => (isDrillingRef.current = false)}
          className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs shadow-lg"
        >
          DRILL DOWN
        </button>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">DRILL OVERHEATED!</h2>
          <p className="text-slate-300 text-sm mt-2">Cool the drill bit before heat reaches 100%.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Rebuild Drill
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">SECTOR DEPTH CONQUERED!</h2>
          <p className="text-slate-300 text-sm mt-2">Geological core reached with rare mineral samples.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Sector (Level {Math.min(25, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
