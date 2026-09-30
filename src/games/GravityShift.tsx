import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const GravityShift: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const tapTrigger = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const targetDistance = 1200 + level * 300;
    let distanceTravelled = 0;
    let currentScore = 0;

    // Player state
    let playerY = 0.8; // normalized 0 (ceiling) to 1 (floor)
    let gravityDirection = 1; // 1 = down (floor), -1 = up (ceiling)
    let vy = 0;
    let isGrounded = true;

    // Obstacles: Floor and ceiling spikes, laser barriers, floating orbs
    interface Hazard {
      x: number;
      type: 'spike-floor' | 'spike-ceiling' | 'barrier' | 'coin';
      w: number;
      h: number;
      collected?: boolean;
    }

    const hazards: Hazard[] = [];
    for (let x = 300; x < targetDistance - 150; x += 90 + Math.random() * 80) {
      const rand = Math.random();
      if (rand < 0.35) {
        hazards.push({ x, type: 'spike-floor', w: 26, h: 28 });
      } else if (rand < 0.7) {
        hazards.push({ x, type: 'spike-ceiling', w: 26, h: 28 });
      } else if (rand < 0.88) {
        hazards.push({ x, type: 'barrier', w: 18, h: 60 });
      } else {
        hazards.push({ x, type: 'coin', w: 18, h: 18 });
      }
    }

    const flipGravity = () => {
      gravityDirection *= -1;
      isGrounded = false;
      vy = gravityDirection * 0.4;
      sound.playJump();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        flipGravity();
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
          flipGravity();
        }

        const runSpeed = 240 + level * 10;
        distanceTravelled += runSpeed * dt;
        currentScore += Math.floor(runSpeed * dt * 2);

        // Gravity physics
        vy += gravityDirection * 5.0 * dt;
        playerY += vy * dt;

        // Floor collision
        if (playerY >= 0.82) {
          playerY = 0.82;
          vy = 0;
          isGrounded = true;
        }
        // Ceiling collision
        if (playerY <= 0.18) {
          playerY = 0.18;
          vy = 0;
          isGrounded = true;
        }

        // Check hazard collisions
        const playerScreenX = w * 0.22;
        const playerActualY = playerY * h;
        const playerSize = 22;

        for (const hz of hazards) {
          const hzScreenX = hz.x - distanceTravelled + playerScreenX;
          if (Math.abs(hzScreenX - playerScreenX) < (playerSize + hz.w) * 0.5) {
            if (hz.type === 'coin' && !hz.collected) {
              if (Math.abs(playerActualY - h * 0.5) < 70) {
                hz.collected = true;
                currentScore += 250;
                sound.playCoin();
              }
            } else if (hz.type === 'spike-floor') {
              if (playerY > 0.72) {
                sound.playHit();
                setGameOver(true);
                return;
              }
            } else if (hz.type === 'spike-ceiling') {
              if (playerY < 0.28) {
                sound.playHit();
                setGameOver(true);
                return;
              }
            } else if (hz.type === 'barrier') {
              if (Math.abs(playerActualY - h * 0.5) < hz.h * 0.5) {
                sound.playHit();
                setGameOver(true);
                return;
              }
            }
          }
        }

        const pct = Math.min(100, Math.floor((distanceTravelled / targetDistance) * 100));
        setProgress(pct);
        setScore(currentScore);

        if (distanceTravelled >= targetDistance) {
          sound.playWin();
          setGameWon(true);
          return;
        }
      }

      // RENDER
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Neon tunnel background grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      const gridOffset = (distanceTravelled * 0.5) % 40;
      for (let x = -gridOffset; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Ceiling and floor tracks
      const ceilingY = h * 0.16;
      const floorY = h * 0.84;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w, ceilingY);
      ctx.fillRect(0, floorY, w, h - floorY);

      // Neon rails
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.fillRect(0, ceilingY - 3, w, 3);
      ctx.fillRect(0, floorY, w, 3);
      ctx.shadowBlur = 0;

      // Draw Hazards
      const playerScreenX = w * 0.22;
      for (const hz of hazards) {
        const hx = hz.x - distanceTravelled + playerScreenX;
        if (hx < -50 || hx > w + 50) continue;

        if (hz.type === 'spike-floor') {
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(hx, floorY - hz.h);
          ctx.lineTo(hx - hz.w * 0.5, floorY);
          ctx.lineTo(hx + hz.w * 0.5, floorY);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (hz.type === 'spike-ceiling') {
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(hx, ceilingY + hz.h);
          ctx.lineTo(hx - hz.w * 0.5, ceilingY);
          ctx.lineTo(hx + hz.w * 0.5, ceilingY);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (hz.type === 'barrier') {
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.fillRect(hx - hz.w * 0.5, h * 0.5 - hz.h * 0.5, hz.w, hz.h);
          ctx.shadowBlur = 0;
        } else if (hz.type === 'coin' && !hz.collected) {
          ctx.fillStyle = '#facc15';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(hx, h * 0.5, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Draw Player Runner (Neon Cyber Cube with trailing particles)
      const py = playerY * h;
      const pSize = 22;

      // Trailing glow
      ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.fillRect(playerScreenX - pSize * 1.5, py - pSize * 0.4, pSize, pSize * 0.8);

      // Player body
      const pGrad = ctx.createLinearGradient(playerScreenX - pSize * 0.5, py - pSize * 0.5, playerScreenX + pSize * 0.5, py + pSize * 0.5);
      pGrad.addColorStop(0, '#38bdf8');
      pGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = pGrad;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(playerScreenX - pSize * 0.5, py - pSize * 0.5, pSize, pSize, 5);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(playerScreenX + 2, py - (gravityDirection > 0 ? 4 : 0), 5, 5);

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

      {/* HUD overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">LEVEL {level} / 30</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">SCORE: {score}</span>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span>PROGRESS: {progress}%</span>
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Mobile tap prompt */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-slate-400 text-xs bg-slate-900/70 px-4 py-1.5 rounded-full border border-slate-700/60">
        Tap screen or press Space / Up to flip gravity
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">SPIKE HIT!</h2>
          <p className="text-slate-300 text-sm mt-2">Time your gravity flips between ceiling and floor.</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Try Again
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">CORRIDOR CLEARED!</h2>
          <p className="text-slate-300 text-sm mt-2">Gravity chamber navigated successfully.</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Chamber (Level {Math.min(30, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
