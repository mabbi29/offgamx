import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const OrbitDash: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [ringIndex, setRingIndex] = useState(0);
  const [totalRings, setTotalRings] = useState(6 + Math.floor(level / 3));
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const tapTrigger = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const goalRings = 6 + Math.floor(level / 3);
    setTotalRings(goalRings);

    interface PlanetRing {
      x: number;
      y: number;
      radius: number;
      color: string;
      direction: 1 | -1;
    }

    const rings: PlanetRing[] = [];
    const colors = ['#06b6d4', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];
    for (let i = 0; i < goalRings; i++) {
      rings.push({
        x: 0.2 + (i * 0.6) / (goalRings - 1) + (i % 2 === 0 ? 0.05 : -0.05),
        y: 0.3 + (i % 2) * 0.4,
        radius: 35 + (i % 3) * 6,
        color: colors[i % colors.length],
        direction: i % 2 === 0 ? 1 : -1,
      });
    }

    // Ship state
    let currentRingIdx = 0;
    let angle = 0;
    let isFlying = false;
    let shipX = rings[0].x;
    let shipY = rings[0].y;
    let shipVx = 0;
    let shipVy = 0;

    const launchShip = () => {
      if (isFlying) return;
      isFlying = true;
      const curr = rings[currentRingIdx];
      // Tangential velocity vector
      const speed = 0.85;
      const tangAngle = angle + (curr.direction > 0 ? Math.PI * 0.5 : -Math.PI * 0.5);
      shipVx = Math.cos(tangAngle) * speed;
      shipVy = Math.sin(tangAngle) * speed;
      sound.playLaser();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'Enter'].includes(e.code)) {
        e.preventDefault();
        launchShip();
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
        if (tapTrigger.current) {
          tapTrigger.current = false;
          launchShip();
        }

        if (!isFlying) {
          const curr = rings[currentRingIdx];
          angle += curr.direction * 3.5 * dt;
          shipX = curr.x + (Math.cos(angle) * curr.radius) / w;
          shipY = curr.y + (Math.sin(angle) * curr.radius) / h;
        } else {
          // Free flight
          shipX += shipVx * dt;
          shipY += shipVy * dt;

          // Out of bounds check
          if (shipX < -0.05 || shipX > 1.05 || shipY < -0.05 || shipY > 1.05) {
            sound.playHit();
            setGameOver(true);
            return;
          }

          // Check capture by next rings
          for (let i = 0; i < rings.length; i++) {
            if (i === currentRingIdx) continue;
            const r = rings[i];
            const dist = Math.hypot((shipX - r.x) * w, (shipY - r.y) * h);

            if (Math.abs(dist - r.radius) < 22) {
              // Captured by ring!
              currentRingIdx = i;
              isFlying = false;
              angle = Math.atan2((shipY - r.y) * h, (shipX - r.x) * w);
              setRingIndex(currentRingIdx);
              sound.playCoin();

              if (currentRingIdx === rings.length - 1) {
                sound.playWin();
                setGameWon(true);
                return;
              }
              break;
            }
          }
        }
      }

      // RENDER
      ctx.fillStyle = '#080c18';
      ctx.fillRect(0, 0, w, h);

      // Distant Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let s = 0; s < 40; s++) {
        ctx.fillRect((s * 47) % w, (s * 31) % h, 2, 2);
      }

      // Render Planetary Rings
      for (let i = 0; i < rings.length; i++) {
        const r = rings[i];
        const rx = r.x * w;
        const ry = r.y * h;

        // Core Planet
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.arc(rx, ry, 12, 0, Math.PI * 2);
        ctx.fill();

        // Orbital Ring
        ctx.strokeStyle = i === currentRingIdx ? '#38bdf8' : 'rgba(255, 255, 255, 0.25)';
        ctx.shadowColor = r.color;
        ctx.shadowBlur = i === currentRingIdx ? 12 : 2;
        ctx.lineWidth = i === currentRingIdx ? 3 : 1.5;
        ctx.beginPath();
        ctx.arc(rx, ry, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Sequence number
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`${i + 1}`, rx - 3, ry + 3);
      }

      // Render Ship
      const sx = shipX * w;
      const sy = shipY * h;

      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

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
    <div
      ref={containerRef}
      onClick={() => (tapTrigger.current = true)}
      className="relative w-full h-full min-h-[460px] bg-slate-950 select-none overflow-hidden flex flex-col cursor-pointer"
    >
      <canvas ref={canvasRef} className="w-full h-full flex-1 block" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">LEVEL {level} / 25</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">
            RING: {ringIndex + 1} / {totalRings}
          </span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400">TAP SCREEN / SPACE TO SLINGSHOT</span>
        </div>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">LOST IN DEEP SPACE!</h2>
          <p className="text-slate-300 text-sm mt-2">Time your release to sling into the next ring's gravity well.</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Launch Again
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">ORBIT CHAIN COMPLETE!</h2>
          <p className="text-slate-300 text-sm mt-2">All orbital rings successfully navigated.</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next System (Level {Math.min(25, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
