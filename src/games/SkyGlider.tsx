import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const SkyGlider: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [ringsHit, setRingsHit] = useState(0);
  const [totalRings, setTotalRings] = useState(10 + level * 2);
  const [progress, setProgress] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const steerDirRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let planeX = 0; // -1 to 1
    let planeY = 0; // -1 (high) to 1 (low)
    let planeRoll = 0;
    let planeZ = 0;
    const courseDist = 1400 + level * 300;

    let ringsCleared = 0;
    const targetRingsCount = 10 + level * 2;
    setTotalRings(targetRingsCount);

    interface Ring {
      z: number;
      x: number;
      y: number;
      passed?: boolean;
      hit?: boolean;
    }
    const rings: Ring[] = [];
    for (let i = 0; i < targetRingsCount; i++) {
      rings.push({
        z: 250 + i * ((courseDist - 300) / targetRingsCount),
        x: (Math.sin(i * 1.5) * 0.6),
        y: (Math.cos(i * 1.2) * 0.4),
      });
    }

    // Keys
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
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
        const flightSpeed = 220 + level * 10;
        planeZ += flightSpeed * dt;

        // Steering
        let dx = 0;
        let dy = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
        if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
        if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
        if (keys['ArrowDown'] || keys['KeyS']) dy += 1;

        if (steerDirRef.current.x !== 0) dx = steerDirRef.current.x;
        if (steerDirRef.current.y !== 0) dy = steerDirRef.current.y;

        planeX += dx * dt * 1.4;
        planeY += dy * dt * 1.2;
        planeX = Math.max(-0.9, Math.min(0.9, planeX));
        planeY = Math.max(-0.8, Math.min(0.8, planeY));

        planeRoll = dx * 0.35; // Bank angle

        // Check canyon rock boundary
        if (Math.abs(planeX) > 0.88 || Math.abs(planeY) > 0.82) {
          sound.playHit();
          setGameOver(true);
          return;
        }

        // Check Rings
        for (const ring of rings) {
          if (!ring.passed && Math.abs(planeZ - ring.z) < 20) {
            ring.passed = true;
            if (Math.hypot(planeX - ring.x, planeY - ring.y) < 0.28) {
              ring.hit = true;
              ringsCleared++;
              setRingsHit(ringsCleared);
              sound.playCoin();
            } else {
              sound.playTone(300, 'sine', 0.05);
            }
          }
        }

        const pct = Math.min(100, Math.floor((planeZ / courseDist) * 100));
        setProgress(pct);

        if (planeZ >= courseDist) {
          if (ringsCleared >= Math.floor(targetRingsCount * 0.7)) {
            sound.playWin();
            setGameWon(true);
          } else {
            setGameOver(true);
          }
          return;
        }
      }

      // RENDER
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      const horizonY = h * 0.5;

      // Canyon sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(1, '#f97316');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizonY);

      // Canyon rock gorge (Left and Right cliffs in 3D perspective)
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.35, horizonY);
      ctx.lineTo(w * 0.1, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w, 0);
      ctx.lineTo(w * 0.65, horizonY);
      ctx.lineTo(w * 0.9, h);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Canyon floor
      const floorGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      floorGrad.addColorStop(0, '#78350f');
      floorGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(w * 0.1, horizonY, w * 0.8, h - horizonY);

      // Render Checkpoint Rings (Sorted far to near)
      const visibleRings = rings.filter((r) => r.z - planeZ > 0 && r.z - planeZ < 800);
      visibleRings.sort((a, b) => b.z - a.z);

      for (const r of visibleRings) {
        const relZ = r.z - planeZ;
        const normZ = 1 - relZ / 800;
        const p = Math.pow(normZ, 2.2);

        const rx = w * 0.5 + r.x * (w * 0.45) * p;
        const ry = horizonY + r.y * (h * 0.38) * p;
        const rad = Math.max(12, 55 * p);

        ctx.strokeStyle = r.hit ? '#10b981' : '#06b6d4';
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 10;
        ctx.lineWidth = Math.max(3, 8 * p);
        ctx.beginPath();
        ctx.arc(rx, ry, rad, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Render Jet Glider (Player)
      const px = w * 0.5 + planeX * (w * 0.4);
      const py = horizonY + planeY * (h * 0.35) + 30;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(planeRoll);

      // Jet afterburner
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 16, 6 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Delta Wing Jet Body
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(34, 16);
      ctx.lineTo(0, 8);
      ctx.lineTo(-34, 16);
      ctx.closePath();
      ctx.fill();

      // Canopy Glass
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(-4, -14, 8, 14, 3);
      ctx.fill();

      ctx.restore();

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
          <span className="text-cyan-400 font-bold">COURSE {level} / 20</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-bold">
            ⭕ RINGS: {ringsHit} / {totalRings}
          </span>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span>PROGRESS: {progress}%</span>
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Mobile steering D-pad */}
      <div className="absolute bottom-4 left-4 grid grid-cols-3 gap-1 w-32 pointer-events-auto sm:hidden">
        <div />
        <button
          onTouchStart={() => (steerDirRef.current.y = -1)}
          onTouchEnd={() => (steerDirRef.current.y = 0)}
          className="w-10 h-10 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold"
        >
          ▲
        </button>
        <div />
        <button
          onTouchStart={() => (steerDirRef.current.x = -1)}
          onTouchEnd={() => (steerDirRef.current.x = 0)}
          className="w-10 h-10 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold"
        >
          ◀
        </button>
        <button
          onTouchStart={() => (steerDirRef.current.y = 1)}
          onTouchEnd={() => (steerDirRef.current.y = 0)}
          className="w-10 h-10 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold"
        >
          ▼
        </button>
        <button
          onTouchStart={() => (steerDirRef.current.x = 1)}
          onTouchEnd={() => (steerDirRef.current.x = 0)}
          className="w-10 h-10 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold"
        >
          ▶
        </button>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">CANYON CRASH!</h2>
          <p className="text-slate-300 text-sm mt-2">Steer through checkpoint rings and avoid cliff faces.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Fly Again
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">COURSE CONQUERED!</h2>
          <p className="text-slate-300 text-sm mt-2">All rings navigated at supersonic glider speed.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Course (Level {Math.min(20, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
