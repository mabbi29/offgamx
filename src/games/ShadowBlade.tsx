import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const ShadowBlade: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [score, setScore] = useState(0);
  const [dronesSliced, setDronesSliced] = useState(0);
  const [progress, setProgress] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const touchJump = useRef(false);
  const touchSlash = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const targetDist = 1500 + level * 300;
    let distTravelled = 0;
    let currentScore = 0;
    let slicedCount = 0;

    // Ninja physics
    let playerY = 0; // vertical offset from ground
    let vy = 0;
    let jumpsLeft = 2;
    let isSlashing = false;
    let slashTimer = 0;

    // Drones & hurdles
    interface Drone {
      x: number;
      y: number;
      alive: boolean;
    }
    const drones: Drone[] = [];
    for (let x = 300; x < targetDist - 100; x += 110 + Math.random() * 80) {
      drones.push({ x, y: 0.55 + (Math.random() - 0.5) * 0.25, alive: true });
    }

    const doJump = () => {
      if (jumpsLeft > 0) {
        vy = -14;
        jumpsLeft--;
        sound.playJump();
      }
    };

    const doSlash = () => {
      isSlashing = true;
      slashTimer = 0.22;
      sound.playLaser();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        doJump();
      }
      if (['KeyJ', 'KeyX', 'Enter'].includes(e.code)) {
        e.preventDefault();
        doSlash();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

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
        if (touchJump.current) {
          touchJump.current = false;
          doJump();
        }
        if (touchSlash.current) {
          touchSlash.current = false;
          doSlash();
        }

        const runSpeed = 260 + level * 10;
        distTravelled += runSpeed * dt;
        currentScore += Math.floor(runSpeed * dt * 2);

        // Gravity
        vy += 38 * dt;
        playerY += vy * dt * 30;

        if (playerY >= 0) {
          playerY = 0;
          vy = 0;
          jumpsLeft = 2; // reset double jump
        }

        // Slash timer
        if (isSlashing) {
          slashTimer -= dt;
          if (slashTimer <= 0) isSlashing = false;
        }

        // Ninja position
        const ninjaScreenX = w * 0.25;
        const groundY = h * 0.76;
        const ninjaScreenY = groundY + playerY;

        // Check Drone collision / slash
        for (const dr of drones) {
          if (!dr.alive) continue;
          const drScreenX = dr.x - distTravelled + ninjaScreenX;
          const drScreenY = dr.y * h;

          const dist = Math.hypot(drScreenX - ninjaScreenX, drScreenY - ninjaScreenY);

          if (dist < 42) {
            if (isSlashing) {
              dr.alive = false;
              slicedCount++;
              setDronesSliced(slicedCount);
              currentScore += 300;
              sound.playExplosion();
            } else {
              sound.playHit();
              setGameOver(true);
              return;
            }
          }
        }

        const pct = Math.min(100, Math.floor((distTravelled / targetDist) * 100));
        setProgress(pct);
        setScore(currentScore);

        if (distTravelled >= targetDist) {
          sound.playWin();
          setGameWon(true);
          return;
        }
      }

      // RENDER
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Distant Cyber City buildings parallax
      const horizonY = h * 0.45;
      const bWidth = 60;
      const bOffset = (distTravelled * 0.2) % bWidth;

      ctx.fillStyle = '#1e1b4b';
      for (let x = -bOffset; x < w + bWidth; x += bWidth) {
        const bH = 120 + Math.sin(x * 0.05) * 40;
        ctx.fillRect(x, horizonY - bH + 60, bWidth - 4, bH);
      }

      // Rooftop ledge floor
      const groundY = h * 0.76;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, groundY, w, h - groundY);

      // Neon rooftop trim
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.fillRect(0, groundY, w, 4);
      ctx.shadowBlur = 0;

      // Draw Drones
      const ninjaScreenX = w * 0.25;
      for (const dr of drones) {
        if (!dr.alive) continue;
        const drScreenX = dr.x - distTravelled + ninjaScreenX;
        const drScreenY = dr.y * h;
        if (drScreenX < -40 || drScreenX > w + 40) continue;

        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(drScreenX, drScreenY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Drone wings
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(drScreenX - 20, drScreenY - 2, 40, 4);
      }

      // Draw Cyber Ninja
      const ninjaScreenY = groundY + playerY;

      // Shadow on roof
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(ninjaScreenX, groundY + 4, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ninja Body
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(ninjaScreenX - 10, ninjaScreenY - 32, 20, 30, 4);
      ctx.fill();

      // Cyan scarf trailing
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(ninjaScreenX - 22, ninjaScreenY - 26, 14, 4);

      // Katana & Slash Arc
      if (isSlashing) {
        ctx.strokeStyle = '#facc15';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(ninjaScreenX + 16, ninjaScreenY - 16, 36, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Holstered Katana blade
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ninjaScreenX + 6, ninjaScreenY - 20);
        ctx.lineTo(ninjaScreenX + 22, ninjaScreenY - 34);
        ctx.stroke();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      ro.disconnect();
    };
  }, [level, isPaused, gameOver, gameWon]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-slate-950 select-none overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="w-full h-full flex-1 block" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">LEVEL {level} / 25</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">🗡️ DRONES: {dronesSliced}</span>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span>RUN: {progress}%</span>
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Mobile action buttons */}
      <div className="absolute bottom-4 right-4 flex gap-3 pointer-events-auto sm:hidden">
        <button
          onTouchStart={() => (touchJump.current = true)}
          className="w-16 h-16 rounded-2xl bg-slate-800 active:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center border border-slate-700"
        >
          JUMP
        </button>
        <button
          onTouchStart={() => (touchSlash.current = true)}
          className="w-16 h-16 rounded-2xl bg-amber-500 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center border border-amber-400 shadow-lg"
        >
          SLASH
        </button>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">NINJA DOWN!</h2>
          <p className="text-slate-300 text-sm mt-2">Slash drones with [J / Slash] before impact.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Retry Dash
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">ROOFTOP MASTERED!</h2>
          <p className="text-slate-300 text-sm mt-2">All perimeter drones sliced clean.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Rooftop (Level {Math.min(25, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
