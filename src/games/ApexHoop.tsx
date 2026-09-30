import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const ApexHoop: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [baskets, setBaskets] = useState(0);
  const [targetBaskets, setTargetBaskets] = useState(3 + Math.floor(level / 5));
  const [ballsLeft, setBallsLeft] = useState(6);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let madeCount = 0;
    const goalBaskets = 3 + Math.floor(level / 5);
    setTargetBaskets(goalBaskets);
    let remainingBalls = 6;

    // Moving hoop parameters
    let hoopOffset = 0;
    let hoopDir = 1;

    // Ball physics
    interface Ball {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      inAir: boolean;
      scored: boolean;
    }

    let currentBall: Ball = {
      x: 0.2,
      y: 0.72,
      vx: 0,
      vy: 0,
      radius: 16,
      inAir: false,
      scored: false,
    };

    // Aim drag
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let dragCurrent = { x: 0, y: 0 };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (currentBall.inAir) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;

      if (Math.hypot(px - currentBall.x, py - currentBall.y) < 0.15) {
        isDragging = true;
        dragStart = { x: px, y: py };
        dragCurrent = { x: px, y: py };
      }
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      dragCurrent = {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
      };
    };

    const handlePointerUp = () => {
      if (!isDragging) return;
      isDragging = false;

      // Shoot ball
      const dx = dragStart.x - dragCurrent.x;
      const dy = dragStart.y - dragCurrent.y;

      if (Math.hypot(dx, dy) > 0.03) {
        currentBall.vx = dx * 14;
        currentBall.vy = dy * 14;
        currentBall.inAir = true;
        sound.playTone(300, 'sine', 0.08);
      }
    };

    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('touchstart', handlePointerDown);
    canvas.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

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
        // Move hoop if level > 2
        if (level > 2) {
          hoopOffset += hoopDir * dt * 0.15;
          if (Math.abs(hoopOffset) > 0.08) hoopDir *= -1;
        }

        const rimX = 0.78;
        const rimY = 0.42 + hoopOffset;
        const rimRadius = 0.055;

        // Ball physics
        if (currentBall.inAir) {
          currentBall.vy += 12.0 * dt; // gravity
          currentBall.x += currentBall.vx * dt;
          currentBall.y += currentBall.vy * dt;

          // Backboard bounce
          const boardX = 0.84;
          if (currentBall.x >= boardX - 0.015 && currentBall.y >= rimY - 0.14 && currentBall.y <= rimY + 0.05) {
            currentBall.vx = -Math.abs(currentBall.vx) * 0.65;
            sound.playTone(220, 'square', 0.05);
          }

          // Rim check: going downwards through rim
          if (
            !currentBall.scored &&
            currentBall.vy > 0 &&
            Math.abs(currentBall.x - rimX) < rimRadius * 0.7 &&
            Math.abs(currentBall.y - rimY) < 0.03
          ) {
            currentBall.scored = true;
            madeCount++;
            setBaskets(madeCount);
            sound.playTone(880, 'sine', 0.15); // Swish!
            sound.playTone(1320, 'sine', 0.2);

            if (madeCount >= goalBaskets) {
              sound.playWin();
              setGameWon(true);
              return;
            }
          }

          // Ball hits ground or falls offscreen
          if (currentBall.y > 0.88 || currentBall.x > 1.1 || currentBall.x < -0.1) {
            remainingBalls--;
            setBallsLeft(remainingBalls);

            if (remainingBalls <= 0 && madeCount < goalBaskets) {
              sound.playHit();
              setGameOver(true);
              return;
            } else {
              // Reset new ball
              currentBall = {
                x: 0.18 + Math.random() * 0.1,
                y: 0.72,
                vx: 0,
                vy: 0,
                radius: 16,
                inAir: false,
                scored: false,
              };
            }
          }
        }
      }

      // RENDER
      ctx.fillStyle = '#0a0d18';
      ctx.fillRect(0, 0, w, h);

      // Cyber Court floor
      const floorY = h * 0.82;
      const courtGrad = ctx.createLinearGradient(0, floorY, 0, h);
      courtGrad.addColorStop(0, '#1e293b');
      courtGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = courtGrad;
      ctx.fillRect(0, floorY, w, h - floorY);

      // Court Lines
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, floorY + 20, w * 0.35, 18, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Hoop
      const rimScreenX = 0.78 * w;
      const rimScreenY = (0.42 + hoopOffset) * h;
      const boardScreenX = 0.84 * w;

      // Pole & Backboard
      ctx.fillStyle = '#475569';
      ctx.fillRect(boardScreenX, rimScreenY - 80, 8, 160);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.fillRect(boardScreenX - 4, rimScreenY - 70, 8, 90);
      ctx.strokeRect(boardScreenX - 4, rimScreenY - 70, 8, 90);

      // Rim
      ctx.strokeStyle = '#f97316';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(rimScreenX, rimScreenY, 26, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Net
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      for (let n = -22; n <= 22; n += 6) {
        ctx.beginPath();
        ctx.moveTo(rimScreenX + n, rimScreenY);
        ctx.lineTo(rimScreenX + n * 0.5, rimScreenY + 28);
        ctx.stroke();
      }

      // Draw Trajectory Aim Line
      if (isDragging) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);

        const startX = currentBall.x * w;
        const startY = currentBall.y * h;
        const pullVx = (dragStart.x - dragCurrent.x) * 14;
        const pullVy = (dragStart.y - dragCurrent.y) * 14;

        ctx.beginPath();
        ctx.moveTo(startX, startY);

        let simX = startX;
        let simY = startY;
        let simVy = pullVy;
        for (let step = 0; step < 18; step++) {
          simX += pullVx * (w * 0.02);
          simVy += 12.0 * 0.02;
          simY += simVy * (h * 0.02);
          ctx.lineTo(simX, simY);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Basketball
      const bx = currentBall.x * w;
      const by = currentBall.y * h;

      // Ball shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(bx, floorY + 4, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball gradient
      const bGrad = ctx.createRadialGradient(bx - 4, by - 4, 2, bx, by, currentBall.radius);
      bGrad.addColorStop(0, '#fdba74');
      bGrad.addColorStop(0.6, '#ea580c');
      bGrad.addColorStop(1, '#9a3412');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(bx, by, currentBall.radius, 0, Math.PI * 2);
      ctx.fill();

      // Seams
      ctx.strokeStyle = '#431407';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, currentBall.radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      ro.disconnect();
    };
  }, [level, isPaused, gameOver, gameWon]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-slate-950 select-none overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="w-full h-full flex-1 block cursor-grab active:cursor-grabbing" />

      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">LEVEL {level} / 20</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">
            🏀 BASKETS: {baskets} / {targetBaskets}
          </span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-slate-300">BALLS LEFT: {ballsLeft}</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-slate-400 text-xs bg-slate-900/70 px-4 py-1.5 rounded-full border border-slate-700/60">
        Drag back on the basketball to aim trajectory and release to shoot!
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500">OUT OF BALLS!</h2>
          <p className="text-slate-300 text-sm mt-2">Adjust your trajectory arc and bank angle.</p>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg"
          >
            Shoot Again
          </button>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400">SWISH! LEVEL CLEARED!</h2>
          <p className="text-slate-300 text-sm mt-2">Clean baskets sunk in the cyber arena.</p>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-lg"
          >
            Next Court (Level {Math.min(20, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
